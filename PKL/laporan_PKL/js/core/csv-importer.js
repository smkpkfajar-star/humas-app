/**
 * Impor massal Jurnal Harian via CSV (FR-04).
 *
 * Tahan terhadap kebiasaan nyata Excel / Google Sheets:
 *   - Pemisah ',' atau ';' (Excel berlokal Indonesia) atau Tab — dideteksi otomatis
 *   - UTF-8 (dengan/tanpa BOM) atau ANSI/Windows-1252 (Excel lama)
 *   - Sel ber-tanda kutip berisi koma, baris baru, dan "" (RFC 4180)
 *   - Judul kolom fleksibel ("Hari/Tanggal", "Hasil", "Paraf", …) atau tanpa judul
 *   - Tanggal 01/07/2026 atau 2026-07-01 → "Rabu, 01 Juli 2026"
 *
 * Fungsi parse bersifat murni (tanpa DOM) → PKL.csv.*
 * Antarmuka (tombol, dialog, status) → PKL.csvImport.init()
 */
(function (PKL) {
  'use strict';

  var COLUMNS = ['tanggal', 'kegiatan', 'kompetensi', 'output', 'validasi'];
  var MAX_BYTES = 2 * 1024 * 1024;
  var MAX_ROWS = 1000;

  /** Variasi judul kolom yang dikenali (setelah dinormalisasi: huruf kecil, tanpa simbol). */
  var ALIASES = {
    tanggal: ['tanggal', 'haritanggal', 'hari', 'tgl', 'date', 'waktu'],
    kegiatan: ['kegiatan', 'uraiankegiatan', 'aktivitas', 'kegiatanharian', 'activity', 'uraian'],
    kompetensi: ['kompetensi', 'kompetensiyangdicapai', 'materi', 'kompetensimateri'],
    output: ['output', 'hasil', 'outputhasil', 'hasilkerja', 'luaran'],
    validasi: ['validasi', 'paraf', 'ttd', 'tandatangan', 'parafinstruktur']
  };

  function normHeader(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // ------------------------------------------------------------ Dekode file

  /** ArrayBuffer → teks. Coba UTF-8 ketat dulu; gagal → Windows-1252 (Excel ANSI). */
  function decode(buffer) {
    var bytes = new Uint8Array(buffer);
    try {
      return new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes);
    } catch (err) {
      return new TextDecoder('windows-1252').decode(bytes);
    }
  }

  // ---------------------------------------------------------------- Parsing

  /** Pilih pemisah yang paling konsisten di beberapa baris pertama (di luar tanda kutip). */
  function detectDelimiter(text) {
    var candidates = [',', ';', '\t'];
    var sample = text.slice(0, 5000);
    var best = ',';
    var bestScore = -1;
    candidates.forEach(function (d) {
      var counts = [];
      var inQuote = false;
      var n = 0;
      for (var i = 0; i < sample.length && counts.length < 10; i++) {
        var ch = sample[i];
        if (ch === '"') inQuote = !inQuote;
        else if (!inQuote && ch === d) n++;
        else if (!inQuote && ch === '\n') { counts.push(n); n = 0; }
      }
      if (n) counts.push(n);
      var nonZero = counts.filter(function (c) { return c > 0; });
      if (!nonZero.length) return;
      // Skor: banyak baris yang memuat pemisah × konsistensi jumlahnya.
      var first = nonZero[0];
      var consistent = nonZero.filter(function (c) { return c === first; }).length;
      var score = nonZero.length * 10 + consistent + first / 100;
      if (score > bestScore) { bestScore = score; best = d; }
    });
    return best;
  }

  /** Parser CSV RFC 4180 → array baris (array sel). */
  function parse(text, delimiter) {
    text = String(text || '').replace(/^﻿/, '');
    var d = delimiter || detectDelimiter(text);

    // Baris "sep=;" (petunjuk Excel) di awal file.
    var sep = /^sep=(.)\r?\n/i.exec(text);
    if (sep) { d = sep[1]; text = text.slice(sep[0].length); }

    var rows = [];
    var row = [];
    var cell = '';
    var inQuote = false;

    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (inQuote) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; }
          else inQuote = false;
        } else {
          cell += ch;
        }
      } else if (ch === '"' && cell === '') {
        inQuote = true;
      } else if (ch === d) {
        row.push(cell); cell = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row);
        row = []; cell = '';
      } else {
        cell += ch;
      }
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return { rows: rows, delimiter: d };
  }

  // ---------------------------------------------------------------- Tanggal

  /**
   * "01/07/2026", "1-7-2026", "2026-07-01" → "Rabu, 01 Juli 2026".
   * Format hari-dulu (Indonesia); bila jelas format AS (bulan > 12 di posisi
   * kedua), ditukar. Teks lain dibiarkan apa adanya.
   */
  function normalizeDate(value) {
    var s = String(value || '').trim();
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
    var y, mo, da;
    if (m) {
      y = +m[1]; mo = +m[2]; da = +m[3];
    } else {
      m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(s);
      if (!m) return s;
      da = +m[1]; mo = +m[2]; y = +m[3];
      if (mo > 12 && da <= 12) { var t = da; da = mo; mo = t; }
    }
    var iso = y + '-' + (mo < 10 ? '0' : '') + mo + '-' + (da < 10 ? '0' : '') + da;
    return PKL.calc.formatDate(iso, true) || s;
  }

  // -------------------------------------------------------- Pemetaan kolom

  function headerMap(cells) {
    var map = {};
    var hits = 0;
    cells.forEach(function (c, idx) {
      var h = normHeader(c);
      COLUMNS.forEach(function (col) {
        if (map[col] === undefined && ALIASES[col].indexOf(h) !== -1) { map[col] = idx; hits++; }
      });
    });
    return hits >= 2 ? map : null;
  }

  /**
   * Tabel CSV → baris list_jurnal.
   * @returns {{ rows: Array, skipped: number, truncated: boolean, mode: 'header'|'positional', error?: string }}
   */
  function toJurnalRows(table) {
    var data = table.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ''; }); });
    if (!data.length) return { rows: [], skipped: 0, truncated: false, mode: 'header', error: 'File CSV kosong.' };

    var map = headerMap(data[0]);
    var mode = 'header';
    if (map) {
      data = data.slice(1);
      if (map.kegiatan === undefined) {
        return { rows: [], skipped: 0, truncated: false, mode: mode, error: 'Kolom "kegiatan" tidak ditemukan. Gunakan file Contoh CSV sebagai acuan.' };
      }
    } else {
      mode = 'positional';
      map = {};
      COLUMNS.forEach(function (col, i) { map[col] = i; });
    }

    var rows = [];
    var skipped = 0;
    data.forEach(function (cells) {
      var get = function (col) {
        // Alt+Enter di Excel → \r\n di dalam sel; samakan jadi \n agar rapi di Word.
        return map[col] === undefined ? '' : String(cells[map[col]] || '').replace(/\r\n?/g, '\n').trim();
      };
      var row = {
        tanggal: normalizeDate(get('tanggal')),
        kegiatan: get('kegiatan'),
        kompetensi: get('kompetensi'),
        output: get('output'),
        validasi: get('validasi') || 'Paraf'
      };
      if (!row.kegiatan && !row.tanggal) { skipped++; return; }
      rows.push(row);
    });

    var truncated = rows.length > MAX_ROWS;
    return { rows: rows.slice(0, MAX_ROWS), skipped: skipped, truncated: truncated, mode: mode };
  }

  /** CSV asli berisi teks; file biner (gambar, zip, acak) penuh karakter kendali. */
  function looksBinary(text) {
    var sample = text.slice(0, 8000);
    if (!sample.length) return false;
    if (sample.indexOf('\u0000') !== -1) return true;
    var bad = (sample.match(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F�]/g) || []).length;
    return bad / sample.length > 0.02;
  }

  /** Isi file Contoh CSV (dengan BOM agar Excel membaca UTF-8 dengan benar). */
  function template() {
    var lines = [
      COLUMNS.join(','),
      '"Senin, 01 Juli 2026","Orientasi lingkungan kerja dan pengenalan tim","Etika dan budaya kerja","Memahami alur kerja divisi","Paraf"',
      '02/07/2026,"Instalasi perangkat lunak, konfigurasi akun kerja","Konfigurasi lingkungan kerja","Laptop siap dipakai","Paraf"'
    ];
    return '﻿' + lines.join('\r\n') + '\r\n';
  }

  PKL.csv = {
    COLUMNS: COLUMNS,
    MAX_BYTES: MAX_BYTES,
    decode: decode,
    detectDelimiter: detectDelimiter,
    parse: parse,
    normalizeDate: normalizeDate,
    looksBinary: looksBinary,
    toJurnalRows: toJurnalRows,
    template: template
  };

  // =================================================================== UI

  var ICON_OK = '<svg aria-hidden="true"><use href="#i-check"/></svg>';
  var ICON_ALERT = '<svg aria-hidden="true"><use href="#i-alert"/></svg>';

  function showStatus(kind, message) {
    var el = PKL.$('[data-csv-status]');
    if (!el) return;
    el.className = 'inline-status' + (kind === 'ok' ? '' : ' inline-status--' + kind);
    el.innerHTML = (kind === 'ok' ? ICON_OK : ICON_ALERT) + '<span></span>';
    el.lastChild.textContent = message;
    el.hidden = false;
  }

  function existingRows() {
    return PKL.repeater.getRows('list_jurnal').filter(function (r) {
      return PKL.state.isFilled('list_jurnal', [r]);
    });
  }

  function handleFile(file) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      showStatus('error', 'File terlalu besar (maks. 2 MB). Pastikan yang dipilih adalah file CSV jurnal.');
      return;
    }
    if (/\.xlsx?$/i.test(file.name)) {
      showStatus('error', 'Ini file Excel (.xlsx). Simpan dulu sebagai CSV: File → Save As → "CSV UTF-8 (Comma delimited)".');
      return;
    }

    file.arrayBuffer().then(function (buf) {
      var text = decode(buf);
      if (looksBinary(text)) {
        showStatus('error', 'File ini bukan CSV teks (isinya biner/acak). Simpan ulang dari Excel atau Google Sheets sebagai CSV.');
        return;
      }
      var parsed = parse(text);
      var res = toJurnalRows(parsed.rows);
      if (res.error) { showStatus('error', res.error); return; }
      if (!res.rows.length) { showStatus('error', 'Tidak ada baris jurnal yang bisa diimpor dari file ini.'); return; }

      var current = existingRows();
      var ask = current.length
        ? PKL.dialog.choose({
            title: 'Impor ' + res.rows.length + ' baris jurnal',
            message: 'Jurnal Harian sudah berisi ' + current.length + ' baris.\nTambahkan baris dari CSV di akhir, atau ganti seluruh jurnal dengan isi CSV?',
            choices: [
              { label: 'Ganti Semua', value: 'replace', variant: 'secondary' },
              { label: 'Tambahkan di Akhir', value: 'append', variant: 'primary' }
            ]
          })
        : Promise.resolve('replace');

      return ask.then(function (mode) {
        if (!mode) return;
        var rows = mode === 'append' ? current.concat(res.rows) : res.rows;
        PKL.repeater.setRows('list_jurnal', rows.slice(0, MAX_ROWS));

        var parts = [res.rows.length + ' baris jurnal berhasil diimpor' + (mode === 'append' ? ' (ditambahkan di akhir)' : '') + '.'];
        if (res.skipped) parts.push(res.skipped + ' baris tanpa kegiatan & tanggal dilewati.');
        if (res.truncated) parts.push('Hanya ' + MAX_ROWS + ' baris pertama yang diambil.');
        if (res.mode === 'positional') parts.push('Judul kolom tidak dikenali — kolom dibaca berurutan: ' + COLUMNS.join(', ') + '.');
        showStatus(res.mode === 'positional' || res.truncated ? 'warn' : 'ok', parts.join(' '));
      });
    }).catch(function () {
      showStatus('error', 'File tidak dapat dibaca. Pastikan memilih file .csv.');
    });
  }

  PKL.csvImport = {
    init: function () {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,text/csv';
      input.hidden = true;
      document.body.appendChild(input);
      input.addEventListener('change', function () { handleFile(input.files[0]); });

      document.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action="csv-template"], [data-action="csv-import"]');
        if (!btn) return;
        if (btn.getAttribute('data-action') === 'csv-template') {
          PKL.download('Contoh_Jurnal_Harian_PKL.csv', template(), 'text/csv;charset=utf-8');
        } else {
          input.value = '';
          input.click();
        }
      });
    },
    handleFile: handleFile
  };
})(window.PKL);

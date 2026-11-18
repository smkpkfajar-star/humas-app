/**
 * Isi otomatis baris tabel dari tanggal PKL (Langkah 4 · Bab III.A):
 *   - Jurnal Harian   : satu baris per hari kerja ("Rabu, 01 Juli 2026"), kegiatan dikosongkan
 *   - Presensi Bulanan: satu baris per bulan, Hadir = jumlah hari kerja di bulan itu
 *
 * Hari kerja dibaca dari isian "Hari Kerja" (mis. "Senin s.d. Sabtu"); bawaan Senin–Jumat.
 * Jurnal  : SEMUA hari dibuatkan baris (DUDI bisa saja meminta masuk saat libur), lalu
 *            js/wizard/holiday-mark.js mewarnai: MERAH = tanggal merah / cuti bersama
 *            ("hari_libur" di pengaturan.js), KUNING = di luar Hari Kerja (Sabtu/Minggu).
 *            Siswa menghapus baris libur sendiri atau mengisinya bila tetap masuk.
 * Presensi: Hadir = jumlah hari di jurnal yang kegiatannya terisi (cadangan: hari kerja
 *            tanpa tanggal merah bila jurnal masih kosong).
 * Baris yang sudah diisi siswa TIDAK pernah diubah atau dihapus — hanya tanggal/bulan
 * yang belum ada yang ditambahkan, lalu diurutkan menurut tanggal.
 */
(function (PKL) {
  'use strict';

  var ICON_OK = '<svg aria-hidden="true"><use href="#i-check"/></svg>';
  var ICON_ALERT = '<svg aria-hidden="true"><use href="#i-alert"/></svg>';
  var MAX_MONTHS = 6;

  function showStatus(sel, kind, message) {
    if (kind === 'ok' && /ditambahkan/.test(message)) PKL.toast(message.split(' — ')[0].split('. ')[0] + '.', { title: 'Baris otomatis dibuat' });
    var el = PKL.$(sel);
    if (!el) return;
    el.className = 'inline-status' + (kind === 'ok' ? '' : ' inline-status--' + kind);
    el.innerHTML = (kind === 'ok' ? ICON_OK : ICON_ALERT) + '<span></span>';
    el.lastChild.textContent = message;
    el.hidden = false;
  }

  function trim(v) { return String(v === undefined || v === null ? '' : v).trim(); }

  /** Cek tanggal PKL; kembalikan pesan kesalahan atau null. */
  function periodProblem() {
    var start = PKL.state.get('tgl_mulai');
    var end = PKL.state.get('tgl_selesai');
    if (!start || !end) return 'Isi dulu Tanggal Mulai dan Tanggal Selesai PKL di Langkah 4 (Bab III · A. Waktu dan Tempat Pelaksanaan).';
    var res = PKL.calc.duration(start, end);
    if (!res) return 'Tanggal Mulai/Selesai PKL di Langkah 4 (Bab III.A) belum benar.';
    if (res.error) return res.error + ' (Langkah 4 · Bab III.A).';
    return null;
  }

  function days() { return PKL.calc.workdays(PKL.state.get('hari_kerja')); }

  function holidays() { return (PKL.master && PKL.master.hariLibur) || {}; }

  /** "17 Agustus 2026 (Proklamasi Kemerdekaan), …" — paling banyak `max` disebut. */
  function describeHolidays(list, max) {
    var names = list.slice(0, max).map(function (h) { return PKL.calc.formatDate(h.iso) + ' (' + h.keterangan + ')'; });
    if (list.length > max) names.push('dan ' + (list.length - max) + ' lainnya');
    return names.join(', ');
  }

  // ------------------------------------------------------------- Jurnal

  function rowIso(r) {
    var t = trim(r.tanggal);
    return PKL.calc.parseIndoDate(t) || PKL.calc.parseIndoDate(PKL.csv.normalizeDate(t));
  }

  function jurnalHasContent(r) {
    return !!(trim(r.tanggal) || trim(r.kegiatan));
  }

  function fillJurnal() {
    var sel = '[data-csv-status]';
    var problem = periodProblem();
    if (problem) { showStatus(sel, 'warn', problem); return Promise.resolve(); }

    var wd = days();
    var hol = holidays();
    var start = PKL.state.get('tgl_mulai');
    var end = PKL.state.get('tgl_selesai');
    var ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
    var dates = PKL.calc.workingDates(start, end, ALL_DAYS);
    var existing = PKL.repeater.getRows('list_jurnal').filter(jurnalHasContent);
    var have = {};
    existing.forEach(function (r) { var iso = rowIso(r); if (iso) have[iso] = true; });
    var missing = dates.filter(function (iso) { return !have[iso]; });
    var dayText = PKL.calc.describeDays(wd);

    if (!dates.length) {
      showStatus(sel, 'warn', 'Tidak ada tanggal di antara tanggal mulai dan selesai PKL.');
      return Promise.resolve();
    }
    if (!missing.length) {
      showStatus(sel, 'ok', 'Semua ' + dates.length + ' tanggal PKL sudah ada di jurnal.');
      return Promise.resolve();
    }

    var ask = existing.length
      ? PKL.dialog.choose({
          title: 'Tambah ' + missing.length + ' tanggal',
          message: 'Jurnal sudah berisi ' + existing.length + ' baris. Baris itu tidak diubah.\n' +
                   'Tanggal PKL yang belum ada (termasuk Sabtu, Minggu & tanggal merah) akan ditambahkan, lalu jurnal diurutkan menurut tanggal.',
          choices: [{ label: 'Tambahkan Tanggal', value: 'merge', variant: 'primary' }]
        })
      : Promise.resolve('merge');

    return ask.then(function (mode) {
      if (!mode) return;
      // Kunci urut: tanggal baris; baris bertanggal tak terbaca ikut baris di atasnya.
      var items = [];
      var lastKey = '';
      existing.forEach(function (r, i) {
        var iso = rowIso(r);
        if (iso) lastKey = iso;
        items.push({ key: lastKey, order: i, row: r });
      });
      missing.forEach(function (iso, i) {
        items.push({
          key: iso, order: 100000 + i,
          row: { tanggal: PKL.calc.formatDate(iso, true), kegiatan: '' }
        });
      });
      items.sort(function (a, b) { return a.key < b.key ? -1 : a.key > b.key ? 1 : a.order - b.order; });
      PKL.repeater.setRows('list_jurnal', items.map(function (it) { return it.row; }));

      var marks = PKL.holidayMark ? PKL.holidayMark.markAll() : { merah: 0, kuning: 0 };
      var redRows = PKL.calc.holidaysOnWorkdays(start, end, ALL_DAYS, hol);
      var msg = missing.length + ' tanggal ditambahkan — total ' + items.length + ' baris. Tinggal isi kegiatannya.';
      if (marks.kuning) msg += ' ' + marks.kuning + ' baris di luar hari kerja (' + dayText + ') ditandai KUNING.';
      if (marks.merah) msg += ' ' + marks.merah + ' baris tanggal merah/cuti bersama ditandai MERAH: ' + describeHolidays(redRows, 4) + '.';
      if (marks.kuning || marks.merah) msg += ' Bila libur, biarkan kosong — baris kuning/merah yang kosong otomatis tidak dicetak. Bila DUDI meminta masuk, isi kegiatannya.';
      showStatus(sel, 'ok', msg);
    });
  }

  // ----------------------------------------------------------- Presensi

  /**
   * Hari hadir per bulan menurut jurnal: tanggal unik yang kegiatannya terisi.
   * Termasuk Sabtu/Minggu/tanggal merah yang diisi (diminta masuk oleh DUDI).
   * @returns {{ perMonth: Object<string, number>, total: number, outside: number }}
   */
  function jurnalAttendance(start, end) {
    var seen = {};
    var perMonth = {};
    var total = 0;
    var outside = 0;
    PKL.repeater.getRows('list_jurnal').forEach(function (r) {
      if (!trim(r.kegiatan)) return;
      var iso = rowIso(r);
      if (!iso || seen[iso]) return;
      seen[iso] = true;
      if (iso < start || iso > end) { outside++; return; }
      var label = PKL.calc.formatDate(iso).replace(/^\d+ /, '');   // "01 Juli 2026" → "Juli 2026"
      perMonth[label] = (perMonth[label] || 0) + 1;
      total++;
    });
    return { perMonth: perMonth, total: total, outside: outside };
  }

  /**
   * Presensi bulanan. Hadir dihitung dari JURNAL (hari yang kegiatannya terisi).
   * Bila jurnal belum diisi sama sekali, sementara memakai jumlah hari kerja
   * (tanpa tanggal merah). Bulan yang sudah ada: hanya Hadir yang diperbarui;
   * Izin/Sakit/Alpa yang diisi siswa tidak diubah.
   */
  function fillPresensi() {
    var sel = '[data-presensi-status]';
    var problem = periodProblem();
    if (problem) { showStatus(sel, 'warn', problem); return Promise.resolve(); }

    var start = PKL.state.get('tgl_mulai');
    var end = PKL.state.get('tgl_selesai');
    var wd = days();
    // Semua bulan dalam periode PKL (urut), lalu jumlah hari kerja per bulan sebagai cadangan.
    var months = PKL.calc.workdaysPerMonth(start, end, [0, 1, 2, 3, 4, 5, 6]);
    var fallback = {};
    PKL.calc.workdaysPerMonth(start, end, wd, holidays()).forEach(function (m) { fallback[m.bulan] = m.hari; });
    var cut = months.length > MAX_MONTHS;
    months = months.slice(0, MAX_MONTHS);

    var jur = jurnalAttendance(start, end);
    var fromJurnal = jur.total > 0;
    months.forEach(function (m) { m.hadir = fromJurnal ? (jur.perMonth[m.bulan] || 0) : (fallback[m.bulan] || 0); });

    var existing = PKL.repeater.getRows('list_presensi_bulanan').filter(function (r) { return trim(r.bulan); });
    var byLabel = {};
    months.forEach(function (m) { byLabel[m.bulan.toLowerCase()] = m; });
    var have = {};
    existing.forEach(function (r) { have[trim(r.bulan).toLowerCase()] = true; });
    var missing = months.filter(function (m) { return !have[m.bulan.toLowerCase()]; });
    var changed = existing.filter(function (r) {
      var m = byLabel[trim(r.bulan).toLowerCase()];
      return m && String(m.hadir) !== trim(r.hadir);
    });

    if (!missing.length && !changed.length) {
      showStatus(sel, 'ok', fromJurnal
        ? 'Presensi sudah sesuai jurnal (' + jur.total + ' hari hadir).'
        : 'Semua bulan PKL sudah ada di tabel presensi.');
      return Promise.resolve();
    }

    var ask = existing.length
      ? PKL.dialog.choose({
          title: fromJurnal ? 'Hitung ulang Hadir dari jurnal' : 'Lengkapi tabel presensi',
          message: (changed.length
              ? 'Kolom Hadir ' + changed.length + ' bulan akan diganti dengan ' + (fromJurnal ? 'jumlah hari di jurnal yang kegiatannya terisi' : 'jumlah hari kerja') + '.\n'
              : '') +
            (missing.length ? 'Bulan yang belum ada (' + missing.map(function (m) { return m.bulan; }).join(', ') + ') akan ditambahkan.\n' : '') +
            'Izin, Sakit, dan Alpa yang sudah kamu isi tidak diubah.',
          choices: [{ label: fromJurnal ? 'Hitung dari Jurnal' : 'Perbarui Presensi', value: 'merge', variant: 'primary' }]
        })
      : Promise.resolve('merge');

    return ask.then(function (mode) {
      if (!mode) return;
      var order = months.map(function (m) { return m.bulan.toLowerCase(); });
      var rank = function (r) {
        var i = order.indexOf(trim(r.bulan).toLowerCase());
        return i === -1 ? 99 : i;
      };
      var rows = existing.map(function (r) {
        var m = byLabel[trim(r.bulan).toLowerCase()];
        if (!m) return r;   // bulan di luar periode PKL: biarkan
        var copy = {};
        for (var k in r) if (Object.prototype.hasOwnProperty.call(r, k)) copy[k] = r[k];
        copy.hadir = String(m.hadir);
        return copy;
      }).concat(missing.map(function (m) {
        return { bulan: m.bulan, hadir: String(m.hadir), izin: '0', sakit: '0', alpha: '0' };
      }));
      rows = rows.map(function (r, i) { return { r: r, i: i }; })
        .sort(function (a, b) { return rank(a.r) - rank(b.r) || a.i - b.i; })
        .map(function (x) { return x.r; });
      var dropped = Math.max(0, rows.length - MAX_MONTHS);
      PKL.repeater.setRows('list_presensi_bulanan', rows.slice(0, MAX_MONTHS));

      var detail = months.map(function (m) { return m.bulan.split(' ')[0] + ' ' + m.hadir; }).join(', ');
      var msg;
      if (fromJurnal) {
        msg = 'Hadir dihitung dari jurnal yang kegiatannya terisi: ' + detail + ' (total ' + jur.total + ' hari, termasuk Sabtu/Minggu/tanggal merah yang diisi).' +
          ' Isi Izin/Sakit/Alpa sesuai kenyataan.';
        if (jur.outside) msg += ' ' + jur.outside + ' baris jurnal di luar tanggal PKL tidak dihitung.';
        msg += ' Klik lagi setiap kali jurnal berubah.';
      } else {
        msg = 'Jurnal belum diisi, jadi Hadir sementara memakai jumlah hari kerja (' + PKL.calc.describeDays(wd) +
          ', tanpa tanggal merah): ' + detail + '. Setelah jurnal diisi, klik tombol ini lagi agar Hadir dihitung dari jurnal.';
      }
      if (cut || dropped) msg += ' Tabel maksimal ' + MAX_MONTHS + ' bulan, sisanya tidak dimasukkan.';
      showStatus(sel, cut || dropped || !fromJurnal ? 'warn' : 'ok', msg);
    });
  }

  PKL.autoRows = {
    init: function () {
      document.addEventListener('click', function (e) {
        if (e.target.closest('[data-action="jurnal-auto"]')) fillJurnal();
        if (e.target.closest('[data-action="presensi-auto"]')) fillPresensi();
      });
    },
    fillJurnal: fillJurnal,
    fillPresensi: fillPresensi
  };
})(window.PKL);

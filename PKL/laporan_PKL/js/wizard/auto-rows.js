/**
 * Isi otomatis baris tabel dari tanggal PKL (Langkah 3):
 *   - Jurnal Harian   : satu baris per hari kerja ("Rabu, 01 Juli 2026"), kegiatan dikosongkan
 *   - Presensi Bulanan: satu baris per bulan, Hadir = jumlah hari kerja di bulan itu
 *
 * Hari kerja dibaca dari isian "Hari Kerja" (mis. "Senin s.d. Sabtu"); bawaan Senin–Jumat.
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
    if (!start || !end) return 'Isi dulu Tanggal Mulai dan Tanggal Selesai PKL di Langkah 3 (Bab I · Jadwal Pelaksanaan).';
    var res = PKL.calc.duration(start, end);
    if (!res) return 'Tanggal Mulai/Selesai PKL di Langkah 3 belum benar.';
    if (res.error) return res.error + ' (Langkah 3).';
    return null;
  }

  function days() { return PKL.calc.workdays(PKL.state.get('hari_kerja')); }

  // ------------------------------------------------------------- Jurnal

  function rowIso(r) {
    var t = trim(r.tanggal);
    return PKL.calc.parseIndoDate(t) || PKL.calc.parseIndoDate(PKL.csv.normalizeDate(t));
  }

  function jurnalHasContent(r) {
    return !!(trim(r.tanggal) || trim(r.kegiatan) || trim(r.kompetensi) || trim(r.output));
  }

  function fillJurnal() {
    var sel = '[data-csv-status]';
    var problem = periodProblem();
    if (problem) { showStatus(sel, 'warn', problem); return Promise.resolve(); }

    var wd = days();
    var dates = PKL.calc.workingDates(PKL.state.get('tgl_mulai'), PKL.state.get('tgl_selesai'), wd);
    var existing = PKL.repeater.getRows('list_jurnal').filter(jurnalHasContent);
    var have = {};
    existing.forEach(function (r) { var iso = rowIso(r); if (iso) have[iso] = true; });
    var missing = dates.filter(function (iso) { return !have[iso]; });
    var dayText = PKL.calc.describeDays(wd);

    if (!dates.length) {
      showStatus(sel, 'warn', 'Tidak ada hari kerja (' + dayText + ') di antara tanggal mulai dan selesai PKL.');
      return Promise.resolve();
    }
    if (!missing.length) {
      showStatus(sel, 'ok', 'Semua ' + dates.length + ' tanggal hari kerja (' + dayText + ') sudah ada di jurnal.');
      return Promise.resolve();
    }

    var ask = existing.length
      ? PKL.dialog.choose({
          title: 'Tambah ' + missing.length + ' tanggal hari kerja',
          message: 'Jurnal sudah berisi ' + existing.length + ' baris. Baris itu tidak diubah.\n' +
                   'Tanggal hari kerja (' + dayText + ') yang belum ada akan ditambahkan, lalu jurnal diurutkan menurut tanggal.',
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
          row: { tanggal: PKL.calc.formatDate(iso, true), kegiatan: '', kompetensi: '', output: '', validasi: 'Paraf' }
        });
      });
      items.sort(function (a, b) { return a.key < b.key ? -1 : a.key > b.key ? 1 : a.order - b.order; });
      PKL.repeater.setRows('list_jurnal', items.map(function (it) { return it.row; }));

      showStatus(sel, 'ok', missing.length + ' tanggal hari kerja (' + dayText + ') ditambahkan — total ' + items.length +
        ' baris. Tinggal isi kegiatannya. Hapus baris yang jatuh pada hari libur / tanggal merah.');
    });
  }

  // ----------------------------------------------------------- Presensi

  function fillPresensi() {
    var sel = '[data-presensi-status]';
    var problem = periodProblem();
    if (problem) { showStatus(sel, 'warn', problem); return Promise.resolve(); }

    var wd = days();
    var months = PKL.calc.workdaysPerMonth(PKL.state.get('tgl_mulai'), PKL.state.get('tgl_selesai'), wd);
    if (!months.length) {
      showStatus(sel, 'warn', 'Tidak ada hari kerja di antara tanggal mulai dan selesai PKL.');
      return Promise.resolve();
    }
    var cut = months.length > MAX_MONTHS;
    months = months.slice(0, MAX_MONTHS);

    var existing = PKL.repeater.getRows('list_presensi_bulanan').filter(function (r) { return trim(r.bulan); });
    var have = {};
    existing.forEach(function (r) { have[trim(r.bulan).toLowerCase()] = true; });
    var missing = months.filter(function (m) { return !have[m.bulan.toLowerCase()]; });

    if (!missing.length) {
      showStatus(sel, 'ok', 'Semua bulan PKL sudah ada di tabel presensi.');
      return Promise.resolve();
    }

    var ask = existing.length
      ? PKL.dialog.choose({
          title: 'Tambah ' + missing.length + ' bulan presensi',
          message: 'Tabel presensi sudah berisi ' + existing.length + ' bulan. Isinya tidak diubah.\n' +
                   'Bulan yang belum ada (' + missing.map(function (m) { return m.bulan; }).join(', ') + ') akan ditambahkan.',
          choices: [{ label: 'Tambahkan Bulan', value: 'merge', variant: 'primary' }]
        })
      : Promise.resolve('merge');

    return ask.then(function (mode) {
      if (!mode) return;
      var order = months.map(function (m) { return m.bulan.toLowerCase(); });
      var rank = function (r) {
        var i = order.indexOf(trim(r.bulan).toLowerCase());
        return i === -1 ? 99 : i;
      };
      var rows = existing.concat(missing.map(function (m) {
        return { bulan: m.bulan, hadir: String(m.hari), izin: '0', sakit: '0', alpha: '0' };
      }));
      rows = rows.map(function (r, i) { return { r: r, i: i }; })
        .sort(function (a, b) { return rank(a.r) - rank(b.r) || a.i - b.i; })
        .map(function (x) { return x.r; });
      var dropped = Math.max(0, rows.length - MAX_MONTHS);
      PKL.repeater.setRows('list_presensi_bulanan', rows.slice(0, MAX_MONTHS));

      var msg = missing.length + ' bulan ditambahkan. Kolom Hadir diisi jumlah hari kerja (' + PKL.calc.describeDays(wd) +
        ') — kurangi Hadir lalu isi Izin/Sakit/Alpa sesuai kenyataan.';
      if (cut || dropped) msg += ' Tabel maksimal ' + MAX_MONTHS + ' bulan, sisanya tidak dimasukkan.';
      showStatus(sel, cut || dropped ? 'warn' : 'ok', msg);
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

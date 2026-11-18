/**
 * Kalkulasi murni (tanpa DOM) — FR-03 & FR-05.
 * Semua fungsi deterministik agar mudah diuji.
 */
(function (PKL) {
  'use strict';

  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
               'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  /** "2026-07-01" → Date (tengah hari lokal, kebal pergeseran zona waktu/DST). */
  function parseISO(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3], 12);
    return d.getMonth() === +m[2] - 1 ? d : null; // tolak tanggal mustahil (31 Feb)
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /** "2026-07-01" → "01 Juli 2026"; withDay → "Rabu, 01 Juli 2026". */
  function formatDate(iso, withDay) {
    var d = parseISO(iso);
    if (!d) return '';
    var s = pad2(d.getDate()) + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
    return withDay ? HARI[d.getDay()] + ', ' + s : s;
  }

  function daysBetween(a, b) {
    return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
                       Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
  }

  /**
   * Durasi PKL inklusif.
   *   01 Jul – 31 Okt 2026 → { months: 4, days: 0, totalDays: 123, text: "4 Bulan (123 Hari)" }
   *   01 Jul – 15 Agu 2026 → "1 Bulan 15 Hari (46 Hari)"
   * Mengembalikan { error } bila tanggal tidak valid / terbalik.
   */
  function duration(startISO, endISO) {
    var start = parseISO(startISO);
    var end = parseISO(endISO);
    if (!start || !end) return null;
    if (end < start) return { error: 'Tanggal selesai lebih awal dari tanggal mulai' };
    if (start.getFullYear() < 2000 || end.getFullYear() > 2099) {
      return { error: 'Tahun tidak wajar — periksa kembali tanggal mulai dan selesai' };
    }

    var totalDays = daysBetween(start, end) + 1;
    if (totalDays > 366) return { error: 'Lama PKL lebih dari 1 tahun — periksa kembali tanggalnya' };
    // Hitung bulan penuh dari tanggal mulai sampai sehari setelah tanggal selesai.
    var endExclusive = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1, 12);
    var months = (endExclusive.getFullYear() - start.getFullYear()) * 12 +
                 (endExclusive.getMonth() - start.getMonth());
    var anchor = addMonths(start, months);
    if (anchor > endExclusive) { months -= 1; anchor = addMonths(start, months); }
    var days = daysBetween(anchor, endExclusive);

    var parts = [];
    if (months > 0) parts.push(months + ' Bulan');
    if (days > 0) parts.push(days + ' Hari');
    var text = months > 0
      ? parts.join(' ') + ' (' + totalDays + ' Hari)'
      : totalDays + ' Hari';

    return { months: months, days: days, totalDays: totalDays, text: text };
  }

  /**
   * Batas "n bulan penuh" sejak `date`.
   * Bila tanggalnya tidak ada di bulan tujuan (31 Jan + 1 bulan), bulan baru
   * dianggap penuh pada tanggal 1 bulan berikutnya (1 Mar) — sehingga
   * 31 Jan–27 Feb = 28 Hari, sedangkan 31 Jan–28 Feb = 1 Bulan.
   */
  function addMonths(date, n) {
    var target = new Date(date.getFullYear(), date.getMonth() + n, 1, 12);
    var lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    if (date.getDate() > lastDay) {
      return new Date(target.getFullYear(), target.getMonth() + 1, 1, 12);
    }
    target.setDate(date.getDate());
    return target;
  }

  /** Jumlah hari dalam sebulan: bilangan bulat 0–31 (angka lain dipotong ke batas). */
  var MAX_DAYS_PER_MONTH = 31;
  function toDays(v) {
    var s = String(v === undefined || v === null ? '' : v).trim();
    if (!/^-?\d+([.,]\d+)?$/.test(s)) return 0;            // "1e3", "dua puluh" → 0
    var n = Math.floor(parseFloat(s.replace(',', '.')));
    return Math.max(0, Math.min(MAX_DAYS_PER_MONTH, n));
  }

  /**
   * Rekap presensi (FR-05):
   * persentase = round(hadir / (hadir+izin+sakit+alpha) × 100, 1); 0 bila total 0.
   * Hanya baris yang nama bulannya terisi yang dihitung (sama seperti di dokumen).
   */
  function attendance(rows) {
    var t = { total_hadir: 0, total_izin: 0, total_sakit: 0, total_alpha: 0 };
    (rows || []).filter(function (r) { return r && String(r.bulan || '').trim() !== ''; }).forEach(function (r) {
      t.total_hadir += toDays(r.hadir);
      t.total_izin += toDays(r.izin);
      t.total_sakit += toDays(r.sakit);
      t.total_alpha += toDays(r.alpha);
    });
    var all = t.total_hadir + t.total_izin + t.total_sakit + t.total_alpha;
    // Satu desimal (97.7), tetapi angka bulat tanpa ".0" (100, bukan 100.0).
    t.persentase_kehadiran = all ? String(Math.round((t.total_hadir / all) * 1000) / 10) : '0';
    return t;
  }

  /** Tambahkan properti `no` (1, 2, 3, …) — dipakai sebelum render dokumen. */
  function numberRows(rows) {
    return (rows || []).map(function (r, i) {
      var copy = {};
      for (var k in r) if (Object.prototype.hasOwnProperty.call(r, k)) copy[k] = r[k];
      copy.no = i + 1;
      return copy;
    });
  }

  /**
   * "Bima Cahya", "XII RPL 1" → "Laporan_PKL_Bima_Cahya_XII_RPL_1.docx"
   * Aman untuk semua sistem: hanya huruf (termasuk berharakat), angka, - . ( ),
   * tiap bagian maks. 60 karakter. Nama file yang terlalu panjang membuat
   * browser membatalkan unduhan TANPA pesan, jadi batas ini wajib.
   */
  function safeNamePart(s, max) {
    return String(s || '')
      .normalize('NFC')
      .replace(/[^\p{L}\p{N}\-.() ]+/gu, ' ')   // buang simbol, emoji, karakter kendali
      .trim()
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .slice(0, max)
      .replace(/^[_.\-]+|[_.\-]+$/g, '');       // tanpa titik/garis di awal-akhir
  }

  function fileName(nama, kelas) {
    return 'Laporan_PKL_' + (safeNamePart(nama, 60) || 'Nama') + '_' + (safeNamePart(kelas, 30) || 'Kelas') + '.docx';
  }

  /** Tahun ajaran default dari tanggal: Juli–Desember 2026 → "2026/2027". */
  function schoolYear(date) {
    var d = date || new Date();
    var y = d.getFullYear();
    return d.getMonth() >= 6 ? y + '/' + (y + 1) : (y - 1) + '/' + y;
  }

  // ------------------------------------------------------------- Hari kerja

  var DAY_ALIASES = { minggu: 0, ahad: 0, senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6 };
  var DEFAULT_WORKDAYS = [1, 2, 3, 4, 5];

  /**
   * Teks "Hari Kerja" → nomor hari (0 = Minggu … 6 = Sabtu).
   *   "Senin s.d. Jumat" / "Senin - Sabtu" / "Senin sampai Sabtu" → rentang
   *   "Senin, Rabu, Jumat" → hari yang disebut saja
   *   kosong / tidak dikenali → Senin–Jumat
   */
  function workdays(text) {
    var s = String(text || '').toLowerCase().replace(/['’`]/g, '');
    var found = [];
    var re = /minggu|ahad|senin|selasa|rabu|kamis|jumat|sabtu/g;
    var m;
    while ((m = re.exec(s))) found.push(DAY_ALIASES[m[0]]);
    if (!found.length) return DEFAULT_WORKDAYS.slice();
    if (found.length === 2 && /s\.?\s*d|sampai|hingga|[-–—]/.test(s)) {
      var out = [];
      for (var d = found[0]; ; d = (d + 1) % 7) {
        out.push(d);
        if (d === found[1] || out.length === 7) break;
      }
      return out.sort();
    }
    return found.filter(function (d, i) { return found.indexOf(d) === i; }).sort();
  }

  function toISO(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  /** Tiap tanggal (ISO) dari mulai s.d. selesai yang harinya termasuk `days`. */
  function eachWorkday(startISO, endISO, days, fn) {
    var res = duration(startISO, endISO);
    if (!res || res.error) return;
    days = days || DEFAULT_WORKDAYS;
    var d = parseISO(startISO);
    for (var i = 0; i < res.totalDays; i++) {
      if (days.indexOf(d.getDay()) !== -1) fn(toISO(d));
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12);
    }
  }

  /**
   * Semua tanggal hari kerja (ISO) dari mulai s.d. selesai; [] bila tanggal tidak valid.
   * `holidays` = { "2026-08-17": "Proklamasi Kemerdekaan", … } → tanggal itu dilewati.
   */
  function workingDates(startISO, endISO, days, holidays) {
    var out = [];
    eachWorkday(startISO, endISO, days, function (iso) {
      if (!(holidays && Object.prototype.hasOwnProperty.call(holidays, iso))) out.push(iso);
    });
    return out;
  }

  /** Tanggal merah yang jatuh pada hari kerja: [{ iso, keterangan }, …] berurutan. */
  function holidaysOnWorkdays(startISO, endISO, days, holidays) {
    var out = [];
    if (!holidays) return out;
    eachWorkday(startISO, endISO, days, function (iso) {
      if (Object.prototype.hasOwnProperty.call(holidays, iso)) out.push({ iso: iso, keterangan: holidays[iso] });
    });
    return out;
  }

  /** Hari kerja per bulan: [{ bulan: "Juli 2026", hari: 23 }, …] berurutan (tanpa tanggal merah). */
  function workdaysPerMonth(startISO, endISO, days, holidays) {
    var out = [];
    workingDates(startISO, endISO, days, holidays).forEach(function (iso) {
      var d = parseISO(iso);
      var label = BULAN[d.getMonth()] + ' ' + d.getFullYear();
      var last = out[out.length - 1];
      if (last && last.bulan === label) last.hari += 1;
      else out.push({ bulan: label, hari: 1 });
    });
    return out;
  }

  /** "Rabu, 01 Juli 2026" / "01 Juli 2026" → "2026-07-01"; teks lain → ''. */
  function parseIndoDate(text) {
    var m = /(\d{1,2})\s+([a-z]+)\s+(\d{4})/i.exec(String(text || ''));
    if (!m) return '';
    var mi = -1;
    BULAN.forEach(function (b, i) { if (b.toLowerCase() === m[2].toLowerCase()) mi = i; });
    if (mi === -1) return '';
    var iso = m[3] + '-' + pad2(mi + 1) + '-' + pad2(+m[1]);
    return parseISO(iso) ? iso : '';
  }

  /** Nomor hari → "Senin–Jumat" / "Senin, Rabu" (untuk pesan ke siswa). */
  function describeDays(days) {
    var contiguous = days.every(function (d, i) { return i === 0 || d === days[i - 1] + 1; });
    if (contiguous && days.length > 2) return HARI[days[0]] + '–' + HARI[days[days.length - 1]];
    return days.map(function (d) { return HARI[d]; }).join(', ');
  }

  PKL.calc = {
    workdays: workdays,
    workingDates: workingDates,
    holidaysOnWorkdays: holidaysOnWorkdays,
    workdaysPerMonth: workdaysPerMonth,
    parseIndoDate: parseIndoDate,
    describeDays: describeDays,
    parseISO: parseISO,
    formatDate: formatDate,
    duration: duration,
    toDays: toDays,
    attendance: attendance,
    numberRows: numberRows,
    fileName: fileName,
    safeNamePart: safeNamePart,
    schoolYear: schoolYear
  };
})(window.PKL);

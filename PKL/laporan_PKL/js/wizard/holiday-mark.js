/**
 * Penanda hari libur di Jurnal Harian (Langkah 6).
 *
 * Baris jurnal TIDAK dihapus — bisa saja DUDI meminta siswa tetap masuk;
 * siswa sendiri yang memutuskan mengisi atau menghapus barisnya. Warnanya:
 *   MERAH  = tanggal merah nasional / cuti bersama ("hari_libur" di pengaturan.js)
 *   KUNING = hari di luar "Hari Kerja" (bawaan Senin–Jumat → Sabtu & Minggu)
 * Merah didahulukan bila keduanya berlaku (mis. libur nasional jatuh hari Sabtu).
 *
 * Berlaku untuk semua sumber baris: tombol otomatis, impor CSV, ketik manual.
 * Warna hanya tampil di form. Saat laporan dibuat, baris kuning/merah yang
 * kegiatannya kosong otomatis dilewati (docx-generator.js memakai classify()).
 */
(function (PKL) {
  'use strict';

  var LIST = 'list_jurnal';
  var CLASSES = { merah: 'repeater__row--libur', kuning: 'repeater__row--akhir-pekan' };
  var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var SARAN = ' — bila libur, biarkan kosong (otomatis tidak dicetak) atau hapus; bila DUDI meminta masuk, isi kegiatannya.';

  function holidays() { return (PKL.master && PKL.master.hariLibur) || {}; }
  function workdays() { return PKL.calc.workdays(PKL.state.get('hari_kerja')); }

  /** Teks tanggal di baris → ISO ("Senin, 17 Agustus 2026", "17/08/2026", …). */
  function toIso(text) {
    var t = String(text || '').trim();
    if (!t) return '';
    return PKL.calc.parseIndoDate(t) || (PKL.csv ? PKL.calc.parseIndoDate(PKL.csv.normalizeDate(t)) : '');
  }

  /**
   * ISO → { warna: 'merah'|'kuning', label, keterangan } atau null (hari kerja biasa).
   * `days` opsional (nomor hari kerja); bawaan dibaca dari isian "Hari Kerja".
   */
  function classify(iso, days) {
    if (!iso) return null;
    var hol = holidays();
    if (Object.prototype.hasOwnProperty.call(hol, iso)) {
      var cuti = /^cuti bersama\s*/i;
      return cuti.test(hol[iso])
        ? { warna: 'merah', label: 'Cuti Bersama', keterangan: hol[iso].replace(cuti, '') || hol[iso] }
        : { warna: 'merah', label: 'Tanggal Merah', keterangan: hol[iso] };
    }
    var d = PKL.calc.parseISO(iso);
    if (!d) return null;
    var day = d.getDay();
    if ((days || workdays()).indexOf(day) !== -1) return null;
    return {
      warna: 'kuning',
      label: day === 0 || day === 6 ? 'Libur Akhir Pekan' : 'Bukan Hari Kerja',
      keterangan: 'Hari ' + HARI[day]
    };
  }

  function markRow(row, days) {
    var input = PKL.$('[data-field="tanggal"]', row);
    var info = input ? classify(toIso(input.value), days) : null;
    var flag = PKL.$('.row-flag', row);

    row.classList.toggle(CLASSES.merah, !!info && info.warna === 'merah');
    row.classList.toggle(CLASSES.kuning, !!info && info.warna === 'kuning');
    if (!info) {
      if (flag) flag.remove();
      return null;
    }
    if (!flag) {
      flag = document.createElement('p');
      flag.innerHTML = '<svg aria-hidden="true"><use href="#i-alert"/></svg><strong></strong><span></span>';
      var fields = PKL.$('.repeater__fields', row);
      fields.insertBefore(flag, fields.firstChild);
    }
    flag.className = 'row-flag row-flag--' + info.warna;
    flag.querySelector('strong').textContent = info.label;
    flag.querySelector('span').textContent = info.keterangan + SARAN;
    return info.warna;
  }

  /** Tandai ulang semua baris jurnal; kembalikan { merah, kuning } (jumlah baris). */
  function markAll() {
    var count = { merah: 0, kuning: 0 };
    var rep = PKL.repeater.get(LIST);
    if (!rep) return count;
    var days = workdays();
    PKL.$$('.repeater__row', rep.list).forEach(function (row) {
      var w = markRow(row, days);
      if (w) count[w]++;
    });
    return count;
  }

  PKL.holidayMark = {
    init: function () {
      PKL.on('pkl:repeater-change', function (detail) {
        if (detail && detail.name === LIST) markAll();
      });
      // "Hari Kerja" diubah di Langkah 4 → warna kuning ikut berubah.
      PKL.on('pkl:state-change', function (detail) {
        if (detail && detail.key === 'hari_kerja') markAll();
      });
      markAll();
    },
    markAll: markAll,
    classify: classify,
    toIso: toIso
  };
})(window.PKL);

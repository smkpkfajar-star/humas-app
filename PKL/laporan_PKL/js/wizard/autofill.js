/**
 * Autofill & nilai turunan — FR-02 (data master) & FR-05 (kalkulasi).
 *
 * Aturan isi otomatis yang tetap bisa diedit:
 *   Field hanya ditimpa bila masih kosong ATAU masih sama dengan nilai
 *   otomatis terakhir (tersimpan di state._auto). Begitu siswa mengubahnya
 *   manual, isian siswa tidak akan ditimpa lagi.
 */
(function (PKL) {
  'use strict';

  function autoMap() {
    return PKL.state.get('_auto') || {};
  }

  /** Isi `name` dengan `value` bila aman (lihat aturan di atas). */
  function autoSet(name, value) {
    var current = PKL.form.read(name);
    if (current === undefined) current = PKL.state.get(name);
    var map = autoMap();
    var untouched = !current || current === map[name];
    if (!untouched || current === value) {
      if (current === value && map[name] !== value) remember(name, value);
      return;
    }
    if (PKL.form.read(name) !== undefined) PKL.form.setValue(name, value, 'auto');
    else PKL.state.set(name, value, 'auto');
    remember(name, value);
  }

  function remember(name, value) {
    var map = autoMap();
    var next = {};
    for (var k in map) next[k] = map[k];
    next[name] = value;
    PKL.state.set('_auto', next, 'auto');
  }

  function setOut(key, text) {
    PKL.$$('[data-out="' + key + '"]').forEach(function (el) { el.textContent = text; });
  }

  function setFieldError(name, message) {
    var el = PKL.$('[name="' + name + '"]');
    var help = PKL.$('[data-error-for="' + name + '"]');
    if (el) {
      el.classList.toggle('is-invalid', !!message);
      if (message) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    }
    if (help) {
      help.textContent = message || '';
      help.hidden = !message;
    }
  }

  // ---------- Data master ----------

  /** Combobox Guru Pembimbing (Pendamping): pilihan sesuai prodi siswa (pengaturan.js). */
  function fillDatalistGuru(kode) {
    var list = PKL.$('#guru-list');
    if (!list) return;
    list.textContent = '';
    PKL.master.pendampingFor(kode).forEach(function (nama) {
      var opt = document.createElement('option');
      opt.value = nama;
      list.appendChild(opt);
    });
    var hint = PKL.$('[data-guru-hint]');
    if (hint) {
      var n = list.children.length;
      hint.textContent = n
        ? n + ' pendamping ' + (PKL.master.jurusan[kode] && PKL.master.jurusan[kode].pendamping.length ? 'prodi ' + kode : 'dari semua prodi') + ' — ketik atau pilih dari daftar.'
        : 'Daftar pendamping belum diisi di pengaturan.js — ketik nama secara manual.';
    }
  }

  function applySchoolDefaults() {
    autoSet('sekolah_nama', PKL.master.sekolah.nama);
    autoSet('kota_pengesahan', PKL.master.sekolah.kota);
    autoSet('kepsek_nama', PKL.master.kepsek.nama);
    autoSet('tahun_ajaran', PKL.calc.schoolYear());
    autoSet('tahun_cetak', String(new Date().getFullYear()));
  }

  function applyJurusan(kode) {
    var j = PKL.master.jurusan[kode];
    if (!j) return;
    autoSet('kompetensi_keahlian', PKL.master.kompetensiLabel(kode));
    autoSet('kaprog_nama', j.kaprog.nama);
  }


  // ---------- Kalkulasi ----------

  function updateDuration() {
    var res = PKL.calc.duration(PKL.state.get('tgl_mulai'), PKL.state.get('tgl_selesai'));
    if (res && res.error) {
      setFieldError('tgl_selesai', res.error);
      PKL.form.setValue('lama_pelaksanaan', '', 'auto');
      return;
    }
    setFieldError('tgl_selesai', '');
    PKL.form.setValue('lama_pelaksanaan', res ? res.text : '', 'auto');
  }

  function updateAttendance() {
    var t = PKL.calc.attendance(PKL.state.get('list_presensi_bulanan'));
    PKL.state.setMany(t, 'auto');
    Object.keys(t).forEach(function (k) { setOut(k, String(t[k])); });
  }

  /** Pratinjau tanggal pengesahan otomatis (dihitung ulang saat generate). */
  function updateApprovalDate() {
    var text = PKL.calc.formatDate(PKL.calc.approvalDate());
    PKL.$$('[data-approval-date]').forEach(function (el) { el.value = text; });
  }

  function updateFileName() {
    setOut('file_name', PKL.calc.fileName(PKL.state.get('siswa_nama'), PKL.state.get('siswa_kelas')));
  }

  // ---------- Kompetensi keahlian di Langkah 1 (select #jurusan_kode) ----------

  function jurusanSelect() { return PKL.$('[data-jurusan-select]'); }

  function fillJurusanOptions() {
    var sel = jurusanSelect();
    if (!sel || sel.options.length > 1) return;
    Object.keys(PKL.master.jurusan).forEach(function (kode) {
      var opt = document.createElement('option');
      opt.value = kode;
      opt.textContent = PKL.master.kompetensiLabel(kode);
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () {
      // Sama seperti memilih kartu jurusan di halaman awal: radio, state, Kajur & contoh ikut berubah.
      PKL.form.setValue('jurusan_kode', sel.value, 'user');
    });
  }

  function syncJurusanSelect(kode) {
    var sel = jurusanSelect();
    if (sel && sel.value !== (kode || '')) sel.value = kode || '';
  }

  function refreshAll() {
    var kode = PKL.state.get('jurusan_kode');
    fillJurusanOptions();
    syncJurusanSelect(kode);
    applySchoolDefaults();
    if (kode) applyJurusan(kode);
    fillDatalistGuru(kode);
    updateDuration();
    updateAttendance();
    updateFileName();
    updateApprovalDate();
  }

  PKL.autofill = {
    init: function () {

      PKL.on('pkl:state-change', function (d) {
        if (d.source === 'auto') return;
        switch (d.key) {
          case 'jurusan_kode': applyJurusan(d.value); fillDatalistGuru(d.value); syncJurusanSelect(d.value); break;
          case 'tgl_mulai':
          case 'tgl_selesai': updateDuration(); break;
          case 'list_presensi_bulanan': updateAttendance(); break;
          case 'siswa_nama':
          case 'siswa_kelas': updateFileName(); break;
        }
      });
    },
    refreshAll: refreshAll
  };
})(window.PKL);

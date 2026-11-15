/**
 * app.js — titik masuk aplikasi.
 *   Tahap 1: UI, routing hash (#/langkah-1), menu Backup.
 *   Tahap 2: state + auto-save, data master, kalkulasi, kelengkapan,
 *            draft lokal, ekspor/impor/hapus backup.
 *   Tahap 3: impor massal Jurnal Harian via CSV.
 *   Tahap 4: gambar (kompresi + IndexedDB), backup berisi gambar, generate .docx.
 */
(function (PKL) {
  'use strict';

  var DEFAULT_VIEW = 'mulai';
  var FLASH_KEY = 'pkl-laporan:flash';

  // ---------------------------------------------------------------- Routing

  function currentView() {
    var id = location.hash.replace(/^#\/?/, '');
    return PKL.views.indexOf(id) !== -1 ? id : DEFAULT_VIEW;
  }

  function route(initial) {
    PKL.stepRenderer.show(currentView(), { initial: initial });
  }

  // ------------------------------------------------------- Indikator simpan

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function clock(iso) {
    var d = iso ? new Date(iso) : new Date();
    return pad2(d.getHours()) + '.' + pad2(d.getMinutes());
  }

  function initSaveStatus() {
    var el = PKL.$('#save-status');
    var text = PKL.$('.save-status__text', el);

    function render(d) {
      el.setAttribute('data-state', d.state);
      if (d.state === 'saving') text.textContent = 'Menyimpan…';
      else if (d.state === 'saved') text.textContent = 'Tersimpan otomatis pukul ' + clock(d.at);
      else if (d.state === 'error') text.textContent = d.message;
      else if (d.state === 'info') text.textContent = d.message;
      el.title = text.textContent;
    }

    PKL.on('pkl:save-status', render);

    var last = PKL.state.updatedAt();
    if (!PKL.state.storageAvailable()) {
      render({ state: 'error', message: 'Browser tidak mengizinkan penyimpanan — gunakan Ekspor Backup' });
    } else if (last) {
      render({ state: 'saved', at: last });
    }

    // Pesan sekali tampil setelah reload (mis. "Backup berhasil dipulihkan").
    try {
      var flash = sessionStorage.getItem(FLASH_KEY);
      if (flash) {
        sessionStorage.removeItem(FLASH_KEY);
        render({ state: 'info', message: flash });
        setTimeout(function () { PKL.toast(flash, { tone: /hapus/i.test(flash) ? 'info' : 'success' }); }, 300);
      }
    } catch (err) { /* abaikan */ }
  }

  var GOTO_KEY = 'pkl-laporan:goto';

  /**
   * Muat ulang halaman lalu buka `hash`.
   * Hanya SATU navigasi (reload); tujuan disimpan di sessionStorage dan diterapkan
   * saat start-up. (location.replace + reload berurutan bisa memicu dua navigasi
   * yang saling balapan di file://.)
   */
  function reloadWith(hash, flash) {
    try {
      if (flash) sessionStorage.setItem(FLASH_KEY, flash);
      sessionStorage.setItem(GOTO_KEY, hash);
    } catch (err) {
      location.hash = hash;   // tanpa sessionStorage: hash dulu, lalu reload
    }
    location.reload();
  }

  /** Terapkan tujuan dari reloadWith() tanpa navigasi tambahan. */
  function applyPendingRoute() {
    try {
      var hash = sessionStorage.getItem(GOTO_KEY);
      if (!hash) return;
      sessionStorage.removeItem(GOTO_KEY);
      history.replaceState(null, '', location.pathname + location.search + hash);
    } catch (err) { /* abaikan */ }
  }

  // ------------------------------------------------------------ Halaman awal

  function formatStamp(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    return PKL.calc.formatDate(d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())) + ', ' + clock(iso);
  }

  function initLanding(hadDraft) {
    var card = PKL.$('#draft-card');
    if (hadDraft && PKL.state.hasContent()) {
      PKL.$('[data-draft-name]', card).textContent = PKL.state.get('siswa_nama') || 'Tanpa nama';
      PKL.$('[data-draft-time]', card).textContent = formatStamp(PKL.state.updatedAt());
      card.hidden = false;
    }

    var err = PKL.$('#err-jurusan');
    PKL.$$('input[name="jurusan_kode"]').forEach(function (r) {
      r.addEventListener('change', function () { err.hidden = true; });
    });

    PKL.$('[data-action="start-new"]').addEventListener('click', function (e) {
      var kode = PKL.state.get('jurusan_kode');
      if (!kode) {
        e.preventDefault();
        err.hidden = false;
        var first = PKL.$('input[name="jurusan_kode"]');
        if (first) first.focus();
        return;
      }
      if (!card.hidden) {
        e.preventDefault();
        PKL.dialog.choose({
          title: 'Mulai laporan baru?',
          tone: 'danger',
          message: 'Draft milik **' + (PKL.state.get('siswa_nama') || 'Tanpa nama') + '** akan dihapus dari perangkat ini.\n' +
                   'Simpan backup dulu bila draft itu masih diperlukan.',
          choices: [
            { label: 'Simpan Backup Dulu', value: 'backup', variant: 'secondary' },
            { label: 'Hapus & Mulai Baru', value: 'new', variant: 'danger' }
          ]
        }).then(function (v) {
          if (v === 'backup') { exportBackup(); return; }
          if (v !== 'new') return;
          PKL.state.clear();
          PKL.state.set('jurusan_kode', kode);
          PKL.state.flush();
          clearImages().then(function () { reloadWith('#/langkah-1'); });
        });
      }
    });
  }

  // ------------------------------------------------------------------ Backup

  var IMAGE_KEY_RE = /^img_[a-z_]+_[a-z0-9]+$/i;
  var JPEG_DATA_URL = 'data:image/jpeg;base64,';

  /** Hapus semua gambar laporan (templat yang tersimpan tetap dipertahankan). */
  function clearImages() {
    return PKL.images.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return IMAGE_KEY_RE.test(k); }).map(PKL.images.remove));
    }).catch(function () { /* abaikan: IndexedDB tidak tersedia */ });
  }

  function blobToDataURL(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result)); };
      r.onerror = function () { reject(r.error); };
      r.readAsDataURL(blob);
    });
  }

  function dataURLToBlob(url) {
    var bin = atob(url.slice(JPEG_DATA_URL.length));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: 'image/jpeg' });
  }

  /** Gambar ikut di dalam backup (base64) agar foto tidak hilang saat pindah perangkat. */
  function exportBackup() {
    PKL.state.flush();
    var backup = PKL.state.toBackup();
    var keys = PKL.imageSlots.referencedKeys();

    Promise.all(keys.map(function (key) {
      return PKL.images.get(key).then(function (rec) {
        if (!rec || !rec.blob) return null;
        return blobToDataURL(rec.blob).then(function (url) {
          return [key, { dataUrl: url, width: rec.width, height: rec.height,
            displayWidth: rec.displayWidth, displayHeight: rec.displayHeight, name: rec.name || '', slot: rec.slot || '' }];
        });
      });
    })).catch(function () { return []; }).then(function (entries) {
      backup.images = {};
      entries.forEach(function (e) { if (e) backup.images[e[0]] = e[1]; });

      var nama = PKL.calc.safeNamePart(PKL.state.get('siswa_nama'), 60) || 'Tanpa_Nama';
      var d = new Date();
      var stamp = d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
      PKL.download('Backup_Laporan_PKL_' + nama + '_' + stamp + '.json', JSON.stringify(backup), 'application/json');
      var n = Object.keys(backup.images).length;
      PKL.emit('pkl:save-status', { state: 'info', message: 'Backup diekspor ke folder Unduhan' + (n ? ' (termasuk ' + n + ' gambar)' : '') });
      PKL.toast('File backup tersimpan di folder Unduhan' + (n ? ', termasuk ' + n + ' gambar' : '') + '. Simpan di flashdisk atau Google Drive agar aman.',
        { title: 'Backup berhasil diekspor' });
    });
  }

  /** Validasi & simpan gambar dari backup ke IndexedDB. */
  function restoreImages(images) {
    if (!images || typeof images !== 'object') return Promise.resolve(0);
    var jobs = Object.keys(images).filter(function (key) {
      var img = images[key];
      return IMAGE_KEY_RE.test(key) && img && typeof img.dataUrl === 'string' && img.dataUrl.indexOf(JPEG_DATA_URL) === 0 &&
        img.dataUrl.length < 15 * 1024 * 1024 && +img.displayWidth > 0 && +img.displayHeight > 0;
    }).map(function (key) {
      var img = images[key];
      return PKL.images.put(key, {
        blob: dataURLToBlob(img.dataUrl),
        width: +img.width || 0, height: +img.height || 0,
        displayWidth: Math.min(+img.displayWidth, 1000), displayHeight: Math.min(+img.displayHeight, 1400),
        name: String(img.name || '').slice(0, 200), slot: String(img.slot || '').slice(0, 40)
      });
    });
    return Promise.all(jobs).then(function () { return jobs.length; });
  }

  function importBackup(file) {
    if (!file) return;
    if (file.size > 80 * 1024 * 1024) {
      PKL.dialog.alert({ tone: 'error', title: 'File terlalu besar', message: 'Ukuran maksimal file backup laporan adalah 80 MB.' });
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var obj;
      try {
        obj = JSON.parse(String(reader.result));
      } catch (err) {
        PKL.dialog.alert({ tone: 'error', title: 'File tidak dapat dibaca', message: 'Pastikan yang dipilih adalah file **.json** hasil Ekspor Backup.' });
        return;
      }
      var who = obj && obj.data && obj.data.siswa_nama ? ' milik **' + obj.data.siswa_nama + '**' : '';
      var ask = PKL.state.hasContent()
        ? PKL.dialog.confirm({
            title: 'Pulihkan backup?', tone: 'warn', confirmLabel: 'Ganti dengan Backup',
            message: 'Backup' + who + ' akan dipulihkan.\nData yang sedang ada di perangkat ini akan diganti.'
          })
        : Promise.resolve(true);
      ask.then(function (yes) { if (yes) applyBackup(obj); });
    };
    reader.onerror = function () { PKL.dialog.alert({ tone: 'error', title: 'Gagal membaca file', message: 'Coba pilih ulang file backup-nya.' }); };
    reader.readAsText(file);
  }

  function applyBackup(obj) {
    try {
      PKL.state.fromBackup(obj);
    } catch (err) {
      PKL.dialog.alert({ tone: 'error', title: 'Backup tidak bisa dipakai', message: err.message });
      return;
    }
    clearImages()
      .then(function () { return restoreImages(obj.images); })
      .catch(function () { return 0; })
      .then(function (n) {
        reloadWith('#/ringkasan', 'Backup berhasil dipulihkan' + (n ? ' (' + n + ' gambar)' : ''));
      });
  }

  function resetAll() {
    PKL.dialog.choose({
      title: 'Hapus semua data laporan?',
      tone: 'danger',
      message: 'Semua isian dan gambar di perangkat ini akan dihapus dan **tidak dapat dikembalikan**.\nSimpan backup dulu bila masih diperlukan.',
      choices: [
        { label: 'Simpan Backup Dulu', value: 'backup', variant: 'secondary' },
        { label: 'Hapus Semua', value: 'reset', variant: 'danger' }
      ]
    }).then(function (v) {
      if (v === 'backup') { exportBackup(); return; }
      if (v !== 'reset') return;
      PKL.state.clear();
      clearImages().then(function () { reloadWith('#/mulai', 'Semua data telah dihapus'); });
    });
  }

  function initBackupMenu() {
    var menu = PKL.$('#backup-menu');
    var input = PKL.$('#json-import-input');

    document.addEventListener('click', function (e) {
      if (menu.open && (!menu.contains(e.target) || e.target.closest('.menu__item'))) menu.open = false;

      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      switch (btn.getAttribute('data-action')) {
        case 'export-json': exportBackup(); break;
        case 'import-json': input.value = ''; input.click(); break;
        case 'reset': resetAll(); break;
      }
    });

    input.addEventListener('change', function () { importBackup(input.files[0]); });

    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.open) {
        menu.open = false;
        PKL.$('summary', menu).focus();
      }
    });
  }

  // ------------------------------------------------------ Masalah pengaturan

  /** pengaturan.js salah ketik / tidak lengkap → peringatan jelas untuk admin. */
  function showSettingsProblems() {
    var list = PKL.master.problems || [];
    if (!list.length) return;
    if (window.console) console.warn('[pengaturan.js]', list);

    function build() {
      var box = document.createElement('div');
      box.className = 'callout callout--warn settings-problems';
      box.setAttribute('role', 'alert');
      box.innerHTML = '<svg aria-hidden="true"><use href="#i-alert"/></svg><div><p class="callout__title"></p><ul></ul></div>';
      box.querySelector('.callout__title').textContent = 'File pengaturan.js perlu diperbaiki (' + list.length + ' masalah)';
      var ul = box.querySelector('ul');
      list.slice(0, 6).forEach(function (msg) {
        var li = document.createElement('li');
        li.textContent = msg;
        ul.appendChild(li);
      });
      return box;
    }
    var intro = PKL.$('.landing__intro');
    if (intro) intro.insertBefore(build(), intro.firstChild);
    var sample = PKL.$('[data-view="langkah-1"] [data-sample-notice]');
    if (sample) sample.parentNode.insertBefore(build(), sample);
  }

  // ------------------------------------------------------------------- Init

  function init() {
    PKL.stepRenderer.init();
    PKL.repeater.init(document);
    PKL.form.init();
    PKL.autofill.init();
    PKL.csvImport.init();
    PKL.imageSlots.init();
    PKL.generatePanel.init();
    PKL.completeness.init();

    // 1) Nilai bawaan form (value="Yogyakarta", baris kosong, dst.)
    var defaults = PKL.form.collectAll();
    // 2) Draft tersimpan menimpa bawaan; kunci baru (versi app lebih baru) tetap dapat bawaan.
    var hadDraft = PKL.state.load();
    PKL.state.seed(defaults);
    if (hadDraft) PKL.form.applyAll(PKL.state.all());
    // 3) Data master & nilai turunan.
    PKL.autofill.refreshAll();
    PKL.completeness.render();
    PKL.writingGuides.init();   // contoh penulisan sesuai jurusan yang tersimpan
    PKL.wordCount.init();       // penghitung kata di bawah isian narasi
    PKL.autoRows.init();        // tombol jurnal & presensi otomatis
    PKL.completeness.initJump(); // klik "Belum diisi: ..." -> langsung ke isiannya
    PKL.motion.init();          // animasi, perayaan 100%, tombol ke atas
    // 4) Pratinjau gambar dari IndexedDB, lalu bersihkan gambar yang tak lagi dipakai.
    PKL.imageSlots.syncAll().then(PKL.imageSlots.collectGarbage);

    if (PKL.master.isSample) PKL.$$('[data-sample-notice]').forEach(function (el) { el.hidden = false; });
    showSettingsProblems();

    initSaveStatus();
    initLanding(hadDraft);
    initBackupMenu();

    PKL.$('#report-form').addEventListener('submit', function (e) { e.preventDefault(); });

    // Simpan segera saat berpindah langkah atau meninggalkan halaman.
    PKL.$('#step-nav').addEventListener('click', function () { PKL.state.flush(); });
    window.addEventListener('pagehide', function () { PKL.state.flush(); });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') PKL.state.flush();
    });

    window.addEventListener('hashchange', function () { route(false); });
    applyPendingRoute();
    route(true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.PKL);

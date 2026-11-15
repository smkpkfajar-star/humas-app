/**
 * Slot unggah gambar: dropzone → kompres → IndexedDB → pratinjau (FR-06).
 *
 * Markup minimal di index.html:
 *   <div class="image-slot" data-image-slot="dudi_struktur_img">
 *     <input type="hidden" name="dudi_struktur_img" data-image-key>   ← atau data-field="foto" di repeater
 *     <label class="dropzone"><input type="file" …> …</label>
 *   </div>
 * Pratinjau & pesan error dibuat oleh modul ini.
 *
 * Nilai field = kunci IndexedDB (string), bukan data gambar → state & backup tetap kecil.
 */
(function (PKL) {
  'use strict';

  var urls = new WeakMap();   // slot → objectURL pratinjau (dibersihkan saat ganti)

  function formatBytes(n) {
    return n < 1024 * 1024 ? Math.round(n / 1024) + ' KB' : (n / 1024 / 1024).toFixed(1) + ' MB';
  }

  function ensureParts(slot) {
    if (PKL.$('.image-preview', slot)) return;
    var preview = document.createElement('div');
    preview.className = 'image-preview';
    preview.hidden = true;
    preview.innerHTML =
      '<img alt="">' +
      '<div class="image-preview__meta"><span class="image-preview__name"></span><span data-img-info></span></div>' +
      '<div class="image-preview__actions">' +
        '<button type="button" class="btn btn--secondary btn--sm" data-img-action="replace">Ganti</button>' +
        '<button type="button" class="icon-btn icon-btn--danger" data-img-action="remove" aria-label="Hapus gambar">' +
          '<svg aria-hidden="true"><use href="#i-trash"/></svg></button>' +
      '</div>';
    slot.appendChild(preview);

    var err = document.createElement('p');
    err.className = 'help help--error';
    err.setAttribute('role', 'alert');
    err.setAttribute('data-img-error', '');
    err.hidden = true;
    slot.appendChild(err);
  }

  function keyInput(slot) { return PKL.$('[data-image-key]', slot); }

  function setError(slot, message) {
    var err = PKL.$('[data-img-error]', slot);
    err.textContent = message || '';
    err.hidden = !message;
  }

  function setBusy(slot, busy) {
    slot.classList.toggle('is-busy', busy);
    var title = PKL.$('.dropzone__title', slot);
    if (busy) {
      title.setAttribute('data-original', title.innerHTML);
      title.textContent = 'Mengompres gambar…';
    } else if (title.hasAttribute('data-original')) {
      title.innerHTML = title.getAttribute('data-original');
      title.removeAttribute('data-original');
    }
  }

  /** Tulis kunci ke field tersembunyi & beri tahu state / repeater. */
  function commitKey(slot, key) {
    var input = keyInput(slot);
    input.value = key || '';
    if (input.name) {
      PKL.state.set(input.name, input.value, 'user');
    } else {
      input.dispatchEvent(new Event('input', { bubbles: true }));   // repeater → notify
    }
  }

  /** Tampilkan pratinjau sesuai kunci saat ini (atau dropzone bila kosong). */
  function render(slot) {
    ensureParts(slot);
    var key = keyInput(slot).value;
    if (slot.getAttribute('data-rendered-key') === key) return Promise.resolve();
    slot.setAttribute('data-rendered-key', key);

    var drop = PKL.$('.dropzone', slot);
    var preview = PKL.$('.image-preview', slot);
    var old = urls.get(slot);
    if (old) { URL.revokeObjectURL(old); urls.delete(slot); }

    if (!key) {
      drop.hidden = false;
      preview.hidden = true;
      return Promise.resolve();
    }

    return PKL.images.get(key).then(function (rec) {
      if (keyInput(slot).value !== key) return;     // sudah berganti saat menunggu
      if (!rec) {
        // Kunci ada tapi gambarnya hilang (mis. data situs dibersihkan) → minta unggah ulang.
        drop.hidden = false;
        preview.hidden = true;
        setError(slot, 'Gambar sebelumnya tidak ditemukan di perangkat ini. Silakan unggah ulang.');
        return;
      }
      var url = URL.createObjectURL(rec.blob);
      urls.set(slot, url);
      var img = PKL.$('img', preview);
      img.src = url;
      img.alt = 'Pratinjau ' + (rec.name || 'gambar');
      PKL.$('.image-preview__name', preview).textContent = rec.name || 'Gambar';
      PKL.$('[data-img-info]', preview).textContent =
        formatBytes(rec.blob.size) + ' · ' + rec.width + '×' + rec.height + ' px';
      drop.hidden = true;
      preview.hidden = false;
    });
  }

  function handleFile(slot, file) {
    if (!file) return;
    var type = slot.getAttribute('data-image-slot');
    var prevKey = keyInput(slot).value;
    setError(slot, '');
    setBusy(slot, true);

    PKL.images.compress(file, type).then(function (res) {
      var key = PKL.images.newKey(type);
      return PKL.images.put(key, {
        blob: res.blob, width: res.width, height: res.height,
        displayWidth: res.displayWidth, displayHeight: res.displayHeight,
        name: file.name, slot: type
      }).then(function () {
        commitKey(slot, key);
        if (prevKey) PKL.images.remove(prevKey).catch(function () {});
        return render(slot);
      });
    }).catch(function (err) {
      setError(slot, err && err.message ? err.message : 'Gagal memproses gambar.');
    }).then(function () {
      setBusy(slot, false);
    });
  }

  function removeImage(slot) {
    var key = keyInput(slot).value;
    commitKey(slot, '');
    setError(slot, '');
    render(slot).then(function () {
      var input = PKL.$('input[type="file"]', slot);
      if (input) input.focus();
    });
    if (key) PKL.images.remove(key).catch(function () {});
  }

  /** Render semua slot (dipanggil setelah load/impor & saat repeater berubah). */
  function syncAll() {
    return Promise.all(PKL.$$('.image-slot').map(render));
  }

  /** Semua kunci gambar yang masih dipakai oleh data laporan. */
  function referencedKeys() {
    var keys = [];
    ['dudi_struktur_img', 'lampiran_sk_penempatan', 'lampiran_surat_selesai'].forEach(function (k) {
      var v = PKL.state.get(k);
      if (v) keys.push(v);
    });
    (PKL.state.get('list_dokumentasi') || []).forEach(function (r) { if (r && r.foto) keys.push(r.foto); });
    return keys;
  }

  /** Hapus gambar yatim (baris dokumentasi dihapus, gambar diganti, dll.). */
  function collectGarbage() {
    var used = {};
    referencedKeys().forEach(function (k) { used[k] = true; });
    return PKL.images.keys().then(function (all) {
      return Promise.all(all.filter(function (k) {
        return String(k).indexOf('img_') === 0 && !used[k];
      }).map(function (k) { return PKL.images.remove(k); }));
    }).catch(function () { /* GC bersifat opsional */ });
  }

  var syncTimer = null;

  PKL.imageSlots = {
    init: function () {
      document.addEventListener('change', function (e) {
        var input = e.target;
        if (input.type !== 'file') return;
        var slot = input.closest('.image-slot');
        if (!slot) return;
        handleFile(slot, input.files && input.files[0]);
        input.value = '';
      });

      document.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-img-action]');
        if (!btn) return;
        var slot = btn.closest('.image-slot');
        if (btn.getAttribute('data-img-action') === 'remove') removeImage(slot);
        else PKL.$('input[type="file"]', slot).click();
      });

      // Sorotan saat file diseret ke atas dropzone.
      ['dragenter', 'dragover'].forEach(function (t) {
        document.addEventListener(t, function (e) {
          var dz = e.target.closest && e.target.closest('.dropzone');
          if (dz) dz.classList.add('is-dragover');
        });
      });
      ['dragleave', 'drop'].forEach(function (t) {
        document.addEventListener(t, function (e) {
          var dz = e.target.closest && e.target.closest('.dropzone');
          if (dz) dz.classList.remove('is-dragover');
        });
      });

      // Baris dokumentasi baru / diurutkan / dipulihkan → render pratinjau.
      PKL.on('pkl:repeater-change', function (d) {
        if (d.name !== 'list_dokumentasi') return;
        clearTimeout(syncTimer);
        syncTimer = setTimeout(syncAll, 50);
      });
    },
    syncAll: syncAll,
    referencedKeys: referencedKeys,
    collectGarbage: collectGarbage
  };
})(window.PKL);

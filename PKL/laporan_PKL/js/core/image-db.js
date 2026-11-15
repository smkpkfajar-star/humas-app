/**
 * Penyimpanan & kompresi gambar (FR-01, FR-06).
 *
 *   PKL.images.compress(file, slot)  → Promise<{ blob, width, height, displayWidth, displayHeight }>
 *   PKL.images.put(key, record) / get(key) / remove(key) / keys() / clear()
 *   PKL.images.SLOTS                 → ukuran per jenis gambar
 *
 * Disimpan di IndexedDB (bukan localStorage) karena kuota localStorage ±5 MB.
 *
 * Ukuran: `maxW`/`maxH` = ukuran TAMPIL di Word (px @96 DPI, sesuai FR-06).
 * Piksel yang disimpan = ukuran tampil × DENSITY agar tetap tajam saat dicetak.
 */
(function (PKL) {
  'use strict';

  var DB_NAME = 'pkl-laporan';
  var STORE = 'images';
  var DENSITY = 2;
  var QUALITY = 0.82;
  var MAX_INPUT_BYTES = 25 * 1024 * 1024;
  var ACCEPT = /^image\/(jpeg|png|webp)$/;

  /** px @96 DPI: 135 mm ≈ 510 px, 60 mm ≈ 225 px, 150 mm ≈ 565 px. */
  var SLOTS = {
    dudi_struktur_img:      { maxW: 510, maxH: 620 },
    foto:                   { maxW: 225, maxH: 300 },
    lampiran_sk_penempatan: { maxW: 565, maxH: 820 },
    lampiran_surat_selesai: { maxW: 565, maxH: 820 }
  };

  // ------------------------------------------------------------ IndexedDB

  var dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('Browser ini tidak mendukung IndexedDB.')); return; }
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('Gagal membuka penyimpanan gambar.')); };
    });
    dbPromise.catch(function () { dbPromise = null; });
    return dbPromise;
  }

  function tx(mode, fn) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction(STORE, mode);
        var store = t.objectStore(STORE);
        var result;
        var req = fn(store);
        if (req) req.onsuccess = function () { result = req.result; };
        t.oncomplete = function () { resolve(result); };
        t.onerror = t.onabort = function () {
          var err = t.error || new Error('Operasi penyimpanan gambar gagal.');
          if (err.name === 'QuotaExceededError') err = new Error('Penyimpanan perangkat penuh. Hapus beberapa foto atau kosongkan ruang penyimpanan.');
          reject(err);
        };
      });
    });
  }

  // ------------------------------------------------------------- Kompresi

  function loadBitmap(file) {
    // createImageBitmap menerapkan orientasi EXIF (foto HP tidak miring).
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: 'from-image' })
        .catch(function () { return loadViaImg(file); });
    }
    return loadViaImg(file);
  }

  function loadViaImg(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Gambar tidak dapat dibaca. Coba file JPG atau PNG lain.')); };
      img.src = url;
    });
  }

  /** Ukuran tampil yang muat dalam kotak maxW × maxH, tanpa memperbesar. */
  function fit(w, h, maxW, maxH) {
    var scale = Math.min(maxW / w, maxH / h, 1);
    return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
  }

  function compress(file, slot) {
    var spec = SLOTS[slot];
    if (!spec) return Promise.reject(new Error('Jenis gambar tidak dikenal: ' + slot));
    if (!file || !ACCEPT.test(file.type)) {
      return Promise.reject(new Error('Format tidak didukung. Gunakan JPG, PNG, atau WEBP.'));
    }
    if (file.size > MAX_INPUT_BYTES) {
      return Promise.reject(new Error('Ukuran file terlalu besar (maks. 25 MB).'));
    }

    return loadBitmap(file).then(function (bmp) {
      var srcW = bmp.width || bmp.naturalWidth;
      var srcH = bmp.height || bmp.naturalHeight;
      var display = fit(srcW, srcH, spec.maxW, spec.maxH);
      var px = fit(srcW, srcH, spec.maxW * DENSITY, spec.maxH * DENSITY);

      var canvas = document.createElement('canvas');
      canvas.width = px.w;
      canvas.height = px.h;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';              // PNG transparan → latar putih (JPEG tanpa alpha)
      ctx.fillRect(0, 0, px.w, px.h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bmp, 0, 0, px.w, px.h);
      if (bmp.close) bmp.close();

      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Gagal mengompres gambar.')); return; }
          resolve({
            blob: blob,
            width: px.w,
            height: px.h,
            displayWidth: display.w,
            displayHeight: display.h
          });
        }, 'image/jpeg', QUALITY);
      });
    });
  }

  // ------------------------------------------------------------------ API

  PKL.images = {
    SLOTS: SLOTS,
    compress: compress,

    /** record: { blob, width, height, displayWidth, displayHeight, name, slot } */
    put: function (key, record) {
      return tx('readwrite', function (s) { return s.put(record, key); });
    },
    get: function (key) {
      if (!key) return Promise.resolve(null);
      return tx('readonly', function (s) { return s.get(key); }).then(function (r) { return r || null; });
    },
    remove: function (key) {
      if (!key) return Promise.resolve();
      return tx('readwrite', function (s) { return s.delete(key); });
    },
    keys: function () {
      return tx('readonly', function (s) { return s.getAllKeys(); }).then(function (k) { return k || []; });
    },
    clear: function () {
      return tx('readwrite', function (s) { return s.clear(); });
    },
    newKey: function (prefix) {
      var rnd = Math.random().toString(36).slice(2, 8);
      return 'img_' + prefix + '_' + Date.now().toString(36) + rnd;
    }
  };
})(window.PKL);

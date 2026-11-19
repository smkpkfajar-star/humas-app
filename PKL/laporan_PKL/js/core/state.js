/**
 * State global + auto-save localStorage (FR-01).
 *
 *   PKL.state.get(key) / set(key, value) / setMany(obj) / all()
 *   PKL.state.load()          → muat draft dari localStorage (true bila ada)
 *   PKL.state.flush()         → simpan sekarang (tanpa menunggu debounce)
 *   PKL.state.clear()         → hapus draft di perangkat ini
 *   PKL.state.toBackup()      → objek siap JSON.stringify (Ekspor .json)
 *   PKL.state.fromBackup(obj) → validasi & terapkan backup (Impor .json)
 *   PKL.state.hasContent()    → apakah siswa sudah mengisi sesuatu
 *   PKL.state.isFilled(k, v)  → aturan "terisi" yang dipakai bersama
 *
 * Event:
 *   'pkl:state-change' { key, value, source }
 *   'pkl:save-status'  { state: 'saving'|'saved'|'error', at?, message? }
 *
 * Gambar TIDAK disimpan di sini (Tahap 4 → IndexedDB). Field gambar hanya
 * berisi string kunci IndexedDB.
 */
(function (PKL) {
  'use strict';

  var STORAGE_KEY = 'pkl-laporan:draft';
  var APP_ID = 'generator-laporan-pkl';
  var SCHEMA = 1;
  var DEBOUNCE_MS = 500;

  /** Field terisi otomatis — tidak dihitung sebagai "siswa sudah mengisi". */
  var AUTO_KEYS = {
    jurusan_kode: 1, kompetensi_keahlian: 1, sekolah_nama: 1, kota_pengesahan: 1,
    kepsek_nama: 1, kaprog_nama: 1,
    tahun_cetak: 1, tahun_ajaran: 1, lama_pelaksanaan: 1, _auto: 1,
    total_hadir: 1, total_izin: 1, total_sakit: 1, total_alpha: 1, persentase_kehadiran: 1
  };

  /** Kolom penentu: baris tabel dianggap terisi bila kolom ini tidak kosong. */
  var LIST_KEY_FIELD = {
    list_kompetensi: 'kompetensi',
    list_peralatan: 'nama',
    list_kendala: 'kendala',
    list_jurnal: 'kegiatan',
    list_presensi_bulanan: 'bulan',
    list_dokumentasi: ['foto', 'keterangan']
  };

  var data = {};
  var updatedAt = null;
  var timer = null;
  var storageOk = true;

  function isBlank(v) {
    return v === undefined || v === null || String(v).trim() === '';
  }

  function isFilled(key, value) {
    if (Array.isArray(value)) {
      var cols = LIST_KEY_FIELD[key];
      if (cols && !Array.isArray(cols)) cols = [cols];
      return value.some(function (row) {
        if (!row) return false;
        var keys = cols || Object.keys(row);
        return keys.some(function (k) { return !isBlank(row[k]); });
      });
    }
    return !isBlank(value);
  }

  function same(a, b) {
    if (a === b) return true;
    if (typeof a === 'object' || typeof b === 'object') return JSON.stringify(a) === JSON.stringify(b);
    return false;
  }

  function status(state, extra) {
    var detail = { state: state };
    for (var k in extra) detail[k] = extra[k];
    PKL.emit('pkl:save-status', detail);
  }

  function schedule() {
    clearTimeout(timer);
    status('saving');
    timer = setTimeout(flush, DEBOUNCE_MS);
  }

  function flush() {
    clearTimeout(timer);
    timer = null;
    updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ app: APP_ID, schema: SCHEMA, updatedAt: updatedAt, data: data }));
      storageOk = true;
      status('saved', { at: updatedAt });
    } catch (err) {
      storageOk = false;
      var full = err && (err.name === 'QuotaExceededError' || err.code === 22);
      status('error', {
        message: full
          ? 'Penyimpanan browser penuh — segera Ekspor Backup (.json)'
          : 'Tidak bisa menyimpan otomatis (mode privat?) — gunakan Ekspor Backup'
      });
    }
  }

  /**
   * Bersihkan objek dari sumber tak tepercaya (file impor / localStorage):
   * hanya string, angka, boolean, dan array berisi objek datar yang lolos.
   */
  /** Isian yang sudah tidak dipakai (NIP dihapus dari laporan) — dibuang dari draft & backup lama. */
  var DROPPED_KEYS = { guru_nip: 1, kaprog_nip: 1, kepsek_nip: 1, instruktur_nip: 1, judul_laporan: 1,
    tgl_pengesahan: 1 };   // kini otomatis: tanggal generate + 2 hari (PKL.calc.approvalDate)

  function sanitize(input) {
    var out = {};
    if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
    Object.keys(input).forEach(function (key) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') return;
      if (DROPPED_KEYS[key]) return;
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return;
      var v = input[key];
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        out[key] = typeof v === 'string' ? v.slice(0, 100000) : v;   // di atas batas isian (30.000) → tidak memotong data yang sah
      } else if (Array.isArray(v)) {
        out[key] = v.slice(0, 1000).filter(function (r) { return r && typeof r === 'object' && !Array.isArray(r); })
          .map(function (r) {
            var row = {};
            Object.keys(r).forEach(function (rk) {
              if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(rk) || rk === '__proto__') return;
              var rv = r[rk];
              if (typeof rv === 'string' || typeof rv === 'number') row[rk] = typeof rv === 'string' ? rv.slice(0, 20000) : rv;
            });
            return row;
          });
      } else if (key === '_auto' && v && typeof v === 'object') {
        out._auto = sanitize(v);
      }
    });
    return out;
  }

  PKL.state = {
    STORAGE_KEY: STORAGE_KEY,

    get: function (key) { return data[key]; },

    all: function () { return JSON.parse(JSON.stringify(data)); },

    set: function (key, value, source) {
      if (same(data[key], value)) return false;
      data[key] = value;
      PKL.emit('pkl:state-change', { key: key, value: value, source: source || 'user' });
      schedule();
      return true;
    },

    setMany: function (obj, source) {
      Object.keys(obj).forEach(function (k) { this.set(k, obj[k], source); }, this);
    },

    /** Isi kunci yang belum ada (nilai bawaan form) tanpa memicu simpan/event. */
    seed: function (defaults) {
      Object.keys(defaults).forEach(function (k) {
        if (data[k] === undefined) data[k] = defaults[k];
      });
    },

    load: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        var parsed = JSON.parse(raw);
        if (!parsed || parsed.app !== APP_ID) return false;
        data = sanitize(parsed.data);
        updatedAt = parsed.updatedAt || null;
        return true;
      } catch (err) {
        storageOk = false;
        return false;
      }
    },

    flush: function () { if (timer) flush(); },

    clear: function () {
      clearTimeout(timer);
      data = {};
      updatedAt = null;
      try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* abaikan */ }
    },

    updatedAt: function () { return updatedAt; },

    storageAvailable: function () { return storageOk; },

    hasContent: function () {
      return Object.keys(data).some(function (k) { return !AUTO_KEYS[k] && isFilled(k, data[k]); });
    },

    isFilled: isFilled,

    toBackup: function () {
      return { app: APP_ID, schema: SCHEMA, exportedAt: new Date().toISOString(), data: this.all() };
    },

    /** Melempar Error berpesan ramah bila file bukan backup yang valid. */
    fromBackup: function (obj) {
      if (!obj || obj.app !== APP_ID || typeof obj.data !== 'object') {
        throw new Error('File ini bukan backup Generator Laporan PKL.');
      }
      if (typeof obj.schema !== 'number' || obj.schema > SCHEMA) {
        throw new Error('Backup dibuat oleh versi aplikasi yang lebih baru. Perbarui aplikasi terlebih dahulu.');
      }
      data = sanitize(obj.data);
      flush();
      return data;
    }
  };
})(window.PKL);

/**
 * Data master sekolah (FR-02) — dibaca dari pengaturan.js di folder utama.
 *
 * pengaturan.js berisi `window.PKL_PENGATURAN = { …JSON… };` sehingga tetap
 * terbaca saat aplikasi dibuka lewat klik ganda (file://), tempat browser
 * memblokir pembacaan file .json murni.
 *
 * Bila pengaturan hilang / salah ketik, aplikasi tetap jalan memakai DEFAULT
 * dan setiap masalah dicatat di PKL.master.problems untuk ditampilkan.
 */
(function (PKL) {
  'use strict';

  var KODE_PRODI = ['DKV', 'RPL', 'TITL', 'TSM', 'TKR'];

  var DEFAULT = {
    sekolah: { nama: 'SMK Tamansiswa Jetis', kota: 'Yogyakarta' },
    kepala_sekolah: 'Asnan Wiharno, M.Pd.',
    prodi: {
      DKV:  { nama: 'Desain Komunikasi Visual',        kajur: '', pendamping: [] },
      RPL:  { nama: 'Rekayasa Perangkat Lunak',        kajur: '', pendamping: [] },
      TITL: { nama: 'Teknik Instalasi Tenaga Listrik', kajur: '', pendamping: [] },
      TSM:  { nama: 'Teknik dan Bisnis Sepeda Motor',  kajur: '', pendamping: [] },
      TKR:  { nama: 'Teknik Kendaraan Ringan',         kajur: '', pendamping: [] }
    }
  };

  var problems = [];

  function str(v) { return typeof v === 'string' ? v.trim() : ''; }

  function pick(raw, path, fallback) {
    var v = str(raw);
    if (!v) { problems.push('"' + path + '" kosong atau bukan teks — memakai bawaan.'); return fallback; }
    return v;
  }

  function load() {
    var raw = window.PKL_PENGATURAN;
    if (!raw || typeof raw !== 'object') {
      problems.push('File pengaturan.js tidak terbaca. Periksa koma dan tanda kutip, atau pastikan file ada di folder aplikasi.');
      return JSON.parse(JSON.stringify(DEFAULT));
    }

    var out = {
      sekolah: {
        nama: pick(raw.sekolah && raw.sekolah.nama, 'sekolah.nama', DEFAULT.sekolah.nama),
        kota: pick(raw.sekolah && raw.sekolah.kota, 'sekolah.kota', DEFAULT.sekolah.kota)
      },
      kepala_sekolah: pick(raw.kepala_sekolah, 'kepala_sekolah', DEFAULT.kepala_sekolah),
      prodi: {}
    };

    var prodi = raw.prodi && typeof raw.prodi === 'object' ? raw.prodi : {};
    Object.keys(prodi).forEach(function (k) {
      if (KODE_PRODI.indexOf(k) === -1) problems.push('Kode prodi "' + k + '" tidak dikenal — diabaikan (gunakan DKV, RPL, TITL, TSM, TKR).');
    });

    KODE_PRODI.forEach(function (kode) {
      var p = prodi[kode];
      var def = DEFAULT.prodi[kode];
      if (!p || typeof p !== 'object') {
        problems.push('Prodi ' + kode + ' tidak ada di pengaturan — Kajur & pendamping dikosongkan.');
        out.prodi[kode] = JSON.parse(JSON.stringify(def));
        return;
      }
      if (!Array.isArray(p.pendamping)) problems.push('"prodi.' + kode + '.pendamping" harus berupa daftar ["…", "…"].');
      var list = Array.isArray(p.pendamping) ? p.pendamping : [];
      var seen = {};
      out.prodi[kode] = {
        nama: str(p.nama) || def.nama,
        kajur: str(p.kajur),
        pendamping: list.map(str).filter(function (n) {
          var key = n.toLowerCase();
          if (!n || seen[key]) return false;
          seen[key] = true;
          return true;
        })
      };
      if (!out.prodi[kode].kajur) problems.push('Nama Kajur ' + kode + ' belum diisi.');
    });
    return out;
  }

  var cfg = load();

  /** Nama yang masih diawali "Contoh" = data belum resmi. */
  function hasSampleNames() {
    var names = [cfg.kepala_sekolah];
    KODE_PRODI.forEach(function (k) { names.push(cfg.prodi[k].kajur); names = names.concat(cfg.prodi[k].pendamping); });
    return names.some(function (n) { return /^contoh\b/i.test(n || ''); });
  }

  var jurusan = {};
  var semuaPendamping = [];
  KODE_PRODI.forEach(function (k) {
    jurusan[k] = { nama: cfg.prodi[k].nama, kaprog: { nama: cfg.prodi[k].kajur }, pendamping: cfg.prodi[k].pendamping };
    cfg.prodi[k].pendamping.forEach(function (n) { if (semuaPendamping.indexOf(n) === -1) semuaPendamping.push(n); });
  });

  PKL.master = {
    isSample: hasSampleNames(),
    problems: problems,
    sekolah: cfg.sekolah,
    kepsek: { nama: cfg.kepala_sekolah },
    jurusan: jurusan,
    guruPembimbing: semuaPendamping.map(function (n) { return { nama: n }; }),

    /** Daftar pendamping untuk combobox: sesuai prodi; bila prodi kosong → semua pendamping. */
    pendampingFor: function (kode) {
      var j = jurusan[kode];
      return j && j.pendamping.length ? j.pendamping.slice() : semuaPendamping.slice();
    },

    /** "Rekayasa Perangkat Lunak (RPL)" — format untuk {kompetensi_keahlian}. */
    kompetensiLabel: function (kode) {
      var j = jurusan[kode];
      return j ? j.nama + ' (' + kode + ')' : '';
    },

    findGuru: function (nama) {
      var key = String(nama || '').trim().toLowerCase();
      for (var i = 0; i < semuaPendamping.length; i++) {
        if (semuaPendamping[i].toLowerCase() === key) return { nama: semuaPendamping[i] };
      }
      return null;
    }
  };
})(window.PKL);

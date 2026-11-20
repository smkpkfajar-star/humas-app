/* ==========================================================================
   Sesi login bersama untuk layanan yang wajib masuk (KI, Tracer, …)
   --------------------------------------------------------------------------
   STATUS: MODE DEMO — belum terhubung ke backend/database.
   Akun apa pun yang diisi diterima, sesi hanya disimpan di browser.
   Ini BUKAN pengaman: siapa pun bisa melewatinya.

   Pemakaian di halaman layanan (di <head>):
     <script src="/auth.js"></script>
     <script>var AUTH = buatAuth({ kode: 'KI', dasar: '/KI/' }); AUTH.wajibMasuk();</script>

   Saat backend siap, cukup ganti isi `masuk()` dan `keluar()` (tanda TODO BACKEND).
   ========================================================================== */
(function () {
  'use strict';

  var DEMO = true; // ubah ke false setelah masuk() memanggil backend sungguhan

  function baca(store, kunci) {
    try { return JSON.parse(window[store].getItem(kunci) || 'null'); } catch (e) { return null; }
  }
  function tulis(store, kunci, nilai) {
    try { window[store].setItem(kunci, JSON.stringify(nilai)); return true; } catch (e) { return false; }
  }
  function hapus(kunci) {
    try { sessionStorage.removeItem(kunci); } catch (e) { /* abaikan */ }
    try { localStorage.removeItem(kunci); } catch (e) { /* abaikan */ }
  }

  /**
   * @param {{kode:string, dasar:string}} cfg  kode layanan ('KI', 'Tracer') & folder dasarnya ('/KI/')
   */
  window.buatAuth = function (cfg) {
    var kunci = 'sesi_' + cfg.kode.toLowerCase();
    var dasar = cfg.dasar;
    var halamanMasuk = dasar + 'masuk/';

    /* Hanya izinkan kembali ke halaman di dalam folder layanan ini (mencegah pengalihan ke situs lain). */
    function tujuanAman(url) {
      var ok = typeof url === 'string' && url.indexOf(dasar) === 0 && url.charAt(dasar.length) !== '/' &&
        url.indexOf(halamanMasuk) !== 0;
      return ok ? url : dasar;
    }

    return {
      DEMO: DEMO,
      kode: cfg.kode,

      sesi: function () {
        if (window.BELUM_RILIS) return null; // halaman belum rilis: rilis.js yang mengalihkan
        return baca('sessionStorage', kunci) || baca('localStorage', kunci); },

      /**
       * @param {{peran:string, id:string, sandi:string}} data
       * @param {boolean} ingat  simpan sesi walau browser ditutup
       * @returns {Promise<object>} data sesi; ditolak dengan Error berpesan bila gagal
       */
      masuk: function (data, ingat) {
        /* TODO BACKEND: ganti blok ini dengan permintaan ke server, misalnya
           return fetch('/api/' + cfg.kode.toLowerCase() + '/masuk', {
             method: 'POST', credentials: 'include',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(data)
           }).then(function (r) { if (!r.ok) throw new Error('Akun atau kata sandi salah.'); return r.json(); });
           Jangan pernah menyimpan kata sandi di browser. */
        return new Promise(function (resolve) {
          setTimeout(function () {
            var sesi = { peran: data.peran, id: data.id, nama: data.id, demo: true, waktu: Date.now() };
            hapus(kunci);
            if (!tulis(ingat ? 'localStorage' : 'sessionStorage', kunci, sesi)) tulis('sessionStorage', kunci, sesi);
            resolve(sesi);
          }, 700);
        });
      },

      keluar: function () {
        /* TODO BACKEND: panggil juga endpoint keluar di server. */
        hapus(kunci);
        location.replace(halamanMasuk);
      },

      /** Panggil di <head>: belum masuk → dialihkan ke halaman masuk sebelum halaman tampil. */
      wajibMasuk: function () {
        if (window.BELUM_RILIS || this.sesi()) return;
        var kembali = location.pathname + location.search + location.hash;
        location.replace(halamanMasuk + '?kembali=' + encodeURIComponent(kembali));
      },

      /** Alamat tujuan setelah berhasil masuk (dari ?kembali=). */
      tujuan: function () {
        return tujuanAman(new URLSearchParams(location.search).get('kembali'));
      },

      /**
       * Isi kartu pengguna di header (#user-chip) dan pasang tombol Keluar.
       * @param {Object<string,string>} namaPeran  misal { siswa: 'Siswa', guru: 'Guru' }
       */
      pasangKartuPengguna: function (namaPeran) {
        var s = this.sesi(), self = this;
        var chip = document.getElementById('user-chip');
        if (!s || !chip) return;
        var nama = String(s.nama || s.id || 'Pengguna');
        chip.querySelector('[data-user-name]').textContent = nama;
        chip.querySelector('[data-user-role]').textContent = ((namaPeran || {})[s.peran] || s.peran) + (s.demo ? ' · demo' : '');
        chip.querySelector('[data-user-initial]').textContent = nama.charAt(0).toUpperCase();
        chip.querySelector('[data-action="keluar"]').addEventListener('click', function () { self.keluar(); });
        chip.hidden = false;
      }
    };
  };
})();

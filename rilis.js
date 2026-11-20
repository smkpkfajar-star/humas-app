/* ==========================================================================
   Penjaga halaman yang BELUM RILIS
   --------------------------------------------------------------------------
   Pasang paling atas di <head> setiap halaman layanan:
     <script src="/rilis.js"></script>
   Bila alamat halaman termasuk daftar di bawah, halaman disembunyikan dan
   pengunjung langsung dialihkan ke Home.

   Lapisan pertama ada di vercel.json (pengalihan oleh server). File ini
   lapisan cadangan agar tetap tertutup di hosting/server lain.

   SAAT RILIS: hapus folder layanan dari daftar ini, hapus pengalihannya di
   vercel.json, lalu ubah status di index.html menjadi 'aktif'.
   ========================================================================== */
(function () {
  'use strict';

  var BELUM_RILIS = ['/ki/', '/tracer/'];

  var p = location.pathname.toLowerCase();
  if (p.charAt(p.length - 1) !== '/' && !/\.[a-z0-9]+$/.test(p)) p += '/';

  for (var i = 0; i < BELUM_RILIS.length; i++) {
    if (p.indexOf(BELUM_RILIS[i]) === 0) {
      window.BELUM_RILIS = true; // auth.js tidak ikut mengalihkan ke halaman masuk
      document.documentElement.style.visibility = 'hidden';
      location.replace('/');
      return;
    }
  }
})();

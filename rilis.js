/* ==========================================================================
   Penjaga halaman yang BELUM RILIS + mode pengembang
   --------------------------------------------------------------------------
   Pasang paling atas di <head> (Home & setiap halaman layanan):
     <script src="/rilis.js"></script>

   Pengunjung biasa: halaman di daftar BELUM_RILIS disembunyikan lalu diganti
   halaman "tidak ditemukan" (/404.html). Lapisan pertama ada di vercel.json:
   server mengalihkan ke /tidak-ditemukan/ (alamat yang memang tidak ada,
   sehingga Vercel menampilkan 404.html dengan status 404). File ini lapisan
   cadangan untuk hosting/server lain.

   Pengembang tetap bisa membuka halaman yang belum rilis:
   - Di komputer sendiri (localhost / 127.0.0.1 / alamat LAN / file://): otomatis.
   - Di situs online: buka  /?dev=1  sekali untuk menyalakan mode pengembang
     di browser itu (cookie humas_dev, 30 hari). Matikan dengan  /?dev=0 .
     vercel.json ikut melewati pengalihan bila cookie ini ada.
   CATATAN: ini hanya menyembunyikan fitur, BUKAN pengaman. Siapa pun yang
   tahu caranya bisa menyalakan mode pengembang.

   SAAT RILIS: hapus folder layanan dari BELUM_RILIS, hapus pengalihannya di
   vercel.json, lalu ubah status di index.html menjadi 'aktif'.
   ========================================================================== */
(function () {
  'use strict';

  var BELUM_RILIS = ['/ki/', '/tracer/'];
  var COOKIE = 'humas_dev';

  /* ---------- Nyalakan / matikan mode pengembang lewat ?dev=1 / ?dev=0 ---------- */
  var q = location.search.match(/[?&]dev=([01])/);
  if (q) {
    document.cookie = COOKIE + '=' + (q[1] === '1' ? '1; max-age=2592000' : '; max-age=0') + '; path=/; SameSite=Lax' +
      (location.protocol === 'https:' ? '; Secure' : '');
    if (window.history && history.replaceState) {
      var bersih = location.search.replace(/([?&])dev=[01]&?/, '$1').replace(/[?&]$/, '');
      history.replaceState(null, '', location.pathname + bersih + location.hash);
    }
  }

  var lokal = location.protocol === 'file:' ||
    /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)$/.test(location.hostname);
  var cookieDev = new RegExp('(?:^|;\\s*)' + COOKIE + '=1(?:;|$)').test(document.cookie);

  /** true di komputer pengembang atau bila mode pengembang dinyalakan. */
  window.MODE_DEV = lokal || cookieDev;
  window.MODE_DEV_LOKAL = lokal;
  if (window.MODE_DEV) return;

  /* Ganti seluruh halaman dengan /404.html (alamat di browser tetap sama). */
  function tampilkanTidakDitemukan() {
    var gagal = function () { location.replace('/tidak-ditemukan/'); };
    if (!window.fetch) return gagal();
    fetch('/404.html', { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('404.html tidak ada');
      return r.text();
    }).then(function (html) {
      var tulis = function () { document.open(); document.write(html); document.close(); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tulis);
      else tulis();
    }).catch(gagal);
  }

  /* ---------- Pengunjung biasa: tutup halaman yang belum rilis ---------- */
  var p = location.pathname.toLowerCase();
  if (p.charAt(p.length - 1) !== '/' && !/\.[a-z0-9]+$/.test(p)) p += '/';

  for (var i = 0; i < BELUM_RILIS.length; i++) {
    if (p.indexOf(BELUM_RILIS[i]) === 0) {
      window.BELUM_RILIS = true; // auth.js tidak ikut mengalihkan ke halaman masuk
      document.documentElement.style.visibility = 'hidden';
      tampilkanTidakDitemukan();
      return;
    }
  }
})();

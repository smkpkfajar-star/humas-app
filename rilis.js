/* ==========================================================================
   Penjaga halaman yang BELUM RILIS + mode pengembang (sisi browser)
   --------------------------------------------------------------------------
   Pasang paling atas di <head> (Home & setiap halaman layanan):
     <script src="/rilis.js"></script>

   PENGAMAN UTAMA ada di server: middleware.js. Di Vercel, halaman yang belum
   rilis hanya dikirim bila browser membawa kunci pengembang yang benar
   (HUMAS_DEV_TOKEN, disimpan di pengaturan Vercel, tidak ada di kode).
   File ini hanya:
   - menyimpan kunci yang dimasukkan lewat  /?dev=<kunci>  (cookie humas_dev,
     30 hari) dan menghapusnya lewat  /?dev=0 ;
   - menampilkan penanda/ubin pratinjau di Home bila kunci tersimpan;
   - cadangan di hosting lain: halaman belum rilis diganti halaman 404.
   Browser TIDAK bisa memeriksa benar/salahnya kunci; yang memutuskan server.

   Di komputer sendiri (localhost / 127.0.0.1 / alamat LAN / file://) halaman
   yang belum rilis selalu terbuka agar mudah develop.

   SAAT RILIS: hapus folder layanan dari BELUM_RILIS di sini dan dari
   `matcher` di middleware.js, lalu ubah status di index.html menjadi 'aktif'.
   ========================================================================== */
(function () {
  'use strict';

  var BELUM_RILIS = ['/ki/', '/tracer/'];
  var COOKIE = 'humas_dev';
  var PANJANG_MIN = 16;

  /* ---------- Simpan / hapus kunci lewat ?dev=<kunci> / ?dev=0 ---------- */
  var q = location.search.match(/[?&]dev=([^&#]*)/);
  if (q) {
    var kunci = '';
    try { kunci = decodeURIComponent(q[1]); } catch (e) { /* abaikan */ }
    var aman = location.protocol === 'https:' ? '; Secure' : '';
    if (kunci.length >= PANJANG_MIN) {
      document.cookie = COOKIE + '=' + encodeURIComponent(kunci) + '; max-age=2592000; path=/; SameSite=Lax' + aman;
    } else {
      document.cookie = COOKIE + '=; max-age=0; path=/; SameSite=Lax' + aman; // ?dev=0 atau kunci tidak sah
    }
    // Hapus kunci dari alamat & riwayat browser.
    if (window.history && history.replaceState) {
      var bersih = location.search.replace(/([?&])dev=[^&#]*&?/, '$1').replace(/[?&]$/, '');
      history.replaceState(null, '', location.pathname + bersih + location.hash);
    }
  }

  var lokal = location.protocol === 'file:' ||
    /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)$/.test(location.hostname);
  var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]*)'));
  var adaKunci = !!(m && m[1].length >= PANJANG_MIN);

  /** true di komputer pengembang atau bila kunci pengembang tersimpan (benar/salahnya diperiksa server). */
  window.MODE_DEV = lokal || adaKunci;
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

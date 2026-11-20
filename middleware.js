/* ==========================================================================
   Penjaga server untuk halaman yang BELUM RILIS (Vercel Routing Middleware)
   --------------------------------------------------------------------------
   Berjalan di server Vercel SEBELUM halaman dikirim. Tanpa kunci pengembang
   yang benar, /KI/ dan /Tracer/ dijawab dengan halaman 404 (status 404),
   jadi isi halamannya tidak pernah sampai ke browser.

   Kunci pengembang disimpan di Vercel, BUKAN di kode:
     Vercel → Project → Settings → Environment Variables
     Nama  : HUMAS_DEV_TOKEN
     Nilai : string acak minimal 16 karakter
   Lalu deploy ulang. Nyalakan mode pengembang di browser dengan membuka
     https://<alamat-situs>/?dev=<kunci>
   Matikan dengan /?dev=0.

   Bila HUMAS_DEV_TOKEN belum diisi (atau terlalu pendek), halaman tetap
   tertutup untuk SEMUA orang (aman secara bawaan).

   SAAT RILIS: hapus folder layanan dari `matcher` di bawah, dan dari
   BELUM_RILIS di rilis.js.
   ========================================================================== */

export const config = {
  matcher: ['/KI', '/KI/:path*', '/Tracer', '/Tracer/:path*']
};

/* Perbandingan waktu-tetap agar kunci tidak bisa ditebak lewat lama respons. */
function samaPersis(a, b) {
  if (a.length !== b.length) return false;
  let beda = 0;
  for (let i = 0; i < a.length; i++) beda |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return beda === 0;
}

function ambilCookie(request, nama) {
  const m = (request.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + nama + '=([^;]*)'));
  if (!m) return '';
  try { return decodeURIComponent(m[1]); } catch (e) { return ''; }
}

export default async function middleware(request) {
  const kunci = process.env.HUMAS_DEV_TOKEN || '';
  const dariBrowser = ambilCookie(request, 'humas_dev');

  if (kunci.length >= 16 && samaPersis(dariBrowser, kunci)) {
    // Kunci benar: lanjutkan ke halaman seperti biasa.
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }

  let html = '<!doctype html><meta charset="utf-8"><title>Halaman tidak ditemukan</title><p>Halaman tidak ditemukan. <a href="/">Kembali ke Beranda</a></p>';
  try {
    const r = await fetch(new URL('/404.html', request.url));
    const teks = await r.text();
    if (teks) html = teks;
  } catch (e) { /* pakai cadangan di atas */ }

  return new Response(html, {
    status: 404,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex'
    }
  });
}

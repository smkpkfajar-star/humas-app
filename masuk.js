/* ==========================================================================
   Logika halaman masuk bersama (dipakai /KI/masuk/ dan /Tracer/masuk/)
   Halaman menyiapkan window.MASUK sebelum memuat file ini:
     { kode: 'KI', dasar: '/KI/',
       peran: { siswa: { label: 'NIS', ph: 'Contoh: 2324101', mode: 'numeric' }, … } }
   ========================================================================== */
(function () {
  'use strict';

  var cfg = window.MASUK;
  var AUTH = buatAuth({ kode: cfg.kode, dasar: cfg.dasar });

  var form = document.getElementById('form-masuk');
  var fId = document.getElementById('f-id');
  var fSandi = document.getElementById('f-sandi');
  var btn = document.getElementById('btn-masuk');
  var btnText = btn.querySelector('[data-text]');
  var formErr = document.getElementById('form-error');

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  document.getElementById('demo-note').hidden = !AUTH.DEMO;

  /* ---------- Peran: label & keyboard kolom akun ikut berganti ---------- */
  function peran() { return form.querySelector('input[name="peran"]:checked').value; }
  function aturPeran() {
    var p = cfg.peran[peran()];
    document.getElementById('l-id').textContent = p.label;
    fId.placeholder = p.ph;
    fId.setAttribute('inputmode', p.mode);
    tampilError(fId, '');
  }
  form.querySelectorAll('input[name="peran"]').forEach(function (r) {
    r.addEventListener('change', aturPeran);
  });
  aturPeran();

  /* ---------- Tampilkan / sembunyikan kata sandi ---------- */
  var lihat = document.getElementById('btn-lihat');
  lihat.addEventListener('click', function () {
    var tampil = fSandi.type === 'password';
    fSandi.type = tampil ? 'text' : 'password';
    lihat.setAttribute('aria-pressed', String(tampil));
    lihat.setAttribute('aria-label', tampil ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
    fSandi.focus();
  });

  /* ---------- Peringatan Caps Lock ---------- */
  var caps = document.getElementById('caps-hint');
  function cekCaps(e) { if (e.getModifierState) caps.hidden = !e.getModifierState('CapsLock'); }
  fSandi.addEventListener('keydown', cekCaps);
  fSandi.addEventListener('keyup', cekCaps);
  fSandi.addEventListener('blur', function () { caps.hidden = true; });

  /* ---------- Lupa kata sandi ---------- */
  var lupa = document.getElementById('btn-lupa');
  var lupaInfo = document.getElementById('lupa-info');
  lupa.addEventListener('click', function () {
    lupaInfo.hidden = !lupaInfo.hidden;
    lupa.setAttribute('aria-expanded', String(!lupaInfo.hidden));
  });

  /* ---------- Validasi ---------- */
  function tampilError(input, pesan) {
    var el = document.getElementById(input.getAttribute('aria-describedby'));
    el.textContent = pesan;
    el.hidden = !pesan;
    input.setAttribute('aria-invalid', pesan ? 'true' : 'false');
    input.closest('.field').classList.toggle('is-invalid', !!pesan);
  }
  [fId, fSandi].forEach(function (i) {
    i.addEventListener('input', function () { tampilError(i, ''); formErr.hidden = true; });
  });

  function sibuk(ya) {
    btn.disabled = ya;
    btn.classList.toggle('is-loading', ya);
    btnText.textContent = ya ? 'Memeriksa…' : 'Masuk';
  }

  /* ---------- Pop up berhasil masuk ----------
     Kartu di tengah layar: centang beranimasi, sapaan, hitung mundur,
     lalu otomatis lanjut ke tujuan (atau langsung lewat tombol). */
  var JEDA_LANJUT = 2200;
  var kurangiGerak = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function popupBerhasil(sesi) {
    var tujuan = AUTH.tujuan();
    var nama = (sesi && (sesi.nama || sesi.id)) || '';
    var labelPeran = form.querySelector('input[name="peran"]:checked').closest('label').textContent.trim();
    var sudah = false;
    function lanjut() {
      if (sudah) return;
      sudah = true;
      location.replace(tujuan);
    }

    var el = document.createElement('div');
    el.className = 'sukses';
    el.innerHTML =
      '<div class="sukses__card" role="alertdialog" aria-modal="true" aria-labelledby="sukses-judul" aria-describedby="sukses-teks">' +
        '<div class="sukses__ikon" aria-hidden="true">' +
          '<span class="sukses__cincin"></span>' +
          '<span class="sukses__percik">' + new Array(9).join('<i></i>') + '</span>' +
          '<svg viewBox="0 0 52 52"><circle class="sukses__lingkar" cx="26" cy="26" r="24"/><path class="sukses__centang" d="M15 27l7 7 15-16"/></svg>' +
        '</div>' +
        '<p class="sukses__judul" id="sukses-judul">Berhasil masuk!</p>' +
        '<p class="sukses__teks" id="sukses-teks">Halo, <strong>' + esc(nama) + '</strong>. Mengarahkan ke ' + esc(cfg.kode === 'KI' ? 'Layanan KI' : 'Tracer Study') + '…</p>' +
        '<span class="sukses__peran">' + esc(labelPeran) + (sesi && sesi.demo ? ' · mode demo' : '') + '</span>' +
        '<div class="sukses__bar" aria-hidden="true"><span></span></div>' +
        '<button type="button" class="btn-primary sukses__btn">Lanjut sekarang' +
          '<svg class="btn-primary__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
        '</button>' +
      '</div>';
    el.style.setProperty('--jeda', JEDA_LANJUT + 'ms');
    document.body.appendChild(el);

    var tombol = el.querySelector('.sukses__btn');
    tombol.addEventListener('click', lanjut);
    // Fokus ke tombol agar Enter / pembaca layar langsung bisa memakainya.
    requestAnimationFrame(function () { el.classList.add('is-open'); tombol.focus({ preventScroll: true }); });
    setTimeout(lanjut, kurangiGerak ? 1500 : JEDA_LANJUT);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var id = fId.value.trim();
    var sandi = fSandi.value;
    var salahId = id ? '' : cfg.peran[peran()].label + ' wajib diisi.';
    var salahSandi = sandi ? '' : 'Kata sandi wajib diisi.';
    tampilError(fId, salahId);
    tampilError(fSandi, salahSandi);
    if (salahId) { fId.focus(); return; }
    if (salahSandi) { fSandi.focus(); return; }

    formErr.hidden = true;
    sibuk(true);
    AUTH.masuk({ peran: peran(), id: id, sandi: sandi }, document.getElementById('f-ingat').checked)
      .then(function (sesi) {
        btnText.textContent = 'Berhasil';
        popupBerhasil(sesi);
      })
      .catch(function (err) {
        formErr.textContent = (err && err.message) || 'Gagal masuk. Coba lagi.';
        formErr.hidden = false;
        sibuk(false);
      });
  });
})();

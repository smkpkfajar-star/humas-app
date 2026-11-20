/* ==========================================================================
   Animasi karakter SVG — Superapp Humas (sederhana)
   --------------------------------------------------------------------------
   Pemakaian (gambar biasa tetap tampil bila JS/fetch gagal):
     <img src="/assets/siswa/siswa-melambai.svg" alt="" data-anim="melambai">
   Pose yang didukung animasi.css: melambai, laptop, berpikir, sukses.

   SVG disisipkan langsung (inline) agar bagiannya bisa digerakkan. Setiap id
   diberi awalan unik + data-k="<id asli>" (dipakai animasi.css). Grup yang
   sudah punya atribut transform dibungkus <g data-k> agar posisinya tidak tertimpa.
   Mata mengikuti kursor (hanya di perangkat bermouse). Animasi dijeda saat
   tidak terlihat dan mati bila pengguna memilih "kurangi gerakan".
   ========================================================================== */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var kurangiGerak = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pointerHalus = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var nomor = 0;
  var mata = [];

  function bangun(teks) {
    var p = 'a' + (++nomor) + '-';
    teks = teks
      .replace(/\sid="([^"]+)"/g, function (m, id) { return ' id="' + p + id + '" data-k="' + id + '"'; })
      .replace(/url\(#([^)]+)\)/g, function (m, id) { return 'url(#' + p + id + ')'; })
      .replace(/href="#([^"]+)"/g, function (m, id) { return 'href="#' + p + id + '"'; });

    var svg = new DOMParser().parseFromString(teks, 'image/svg+xml').documentElement;
    if (!svg || svg.nodeName !== 'svg') throw new Error('SVG tidak valid');
    svg = document.importNode(svg, true);

    Array.prototype.slice.call(svg.querySelectorAll('title, desc')).forEach(function (n) { n.remove(); });
    ['role', 'aria-labelledby', 'width', 'height'].forEach(function (a) { svg.removeAttribute(a); });
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('class', 'anim__svg');

    Array.prototype.slice.call(svg.querySelectorAll('[data-k][transform]')).forEach(function (el) {
      var g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('data-k', el.getAttribute('data-k'));
      el.removeAttribute('data-k');
      el.parentNode.insertBefore(g, el);
      g.appendChild(el);
    });

    // Pupil: gerakkan isinya saja agar potongan (clip-path) mata tetap di tempat.
    Array.prototype.slice.call(svg.querySelectorAll('[data-k="pupil-kiri"],[data-k="pupil-kanan"]')).forEach(function (el) {
      var isi = document.createElementNS(SVGNS, 'g');
      isi.setAttribute('class', 'anim-pupil');
      while (el.firstChild) isi.appendChild(el.firstChild);
      el.appendChild(isi);
    });
    return svg;
  }

  function pasang(img) {
    return fetch(img.getAttribute('src')).then(function (r) {
      if (!r.ok) throw new Error('gagal');
      return r.text();
    }).then(function (teks) {
      var svg = bangun(teks);
      var vb = (svg.getAttribute('viewBox') || '0 0 1 1').split(/[\s,]+/).map(Number);
      var wrap = document.createElement('span');
      wrap.className = (img.className ? img.className + ' ' : '') + 'anim anim--' + img.getAttribute('data-anim');
      wrap.setAttribute('aria-hidden', 'true');
      wrap.style.aspectRatio = vb[2] + ' / ' + vb[3];
      wrap.appendChild(svg);
      img.replaceWith(wrap);
      if (io) io.observe(wrap);
      if (svg.querySelector('.anim-pupil')) mata.push(wrap);
    }).catch(function () { /* biarkan <img> tetap tampil */ });
  }

  /* Jeda animasi saat tidak terlihat */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entri) {
    entri.forEach(function (e) { e.target.classList.toggle('is-paused', !e.isIntersecting); });
  }) : null;

  /* Mata mengikuti kursor */
  var antre = false, px = 0, py = 0;
  function ikutiKursor() {
    antre = false;
    mata.forEach(function (w) {
      var r = w.getBoundingClientRect();
      if (!r.width) return;
      var dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 3);
      var d = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.min(1, d / 260);
      var t = 'translate(' + (dx / d * 3 * k).toFixed(2) + 'px,' + (dy / d * 2.5 * k).toFixed(2) + 'px)';
      w.querySelectorAll('.anim-pupil').forEach(function (p) { p.style.transform = t; });
    });
  }

  function mulai() {
    Array.prototype.forEach.call(document.querySelectorAll('img[data-anim]'), pasang);
    if (!kurangiGerak && pointerHalus) {
      window.addEventListener('pointermove', function (e) {
        px = e.clientX; py = e.clientY;
        if (!antre) { antre = true; requestAnimationFrame(ikutiKursor); }
      }, { passive: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai);
  else mulai();
})();

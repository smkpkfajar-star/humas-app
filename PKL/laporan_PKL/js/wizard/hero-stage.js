/**
 * Panggung karakter di Home (aset assets/siswa, dibangun oleh tools/build-karakter.py):
 *   - siswa melambai & siswi membawa laptop muncul bergantian saat halaman dibuka
 *   - gerak diam: bernapas, berkedip, melambai berkala, badge dokumen melayang (css/hero-stage.css)
 *   - mata mengikuti kursor / sentuhan
 *   - melompat kecil saat siswa memilih kompetensi keahlian
 * Murni tampilan; dimatikan bila pengguna memilih "kurangi gerakan".
 */
(function (PKL) {
  'use strict';

  var MAX_PUPIL = 3;          // px (satuan SVG), sesuai panduan aset
  var stage = null;
  var pupils = [];
  var frame = 0;
  var pointer = null;

  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function mount() {
    stage = PKL.$('[data-hero-stage]');
    if (!stage || !PKL.karakterSvg) return false;
    var chars = PKL.$('[data-hero-chars]', stage) || stage;
    chars.innerHTML = PKL.karakterSvg.melambai + PKL.karakterSvg.laptop;
    if (PKL.karakterSvg.props) {
      // Di <body> (selalu tampil) agar getBBox terukur walau Home sedang tersembunyi.
      var holder = document.createElement('div');
      holder.innerHTML = PKL.karakterSvg.props;
      document.body.appendChild(holder.firstChild);
      mountProps();
    }
    pupils = PKL.$$('.pupil-move', stage).map(function (g) {
      var svg = g.ownerSVGElement;
      var eye = g.parentNode.id.indexOf('kiri') !== -1 ? { x: 142, y: 120 } : { x: 178, y: 120 };
      return { g: g, svg: svg, eye: eye };
    });
    return true;
  }

  /**
   * Ikon label melayang: tiap elemen [data-prop="prop-…"] mendapat <svg><use> yang
   * merujuk grup di props-interaktif.svg (disisipkan tersembunyi). viewBox diambil dari
   * kotak batas grup agar ikon terpotong pas.
   */
  function mountProps() {
    var NS = 'http://www.w3.org/2000/svg';
    PKL.$$('[data-prop]', stage).forEach(function (slot) {
      var src = document.getElementById('kp-' + slot.getAttribute('data-prop'));
      if (!src || !src.getBBox) return;
      var bb = src.getBBox();          // koordinat lokal: belum termasuk transform grup itu sendiri
      if (!bb.width) return;
      var m = src.transform && src.transform.baseVal.consolidate();
      var x0 = bb.x, y0 = bb.y, x1 = bb.x + bb.width, y1 = bb.y + bb.height;
      if (m) {
        var M = m.matrix;
        var pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(function (p) {
          return [M.a * p[0] + M.c * p[1] + M.e, M.b * p[0] + M.d * p[1] + M.f];
        });
        x0 = Math.min.apply(null, pts.map(function (p) { return p[0]; }));
        x1 = Math.max.apply(null, pts.map(function (p) { return p[0]; }));
        y0 = Math.min.apply(null, pts.map(function (p) { return p[1]; }));
        y1 = Math.max.apply(null, pts.map(function (p) { return p[1]; }));
      }
      var pad = 2;
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', [x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2].join(' '));
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      var use = document.createElementNS(NS, 'use');
      use.setAttribute('href', '#' + src.id);
      svg.appendChild(use);
      slot.appendChild(svg);
    });
  }

  /** Geser pupil ke arah titik (koordinat layar), maks. MAX_PUPIL satuan SVG. */
  function look() {
    frame = 0;
    if (!pointer) return;
    pupils.forEach(function (p) {
      var r = p.svg.getBoundingClientRect();
      if (!r.width) return;
      var scale = r.width / 320;
      var ex = r.left + p.eye.x * scale, ey = r.top + p.eye.y * scale;
      var dx = pointer.x - ex, dy = pointer.y - ey;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var k = Math.min(1, dist / 220) * MAX_PUPIL / dist;
      p.g.style.transform = 'translate(' + (dx * k).toFixed(2) + 'px,' + (dy * k).toFixed(2) + 'px)';
    });
  }

  function onPointer(e) {
    if (!stage || stage.offsetParent === null) return;   // Home sedang tidak tampil
    pointer = { x: e.clientX, y: e.clientY };
    if (!frame) frame = requestAnimationFrame(look);
  }

  function hop() {
    if (!stage || reduced()) return;
    stage.classList.remove('is-hop');
    stage.getBoundingClientRect();
    stage.classList.add('is-hop');
  }

  PKL.heroStage = {
    init: function () {
      if (!mount()) return;
      if (reduced()) { stage.classList.add('is-still'); return; }
      document.addEventListener('pointermove', onPointer, { passive: true });
      document.addEventListener('pointerdown', onPointer, { passive: true });
      stage.addEventListener('animationend', function (e) {
        if (e.animationName === 'hero-hop') stage.classList.remove('is-hop');
      });
      document.addEventListener('change', function (e) {
        if (e.target && e.target.name === 'jurusan_kode' && e.target.closest('.landing')) hop();
      });
      // Pupil kembali ke tengah saat kursor keluar jendela.
      document.addEventListener('mouseout', function (e) {
        if (e.relatedTarget) return;
        pointer = null;
        pupils.forEach(function (p) { p.g.style.transform = ''; });
      });
    },
    hop: hop
  };
})(window.PKL);

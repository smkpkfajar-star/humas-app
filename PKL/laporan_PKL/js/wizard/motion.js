/**
 * Lapisan interaksi & animasi (murni tampilan — tidak mengubah data):
 *   - transisi masuk saat berpindah langkah
 *   - baris tabel: muncul halus saat ditambah, memudar saat dihapus, meluncur saat dipindah
 *   - perayaan kecil saat semua isian wajib lengkap (100%)
 *   - tombol "kembali ke atas" untuk halaman panjang (mis. jurnal 100 baris)
 * Semua animasi dimatikan bila pengguna memilih "kurangi gerakan".
 */
(function (PKL) {
  'use strict';

  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function restartClass(el, cls) {
    el.classList.remove(cls);
    el.getBoundingClientRect();
    el.classList.add(cls);
  }

  // ------------------------------------------------------- Transisi langkah

  function wrapShow() {
    var show = PKL.stepRenderer.show;
    PKL.stepRenderer.show = function (viewId, opts) {
      show(viewId, opts);
      var v = PKL.$('[data-view="' + viewId + '"]');
      if (v && !reduced()) restartClass(v, 'view-enter');
    };
  }

  // ------------------------------------------------------------ Baris tabel

  function rowsOf(list) { return PKL.$$('.repeater__row', list); }

  /** FLIP: catat posisi sebelum pindah, animasikan dari posisi lama ke baru. */
  function animateMove(list) {
    var before = new Map();
    rowsOf(list).forEach(function (r) { before.set(r, r.getBoundingClientRect().top); });
    requestAnimationFrame(function () {
      rowsOf(list).forEach(function (r) {
        var dy = before.get(r) - r.getBoundingClientRect().top;
        if (dy && r.animate) {
          r.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }],
            { duration: 260, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
        }
      });
    });
  }

  function initRows() {
    // Baris baru (tombol Tambah) → muncul halus. setRows massal tidak dianimasikan.
    var obs = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.addedNodes.length !== 1) return;
        var n = m.addedNodes[0];
        if (n.nodeType === 1 && n.classList.contains('repeater__row')) restartClass(n, 'row-enter');
      });
    });
    PKL.$$('.repeater__list').forEach(function (list) { obs.observe(list, { childList: true }); });

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-row-action]');
      if (!btn || reduced()) return;
      var row = btn.closest('.repeater__row');
      var action = btn.getAttribute('data-row-action');
      if (action === 'up' || action === 'down') {
        animateMove(row.parentNode);
      } else if (action === 'remove' && !row.classList.contains('row-leave')) {
        // Tahan sebentar untuk animasi, lalu jalankan hapus yang sebenarnya.
        e.stopPropagation();
        e.preventDefault();
        row.classList.add('row-leave');
        setTimeout(function () {
          if (!row.isConnected) return;
          var list = row.parentNode;
          animateMove(list);
          btn.click();
        }, 170);
      }
    }, true);
  }

  // ---------------------------------------------------------------- Perayaan

  var celebrated = false;
  var lastPct = null;

  function confetti() {
    if (reduced()) return;
    var c = document.createElement('canvas');
    c.className = 'confetti';
    c.width = innerWidth; c.height = innerHeight;
    document.body.appendChild(c);
    var ctx = c.getContext('2d');
    var colors = ['#1E6B4B', '#4CAF7A', '#F2B705', '#E8F5E9', '#B7D8C8', '#F59E0B'];
    var parts = [];
    for (var i = 0; i < 120; i++) {
      parts.push({
        x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight * 0.35,
        vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 4,
        s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
        c: colors[i % colors.length]
      });
    }
    var t0 = performance.now();
    (function frame(t) {
      var k = (t - t0) / 1600;
      ctx.clearRect(0, 0, c.width, c.height);
      parts.forEach(function (p) {
        p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vx *= 0.99;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - k);
        ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      });
      if (k < 1) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }

  function initCelebrate() {
    var timer = null;
    lastPct = Math.round(PKL.completeness.evaluate().percent);
    if (lastPct >= 100) celebrated = true;   // sudah lengkap sejak dibuka: jangan dirayakan ulang
    PKL.on('pkl:state-change', function (d) {
      if (d.source === 'auto' && d.key === '_auto') return;
      clearTimeout(timer);
      timer = setTimeout(function () {
        var pct = Math.round(PKL.completeness.evaluate().percent);
        if (pct >= 100 && lastPct < 100 && !celebrated) {
          celebrated = true;
          confetti();
          PKL.toast('Semua isian wajib sudah terisi. Laporan siap dibuat di Langkah 7.', { title: 'Laporan lengkap 100%!', duration: 7000 });
        }
        lastPct = pct;
      }, 500);
    });
  }

  // --------------------------------------------------------- Kembali ke atas

  function initBackToTop() {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'to-top';
    b.setAttribute('aria-label', 'Kembali ke atas');
    b.innerHTML = '<svg aria-hidden="true"><use href="#i-up"/></svg>';
    b.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
      var h = PKL.$('.view:not([hidden]) h1');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    });
    document.body.appendChild(b);
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        b.classList.toggle('is-visible', window.scrollY > 900 && !document.body.classList.contains('is-landing'));
      });
    }, { passive: true });
  }

  // Bungkus router sedini mungkin (sebelum app.js memanggil show pertama kali).
  wrapShow();

  PKL.motion = {
    init: function () {
      initRows();
      initCelebrate();
      initBackToTop();
    },
    confetti: confetti
  };
})(window.PKL);

/**
 * Step Renderer — membangun navigasi langkah & menampilkan satu view.
 *
 * Konten formulir tiap langkah ditulis statis di index.html (field `name`
 * = kunci di docs/template-mapping.md). Modul ini mengurus:
 *   - daftar langkah di sidebar, dropdown mobile, ringkasan, checklist review
 *   - menampilkan view aktif + tombol Sebelumnya / Lanjut
 *   - indikator progres (nilainya dihitung modul lain via setProgress)
 */
(function (PKL) {
  'use strict';

  var ICON = function (id) { return '<svg aria-hidden="true"><use href="#' + id + '"/></svg>'; };

  function esc(text) {
    var d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  function buildSidebar() {
    var list = PKL.$('#step-list');
    list.innerHTML = PKL.steps.map(function (s) {
      return '<li><a class="step-link" href="#/' + s.id + '" data-step-link="' + s.id + '" title="' + esc(s.full + ' — ' + s.sub) + '">' +
        '<span class="step-link__marker" data-step-marker>' + s.no + '</span>' +
        '<span class="step-link__text">' + esc(s.title) + '<span class="step-link__sub">' + esc(s.sub) + '</span></span>' +
        '<span class="step-link__bab">' + esc(s.bab) + '</span>' +
        '</a></li>';
    }).join('');
  }

  function buildMobileSelect() {
    var select = PKL.$('#mobile-step-select');
    var html = '<option value="ringkasan">Ringkasan</option>';
    html += PKL.steps.map(function (s) {
      return '<option value="' + s.id + '">Langkah ' + s.no + ' · ' + esc(s.title) + ' (' + esc(s.bab) + ')</option>';
    }).join('');
    select.innerHTML = html;
    select.addEventListener('change', function () {
      location.hash = '#/' + select.value;
    });
  }

  function buildOverview() {
    PKL.$('#overview-list').innerHTML = PKL.steps.map(function (s) {
      return '<li><a class="overview-item" href="#/' + s.id + '">' +
        '<span class="overview-item__no">' + s.no + '</span>' +
        '<span class="overview-item__body">' +
          '<span class="overview-item__title">' + esc(s.full) + '</span>' +
          '<span class="overview-item__sub">' + esc(s.sub) + '</span>' +
        '</span>' +
        '<span class="badge" data-step-badge="' + s.id + '">Belum diisi</span>' +
        '<svg class="overview-item__arrow" aria-hidden="true"><use href="#i-chevron-right"/></svg>' +
        '</a></li>';
    }).join('');
  }

  function buildChecklist() {
    PKL.$('#review-checklist').innerHTML = PKL.steps.slice(0, 6).map(function (s) {
      return '<li class="checklist__item" data-check="' + s.id + '">' +
        '<span class="checklist__icon">' + ICON('i-alert') + '</span>' +
        '<span class="checklist__text">' + esc(s.full) + '<span class="checklist__sub" data-check-sub>' + esc(s.sub) + '</span></span>' +
        '<a class="btn btn--ghost btn--sm" href="#/' + s.id + '">Periksa</a>' +
        '</li>';
    }).join('');
  }

  /** Tampilkan satu view; perbarui navigasi & fokus. */
  function show(viewId, opts) {
    opts = opts || {};
    var isLanding = viewId === 'mulai';
    document.body.classList.toggle('is-landing', isLanding);

    PKL.$$('.view').forEach(function (v) {
      v.hidden = v.getAttribute('data-view') !== viewId;
    });

    PKL.$$('[data-step-link]').forEach(function (a) {
      if (a.getAttribute('data-step-link') === viewId) a.setAttribute('aria-current', 'step');
      else a.removeAttribute('aria-current');
    });

    var select = PKL.$('#mobile-step-select');
    if (select && !isLanding) select.value = viewId;

    updateStepNav(viewId);

    var step = PKL.getStep(viewId);
    document.title = (step ? 'Langkah ' + step.no + ': ' + step.title + ' · ' : viewId === 'ringkasan' ? 'Ringkasan · ' : '') + 'Generator Laporan PKL';

    if (!opts.initial) {
      window.scrollTo(0, 0);
      // Pindahkan fokus ke judul view agar pembaca layar mengumumkan halaman baru.
      var heading = PKL.$('[data-view="' + viewId + '"] h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }
  }

  function updateStepNav(viewId) {
    var nav = PKL.$('#step-nav');
    var idx = PKL.views.indexOf(viewId);
    nav.hidden = viewId === 'mulai';
    if (nav.hidden) return;

    var prev = PKL.$('[data-nav="prev"]', nav);
    var next = PKL.$('[data-nav="next"]', nav);
    var count = PKL.$('[data-nav="count"]', nav);
    var step = PKL.getStep(viewId);

    var prevId = PKL.views[idx - 1];
    var nextId = PKL.views[idx + 1];

    prev.href = '#/' + prevId;
    PKL.$('span', prev).textContent = prevId === 'mulai' ? 'Halaman Awal' : 'Sebelumnya';

    next.hidden = !nextId;
    if (nextId) {
      next.href = '#/' + nextId;
      PKL.$('span', next).textContent = viewId === 'ringkasan' ? 'Mulai Langkah 1' : 'Simpan & Lanjut';
    }

    count.textContent = step ? 'Langkah ' + step.no + ' dari ' + PKL.steps.length : '';
  }

  /** Perbarui semua indikator progres (0–100). */
  function setProgress(pct) {
    pct = Math.max(0, Math.min(100, Math.round(pct)));
    PKL.$$('[data-progress-text]').forEach(function (el) { el.textContent = pct + '%'; });
    PKL.$$('[data-progress-bar]').forEach(function (el) { el.style.width = pct + '%'; });
    var track = PKL.$('[data-progress-track]');
    if (track) track.setAttribute('aria-valuenow', String(pct));
  }

  /**
   * Tandai status langkah: 'done' | 'partial' | 'empty'.
   * Dipanggil oleh modul kelengkapan di Tahap 2.
   */
  function setStepStatus(stepId, status) {
    var link = PKL.$('.step-link[data-step-link="' + stepId + '"]');
    var marker = link && PKL.$('[data-step-marker]', link);
    var step = PKL.getStep(stepId);
    if (link) {
      link.classList.toggle('is-done', status === 'done');
      marker.innerHTML = status === 'done' ? ICON('i-check') : String(step.no);
    }

    var badge = PKL.$('[data-step-badge="' + stepId + '"]');
    if (badge) {
      badge.className = 'badge' + (status === 'done' ? ' badge--ok' : status === 'partial' ? ' badge--warn' : '');
      badge.textContent = status === 'done' ? 'Lengkap' : status === 'partial' ? 'Sebagian' : 'Belum diisi';
    }

    var check = PKL.$('[data-check="' + stepId + '"]');
    if (check) {
      check.classList.toggle('is-done', status === 'done');
      check.classList.toggle('is-missing', status !== 'done');
      PKL.$('.checklist__icon', check).innerHTML = ICON(status === 'done' ? 'i-check' : 'i-alert');
    }
  }

  PKL.stepRenderer = {
    init: function () {
      buildSidebar();
      buildMobileSelect();
      buildOverview();
      buildChecklist();
      PKL.steps.forEach(function (s) { setStepStatus(s.id, 'empty'); });
    },
    show: show,
    setProgress: setProgress,
    setStepStatus: setStepStatus
  };
})(window.PKL);

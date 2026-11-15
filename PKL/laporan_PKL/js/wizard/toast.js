/**
 * Notifikasi singkat (toast) di pojok layar — untuk kabar "berhasil" yang tidak
 * perlu dijawab (backup diekspor, laporan dibuat, baris otomatis ditambahkan).
 *
 *   PKL.toast('Laporan berhasil dibuat', { tone: 'success', title: 'Selesai', duration: 5000 })
 *
 * tone: 'success' (bawaan) | 'info' | 'warn' | 'error'. Hover/fokus = jeda hitung mundur.
 */
(function (PKL) {
  'use strict';

  var ICONS = { success: 'i-check', info: 'i-info', warn: 'i-alert', error: 'i-alert' };
  var MAX = 3;
  var region;

  function ensureRegion() {
    if (region) return region;
    region = document.createElement('div');
    region.className = 'toast-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
    return region;
  }

  function dismiss(el) {
    if (!el || el.classList.contains('is-leaving')) return;
    el.classList.add('is-leaving');
    setTimeout(function () { el.remove(); }, 220);
  }

  function toast(message, opts) {
    opts = opts || {};
    var tone = opts.tone || 'success';
    var duration = opts.duration || (tone === 'error' ? 8000 : 5000);
    var box = ensureRegion();

    var el = document.createElement('div');
    el.className = 'toast toast--' + tone;
    el.innerHTML =
      '<span class="toast__icon" aria-hidden="true"><svg><use href="#' + (ICONS[tone] || ICONS.info) + '"/></svg></span>' +
      '<div class="toast__body"><p class="toast__title"></p><p class="toast__msg"></p></div>' +
      '<button type="button" class="toast__close" aria-label="Tutup notifikasi">' +
        '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
      '</button>' +
      '<span class="toast__timer" aria-hidden="true"></span>';
    var title = PKL.$('.toast__title', el);
    if (opts.title) title.textContent = opts.title; else title.remove();
    PKL.$('.toast__msg', el).textContent = message;
    PKL.$('.toast__timer', el).style.animationDuration = duration + 'ms';

    PKL.$('.toast__close', el).addEventListener('click', function () { dismiss(el); });
    var timer = PKL.$('.toast__timer', el);
    timer.addEventListener('animationend', function () { dismiss(el); });

    box.appendChild(el);
    var all = PKL.$$('.toast:not(.is-leaving)', box);
    if (all.length > MAX) dismiss(all[0]);
    return el;
  }

  PKL.toast = toast;
})(window.PKL);

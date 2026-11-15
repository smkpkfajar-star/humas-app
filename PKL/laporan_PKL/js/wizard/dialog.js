/**
 * Dialog modern berbasis <dialog> native — pengganti window.alert/confirm
 * (fokus terkunci, Esc / klik di luar = batal, animasi buka-tutup).
 *
 *   PKL.dialog.choose({ title, message, tone, choices: [{label, value, variant}], cancelLabel })
 *     → Promise<value | null>
 *   PKL.dialog.confirm({ title, message, tone: 'danger', confirmLabel, cancelLabel })
 *     → Promise<boolean>
 *   PKL.dialog.alert({ title, message, tone: 'error', okLabel })
 *     → Promise<void>
 *
 * tone: 'info' (bawaan) | 'success' | 'warn' | 'danger' | 'error'
 * message: teks; baris baru = paragraf baru. Teks di antara **…** ditebalkan.
 */
(function (PKL) {
  'use strict';

  var ICONS = { info: 'i-info', success: 'i-check', warn: 'i-alert', danger: 'i-trash', error: 'i-alert' };
  var CLOSE_MS = 160;
  var dlg;
  var closing = false;

  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 'dialog';
    dlg.setAttribute('aria-labelledby', 'dialog-title');
    dlg.setAttribute('aria-describedby', 'dialog-body');
    dlg.innerHTML =
      '<form method="dialog" class="dialog__form">' +
        '<button type="submit" class="dialog__close" value="" aria-label="Tutup">' +
          '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</button>' +
        '<div class="dialog__head">' +
          '<span class="dialog__icon" aria-hidden="true"><svg><use href="#i-info"/></svg></span>' +
          '<h2 class="dialog__title" id="dialog-title"></h2>' +
        '</div>' +
        '<div class="dialog__body" id="dialog-body"></div>' +
        '<div class="dialog__actions"></div>' +
      '</form>';
    document.body.appendChild(dlg);

    // Tombol apa pun → tutup dengan animasi (bukan langsung oleh browser).
    PKL.$('form', dlg).addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = e.submitter;
      animateClose(btn ? btn.value : '');
    });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); animateClose(''); });   // Esc
    dlg.addEventListener('click', function (e) { if (e.target === dlg) animateClose(''); });  // klik di luar
  }

  function animateClose(value) {
    if (closing || !dlg.open) return;
    closing = true;
    dlg.classList.add('is-closing');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(function () {
      dlg.classList.remove('is-closing');
      closing = false;
      dlg.close(value);
    }, reduce ? 0 : CLOSE_MS);
  }

  /** Teks → paragraf; **tebal** didukung tanpa membuka celah HTML. */
  function fillBody(body, message) {
    body.textContent = '';
    String(message || '').split('\n').forEach(function (line) {
      if (!line.trim()) return;
      var p = document.createElement('p');
      line.split(/\*\*(.+?)\*\*/).forEach(function (part, i) {
        if (!part) return;
        if (i % 2) { var b = document.createElement('strong'); b.textContent = part; p.appendChild(b); }
        else p.appendChild(document.createTextNode(part));
      });
      body.appendChild(p);
    });
  }

  function button(label, value, variant) {
    var b = document.createElement('button');
    b.type = 'submit';
    b.className = 'btn btn--' + (variant || 'secondary');
    b.value = value;
    b.textContent = label;
    return b;
  }

  function choose(opts) {
    if (!dlg) build();
    if (dlg.open) dlg.close('');
    var tone = opts.tone || 'info';
    dlg.className = 'dialog dialog--' + tone;
    PKL.$('.dialog__icon use', dlg).setAttribute('href', '#' + (opts.icon || ICONS[tone] || ICONS.info));
    PKL.$('.dialog__title', dlg).textContent = opts.title || '';
    fillBody(PKL.$('.dialog__body', dlg), opts.message);

    var actions = PKL.$('.dialog__actions', dlg);
    actions.textContent = '';
    if (opts.cancelLabel !== false) actions.appendChild(button(opts.cancelLabel || 'Batal', '', 'ghost'));
    (opts.choices || []).forEach(function (c) { actions.appendChild(button(c.label, c.value, c.variant)); });

    return new Promise(function (resolve) {
      dlg.returnValue = '';
      dlg.addEventListener('close', function onClose() {
        dlg.removeEventListener('close', onClose);
        resolve(dlg.returnValue || null);
      });
      dlg.showModal();
      var primary = PKL.$('.dialog__actions .btn--primary, .dialog__actions .btn--danger', dlg);
      if (primary) primary.focus();
    });
  }

  function confirm(opts) {
    var tone = opts.tone || 'warn';
    return choose({
      title: opts.title, message: opts.message, tone: tone, icon: opts.icon,
      cancelLabel: opts.cancelLabel || 'Batal',
      choices: [{ label: opts.confirmLabel || 'Ya, Lanjutkan', value: 'ok', variant: tone === 'danger' ? 'danger' : 'primary' }]
    }).then(function (v) { return v === 'ok'; });
  }

  function alert(opts) {
    return choose({
      title: opts.title, message: opts.message, tone: opts.tone || 'info', icon: opts.icon,
      cancelLabel: false,
      choices: [{ label: opts.okLabel || 'Mengerti', value: 'ok', variant: 'primary' }]
    }).then(function () {});
  }

  PKL.dialog = { choose: choose, confirm: confirm, alert: alert };
})(window.PKL);

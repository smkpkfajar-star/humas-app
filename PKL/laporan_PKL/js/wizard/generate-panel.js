/**
 * Panel Langkah 7: tombol Generate, status, & pemilih templat (fallback file://).
 */
(function (PKL) {
  'use strict';

  var ICON_OK = '<svg aria-hidden="true"><use href="#i-check"/></svg>';
  var ICON_ALERT = '<svg aria-hidden="true"><use href="#i-alert"/></svg>';
  var busy = false;

  function el(sel) { return PKL.$(sel); }

  function showStatus(kind, message) {
    var box = el('[data-generate-status]');
    box.className = 'inline-status' + (kind === 'ok' ? '' : ' inline-status--' + kind);
    box.innerHTML = (kind === 'ok' ? ICON_OK : ICON_ALERT) + '<span></span>';
    box.lastChild.textContent = message;
    box.hidden = false;
  }

  function setBusy(on, label) {
    busy = on;
    var btn = el('[data-action="generate-docx"]');
    btn.disabled = on;
    btn.classList.toggle('is-loading', on);
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
    var text = btn.lastChild;
    if (!btn.hasAttribute('data-label')) btn.setAttribute('data-label', text.textContent);
    text.textContent = on ? ' ' + (label || 'Memproses…') : btn.getAttribute('data-label');
  }

  function formatBytes(n) {
    return n < 1024 * 1024 ? Math.round(n / 1024) + ' KB' : (n / 1024 / 1024).toFixed(1) + ' MB';
  }

  function run() {
    if (busy) return;
    PKL.state.flush();
    el('[data-generate-status]').hidden = true;
    setBusy(true, 'Memuat templat…');

    PKL.docx.generate(function (label) { setBusy(true, label); })
      .then(function (res) {
        el('[data-template-picker]').hidden = true;
        saveAs(res.blob, res.fileName);
        var msg = 'Laporan berhasil dibuat: ' + res.fileName + ' (' + formatBytes(res.blob.size) + '). Cek folder Unduhan.';
        if (res.warnings.length) msg += ' Catatan: ' + res.warnings.join(' ');
        showStatus(res.warnings.length ? 'warn' : 'ok', msg);
        PKL.toast(res.fileName + ' tersimpan di folder Unduhan.', { title: 'Laporan berhasil dibuat 🎉', duration: 7000 });
        var btn = el('[data-action="generate-docx"]');
        btn.classList.remove('is-success'); btn.getBoundingClientRect(); btn.classList.add('is-success');
        PKL.imageSlots.collectGarbage();
      })
      .catch(function (err) {
        if (err && err.code === 'NEED_TEMPLATE') {
          el('[data-template-picker]').hidden = false;
          showStatus('warn', 'Pilih file templat terlebih dahulu, lalu laporan akan langsung dibuat.');
          el('[data-action="pick-template"]').focus();
        } else {
          showStatus('error', err && err.message ? err.message : 'Gagal membuat laporan.');
        }
      })
      .then(function () { setBusy(false); });
  }

  PKL.generatePanel = {
    init: function () {
      var input = el('[data-template-input]');

      document.addEventListener('click', function (e) {
        if (e.target.closest('[data-action="generate-docx"]')) run();
        if (e.target.closest('[data-action="pick-template"]')) { input.value = ''; input.click(); }
      });

      input.addEventListener('change', function () {
        var file = input.files[0];
        if (!file) return;
        PKL.docx.useTemplateFile(file)
          .then(function () {
            el('[data-template-picker]').hidden = true;
            run();
          })
          .catch(function (err) { showStatus('error', err.message); });
      });
    },
    run: run
  };
})(window.PKL);

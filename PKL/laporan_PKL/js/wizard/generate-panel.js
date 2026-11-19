/**
 * Panel Langkah 7: tombol Generate .docx & Pratinjau PDF, status, & pemilih templat (fallback file://).
 */
(function (PKL) {
  'use strict';

  var ICON_OK = '<svg aria-hidden="true"><use href="#i-check"/></svg>';
  var ICON_ALERT = '<svg aria-hidden="true"><use href="#i-alert"/></svg>';
  var busy = false;
  var lastKind = 'docx';     // dijalankan ulang setelah templat dipilih

  function el(sel) { return PKL.$(sel); }

  function button(kind) { return el(kind === 'pdf' ? '[data-action="preview-pdf"]' : '[data-action="generate-docx"]'); }

  function showStatus(kind, message) {
    var box = el('[data-generate-status]');
    box.className = 'inline-status' + (kind === 'ok' ? '' : ' inline-status--' + kind);
    box.innerHTML = (kind === 'ok' ? ICON_OK : ICON_ALERT) + '<span></span>';
    box.lastChild.textContent = message;
    box.hidden = false;
  }

  function setBusy(kind, on, label) {
    busy = on;
    ['docx', 'pdf'].forEach(function (k) {
      var b = button(k);
      if (b) b.disabled = on;
    });
    var btn = button(kind);
    if (!btn) return;
    btn.classList.toggle('is-loading', on);
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
    var text = btn.lastChild;
    if (!btn.hasAttribute('data-label')) btn.setAttribute('data-label', text.textContent);
    text.textContent = on ? ' ' + (label || 'Memproses…') : btn.getAttribute('data-label');
  }

  function formatBytes(n) {
    return n < 1024 * 1024 ? Math.round(n / 1024) + ' KB' : (n / 1024 / 1024).toFixed(1) + ' MB';
  }

  function handleError(err) {
    // Templat belum ada, atau yang tersimpan di perangkat versi lama.
    if (err && (err.code === 'NEED_TEMPLATE' || err.code === 'OUTDATED_TEMPLATE')) {
      el('[data-template-picker]').hidden = false;
      showStatus('warn', err.code === 'OUTDATED_TEMPLATE'
        ? err.message + ' Laporan langsung dibuat setelah file dipilih.'
        : 'Pilih file templat terlebih dahulu, lalu laporan akan langsung dibuat.');
      el('[data-action="pick-template"]').focus();
    } else {
      if (window.console && err) console.error(err);
      showStatus('error', err && err.message ? err.message : 'Gagal membuat laporan.');
    }
  }

  function success(btn) {
    btn.classList.remove('is-success'); btn.getBoundingClientRect(); btn.classList.add('is-success');
    PKL.imageSlots.collectGarbage();
  }

  function runDocx() {
    var progress = function (label) { setBusy('docx', true, label); };
    return PKL.docx.generate(progress).then(function (res) {
      el('[data-template-picker]').hidden = true;
      saveAs(res.blob, res.fileName);
      var msg = 'Laporan berhasil dibuat: ' + res.fileName + ' (' + formatBytes(res.blob.size) + '). Cek folder Unduhan.';
      if (res.tocFilled) msg += ' Daftar Isi sudah terisi nomor halaman (' + res.pageCount + ' halaman).';
      if (res.notes && res.notes.length) msg += ' ' + res.notes.join(' ');
      if (res.warnings.length) msg += ' Catatan: ' + res.warnings.join(' ');
      showStatus(res.warnings.length ? 'warn' : 'ok', msg);
      PKL.toast(res.fileName + ' tersimpan di folder Unduhan.', { title: 'Laporan berhasil dibuat 🎉', duration: 7000 });
      success(button('docx'));
    });
  }

  function runPdf() {
    var progress = function (label) { setBusy('pdf', true, label); };
    var res;
    return PKL.docx.render(progress).then(function (r) {
      res = r;
      el('[data-template-picker]').hidden = true;
      return PKL.pdfPreview.show(res, progress);
    }).then(function (info) {
      var msg = 'Pratinjau PDF siap (' + info.pageCount + ' halaman). Tekan "Simpan sebagai PDF", lalu pilih Tujuan "Simpan sebagai PDF".';
      if (res.notes && res.notes.length) msg += ' ' + res.notes.join(' ');
      if (res.warnings.length) msg += ' Catatan: ' + res.warnings.join(' ');
      showStatus(res.warnings.length ? 'warn' : 'ok', msg);
      success(button('pdf'));
    });
  }

  function run(kind) {
    if (busy) return;
    lastKind = kind;
    PKL.state.flush();
    el('[data-generate-status]').hidden = true;
    setBusy(kind, true, 'Memuat templat…');
    (kind === 'pdf' ? runPdf() : runDocx())
      .catch(handleError)
      .then(function () { setBusy(kind, false); });
  }

  PKL.generatePanel = {
    init: function () {
      var input = el('[data-template-input]');

      document.addEventListener('click', function (e) {
        if (e.target.closest('[data-action="generate-docx"]')) run('docx');
        if (e.target.closest('[data-action="preview-pdf"]')) run('pdf');
        if (e.target.closest('[data-action="pick-template"]')) { input.value = ''; input.click(); }
      });

      input.addEventListener('change', function () {
        var file = input.files[0];
        if (!file) return;
        PKL.docx.useTemplateFile(file)
          .then(function () {
            el('[data-template-picker]').hidden = true;
            run(lastKind);
          })
          .catch(function (err) { showStatus('error', err.message); });
      });
    },
    run: function () { run('docx'); },
    runPdf: function () { run('pdf'); }
  };
})(window.PKL);

/**
 * Pratinjau PDF: laporan (.docx hasil generate) ditata ke halaman A4 oleh
 * PKL.pageLayout, ditampilkan di overlay, lalu "Simpan sebagai PDF" memakai
 * dialog cetak browser (Tujuan: Simpan sebagai PDF). 100% di perangkat, offline.
 *
 *   PKL.pdfPreview.show(res, onProgress) → Promise<{ pageCount }>
 *     res = hasil PKL.docx.render() (zip + fileName)
 */
(function (PKL) {
  'use strict';

  var overlay = null, pagesEl = null, scrollEl = null, infoEl = null, printBtn = null;
  var current = null;          // hasil layout aktif (untuk destroy)
  var returnFocus = null;
  var fileBase = 'Laporan_PKL';
  var savedTitle = null;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'pv-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Pratinjau PDF laporan');
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="pv-toolbar">' +
        '<button type="button" class="btn btn--secondary" data-pv="close">' +
          '<svg aria-hidden="true"><use href="#i-arrow-left"/></svg><span>Kembali</span></button>' +
        '<p class="pv-toolbar__info" data-pv="info" aria-live="polite"></p>' +
        '<button type="button" class="btn btn--primary" data-pv="print" disabled>' +
          '<svg aria-hidden="true"><use href="#i-download"/></svg><span>Simpan sebagai PDF</span></button>' +
      '</div>' +
      '<div class="pv-scroll" data-pv="scroll"><div class="pv-pages" data-pv="pages"></div></div>';
    document.body.appendChild(overlay);
    pagesEl = overlay.querySelector('[data-pv="pages"]');
    scrollEl = overlay.querySelector('[data-pv="scroll"]');
    infoEl = overlay.querySelector('[data-pv="info"]');
    printBtn = overlay.querySelector('[data-pv="print"]');

    overlay.addEventListener('click', function (e) {
      if (e.target.closest('[data-pv="close"]')) close();
      if (e.target.closest('[data-pv="print"]')) print();
    });
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    window.addEventListener('resize', fit);
    window.addEventListener('afterprint', function () {
      if (savedTitle !== null) { document.title = savedTitle; savedTitle = null; }
    });
  }

  /** Perkecil halaman agar muat di layar HP (tidak memengaruhi hasil cetak). */
  function fit() {
    if (!overlay || overlay.hidden || !pagesEl.firstChild) return;
    var pageW = pagesEl.firstChild.offsetWidth;
    var avail = scrollEl.clientWidth - 16;
    var s = Math.min(1, avail / pageW);
    pagesEl.style.zoom = s < 1 ? s.toFixed(4) : '';
  }

  function clear() {
    if (current) { current.destroy(); current = null; }
    pagesEl.innerHTML = '';
    pagesEl.style.zoom = '';
  }

  function waitImages() {
    var imgs = Array.prototype.slice.call(pagesEl.querySelectorAll('img'));
    return Promise.all(imgs.map(function (img) {
      if (img.complete) return null;
      return (img.decode ? img.decode() : new Promise(function (r) { img.onload = img.onerror = r; })).catch(function () {});
    }));
  }

  function show(res, onProgress) {
    if (!overlay) build();
    var progress = onProgress || function () {};
    clear();
    fileBase = String(res.fileName || 'Laporan_PKL').replace(/\.docx$/i, '');
    printBtn.disabled = true;
    // Tata letak butuh elemen yang tampil (bukan display:none) untuk diukur.
    overlay.hidden = false;
    overlay.style.visibility = 'hidden';
    progress('Menyusun halaman…');
    return PKL.pageLayout.layout(res.zip, pagesEl).then(function (lay) {
      current = lay;
      returnFocus = document.activeElement;
      document.documentElement.classList.add('pv-open');
      overlay.style.visibility = '';
      infoEl.innerHTML = '';
      var strong = document.createElement('strong');
      strong.textContent = lay.pageCount + ' halaman';
      infoEl.appendChild(strong);
      infoEl.appendChild(document.createTextNode(' · Di jendela cetak pilih Tujuan/Printer: "Simpan sebagai PDF".'));
      scrollEl.scrollTop = 0;
      fit();
      printBtn.focus();
      return waitImages().then(function () {
        printBtn.disabled = false;
        return { pageCount: lay.pageCount };
      });
    }, function (err) {
      overlay.hidden = true;
      overlay.style.visibility = '';
      clear();
      throw err;
    });
  }

  function print() {
    if (printBtn.disabled) return;
    savedTitle = document.title;
    document.title = fileBase;              // nama file PDF bawaan di dialog cetak
    window.print();
    // Safari/beberapa browser HP tidak memicu afterprint.
    setTimeout(function () { if (savedTitle !== null) { document.title = savedTitle; savedTitle = null; } }, 3000);
  }

  function close() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    document.documentElement.classList.remove('pv-open');
    clear();
    if (returnFocus && returnFocus.focus) returnFocus.focus();
  }

  PKL.pdfPreview = { show: show, close: close, print: function () { print(); } };
})(window.PKL);

/**
 * Namespace global aplikasi.
 *
 * Aplikasi memakai <script> klasik (bukan ES Modules) agar tetap berjalan
 * saat index.html dibuka langsung lewat file:// di komputer lab.
 * Setiap file mendaftarkan dirinya ke window.PKL, mis. PKL.repeater.
 * Urutan <script> di index.html = urutan dependensi.
 */
(function () {
  'use strict';

  var PKL = (window.PKL = window.PKL || {});

  /** querySelector singkat. */
  PKL.$ = function (selector, root) {
    return (root || document).querySelector(selector);
  };

  /** querySelectorAll → Array. */
  PKL.$$ = function (selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  };

  /** Kirim CustomEvent di document (bus event sederhana antar-modul). */
  PKL.emit = function (name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail: detail }));
  };

  /** Dengarkan CustomEvent di document. */
  PKL.on = function (name, handler) {
    document.addEventListener(name, function (e) { handler(e.detail, e); });
  };

  /** Unduh Blob/teks sebagai file (tanpa library; FileSaver dipakai di Tahap 4). */
  PKL.download = function (filename, content, mime) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  };

  var uid = 0;
  /** ID unik untuk menghubungkan <label for> dengan input yang dibuat dinamis. */
  PKL.uid = function (prefix) {
    uid += 1;
    return (prefix || 'pkl') + '-' + uid;
  };
})();

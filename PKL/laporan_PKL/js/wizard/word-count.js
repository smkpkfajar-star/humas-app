/**
 * Penghitung kata di bawah setiap isian narasi.
 * Target hanya SARAN (tidak memengaruhi status "Lengkap"), supaya siswa tahu
 * kira-kira sepanjang apa sebuah bagian sebaiknya ditulis.
 */
(function (PKL) {
  'use strict';

  /** Saran jumlah kata minimal per isian. Isian yang tidak disebut hanya ditampilkan jumlahnya. */
  var TARGETS = {
    dudi_sejarah: 80,
    dudi_kegiatan_utama: 40,
    dudi_fasilitas: 30,
    bab1_latar_belakang: 80,
    bab1_tujuan_khusus: 25,
    bab1_ruang_lingkup: 40,
    bab3_uraian_kegiatan: 150,
    bab4_analisis: 120,
    bab4_pembelajaran: 60,
    bab4_kesesuaian: 60,
    bab5_kesimpulan: 80,
    saran_sekolah: 20,
    saran_dudi: 20,
    saran_siswa: 20,
    refleksi_1: 25,
    refleksi_2: 25,
    refleksi_3: 25,
    refleksi_4: 25,
    refleksi_5: 25
  };
  /** Isian yang bukan narasi (alamat, daftar pustaka) tidak diberi penghitung. */
  var SKIP = { siswa_alamat: 1, dudi_alamat: 1, daftar_pustaka: 1 };

  function countWords(text) {
    var m = String(text || '').match(/[\p{L}\p{N}]+(?:[’'\-][\p{L}\p{N}]+)*/gu);
    return m ? m.length : 0;
  }

  function render(el) {
    var name = el.getAttribute('data-word-count-for');
    var field = PKL.$('textarea[name="' + name + '"]');
    if (!field) return;
    var n = countWords(field.value);
    var target = TARGETS[name];
    var text;
    var state = '';
    if (!target) {
      text = n ? n + ' kata' : '';
    } else if (n === 0) {
      text = 'Saran: minimal ' + target + ' kata';
    } else if (n < target) {
      text = n + ' kata · saran minimal ' + target + ' kata (kurang ' + (target - n) + ')';
      state = 'short';
    } else {
      text = n + ' kata · panjang sudah cukup';
      state = 'ok';
    }
    el.textContent = text;
    el.hidden = !text;
    if (state) el.setAttribute('data-state', state); else el.removeAttribute('data-state');
  }

  function counterFor(name) {
    return PKL.$('[data-word-count-for="' + name + '"]');
  }

  function updateAll() {
    PKL.$$('[data-word-count-for]').forEach(render);
  }

  PKL.wordCount = {
    init: function () {
      PKL.$$('#report-form textarea[name]').forEach(function (ta) {
        if (SKIP[ta.name]) return;
        var p = document.createElement('p');
        p.className = 'help word-count';
        p.setAttribute('data-word-count-for', ta.name);
        ta.after(p);
      });
      document.addEventListener('input', function (e) {
        var c = e.target.name && counterFor(e.target.name);
        if (c) render(c);
      });
      PKL.on('pkl:state-change', function (d) {
        var c = d.key && counterFor(d.key);
        if (c) render(c);
      });
      updateAll();
    },
    countWords: countWords,
    targets: TARGETS,
    updateAll: updateAll
  };
})(window.PKL);

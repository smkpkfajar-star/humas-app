/**
 * Panduan & contoh penulisan per isian (data: js/data/writing-prompts.js).
 *
 * - Dipasang otomatis di atas setiap isian / tabel yang punya panduan
 *   (menggantikan panduan statis lama di index.html).
 * - Contoh mengikuti jurusan yang dipilih siswa dan berganti saat jurusan diubah.
 * - Status buka/tutup setiap panduan dipertahankan saat konten diganti.
 */
(function (PKL) {
  'use strict';

  var JURUSAN_NAMA = { DKV: 'Desain Komunikasi Visual', RPL: 'Rekayasa Perangkat Lunak', TITL: 'Teknik Instalasi Tenaga Listrik', TSM: 'Teknik dan Bisnis Sepeda Motor', TKR: 'Teknik Kendaraan Ringan' };
  var FALLBACK = 'RPL';

  /** Judul kolom contoh tabel (urutan = urutan kolom di contoh "a | b | c"). */
  var TABLE_HEADS = {
    list_kompetensi: ['Kompetensi / Materi', 'Target', 'Ketercapaian'],
    list_peralatan: ['Alat / Perangkat / Bahan', 'Fungsi'],
    list_kendala: ['Kendala', 'Solusi'],
    list_jurnal: ['Hari, Tanggal', 'Kegiatan', 'Kompetensi', 'Output']
  };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function currentJurusan() {
    var k = PKL.state && PKL.state.get('jurusan_kode');
    return JURUSAN_NAMA[k] ? k : null;
  }

  function exampleNode(field, spec, kode) {
    var text = spec.ex[kode] || '';
    var lines = text.split('\n').filter(function (l) { return l.trim() !== ''; });
    if (spec.table) {
      var heads = TABLE_HEADS[field] || [];
      var wrap = el('div', 'guide__table-wrap');
      var table = el('table', 'guide__table');
      var thead = el('thead');
      var hr = el('tr');
      heads.forEach(function (h) { hr.appendChild(el('th', null, h)); });
      thead.appendChild(hr);
      table.appendChild(thead);
      var tbody = el('tbody');
      lines.forEach(function (line) {
        var tr = el('tr');
        line.split('|').forEach(function (cell, i) {
          var td = el('td', null, cell.trim());
          if (heads[i]) td.setAttribute('data-label', heads[i]);   // label kolom untuk tampilan HP
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      wrap.appendChild(table);
      return wrap;
    }
    var q = el('blockquote', 'guide__example');
    lines.forEach(function (line) { q.appendChild(el('p', null, line)); });
    return q;
  }

  function fillGuide(details, field) {
    var spec = PKL.prompts.fields[field];
    var chosen = currentJurusan();
    var kode = chosen || FALLBACK;

    var summary = el('summary');
    summary.appendChild(document.createTextNode('Panduan & contoh penulisan'));
    summary.appendChild(el('span', 'guide__badge', kode));

    var body = el('div', 'guide__body');
    body.appendChild(el('p', 'guide__lead', spec.lead));

    if (spec.points && spec.points.length) {
      body.appendChild(el('p', 'guide__label', 'Yang perlu ada'));
      var ul = el('ul', 'guide__points');
      spec.points.forEach(function (p) { ul.appendChild(el('li', null, p)); });
      body.appendChild(ul);
    }

    body.appendChild(el('p', 'guide__label', 'Contoh — ' + JURUSAN_NAMA[kode]));
    if (!chosen) body.appendChild(el('p', 'guide__hint', 'Pilih kompetensi keahlian di halaman awal agar contoh sesuai jurusanmu.'));
    body.appendChild(exampleNode(field, spec, kode));

    if (spec.avoid) {
      var avoid = el('p', 'guide__avoid');
      avoid.appendChild(el('strong', null, 'Hindari: '));
      avoid.appendChild(document.createTextNode(spec.avoid));
      body.appendChild(avoid);
    }
    body.appendChild(el('p', 'guide__note', PKL.prompts.note));

    details.textContent = '';
    details.appendChild(summary);
    details.appendChild(body);
  }

  /** Letakkan panduan di atas kontrol isian atau tabel dinamis. */
  function mount(field) {
    var anchor = PKL.$('[data-repeater="' + field + '"]') || PKL.$('[name="' + field + '"]');
    if (!anchor) return null;

    var details = PKL.$('details.guide[data-prompt="' + field + '"]');
    if (!details) {
      details = el('details', 'guide');
      details.setAttribute('data-prompt', field);
    }
    if (anchor.hasAttribute('data-repeater')) {
      anchor.before(details);
    } else {
      // Buang panduan statis lama di field yang sama, lalu pasang tepat di atas kontrol.
      var fieldEl = anchor.closest('.field');
      if (fieldEl) PKL.$$('details.guide', fieldEl).forEach(function (d) { if (d !== details) d.remove(); });
      anchor.before(details);
    }
    return details;
  }

  function renderAll() {
    Object.keys(PKL.prompts.fields).forEach(function (field) {
      var d = PKL.$('details.guide[data-prompt="' + field + '"]');
      if (d) {
        var open = d.open;
        fillGuide(d, field);
        d.open = open;
      }
    });
  }

  PKL.writingGuides = {
    init: function () {
      if (!PKL.prompts) return;
      Object.keys(PKL.prompts.fields).forEach(mount);
      renderAll();
      PKL.on('pkl:state-change', function (d) { if (d.key === 'jurusan_kode') renderAll(); });
    },
    renderAll: renderAll
  };
})(window.PKL);

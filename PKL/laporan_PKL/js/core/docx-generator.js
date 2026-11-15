/**
 * Engine generate .docx di browser (FR-07).
 *
 *   PKL.docx.generate(onProgress) → Promise<{ blob, fileName, warnings }>
 *   PKL.docx.buildData(state)     → objek data siap render (murni, bisa diuji)
 *   PKL.docx.useTemplateFile(f)   → pakai templat pilihan pengguna (fallback file://)
 *
 * Library (vendor/, global): PizZip, docxtemplater, ImageModule, saveAs.
 * Templat: v12 (sintaks Docxtemplater) — lihat tools/convert-template.py.
 */
(function (PKL) {
  'use strict';

  var TEMPLATE_URL = 'assets/templates/Template_Laporan_PKL_Otomatis_v12.docx';
  // Revisi templat: naikkan bila v12 dibuat ulang dengan perubahan struktur,
  // agar templat lama yang tersimpan di perangkat (file://) tidak dipakai lagi.
  var TEMPLATE_CACHE_KEY = '__template_v12r6__';
  var OLD_CACHE_KEYS = ['__template_v12__', '__template_v12r2__', '__template_v12r3__', '__template_v12r4__', '__template_v12r5__'];
  var TEMPLATE_MARKER = '{@daftar_pustaka}';
  var DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  var DATE_FIELDS = ['tgl_mulai', 'tgl_selesai', 'tgl_pengesahan'];
  var IMAGE_FIELDS = ['dudi_struktur_img', 'lampiran_sk_penempatan', 'lampiran_surat_selesai'];

  /**
   * Kolom tiap tabel dinamis. `key` = kolom penentu baris terisi.
   * `numbered` = punya kolom {no} di templat.
   */
  var LISTS = {
    list_kompetensi:       { cols: ['kompetensi', 'target', 'ketercapaian'], key: ['kompetensi'], numbered: true },
    list_peralatan:        { cols: ['nama', 'fungsi'], key: ['nama'], numbered: true },
    list_kendala:          { cols: ['kendala', 'solusi'], key: ['kendala', 'solusi'], numbered: true },
    list_jurnal:           { cols: ['tanggal', 'kegiatan', 'kompetensi', 'output', 'validasi'], key: ['tanggal', 'kegiatan'], numbered: true },
    list_presensi_bulanan: { cols: ['bulan', 'hadir', 'izin', 'sakit', 'alpha'], key: ['bulan'], numbered: false, max: 6 },
    list_dokumentasi:      { cols: ['foto', 'tanggal', 'lokasi', 'keterangan'], key: ['foto', 'keterangan'], numbered: false }
  };

  function blank(v) { return v === undefined || v === null || String(v).trim() === ''; }

  /**
   * Buang karakter yang DILARANG di XML 1.0 (sering terbawa saat menyalin dari
   * PDF/web: \u000B, \u0000, ￾, setengah emoji, dll.). Satu saja karakter
   * ini membuat Word menolak membuka file ("unreadable content").
   */
  var XML_INVALID = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/g;
  function cleanText(v) {
    if (v === undefined || v === null) return '';
    return String(v).replace(XML_INVALID, function (m, pre) { return pre || ''; });
  }

  // ----------------------------------------------------------- Data laporan

  function buildList(name, rows) {
    var spec = LISTS[name];
    var clean = (rows || []).filter(function (r) {
      return r && spec.key.some(function (k) { return !blank(r[k]); });
    }).map(function (r) {
      var out = {};
      spec.cols.forEach(function (c) {
        var v = cleanText(r[c]).trim();
        if (name === 'list_presensi_bulanan' && c !== 'bulan') v = String(PKL.calc.toDays(v));
        out[c] = v;
      });
      return out;
    });

    if (spec.max) clean = clean.slice(0, spec.max);   // mis. presensi maks. 6 bulan

    // Tabel Word tidak boleh kosong: isi 1 baris "-" (development.md 3.C).
    if (!clean.length) {
      var dash = {};
      spec.cols.forEach(function (c) { dash[c] = c === 'foto' ? '' : '-'; });
      if (spec.numbered) dash.no = '-';
      return [dash];
    }
    return spec.numbered ? PKL.calc.numberRows(clean) : clean;
  }

  /** State aplikasi → data untuk templat (fungsi murni). */
  function buildData(state) {
    var s = state || {};
    var data = {};
    Object.keys(s).forEach(function (k) {
      if (k.charAt(0) === '_' || Array.isArray(s[k])) return;
      data[k] = cleanText(s[k]);
    });
    delete data.jurusan_kode;

    DATE_FIELDS.forEach(function (k) { data[k] = PKL.calc.formatDate(s[k]) || ''; });

    Object.keys(LISTS).forEach(function (name) { data[name] = buildList(name, s[name]); });

    // Rekap presensi dihitung ulang dari baris yang benar-benar dipakai.
    var real = data.list_presensi_bulanan.filter(function (r) { return r.bulan !== '-'; });
    var att = PKL.calc.attendance(real);
    Object.keys(att).forEach(function (k) { data[k] = String(att[k]); });

    var dur = PKL.calc.duration(s.tgl_mulai, s.tgl_selesai);
    data.lama_pelaksanaan = dur && !dur.error ? dur.text : (data.lama_pelaksanaan || '');

    if (!data.sekolah_nama) data.sekolah_nama = PKL.master.sekolah.nama;
    if (!data.kompetensi_keahlian && s.jurusan_kode) data.kompetensi_keahlian = PKL.master.kompetensiLabel(s.jurusan_kode);
    if (!data.tahun_cetak) data.tahun_cetak = String(new Date().getFullYear());

    IMAGE_FIELDS.forEach(function (k) { data[k] = s[k] || ''; });
    return data;
  }

  // ---------------------------------------------------------------- Templat

  /** Pastikan ArrayBuffer adalah templat v12 yang benar. Melempar Error ramah. */
  function validateTemplate(buf) {
    var zip;
    try { zip = new PizZip(buf); } catch (e) {
      throw new Error('File yang dipilih bukan dokumen Word (.docx) yang valid.');
    }
    var docXml = zip.file('word/document.xml');
    var text = docXml ? docXml.asText() : '';
    if (text.indexOf('{%tr') !== -1 || text.indexOf('{{siswa_nama}}') !== -1) {
      throw new Error('Ini templat versi lama (v11). Pilih file Template_Laporan_PKL_Otomatis_v12.docx.');
    }
    if (text.indexOf('{siswa_nama}') === -1 || text.indexOf('{#list_jurnal}') === -1) {
      throw new Error('File ini bukan Template_Laporan_PKL_Otomatis_v12.docx.');
    }
    if (text.indexOf(TEMPLATE_MARKER) === -1) {
      var old = new Error('Ini templat v12 versi lama (sebelum dirapikan). Pilih file Template_Laporan_PKL_Otomatis_v12.docx yang terbaru.');
      old.code = 'OUTDATED_TEMPLATE';
      throw old;
    }
    return buf;
  }

  /**
   * Urutan: fetch (server) → cache IndexedDB (pernah dipilih) → minta pengguna.
   * Di file:// Chrome memblokir fetch, jadi fallback dipakai.
   */
  function loadTemplate() {
    var fromCache = function () {
      return PKL.images.get(TEMPLATE_CACHE_KEY).then(function (rec) {
        if (rec && rec.buffer) return validateTemplate(rec.buffer);
        var err = new Error('Templat belum tersedia.');
        err.code = 'NEED_TEMPLATE';
        throw err;
      });
    };
    // file:// → fetch pasti diblokir CORS; langsung pakai templat yang pernah dipilih.
    if (location.protocol === 'file:') return fromCache();

    return fetch(TEMPLATE_URL, { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.arrayBuffer();
      })
      .then(validateTemplate)
      .catch(fromCache);
  }

  function useTemplateFile(file) {
    if (!file) return Promise.reject(new Error('Tidak ada file dipilih.'));
    return file.arrayBuffer().then(validateTemplate).then(function (buf) {
      return PKL.images.put(TEMPLATE_CACHE_KEY, { buffer: buf, name: file.name, savedAt: new Date().toISOString() })
        .then(function () {
          return Promise.all(OLD_CACHE_KEYS.map(function (k) { return PKL.images.remove(k).catch(function () {}); }));
        })
        .then(function () { return buf; });
    });
  }

  // ---------------------------------------------------------------- Gambar

  /** Muat semua gambar yang dirujuk data → { key: { buffer, size: [w, h] } }. */
  function loadImages(data, warnings) {
    var keys = [];
    IMAGE_FIELDS.forEach(function (k) { if (data[k]) keys.push(data[k]); });
    data.list_dokumentasi.forEach(function (r) { if (r.foto) keys.push(r.foto); });

    var store = {};
    return Promise.all(keys.map(function (key) {
      return PKL.images.get(key).then(function (rec) {
        if (!rec || !rec.blob) return;
        return rec.blob.arrayBuffer().then(function (buf) {
          store[key] = { buffer: buf, size: [rec.displayWidth, rec.displayHeight] };
        });
      });
    })).then(function () {
      // Kunci tanpa gambar (mis. data situs dibersihkan) → kosongkan agar render tidak gagal.
      var missing = 0;
      IMAGE_FIELDS.forEach(function (k) { if (data[k] && !store[data[k]]) { data[k] = ''; missing++; } });
      data.list_dokumentasi.forEach(function (r) { if (r.foto && !store[r.foto]) { r.foto = ''; missing++; } });
      if (missing) warnings.push(missing + ' gambar tidak ditemukan di perangkat ini dan dilewati.');
      return store;
    });
  }

  // ------------------------------------------------------ Paragraf isian {@x}

  /**
   * Isian panjang ditandai {@nama} di templat (tools/tidy_template.py). Tag ini
   * menggantikan SELURUH paragraf, jadi format paragraf aslinya diambil dulu
   * dari templat lalu dipakai ulang untuk setiap baris yang diketik siswa.
   */
  function extractParagraphSpecs(zip) {
    var xml = zip.file('word/document.xml').asText();
    var specs = {};
    var re = /<w:p\b(?:(?!<\/w:p>)[\s\S])*?\{@(\w+)\}[\s\S]*?<\/w:p>/g;
    var m;
    while ((m = re.exec(xml))) {
      var p = m[0];
      var pPr = (/<w:pPr>[\s\S]*?<\/w:pPr>/.exec(p) || [''])[0];
      var run = new RegExp('<w:r\\b[^>]*>(<w:rPr>(?:(?!<\\/w:rPr>)[\\s\\S])*<\\/w:rPr>)?(?:(?!<\\/w:r>)[\\s\\S])*?\\{@' + m[1] + '\\}').exec(p);
      specs[m[1]] = { pPr: pPr, rPr: run && run[1] ? run[1] : '' };
    }
    return specs;
  }

  function xmlEscape(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** Ganti / sisipkan <w:ind> pada posisi sesuai urutan skema pPr. */
  function setIndent(pPr, ind) {
    if (!pPr) return '<w:pPr>' + ind + '</w:pPr>';
    if (/<w:ind\b[^>]*\/>/.test(pPr)) return pPr.replace(/<w:ind\b[^>]*\/>/, ind);
    var after = /<w:(contextualSpacing|mirrorIndents|suppressOverlap|jc|textDirection|textAlignment|textboxTightWrap|outlineLvl|divId|cnfStyle|rPr|sectPr|pPrChange)\b/.exec(pPr);
    var at = after ? after.index : pPr.lastIndexOf('</w:pPr>');
    return pPr.slice(0, at) + ind + pPr.slice(at);
  }

  function leftIndent(pPr) {
    var m = /<w:ind\b[^>]*\bw:(?:left|start)="(\d+)"/.exec(pPr || '');
    return m ? +m[1] : 0;
  }

  // "1. teks", "1) teks", "a. teks", "- teks", "• teks"
  var LIST_LINE = /^((?:\d{1,2}|[a-zA-Z])[.)]|[-•*–])\s+(.+)$/;

  /**
   * Teks (boleh multi-baris) → XML paragraf.
   *   - Tiap baris = satu paragraf dengan format templat (indentasi baris pertama).
   *   - Baris berawalan nomor/huruf/bullet = daftar dengan indentasi menggantung,
   *     sama seperti daftar bawaan templat (left +709, hanging 369).
   *   - daftar_pustaka: indentasi menggantung gaya APA.
   */
  function paragraphsXml(field, text, spec) {
    var pPr = spec.pPr;
    var rPr = spec.rPr;
    var lines = String(text || '').replace(/\r\n?/g, '\n').split('\n')
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l !== ''; });
    if (!lines.length) return '<w:p>' + pPr + '</w:p>';

    var base = leftIndent(pPr);
    return lines.map(function (line) {
      var ppr = pPr;
      var runs;
      var li = field === 'daftar_pustaka' ? null : LIST_LINE.exec(line);
      if (field === 'daftar_pustaka') {
        ppr = setIndent(pPr, '<w:ind w:left="' + (base + 709) + '" w:hanging="709"/>');
        runs = '<w:r>' + rPr + '<w:t xml:space="preserve">' + xmlEscape(line) + '</w:t></w:r>';
      } else if (li) {
        var marker = /^[-*–]$/.test(li[1]) ? '•' : li[1];
        ppr = setIndent(pPr, '<w:ind w:left="' + (base + 709) + '" w:hanging="369"/>');
        runs = '<w:r>' + rPr + '<w:t xml:space="preserve">' + xmlEscape(marker) + '</w:t><w:tab/>' +
               '<w:t xml:space="preserve">' + xmlEscape(li[2]) + '</w:t></w:r>';
      } else {
        runs = '<w:r>' + rPr + '<w:t xml:space="preserve">' + xmlEscape(line) + '</w:t></w:r>';
      }
      return '<w:p>' + ppr + runs + '</w:p>';
    }).join('');
  }

  // ---------------------------------------------------------------- Render

  function friendlyRenderError(e) {
    var errs = (e && e.properties && e.properties.errors) || [];
    if (errs.length) {
      var detail = errs.slice(0, 3).map(function (x) {
        return (x.properties && (x.properties.explanation || x.properties.id)) || x.message;
      }).join('; ');
      return new Error('Templat tidak dapat diproses: ' + detail);
    }
    return new Error('Gagal menyusun dokumen: ' + (e && e.message ? e.message : 'kesalahan tidak dikenal'));
  }

  function generate(onProgress) {
    var progress = onProgress || function () {};
    var warnings = [];
    var data = buildData(PKL.state.all());

    progress('Memuat templat…');
    return loadTemplate().then(function (templateBuf) {
      progress('Menyiapkan gambar…');
      return loadImages(data, warnings).then(function (store) {
        progress('Menyusun dokumen…');
        var zip = new PizZip(templateBuf);
        var specs = extractParagraphSpecs(zip);
        Object.keys(specs).forEach(function (field) {
          data[field] = paragraphsXml(field, data[field], specs[field]);
        });
        var imageModule = new ImageModule({
          centered: false,
          getImage: function (key) { return store[key].buffer; },
          getSize: function (img, key) { return store[key].size; }
        });
        var doc;
        try {
          doc = new docxtemplater(zip, {
            modules: [imageModule],
            paragraphLoop: true,
            linebreaks: true,
            nullGetter: function () { return ''; }
          });
          doc.render(data);
        } catch (e) {
          throw friendlyRenderError(e);
        }
        var blob = doc.getZip().generate({ type: 'blob', mimeType: DOCX_MIME, compression: 'DEFLATE' });
        return {
          blob: blob,
          fileName: PKL.calc.fileName(PKL.state.get('siswa_nama'), PKL.state.get('siswa_kelas')),
          warnings: warnings
        };
      });
    });
  }

  PKL.docx = {
    TEMPLATE_URL: TEMPLATE_URL,
    buildData: buildData,
    cleanText: cleanText,
    paragraphsXml: paragraphsXml,
    extractParagraphSpecs: extractParagraphSpecs,
    generate: generate,
    loadTemplate: loadTemplate,
    useTemplateFile: useTemplateFile,
    validateTemplate: validateTemplate
  };
})(window.PKL);

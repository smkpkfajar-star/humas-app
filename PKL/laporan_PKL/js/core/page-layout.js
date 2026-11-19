/**
 * Tata letak halaman A4 dari dokumen .docx hasil generate (untuk PDF & Daftar Isi).
 *
 *   PKL.pageLayout.layout(zip, host) → Promise<{ pages, bookmarks, pageCount, destroy }>
 *     zip   : PizZip dokumen yang SUDAH dirender docxtemplater
 *     host  : elemen tujuan halaman (mis. overlay pratinjau). Halaman = .pv-page.
 *     bookmarks: { bm_bab1: '1', bm_daftar_isi: 'v', … } → nomor halaman tiap judul.
 *
 * Bukan penampil .docx umum: cukup untuk fitur yang dipakai templat laporan PKL
 * (paragraf, run tebal/kapital/ukuran, tab Daftar Isi & daftar menggantung, tabel
 * berbatas dengan baris judul berulang, gambar inline, field PAGEREF, section dengan
 * penomoran romawi/angka). Aturan pemotongan halaman mengikuti Word:
 * keepNext, keepLines, pageBreakBefore, cantSplit, tblHeader, widow/orphan 2 baris,
 * dan spasi-sebelum dihapus di awal halaman (pemotongan alami).
 */
(function (PKL) {
  'use strict';

  var W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  var R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  var A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  var WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';

  var LINE_FACTOR = 1.15;     // 1 baris "single" Arial di Word = 1,15 × ukuran font
  var DEFAULT_TAB = 48;       // tab bawaan Word 1,27 cm
  var EPS = 0.5;              // toleransi pembulatan (px)

  function tw(v) { return (+v || 0) / 15; }                 // twip → px (96 dpi)
  function hp(v) { return (+v || 0) / 2 * 96 / 72; }        // setengah-poin → px

  // --------------------------------------------------------------- XML util

  function kids(el, name) {
    var out = [];
    if (!el) return out;
    for (var c = el.firstElementChild; c; c = c.nextElementSibling) {
      if (c.namespaceURI === W && (!name || c.localName === name)) out.push(c);
    }
    return out;
  }
  function child(el, name) { return kids(el, name)[0] || null; }
  function attr(el, name) { return el && el.hasAttributeNS(W, name) ? el.getAttributeNS(W, name) : null; }
  function toggle(el) {
    if (!el) return undefined;
    var v = attr(el, 'val');
    return !(v === '0' || v === 'false' || v === 'none');
  }
  function parseXml(text) {
    var d = new DOMParser().parseFromString(text, 'application/xml');
    if (d.getElementsByTagName('parsererror').length) throw new Error('XML dokumen tidak valid.');
    return d;
  }
  function extend(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) if (b[k] !== undefined) o[k] = b[k]; return o; }

  // ---------------------------------------------------------------- Gaya

  function readPPr(pPr) {
    var o = {};
    if (!pPr) return o;
    var x;
    if ((x = child(pPr, 'pStyle'))) o.pStyle = attr(x, 'val');
    if ((x = child(pPr, 'jc'))) o.jc = attr(x, 'val');
    if ((x = child(pPr, 'spacing'))) ['before', 'after', 'line', 'lineRule'].forEach(function (k) {
      var v = attr(x, k); if (v !== null) o[k] = v;
    });
    if ((x = child(pPr, 'ind'))) {
      var l = attr(x, 'left') || attr(x, 'start'), r = attr(x, 'right') || attr(x, 'end');
      if (l !== null) o.left = +l;
      if (r !== null) o.right = +r;
      if (attr(x, 'hanging') !== null) { o.hanging = +attr(x, 'hanging'); o.firstLine = 0; }
      if (attr(x, 'firstLine') !== null) { o.firstLine = +attr(x, 'firstLine'); o.hanging = 0; }
    }
    ['keepNext', 'keepLines', 'pageBreakBefore', 'widowControl'].forEach(function (k) {
      var e = child(pPr, k); if (e) o[k] = toggle(e);
    });
    if ((x = child(pPr, 'tabs'))) o.tabs = kids(x, 'tab').map(function (t) {
      return { val: attr(t, 'val'), pos: +attr(t, 'pos'), leader: attr(t, 'leader') };
    });
    return o;
  }

  function readRPr(rPr) {
    var o = {};
    if (!rPr) return o;
    var x;
    ['b', 'i', 'caps', 'vanish'].forEach(function (k) { var e = child(rPr, k); if (e) o[k] = toggle(e); });
    if ((x = child(rPr, 'u'))) o.u = attr(x, 'val') !== 'none';
    if ((x = child(rPr, 'sz'))) o.sz = +attr(x, 'val');
    if ((x = child(rPr, 'color'))) o.color = attr(x, 'val');
    return o;
  }

  function Styles(stylesXml) {
    var doc = stylesXml ? parseXml(stylesXml) : null;
    var byId = {};
    var defP = {}, defR = {}, defaultPara = null;
    if (doc) {
      var dd = doc.getElementsByTagNameNS(W, 'docDefaults')[0];
      if (dd) {
        var rd = child(dd, 'rPrDefault'), pd = child(dd, 'pPrDefault');
        defR = readRPr(rd && child(rd, 'rPr'));
        defP = readPPr(pd && child(pd, 'pPr'));
      }
      Array.prototype.forEach.call(doc.getElementsByTagNameNS(W, 'style'), function (s) {
        var id = attr(s, 'styleId');
        var based = child(s, 'basedOn');
        byId[id] = { type: attr(s, 'type'), basedOn: based && attr(based, 'val'), p: readPPr(child(s, 'pPr')), r: readRPr(child(s, 'rPr')) };
        if (attr(s, 'type') === 'paragraph' && attr(s, 'default') === '1') defaultPara = id;
      });
    }
    var cache = {};
    function resolve(id, depth) {
      if (!id || !byId[id] || depth > 10) return { p: {}, r: {} };
      if (cache[id]) return cache[id];
      var s = byId[id], base = resolve(s.basedOn, (depth || 0) + 1);
      var out = { p: extend(base.p, s.p), r: extend(base.r, s.r) };
      delete out.p.pStyle;
      return (cache[id] = out);
    }
    return {
      para: function (id) {
        var s = resolve(id && byId[id] ? id : defaultPara, 0);
        return { p: extend(defP, s.p), r: extend(defR, s.r) };
      }
    };
  }

  // ---------------------------------------------------------- Konversi HTML

  function Converter(zip, hostDoc) {
    var docXml = parseXml(zip.file('word/document.xml').asText());
    var styles = Styles(zip.file('word/styles.xml') ? zip.file('word/styles.xml').asText() : '');
    var rels = {};
    var relFile = zip.file('word/_rels/document.xml.rels');
    if (relFile) {
      Array.prototype.forEach.call(parseXml(relFile.asText()).getElementsByTagName('Relationship'), function (r) {
        rels[r.getAttribute('Id')] = r.getAttribute('Target');
      });
    }
    var urls = [];
    var imgCache = {};

    function imageUrl(rid) {
      if (imgCache[rid]) return imgCache[rid];
      var target = rels[rid];
      if (!target) return '';
      var path = target.charAt(0) === '/' ? target.slice(1) : 'word/' + target.replace(/^\.\//, '');
      var f = zip.file(path);
      if (!f) return '';
      var ext = path.split('.').pop().toLowerCase();
      var mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
      var url = URL.createObjectURL(new Blob([f.asUint8Array()], { type: mime }));
      urls.push(url);
      return (imgCache[rid] = url);
    }

    function el(tag, cls) {
      var e = hostDoc.createElement(tag);
      if (cls) e.className = cls;
      return e;
    }

    function runStyle(span, r) {
      if (r.b) span.style.fontWeight = '700';
      if (r.i) span.style.fontStyle = 'italic';
      if (r.u) span.style.textDecoration = 'underline';
      if (r.caps) span.style.textTransform = 'uppercase';
      if (r.sz) span.style.fontSize = hp(r.sz) + 'px';
      if (r.color && r.color !== 'auto') span.style.color = '#' + r.color;
    }

    function drawing(d) {
      var ext = d.getElementsByTagNameNS(WP, 'extent')[0];
      var blip = d.getElementsByTagNameNS(A, 'blip')[0];
      if (!ext || !blip) return null;
      var img = el('img', 'pv-img');
      img.src = imageUrl(blip.getAttributeNS(R, 'embed'));
      var docPr = d.getElementsByTagNameNS(WP, 'docPr')[0];
      img.alt = docPr ? (docPr.getAttribute('descr') || docPr.getAttribute('name') || '') : '';
      img.style.width = (+ext.getAttribute('cx') / 9525) + 'px';
      img.style.height = (+ext.getAttribute('cy') / 9525) + 'px';
      return img;
    }

    /** <w:p> → { el, keepNext, keepLines, pageBreakBefore, widow, bookmarks, sectPr, hasImage } */
    function paragraph(p) {
      var pPr = child(p, 'pPr');
      var direct = readPPr(pPr);
      var st = styles.para(direct.pStyle);
      var pp = extend(st.p, direct);
      var mark = extend(st.r, readRPr(pPr && child(pPr, 'rPr')));

      var div = el('div', 'pv-p');
      var size = hp(mark.sz || 22);
      div.style.fontSize = size + 'px';
      var rule = pp.lineRule || 'auto';
      var line = +pp.line || 240;
      var lh = rule === 'auto' ? size * line / 240 * LINE_FACTOR : Math.max(tw(line), rule === 'atLeast' ? size * LINE_FACTOR : 0);
      div.style.lineHeight = rule === 'auto' ? (line / 240 * LINE_FACTOR).toFixed(4) : tw(line) + 'px';
      div.style.paddingTop = tw(pp.before) + 'px';
      div.style.paddingBottom = tw(pp.after) + 'px';
      if (pp.left) div.style.paddingLeft = tw(pp.left) + 'px';
      if (pp.right) div.style.paddingRight = tw(pp.right) + 'px';
      if (pp.firstLine) div.style.textIndent = tw(pp.firstLine) + 'px';
      if (pp.hanging) div.style.textIndent = -tw(pp.hanging) + 'px';
      var align = { both: 'justify', distribute: 'justify', center: 'center', right: 'right', end: 'right' }[pp.jc] || 'left';
      div.style.textAlign = align;

      // Isi: dipecah per tab menjadi segmen.
      var segs = [hostDoc.createDocumentFragment()];
      var bookmarks = [];
      var hasImage = false, hasText = false, pageBreakAfter = false;
      var field = [];          // tumpukan field: { instr, phase, ref }

      function target() {
        var top = field[field.length - 1];
        if (top && top.phase === 'result' && top.ref) {
          if (!top.span) { top.span = el('span', 'pv-ref'); top.span.setAttribute('data-pageref', top.ref); segs[segs.length - 1].appendChild(top.span); }
          return top.span;
        }
        return segs[segs.length - 1];
      }
      function hidden() {
        for (var i = 0; i < field.length; i++) if (field[i].phase === 'instr') return true;
        return false;
      }

      function run(r) {
        var rp = extend(st.r, readRPr(child(r, 'rPr')));
        if (rp.vanish) return;
        var span = null;
        kids(r).forEach(function (c) {
          var n = c.localName;
          if (n === 'fldChar') {
            var t = attr(c, 'fldCharType');
            if (t === 'begin') field.push({ instr: '', phase: 'instr' });
            else if (t === 'separate' && field.length) {
              var f = field[field.length - 1];
              f.phase = 'result';
              var m = /PAGEREF\s+(\S+)/.exec(f.instr);
              f.ref = m ? m[1] : null;
            } else if (t === 'end') field.pop();
            span = null;
            return;
          }
          if (n === 'instrText') { if (field.length) field[field.length - 1].instr += c.textContent; return; }
          if (hidden()) return;
          if (n === 't') {
            if (!span) { span = el('span'); runStyle(span, rp); target().appendChild(span); }
            span.appendChild(hostDoc.createTextNode(c.textContent));
            if (c.textContent.trim()) hasText = true;
          } else if (n === 'tab') {
            segs.push(hostDoc.createDocumentFragment());
            span = null;
          } else if (n === 'br') {
            if (attr(c, 'type') === 'page') { pageBreakAfter = true; return; }
            target().appendChild(el('br'));
            span = null;
          } else if (n === 'drawing') {
            var img = drawing(c);
            if (img) { target().appendChild(img); hasImage = true; }
            span = null;
          } else if (n === 'noBreakHyphen') {
            if (!span) { span = el('span'); runStyle(span, rp); target().appendChild(span); }
            span.appendChild(hostDoc.createTextNode('‑'));
          }
        });
      }

      kids(p).forEach(function (c) {
        if (c.localName === 'r') run(c);
        else if (c.localName === 'hyperlink' || c.localName === 'smartTag' || c.localName === 'ins') kids(c, 'r').forEach(run);
        else if (c.localName === 'bookmarkStart') bookmarks.push(attr(c, 'name'));
      });

      var tabs = pp.tabs || [];
      var rightTab = tabs.filter(function (t) { return t.val === 'right'; })[0];
      if (segs.length > 1 && rightTab) {
        // Daftar Isi: teks …… nomor (tab kanan bertitik).
        div.classList.add('pv-tabr');
        var left = el('span', 'pv-tl');
        for (var i = 0; i < segs.length - 1; i++) left.appendChild(segs[i]);
        trimTrailingDots(left);
        div.appendChild(left);
        div.appendChild(el('span', rightTab.leader === 'dot' ? 'pv-lead pv-lead--dot' : 'pv-lead'));
        var right = el('span', 'pv-tn');
        right.appendChild(segs[segs.length - 1]);
        div.appendChild(right);
      } else if (segs.length > 1 && pp.hanging) {
        // Daftar menggantung: "a." <tab> teks → penanda selebar indentasi gantung.
        var mk = el('span', 'pv-mark');
        mk.style.minWidth = tw(pp.hanging) + 'px';
        mk.appendChild(segs[0]);
        div.appendChild(mk);
        for (var j = 1; j < segs.length; j++) {
          if (j > 1) div.appendChild(tabSpacer());
          div.appendChild(segs[j]);
        }
      } else {
        segs.forEach(function (s, k) { if (k) div.appendChild(tabSpacer()); div.appendChild(s); });
      }
      if (!hasText && !hasImage) {
        var z = el('span'); z.textContent = '​'; div.appendChild(z);
      }

      return {
        type: 'p', el: div, lh: lh,
        padTop: tw(pp.before), padBottom: tw(pp.after),
        keepNext: !!pp.keepNext, keepLines: !!pp.keepLines || hasImage,
        pageBreakBefore: !!pp.pageBreakBefore, pageBreakAfter: pageBreakAfter,
        widow: pp.widowControl !== false, justify: align === 'justify',
        bookmarks: bookmarks, sectPr: pPr && child(pPr, 'sectPr')
      };
    }

    function tabSpacer() {
      var s = el('span', 'pv-tab');
      s.style.width = DEFAULT_TAB + 'px';
      return s;
    }

    function trimTrailingDots(node) {
      var walker = hostDoc.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      var last = null, t;
      while ((t = walker.nextNode())) last = t;
      if (last) last.nodeValue = last.nodeValue.replace(/[\s.…]+$/, '');
    }

    function borderCss(b) {
      if (!b) return null;
      var v = attr(b, 'val');
      if (!v || v === 'none' || v === 'nil') return 'none';
      var w = Math.max((+attr(b, 'sz') || 4) / 8 * 96 / 72, 0.75);
      var c = attr(b, 'color');
      return w.toFixed(2) + 'px solid ' + (c && c !== 'auto' ? '#' + c : '#000');
    }

    /** <w:tbl> → { el, rows:[{ tr, header, keepNext }], keepNext } */
    function table(tbl) {
      var tblPr = child(tbl, 'tblPr');
      var t = el('table', 'pv-tbl');
      var grid = kids(child(tbl, 'tblGrid'), 'gridCol').map(function (g) { return tw(attr(g, 'w')); });
      var total = grid.reduce(function (a, b) { return a + b; }, 0);
      var colgroup = el('colgroup');
      grid.forEach(function (w) { var c = el('col'); c.style.width = w + 'px'; colgroup.appendChild(c); });
      t.appendChild(colgroup);
      t.style.width = total + 'px';
      var jc = child(tblPr, 'jc');
      if (jc && attr(jc, 'val') === 'center') t.style.margin = '0 auto';

      var bd = child(tblPr, 'tblBorders');
      var B = {};
      ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].forEach(function (k) { B[k] = borderCss(child(bd, k)) || 'none'; });
      var cm = child(tblPr, 'tblCellMar');
      var defMar = { top: 0, bottom: 0, left: 108, right: 108 };
      if (cm) ['top', 'bottom', 'left', 'right'].forEach(function (k) { var x = child(cm, k) || child(cm, k === 'left' ? 'start' : k === 'right' ? 'end' : k); if (x) defMar[k] = +attr(x, 'w'); });

      var trs = kids(tbl, 'tr');
      var rows = trs.map(function (tr, ri) {
        var trPr = child(tr, 'trPr');
        var row = el('tr');
        var keepNext = false;
        var col = 0;
        var cells = kids(tr, 'tc');
        cells.forEach(function (tc, ci) {
          var tcPr = child(tc, 'tcPr');
          var td = el('td', 'pv-td');
          var span = child(tcPr, 'gridSpan');
          var cs = span ? +attr(span, 'val') : 1;
          if (cs > 1) td.colSpan = cs;
          var shd = child(tcPr, 'shd');
          if (shd && attr(shd, 'fill') && attr(shd, 'fill') !== 'auto') td.style.background = '#' + attr(shd, 'fill');
          var va = child(tcPr, 'vAlign');
          td.style.verticalAlign = va ? ({ center: 'middle', bottom: 'bottom' }[attr(va, 'val')] || 'top') : 'top';
          var mar = extend(defMar, {});
          var tm = child(tcPr, 'tcMar');
          if (tm) ['top', 'bottom', 'left', 'right'].forEach(function (k) { var x = child(tm, k); if (x) mar[k] = +attr(x, 'w'); });
          td.style.padding = tw(mar.top) + 'px ' + tw(mar.right) + 'px ' + tw(mar.bottom) + 'px ' + tw(mar.left) + 'px';
          td.style.borderTop = ri === 0 ? B.top : B.insideH;
          td.style.borderBottom = ri === trs.length - 1 ? B.bottom : B.insideH;
          td.style.borderLeft = col === 0 ? B.left : B.insideV;
          td.style.borderRight = ci === cells.length - 1 ? B.right : B.insideV;
          col += cs;
          kids(tc).forEach(function (c) {
            if (c.localName === 'p') {
              var b = paragraph(c);
              if (b.keepNext) keepNext = true;
              td.appendChild(b.el);
            } else if (c.localName === 'tbl') {
              td.appendChild(table(c).el);
            }
          });
          row.appendChild(td);
        });
        t.appendChild(row);
        return { tr: row, header: !!(trPr && child(trPr, 'tblHeader')), keepNext: keepNext };
      });
      // Baris judul hanya dihitung bila berada di awal tabel.
      var stillHeader = true;
      rows.forEach(function (r) { if (!r.header) stillHeader = false; else if (!stillHeader) r.header = false; });

      return { type: 'tbl', el: t, colgroup: colgroup, rows: rows, keepNext: rows.length ? rows[rows.length - 1].keepNext : false, bookmarks: [] };
    }

    function footer(sectPr) {
      var ref = kids(sectPr, 'footerReference').filter(function (f) { return attr(f, 'type') === 'default'; })[0];
      if (!ref) return undefined;   // tidak ada → mewarisi section sebelumnya
      var target = rels[ref.getAttributeNS(R, 'id')];
      var f = target && zip.file('word/' + target);
      if (!f) return null;
      var fx = parseXml(f.asText());
      var hasContent = fx.getElementsByTagNameNS(W, 't').length > 0 || /PAGE/.test(fx.documentElement.textContent);
      if (!hasContent) return null;
      var p = fx.getElementsByTagNameNS(W, 'p')[0];
      var pp = readPPr(p && child(p, 'pPr'));
      var r = fx.getElementsByTagNameNS(W, 'rPr')[0];
      var rp = readRPr(r);
      return { align: { center: 'center', right: 'right', end: 'right' }[pp.jc] || 'left', size: hp(rp.sz || 22) };
    }

    function section(sectPr) {
      var pgSz = child(sectPr, 'pgSz'), pgMar = child(sectPr, 'pgMar'), num = child(sectPr, 'pgNumType');
      return {
        width: tw(attr(pgSz, 'w') || 11906), height: tw(attr(pgSz, 'h') || 16838),
        top: tw(attr(pgMar, 'top') || 1440), bottom: tw(attr(pgMar, 'bottom') || 1440),
        left: tw(attr(pgMar, 'left') || 1440), right: tw(attr(pgMar, 'right') || 1440),
        footerDist: tw(attr(pgMar, 'footer') || 720),
        fmt: num && attr(num, 'fmt') || 'decimal',
        start: num && attr(num, 'start') !== null ? +attr(num, 'start') : null,
        footer: footer(sectPr)
      };
    }

    /** Seluruh body → daftar blok + daftar section (blok.section = indeks). */
    function convert() {
      var body = docXml.getElementsByTagNameNS(W, 'body')[0];
      var blocks = [], sections = [];
      var current = [];
      kids(body).forEach(function (c) {
        if (c.localName === 'p') {
          var b = paragraph(c);
          current.push(b);
          if (b.sectPr) { sections.push(section(b.sectPr)); flush(); }
        } else if (c.localName === 'tbl') {
          current.push(table(c));
        } else if (c.localName === 'sectPr') {
          sections.push(section(c)); flush();
        }
      });
      if (current.length) { sections.push(sections[sections.length - 1] || section(null)); flush(); }
      function flush() {
        var idx = sections.length - 1;
        current.forEach(function (b, i) { b.section = idx; b.sectionStart = i === 0; });
        blocks = blocks.concat(current);
        current = [];
      }
      // Footer yang tidak didefinisikan mewarisi section sebelumnya.
      sections.forEach(function (s, i) { if (s.footer === undefined) s.footer = i ? sections[i - 1].footer : null; });
      return { blocks: blocks, sections: sections };
    }

    return { convert: convert, release: function () { urls.forEach(function (u) { URL.revokeObjectURL(u); }); } };
  }

  // ---------------------------------------------------------- Pemotongan

  function roman(n, upper) {
    var map = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
    var s = '';
    map.forEach(function (m) { while (n >= m[0]) { s += m[1]; n -= m[0]; } });
    return upper ? s.toUpperCase() : s;
  }
  function formatNum(n, fmt) {
    if (fmt === 'lowerRoman') return roman(n, false);
    if (fmt === 'upperRoman') return roman(n, true);
    return String(n);
  }

  function height(node) { return node.getBoundingClientRect().height; }

  function Paginator(measure, H) {
    var pages = [];
    var page = null, y = 0;

    function newPage(section, natural) {
      page = { section: section, nodes: [], natural: !!natural, bookmarks: [] };
      pages.push(page);
      y = 0;
    }
    function put(node, h, block) {
      page.nodes.push(node);
      if (block && block.bookmarks.length && !block._marked) { page.bookmarks = page.bookmarks.concat(block.bookmarks); block._marked = true; }
      y += h;
    }

    /** Hapus spasi-sebelum di awal halaman (pemotongan alami), seperti Word. */
    function atTopTrim(b) {
      if (b.type === 'p' && page.natural && y === 0 && b.padTop) {
        b.el.style.paddingTop = '0px';
        b.h -= b.padTop;
        b.padTop = 0;
      }
    }

    function minStart(b) {
      if (b.type === 'tbl') {
        var h = 0, i;
        for (i = 0; i < b.rows.length && b.rows[i].header; i++) h += b.rows[i].h;
        for (; i < b.rows.length; i++) { h += b.rows[i].h; if (!b.rows[i].keepNext) break; }
        return h;
      }
      if (b.keepLines || !b.widow) return b.keepLines ? b.h : Math.min(b.h, b.padTop + b.lh);
      return Math.min(b.h, b.padTop + 2 * b.lh);
    }

    function chainNeed(blocks, i) {
      var need = 0;
      for (var j = i; j < blocks.length; j++) {
        var b = blocks[j];
        if (j > i && (b.sectionStart || b.pageBreakBefore)) return need;
        if (j > i && !blocks[j - 1].keepNext) return need;
        need += b.keepNext && j + 1 < blocks.length ? b.h : minStart(b);
        if (!b.keepNext) return need;
      }
      return need;
    }

    // ---- paragraf

    function textNodes(el) {
      var list = [], w = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT), t;
      while ((t = w.nextNode())) list.push(t);
      return list;
    }
    /** Posisi awal kata (offset global) tempat paragraf boleh dipotong. */
    function breakPoints(el) {
      var pts = [], pos = 0;
      textNodes(el).forEach(function (t) {
        var s = t.nodeValue;
        for (var i = 1; i < s.length; i++) {
          if (/\s/.test(s.charAt(i - 1)) && !/\s/.test(s.charAt(i))) pts.push(pos + i);
        }
        pos += s.length;
      });
      return pts;
    }
    function locate(el, k) {
      var nodes = textNodes(el), pos = 0;
      for (var i = 0; i < nodes.length; i++) {
        var len = nodes[i].nodeValue.length;
        if (k <= pos + len) return { node: nodes[i], off: k - pos };
        pos += len;
      }
      var last = nodes[nodes.length - 1];
      return { node: last, off: last.nodeValue.length };
    }
    function slice(el, k, first) {
      var doc = el.ownerDocument;
      var at = locate(el, k);
      var r = doc.createRange();
      if (first) { r.setStart(el, 0); r.setEnd(at.node, at.off); } else { r.setStart(at.node, at.off); r.setEnd(el, el.childNodes.length); }
      var out = el.cloneNode(false);
      out.appendChild(r.cloneContents());
      if (first) {
        out.style.paddingBottom = '0px';
        if (out.style.textAlign === 'justify') out.style.textAlignLast = 'justify';
        var tn = textNodes(out), last = tn[tn.length - 1];
        if (last) last.nodeValue = last.nodeValue.replace(/\s+$/, '');
      } else {
        out.style.paddingTop = '0px';
        out.style.textIndent = '0px';
        var mk = out.querySelector('.pv-mark');
        if (mk && !mk.textContent.trim()) mk.parentNode.removeChild(mk);
        var tn2 = textNodes(out);
        if (tn2[0]) tn2[0].nodeValue = tn2[0].nodeValue.replace(/^\s+/, '');
      }
      return out;
    }
    function measureNode(node) {
      measure.appendChild(node);
      var h = height(node);
      measure.removeChild(node);
      return h;
    }

    /** Potong paragraf agar bagian pertama ≤ avail. null bila tidak memenuhi widow/orphan. */
    function splitParagraph(b, avail) {
      var el = b.el;
      if (b.keepLines) return null;
      var pts = breakPoints(el);
      if (!pts.length) return null;
      var total = Math.round((b.h - b.padTop - b.padBottom) / b.lh);
      var minLines = b.widow ? 2 : 1;
      if (total < minLines * 2) return null;

      function fit(limit) {
        var lo = 0, hi = pts.length - 1, best = -1;
        while (lo <= hi) {
          var mid = (lo + hi) >> 1;
          var h = measureNode(slice(el, pts[mid], true));
          if (h <= limit + EPS) { best = mid; lo = mid + 1; } else hi = mid - 1;
        }
        return best;
      }
      var idx = fit(avail);
      if (idx < 0) return null;
      var first = slice(el, pts[idx], true);
      var hFirst = measureNode(first);
      var linesFirst = Math.round((hFirst - b.padTop) / b.lh);
      if (linesFirst < minLines) return null;
      var linesRest = total - linesFirst;
      if (linesRest < minLines) {
        var want = linesFirst - (minLines - linesRest);
        if (want < minLines) return null;
        idx = fit(b.padTop + want * b.lh);
        if (idx < 0) return null;
        first = slice(el, pts[idx], true);
        hFirst = measureNode(first);
      }
      var rest = slice(el, pts[idx], false);
      var restBlock = extend(b, {});
      restBlock.el = rest;
      restBlock.padTop = 0;
      restBlock.h = measureNode(rest);
      restBlock.bookmarks = [];
      return { first: first, hFirst: hFirst, rest: restBlock };
    }

    function placeParagraph(b) {
      var cur = b;
      for (var guard = 0; guard < 500; guard++) {
        if (y + cur.h <= H + EPS) { put(cur.el, cur.h, b); return; }
        var part = splitParagraph(cur, H - y);
        if (!part) {
          if (y === 0) { put(cur.el, cur.h, b); return; }   // lebih tinggi dari 1 halaman: biarkan
          newPage(page.section, true);
          atTopTrim(cur);
          continue;
        }
        put(part.first, part.hFirst, b);
        newPage(page.section, true);
        cur = part.rest;
      }
    }

    // ---- tabel

    function placeTable(b) {
      var headers = b.rows.filter(function (r) { return r.header; });
      var body = b.rows.filter(function (r) { return !r.header; });
      var headH = headers.reduce(function (s, r) { return s + r.h; }, 0);
      var shellExtra = 1;   // garis tepi bawah
      var frag, fragH, fragRows, firstFrag = true;

      function start() {
        frag = b.el.cloneNode(false);
        frag.appendChild(b.colgroup.cloneNode(true));
        headers.forEach(function (r) { frag.appendChild(firstFrag ? r.tr : r.tr.cloneNode(true)); });
        fragH = headH + shellExtra;
        fragRows = 0;
      }
      function finish() {
        if (fragRows || !body.length) { put(frag, fragH, b); firstFrag = false; }
      }
      start();
      var i = 0;
      while (i < body.length) {
        var j = i, gh = body[i].h;
        while (body[j].keepNext && j + 1 < body.length) { j++; gh += body[j].h; }
        if (headH + gh + shellExtra > H) { j = i; gh = body[i].h; }   // rantai terlalu panjang: per baris
        if (y + fragH + gh <= H + EPS) {
          for (var k = i; k <= j; k++) frag.appendChild(body[k].tr);
          fragH += gh; fragRows += j - i + 1; i = j + 1;
          continue;
        }
        if (!fragRows && y === 0) {   // satu baris lebih tinggi dari halaman
          for (var m = i; m <= j; m++) frag.appendChild(body[m].tr);
          fragH += gh; fragRows += j - i + 1; i = j + 1;
          continue;
        }
        finish();
        newPage(page.section, true);
        start();
      }
      finish();
    }

    function run(blocks) {
      var forceNext = false;
      blocks.forEach(function (b, i) {
        if (!page || b.sectionStart) newPage(b.section, false);
        else if ((b.pageBreakBefore || forceNext) && (y > 0 || page.nodes.length)) newPage(b.section, false);
        forceNext = !!b.pageBreakAfter;

        if (y > 0 && b.keepNext) {
          var need = chainNeed(blocks, i);
          if (need <= H && y + need > H + EPS) newPage(b.section, true);
        }
        atTopTrim(b);
        if (b.type === 'tbl') placeTable(b);
        else if (y + b.h <= H + EPS) put(b.el, b.h, b);
        else placeParagraph(b);
      });
      return pages;
    }

    return { run: run };
  }

  // ---------------------------------------------------------------- API

  var FONT_STACK = 'Arial, "PKL Arimo", "Liberation Sans", Helvetica, sans-serif';

  function loadFonts(doc) {
    if (!doc.fonts || !doc.fonts.load) return Promise.resolve();
    var tries = ['400 16px Arial', '700 16px Arial', '400 16px "PKL Arimo"', '700 16px "PKL Arimo"'].map(function (f) {
      return doc.fonts.load(f).catch(function () {});
    });
    return Promise.all(tries).then(function () { return doc.fonts.ready; });
  }

  function layout(zip, host) {
    var doc = host.ownerDocument;
    return loadFonts(doc).then(function () {
      var conv = Converter(zip, doc);
      var parsed = conv.convert();
      var sec0 = parsed.sections[0];
      var contentW = sec0.width - sec0.left - sec0.right;
      var H = sec0.height - sec0.top - sec0.bottom;

      var measure = doc.createElement('div');
      measure.className = 'pv-measure pv-root';
      measure.style.width = contentW + 'px';
      measure.style.fontFamily = FONT_STACK;
      doc.body.appendChild(measure);

      try {
        parsed.blocks.forEach(function (b) { measure.appendChild(b.el); });
        parsed.blocks.forEach(function (b) {
          b.h = height(b.el);
          if (b.type === 'tbl') b.rows.forEach(function (r) { r.h = height(r.tr); });
        });
        parsed.blocks.forEach(function (b) { measure.removeChild(b.el); });

        var pages = Paginator(measure, H).run(parsed.blocks);

        // Nomor halaman per section.
        var bookmarks = {};
        var num = 0, lastSec = -1;
        var out = pages.map(function (pg) {
          var s = parsed.sections[pg.section];
          if (pg.section !== lastSec) { num = s.start !== null ? s.start : num + 1; lastSec = pg.section; } else num++;
          var label = formatNum(num, s.fmt);
          pg.bookmarks.forEach(function (n) { bookmarks[n] = label; });

          var pe = doc.createElement('div');
          pe.className = 'pv-page';
          pe.style.width = s.width + 'px';
          pe.style.height = s.height + 'px';
          var bodyEl = doc.createElement('div');
          bodyEl.className = 'pv-body';
          bodyEl.style.cssText = 'top:' + s.top + 'px;left:' + s.left + 'px;width:' + (s.width - s.left - s.right) + 'px;height:' + (s.height - s.top - s.bottom) + 'px';
          pg.nodes.forEach(function (n) { bodyEl.appendChild(n); });
          pe.appendChild(bodyEl);
          if (s.footer) {
            var f = doc.createElement('div');
            f.className = 'pv-foot';
            f.style.cssText = 'left:' + s.left + 'px;width:' + (s.width - s.left - s.right) + 'px;bottom:' + s.footerDist + 'px;text-align:' + s.footer.align + ';font-size:' + s.footer.size + 'px';
            f.textContent = label;
            pe.appendChild(f);
          }
          return pe;
        });

        // Field PAGEREF (Daftar Isi) diisi nomor halaman hasil tata letak.
        out.forEach(function (pe) {
          Array.prototype.forEach.call(pe.querySelectorAll('[data-pageref]'), function (s) {
            var v = bookmarks[s.getAttribute('data-pageref')];
            if (v) s.textContent = v;
          });
        });

        host.classList.add('pv-root');
        host.style.fontFamily = FONT_STACK;
        out.forEach(function (pe) { host.appendChild(pe); });
        return {
          pages: out,
          bookmarks: bookmarks,
          pageCount: out.length,
          destroy: function () {
            out.forEach(function (pe) { if (pe.parentNode) pe.parentNode.removeChild(pe); });
            conv.release();
          }
        };
      } finally {
        if (measure.parentNode) measure.parentNode.removeChild(measure);
      }
    });
  }

  /**
   * Isi hasil (cached result) field PAGEREF di document.xml dengan nomor halaman,
   * sehingga Daftar Isi sudah benar walau aplikasi pembuka tidak memperbarui field
   * (WPS, Google Docs, penampil HP). Word tetap bisa memperbarui (updateFields).
   */
  function fillTocXml(xml, bookmarks) {
    var count = 0;
    var out = xml.replace(/(PAGEREF\s+(\w+)[^<]*<\/w:instrText><\/w:r>(?:(?!<\/w:p>)[\s\S])*?w:fldCharType="separate"\/><\/w:r><w:r>(?:<w:rPr>(?:(?!<\/w:rPr>)[\s\S])*<\/w:rPr>)?<w:t(?: [^>]*)?>)([^<]*)(<\/w:t>)/g,
      function (all, head, name, old, tail) {
        if (!bookmarks[name]) return all;
        count++;
        return head + bookmarks[name] + tail;
      });
    return { xml: out, count: count };
  }

  PKL.pageLayout = { layout: layout, fillTocXml: fillTocXml, formatNum: formatNum };
})(window.PKL);

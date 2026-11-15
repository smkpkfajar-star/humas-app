/**
 * Kelengkapan laporan — progres keseluruhan & status per langkah
 * (Scene 2 Ringkasan, sidebar, Scene 9 checklist).
 */
(function (PKL) {
  'use strict';

  var labelCache = {};
  var MAX_LINKS = 4;

  /** Label manusiawi untuk sebuah kunci: <label for>, judul tabel, atau kunci itu sendiri. */
  function labelOf(key) {
    if (labelCache[key]) return labelCache[key];
    var text = PKL.listLabels[key];
    if (!text) {
      var el = PKL.$('label[for="' + key + '"]');
      if (!el) {
        var group = PKL.$('[name="' + key + '"]');
        var rg = group && group.closest('[role="radiogroup"]');
        el = rg && document.getElementById(rg.getAttribute('aria-labelledby'));
      }
      text = el ? el.textContent.replace('*', '').trim() : key;
    }
    labelCache[key] = text;
    return text;
  }

  function evaluate() {
    var data = PKL.state.all();
    var total = 0;
    var filled = 0;

    var steps = PKL.steps.map(function (step) {
      var missing = [];
      step.required.forEach(function (key) {
        total += 1;
        if (PKL.state.isFilled(key, data[key])) filled += 1;
        else missing.push(key);
      });
      var done = step.required.length - missing.length;
      var st = step.required.length === 0 ? null
        : missing.length === 0 ? 'done'
        : done > 0 ? 'partial' : 'empty';
      return { id: step.id, status: st, missing: missing };
    });

    return { percent: total ? (filled / total) * 100 : 0, steps: steps };
  }

  function render() {
    var res = evaluate();
    PKL.stepRenderer.setProgress(res.percent);

    res.steps.forEach(function (s) {
      if (!s.status) {
        // Langkah tanpa isian (Langkah 7 — Generate): tampilkan kesiapan, bukan "Belum diisi".
        var ready = res.percent >= 100;
        var badge = PKL.$('[data-step-badge="' + s.id + '"]');
        if (badge) {
          badge.className = 'badge' + (ready ? ' badge--ok' : '');
          badge.textContent = ready ? 'Siap dibuat' : 'Bisa dibuat';
        }
        return;
      }
      PKL.stepRenderer.setStepStatus(s.id, s.status);

      var sub = PKL.$('[data-check="' + s.id + '"] [data-check-sub]');
      if (sub) {
        var step = PKL.getStep(s.id);
        var sig = s.missing.join(',');
        if (sub.getAttribute('data-sig') === sig && sub.firstChild) return;   // hindari render ulang tiap ketikan
        sub.setAttribute('data-sig', sig);
        sub.textContent = '';
        if (s.missing.length === 0) {
          sub.textContent = step.sub;
        } else {
          sub.appendChild(document.createTextNode('Belum diisi: '));
          s.missing.slice(0, MAX_LINKS).forEach(function (key, i) {
            if (i) sub.appendChild(document.createTextNode(', '));
            var a = document.createElement('a');
            a.className = 'checklist__jump';
            a.href = '#/' + s.id;
            a.setAttribute('data-goto-field', key);
            a.textContent = labelOf(key);
            sub.appendChild(a);
          });
          if (s.missing.length > MAX_LINKS) {
            sub.appendChild(document.createTextNode(' +' + (s.missing.length - MAX_LINKS) + ' lainnya'));
          }
        }
      }
    });
    return res;
  }

  var raf = null;
  function scheduleRender() {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = null; render(); });
  }

  /** Tanda * pada label diturunkan dari steps.required (satu sumber kebenaran). */
  function markRequired() {
    PKL.steps.forEach(function (step) {
      step.required.forEach(function (key) {
        var label = PKL.$('label[for="' + key + '"]');
        if (!label) {
          var group = PKL.$('[name="' + key + '"]');
          var rg = group && group.closest('[role="radiogroup"]');
          label = rg && document.getElementById(rg.getAttribute('aria-labelledby'));
        }
        if (!label || label.classList.contains('visually-hidden') || PKL.$('.label__req', label)) return;
        var mark = document.createElement('span');
        mark.className = 'label__req';
        mark.setAttribute('aria-hidden', 'true');
        mark.textContent = '*';
        label.appendChild(document.createTextNode(' '));
        label.appendChild(mark);
      });
    });
  }

  // --------------------------------------------- Lompat ke isian yang kosong

  function rowIsEmpty(row) {
    return PKL.$$('[data-field]', row).every(function (c) {
      var f = c.getAttribute('data-field');
      return c.type === 'hidden' || c.type === 'number' || f === 'validasi' || !String(c.value).trim();
    });
  }

  /** Elemen yang paling tepat untuk difokuskan bagi sebuah kunci isian. */
  function targetOf(key) {
    var rep = PKL.$('[data-repeater="' + key + '"]');
    if (rep) {
      var empty = PKL.$$('.repeater__row', rep).filter(rowIsEmpty)[0];
      var ctl = empty && PKL.$('[data-field]:not([type="hidden"])', empty);
      return { box: rep.closest('.card') || rep, focus: ctl || PKL.$('[data-action="add-row"]', rep) };
    }
    var el = PKL.$('[name="' + key + '"]:not([type="hidden"])');
    if (!el) return null;
    var box = el.closest('[role="radiogroup"]') || el.closest('.field') || el;
    return { box: box, focus: el };
  }

  function focusField(key) {
    var t = targetOf(key);
    if (!t) return;
    t.box.scrollIntoView({ block: 'center' });
    if (t.focus) t.focus.focus({ preventScroll: true });
    t.box.classList.remove('is-flash');
    t.box.getBoundingClientRect();   // mulai ulang animasi
    t.box.classList.add('is-flash');
    setTimeout(function () { t.box.classList.remove('is-flash'); }, 2200);
  }

  function initJump() {
    var pending = null;
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-goto-field]');
      if (!a) return;
      e.preventDefault();
      var key = a.getAttribute('data-goto-field');
      var hash = a.getAttribute('href');
      if (location.hash === hash) { focusField(key); return; }
      pending = key;
      location.hash = hash;
    });
    // Didaftarkan setelah router -> berjalan setelah view baru tampil.
    window.addEventListener('hashchange', function () {
      if (!pending) return;
      var key = pending;
      pending = null;
      requestAnimationFrame(function () { focusField(key); });
    });
  }

  PKL.completeness = {
    init: function () {
      markRequired();
      PKL.on('pkl:state-change', scheduleRender);
    },
    initJump: initJump,
    focusField: focusField,
    evaluate: evaluate,
    render: render
  };
})(window.PKL);

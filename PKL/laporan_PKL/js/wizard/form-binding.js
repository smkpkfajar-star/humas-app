/**
 * Form Binding — menghubungkan elemen ber-atribut `name` & repeater dengan PKL.state.
 *
 *   PKL.form.init()               → pasang listener input/change
 *   PKL.form.applyAll(data)       → isi seluruh form dari data (saat load/impor)
 *   PKL.form.setValue(name, v)    → ubah field secara terprogram (DOM + state)
 *   PKL.form.collectAll()         → baca seluruh form ke objek (sinkron awal)
 */
(function (PKL) {
  'use strict';

  var form;
  var applying = false;

  function controls(name) {
    return PKL.$$('[name="' + name + '"]', form);
  }

  function readNamed(name) {
    var els = controls(name);
    if (!els.length) return undefined;
    if (els[0].type === 'radio') {
      var checked = els.filter(function (el) { return el.checked; })[0];
      return checked ? checked.value : '';
    }
    return els[0].value;
  }

  function writeNamed(name, value) {
    var els = controls(name);
    if (!els.length) return;
    var v = value === undefined || value === null ? '' : String(value);
    if (els[0].type === 'radio') {
      els.forEach(function (el) { el.checked = el.value === v; });
    } else {
      els[0].value = v;
    }
  }

  function uniqueNames() {
    var seen = {};
    return PKL.$$('[name]', form).map(function (el) { return el.name; })
      .filter(function (n) { return n && !seen[n] && (seen[n] = true); });
  }

  function onInput(e) {
    var el = e.target;
    if (!el.name || applying) return;
    // Teks: simpan saat mengetik; radio/select/date: simpan saat change.
    if (e.type === 'input' && (el.type === 'radio' || el.tagName === 'SELECT')) return;
    PKL.state.set(el.name, readNamed(el.name), 'user');
  }

  /**
   * Batas panjang isian yang TERLIHAT (atribut maxlength) agar tidak ada data
   * yang terpotong diam-diam. Penyimpanan (state.js) menampung lebih dari ini.
   */
  var MAX_LEN = { field: 300, area: 30000, rowField: 500, rowArea: 5000 };

  function applyMaxLength(root) {
    PKL.$$('input[type="text"], input[type="tel"], input[type="email"], input:not([type]), textarea', root).forEach(function (el) {
      if (el.maxLength > 0 || el.readOnly) return;
      var inRow = !!el.closest('.repeater__row, template');
      el.maxLength = el.tagName === 'TEXTAREA' ? (inRow ? MAX_LEN.rowArea : MAX_LEN.area) : (inRow ? MAX_LEN.rowField : MAX_LEN.field);
    });
  }

  /** Beri tahu siswa saat batas tercapai (mis. teks tempelan terpotong oleh browser). */
  function onLimit(e) {
    var el = e.target;
    if (!el || !(el.maxLength > 0) || (el.tagName !== 'TEXTAREA' && el.tagName !== 'INPUT')) return;
    var note = el.nextElementSibling && el.nextElementSibling.hasAttribute('data-limit-note') ? el.nextElementSibling : null;
    var full = el.value.length >= el.maxLength;
    if (full && !note) {
      note = document.createElement('p');
      note.className = 'help help--error';
      note.setAttribute('data-limit-note', '');
      note.setAttribute('role', 'status');
      note.textContent = 'Batas maksimal ' + el.maxLength.toLocaleString('id-ID') + ' karakter tercapai. Teks setelahnya tidak ikut tersimpan.';
      el.after(note);
    } else if (!full && note) {
      note.remove();
    }
  }

  PKL.form = {
    init: function () {
      form = PKL.$('#report-form');
      applyMaxLength(form);
      PKL.$$('template', form).forEach(function (t) { applyMaxLength(t.content); });
      form.addEventListener('input', onLimit);
      form.addEventListener('input', onInput);
      form.addEventListener('change', onInput);

      PKL.on('pkl:repeater-change', function (d) {
        if (!applying) PKL.state.set(d.name, d.rows, 'user');
      });
    },

    applyAll: function (data) {
      applying = true;
      try {
        uniqueNames().forEach(function (name) {
          if (data[name] !== undefined) writeNamed(name, data[name]);
        });
        PKL.repeater.names().forEach(function (name) {
          if (Array.isArray(data[name])) PKL.repeater.setRows(name, data[name]);
        });
      } finally {
        applying = false;
      }
      // Tabel yang dipotong ke batas maksimum (mis. presensi > 6 bulan) → samakan state.
      PKL.repeater.names().forEach(function (name) {
        if (!Array.isArray(data[name])) return;
        var rows = PKL.repeater.getRows(name);
        if (rows.length !== data[name].length) PKL.state.set(name, rows, 'user');
      });
    },

    /** Baca nilai awal form (mis. value="Yogyakarta") ke state tanpa menimpa data tersimpan. */
    collectAll: function () {
      var out = {};
      uniqueNames().forEach(function (name) { out[name] = readNamed(name); });
      PKL.repeater.names().forEach(function (name) { out[name] = PKL.repeater.getRows(name); });
      return out;
    },

    setValue: function (name, value, source) {
      writeNamed(name, value);
      PKL.state.set(name, value, source || 'auto');
    },

    read: readNamed
  };
})(window.PKL);

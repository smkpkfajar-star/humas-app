/**
 * Repeater — tabel dinamis berbasis <template> (FR-03).
 *
 * Markup:
 *   <div class="repeater" data-repeater="list_x">
 *     <ol class="repeater__list"></ol>
 *     <template><li class="repeater__row">… [data-field] … [data-row-action] …</li></template>
 *     <div class="repeater__footer"><button data-action="add-row">…</button></div>
 *   </div>
 *
 * API:
 *   PKL.repeater.init(root)              → pasang semua repeater di root
 *   PKL.repeater.getRows(name)           → [{field: value, …}, …]
 *   PKL.repeater.setRows(name, rows)     → ganti seluruh baris (dipakai Tahap 2/3)
 *
 * Setiap perubahan memicu event 'pkl:repeater-change' { name, rows }.
 * Kolom `no` tidak disimpan di baris; dihitung saat render dokumen (FR-03).
 */
(function (PKL) {
  'use strict';

  var registry = {};
  var EMPTY_TEXT = 'Belum ada baris. Klik tombol di bawah untuk menambahkan.';

  function Repeater(el) {
    this.el = el;
    this.name = el.getAttribute('data-repeater');
    this.list = PKL.$('.repeater__list', el);
    this.template = PKL.$('template', el);

    this.empty = document.createElement('p');
    this.empty.className = 'repeater__empty';
    this.empty.textContent = EMPTY_TEXT;
    this.empty.hidden = true;
    this.list.after(this.empty);

    // Batas jumlah baris opsional: <div class="repeater" data-max="6" data-max-label="bulan">
    this.max = parseInt(el.getAttribute('data-max'), 10) || Infinity;
    this.addBtn = PKL.$('[data-action="add-row"]', el);
    if (this.max !== Infinity) {
      this.maxNote = document.createElement('p');
      this.maxNote.className = 'help repeater__max-note';
      this.maxNote.setAttribute('role', 'status');
      this.maxNote.textContent = 'Maksimal ' + this.max + ' ' + (el.getAttribute('data-max-label') || 'baris') + '.';
      this.maxNote.hidden = true;
      PKL.$('.repeater__footer', el).after(this.maxNote);
    }

    el.addEventListener('click', this.onClick.bind(this));
    el.addEventListener('input', this.notify.bind(this));
  }

  Repeater.prototype.createRow = function (values) {
    var row = this.template.content.firstElementChild.cloneNode(true);

    // Hubungkan setiap <label> dengan input di field yang sama (aksesibilitas).
    PKL.$$('.field', row).forEach(function (field) {
      var label = PKL.$('label.label', field);
      var control = PKL.$('[data-field]', field);
      if (label && control) {
        control.id = PKL.uid('rf');
        label.htmlFor = control.id;
      }
    });

    if (values) {
      PKL.$$('[data-field]', row).forEach(function (control) {
        var key = control.getAttribute('data-field');
        if (values[key] !== undefined && values[key] !== null) control.value = values[key];
      });
    }
    return row;
  };

  Repeater.prototype.count = function () {
    return PKL.$$('.repeater__row', this.list).length;
  };

  Repeater.prototype.add = function (values, focus) {
    if (this.count() >= this.max) return null;
    var row = this.createRow(values);
    this.list.appendChild(row);
    this.refresh();
    if (focus) {
      var first = PKL.$('[data-field]:not([type="hidden"])', row);
      if (first) first.focus();
    }
    this.notify();
    return row;
  };

  Repeater.prototype.onClick = function (e) {
    var addBtn = e.target.closest('[data-action="add-row"]');
    if (addBtn && this.el.contains(addBtn)) {
      this.add(null, true);
      return;
    }

    var btn = e.target.closest('[data-row-action]');
    if (!btn) return;
    var row = btn.closest('.repeater__row');
    var action = btn.getAttribute('data-row-action');

    if (action === 'remove') {
      var next = row.nextElementSibling || row.previousElementSibling;
      row.remove();
      // Pindahkan fokus agar pengguna keyboard tidak "hilang".
      var target = next ? PKL.$('[data-row-action="remove"]', next) : PKL.$('[data-action="add-row"]', this.el);
      if (target) target.focus();
    } else if (action === 'up' && row.previousElementSibling) {
      row.parentNode.insertBefore(row, row.previousElementSibling);
      btn.focus();
    } else if (action === 'down' && row.nextElementSibling) {
      row.parentNode.insertBefore(row.nextElementSibling, row);
      btn.focus();
    }
    this.refresh();
    this.notify();
  };

  /** Penomoran ulang + status tombol naik/turun + pesan kosong. */
  Repeater.prototype.refresh = function () {
    var rows = PKL.$$('.repeater__row', this.list);
    rows.forEach(function (row, i) {
      var no = PKL.$('[data-row-no]', row);
      if (no) no.textContent = String(i + 1);
      var up = PKL.$('[data-row-action="up"]', row);
      var down = PKL.$('[data-row-action="down"]', row);
      if (up) up.disabled = i === 0;
      if (down) down.disabled = i === rows.length - 1;
    });
    this.empty.hidden = rows.length > 0;
    if (this.maxNote) {
      var full = rows.length >= this.max;
      if (this.addBtn) this.addBtn.disabled = full;
      this.maxNote.hidden = !full;
    }
  };

  Repeater.prototype.getRows = function () {
    return PKL.$$('.repeater__row', this.list).map(function (row) {
      var data = {};
      PKL.$$('[data-field]', row).forEach(function (control) {
        data[control.getAttribute('data-field')] = control.value;
      });
      return data;
    });
  };

  Repeater.prototype.setRows = function (rows) {
    this.list.textContent = '';
    var frag = document.createDocumentFragment();
    // Data lama / impor backup yang melebihi batas dipotong ke batas maksimum.
    (rows || []).slice(0, this.max).forEach(function (values) { frag.appendChild(this.createRow(values)); }, this);
    this.list.appendChild(frag);
    this.refresh();
    this.notify();
  };

  Repeater.prototype.notify = function () {
    PKL.emit('pkl:repeater-change', { name: this.name, rows: this.getRows() });
  };

  PKL.repeater = {
    init: function (root) {
      PKL.$$('[data-repeater]', root).forEach(function (el) {
        var r = new Repeater(el);
        registry[r.name] = r;
        // Mulai dengan 1 baris kosong agar siswa langsung melihat bentuk isiannya.
        r.list.appendChild(r.createRow());
        r.refresh();
      });
    },
    get: function (name) { return registry[name] || null; },
    getRows: function (name) { return registry[name] ? registry[name].getRows() : []; },
    setRows: function (name, rows) { if (registry[name]) registry[name].setRows(rows); },
    names: function () { return Object.keys(registry); }
  };
})(window.PKL);

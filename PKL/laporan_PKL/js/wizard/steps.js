/**
 * Definisi 7 langkah wizard (docs/storyboard.md Scene 3–9).
 * Satu sumber untuk sidebar, dropdown mobile, ringkasan, dan checklist.
 */
(function (PKL) {
  'use strict';

  /**
   * `bab`      = label bab singkat di sidebar & dropdown HP (detail lengkap ada di `sub`).
   * `required` = isian wajib untuk status "Lengkap" & persentase kelengkapan.
   * Laporan tetap boleh dibuat walau belum lengkap (Langkah 7 hanya mengingatkan).
   * Label diambil otomatis dari <label for> / judul kartu; `labels` untuk tabel.
   */
  PKL.steps = [
    { id: 'langkah-1', bab: 'Hlm. Awal', no: 1, title: 'Identitas',   full: 'Identitas Siswa, Keluarga & Pengesahan', sub: 'Halaman Judul · Pengesahan · Lampiran 1',
      required: ['siswa_nama', 'siswa_nis', 'siswa_nisn', 'siswa_kelas', 'siswa_jk', 'guru_nama', 'kaprog_nama', 'kepsek_nama', 'tgl_pengesahan'] },
    { id: 'langkah-2', bab: 'Bab II', no: 2, title: 'Profil DUDI', full: 'Profil Dunia Kerja (DUDI)', sub: 'Bab II',
      required: ['dudi_nama', 'dudi_bidang', 'dudi_alamat', 'dudi_pimpinan', 'instruktur_nama', 'dudi_sejarah'] },
    { id: 'langkah-3', bab: 'Bab I', no: 3, title: 'Pendahuluan', full: 'Pendahuluan & Jadwal Pelaksanaan', sub: 'Bab I · Bab III.A',
      required: ['tahun_ajaran', 'bab1_latar_belakang', 'tgl_mulai', 'tgl_selesai'] },
    { id: 'langkah-4', bab: 'Bab III–IV', no: 4, title: 'Pelaksanaan', full: 'Pelaksanaan & Analisis', sub: 'Bab III · Bab IV',
      required: ['bab3_uraian_kegiatan', 'list_kompetensi', 'list_peralatan', 'bab4_analisis', 'list_kendala'] },
    { id: 'langkah-5', bab: 'Bab V', no: 5, title: 'Penutup',     full: 'Penutup, Refleksi & Daftar Pustaka', sub: 'Bab V · Lampiran 5',
      required: ['bab5_kesimpulan', 'saran_sekolah', 'saran_dudi', 'saran_siswa', 'refleksi_1', 'refleksi_2', 'refleksi_3', 'refleksi_4', 'refleksi_5'] },
    { id: 'langkah-6', bab: 'Lamp. 2–4, 6', no: 6, title: 'Lampiran',    full: 'Jurnal, Presensi & Dokumen Lampiran', sub: 'Lampiran 2, 3, 4, 6',
      required: ['list_jurnal', 'list_presensi_bulanan'] },
    { id: 'langkah-7', bab: 'Unduh', no: 7, title: 'Generate',    full: 'Review Akhir & Unduh Laporan', sub: 'File .docx', required: [] }
  ];

  /** Label ramah untuk tabel dinamis (tidak punya <label for>). */
  PKL.listLabels = {
    list_kompetensi: 'Tabel Kompetensi',
    list_peralatan: 'Tabel Peralatan',
    list_kendala: 'Tabel Kendala',
    list_jurnal: 'Jurnal Harian',
    list_presensi_bulanan: 'Presensi Bulanan',
    list_dokumentasi: 'Dokumentasi Foto'
  };

  /** Semua view yang valid untuk router, berurutan. */
  PKL.views = ['mulai', 'ringkasan'].concat(PKL.steps.map(function (s) { return s.id; }));

  PKL.getStep = function (id) {
    for (var i = 0; i < PKL.steps.length; i++) {
      if (PKL.steps[i].id === id) return PKL.steps[i];
    }
    return null;
  };
})(window.PKL);

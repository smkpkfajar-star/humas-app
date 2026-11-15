# Kontrak Data JSON (`Template_Laporan_PKL_Otomatis_v12.docx`)

Dokumen ini mendefinisikan struktur objek JavaScript (`reportState`) yang dipetakan langsung ke seluruh placeholder di dalam `Template_Laporan_PKL_Otomatis_v12.docx`.

**Sintaks placeholder di templat v12 (Docxtemplater):**

| Jenis | Sintaks | Contoh |
| :--- | :--- | :--- |
| Teks | `{nama}` | `{siswa_nama}` |
| Baris tabel berulang | `{#list}…{/list}` dalam 1 baris | `{#list_jurnal}{no} … {validasi}{/list_jurnal}` |
| Gambar | `{%nama}` | `{%dudi_struktur_img}`, `{%foto}`, `{%lampiran_sk_penempatan}`, `{%lampiran_surat_selesai}` |

Nilai `"IMAGE_BUFFER_FROM_INDEXEDDB"` di bawah berarti **string kunci IndexedDB** (misal `"img_struktur"`), bukan buffer — lihat `development.md` bagian 3.B.

---

## 1. Struktur Objek Data Lengkap

```json
{
  "sekolah_nama": "SMK Tamansiswa Jetis",
  "tahun_ajaran": "2026/2027",
  "tahun_cetak": "2026",
  "kota_pengesahan": "Yogyakarta",
  "tgl_pengesahan": "20 November 2026",

  "kompetensi_keahlian": "Rekayasa Perangkat Lunak (RPL)",

  "siswa_nama": "Bima Cahya Saputra",
  "siswa_nis": "24105",
  "siswa_nisn": "0087654321",
  "siswa_kelas": "XII RPL 1",
  "siswa_ttl": "Yogyakarta, 14 Mei 2008",
  "siswa_jk": "Laki-laki",
  "siswa_agama": "Islam",
  "siswa_alamat": "Jl. Pakuningratan No. 34, Jetis, Yogyakarta",
  "siswa_hp": "081234567890",
  "siswa_email": "bima.rpl@siswa.tamsis.sch.id",

  "ayah_nama": "Supriyanto",
  "ayah_pekerjaan": "Wiraswasta",
  "ibu_nama": "Siti Aminah",
  "ibu_pekerjaan": "Ibu Rumah Tangga",
  "ortu_hp": "081987654321",

  "kepsek_nama": "Asnan Wiharno, M.Pd.",
  "kaprog_nama": "Fajar Bagus Widiarno, S.Kom.",
  "guru_nama": "Fajar Bagus Widiarno, S.Kom.",

  "dudi_nama": "PT Inovasi Digital Nusantara",
  "dudi_bidang": "Pengembangan Perangkat Lunak dan Konsultan IT",
  "dudi_alamat": "Jl. Kaliurang Km 5, Sleman, Yogyakarta",
  "dudi_kontak": "(0274) 556677 / info@inovasidigital.id",
  "dudi_pimpinan": "Andi Pratama, S.T.",
  "instruktur_nama": "Rizky Ramadhan, S.Kom.",
  "instruktur_jabatan": "Lead Fullstack Developer",
  "instruktur_hp": "085611223344",

  "tgl_mulai": "01 Juli 2026",
  "tgl_selesai": "31 Oktober 2026",
  "lama_pelaksanaan": "4 Bulan (123 Hari)",
  "hari_kerja": "Senin s.d. Jumat",
  "jam_kerja": "08.00 – 16.00 WIB (Istirahat 12.00 – 13.00 WIB)",

  "bab1_latar_belakang": "Paragraf tambahan spesifik mengenai alasan pemilihan DUDI...",
  "bab1_tujuan_khusus": "1. Memahami alur pengembangan aplikasi web skala produksi...",
  "bab1_ruang_lingkup": "Kegiatan PKL difokuskan pada divisi pengembangan frontend dan pengujian API...",

  "dudi_sejarah": "Didirikan pada tahun 2018 di Yogyakarta...",
  "dudi_visi": "Menjadi mitra transformasi digital terpercaya di Indonesia.",
  "dudi_misi": "1. Menghadirkan solusi perangkat lunak berkualitas tinggi...",
  "dudi_struktur_img": "IMAGE_BUFFER_FROM_INDEXEDDB",
  "dudi_struktur_ket": "Struktur organisasi divisi teknis PT Inovasi Digital Nusantara.",
  "dudi_kegiatan_utama": "Pembuatan aplikasi web, sistem ERP, dan pemeliharaan server.",
  "dudi_fasilitas": "Ruang kerja ber-AC, akses internet fiber optik, perangkat kerja, dan ruang diskusi.",

  "bab3_uraian_kegiatan": "Selama 4 bulan pelaksanaan, kegiatan dibagi menjadi tahap orientasi, pengerjaan modul...",
  "list_kompetensi": [
    {
      "no": 1,
      "kompetensi": "Manajemen Versi Kode dengan Git & GitHub",
      "target": "Menguasai branching dan pull request tim",
      "ketercapaian": "Tercapai (100%)"
    }
  ],
  "list_peralatan": [
    {
      "no": 1,
      "nama": "Laptop & Visual Studio Code",
      "fungsi": "Menulis, menguji, dan melakukan debugging kode sumber aplikasi"
    }
  ],

  "bab4_analisis": "Penerapan alur kerja Git Flow meningkatkan efisiensi kolaborasi tim...",
  "list_kendala": [
    {
      "no": 1,
      "kendala": "Terjadi merge conflict saat menggabungkan fitur secara bersamaan",
      "solusi": "Melakukan git pull rutin sebelum push dan berkoordinasi lewat code review"
    }
  ],
  "bab4_pembelajaran": "Siswa memahami standar penulisan kode bersih dan komunikasi kerja profesional.",
  "bab4_kesesuaian": "Materi pemrograman web dan basis data di sekolah sangat relevan dengan kebutuhan DUDI.",

  "bab5_kesimpulan": "Pelaksanaan PKL berjalan lancar dan memberikan pengalaman kerja nyata...",
  "saran_sekolah": "Menambah porsi simulasi kerja tim menggunakan version control sebelum penerjunan PKL.",
  "saran_dudi": "Memberikan modul dokumentasi teknis awal bagi siswa baru pada minggu pertama.",
  "saran_siswa": "Mempersiapkan kemampuan dasar teknis dan menjaga kedisiplinan sejak hari pertama.",

  "daftar_pustaka": "Chacon, S., & Straub, B. (2014). Pro Git (2nd ed.). Apress.\nKemendikbudristek. (2024). Panduan Praktik Kerja Lapangan SMK.",

  "list_jurnal": [
    {
      "no": 1,
      "tanggal": "Senin, 01 Juli 2026",
      "kegiatan": "Orientasi lingkungan kerja dan setup repository proyek",
      "kompetensi": "Konfigurasi Lingkungan Pengembangan",
      "output": "Repository lokal terhubung ke server staging",
      "validasi": "Paraf"
    }
  ],

  "list_presensi_bulanan": [
    { "bulan": "Juli 2026", "hadir": 22, "izin": 0, "sakit": 1, "alpha": 0 },
    { "bulan": "Agustus 2026", "hadir": 21, "izin": 0, "sakit": 0, "alpha": 0 }
  ],
  "total_hadir": 43,
  "total_izin": 0,
  "total_sakit": 1,
  "total_alpha": 0,
  "persentase_kehadiran": "97.7",

  "list_dokumentasi": [
    {
      "foto": "IMAGE_BUFFER_FROM_INDEXEDDB",
      "tanggal": "15 Agustus 2026",
      "lokasi": "Ruang Developer PT Inovasi Digital",
      "keterangan": "Presentasi progres modul inventaris bersama instruktur DUDI"
    }
  ],

  "refleksi_1": "Pengalaman paling berkesan adalah saat fitur yang dikembangkan mulai digunakan klien.",
  "refleksi_2": "Kemampuan problem solving, debugging, dan komunikasi tim.",
  "refleksi_3": "Menyesuaikan standar kode industri yang diatasi dengan membaca dokumentasi dan bertanya aktif.",
  "refleksi_4": "Mendorong kesiapan untuk berkarier sebagai pengembang perangkat lunak setelah lulus.",
  "refleksi_5": "Jangan ragu mencatat setiap ilmu baru dan selalu menjaga etika komunikasi.",

  "lampiran_sk_penempatan": "IMAGE_BUFFER_FROM_INDEXEDDB",
  "lampiran_surat_selesai": "IMAGE_BUFFER_FROM_INDEXEDDB"
}
```

---

## 2. Ringkasan Pemetaan Lokasi Variabel di Templat

| Bagian Dokumen | Variabel Utama yang Digunakan |
| :--- | :--- |
| **Halaman Judul** | `dudi_nama`, `tahun_ajaran`, `siswa_nama`, `siswa_nis`, `siswa_nisn`, `siswa_kelas`, `kompetensi_keahlian`, `sekolah_nama`, `tahun_cetak` |
| **Lembar Pengesahan** | `siswa_nama`, `siswa_nis`, `siswa_nisn`, `siswa_kelas`, `kompetensi_keahlian`, `dudi_nama`, `kota_pengesahan`, `tgl_pengesahan`, `instruktur_nama`, `guru_nama`, `kaprog_nama`, `kepsek_nama` |
| **Kata Pengantar** | `dudi_nama`, `tgl_mulai`, `tgl_selesai`, `kompetensi_keahlian`, `tahun_ajaran`, `sekolah_nama`, `kepsek_nama`, `dudi_pimpinan`, `kaprog_nama`, `instruktur_nama`, `guru_nama`, `siswa_kelas`, `kota_pengesahan`, `tgl_pengesahan`, `siswa_nama` |
| **Bab I Pendahuluan** | `bab1_latar_belakang`, `kompetensi_keahlian`, `dudi_nama`, `bab1_tujuan_khusus`, `bab1_ruang_lingkup` |
| **Bab II Profil Dunia Kerja** | `dudi_nama`, `dudi_bidang`, `dudi_alamat`, `dudi_kontak`, `dudi_pimpinan`, `dudi_sejarah`, `dudi_visi`, `dudi_misi`, `dudi_struktur_img`, `dudi_struktur_ket`, `dudi_kegiatan_utama`, `dudi_fasilitas` |
| **Bab III Pelaksanaan PKL** | `dudi_nama`, `dudi_alamat`, `instruktur_nama`, `instruktur_jabatan`, `tgl_mulai`, `tgl_selesai`, `lama_pelaksanaan`, `hari_kerja`, `jam_kerja`, `bab3_uraian_kegiatan`, `list_kompetensi`, `list_peralatan` |
| **Bab IV Analisis & Pembahasan** | `bab4_analisis`, `list_kendala`, `bab4_pembelajaran`, `bab4_kesesuaian` |
| **Bab V Penutup & Pustaka** | `bab5_kesimpulan`, `sekolah_nama`, `saran_sekolah`, `dudi_nama`, `saran_dudi`, `saran_siswa`, `daftar_pustaka` |
| **Lampiran 1 – 6** | Identitas lengkap orang tua/pembimbing (tanpa NIP), `list_jurnal`, `list_presensi_bulanan` + total & persentase, `list_dokumentasi`, `refleksi_1` s.d. `refleksi_5`, `lampiran_sk_penempatan`, `lampiran_surat_selesai` |

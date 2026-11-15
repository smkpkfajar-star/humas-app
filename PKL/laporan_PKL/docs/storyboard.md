# Storyboard Aplikasi Generator Laporan PKL (HTML, CSS, & Vanilla JS)

## Konsep Alur: "Guided Step-by-Step Wizard (100% Client-Side)"
Karena templat `Template_Laporan_PKL_Otomatis_v12.docx` memuat identitas lengkap, narasi Bab I–V, 6 tabel dinamis, dan 4 slot gambar, antarmuka dibagi menjadi **7 langkah terstruktur** dengan penyimpanan otomatis di browser (`localStorage` & `IndexedDB`). Siswa dapat mengisi laporan secara bertahap tanpa khawatir data hilang maupun bingung melihat formulir panjang dalam satu halaman.

---

### Scene 1: Halaman Awal & Pemilihan Jurusan (`index.html` — Landing View)
* **Tujuan:** Menyambut siswa dengan tampilan bersih, memilih kompetensi keahlian, serta mendeteksi apakah sudah ada draft tersimpan di browser perangkat tersebut.
* **Elemen Layar:**
  * Header minimalis dengan identitas **SMK Tamansiswa Jetis**.
  * Pilihan **Kompetensi Keahlian** (`DKV`, `RPL`, `TITL`, `TSM`, `TKR`) untuk memuat contoh kalimat bantuan (*writing prompts*) dan daftar Ketua Program Keahlian secara otomatis.
  * Kartu deteksi draft lokal (jika ditemukan di `localStorage`): menampilkan nama siswa terakhir & tombol **"Lanjutkan Draft Tersimpan"**.
  * Tombol **"Mulai Laporan Baru"** dan tombol sekunder **"Impor Backup (.JSON)"** (jika siswa melanjutkan pengerjaan dari perangkat lain).

### Scene 2: Dashboard Ringkasan & Status Kelengkapan
* **Tujuan:** Memberikan gambaran menyeluruh mengenai bab-bab yang harus diisi dan status kelengkapannya.
* **Elemen Layar:**
  * Bilah progres keseluruhan (misal: *Kelengkapan Data: 60%*) dengan indikator visual lembut.
  * Daftar 7 bagian laporan yang dapat diklik langsung untuk melompat ke bagian tertentu.
  * Tombol **"Ekspor Backup (.JSON)"** di bilah atas agar siswa dapat menyimpan salinan mentah pekerjaannya kapan saja.

### Scene 3: Wizard Langkah 1 — Identitas Siswa, Keluarga & Pengesahan
* **Tujuan:** Mengisi data untuk Halaman Judul, Lembar Pengesahan, Kata Pengantar, dan Lampiran 1 dalam satu kali pengisian tanpa duplikasi.
* **Elemen Layar:**
  * **Sub-bagian A (Data Siswa & Orang Tua):** Nama Lengkap (`siswa_nama`), NIS (`siswa_nis`), NISN (`siswa_nisn`), Kelas (`siswa_kelas`), TTL (`siswa_ttl`), Jenis Kelamin (`siswa_jk`), Agama (`siswa_agama`), Alamat (`siswa_alamat`), No. HP & Email siswa, serta Nama, Pekerjaan, dan No. HP Ayah/Ibu.
  * **Sub-bagian B (Data Sekolah & Pengesahan):** **Guru Pembimbing** (pilih dari daftar atau ketik manual), **Ketua Program Keahlian** (`kaprog_nama` otomatis terisi sesuai jurusan yang dipilih di Scene 1), **Kepala Sekolah** (`kepsek_nama` = Asnan Wiharno, M.Pd., terisi otomatis), serta Kota & Tanggal Pengesahan.

### Scene 4: Wizard Langkah 2 — Profil Dunia Kerja / DUDI (Bab II)
* **Tujuan:** Melengkapi profil perusahaan/instansi tempat PKL beserta bagan struktur organisasinya.
* **Elemen Layar:**
  * Form identitas DUDI: Nama DUDI (`dudi_nama`), Bidang Usaha (`dudi_bidang`), Alamat (`dudi_alamat`), Kontak (`dudi_kontak`), Nama Pimpinan (`dudi_pimpinan`), serta Nama, Jabatan, dan No. HP Instruktur Dunia Kerja.
  * Area teks terpandu untuk Sejarah Singkat (`dudi_sejarah`), Visi (`dudi_visi`), Misi (`dudi_misi`), Bidang Usaha & Kegiatan Utama (`dudi_kegiatan_utama`), serta Fasilitas & Lingkungan Kerja (`dudi_fasilitas`).
  * **Area Unggah Gambar Struktur Organisasi** (`dudi_struktur_img`) dengan pratinjau langsung, kompresi otomatis di browser, dan kolom keterangan gambar (`dudi_struktur_ket`).

### Scene 5: Wizard Langkah 3 — Pendahuluan & Jadwal Pelaksanaan (Bab I & Bab III.A)
* **Tujuan:** Menyusun konteks laporan dan jadwal kehadiran resmi selama PKL.
* **Elemen Layar:**
  * Input **Tahun Ajaran** (`tahun_ajaran`). Isian Judul Laporan ditiadakan.
  * Editor teks dengan panel lipat *"Lihat Contoh Penulisan"* sesuai jurusan untuk Latar Belakang tambahan (`bab1_latar_belakang`), Tujuan Khusus (`bab1_tujuan_khusus`), dan Ruang Lingkup (`bab1_ruang_lingkup`).
  * Pemilih tanggal mulai (`tgl_mulai`) & tanggal selesai (`tgl_selesai`) yang secara otomatis menghitung `lama_pelaksanaan` (contoh: *4 Bulan (123 Hari)*), ditambah input `hari_kerja` dan `jam_kerja`.

### Scene 6: Wizard Langkah 4 — Kegiatan, Kompetensi, Peralatan & Analisis (Bab III & Bab IV)
* **Tujuan:** Mengisi narasi pelaksanaan dan tabel-tabel dinamis secara interaktif.
* **Elemen Layar:**
  * Narasi Uraian Kegiatan Harian dan Mingguan (`bab3_uraian_kegiatan`).
  * **Tabel Dinamis Kompetensi** (`list_kompetensi`): Tombol **"+ Tambah Kompetensi"** (kolom: Kompetensi/Materi, Target, Ketercapaian; nomor urut otomatis).
  * **Tabel Dinamis Peralatan & Bahan** (`list_peralatan`): Tombol **"+ Tambah Peralatan"** (kolom: Nama Peralatan/Perangkat/Bahan, Fungsi dan Kegunaan).
  * **Tabel Dinamis Kendala & Solusi** (`list_kendala`): Tombol **"+ Tambah Kendala"** (kolom: Kendala yang Dihadapi, Solusi yang Dilakukan).
  * Narasi Analisis Kegiatan (`bab4_analisis`), Pembelajaran yang Diperoleh (`bab4_pembelajaran`), dan Kesesuaian dengan Kompetensi Keahlian (`bab4_kesesuaian`).

### Scene 7: Wizard Langkah 5 — Penutup, Refleksi Diri & Daftar Pustaka (Bab V & Lampiran 5)
* **Tujuan:** Menyelesaikan kesimpulan, saran untuk 3 pihak, daftar pustaka, dan 5 poin refleksi diri.
* **Elemen Layar:**
  * Input Kesimpulan (`bab5_kesimpulan`) serta Saran untuk Sekolah (`saran_sekolah`), Dunia Kerja (`saran_dudi`), dan Siswa PKL Berikutnya (`saran_siswa`).
  * Form 5 pertanyaan **Refleksi Diri Siswa** (`refleksi_1` s.d. `refleksi_5`).
  * Area input **Daftar Pustaka** (`daftar_pustaka`) dengan contoh format penulisan APA Style sederhana.

### Scene 8: Wizard Langkah 6 — Jurnal Harian, Presensi & Lampiran Dokumen (Lampiran 2, 3, 4, 6)
* **Tujuan:** Mengelola logbook harian, rekap absensi bulanan, foto kegiatan, dan scan surat resmi.
* **Elemen Layar:**
  * **Jurnal Harian (`list_jurnal`):** Bisa ditambah manual per baris **atau diimpor sekaligus dari file `.csv`** (disediakan tombol *"Unduh Contoh CSV Jurnal"*).
  * **Rekapitulasi Presensi (`list_presensi_bulanan`):** Input per bulan (Bulan, Hadir, Izin, Sakit, Alpa). Total Hadir, Izin, Sakit, Alpa, dan **Persentase Kehadiran** dihitung otomatis secara *real-time*.
  * **Dokumentasi Foto Kegiatan (`list_dokumentasi`):** Unggah foto kegiatan (otomatis dikompresi di browser) disertai input Tanggal, Lokasi, dan Keterangan kegiatan.
  * **Upload Scan Surat Resmi:** 2 slot unggah gambar untuk **Scan Surat/SK Penempatan PKL** (`lampiran_sk_penempatan`) dan **Scan Surat Keterangan Selesai / Sertifikat PKL** (`lampiran_surat_selesai`).

### Scene 9: Wizard Langkah 7 — Review Akhir & Generate File `.DOCX`
* **Tujuan:** Memeriksa kelengkapan akhir dan mengunduh dokumen Word jadi langsung dari browser.
* **Elemen Layar:**
  * Ringkasan *checklist* kelengkapan seluruh bab dan lampiran (menandai bagian wajib yang masih kosong).
  * Kotak informasi panduan singkat: *"Setelah file .docx diunduh, buka di Microsoft Word lalu tekan Ctrl+A dan F9 untuk memperbarui nomor halaman Daftar Isi secara otomatis."*
  * Tombol utama **"Generate & Unduh Laporan (.DOCX)"** yang merender `Template_Laporan_PKL_Otomatis_v12.docx` langsung di perangkat siswa tanpa perlu koneksi internet maupun server backend.

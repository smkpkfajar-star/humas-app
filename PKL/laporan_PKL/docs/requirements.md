# Requirements Specification — Generator Laporan PKL (Client-Side HTML/CSS/JS)

## 1. Tujuan Sistem
Membangun aplikasi web statis berbasis **HTML5, CSS3, dan Vanilla JavaScript (ES6+)** yang mampu menghasilkan dokumen Microsoft Word (`.docx`) Laporan Praktik Kerja Lapangan (PKL) sesuai `Template_Laporan_PKL_Otomatis_v12.docx` secara langsung di sisi browser (*100% client-side*), tanpa memerlukan backend server maupun database eksternal.

---

## 2. Kebutuhan Fungsional (Functional Requirements)

### FR-01: Penyimpanan Otomatis Lokal & Manajemen Backup
* Sistem menyimpan seluruh data teks dan tabel secara otomatis ke `localStorage` setiap kali pengguna mengubah input (*debounced auto-save* 500ms).
* Sistem menyimpan data gambar (Struktur Organisasi, Foto Dokumentasi, Scan SK Penempatan, Scan Surat Selesai) ke **IndexedDB** agar tidak terkena batas kapasitas 5MB milik `localStorage`.
* Sistem menyediakan fitur **Ekspor Draft (`.json`)** dan **Impor Draft (`.json`)** agar siswa dapat memindahkan pengerjaan antarperangkat (misalnya dari HP ke komputer lab sekolah). File backup menyertakan gambar (base64) sehingga foto ikut berpindah.

### FR-02: Otomatisasi Data Master Sekolah
* Sistem memuat data referensi dari file **`pengaturan.js`** di folder utama (format JSON, dapat disunting admin tanpa mengubah kode) yang berisi:
  * Identitas Sekolah (`SMK Tamansiswa Jetis`, kota) dan Nama Kepala Sekolah (`Asnan Wiharno, M.Pd.`).
  * Untuk setiap prodi (`DKV`, `RPL`, `TITL`, `TSM`, `TKR`): nama prodi, nama Kajur, dan daftar Guru Pembimbing (Pendamping).
* Ketika siswa memilih jurusan, nama Kajur otomatis terisi dan combobox Guru Pembimbing menampilkan pendamping prodi tersebut (tetap dapat diketik/diedit manual).
* **NIP tidak digunakan** di aplikasi maupun laporan (dihapus dari Lembar Pengesahan dan Lampiran 1).

### FR-03: Manajemen Tabel Dinamis (`{%tr for %}`)
* Sistem mendukung penambahan, penghapusan, dan pengurutan baris secara dinamis di DOM untuk 6 tabel berikut:
  1. `list_kompetensi` (Tabel 3.2)
  2. `list_peralatan` (Tabel 3.3)
  3. `list_kendala` (Tabel 4.1)
  4. `list_jurnal` (Lampiran 2)
  5. `list_presensi_bulanan` (Lampiran 3)
  6. `list_dokumentasi` (Lampiran 4)
* Properti `no` (`1, 2, 3, ...`) digenerate otomatis oleh JavaScript sebelum proses render dokumen.

### FR-04: Impor Massal Jurnal Harian via CSV
* Sistem menyediakan tombol unduh templat `.csv` standar (`tanggal,kegiatan,kompetensi,output,validasi`).
* Siswa dapat mengunggah file `.csv` yang sudah diisi di Excel/Google Sheets untuk langsung mengisi puluhan baris pada `list_jurnal`.

### FR-05: Kalkulasi Otomatis Durasi & Presensi
* **Durasi PKL (`lama_pelaksanaan`):** Dihitung otomatis dari selisih `tgl_mulai` dan `tgl_selesai` (menampilkan jumlah bulan dan total hari kalender).
* **Rekap Presensi (Lampiran 3):** Setiap perubahan angka pada `list_presensi_bulanan` langsung memperbarui:
  * `total_hadir`, `total_izin`, `total_sakit`, `total_alpha`
  * `persentase_kehadiran` = `round(total_hadir / (total_hadir + total_izin + total_sakit + total_alpha) × 100, 1)` — contoh: 43 / 44 × 100 = `97.7`; angka bulat ditulis tanpa desimal (`100`, bukan `100.0`). Jika total hari = 0, tampilkan `0`.
ight)$

### FR-06: Kompresi & Penyisipan Gambar Client-Side
* Mendukung unggah gambar `JPG`, `JPEG`, `PNG`, dan `WEBP`.
* Menggunakan HTML5 `<canvas>` untuk mengubah ukuran (*resize*) gambar secara proporsional (output JPEG kualitas `0.82`) sebelum diubah menjadi `ArrayBuffer` untuk `docxtemplater`:
  * `dudi_struktur_img`: Lebar maksimal `135 mm` (`~510 px` pada 96 DPI)
  * `dok.foto` (Lampiran 4): Lebar maksimal `60 mm` (`~225 px`)
  * `lampiran_sk_penempatan` & `lampiran_surat_selesai`: Lebar maksimal `150 mm` (`~565 px`)
* Ukuran di atas adalah ukuran **tampil** di dokumen; piksel yang disimpan 2× lebih besar agar hasil cetak tajam. Tinggi juga dibatasi agar gambar muat satu halaman.

### FR-07: Engine Generate `.DOCX` di Browser
* Memuat file `Template_Laporan_PKL_Otomatis_v12.docx` via `fetch()` (dan menyediakan fallback `<input type="file">` apabila halaman dibuka langsung melalui protokol lokal `file://`).
* Merender seluruh placeholder teks, perulangan tabel (`{#list}…{/list}`), dan gambar (`{%nama}`) menggunakan `PizZip` + `Docxtemplater` + `docxtemplater-image-module-free`, lalu mengunduh file akhir bernama `Laporan_PKL_[Nama_Siswa]_[Kelas].docx` melalui `FileSaver.js`.

---

## 3. Kebutuhan Non-Fungsional (Non-Functional Requirements)

* **NFR-01 (Tanpa Build Tools / Mudah Dikelola):** Kode ditulis menggunakan HTML, CSS, dan JavaScript ES6+ yang dimuat dengan `<script>` klasik (bukan ES Modules) dan namespace global `window.PKL`, sehingga aplikasi berjalan baik lewat server statis (Live Server, GitHub Pages, Vercel, Netlify) **maupun** dibuka langsung via `file://` (klik ganda `index.html` di komputer lab) tanpa proses kompilasi.
* **NFR-02 (Kenyamanan Visual / Eye-Friendly):** Menggunakan skema warna kertas hangat dengan kontras ramah mata (rasio kontras $\ge 4.5:1$) dan lebar area form optimal (`max-width: 780px`).
* **NFR-03 (Responsif):** Tampilan rapi pada layar laptop/PC sekolah (`1024px–1440px`) maupun layar ponsel siswa (`360px–480px`).
* **NFR-04 (Privasi & Keamanan Data):** Karena seluruh pemrosesan terjadi di browser perangkat pengguna, data pribadi siswa (NISN, alamat, kontak orang tua) tidak pernah dikirim ke server pihak ketiga mana pun.

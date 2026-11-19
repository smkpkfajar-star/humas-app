# Development Guide — Arsitektur HTML, CSS, & Vanilla JavaScript

## 1. Tech Stack (100% Client-Side, Tanpa Backend)

* **Markup:** HTML5 Semantik (single-page wizard dengan pergantian tampilan antar-langkah berbasis JavaScript).
* **Styling:** CSS3 Modular (`tokens.css`, `base.css`, `layout.css`, `components.css`) menggunakan CSS Grid, Flexbox, dan Custom Properties.
* **Logic:** Vanilla JavaScript (ES6+) tanpa framework, dimuat dengan `<script>` klasik berurutan (bukan ES Modules — diblokir browser di `file://`). Setiap file mendaftar ke namespace `window.PKL` (mis. `PKL.repeater`); urutan `<script>` di `index.html` = urutan dependensi.
* **Penyimpanan Lokal:**
  * `localStorage` untuk menyimpan seluruh state teks & tabel dalam format JSON.
  * `IndexedDB` (melalui wrapper ringan ~40 baris JS) untuk menyimpan biner/DataURL gambar agar tidak melebihi batas kuota `localStorage`.
* **Library Eksternal (folder lokal `vendor/`, tanpa CDN — aplikasi tetap jalan offline; lisensi di `vendor/licenses/`):**
  * `pizzip-3.3.0.min.js` — Membaca dan memodifikasi struktur ZIP di dalam file `.docx`.
  * `docxtemplater-3.71.1.min.js` — Mengisi variabel `{nama}` dan perulangan baris tabel `{#list}…{/list}`. Opsi wajib: `paragraphLoop: true`, `linebreaks: true`.
  * `docxtemplater-image-module-free-1.1.1.browser.js` — Menyisipkan gambar `{%nama}`. **Dibundel ulang** oleh `tools/build-image-module.js` karena bundel bawaan paket rusak di browser modern (lihat bagian 7).
  * `FileSaver-2.0.5.min.js` — Memicu unduhan file `.docx` di semua browser.
* Templat v12 dihasilkan dari v11 (sintaks Jinja/docxtpl) oleh `tools/convert-template.py`. **Jangan edit v12 manual** — edit v11 di Word lalu jalankan ulang `python tools/convert-template.py`.
  * `FileSaver.min.js` — Memicu unduhan file `.docx` hasil generate di semua browser.

---

## 2. Struktur Direktori Proyek

```text
pkl-report-generator/
├── index.html                          # Halaman utama aplikasi wizard
├── pengaturan.js                       # PENGATURAN SEKOLAH (format JSON): kepsek, Kajur & pendamping per prodi
├── assets/
│   ├── logo-sekolah.png                # Logo SMK Tamansiswa Jetis
│   └── templates/
│       ├── Template_Laporan_PKL_Otomatis_v11.docx   # Sumber (sintaks Jinja) — edit di sini
│       └── Template_Laporan_PKL_Otomatis_v12.docx   # Hasil konversi — dipakai aplikasi
├── css/
│   ├── tokens.css                      # Palet warna, tipografi, dan variabel spasi
│   ├── base.css                        # Reset CSS & tipografi dasar nyaman di mata
│   ├── layout.css                      # Grid sidebar + area kerja utama + responsif
│   └── components.css                  # Kartu, input, repeater tabel, dropzone, accordion
├── js/
│   ├── app.js                          # Inisialisasi aplikasi, routing langkah, event listener
│   ├── core/
│   │   ├── namespace.js                # window.PKL + helper ($, $$, emit, on, uid)
│   │   ├── state.js                    # Manajemen state global & auto-save localStorage
│   │   ├── image-db.js                 # Wrapper IndexedDB & kompresi HTML5 Canvas (2x, EXIF, latar putih)
│   │   ├── calculations.js             # Hitung durasi PKL, penomoran otomatis, & presensi (fungsi murni)
│   │   ├── completeness.js             # Persentase kelengkapan, status langkah, checklist, tanda *
│   │   ├── csv-importer.js             # Parser CSV jurnal (Lampiran 2): deteksi , ; Tab, UTF-8/ANSI, RFC 4180
│   │   ├── docx-generator.js           # buildData() + muat templat (fetch / cache) + render + gambar + isi Daftar Isi
│   │   └── page-layout.js              # .docx hasil render → halaman A4 (PDF & nomor Daftar Isi)
│   ├── wizard/
│   │   ├── steps.js                    # Definisi 7 langkah (judul, sub-bab)
│   │   ├── step-renderer.js            # Navigasi langkah, tampil/sembunyi view, progres
│   │   ├── form-binding.js             # Sinkron field [name] & repeater <-> PKL.state
│   │   ├── autofill.js                 # Isi otomatis data master + nilai turunan (durasi, presensi)
│   │   ├── dialog.js                   # Dialog pilihan <dialog> native (mis. Tambahkan / Ganti Semua)
│   │   ├── writing-guides.js           # Memasang panduan & contoh penulisan sesuai jurusan
│   │   ├── image-slots.js              # Dropzone → kompres → IndexedDB → pratinjau; GC gambar yatim
│   │   ├── generate-panel.js           # Tombol Generate .docx & Pratinjau PDF, status, pemilih templat
│   │   ├── pdf-preview.js              # Overlay pratinjau PDF + Simpan sebagai PDF (dialog cetak)
│   │   ├── auto-rows.js                # Jurnal & Presensi otomatis dari tanggal PKL + Hari Kerja
│   │   ├── word-count.js               # Penghitung kata + saran panjang minimal isian narasi
│   │   └── repeater.js                 # Komponen tabel dinamis (+ Tambah / Hapus baris)
│   └── data/
│       ├── master-sekolah.js           # Membaca & memvalidasi pengaturan.js (cadangan bila rusak)
│       └── writing-prompts.js          # Contoh kalimat pengisian per jurusan (RPL, DKV, dll)
├── vendor/                             # Library pihak ketiga (+ licenses/)
├── tools/
│   ├── convert-template.py             # Konversi templat v11 (Jinja) → v12 (Docxtemplater)
│   ├── tidy_template.py                # Perapian tata letak v11 saat konversi (dipanggil otomatis)
│   └── build-image-module.js           # Bundel ulang image module untuk browser (sekali saja)
└── docs/
    ├── storyboard.md
    ├── requirements.md
    ├── design.md
    ├── development.md
    └── template-mapping.md
```

---

## 3. Tantangan Teknis Client-Side & Solusinya

### A. Memuat File Templat `.docx` Saat Offline vs Online
* **Kondisi Web Server (GitHub Pages / Vercel / Live Server):** `docx-generator.js` mengambil file templat otomatis melalui `fetch('./assets/templates/Template_Laporan_PKL_Otomatis_v12.docx')`.
* **Kondisi Dibuka Langsung (`file:///.../index.html`):** Browser memblokir `fetch()` lokal karena kebijakan CORS. Solusinya: jika `fetch()` gagal, antarmuka otomatis menampilkan tombol *"Pilih File Template_Laporan_PKL_Otomatis_v12.docx"* (`<input type="file" accept=".docx">`) sehingga aplikasi tetap berjalan 100% offline.

### B. Penanganan Gambar dengan HTML5 `<canvas>` + `IndexedDB`
> Implementasi final: lihat bagian 7.
1. Saat siswa memilih foto di `<input type="file" accept="image/*">`, `image-db.js` menggambar foto ke `<canvas>` tersembunyi untuk mengubah lebar maksimalnya sesuai FR-06 di `requirements.md` (510 / 225 / 565 px) dengan kualitas JPEG `0.82`.
2. Hasil kompresi (`ArrayBuffer`) disimpan ke `IndexedDB` dengan kunci unik (misal `img_struktur`, `img_dok_1`, `img_sk`, `img_selesai`).
3. Di `reportState`, field gambar berisi **string kunci IndexedDB** (bukan buffer). Saat **Generate `.DOCX`** diklik, `docx-generator.js` memuat semua buffer ke sebuah peta `imageStore`, lalu `ImageModule` dikonfigurasi dengan `getImage: (key) => imageStore[key]` dan `getSize` per nama tag.
   > ⚠️ `docxtemplater-image-module-free` menganggap nilai tag berbentuk *object* (termasuk `ArrayBuffer`) sebagai hasil render yang sudah jadi, sehingga render gagal (`Cannot read properties of undefined (reading '0')`). Selalu kirim string kunci.
4. Field gambar yang kosong (siswa belum unggah) diisi string kosong `""` — modul akan melewatinya tanpa error.

### C. Menjaga Keutuhan Tabel Word (`{#list}…{/list}`)
Pada `Template_Laporan_PKL_Otomatis_v12.docx`, setiap tabel dinamis cukup memiliki 1 baris isi: `{#list_kompetensi}{no} | {kompetensi} | {target} | {ketercapaian}{/list_kompetensi}`. Docxtemplater otomatis mengulang seluruh baris tabel. Di dalam loop, field ditulis tanpa awalan (`{no}`, bukan `{item.no}`).
* Sebelum memanggil `doc.render(data)`, `docx-generator.js` memastikan setiap array (`list_kompetensi`, `list_peralatan`, `list_kendala`, `list_jurnal`, `list_presensi_bulanan`, `list_dokumentasi`) memiliki minimal 1 objek (jika siswa mengosongkannya, diisi 1 baris default berisi tanda `"-"`) agar tabel Word tidak berantakan.

### D. Nomor Halaman Daftar Isi & PDF
Browser tidak menjalankan mesin tata letak Word, jadi aplikasi punya penata halaman sendiri (`js/core/page-layout.js`, lihat bagian 9). Saat **Generate .docx**, dokumen ditata ke halaman A4 di wadah tersembunyi, lalu hasil field `PAGEREF` di Daftar Isi diisi nomor halamannya, sehingga Daftar Isi sudah terisi walau dibuka di WPS, Google Docs, atau penampil HP. Word tetap menawarkan pembaruan field saat file dibuka (`updateFields`); **Ctrl + A → F9** tetap berlaku sebagai cadangan. Tata letak yang sama dipakai untuk **Pratinjau & Simpan PDF**.

---

## 4. Urutan Pengerjaan (Milestones)

1. **Tahap 1 — Kerangka HTML & CSS (`tokens.css`, `base.css`, `layout.css`, `components.css`):** Membangun cangkang antarmuka *Calm Academic Paper* beserta navigasi 7 langkah.
2. **Tahap 2 — State Management & Data Master (`state.js`, `master-sekolah.js`, `calculations.js`):** Menghubungkan semua input form dengan *auto-save* `localStorage`, kalkulasi presensi, dan fitur ekspor/impor `.json`.
3. **Tahap 3 — Komponen Tabel Dinamis & Impor CSV (`repeater.js`, `csv-importer.js`):** Membangun baris tabel tambah/hapus untuk Bab III, Bab IV, dan Lampiran 2–4.
4. **Tahap 4 — Penyimpanan Gambar & Engine `.DOCX` (`image-db.js`, `docx-generator.js`):** Mengintegrasikan kompresi gambar Canvas, `IndexedDB`, dan `Docxtemplater` dengan `Template_Laporan_PKL_Otomatis_v12.docx`.
5. **Tahap 5 — Pengujian Lintas Jurusan:** Uji coba pengisian penuh untuk skenario siswa `RPL`, `DKV`, `TITL`, `TSM`, dan `TKR` serta pengecekan hasil cetak di Microsoft Word.

---

## 5. Catatan Implementasi Tahap 2

* **Kunci localStorage:** `pkl-laporan:draft` → `{ app, schema, updatedAt, data }`. Format backup `.json` sama dengan ditambah `exportedAt`. Naikkan `SCHEMA` di `state.js` bila struktur data berubah.
* **Aturan isi otomatis:** field (Kaprog, Kepsek, tahun ajaran, dll.) hanya ditimpa bila masih kosong **atau** masih sama dengan nilai otomatis terakhir (`state._auto`). Isian yang diubah siswa tidak pernah ditimpa.
* **Isian wajib** didefinisikan sekali di `js/wizard/steps.js` (`required`). Tanda `*` pada label, persentase kelengkapan, dan checklist Langkah 7 diturunkan dari sana.
* **Tanggal** disimpan ISO (`2026-07-01`); diformat `01 Juli 2026` oleh `PKL.calc.formatDate()` saat generate (Tahap 4).
* **Impor backup** disanitasi (hanya string/angka/array objek datar, kunci alfanumerik, batas panjang) untuk mencegah data rusak dan *prototype pollution*.
* **Data master contoh:** ganti isi `js/data/master-sekolah.js` lalu ubah `isSample: false` agar peringatan "data contoh" di Langkah 1 hilang.

## 6. Catatan Implementasi Tahap 3 — Impor CSV Jurnal

* **File contoh** `Contoh_Jurnal_Harian_PKL.csv`: pemisah koma, ber-BOM UTF-8, kolom `tanggal,kegiatan` (Lampiran 2 hanya No | Hari dan Tanggal | Kegiatan). Kolom lain di file siswa — kompetensi, output, paraf, dll. — diabaikan.
* **Toleransi input:** pemisah `,` / `;` (Excel lokal Indonesia) / Tab dideteksi otomatis; baris `sep=;` dihormati; UTF-8 (dengan/tanpa BOM) atau ANSI Windows-1252 (fallback otomatis); sel ber-kutip berisi koma, `""`, dan baris baru (Alt+Enter → `
`).
* **Judul kolom fleksibel** (huruf besar/kecil & simbol diabaikan): mis. `Hari/Tanggal`, `Uraian Kegiatan`, `Kegiatan yang Dilakukan`. Urutan kolom bebas; kolom tambahan (mis. `No`) diabaikan. Bila tidak ada judul yang dikenali, kolom dibaca berurutan sesuai file contoh.
* **Tanggal** `01/07/2026`, `1-7-2026`, `2026-07-01` → `Rabu, 01 Juli 2026` (hari-dulu; format AS ditukar bila bulan > 12). Teks bebas dibiarkan.
* **Baris** tanpa kegiatan & tanggal dilewati; jurnal hanya berisi tanggal & kegiatan; maksimal 1000 baris; file maks. 2 MB; file `.xlsx` ditolak dengan petunjuk *Save As CSV*.
* **Jurnal sudah berisi** → dialog *Tambahkan di Akhir / Ganti Semua / Batal*. Jurnal kosong → langsung diisi.
* **Catatan uji:** `TextDecoder('windows-1252')` di Node.js berperilaku seperti latin1 (0x96 ≠ "–"); browser mengikuti standar WHATWG. Uji encoding ANSI harus dijalankan di browser.

## 7. Catatan Implementasi Tahap 4 — Gambar & Generate .DOCX

* **Kompresi gambar** (`image-db.js`): ukuran **tampil** di Word mengikuti FR-06 (struktur 510 px, foto 225 px, scan 565 px lebar @96 DPI) dan dibatasi tinggi (620 / 300 / 820 px) agar muat satu halaman. Piksel yang disimpan **2× ukuran tampil** supaya tajam saat dicetak. Output selalu JPEG kualitas 0.82; orientasi EXIF foto HP diterapkan; PNG transparan diberi latar putih.
* **IndexedDB** `pkl-laporan` / store `images`: kunci `img_<slot>_<acak>` berisi `{ blob, width, height, displayWidth, displayHeight, name, slot }`. Field di state hanya menyimpan kuncinya. Gambar yatim (baris dihapus / diganti) dibersihkan saat start-up dan setelah generate.
* **Backup `.json` menyertakan gambar** (base64 di `images`) agar foto ikut pindah perangkat; saat impor gambar divalidasi (kunci, `data:image/jpeg;base64`, ukuran).
* **Templat:** di server (http/https) dimuat via `fetch`. Di `file://` fetch tidak dicoba (pasti diblokir CORS) → dipakai templat yang **pernah dipilih pengguna** (disimpan di IndexedDB kunci `__template_v12__`); bila belum ada, muncul tombol *Pilih File Templat*. Templat v11 / file lain ditolak dengan pesan jelas.
* **Data render** (`PKL.docx.buildData`): tanggal → `01 Juli 2026`; baris tabel kosong dibuang; tabel tanpa isi → 1 baris `-`; kolom `no` dinomori; presensi & durasi dihitung ulang; gambar yang hilang dilewati dengan peringatan.
* **Daftar Isi:** templat sudah memuat `<w:updateFields w:val="true"/>` → Word menawarkan memperbarui nomor halaman saat file dibuka. Panduan Ctrl+A → F9 tetap ditampilkan sebagai cadangan (LibreOffice / bila ditolak).
* **Image module dibundel ulang** (`tools/build-image-module.js`, esbuild): bundel bawaan `docxtemplater-image-module-free` membawa `xmldom` lama dan menulis `element.namespaceURI = null`, yang **melempar TypeError di DOM native** dan—bila sekadar dihapus—menghasilkan `xmlns=""` sehingga Word tidak menemukan gambar. Patch: `createElementNS(<namespace akar>, …)` + ekstensi file `.jpeg` agar Content-Type sesuai isi. Patch diverifikasi (gagal keras bila versi modul berubah).
* **Navigasi setelah impor/hapus data** memakai satu `location.reload()`; tujuan hash disimpan di `sessionStorage` lalu diterapkan dengan `history.replaceState` (mencegah dua navigasi saling balapan di `file://`).

## 8. Perapian Templat (v12 revisi 3)

`python tools/convert-template.py` menjalankan `tools/tidy_template.py` lebih dulu. **v11 tetap utuh**; perapian diterapkan ulang setiap kali v12 dibuat.

| Bagian | Di v12 |
| :--- | :--- |
| Nomor halaman awal (romawi) & titik-titik Daftar Isi | **Dipertahankan persis seperti v11**: footer berisi teks `ii`, `iii`, `iv`, `v` dan titik ketikan + tab. Teks biasa tampil sama di semua aplikasi (Word, WPS, Google Docs, penampil HP). Revisi 2 sempat menggantinya dengan field `PAGE`/`PAGEREF` + tab leader, tetapi di sebagian aplikasi angka romawi & titik tidak muncul — **dikembalikan** atas permintaan pengguna. |
| Tabel identitas 3 kolom sama lebar → kolom ":" lebar, isi terlipat | Lebar kolom tetap: label / ":" sempit / isi lebar |
| NIP di tanda tangan (Instruktur, Guru, Kaprog, Kepsek) & Lampiran 1 | **Dihapus**. Draft/backup lama yang masih berisi NIP dibersihkan otomatis saat dimuat (`DROPPED_KEYS` di `state.js`). |
| Isian Judul Laporan | **Ditiadakan**: baris judul di sampul dan frasa ' dengan judul "…"' di Kata Pengantar dihapus. Judul di draft lama dibuang (`DROPPED_KEYS`). |
| Lembar Pengesahan: jarak nama tidak seragam, sel rata tengah, hanya nama Kepsek tebal | Semua blok tanda tangan seragam: jabatan → 4 baris ruang tanda tangan → **nama tebal**; sel rata atas sehingga nama sejajar; jarak antarbaris tanda tangan tetap (18 pt). Format tebal lama (`<w:b w:val="0"/>`) diganti, tidak digandakan. |
| Tabel 3.2: kolom Target 3,2 cm → isi terlipat 3–4 baris | No 1,1 · Kompetensi 4,9 · **Target 4,9** · Ketercapaian 3,1 cm (total tetap selebar teks) |
| Lampiran 2 (jurnal) 6 kolom terlalu padat untuk 6 bulan | Disederhanakan jadi 3 kolom: No (1,1 cm) · Hari dan Tanggal (4,2 cm) · Kegiatan (sisa lebar) — `fix_journal_table` di `tools/tidy_template.py`. Templat lama yang masih memuat `{validasi}` ditolak (`OUTDATED_TEMPLATE`) agar siswa memilih file baru. |
| Sampul campur kapital-kecil, baris kompetensi terlalu panjang | Kapital (`w:caps`), nama kompetensi di baris sendiri; teks alternatif logo = nama sekolah terbaru |
| Isian multi-baris jadi `<w:br/>` → hanya paragraf pertama menjorok, daftar tidak rapi | Tag `{@nama}`: setiap baris = paragraf Word dengan format templat; baris `1.` / `a.` / `-` = daftar menggantung; Daftar Pustaka menggantung (APA) |

* Format paragraf untuk `{@nama}` diambil **saat runtime** dari templat (`extractParagraphSpecs`), jadi perubahan format di v11 otomatis ikut.
* Kunci cache templat di perangkat (`file://`) = `__template_v12r6__`; cache revisi lama diabaikan sehingga siswa memilih file terbaru sekali lagi.
* Uji e2e memastikan footer romawi = `["", "ii", "iii", "iv", "v"]` dan 35 entri Daftar Isi bertitik, agar tidak berubah tanpa sengaja.
* Catatan: karena nomor romawi berupa teks, Kata Pengantar dirancang tepat 2 halaman (iii–iv). Bila isinya diubah hingga lebih/kurang dari 2 halaman, sesuaikan footer di v11.

## 9. Ketahanan terhadap Isian Tidak Wajar

Diuji dengan simulasi "isian paling tidak masuk akal" (24 skenario, semua lolos):

| Isian siswa | Perilaku aplikasi |
| :--- | :--- |
| Teks sangat panjang | Batas terlihat: isian pendek 300, paragraf 30.000, sel tabel 500/5.000 karakter; muncul pesan saat batas tercapai. Penyimpanan menampung 100.000 → tidak ada pemotongan diam-diam saat muat ulang. |
| Nama/kelas aneh (emoji, simbol, 300+ karakter) | Nama file dibersihkan (`PKL.calc.safeNamePart`): huruf/angka/`-.()` saja, maks. 60 + 30 karakter. Tanpa ini browser **membatalkan unduhan tanpa pesan**. |
| `<script>`, `{siswa_nama}`, `&`, kutip | Tampil sebagai teks biasa di aplikasi & dokumen (tidak dieksekusi / tidak diproses ulang). |
| Karakter tak terlihat dari salinan PDF (`U+000B`, `U+0000`, setengah emoji) | Dibuang oleh `PKL.docx.cleanText` sebelum render — karakter ini membuat Word menolak file. |
| Tanggal tahun < 2000 / > 2099, atau PKL > 1 tahun | Pesan kesalahan di bawah Tanggal Selesai, lama pelaksanaan dikosongkan. |
| Presensi negatif, desimal, `1e3`, `99999`, teks | `PKL.calc.toDays`: bilangan bulat 0–31; baris tanpa nama bulan tidak dihitung — sama di layar dan dokumen. Maks. 6 bulan. |
| CSV biner/acak, kosong, 5.000 baris, berisi formula Excel | Ditolak / pesan jelas / dipotong 1.000 baris / disimpan sebagai teks biasa. |
| Gambar 0 byte, 8000×8000 px, 25 foto | Pesan error / dikompres 1,5 dtk / ±6 dtk. |
| Generate tanpa isian, klik 5× | Dokumen valid dengan tabel "-" / hanya 1 file. |

## 10. Panduan & Contoh Penulisan per Jurusan

* **Isi panduan** ada di `js/data/writing-prompts.js` — boleh disunting guru tanpa mengubah kode lain. Setiap isian berisi `lead` (apa yang ditulis), `points` (yang perlu ada), `avoid` (yang dihindari), dan `ex` (contoh untuk DKV, RPL, TITL, TSM, TKR; baris baru = paragraf/butir baru; untuk tabel kolom dipisah `|`).
* **27 panduan**: semua isian narasi Bab I–V, profil DUDI, refleksi 1–5, daftar pustaka, serta tabel kompetensi, peralatan, kendala, dan jurnal harian.
* `js/wizard/writing-guides.js` memasang panduan tepat di atas isian/tabelnya, menggantikan panduan statis lama, dan **mengganti contoh otomatis saat jurusan diubah** (panduan yang sedang terbuka tetap terbuka). Tanpa jurusan → contoh RPL + petunjuk memilih jurusan.
* Nama DUDI di contoh **fiktif** dan konsisten per jurusan (studio desain, software house, kontraktor listrik, bengkel motor, bengkel mobil). Setiap panduan diakhiri pengingat: *"Contoh hanya gambaran. Tulis dengan kata-katamu sendiri…"* agar laporan tidak seragam.
* Contoh Daftar Pustaka hanya memuat sumber yang pasti benar (PUIL 2011, Pro Git, dokumentasi resmi) atau pola isian `[Nama Pabrikan]`, karena siswa cenderung menyalin daftar pustaka apa adanya.
* Di HP, contoh tabel tampil sebagai kartu berlabel (tanpa geser ke samping).

## 11. Penanda Bab di Langkah Pengisian

* **Urutan langkah & kartu mengikuti urutan templat** agar siswa tidak bingung: 1 Hlm. Awal (Halaman Judul → Lembar Pengesahan → Lampiran 1) · 2 Bab I · 3 Bab II · 4 Bab III–IV · 5 Bab V & Daftar Pustaka · 6 Lamp. 2–6 · 7 Unduh.
* Setiap kartu diberi tag lokasinya di laporan (`Halaman Judul`, `Bab III`, `Lampiran 5`, …) dan judul kartu memakai judul subbab templat (mis. "A. Waktu dan Tempat Pelaksanaan").
* Penempatan yang mengikuti templat: Tahun Ajaran → Langkah 1 (Halaman Judul); Instruktur & Tabel 3.1 Jadwal Pelaksanaan → Langkah 4 (Bab III.A); Refleksi Diri → Langkah 6 (Lampiran 5).
* Label bab ada di `bab` pada `js/wizard/steps.js`; `required` tiap langkah harus berisi isian yang memang ada di section langkah itu (dipakai untuk lompat ke isian dari checklist). Rincian lengkap (`sub`) ada di tooltip, Ringkasan, dan checklist Langkah 7.
* Label satu baris sehingga sidebar tetap tanpa scroll (diuji 50 ukuran layar).

## 12. File Pengaturan Sekolah (`pengaturan.js`)

* Letak: **folder utama aplikasi**, di samping `index.html`. Isinya JSON yang diawali `window.PKL_PENGATURAN =` dan diakhiri `;` — sengaja bukan `.json` murni karena browser memblokir pembacaan file `.json` saat aplikasi dibuka dengan klik ganda (`file://`).
* Isi: `sekolah.nama`, `sekolah.kota`, `kepala_sekolah`, dan `prodi.{DKV|RPL|TITL|TSM|TKR}` berisi `nama`, `kajur`, `pendamping` (daftar nama).
* `hari_libur`: `{ "2026-08-17": "Proklamasi Kemerdekaan", … }` — tanggal merah & cuti bersama SKB 3 Menteri (sudah terisi 2026 & 2027). Perbarui tiap SKB baru terbit. Tanggal salah format dilewati dan dicatat sebagai masalah pengaturan.
* **Combobox Guru Pembimbing (Pendamping)** di Langkah 1 menampilkan pendamping sesuai prodi siswa dan berganti saat prodi diganti; siswa tetap bisa mengetik nama lain. Prodi tanpa daftar → semua pendamping ditampilkan.
* **Kajur** terisi otomatis sesuai prodi (aturan isi otomatis biasa: isian yang diketik siswa tidak ditimpa).
* Nama berawalan `Contoh` → peringatan "nama contoh" di Langkah 1 sampai semua diganti.
* Salah ketik / data tidak lengkap → aplikasi tetap jalan dengan bawaan dan menampilkan daftar masalah (halaman awal & Langkah 1, juga di console). Diuji di `pengaturan-test.js` (koma hilang, prodi hilang, Kajur kosong, pendamping bukan daftar, kode prodi tak dikenal).
* Setelah mengubah `pengaturan.js`, muat ulang aplikasi (F5). Draft siswa ikut memakai Kajur baru selama isian Kajur belum diubah manual.

* **Kompetensi keahlian** dipilih di halaman awal dan tampil lagi sebagai pilihan di Langkah 1 (`select#jurusan_kode`, tanpa atribut `name`, disinkronkan di `autofill.js` dengan radio halaman awal). Wajib diisi (`required` Langkah 1) karena dipakai di Halaman Judul, Pengesahan, Kata Pengantar & Bab I; mengganti pilihan ikut mengganti Kajur & contoh penulisan.

* **Penomoran bertingkat** mengikuti aturan laporan: BAB → A. → 1. → a. → 1) → a), tiap tingkat menjorok 340 twip (± 0,6 cm). Templat: subbab A. (Heading2), 1. (Heading3, kiri 340), daftar a. (kiri 1049, gantung 369); pertanyaan Lampiran 5 menjorok seperti butir 1. Lampiran 6 (`fix_numbering` di `tools/tidy_template.py`). Isian siswa: nomor yang diketik (1. / a. / 1) / a) / -) **dinomori ulang** sesuai posisinya (`paragraphsXml` di `docx-generator.js`) — di bawah subbab A. tingkat pertama 1., di bawah subjudul 1. (indentasi templat ≥ 340, mis. Tujuan Khusus, Misi, Saran, jawaban Refleksi) tingkat pertama a.; jenis penanda berbeda di dalam daftar = sub-daftar; nomor dimulai lagi setelah paragraf biasa; bullet tetap •.

## 13. Fitur Pembantu Siswa

| Fitur | Letak | Perilaku |
|---|---|---|
| **Buat Tanggal Otomatis** (Jurnal) | Langkah 6, `js/wizard/auto-rows.js` + `js/wizard/holiday-mark.js` | Satu baris untuk **setiap hari** dari Tanggal Mulai–Selesai (Langkah 4 · Bab III.A), termasuk Sabtu, Minggu & tanggal merah — DUDI bisa saja meminta siswa masuk. Warna baris: **merah** = tanggal merah/cuti bersama (`hari_libur` di `pengaturan.js`), **kuning** = di luar isian *Hari Kerja* (kosong = Senin–Jumat → Sabtu & Minggu kuning; "Senin s.d. Sabtu" → hanya Minggu). Merah didahulukan. Warna juga berlaku untuk baris impor CSV & ketik manual, ikut berubah saat Hari Kerja diganti, dan hanya tampil di form (.docx tidak berwarna). Saat laporan dibuat, baris kuning/merah yang kegiatannya kosong **otomatis dilewati** (`skipEmptyOffDays` di `LISTS`, docx-generator.js) dan jumlahnya disebut di pesan sukses; baris hari kerja biasa yang kosong tetap dicetak agar kekurangan jurnal terlihat. Baris yang sudah berisi tidak diubah/dihapus. |
| **Hitung dari Jurnal** (Presensi) | Langkah 6, `auto-rows.js` | Satu baris per bulan PKL (maks. 6). **Hadir = jumlah tanggal unik di jurnal yang kegiatannya terisi**, termasuk Sabtu/Minggu/tanggal merah yang diisi; baris jurnal di luar tanggal PKL tidak dihitung. Jurnal masih kosong → cadangan: jumlah hari kerja tanpa tanggal merah (status kuning, diminta klik lagi setelah jurnal diisi). Bulan yang sudah ada: hanya Hadir yang diperbarui (dengan konfirmasi); Izin/Sakit/Alpa tidak diubah. |
| **Penghitung kata** | Semua isian narasi, `js/wizard/word-count.js` | "57 kata · saran minimal 80 kata (kurang 23)". Target di `TARGETS` hanya saran, tidak memengaruhi status Lengkap. Alamat & Daftar Pustaka tidak diberi penghitung. |
| **Lompat ke isian kosong** | Checklist Langkah 7, `completeness.js` | Nama isian di "Belum diisi: …" bisa diklik → pindah ke langkahnya, kursor di isian, isian disorot sebentar. Tabel kosong → kursor ke baris kosong pertama. |

Uji: `fitur-test.js` (25 cek).

## 14. Tampilan Interaktif & Dialog Modern

- **Tanpa pop-up bawaan browser.** Semua `window.alert/confirm` diganti `PKL.dialog.confirm()` / `.alert()` / `.choose()` (`js/wizard/dialog.js`): ikon & warna sesuai nada (`info`, `success`, `warn`, `danger`, `error`), animasi buka-tutup, latar buram, Esc/klik luar = batal, tombol ×. Di HP (≤ 480 px) tampil sebagai panel dari bawah. Teks `**…**` ditebalkan dengan aman (tanpa innerHTML).
- **Dialog berisiko menawarkan jalan aman:** "Hapus Semua" dan "Mulai Baru" punya tombol *Simpan Backup Dulu*.
- **Notifikasi (toast)** `PKL.toast(pesan, {title, tone})` — `js/wizard/toast.js`: kanan atas di bawah header (di bawah menu Backup), hitung mundur berhenti saat disorot. Dipakai untuk backup diekspor, laporan berhasil dibuat, baris otomatis, backup dipulihkan.
- **Animasi & umpan balik** (`js/wizard/motion.js`, `css/interaksi.css`): transisi pindah langkah, baris tabel muncul/memudar/meluncur (FLIP), kartu & baris yang sedang diisi disorot, tombol mengecil saat ditekan, kartu jurusan terangkat, progres berkilau, konfeti + notifikasi saat isian wajib mencapai 100 % (sekali per sesi), tombol "kembali ke atas" untuk halaman panjang.
- Semua animasi mati otomatis bila sistem diset "kurangi gerakan" (`prefers-reduced-motion`).

Uji: `interaksi-test.js` (16 cek); uji lama memakai `auto-dialog.js` sebagai pengganti `page.on('dialog')`.

## 9. PDF, Daftar Isi Otomatis, & Pemotongan Halaman (v12 revisi 7)

**Pemotongan halaman di templat** (`fix_page_flow()` di `tools/tidy_template.py`):

| Masalah | Perbaikan |
| :--- | :--- |
| Halaman kosong sebelum BAB/Lampiran (paragraf kosong berisi *page break* terdorong sendirian ke halaman baru) | Paragraf itu dihapus; judulnya diberi **Page break before** |
| Tanda tangan pengesahan terpisah dari "Mengetahui, Kepala Sekolah" | "Disahkan di …", tabel tanda tangan, dan blok Kepala Sekolah *keep with next* |
| Tanda tangan Kata Pengantar sendirian di halaman baru | Paragraf sebelumnya *keep with next* |
| Tabel kecil terbelah (Tabel 3.1, identitas, Lampiran 1, presensi + persentase) | Seluruh baris *keep with next* |
| Gambar besar memakan ruang 1,5× (spasi 1,5) | Paragraf gambar spasi tunggal |

Baris tabel sudah *cantSplit* dan baris judul tabel berulang (*tblHeader*) sejak revisi sebelumnya. Tinggi tampil scan Lampiran 6 dibatasi 700 px saat generate (`SCAN_MAX_H`) agar judul Lampiran 6 + scan muat satu halaman.

**Penata halaman** (`PKL.pageLayout.layout(zip, host)`): mengubah `word/document.xml` hasil render menjadi HTML (paragraf, run, tab Daftar Isi bertitik, daftar menggantung, tabel, gambar, field PAGEREF, section & footer), mengukur tiap blok di wadah tersembunyi, lalu memotong ke halaman A4 dengan aturan Word: *keep with next*, *keep lines together*, *page break before*, baris tabel tidak terbelah + judul berulang, kontrol baris janda/yatim 2 baris, dan spasi-sebelum dihapus di awal halaman. Penomoran halaman mengikuti `pgNumType` tiap section (romawi i–v, angka mulai BAB I). Satuan: 1 twip = 1/15 px @96 dpi; tinggi 1 baris = 1,15 × ukuran font (Arial).

* **Font:** Arial; bila tidak ada (Android), dipakai **Arimo** (metrik identik) dari `vendor/fonts/arimo.css` (base64, aman di `file://`). Hasil sama di semua perangkat.
* **PDF:** overlay pratinjau → tombol *Simpan sebagai PDF* memanggil `window.print()`; CSS cetak (`css/print-view.css`) menyembunyikan aplikasi, `@page { size: A4; margin: 0 }`. Siswa memilih tujuan **Simpan sebagai PDF**. Judul dokumen diganti sementara dengan nama file agar nama PDF bawaan sesuai.
* **Batasan:** nomor Daftar Isi dihitung oleh penata halaman aplikasi, bukan oleh Word. Di Word bisa berbeda ±1 halaman pada kasus tertentu; Word menawarkan pembaruan field saat file dibuka. PDF selalu cocok dengan Daftar Isi-nya sendiri.
* **Format .doc (Word 97–2003):** tidak dibuat di browser. Format biner `.doc` tidak bisa ditulis oleh library JavaScript yang ada; `.doc` berbasis HTML justru merusak tata letak templat. Bila perlu `.doc`, buka `.docx` di Word → *Save As* → *Word 97-2003 Document*.


## 10. Karakter Animasi di Home

* **Sumber aset:** `assets/siswa/*.svg` di akar repo (dibuat tim DKV). Yang dipakai di Home: `siswa-melambai.svg` & `siswi-laptop.svg`.
* **Build:** `python tools/build-karakter.py` → `js/data/karakter-svg.js`. Jalankan ulang bila SVG diubah. SVG disematkan sebagai string JS (aman di `file://`), setiap ID diberi awalan (`kw-`, `kl-`) karena kedua karakter memakai ID yang sama, dan `transform` pose bawaan dipindah ke grup dalam agar tidak tertimpa animasi CSS.
* **Animasi** (`css/hero-stage.css`): muncul bergantian sekali, lalu bernapas, berkedip, melambai tiap 7 detik, badge dokumen melayang. Titik putar mengikuti panduan di tiap file SVG (`transform-box: view-box`).
* **Interaksi** (`js/wizard/hero-stage.js`): pupil mengikuti kursor/sentuhan (maks. 3 satuan SVG); melompat kecil saat memilih kompetensi keahlian.
* **Kurangi gerakan:** semua animasi mati bila sistem meminta *reduce motion*.

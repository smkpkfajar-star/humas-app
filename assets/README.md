# Katalog Aset Interaktif — Superapp Humas SMK Tamansiswa Jetis

Seluruh aset di folder ini berformat **SVG modular** (latar transparan, vektor tajam di semua resolusi) dan selaras dengan palet warna **Calm Academic Paper** (`#1E6B4B`, `#2A8A61`, `#E6F2EC`, `#F4B942`, `#64748B`, `#1F2933`).

Semua file disusun dengan `<g id="...">` dan atribut `data-part` yang konsisten agar langsung bisa dianimasikan dengan CSS `@keyframes`, JavaScript (misalnya *eye-tracking* kursor / *parallax*), atau GSAP.

---

## 1. Karakter Anak Sekolah (`assets/siswa/`)

| File | Deskripsi | Bagian Utama Siap Animasi |
|---|---|---|
| `siswa-rig.svg` | Siswa SMK (laki-laki) — **Base Modular Rig** | `#karakter`, `#kepala`, `#pupil-kiri`, `#pupil-kanan`, `#kelopak`, `#mulut-senyum`/`#mulut-senang`/`#mulut-bicara`, `#lengan-kiri`, `#lengan-kanan`, `#tas-belakang`, `#bayangan` |
| `siswi-rig.svg` | Siswi SMK (berhijab) — **Base Modular Rig** | Struktur ID & pivot identik dengan `siswa-rig.svg` |
| `siswa-melambai.svg` | Siswa menyapa & melambai sambil memeluk buku | `#lengan-kanan`, `#tangan-kanan`, `#garis-lambai`, `#kepala`, `#dekorasi` |
| `siswi-melambai.svg` | Siswi menyapa & melambai sambil membawa map | `#lengan-kanan`, `#tangan-kanan`, `#garis-lambai`, `#kepala`, `#dekorasi` |
| `siswa-menunjuk.svg` | Siswa menunjuk ke arah kartu / tombol CTA | `#lengan-kanan`, `#panah-arah`, `#kepala` |
| `siswi-laptop.svg` | Siswi membawa laptop + badge dokumen tercentang | `#badge-dokumen`, `#properti`, `#kepala`, `#pupil-kiri`/`#pupil-kanan` |
| `siswa-membaca.svg` | Siswa membaca buku panduan (berkacamata) | `#buku-terbuka`, `#halaman-gerak`, `#kertas-melayang`, `#pupil-kiri`/`#pupil-kanan` |
| `siswa-sukses.svg` | Siswa selebrasi berhasil dengan bintang & konfeti | `#karakter` (bounce), `#lengan-kiri`, `#lengan-kanan`, `#bintang-1`, `#bintang-2`, `#konfeti-1..4` |
| `siswi-sukses.svg` | Siswi selebrasi mengangkat sertifikat / laporan jadi | `#karakter`, `#lengan-kanan`, `#properti`, `#bintang-1`, `#konfeti-1..4` |
| `siswi-berpikir.svg` | Siswi menopang dagu dengan balon lampu ide | `#badge-ide`, `#sinar-ide`, `#kepala`, `#pupil-kiri`/`#pupil-kanan` |
| `props-interaktif.svg` | 6 properti lepas siap mengambang (*float*) | `#prop-buku`, `#prop-dokumen-ok`, `#prop-laptop`, `#prop-lampu-ide`, `#prop-balon-halo`, `#prop-lencana-bintang` |

### Titik Pivot Standar Karakter (`viewBox="0 0 320 360"`)
- `#bayangan`: `160px 336px`
- `#karakter`: `160px 330px`
- `#badan`: `160px 250px`
- `#kepala`: `160px 158px`
- `#lengan-kiri`: `124px 188px`
- `#lengan-kanan`: `196px 188px` (pose melambai: `194px 186px`)
- `#pupil-kiri` / `#pupil-kanan`: geser `translate(±3px, ±2.5px)` untuk *cursor eye-tracking*
- `#kelopak`: ubah `opacity: 0 → 1` singkat (±120ms) untuk animasi kedip

---

## 2. Ilustrasi Lingkungan, Status & Elemen UI (`assets/ilustrasi/`)

| File | Deskripsi | Bagian Utama Siap Animasi |
|---|---|---|
| `gedung-sekolah.svg` | Gedung SMK berlapis untuk *parallax* & *ambient* | `#matahari`, `#awan-1`, `#awan-2`, `#bendera`, `#pohon-kiri`, `#pohon-kanan`, `#jendela` |
| `ikon-jurusan-interaktif.svg` | 4 ilustrasi berlayer: **RPL, DKV, Humas, PKL** | `#rpl-kursor`, `#rpl-gear`, `#dkv-kuas`, `#dkv-sparkle`, `#humas-gelombang-1..2`, `#pkl-kertas`, `#pkl-centang` |
| `status-loading-dokumen.svg` | Ilustrasi proses & unduh laporan `.docx` | `#roda-gigi` (`174px 62px`), `#baris-1..4`, `#panah-unduh`, `#sparkle-1` |
| `status-kosong-cari.svg` | Ilustrasi *empty state* / pencarian kosong | `#kaca-pembesar` (`154px 116px`), `#tanda-tanya`, `#kertas-kosong` |
| `reaksi-ekspresi.svg` | 6 stiker reaksi mikro (*pop-in* di samping karakter) | `#reaksi-senang`, `#reaksi-semangat`, `#reaksi-ide`, `#reaksi-tanya`, `#reaksi-centang`, `#reaksi-seru` |
| `pola-latar-hero.svg` | Dekorasi latar transparan 3 lapis untuk banner hero | `#layer-belakang` (`0.3`), `#layer-tengah` (`0.6`), `#layer-depan` (`1.0`) |

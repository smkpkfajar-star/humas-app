# Design System — "Calm Academic Paper" (Pure CSS)

## 1. Filosofi Visual
Aplikasi ini digunakan siswa untuk mengetik narasi panjang (Bab I–V) dan mengisi puluhan entri jurnal harian. Desain mengusung konsep **Calm Academic Paper**: permukaan berwarna putih gading hangat (*warm off-white*) yang meredam silau cahaya biru layar, dipadukan dengan aksen hijau zamrud tenang yang selaras dengan identitas Tamansiswa.

---

## 2. Token Warna CSS (`css/tokens.css`)

```css
:root {
  /* Latar Belakang & Permukaan */
  --bg-canvas: #F8F9F7;        /* Putih gading lembut (anti-silau) */
  --bg-surface: #FFFFFF;       /* Kartu formulir utama */
  --bg-subtle: #F1F4F1;        /* Sidebar langkah & header tabel */
  --bg-input: #FCFCFB;         /* Latar kolom input */

  /* Warna Aksen Utama (Hijau Zamrud Tenang) */
  --brand-primary: #1E6B4B;    /* Tombol utama & langkah aktif */
  --brand-hover: #165239;      /* State hover tombol utama */
  --brand-tint: #E6F2EC;       /* Highlight lembut tips & badge */
  --brand-border: #B7D8C8;     /* Garis tepi aksen lembut */

  /* Tipografi */
  --text-primary: #1F2933;     /* Abu-abu arang (lebih lembut dari hitam pekat) */
  --text-secondary: #52606D;   /* Label bantuan & subjudul */
  --text-placeholder: #829AB1; /* Teks placeholder input */

  /* Garis & Bayangan */
  --border-soft: #DCE2DD;
  --border-focus: #1E6B4B;
  --shadow-card: 0 2px 8px rgba(31, 41, 51, 0.04);

  /* Status Semantik */
  --status-ok-bg: #E8F5E9;
  --status-ok-text: #2E7D32;
  --status-warn-bg: #FEF3C7;
  --status-warn-text: #B45309;
  --status-danger: #C62828;

  /* Radius & Spasi */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --content-max-width: 780px;
}
```

---

## 3. Tipografi & Keterbacaan

* **Font UI & Formulir:** `'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif`
* **Aturan Keterbacaan:**
  * Judul Langkah: `1.25rem` (`20px`), `font-weight: 600`, `line-height: 1.4`
  * Judul Kartu / Sub-bab: `1.05rem` (`17px`), `font-weight: 600`
  * Label Input: `0.875rem` (`14px`), `font-weight: 500`, `margin-bottom: 6px`
  * Input & Textarea: `0.95rem` (`15.2px`), `line-height: 1.65`, `padding: 11px 14px`
  * Teks Bantuan (*Helper Text*): `0.8125rem` (`13px`), warna `--text-secondary`

---

## 4. Struktur Tata Letak (Desktop & Mobile)

### Tampilan Desktop (`>= 900px`)
```text
+-----------------------------------------------------------------------+
|  [Logo] Generator Laporan PKL               [Tersimpan ✓] [Backup ▾]  |
+-------------------+---------------------------------------------------+
|                   |                                                   |
|  LANGKAH PENGISIAN|   AREA FORMULIR FOKUS (max-width: 780px)          |
|                   |                                                   |
|  [✓] 1. Identitas |   Langkah 4: Pelaksanaan & Analisis (Bab III-IV)  |
|  [✓] 2. Profil    |   ----------------------------------------------- |
|  [✓] 3. Pendahul. |   +---------------------------------------------+ |
|  [●] 4. Pelaksan. |   | Uraian Kegiatan Harian dan Mingguan         | |
|  [ ] 5. Penutup   |   | [▸ Lihat contoh penulisan untuk jurusan RPL]| |
|  [ ] 6. Lampiran  |   | [Textarea nyaman dengan tinggi otomatis...] | |
|  [ ] 7. Generate  |   +---------------------------------------------+ |
|                   |                                                   |
|  ---------------  |   +---------------------------------------------+ |
|  Progres: 57%     |   | Tabel 3.2 Kompetensi yang Dicapai           | |
|  [■■■■■□□□□]      |   | [Baris 1]                           [Hapus] | |
|                   |   | [+ Tambah Kompetensi]                       | |
|                   |   +---------------------------------------------+ |
|                   |                                                   |
|                   |   [ ← Sebelumnya ]          [ Simpan & Lanjut → ] |
+-------------------+---------------------------------------------------+
```

### Tampilan Mobile (`< 900px`)
* Sidebar kiri berubah menjadi **Horizontal Progress Bar + Dropdown Pemilih Langkah** di bagian atas layar agar tidak memakan ruang vertikal.
* Tombol navigasi **Sebelumnya** dan **Simpan & Lanjut** menempel rapi (*sticky bottom bar*) di bagian bawah layar agar mudah dijangkau ibu jari.

---

## 5. Komponen UX Penjaga Kenyamanan Mata

1. **Single-Column Form Flow:** Input disusun memanjang ke bawah dalam satu kolom utama. Grid 2 kolom hanya dipakai untuk pasangan data pendek yang berpasangan secara alami (contoh: `NIS` & `NISN`, `Tanggal Mulai` & `Tanggal Selesai`).
2. **Collapsible Writing Guides (`<details>`):** Contoh kalimat pengisian disembunyikan di dalam elemen `<details>` bertajuk *"Lihat contoh penulisan"* sehingga layar tetap bersih dan tidak sesak oleh teks instruksi.
3. **Focus Ring Lembut:** Saat kolom input aktif (`:focus`), border berubah menjadi `--brand-primary` dengan bayangan luar tipis `0 0 0 3px rgba(30, 107, 75, 0.12)` — jelas terlihat tanpa terasa tajam.
4. **Indikator Simpan Tanpa Pop-up:** Status penyimpanan ditampilkan tenang di pojok kanan atas (`Tersimpan otomatis pukul 17:45`) tanpa notifikasi *toast* yang berkedip-kedip.

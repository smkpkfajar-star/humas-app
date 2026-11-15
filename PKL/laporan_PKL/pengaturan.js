/* =====================================================================
   PENGATURAN SEKOLAH — Generator Laporan PKL
   ---------------------------------------------------------------------
   Cara mengubah:
   1. Buka file ini dengan Notepad / VS Code.
   2. Ubah HANYA teks di dalam tanda kutip "...". Isinya format JSON.
   3. JANGAN mengubah baris "window.PKL_PENGATURAN =" dan tanda ";" di akhir.
   4. Setiap nama diapit tanda kutip dua "...", dipisah koma.
      Nama terakhir dalam daftar TIDAK diberi koma.
   5. Simpan, lalu muat ulang aplikasi (F5).

   Kode prodi (DKV, RPL, TITL, TSM, TKR) jangan diubah.
   Nama yang diawali "Contoh" dianggap belum resmi: aplikasi akan
   menampilkan peringatan sampai semua nama diganti.
   ===================================================================== */
window.PKL_PENGATURAN = {
  "sekolah": {
    "nama": "SMK Tamansiswa Jetis",
    "kota": "Yogyakarta"
  },

  "kepala_sekolah": "Asnan Wiharno, M.Pd.",

  "prodi": {
    "DKV": {
      "nama": "Desain Komunikasi Visual",
      "kajur": "Contoh Kajur DKV, S.Sn.",
      "pendamping": [
        "Contoh Pendamping DKV 1, S.Sn.",
        "Contoh Pendamping DKV 2, S.Pd."
      ]
    },
    "RPL": {
      "nama": "Rekayasa Perangkat Lunak",
      "kajur": "Kajur RPL, S.Kom.",
      "pendamping": [
        "Contoh Pendamping RPL 1, S.Kom.",
        "Contoh Pendamping RPL 2, S.Kom.",
        "Contoh Pendamping RPL 3, S.T."
      ]
    },
    "TITL": {
      "nama": "Teknik Instalasi Tenaga Listrik",
      "kajur": "Contoh Kajur TITL, S.T.",
      "pendamping": [
        "Contoh Pendamping TITL 1, S.T.",
        "Contoh Pendamping TITL 2, S.Pd."
      ]
    },
    "TSM": {
      "nama": "Teknik dan Bisnis Sepeda Motor",
      "kajur": "Contoh Kajur TSM, S.Pd.",
      "pendamping": [
        "Contoh Pendamping TSM 1, S.Pd.",
        "Contoh Pendamping TSM 2, S.Pd.T."
      ]
    },
    "TKR": {
      "nama": "Teknik Kendaraan Ringan",
      "kajur": "Contoh Kajur TKR, S.Pd.T.",
      "pendamping": [
        "Contoh Pendamping TKR 1, S.Pd.T.",
        "Contoh Pendamping TKR 2, S.Pd."
      ]
    }
  }
};

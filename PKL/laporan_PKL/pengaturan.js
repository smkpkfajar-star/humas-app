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

   HARI LIBUR ("hari_libur"): tanggal merah nasional & cuti bersama
   menurut SKB 3 Menteri. Tanggal ini TIDAK dibuatkan baris jurnal dan
   TIDAK dihitung sebagai hari Hadir saat siswa memakai tombol otomatis.
   Format tiap baris:  "TAHUN-BULAN-TANGGAL": "Keterangan",
   contoh            :  "2027-08-17": "Proklamasi Kemerdekaan",
   Tambahkan daftar tahun berikutnya setiap SKB baru terbit.
   Libur khusus sekolah/DUDI juga boleh ditambahkan di sini.
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
  },

  "hari_libur": {
    "2026-01-01": "Tahun Baru 2026 Masehi",
    "2026-01-16": "Isra Mikraj Nabi Muhammad SAW",
    "2026-02-16": "Cuti Bersama Tahun Baru Imlek",
    "2026-02-17": "Tahun Baru Imlek 2577 Kongzili",
    "2026-03-18": "Cuti Bersama Hari Suci Nyepi",
    "2026-03-19": "Hari Suci Nyepi (Tahun Baru Saka 1948)",
    "2026-03-20": "Cuti Bersama Idulfitri 1447 H",
    "2026-03-21": "Idulfitri 1447 H",
    "2026-03-22": "Idulfitri 1447 H",
    "2026-03-23": "Cuti Bersama Idulfitri 1447 H",
    "2026-03-24": "Cuti Bersama Idulfitri 1447 H",
    "2026-04-03": "Wafat Yesus Kristus",
    "2026-04-05": "Kebangkitan Yesus Kristus (Paskah)",
    "2026-05-01": "Hari Buruh Internasional",
    "2026-05-14": "Kenaikan Yesus Kristus",
    "2026-05-15": "Cuti Bersama Kenaikan Yesus Kristus",
    "2026-05-27": "Iduladha 1447 H",
    "2026-05-28": "Cuti Bersama Iduladha 1447 H",
    "2026-05-31": "Hari Raya Waisak 2570 BE",
    "2026-06-01": "Hari Lahir Pancasila",
    "2026-06-16": "Tahun Baru Islam 1448 H",
    "2026-08-17": "Proklamasi Kemerdekaan",
    "2026-08-25": "Maulid Nabi Muhammad SAW",
    "2026-12-24": "Cuti Bersama Natal",
    "2026-12-25": "Kelahiran Yesus Kristus (Natal)",

    "2027-01-01": "Tahun Baru 2027 Masehi",
    "2027-01-05": "Isra Mikraj Nabi Muhammad SAW",
    "2027-02-05": "Cuti Bersama Tahun Baru Imlek",
    "2027-02-06": "Tahun Baru Imlek 2578 Kongzili",
    "2027-03-08": "Hari Suci Nyepi (Tahun Baru Saka 1949)",
    "2027-03-09": "Cuti Bersama Idulfitri 1448 H",
    "2027-03-10": "Idulfitri 1448 H",
    "2027-03-11": "Idulfitri 1448 H",
    "2027-03-12": "Cuti Bersama Idulfitri 1448 H",
    "2027-03-15": "Cuti Bersama Idulfitri 1448 H",
    "2027-03-25": "Cuti Bersama Wafat Yesus Kristus",
    "2027-03-26": "Wafat Yesus Kristus",
    "2027-03-28": "Kebangkitan Yesus Kristus (Paskah)",
    "2027-05-01": "Hari Buruh Internasional",
    "2027-05-06": "Kenaikan Yesus Kristus",
    "2027-05-17": "Iduladha 1448 H",
    "2027-05-18": "Cuti Bersama Iduladha 1448 H",
    "2027-05-19": "Cuti Bersama Waisak",
    "2027-05-20": "Hari Raya Waisak 2571 BE",
    "2027-06-01": "Hari Lahir Pancasila",
    "2027-06-06": "Tahun Baru Islam 1449 H",
    "2027-08-15": "Maulid Nabi Muhammad SAW",
    "2027-08-17": "Proklamasi Kemerdekaan",
    "2027-12-24": "Cuti Bersama Natal",
    "2027-12-25": "Kelahiran Yesus Kristus (Natal)",
    "2027-12-26": "Isra Mikraj Nabi Muhammad SAW"
  }
};

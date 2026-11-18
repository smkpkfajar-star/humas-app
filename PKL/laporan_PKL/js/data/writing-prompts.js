/**
 * Panduan & contoh penulisan per isian, disesuaikan per jurusan.
 *
 * Boleh disunting guru tanpa menyentuh kode lain. Struktur per isian:
 *   lead     : 1–2 kalimat — apa yang ditulis di bagian ini
 *   points   : poin yang sebaiknya ada
 *   avoid    : kesalahan yang sering terjadi
 *   ex       : contoh per jurusan { DKV, RPL, TITL, TSM, TKR }
 *              (baris baru = paragraf / butir baru)
 *
 * Nama DUDI di contoh FIKTIF dan konsisten per jurusan:
 *   DKV  CV Ruang Visual Kreatif   — studio desain grafis & percetakan digital
 *   RPL  CV Karya Kode Nusantara   — pengembang aplikasi web & mobile
 *   TITL CV Daya Listrik Mandiri   — kontraktor instalasi listrik bangunan
 *   TSM  Bengkel Jaya Motor        — bengkel resmi sepeda motor
 *   TKR  Bengkel Sinar Otomotif    — bengkel umum mobil penumpang
 */
(function (PKL) {
  'use strict';

  var L = function () { return Array.prototype.slice.call(arguments).join('\n'); };

  PKL.prompts = {
    note: 'Contoh hanya gambaran. Tulis dengan kata-katamu sendiri sesuai keadaan nyata di tempat PKL-mu.',

    fields: {
      // =================================================== BAB II — PROFIL DUDI
      dudi_sejarah: {
        lead: 'Ceritakan secara singkat asal-usul dan perkembangan tempat PKL-mu. Tanyakan ke pembimbing atau lihat profil perusahaan bila belum tahu.',
        points: ['Tahun dan tempat berdiri, serta siapa pendirinya', 'Usaha awal dan perkembangan penting (cabang, layanan baru, jumlah karyawan)', 'Kondisi saat ini: bidang utama, jumlah karyawan, atau pelanggan'],
        avoid: 'Menyalin seluruh isi website perusahaan tanpa diringkas.',
        ex: {
          DKV: L('CV Ruang Visual Kreatif didirikan pada tahun 2016 oleh dua lulusan desain komunikasi visual di Sleman. Pada awalnya studio ini hanya melayani desain logo dan kartu nama untuk usaha kecil di sekitar kampus.',
                 'Sejak tahun 2019 studio menambah layanan percetakan digital dan pengelolaan media sosial. Saat ini CV Ruang Visual Kreatif memiliki 12 karyawan dan melayani lebih dari 300 klien UMKM setiap tahun.'),
          RPL: L('CV Karya Kode Nusantara didirikan pada tahun 2017 oleh tiga alumni Teknik Informatika di Yogyakarta. Awalnya perusahaan hanya membuat situs web profil untuk usaha kecil.',
                 'Sejak tahun 2020 perusahaan mengembangkan sistem informasi berbasis web dan aplikasi mobile untuk sekolah, klinik, dan koperasi. Saat ini perusahaan memiliki 18 karyawan dan telah menangani lebih dari 120 proyek.'),
          TITL: L('CV Daya Listrik Mandiri berdiri pada tahun 2012 di Bantul sebagai usaha jasa perbaikan instalasi listrik rumah tangga yang dirintis oleh seorang teknisi listrik bersertifikat.',
                  'Seiring bertambahnya proyek, sejak 2018 perusahaan menangani instalasi listrik gedung, pemasangan panel distribusi, dan perawatan genset. Kini perusahaan memiliki 25 teknisi dan telah mengerjakan lebih dari 400 proyek instalasi.'),
          TSM: L('Bengkel Jaya Motor didirikan pada tahun 2009 di Jalan Magelang, Yogyakarta, sebagai bengkel umum sepeda motor dengan dua orang mekanik.',
                 'Pada tahun 2015 bengkel ini ditunjuk menjadi bengkel resmi salah satu merek sepeda motor sehingga menerapkan standar servis pabrikan. Saat ini Bengkel Jaya Motor memiliki 9 mekanik dan melayani rata-rata 40 sepeda motor per hari.'),
          TKR: L('Bengkel Sinar Otomotif berdiri pada tahun 2011 di Sleman sebagai bengkel servis ringan mobil penumpang dengan satu lift hidrolik.',
                 'Sejak 2017 bengkel menambah layanan spooring–balancing, servis AC mobil, dan diagnosis kerusakan menggunakan scanner. Kini Bengkel Sinar Otomotif memiliki 4 lift, 11 mekanik, dan melayani sekitar 25 mobil per hari.')
        }
      },

      dudi_visi: {
        lead: 'Tulis visi resmi tempat PKL persis seperti yang dipakai perusahaan/instansi (biasanya satu kalimat).',
        points: ['Salin dari dokumen resmi, papan di kantor, atau website perusahaan', 'Bila tidak ada visi tertulis, tanyakan ke pembimbing dan tulis sesuai arahannya'],
        avoid: 'Mengarang visi sendiri tanpa konfirmasi ke perusahaan.',
        ex: {
          DKV: 'Menjadi studio kreatif pilihan UMKM dalam membangun identitas visual yang kuat dan berkarakter.',
          RPL: 'Menjadi mitra teknologi terpercaya yang membantu UMKM dan lembaga pendidikan di Indonesia bertransformasi secara digital.',
          TITL: 'Menjadi penyedia jasa instalasi listrik yang aman, andal, dan sesuai standar PUIL di Daerah Istimewa Yogyakarta.',
          TSM: 'Menjadi bengkel sepeda motor terpercaya dengan pelayanan cepat, jujur, dan sesuai standar pabrikan.',
          TKR: 'Menjadi bengkel mobil pilihan keluarga dengan layanan perawatan yang profesional, transparan, dan bergaransi.'
        }
      },

      dudi_misi: {
        lead: 'Tulis misi resmi tempat PKL. Satu misi per baris dan beri nomor agar tampil rapi sebagai daftar di laporan.',
        points: ['Awali setiap baris dengan nomor: 1. 2. 3.', 'Satu baris = satu misi', 'Salin dari sumber resmi perusahaan'],
        avoid: 'Menulis semua misi dalam satu paragraf panjang tanpa nomor.',
        ex: {
          DKV: L('1. Menghasilkan karya desain yang komunikatif, estetis, dan tepat sasaran.', '2. Memberikan layanan cetak berkualitas dengan harga terjangkau bagi UMKM.', '3. Membina talenta muda desain melalui program magang dan PKL.'),
          RPL: L('1. Mengembangkan perangkat lunak yang andal, aman, dan mudah digunakan.', '2. Memberikan pendampingan dan pelatihan teknologi kepada klien.', '3. Membina talenta muda melalui program magang dan praktik kerja lapangan.'),
          TITL: L('1. Mengerjakan setiap instalasi sesuai PUIL dan standar keselamatan kerja.', '2. Menggunakan material listrik yang bersertifikat SNI.', '3. Memberikan layanan purnajual dan perawatan yang cepat tanggap.'),
          TSM: L('1. Memberikan servis sesuai prosedur dan standar pabrikan.', '2. Menyediakan suku cadang asli dengan harga yang wajar.', '3. Meningkatkan kompetensi mekanik melalui pelatihan berkala.'),
          TKR: L('1. Melakukan diagnosis kerusakan secara akurat menggunakan peralatan modern.', '2. Memberikan rincian biaya yang jelas sebelum pekerjaan dimulai.', '3. Menjaga kebersihan, keamanan, dan kenyamanan area bengkel.')
        }
      },

      dudi_struktur_ket: {
        lead: 'Satu kalimat keterangan bagan: tahun struktur organisasi dan di bagian mana kamu ditempatkan.',
        points: ['Sebutkan tahun berlaku struktur', 'Sebutkan divisi/bagian tempatmu PKL dan nama jabatan pembimbingmu'],
        avoid: 'Mengulang judul gambar tanpa informasi tambahan.',
        ex: {
          DKV: 'Struktur organisasi CV Ruang Visual Kreatif tahun 2026. Penulis ditempatkan di Divisi Desain Grafis di bawah bimbingan Art Director.',
          RPL: 'Struktur organisasi CV Karya Kode Nusantara tahun 2026. Penulis ditempatkan di Divisi Pengembangan Web di bawah bimbingan Senior Web Developer.',
          TITL: 'Struktur organisasi CV Daya Listrik Mandiri tahun 2026. Penulis ditempatkan di Tim Instalasi Gedung di bawah bimbingan Kepala Teknisi.',
          TSM: 'Struktur organisasi Bengkel Jaya Motor tahun 2026. Penulis ditempatkan di bagian Servis di bawah bimbingan Kepala Mekanik.',
          TKR: 'Struktur organisasi Bengkel Sinar Otomotif tahun 2026. Penulis ditempatkan di bagian Servis Berkala dan Rem di bawah bimbingan Kepala Bengkel.'
        }
      },

      dudi_kegiatan_utama: {
        lead: 'Jelaskan produk atau layanan utama tempat PKL dan siapa pelanggannya.',
        points: ['Layanan/produk utama (2–4 jenis)', 'Siapa pelanggan atau pengguna layanannya', 'Layanan tambahan bila ada'],
        avoid: 'Hanya menulis satu kata, misalnya "bengkel" atau "percetakan".',
        ex: {
          DKV: L('Kegiatan utama CV Ruang Visual Kreatif meliputi perancangan identitas visual (logo, kemasan, dan brand guideline), desain media promosi cetak, serta pembuatan konten media sosial bagi UMKM.',
                 'Selain itu studio melayani cetak digital seperti brosur, banner, stiker, dan kemasan produk dalam jumlah kecil.'),
          RPL: L('Kegiatan utama perusahaan meliputi analisis kebutuhan sistem, perancangan antarmuka, pengembangan aplikasi web dengan Laravel dan React, serta aplikasi mobile dengan Flutter.',
                 'Perusahaan juga menyediakan layanan hosting, pemeliharaan server, dan pelatihan penggunaan aplikasi bagi staf klien.'),
          TITL: L('Kegiatan utama CV Daya Listrik Mandiri adalah pemasangan instalasi listrik penerangan dan tenaga pada rumah, ruko, dan gedung, serta perakitan dan pemasangan panel hubung bagi (PHB).',
                  'Perusahaan juga melayani pemeliharaan genset, perbaikan motor listrik, dan pemeriksaan instalasi sebelum pengajuan Sertifikat Laik Operasi (SLO).'),
          TSM: L('Bengkel Jaya Motor melayani servis berkala, ganti oli, perbaikan mesin, servis CVT pada sepeda motor matik, serta perbaikan sistem injeksi dan kelistrikan.',
                 'Bengkel juga menjual suku cadang dan oli resmi serta melayani klaim garansi kendaraan baru.'),
          TKR: L('Bengkel Sinar Otomotif melayani perawatan berkala mobil bensin dan diesel, tune-up mesin, perbaikan sistem rem dan kaki-kaki, servis AC, serta spooring dan balancing.',
                 'Bengkel juga menyediakan diagnosis kerusakan elektronik kendaraan menggunakan scanner OBD-II.')
        }
      },

      dudi_fasilitas: {
        lead: 'Gambarkan tempat kerja: ruangan, peralatan pendukung, aturan kerja, dan suasana kerjanya.',
        points: ['Ruang kerja dan fasilitas umum (mushola, kantin, parkir)', 'Peralatan utama yang tersedia', 'Aturan K3, seragam, atau budaya kerja (misalnya briefing pagi)'],
        avoid: 'Hanya mendaftar nama barang tanpa menjelaskan suasana kerja.',
        ex: {
          DKV: 'Studio memiliki ruang desain ber-AC dengan 8 komputer berspesifikasi grafis, pen tablet, mini studio foto produk, dan ruang produksi berisi printer large format serta mesin potong stiker. Suasana kerja santai namun disiplin tenggat; setiap Senin diadakan rapat pembagian proyek.',
          RPL: 'Ruang kerja terbuka ber-AC dengan meja individual, internet fiber 200 Mbps, ruang rapat berproyektor, dan server pengembangan internal. Budaya kerja kolaboratif dengan stand-up meeting setiap pukul 08.30.',
          TITL: 'Perusahaan memiliki gudang material, ruang perakitan panel, dan kendaraan operasional ke lokasi proyek. Setiap pekerja wajib memakai APD (helm, sepatu safety, sarung tangan isolasi) dan mengikuti safety briefing sebelum bekerja.',
          TSM: 'Bengkel memiliki 8 stall servis dengan lift motor, ruang tunggu pelanggan, gudang suku cadang, serta peralatan khusus seperti tool kit pabrikan dan scanner sistem injeksi. Area kerja diatur dengan prinsip 5R (Ringkas, Rapi, Resik, Rawat, Rajin).',
          TKR: 'Bengkel dilengkapi 4 lift hidrolik, mesin spooring–balancing, alat isi freon AC, dan scanner OBD-II. Mekanik wajib memakai wearpack dan sepatu safety, dan setiap pagi diadakan briefing pembagian pekerjaan.'
        }
      },

      // =================================================== BAB I — PENDAHULUAN
      bab1_latar_belakang: {
        lead: 'Paragraf umum tentang PKL sudah tersedia di templat. Di sini tambahkan alasan pribadimu memilih tempat PKL ini (1–2 paragraf).',
        points: ['Mengapa tempat ini cocok dengan kompetensi keahlianmu', 'Pekerjaan/proyek menarik yang ada di sana', 'Harapanmu dari PKL di tempat ini'],
        avoid: 'Mengulang kalimat umum "PKL adalah kegiatan wajib siswa SMK" — sudah ada di templat.',
        ex: {
          DKV: L('Penulis memilih CV Ruang Visual Kreatif karena studio ini menangani proyek desain dari tahap konsep hingga cetak, sehingga sesuai dengan kompetensi Desain Komunikasi Visual yang penulis pelajari di sekolah.',
                 'Penulis berharap dapat mempelajari cara berkomunikasi dengan klien, memahami brief desain, dan menyiapkan file siap cetak sesuai standar industri.'),
          RPL: L('Penulis memilih CV Karya Kode Nusantara karena perusahaan ini bergerak di bidang pengembangan aplikasi web yang sesuai dengan kompetensi Rekayasa Perangkat Lunak.',
                 'Perusahaan sedang mengerjakan sistem informasi inventaris untuk beberapa sekolah, sehingga penulis berkesempatan terlibat langsung dalam siklus pengembangan perangkat lunak dari analisis hingga pengujian.'),
          TITL: L('Penulis memilih CV Daya Listrik Mandiri karena perusahaan ini mengerjakan instalasi listrik bangunan dan perakitan panel, yang merupakan inti kompetensi Teknik Instalasi Tenaga Listrik.',
                  'Dengan terlibat di proyek nyata, penulis berharap dapat memahami penerapan PUIL, membaca gambar instalasi, dan membiasakan diri bekerja dengan prosedur K3 listrik.'),
          TSM: L('Penulis memilih Bengkel Jaya Motor karena bengkel ini merupakan bengkel resmi yang menerapkan standar servis pabrikan, sesuai dengan kompetensi Teknik dan Bisnis Sepeda Motor.',
                 'Banyaknya sepeda motor matik dan sistem injeksi yang diservis setiap hari memberi penulis kesempatan berlatih menangani berbagai jenis kerusakan secara langsung.'),
          TKR: L('Penulis memilih Bengkel Sinar Otomotif karena bengkel ini melayani perawatan dan perbaikan mobil penumpang secara lengkap, sesuai dengan kompetensi Teknik Kendaraan Ringan.',
                 'Penulis berharap dapat mempelajari diagnosis kerusakan menggunakan scanner OBD-II dan prosedur servis rem serta tune-up sesuai standar bengkel.')
        }
      },

      bab1_tujuan_khusus: {
        lead: 'Tujuan umum PKL sudah ada di templat. Tulis 3–5 tujuan khusus yang ingin kamu capai di tempat PKL ini.',
        points: ['Satu baris per tujuan, awali dengan nomor 1. 2. 3.', 'Awali dengan kata kerja: Memahami, Menerapkan, Mampu, Melatih', 'Sesuaikan dengan pekerjaan nyata di tempat PKL'],
        avoid: 'Tujuan yang tidak bisa diukur, misalnya "Menjadi lebih baik".',
        ex: {
          DKV: L('1. Memahami alur kerja desain dari brief klien hingga file siap cetak.', '2. Menerapkan prinsip tata letak dan tipografi pada media promosi.', '3. Mampu menyiapkan file pra-cetak dengan mode warna dan resolusi yang tepat.', '4. Melatih komunikasi profesional saat presentasi desain kepada klien.'),
          RPL: L('1. Memahami alur kerja pengembangan aplikasi web menggunakan framework Laravel.', '2. Menerapkan penggunaan Git dan GitHub dalam kerja tim.', '3. Mampu merancang dan mengimplementasikan REST API sederhana.', '4. Melatih kedisiplinan dan komunikasi profesional di lingkungan kerja.'),
          TITL: L('1. Memahami cara membaca gambar instalasi listrik bangunan.', '2. Menerapkan pemasangan instalasi penerangan sesuai PUIL.', '3. Mampu merakit dan menguji panel hubung bagi sederhana.', '4. Membiasakan penerapan K3 listrik dan penggunaan APD.'),
          TSM: L('1. Memahami prosedur servis berkala sepeda motor sesuai standar pabrikan.', '2. Mampu melakukan servis CVT dan penyetelan celah katup.', '3. Menerapkan diagnosis sistem injeksi menggunakan scanner.', '4. Melatih pelayanan dan komunikasi dengan pelanggan bengkel.'),
          TKR: L('1. Memahami prosedur perawatan berkala mobil penumpang.', '2. Mampu melakukan servis rem cakram dan tromol sesuai standar.', '3. Menerapkan diagnosis kerusakan menggunakan scanner OBD-II.', '4. Membiasakan kerja aman dengan lift, jack stand, dan APD.')
        }
      },

      bab1_ruang_lingkup: {
        lead: 'Batasi apa saja yang dibahas di laporan: bagian/divisi tempatmu PKL dan jenis pekerjaan yang kamu lakukan.',
        points: ['Bagian atau divisi penempatan', 'Jenis pekerjaan yang dibahas', 'Hal yang TIDAK dibahas (bila perlu)'],
        avoid: 'Menulis ruang lingkup seluruh perusahaan padahal kamu hanya di satu bagian.',
        ex: {
          DKV: 'Kegiatan PKL dibatasi pada Divisi Desain Grafis, khususnya perancangan konten media sosial, desain media promosi cetak, dan penyiapan file pra-cetak. Proses produksi cetak dibahas sebatas yang penulis ikuti.',
          RPL: 'Kegiatan PKL dibatasi pada Divisi Pengembangan Web, khususnya pengembangan modul peminjaman barang, perbaikan bug, dan pengujian fungsional pada proyek Sistem Informasi Inventaris Sekolah.',
          TITL: 'Kegiatan PKL dibatasi pada pekerjaan instalasi penerangan, pemasangan stop kontak, perakitan panel hubung bagi, dan pengukuran tahanan isolasi pada proyek gedung yang ditangani perusahaan.',
          TSM: 'Kegiatan PKL dibatasi pada pekerjaan di bagian servis, yaitu servis berkala, servis CVT, penyetelan katup, dan pemeriksaan sistem injeksi sepeda motor matik dan bebek.',
          TKR: 'Kegiatan PKL dibatasi pada perawatan berkala, servis sistem rem, tune-up mesin bensin, dan pemeriksaan menggunakan scanner OBD-II pada mobil penumpang.'
        }
      },

      // =================================================== BAB III — PELAKSANAAN
      bab3_uraian_kegiatan: {
        lead: 'Ceritakan kegiatanmu secara berurutan dari awal sampai akhir PKL. Rincian per hari ada di Jurnal Harian (Lampiran 2), jadi di sini cukup gambaran per tahap.',
        points: ['Tahap awal: orientasi, pengenalan tempat dan aturan kerja', 'Tahap inti: pekerjaan utama yang paling sering dilakukan', 'Tahap akhir: pekerjaan penutup, evaluasi, atau proyek akhir', 'Sebut minggu ke berapa setiap tahap'],
        avoid: 'Menyalin seluruh isi jurnal harian ke bagian ini.',
        ex: {
          DKV: L('Pada minggu pertama penulis mengikuti orientasi, mempelajari standar warna dan aset merek klien, serta menyiapkan perangkat lunak desain.',
                 'Minggu kedua sampai ketiga belas penulis membuat konten media sosial mingguan untuk tiga klien UMKM, mendesain brosur dan banner, serta membantu foto produk di mini studio.',
                 'Pada minggu terakhir penulis menyiapkan file siap cetak, mengikuti proses produksi di ruang cetak, dan menyusun portofolio hasil karya selama PKL.'),
          RPL: L('Pada minggu pertama dan kedua penulis menjalani orientasi, mempelajari standar penulisan kode perusahaan, serta menyiapkan lingkungan kerja.',
                 'Minggu ketiga sampai keempat belas penulis mengembangkan modul peminjaman barang: membuat migrasi basis data, controller, validasi formulir, dan halaman antarmuka.',
                 'Pada minggu terakhir penulis melakukan pengujian fungsional, memperbaiki bug yang ditemukan tim QA, dan menyusun dokumentasi modul.'),
          TITL: L('Minggu pertama diisi dengan pengenalan K3 listrik, penggunaan APD, serta pengenalan alat ukur dan material instalasi.',
                  'Minggu kedua sampai keempat belas penulis ikut tim di proyek ruko dua lantai: menarik kabel, memasang fitting dan stop kontak, merakit panel, serta mengukur tahanan isolasi.',
                  'Pada minggu terakhir penulis membantu pengujian akhir instalasi dan penyusunan dokumen untuk pemeriksaan SLO.'),
          TSM: L('Minggu pertama penulis mengenal alur pelayanan bengkel, prosedur 5R, dan peralatan servis.',
                 'Minggu kedua sampai keempat belas penulis melakukan servis berkala, ganti oli, servis CVT, setel katup, dan membantu pemeriksaan sistem injeksi dengan scanner di bawah pengawasan mekanik.',
                 'Pada minggu terakhir penulis mengerjakan servis secara mandiri dengan pemeriksaan akhir oleh kepala mekanik.'),
          TKR: L('Minggu pertama penulis mengenal SOP bengkel, penggunaan lift dan jack stand yang aman, serta alur penerimaan kendaraan.',
                 'Minggu kedua sampai keempat belas penulis mengerjakan servis berkala, penggantian kampas rem, tune-up mesin bensin, dan membantu pemeriksaan kode kerusakan menggunakan scanner OBD-II.',
                 'Pada minggu terakhir penulis menangani servis berkala secara mandiri dan membantu pemeriksaan akhir sebelum kendaraan diserahkan ke pelanggan.')
        }
      },

      list_kompetensi: {
        lead: 'Satu baris per kompetensi atau materi yang kamu pelajari, lengkap dengan target dan seberapa jauh tercapai.',
        points: ['Kompetensi: nama keterampilan yang dipelajari', 'Target: hasil yang diharapkan, bisa diukur', 'Ketercapaian: "Tercapai (100%)", "Tercapai (80%)", atau "Belum tercapai"', 'Isi 5–8 baris'],
        avoid: 'Menulis semua ketercapaian 100% padahal ada yang belum dikuasai.',
        ex: {
          DKV: L('Desain konten media sosial | 3 konten per minggu sesuai brand guideline | Tercapai (100%)', 'Tata letak brosur dan banner | Layout rapi dan terbaca dari jarak 3 meter | Tercapai (90%)', 'Fotografi produk | Foto produk dengan pencahayaan studio | Tercapai (80%)', 'Persiapan file cetak (pra-cetak) | File CMYK 300 dpi dengan bleed 3 mm | Tercapai (100%)'),
          RPL: L('Pemrograman web dengan Laravel | Membuat CRUD lengkap dengan validasi | Tercapai (100%)', 'Manajemen versi Git & GitHub | Branching, pull request, code review | Tercapai (100%)', 'Pembuatan REST API | Endpoint JSON dengan autentikasi token | Tercapai (85%)', 'Pengujian black box | Menyusun dan menjalankan skenario uji | Tercapai (90%)'),
          TITL: L('Instalasi penerangan | Memasang 1 grup penerangan sesuai gambar | Tercapai (100%)', 'Perakitan panel hubung bagi | Merakit panel 1 fase 6 grup | Tercapai (85%)', 'Pengukuran tahanan isolasi | Mengukur dengan megger sesuai prosedur | Tercapai (90%)', 'Penerapan K3 listrik | Selalu memakai APD dan prosedur LOTO | Tercapai (100%)'),
          TSM: L('Servis berkala sepeda motor | Servis lengkap sesuai checklist pabrikan | Tercapai (100%)', 'Servis CVT | Bongkar, bersihkan, dan rakit CVT matik | Tercapai (90%)', 'Penyetelan celah katup | Celah sesuai spesifikasi dengan feeler gauge | Tercapai (85%)', 'Diagnosis sistem injeksi | Membaca kode kerusakan dengan scanner | Tercapai (75%)'),
          TKR: L('Perawatan berkala mobil | Servis 10.000 km sesuai checklist | Tercapai (100%)', 'Servis rem cakram | Ganti kampas dan bersihkan kaliper | Tercapai (90%)', 'Tune-up mesin bensin | Busi, filter udara, throttle body bersih | Tercapai (85%)', 'Diagnosis dengan scanner OBD-II | Membaca dan menghapus kode kerusakan | Tercapai (80%)')
        },
        table: true
      },

      list_peralatan: {
        lead: 'Daftar alat, perangkat lunak, atau bahan yang benar-benar kamu gunakan, beserta fungsinya.',
        points: ['Satu baris per alat/bahan', 'Tulis nama yang tepat (merek/jenis bila perlu)', 'Fungsi ditulis singkat sesuai pemakaianmu'],
        avoid: 'Mendaftar alat yang ada di tempat PKL tetapi tidak pernah kamu pakai.',
        ex: {
          DKV: L('Adobe Illustrator | Membuat logo dan ilustrasi vektor', 'Adobe Photoshop | Mengolah foto produk dan konten media sosial', 'Pen tablet | Menggambar sketsa dan ilustrasi digital', 'Printer large format | Mencetak banner dan poster'),
          RPL: L('Visual Studio Code | Editor kode sumber', 'Laragon (PHP, MySQL) | Server pengembangan lokal', 'Git & GitHub | Manajemen versi dan kolaborasi tim', 'Postman | Menguji endpoint REST API'),
          TITL: L('Multimeter digital | Mengukur tegangan, arus, dan kontinuitas', 'Insulation tester (megger) | Mengukur tahanan isolasi kabel', 'Tang kombinasi dan tang potong | Memotong dan menyambung kabel', 'Kabel NYM 3×2,5 mm² | Penghantar instalasi stop kontak'),
          TSM: L('Kunci shock set | Membuka dan mengencangkan baut', 'Feeler gauge | Mengukur celah katup', 'Treker (pully holder) CVT | Menahan puli saat membuka mur CVT', 'Scanner sistem injeksi | Membaca kode kerusakan mesin injeksi'),
          TKR: L('Lift hidrolik | Mengangkat mobil saat servis bagian bawah', 'Kunci momen (torque wrench) | Mengencangkan baut sesuai spesifikasi', 'Scanner OBD-II | Membaca kode kerusakan dan data sensor', 'Jack stand | Penyangga pengaman kendaraan')
        },
        table: true
      },

      // =================================================== BAB IV — ANALISIS
      bab4_analisis: {
        lead: 'Bandingkan cara kerja di tempat PKL dengan teori atau praktik di sekolah: apa yang sudah sesuai, apa yang berbeda, dan mengapa.',
        points: ['Prosedur atau standar kerja yang diterapkan di tempat PKL', 'Perbedaan dengan yang dipelajari di sekolah', 'Pendapatmu: kelebihan atau kekurangan cara kerja tersebut'],
        avoid: 'Hanya mengulang uraian kegiatan tanpa analisis.',
        ex: {
          DKV: L('Di sekolah, desain biasanya dinilai dari sisi estetika. Di CV Ruang Visual Kreatif, setiap desain harus sesuai brief klien dan brand guideline, serta direvisi rata-rata dua kali sebelum disetujui.',
                 'Penerapan template dan aset merek membuat produksi konten lebih cepat dan konsisten, namun penulis perlu waktu menyesuaikan diri dengan tenggat yang ketat.'),
          RPL: L('Penggunaan framework Laravel membuat pengembangan modul lebih cepat karena tersedia migrasi, validasi, dan ORM Eloquent. Alur Git Flow juga mengurangi konflik kode antaranggota tim.',
                 'Namun, penulis membutuhkan sekitar dua minggu untuk memahami struktur proyek yang besar dan standar penamaan perusahaan.'),
          TITL: L('Pekerjaan instalasi di lapangan selalu diawali pembacaan gambar instalasi dan diakhiri pengukuran tahanan isolasi, sesuai PUIL. Di sekolah tahap pengukuran sering terlewat karena keterbatasan alat.',
                  'Penerapan prosedur penguncian sumber listrik (lock out tag out) membuat pekerjaan lebih aman meskipun memerlukan waktu tambahan.'),
          TSM: L('Bengkel menerapkan checklist servis pabrikan sehingga setiap langkah servis berkala tercatat dan mudah diperiksa ulang. Di sekolah urutan servis sering tidak dicatat.',
                 'Penggunaan scanner mempercepat diagnosis sistem injeksi, tetapi mekanik tetap memeriksa komponen secara fisik untuk memastikan penyebab kerusakan.'),
          TKR: L('Setiap kendaraan yang masuk dicatat keluhannya, diperiksa dengan scanner OBD-II, lalu dibuatkan estimasi biaya sebelum dikerjakan. Alur ini tidak dipraktikkan di sekolah.',
                 'Penggunaan kunci momen sesuai spesifikasi pabrikan pada roda dan kaliper meningkatkan keamanan kendaraan dan mengurangi keluhan pelanggan.')
        }
      },

      list_kendala: {
        lead: 'Kendala nyata yang kamu alami dan cara kamu mengatasinya. Satu kendala per baris.',
        points: ['Kendala teknis (alat, materi baru) maupun nonteknis (adaptasi, waktu)', 'Solusi berupa tindakan yang benar-benar kamu lakukan', 'Isi 2–4 baris'],
        avoid: 'Solusi yang tidak jelas, misalnya "berusaha lebih keras".',
        ex: {
          DKV: L('Belum terbiasa dengan revisi berulang dari klien | Mencatat semua masukan klien dan mengonfirmasi ulang sebelum mulai merevisi', 'Warna hasil cetak berbeda dengan di layar | Menggunakan mode warna CMYK dan mencetak contoh (proof) terlebih dahulu'),
          RPL: L('Belum terbiasa dengan struktur proyek yang besar | Membaca dokumentasi internal dan bertanya kepada instruktur', 'Terjadi merge conflict saat menggabungkan branch | Rutin melakukan git pull dan berkoordinasi sebelum push'),
          TITL: L('Kesulitan membaca gambar instalasi yang kompleks | Meminta penjelasan kepala teknisi dan mencocokkan gambar langsung di lokasi', 'Bekerja di ketinggian saat menarik kabel plafon | Menggunakan tangga yang stabil dan selalu didampingi rekan kerja'),
          TSM: L('Baut CVT sangat keras saat dibuka | Menggunakan treker CVT dan kunci yang tepat sesuai arahan mekanik', 'Antrean servis padat sehingga waktu kerja terbatas | Menyiapkan alat sebelum kendaraan masuk agar pekerjaan lebih cepat'),
          TKR: L('Belum memahami arti kode kerusakan pada scanner | Mencari kode di manual servis dan berdiskusi dengan mekanik senior', 'Baut kaliper berkarat dan sulit dibuka | Menyemprot cairan pelumas penetran dan menunggu beberapa menit sebelum membuka')
        },
        table: true
      },

      bab4_pembelajaran: {
        lead: 'Keterampilan dan sikap kerja baru yang kamu dapat selama PKL.',
        points: ['Keterampilan teknis (hard skill)', 'Sikap kerja: disiplin, tanggung jawab, komunikasi (soft skill)', 'Contoh kejadian nyata yang membuatmu belajar'],
        avoid: 'Kalimat umum tanpa contoh, misalnya "Saya belajar banyak hal".',
        ex: {
          DKV: 'Penulis belajar menerjemahkan keinginan klien menjadi desain, mengatur waktu agar konten terbit tepat jadwal, dan menyiapkan file cetak yang benar. Penulis juga belajar menerima kritik desain dengan terbuka.',
          RPL: 'Penulis belajar menulis kode yang rapi dan terdokumentasi, bekerja dengan tenggat waktu, serta melaporkan kendala kepada tim secara jelas dalam stand-up meeting.',
          TITL: 'Penulis belajar pentingnya ketelitian dan K3 dalam pekerjaan listrik: satu kesalahan sambungan dapat membahayakan penghuni bangunan. Penulis juga belajar bekerja sama dalam tim di lokasi proyek.',
          TSM: 'Penulis belajar bekerja cepat namun tetap teliti mengikuti checklist servis, menjaga kebersihan area kerja, dan menjelaskan hasil servis kepada pelanggan dengan bahasa yang mudah dipahami.',
          TKR: 'Penulis belajar melakukan diagnosis secara sistematis sebelum mengganti komponen, menggunakan alat sesuai spesifikasi, dan bertanggung jawab atas keselamatan kendaraan pelanggan.'
        }
      },

      bab4_kesesuaian: {
        lead: 'Seberapa sesuai materi di sekolah dengan pekerjaan di tempat PKL? Sebutkan yang sudah sesuai dan yang perlu ditambah.',
        points: ['Mata pelajaran yang paling terpakai', 'Materi yang belum diajarkan tetapi dibutuhkan di industri'],
        avoid: 'Hanya menulis "Sangat sesuai" tanpa penjelasan.',
        ex: {
          DKV: 'Materi Desain Grafis, Tipografi, dan Fotografi sangat terpakai. Materi yang perlu ditambah adalah persiapan file cetak (pra-cetak) dan strategi konten media sosial.',
          RPL: 'Materi Pemrograman Web, Basis Data, dan PBO sangat relevan. Materi yang perlu ditambah adalah penggunaan Git dalam tim dan pengujian perangkat lunak.',
          TITL: 'Materi Instalasi Penerangan, Gambar Teknik Listrik, dan K3 sangat terpakai. Materi yang perlu ditambah adalah perakitan panel tiga fase dan penyusunan dokumen SLO.',
          TSM: 'Materi Pemeliharaan Mesin dan Sasis Sepeda Motor sangat relevan. Materi yang perlu ditambah adalah diagnosis sistem injeksi menggunakan scanner dan servis CVT model terbaru.',
          TKR: 'Materi Pemeliharaan Sasis dan Mesin Kendaraan Ringan sangat sesuai. Materi yang perlu ditambah adalah penggunaan scanner OBD-II dan servis AC mobil.'
        }
      },

      // =================================================== BAB V — PENUTUP
      bab5_kesimpulan: {
        lead: 'Ringkas hasil PKL dalam 1–2 paragraf, menjawab tujuan yang kamu tulis di Bab I.',
        points: ['Apakah PKL berjalan lancar dan berapa lama', 'Kompetensi utama yang berhasil dikuasai', 'Kontribusi atau hasil kerja nyata'],
        avoid: 'Menambahkan informasi baru yang tidak dibahas di bab sebelumnya.',
        ex: {
          DKV: L('Pelaksanaan PKL di CV Ruang Visual Kreatif berjalan lancar selama empat bulan.', 'Penulis berhasil membuat lebih dari 40 konten media sosial dan 12 desain media cetak untuk klien, serta memahami alur kerja desain dari brief hingga cetak.'),
          RPL: L('Pelaksanaan PKL di CV Karya Kode Nusantara berjalan lancar selama empat bulan.', 'Penulis berhasil berkontribusi dalam pengembangan modul peminjaman barang dan memahami proses pengembangan perangkat lunak secara profesional.'),
          TITL: L('Pelaksanaan PKL di CV Daya Listrik Mandiri berjalan lancar selama empat bulan.', 'Penulis terlibat dalam pemasangan instalasi listrik ruko dua lantai hingga tahap pengujian, dan semakin memahami penerapan PUIL serta K3 listrik.'),
          TSM: L('Pelaksanaan PKL di Bengkel Jaya Motor berjalan lancar selama empat bulan.', 'Penulis mampu melakukan servis berkala dan servis CVT secara mandiri serta memahami dasar diagnosis sistem injeksi.'),
          TKR: L('Pelaksanaan PKL di Bengkel Sinar Otomotif berjalan lancar selama empat bulan.', 'Penulis mampu melakukan perawatan berkala dan servis rem secara mandiri serta memahami penggunaan scanner OBD-II untuk diagnosis.')
        }
      },

      saran_sekolah: {
        lead: 'Saran membangun untuk sekolah agar siswa lebih siap PKL.',
        points: ['Berdasarkan kekurangan yang kamu rasakan saat PKL', 'Spesifik dan bisa dilakukan sekolah'],
        avoid: 'Saran yang menyalahkan atau tidak realistis.',
        ex: {
          DKV: 'Menambahkan praktik persiapan file cetak dan simulasi kerja dengan brief klien sebelum siswa berangkat PKL.',
          RPL: 'Menambahkan materi Git, kerja tim berbasis proyek, dan pengujian perangkat lunak sebelum siswa diterjunkan PKL.',
          TITL: 'Melengkapi praktik pengukuran tahanan isolasi dan perakitan panel tiga fase di bengkel sekolah.',
          TSM: 'Menambah praktik diagnosis sistem injeksi dan servis CVT model terbaru di bengkel sekolah.',
          TKR: 'Menyediakan scanner OBD-II untuk praktik diagnosis dan menambah materi servis AC kendaraan.'
        }
      },

      saran_dudi: {
        lead: 'Saran sopan untuk tempat PKL, terutama terkait pembimbingan siswa PKL.',
        points: ['Gunakan bahasa santun', 'Fokus pada program PKL, bukan bisnis perusahaan'],
        avoid: 'Kritik tajam terhadap perusahaan atau karyawan tertentu.',
        ex: {
          DKV: 'Menyediakan panduan singkat brand guideline klien bagi siswa PKL pada minggu pertama agar adaptasi lebih cepat.',
          RPL: 'Menyediakan panduan orientasi tertulis bagi siswa PKL pada minggu pertama agar proses adaptasi lebih cepat.',
          TITL: 'Memberikan pengenalan gambar instalasi proyek sebelum siswa diterjunkan ke lokasi agar siswa lebih siap.',
          TSM: 'Memberikan jadwal pendampingan bergilir agar setiap siswa PKL mendapat kesempatan menangani jenis servis yang beragam.',
          TKR: 'Memberikan kesempatan bertahap kepada siswa PKL untuk menangani diagnosis kendaraan dengan pendampingan mekanik.'
        }
      },

      saran_siswa: {
        lead: 'Pesan praktis untuk adik kelas yang akan PKL di bidang yang sama.',
        points: ['Persiapan sebelum PKL', 'Sikap selama PKL'],
        avoid: 'Saran yang terlalu umum, misalnya "Semangat!".',
        ex: {
          DKV: 'Siapkan portofolio sederhana dan kuasai dasar Illustrator serta Photoshop sebelum PKL. Selama PKL, catat setiap masukan klien dan jangan takut bertanya.',
          RPL: 'Persiapkan dasar pemrograman dan Git sebelum PKL, jangan malu bertanya, dan catat setiap ilmu baru di jurnal harian.',
          TITL: 'Kuasai cara membaca gambar instalasi dan selalu utamakan K3. Jangan pernah bekerja pada rangkaian bertegangan tanpa izin pembimbing.',
          TSM: 'Hafalkan urutan servis berkala dan nama-nama alat sebelum PKL. Jaga kebersihan stall dan kembalikan alat ke tempatnya.',
          TKR: 'Pelajari dasar sistem rem dan pemakaian kunci momen sebelum PKL. Selalu gunakan jack stand dan jangan terburu-buru saat bekerja.'
        }
      },

      // =================================================== LAMPIRAN 5 — REFLEKSI
      refleksi_1: {
        lead: 'Ceritakan satu pengalaman paling berkesan, lengkap dengan kejadian dan perasaanmu.',
        points: ['Apa yang terjadi', 'Mengapa berkesan'],
        avoid: 'Jawaban satu kata.',
        ex: {
          DKV: 'Saat desain kemasan yang penulis buat disetujui klien tanpa revisi dan dicetak untuk dijual di toko oleh-oleh.',
          RPL: 'Saat modul peminjaman yang penulis buat dipresentasikan kepada klien dan langsung digunakan oleh salah satu sekolah.',
          TITL: 'Saat lampu di seluruh ruko menyala normal pada pengujian akhir instalasi yang ikut penulis kerjakan.',
          TSM: 'Saat penulis berhasil menemukan penyebab mesin brebet dari kode kerusakan scanner dan pelanggan puas dengan hasilnya.',
          TKR: 'Saat penulis dipercaya mengganti kampas rem mobil pelanggan secara mandiri dan lolos pemeriksaan kepala bengkel.'
        }
      },
      refleksi_2: {
        lead: 'Sebutkan 2–3 keterampilan yang paling berkembang, teknis maupun sikap kerja.',
        points: ['Keterampilan teknis', 'Sikap kerja'],
        avoid: 'Menyebut keterampilan yang tidak pernah kamu praktikkan.',
        ex: {
          DKV: 'Kemampuan tata letak, fotografi produk, dan presentasi desain kepada klien.',
          RPL: 'Kemampuan menggunakan Laravel dan Git, serta berkomunikasi dalam tim.',
          TITL: 'Kemampuan membaca gambar instalasi, merakit panel, dan disiplin menerapkan K3.',
          TSM: 'Kemampuan servis CVT, setel katup, dan melayani pelanggan dengan ramah.',
          TKR: 'Kemampuan servis rem, menggunakan scanner OBD-II, dan bekerja teliti sesuai SOP.'
        }
      },
      refleksi_3: {
        lead: 'Tantangan terbesar dan langkah nyata yang kamu ambil untuk mengatasinya.',
        points: ['Tantangan', 'Tindakan yang kamu lakukan', 'Hasilnya'],
        avoid: 'Hanya menyebut tantangan tanpa cara mengatasi.',
        ex: {
          DKV: 'Tenggat konten yang mepet setiap minggu. Penulis mengatasinya dengan membuat jadwal kerja harian dan template desain yang bisa dipakai ulang.',
          RPL: 'Memahami kode program yang sudah besar. Penulis membacanya sedikit demi sedikit dan meminta penjelasan instruktur saat bingung.',
          TITL: 'Rasa takut bekerja dengan listrik bertegangan. Penulis mengatasinya dengan mematuhi prosedur LOTO dan selalu mengecek tegangan sebelum bekerja.',
          TSM: 'Bekerja cepat saat antrean servis panjang. Penulis menyiapkan alat lebih dulu dan mengikuti checklist agar tidak ada langkah terlewat.',
          TKR: 'Membaca kode kerusakan yang belum pernah dipelajari. Penulis mencari di manual servis dan berdiskusi dengan mekanik senior.'
        }
      },
      refleksi_4: {
        lead: 'Bagaimana PKL mengubah pandanganmu tentang dunia kerja dan rencana setelah lulus.',
        points: ['Pandangan tentang dunia kerja', 'Rencana karier atau studi lanjut'],
        avoid: 'Jawaban yang tidak berhubungan dengan pengalaman PKL.',
        ex: {
          DKV: 'PKL membuat penulis yakin ingin menjadi desainer grafis dan berencana membangun portofolio untuk bekerja di agensi kreatif.',
          RPL: 'PKL membuat penulis semakin yakin berkarier sebagai web developer dan melanjutkan studi di bidang informatika.',
          TITL: 'PKL membuat penulis ingin mengambil sertifikasi kompetensi instalatir listrik agar dapat bekerja di kontraktor listrik.',
          TSM: 'PKL membuat penulis ingin bekerja sebagai mekanik di bengkel resmi dan suatu saat membuka bengkel sendiri.',
          TKR: 'PKL membuat penulis ingin bekerja di bengkel resmi mobil dan mengikuti pelatihan teknisi kendaraan bersertifikat.'
        }
      },
      refleksi_5: {
        lead: 'Pesan untuk dirimu sendiri dan siswa PKL berikutnya.',
        points: ['Singkat dan dari pengalaman sendiri'],
        avoid: 'Menyalin kalimat motivasi umum dari internet.',
        ex: {
          DKV: 'Selalu simpan file kerja dengan rapi dan beri nama yang jelas. Kreativitas penting, tetapi tepat waktu lebih penting.',
          RPL: 'Disiplin waktu, berani bertanya, dan selalu menyelesaikan tugas tepat waktu.',
          TITL: 'Keselamatan nomor satu. Lebih baik bekerja lambat tetapi aman daripada cepat tetapi berbahaya.',
          TSM: 'Kerjakan servis seperti merawat kendaraan sendiri: teliti, bersih, dan jujur kepada pelanggan.',
          TKR: 'Jangan malu bertanya dan jangan pernah mengabaikan prosedur keselamatan saat bekerja di bawah kendaraan.'
        }
      },

      // =================================================== DAFTAR PUSTAKA
      daftar_pustaka: {
        lead: 'Sumber yang benar-benar kamu baca saat menulis laporan. Satu sumber per baris, diurutkan menurut abjad (format APA sederhana).',
        points: ['Buku: Penulis. (Tahun). Judul Buku. Kota: Penerbit.', 'Website: Nama Situs. (Tahun). Judul halaman. Diakses dari alamat-web', 'Manual servis, SOP, atau dokumen perusahaan juga boleh dicantumkan', 'Bagian dalam [kurung siku] di contoh = isi sesuai sumbermu'],
        avoid: 'Mencantumkan sumber yang tidak dibaca, atau hanya menulis alamat website tanpa judul dan tahun. Periksa kembali judul dan tahun di sampul buku.',
        ex: {
          DKV: L('Adobe. (2025). Illustrator User Guide. Diakses dari https://helpx.adobe.com/illustrator/user-guide.html', 'CV Ruang Visual Kreatif. (2026). Panduan Brand Guideline Klien. Sleman: CV Ruang Visual Kreatif.', 'Kemendikbudristek. (2024). Panduan Praktik Kerja Lapangan SMK.'),
          RPL: L('Chacon, S., & Straub, B. (2014). Pro Git (2nd ed.). New York: Apress.', 'Kemendikbudristek. (2024). Panduan Praktik Kerja Lapangan SMK.', 'Laravel. (2025). Laravel Documentation. Diakses dari https://laravel.com/docs'),
          TITL: L('Badan Standardisasi Nasional. (2011). Persyaratan Umum Instalasi Listrik 2011 (PUIL 2011), SNI 0225:2011. Jakarta: BSN.', 'CV Daya Listrik Mandiri. (2026). SOP Keselamatan Kerja Listrik. Bantul: CV Daya Listrik Mandiri.', 'Kemendikbudristek. (2024). Panduan Praktik Kerja Lapangan SMK.'),
          TSM: L('Bengkel Jaya Motor. (2026). Checklist Servis Berkala Sepeda Motor. Yogyakarta: Bengkel Jaya Motor.', 'Kemendikbudristek. (2024). Panduan Praktik Kerja Lapangan SMK.', '[Nama Pabrikan]. ([Tahun]). Buku Pedoman Reparasi [Tipe Sepeda Motor]. [Kota]: [Nama Pabrikan].'),
          TKR: L('Bengkel Sinar Otomotif. (2026). SOP Servis Berkala Kendaraan Ringan. Sleman: Bengkel Sinar Otomotif.', 'Kemendikbudristek. (2024). Panduan Praktik Kerja Lapangan SMK.', '[Nama Pabrikan]. ([Tahun]). Manual Servis [Tipe Mobil]. [Kota]: [Nama Pabrikan].')
        }
      },

      // =================================================== LAMPIRAN 2 — JURNAL
      list_jurnal: {
        lead: 'Satu baris per hari. Tulis singkat dan spesifik apa yang kamu kerjakan hari itu, sekalian hasilnya.',
        points: ['Pekerjaan utama hari itu (bukan sekadar "membantu")', 'Sebut hasil nyatanya di akhir kalimat (file, unit selesai, jumlah pekerjaan)'],
        avoid: 'Menulis kegiatan yang sama persis setiap hari.',
        ex: {
          DKV: L('Senin, 06 Juli 2026 | Membuat 3 desain konten Instagram promo produk kopi (3 file JPG siap unggah)', 'Selasa, 07 Juli 2026 | Foto produk kemasan keripik di mini studio (24 foto terpilih)'),
          RPL: L('Senin, 06 Juli 2026 | Membuat migrasi tabel peminjaman dan relasinya (migrasi berjalan tanpa error)', 'Selasa, 07 Juli 2026 | Membuat halaman formulir peminjaman (halaman form dan validasi)'),
          TITL: L('Senin, 06 Juli 2026 | Menarik kabel NYM untuk 2 grup penerangan lantai 1 (2 grup kabel terpasang)', 'Selasa, 07 Juli 2026 | Mengukur tahanan isolasi instalasi lantai 1 (hasil ukur tercatat di form)'),
          TSM: L('Senin, 06 Juli 2026 | Servis berkala 4 sepeda motor matik (4 unit selesai)', 'Selasa, 07 Juli 2026 | Membongkar dan membersihkan CVT (2 unit CVT selesai diservis)'),
          TKR: L('Senin, 06 Juli 2026 | Servis berkala 10.000 km mobil MPV (2 unit selesai)', 'Selasa, 07 Juli 2026 | Mengganti kampas rem depan (1 unit selesai dan uji jalan)')
        },
        table: true
      }
    }
  };
})(window.PKL);

"""
Perapian tata letak templat (dipanggil oleh convert-template.py SEBELUM konversi sintaks).

Templat sumber v11 tidak diubah; semua perbaikan diterapkan saat membuat v12,
sehingga bila v11 diedit ulang di Word, perapian ini otomatis diterapkan lagi.
Setiap langkah memverifikasi pola yang dicari dan GAGAL KERAS bila tidak cocok
(lebih baik berhenti daripada diam-diam menghasilkan templat rusak).

Perbaikan:
  1. Tabel identitas (sampul & pengesahan) & tanda tangan: lebar kolom
     proporsional (label | ":" sempit | isi lebar) dan layout tetap.
  2. Sampul: "KOMPETENSI KEAHLIAN …" (nama kompetensi di baris sendiri), nama
     sekolah, dan "DI <DUDI>" huruf kapital; teks alternatif logo diperbarui.
  3. Paragraf isian panjang ditandai RAW (lihat RAW_FIELDS) agar setiap baris
     yang diketik siswa menjadi paragraf Word sendiri dengan format templat
     (indentasi baris pertama, daftar bernomor menggantung, pustaka APA).

Sengaja TIDAK diubah: nomor halaman romawi di footer halaman awal (teks
"ii", "iii", "iv", "v") dan titik-titik ketikan di Daftar Isi. Teks biasa
tampil sama di semua aplikasi; field PAGE/PAGEREF & tab leader tidak.
"""

import re

# Isian panjang yang dirender sebagai paragraf (tag {@nama} di Docxtemplater).
RAW_FIELDS = [
    "bab1_latar_belakang", "bab1_tujuan_khusus", "bab1_ruang_lingkup",
    "dudi_sejarah", "dudi_visi", "dudi_misi", "dudi_struktur_ket",
    "dudi_kegiatan_utama", "dudi_fasilitas", "bab3_uraian_kegiatan",
    "bab4_analisis", "bab4_pembelajaran", "bab4_kesesuaian", "bab5_kesimpulan",
    "saran_sekolah", "saran_dudi", "saran_siswa", "daftar_pustaka",
    "refleksi_1", "refleksi_2", "refleksi_3", "refleksi_4", "refleksi_5",
]

ELEMENT_RE = re.compile(r"<w:p\b.*?</w:p>|<w:p/>|<w:tbl>.*?</w:tbl>|<w:sectPr\b.*?</w:sectPr>", re.S)
WT_TEXT_RE = re.compile(r"<w:t(?: [^>]*)?>([^<]*)</w:t>")


def text_of(el: str) -> str:
    return "".join(WT_TEXT_RE.findall(el))


class TidyError(ValueError):
    pass


def expect(cond, msg):
    if not cond:
        raise TidyError("Perapian templat gagal: " + msg)


def split_body(xml: str):
    start = xml.index("<w:body>") + len("<w:body>")
    end = xml.index("</w:body>")
    body = xml[start:end]
    els = ELEMENT_RE.findall(body)
    expect("".join(els) == body, "struktur body tidak dikenali (ada elemen selain p/tbl/sectPr)")
    return xml[:start], els, xml[end:]


def find_index(els, pred, what, start=0):
    for i in range(start, len(els)):
        if pred(els[i]):
            return i
    raise TidyError("Perapian templat gagal: tidak menemukan " + what)


# ------------------------------------------------------------- pPr helpers

PPR_ORDER = ["pStyle", "keepNext", "keepLines", "pageBreakBefore", "framePr", "widowControl", "numPr",
             "suppressLineNumbers", "pBdr", "shd", "tabs", "suppressAutoHyphens", "kinsoku", "wordWrap",
             "overflowPunct", "topLinePunct", "autoSpaceDE", "autoSpaceDN", "bidi", "adjustRightInd",
             "snapToGrid", "spacing", "ind", "contextualSpacing", "mirrorIndents", "suppressOverlap", "jc",
             "textDirection", "textAlignment", "textboxTightWrap", "outlineLvl", "divId", "cnfStyle",
             "rPr", "sectPr", "pPrChange"]


def add_ppr_child(p: str, child_xml: str, name: str) -> str:
    """Sisipkan elemen ke <w:pPr> pada posisi sesuai urutan skema OOXML."""
    if f"<w:{name}/>" in p or f"<w:{name} " in p.split("</w:pPr>")[0]:
        return p
    if "<w:pPr>" not in p:
        return p.replace(">", "><w:pPr>" + child_xml + "</w:pPr>", 1) if p.startswith("<w:p>") else \
            re.sub(r"^(<w:p\b[^>]*>)", r"\1<w:pPr>" + child_xml + "</w:pPr>", p)
    ppr_start = p.index("<w:pPr>") + len("<w:pPr>")
    ppr_end = p.index("</w:pPr>")
    inner = p[ppr_start:ppr_end]
    after = PPR_ORDER[PPR_ORDER.index(name) + 1:]
    pos = len(inner)
    for m in re.finditer(r"<w:(\w+)", inner):
        if m.group(1) in after:
            # hanya anak langsung (bukan di dalam rPr dsb.)
            depth_prefix = inner[:m.start()]
            if depth_prefix.count("<w:rPr>") == depth_prefix.count("</w:rPr>"):
                pos = m.start()
                break
    return p[:ppr_start] + inner[:pos] + child_xml + inner[pos:] + p[ppr_end:]


# --------------------------------------------------------------- Langkah 3

def set_table_widths(tbl: str, widths) -> str:
    total = sum(widths)
    tbl = re.sub(r"<w:tblW [^>]*/>", f'<w:tblW w:w="{total}" w:type="dxa"/>', tbl, count=1)
    if "<w:tblLayout" not in tbl:
        tbl = tbl.replace(f'<w:tblW w:w="{total}" w:type="dxa"/>', f'<w:tblW w:w="{total}" w:type="dxa"/><w:tblLayout w:type="fixed"/>', 1)
    grid = "<w:tblGrid>" + "".join(f'<w:gridCol w:w="{w}"/>' for w in widths) + "</w:tblGrid>"
    tbl = re.sub(r"<w:tblGrid>.*?</w:tblGrid>", grid, tbl, count=1, flags=re.S)

    def fix_row(m):
        row = m.group(0)
        expect(len(re.findall(r"<w:tc>", row)) == len(widths), f"jumlah sel != {len(widths)}")
        col = iter(widths)

        def fix_cell(c):
            cell = c.group(0)
            tcw = f'<w:tcW w:w="{next(col)}" w:type="dxa"/>'
            if "<w:tcPr>" in cell:
                cell = re.sub(r"<w:tcW [^>]*/>", "", cell)
                return cell.replace("<w:tcPr>", "<w:tcPr>" + tcw, 1)
            return cell.replace("<w:tc>", "<w:tc><w:tcPr>" + tcw + "</w:tcPr>", 1)

        return re.sub(r"<w:tc>.*?</w:tc>", fix_cell, row, flags=re.S)

    return re.sub(r"<w:tr\b.*?</w:tr>", fix_row, tbl, flags=re.S)


def fix_identity_tables(els, text_width):
    tables = [i for i, e in enumerate(els) if e.startswith("<w:tbl>") and text_of(e).startswith("Nama:")]
    expect(len(tables) >= 2, "tabel identitas sampul & pengesahan")
    cover, approval = tables[0], tables[1]
    els[cover] = set_table_widths(els[cover], [2500, 300, 4300])
    els[approval] = set_table_widths(els[approval], [2700, 300, text_width - 3000])
    # Jarak antara tabel identitas pengesahan dan kalimat "Disahkan di …".
    nxt = approval + 1
    expect(text_of(els[nxt]).startswith("Disahkan di"), 'kalimat "Disahkan di" setelah tabel pengesahan')
    if "<w:spacing " in els[nxt].split("</w:pPr>")[0]:
        els[nxt] = re.sub(r"<w:spacing ", '<w:spacing w:before="160" ', re.sub(r'(<w:spacing [^>]*?)\s*w:before="\d+"', r"\1", els[nxt], count=1), count=1)
    else:
        els[nxt] = add_ppr_child(els[nxt], '<w:spacing w:before="160"/>', "spacing")
    sig = find_index(els, lambda e: e.startswith("<w:tbl>") and text_of(e).startswith("Siswa,"), "tabel tanda tangan")
    half = text_width // 2
    els[sig] = set_table_widths(els[sig], [half, text_width - half])
    return els


# --------------------------------------------------------------- Langkah 4

RPR_AFTER_CAPS = ["smallCaps", "strike", "dstrike", "outline", "shadow", "emboss", "imprint", "noProof",
                  "snapToGrid", "vanish", "webHidden", "color", "spacing", "w", "kern", "position", "sz",
                  "szCs", "highlight", "u", "effect", "bdr", "shd", "fitText", "vertAlign", "rtl", "cs",
                  "em", "lang", "eastAsianLayout", "specVanish", "oMath"]


def add_caps(p: str) -> str:
    """Tambahkan <w:caps/> ke setiap run, pada posisi sesuai urutan skema rPr."""
    def per_run(m):
        run = m.group(0)
        if "<w:caps/>" in run or "<w:t" not in run:
            return run
        if "<w:rPr>" not in run:
            return run.replace("<w:r>", "<w:r><w:rPr><w:caps/></w:rPr>", 1)
        start = run.index("<w:rPr>") + len("<w:rPr>")
        end = run.index("</w:rPr>")
        inner = run[start:end]
        pos = len(inner)
        for t in re.finditer(r"<w:(\w+)", inner):
            if t.group(1) in RPR_AFTER_CAPS:
                pos = t.start()
                break
        return run[:start] + inner[:pos] + "<w:caps/>" + inner[pos:] + run[end:]
    return re.sub(r"<w:r>.*?</w:r>", per_run, p, flags=re.S)


def fix_competency_table(els, text_width):
    """Tabel 3.2: kolom Target terlalu sempit (3,2 cm) → isinya terlipat 3–4 baris.
    Lebar dibagi ulang: No | Kompetensi | Target | Ketercapaian, total tetap selebar teks."""
    i = find_index(els, lambda e: e.startswith("<w:tbl>") and "list_kompetensi" in text_of(e), "tabel 3.2 kompetensi")
    no, capai = 600, 1760   # "Tercapai (100%)" muat satu baris
    rest = text_width - no - capai
    els[i] = set_table_widths(els[i], [no, rest // 2, rest - rest // 2, capai])
    return els


NIP_LINE = re.compile(
    r"<w:br/>"                                                   # pindah baris sebelum NIP
    r"((?:</w:r><w:r>(?:<w:rPr>(?:(?!</w:rPr>).)*</w:rPr>)?)?)"   # (bisa jadi run baru)
    r"<w:t(?: [^>]*)?>NIP[^<]*\{\{\w+_nip\}\}</w:t>", re.S)
EMPTY_RUN = re.compile(r"<w:r>(?:<w:rPr>(?:(?!</w:rPr>).)*</w:rPr>)?</w:r>", re.S)


def remove_nip(els):
    """Hapus semua NIP: baris "NIP. {{x_nip}}" di tanda tangan & baris guru di Lampiran 1."""
    n = 0
    for i, e in enumerate(els):
        if "_nip}}" not in e:
            continue
        new, k = NIP_LINE.subn(r"\1", e)
        n += k
        new = new.replace("<w:t>Guru Pembimbing dan NIP</w:t>", "<w:t>Guru Pembimbing</w:t>")
        new, k2 = re.subn(r"\{\{guru_nama\}\} \(NIP\. \{\{guru_nip\}\}\)", "{{guru_nama}}", new)
        n += k2
        els[i] = EMPTY_RUN.sub("", new)
    leftover = [text_of(e) for e in els if re.search(r"NIP|_nip\}\}", text_of(e))]
    expect(not leftover, "masih ada NIP: " + " | ".join(t[:60] for t in leftover))
    expect(n == 5, f"jumlah NIP yang dihapus {n}, seharusnya 5")
    return els, n


def remove_judul(els):
    """Isian Judul Laporan ditiadakan: hapus baris judul di sampul & frasa judul di Kata Pengantar."""
    i = find_index(els, lambda e: e.startswith("<w:p") and text_of(e).strip() == "{{judul_laporan}}", "baris judul di sampul")
    del els[i]
    j = find_index(els, lambda e: e.startswith("<w:p") and "{{judul_laporan}}" in text_of(e), "frasa judul di Kata Pengantar")
    new = re.sub(r" dengan judul [“\"]\{\{judul_laporan\}\}[”\"]", "", els[j])
    expect(new != els[j], "frasa ' dengan judul “{{judul_laporan}}”' di Kata Pengantar")
    els[j] = new
    expect(not any("judul_laporan" in e for e in els), "judul_laporan masih tersisa")
    return els


# ------------------------------------------------- Lembar Pengesahan (tanda tangan)

SIGN_GAP = 4   # baris kosong (<w:br/>) antara jabatan dan nama = ruang tanda tangan & stempel
SIGNERS = [("Siswa,", "siswa_nama", "NIS. {{siswa_nis}}"),
           ("Instruktur Dunia Kerja,", "instruktur_nama", None),
           ("Guru Pembimbing,", "guru_nama", None),
           ("Ketua Program Keahlian,", "kaprog_nama", None)]


def bold_rpr(rpr: str) -> str:
    """rPr tebal (sisipkan <w:b/> setelah rFonts sesuai urutan skema)."""
    if not rpr:
        return "<w:rPr><w:b/></w:rPr>"
    # Buang pengaturan tebal yang sudah ada (mis. <w:b w:val="0"/>): elemen <w:b> ganda
    # melanggar skema OOXML dan yang terakhir menang (nama jadi tidak tebal).
    rpr = re.sub(r"<w:b(?: [^>]*)?/>", "", rpr)
    m = re.search(r"<w:rFonts [^>]*/>", rpr)
    pos = m.end() if m else len("<w:rPr>")
    return rpr[:pos] + "<w:b/>" + rpr[pos:]


def set_spacing(ppr: str, before: int, after: int) -> str:
    sp = f'<w:spacing w:before="{before}" w:after="{after}" w:line="276" w:lineRule="auto"/>'
    if "<w:spacing " in ppr:
        return re.sub(r"<w:spacing [^>]*/>", sp, ppr, count=1)
    return add_ppr_child("<w:p>" + ppr + "</w:p>", sp, "spacing")[5:-6]


def signer_paragraph(ppr: str, rpr: str, lines_before, name_tag: str, extra) -> str:
    head = "".join(f"<w:t>{t}</w:t><w:br/>" for t in lines_before[:-1]) + f"<w:t>{lines_before[-1]}</w:t>"
    xml = f"<w:p>{ppr}<w:r>{rpr}{head}" + "<w:br/>" * (SIGN_GAP + 1) + "</w:r>"
    xml += f"<w:r>{bold_rpr(rpr)}<w:t>{{{{{name_tag}}}}}</w:t></w:r>"
    if extra:
        xml += f"<w:r>{rpr}<w:br/><w:t>{extra}</w:t></w:r>"
    return xml + "</w:p>"


def fix_signatures(els):
    """Blok tanda tangan seragam: jabatan → 4 baris ruang tanda tangan → nama tebal; rata atas."""
    t = find_index(els, lambda e: e.startswith("<w:tbl>") and "Instruktur Dunia Kerja," in text_of(e), "tabel tanda tangan")
    tbl = els[t]
    cells = re.findall(r"<w:tc>.*?</w:tc>", tbl, re.S)
    expect(len(cells) == 4, f"tabel tanda tangan berisi {len(cells)} sel, seharusnya 4")
    for idx, (cell, (title, name, extra)) in enumerate(zip(cells, SIGNERS)):
        expect(title in text_of(cell) and "{{" + name + "}}" in text_of(cell), f"sel tanda tangan '{title}'")
        tcpr = re.search(r"<w:tcPr>.*?</w:tcPr>", cell, re.S)
        tcpr = tcpr.group(0) if tcpr else "<w:tcPr></w:tcPr>"
        tcpr = re.sub(r"<w:vAlign [^>]*/>", "", tcpr).replace("</w:tcPr>", '<w:vAlign w:val="top"/></w:tcPr>')
        ppr = re.search(r"<w:pPr>.*?</w:pPr>", cell, re.S).group(0)
        ppr = set_spacing(ppr, 0 if idx < 2 else 360, 0)    # jarak seragam antarbaris tanda tangan
        rpr_m = re.search(r"<w:r>(<w:rPr>.*?</w:rPr>)", cell, re.S)
        rpr = rpr_m.group(1) if rpr_m else ""
        new_cell = "<w:tc>" + tcpr + signer_paragraph(ppr, rpr, [title], name, extra) + "</w:tc>"
        tbl = tbl.replace(cell, new_cell, 1)
    els[t] = tbl

    k = find_index(els, lambda e: e.startswith("<w:p") and text_of(e).startswith("Mengetahui,"), "blok Kepala Sekolah")
    p = els[k]
    ppr = set_spacing(re.search(r"<w:pPr>.*?</w:pPr>", p, re.S).group(0), 360, 0)
    rpr_m = re.search(r"<w:r>(<w:rPr>.*?</w:rPr>)", p, re.S)
    rpr = re.sub(r"<w:b/>|<w:bCs/>", "", rpr_m.group(1)) if rpr_m else ""
    els[k] = signer_paragraph(ppr, rpr, ["Mengetahui,", "Kepala {{sekolah_nama}},"], "kepsek_nama", None)

    d = find_index(els, lambda e: e.startswith("<w:p") and text_of(e).startswith("Disahkan di"), 'kalimat "Disahkan di"')
    pd = els[d]
    ppr_d = re.search(r"<w:pPr>.*?</w:pPr>", pd, re.S).group(0)
    els[d] = pd.replace(ppr_d, set_spacing(ppr_d, 160, 280), 1)
    return els


SCHOOL_NAME = "SMK Tamansiswa Jetis"


def fix_logo_alt(els):
    """Teks alternatif logo (dibaca pembaca layar / 'Edit Alt Text' di Word) memakai nama sekolah terbaru."""
    n = 0
    for i, e in enumerate(els):
        new = re.sub(r'(<wp:docPr [^>]*name="Logo Sekolah"[^>]*descr=")[^"]*(")', r"\g<1>Logo " + SCHOOL_NAME + r"\g<2>", e)
        if new != e:
            els[i] = new
            n += 1
    expect(n >= 1, "gambar logo sekolah (docPr name=\"Logo Sekolah\")")
    return els


def fix_cover_caps(els):
    i = find_index(els, lambda e: e.startswith("<w:p") and "KOMPETENSI KEAHLIAN {{kompetensi_keahlian}}" in text_of(e), "baris kompetensi di sampul")
    # Nama kompetensi di baris sendiri: dalam huruf kapital 14 pt satu baris terlalu panjang.
    expect("<w:t>KOMPETENSI KEAHLIAN {{kompetensi_keahlian}}</w:t>" in els[i], "teks kompetensi di sampul dalam satu run")
    els[i] = els[i].replace("<w:t>KOMPETENSI KEAHLIAN {{kompetensi_keahlian}}</w:t>",
                            "<w:t>KOMPETENSI KEAHLIAN</w:t><w:br/><w:t>{{kompetensi_keahlian}}</w:t>", 1)
    els[i] = add_caps(els[i])
    j = find_index(els, lambda e: e.startswith("<w:p") and "DI {{dudi_nama}}" in text_of(e), "baris DI <DUDI> di sampul")
    els[j] = add_caps(els[j])
    return els


# --------------------------------------------------------------- Langkah 5

def mark_raw_paragraphs(els):
    marked = []
    for i, e in enumerate(els):
        if not e.startswith("<w:p"):
            continue
        t = text_of(e).strip()
        m = re.fullmatch(r"\{\{(\w+)\}\}", t)
        if m and m.group(1) in RAW_FIELDS:
            els[i] = e.replace("{{" + m.group(1) + "}}", "{{@" + m.group(1) + "}}", 1)
            marked.append(m.group(1))
    missing = set(RAW_FIELDS) - set(marked)
    expect(not missing, "paragraf isian tidak berdiri sendiri: " + ", ".join(sorted(missing)))
    return els, marked


# --------------------------------------------------------------- Utama

def tidy_document(xml: str) -> tuple[str, list[str]]:
    head, els, tail = split_body(xml)
    body_sect = next(e for e in reversed(els) if e.startswith("<w:sectPr"))
    pg_w = int(re.search(r'<w:pgSz w:w="(\d+)"', body_sect).group(1))
    mar = re.search(r"<w:pgMar ([^>]*)/>", body_sect).group(1)
    left = int(re.search(r'w:left="(\d+)"', mar).group(1))
    right = int(re.search(r'w:right="(\d+)"', mar).group(1))
    text_width = pg_w - left - right

    log = []
    # Penomoran romawi halaman awal (footer teks "ii", "iii", …) dan titik-titik
    # Daftar Isi SENGAJA dibiarkan seperti v11: teks biasa tampil sama di semua
    # aplikasi (Word, WPS, Google Docs, penampil HP), sedangkan field PAGE/PAGEREF
    # & tab leader tidak selalu didukung. Lihat docs/development.md bagian 8.
    log.append("halaman awal & daftar isi: dipertahankan seperti templat asli (romawi & titik-titik)")
    els = fix_identity_tables(els, text_width)
    log.append(f"tabel identitas & tanda tangan: lebar kolom tetap (lebar teks {text_width} twip)")
    els = fix_competency_table(els, text_width)
    log.append("tabel 3.2: kolom Target dilebarkan (3,2 cm -> 4,9 cm), Ketercapaian 3,1 cm")
    els = fix_cover_caps(els)
    log.append("sampul: kompetensi, sekolah, DUDI huruf kapital")
    els, n_nip = remove_nip(els)
    log.append(f"NIP dihapus: {n_nip} tempat (tanda tangan Instruktur, Guru, Kaprog, Kepsek + Lampiran 1)")
    els = fix_signatures(els)
    log.append(f"lembar pengesahan: tanda tangan seragam (jabatan, {SIGN_GAP} baris ruang tanda tangan, nama tebal), rata atas")
    els = remove_judul(els)
    log.append("judul laporan ditiadakan: baris judul di sampul & frasa judul di Kata Pengantar dihapus")
    els = fix_logo_alt(els)
    log.append(f'teks alternatif logo -> "Logo {SCHOOL_NAME}"')
    els, marked = mark_raw_paragraphs(els)
    log.append(f"{len(marked)} paragraf isian panjang -> paragraf Word terpisah")
    return head + "".join(els) + tail, log

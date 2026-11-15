"""
Konversi Template_Laporan_PKL_Otomatis_v11.docx (sintaks Jinja/docxtpl)
menjadi Template_Laporan_PKL_Otomatis_v12.docx (sintaks Docxtemplater).

Aturan konversi:
  1. Loop tabel docxtpl (3 baris):
         | {%tr for x in list %} |
         | {{x.a}} | {{x.b}}     |
         | {%tr endfor %}        |
     menjadi 1 baris Docxtemplater (baris diulang otomatis):
         | {#list}{a} | {b}{/list} |
  2. Placeholder gambar  {{nama}} / {{x.foto}}  ->  {%nama} / {%foto}
  3. Placeholder teks    {{nama}}               ->  {nama}
  4. Isian paragraf      (ditandai tidy_template) -> {@nama}  (dirender per paragraf)

Sebelum konversi sintaks, tata letak dirapikan oleh tools/tidy_template.py
(lebar tabel identitas, kapital sampul, paragraf isian). Penomoran romawi &
titik-titik Daftar Isi dipertahankan seperti v11.

Hanya memakai library standar Python. Jalankan:
    python tools/convert-template.py
"""

import re
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import tidy_template  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/templates/Template_Laporan_PKL_Otomatis_v11.docx"
DST = ROOT / "assets/templates/Template_Laporan_PKL_Otomatis_v12.docx"

IMAGE_TAGS = {"dudi_struktur_img", "foto", "lampiran_sk_penempatan", "lampiran_surat_selesai"}

ROW_RE = re.compile(r"<w:tr[ >].*?</w:tr>", re.S)
WT_RE = re.compile(r"(<w:t(?: [^>]*)?>)([^<]*)(</w:t>)")
FOR_RE = re.compile(r"\{%tr for (\w+) in (\w+) %\}")
ENDFOR_RE = re.compile(r"\{%tr endfor %\}")


def row_text(row: str) -> str:
    return "".join(m.group(2) for m in WT_RE.finditer(row))


def convert_tag(name: str) -> str:
    return "{%" + name + "}" if name in IMAGE_TAGS else "{" + name + "}"


def convert_loop_row(row: str, var: str, list_name: str) -> str:
    """Ubah {{var.field}} -> {field}, lalu bungkus baris dengan {#list}...{/list}."""
    item_re = re.compile(r"\{\{" + re.escape(var) + r"\.(\w+)\}\}")
    row = item_re.sub(lambda m: convert_tag(m.group(1)), row)

    tagged = [m for m in WT_RE.finditer(row) if "{" in m.group(2)]
    if not tagged:
        raise ValueError(f"Baris isi loop '{list_name}' tidak memiliki placeholder")
    first, last = tagged[0], tagged[-1]

    # Sisipkan penutup dulu (posisi belakang) agar offset depan tidak bergeser.
    # Gambar inline {%x} boleh berbagi paragraf dengan penanda loop.
    row = row[: last.end(2)] + "{/" + list_name + "}" + row[last.end(2):]
    row = row[: first.start(2)] + "{#" + list_name + "}" + row[first.start(2):]
    return row


def convert_loops(xml: str) -> tuple[str, list[str]]:
    rows = list(ROW_RE.finditer(xml))
    out, cursor, i, loops = [], 0, 0, []
    while i < len(rows):
        m = rows[i]
        fm = FOR_RE.search(row_text(m.group(0)))
        if not fm:
            i += 1
            continue
        var, list_name = fm.groups()
        if i + 2 >= len(rows) or not ENDFOR_RE.search(row_text(rows[i + 2].group(0))):
            raise ValueError(f"Struktur loop '{list_name}' bukan pola 3 baris (for / isi / endfor)")
        out.append(xml[cursor:m.start()])                       # konten sebelum baris for
        out.append(convert_loop_row(rows[i + 1].group(0), var, list_name))
        cursor = rows[i + 2].end()                              # lewati baris endfor
        loops.append(list_name)
        i += 3
    out.append(xml[cursor:])
    return "".join(out), loops


def convert_simple_tags(xml: str) -> str:
    xml = re.sub(r"\{\{@(\w+)\}\}", r"{@\1}", xml)
    return re.sub(r"\{\{(\w+)\}\}", lambda m: convert_tag(m.group(1)), xml)


def verify(xml: str, name: str) -> None:
    text = "".join(m.group(2) for m in WT_RE.finditer(xml))
    leftovers = re.findall(r"\{\{.*?\}\}|\{%tr.*?%\}", text)
    if leftovers:
        raise ValueError(f"{name}: sisa sintaks Jinja: {leftovers[:5]}")
    if text.count("{") != text.count("}"):
        raise ValueError(f"{name}: jumlah kurung kurawal tidak seimbang")


def main() -> int:
    if not SRC.exists():
        print(f"Templat sumber tidak ditemukan: {SRC}")
        return 1

    with zipfile.ZipFile(SRC) as zin, zipfile.ZipFile(DST, "w", zipfile.ZIP_DEFLATED) as zout:
        for info in zin.infolist():
            data = zin.read(info.filename)
            if info.filename.startswith("word/") and info.filename.endswith(".xml"):
                xml = data.decode("utf-8")
                if info.filename == "word/document.xml":
                    xml, log = tidy_template.tidy_document(xml)
                    for line in log:
                        print("rapikan:", line)
                if "{{" in xml or "{%" in xml:
                    xml, loops = convert_loops(xml)
                    xml = convert_simple_tags(xml)
                    verify(xml, info.filename)
                    tags = re.findall(r"\{[#/%@]?\w+\}", "".join(m.group(2) for m in WT_RE.finditer(xml)))
                    print(f"{info.filename}: {len(loops)} loop -> {', '.join(loops)}")
                    print(f"{info.filename}: {len(tags)} tag total")
                    data = xml.encode("utf-8")
            zout.writestr(info, data)

    print(f"Selesai: {DST.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

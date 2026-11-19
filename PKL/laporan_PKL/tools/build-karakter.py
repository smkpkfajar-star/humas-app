"""
Bangun js/data/karakter-svg.js dari aset karakter di E:/Humas/assets/siswa (folder assets/siswa
di akar repo). Jalankan ulang setiap kali aset SVG diubah:

    python tools/build-karakter.py

Kenapa tidak <img src="...svg">: animasi bagian tubuh (lengan, kepala, pupil mengikuti kursor)
butuh SVG inline. File SVG tidak bisa di-fetch saat aplikasi dibuka dari file://, jadi SVG
disematkan sebagai string JS. Karena semua karakter memakai ID yang sama (#kepala, #mata, …),
setiap ID diberi awalan unik per karakter. Grup yang dianimasikan dan sudah punya atribut
transform (pose bawaan) dibungkus: transform pose pindah ke grup dalam agar tidak tertimpa
transform animasi CSS.
"""

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent          # PKL/laporan_PKL
SRC = ROOT.parent.parent / "assets" / "siswa"           # assets/siswa di akar repo
DST = ROOT / "js" / "data" / "karakter-svg.js"

SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)
Q = lambda tag: "{%s}%s" % (SVG_NS, tag)

# nama → (file, awalan ID)
CHARACTERS = {
    "melambai": ("siswa-melambai.svg", "kw"),
    "laptop": ("siswi-laptop.svg", "kl"),
    # Properti (ikon label melayang): disisipkan tersembunyi, dipakai lewat <use href="#kp-prop-…">.
    "props": ("props-interaktif.svg", "kp"),
}

# Grup yang dianimasikan (lihat css/hero-stage.css).
ANIMATED = {"karakter", "bayangan", "dekorasi", "lengan-kanan", "tangan-kanan", "kepala",
            "pupil-kiri", "pupil-kanan", "kelopak", "badge-dokumen", "properti", "sparkle-1", "sparkle-2"}


def build(name, filename, prefix):
    path = SRC / filename
    if not path.exists():
        sys.exit(f"Aset tidak ditemukan: {path}")
    tree = ET.parse(path)
    root = tree.getroot()

    # Buang judul/deskripsi: karakter dekoratif (aria-hidden) di halaman.
    for tag in ("title", "desc"):
        for el in root.findall(Q(tag)):
            root.remove(el)
    for attr in ("role", "aria-labelledby", "width", "height"):
        root.attrib.pop(attr, None)
    root.set("aria-hidden", "true")
    root.set("focusable", "false")
    root.set("class", "hero-props" if name == "props" else f"hero-char hero-char--{name}")

    ids = {el.get("id") for el in root.iter() if el.get("id")}
    wrapped = 0
    for parent in root.iter():
        for i, el in enumerate(list(parent)):
            if el.get("id") in ANIMATED and el.get("transform"):
                inner = ET.Element(Q("g"), {"transform": el.attrib.pop("transform")})
                for c in list(el):
                    el.remove(c)
                    inner.append(c)
                el.append(inner)
                wrapped += 1

    # Pupil: clip-path (bentuk mata) tetap di grup luar, isi pupil di grup dalam
    # .pupil-move yang digeser JS → pupil bergerak di dalam mata, tidak ikut menggeser clip.
    for el in root.iter():
        if el.get("id") in ("pupil-kiri", "pupil-kanan"):
            inner = ET.Element(Q("g"), {"class": "pupil-move"})
            for c in list(el):
                el.remove(c)
                inner.append(c)
            el.append(inner)

    def pref(v):
        return f"{prefix}-{v}"

    for el in root.iter():
        if el.get("id"):
            el.set("id", pref(el.get("id")))
        for k, v in list(el.attrib.items()):
            nv = re.sub(r"url\(#([\w-]+)\)", lambda m: f"url(#{pref(m.group(1))})" if m.group(1) in ids else m.group(0), v)
            if k.endswith("href") and v.startswith("#") and v[1:] in ids:
                nv = "#" + pref(v[1:])
            if nv != v:
                el.set(k, nv)

    svg = ET.tostring(root, encoding="unicode")
    svg = re.sub(r">\s+<", "><", svg)          # perkecil
    need = ("prop-dokumen-ok", "prop-lencana-bintang", "prop-balon-halo") if name == "props" else         ("kepala", "kelopak", "pupil-kiri", "pupil-kanan", "karakter")
    missing = [a for a in need if a not in ids]
    if missing:
        sys.exit(f"{filename}: grup wajib tidak ada: {missing}")
    print(f"{filename}: {len(ids)} id -> awalan '{prefix}-', {wrapped} grup dibungkus, {len(svg)} karakter")
    return svg


def main():
    out = {name: build(name, f, p) for name, (f, p) in CHARACTERS.items()}
    js = ("/* DIBUAT OTOMATIS oleh tools/build-karakter.py dari assets/siswa/*.svg — jangan diedit manual. */\n"
          "(function (PKL) {\n  'use strict';\n  PKL.karakterSvg = " + json.dumps(out, ensure_ascii=False, indent=2) + ";\n})(window.PKL);\n")
    DST.write_text(js, encoding="utf-8")
    print(f"Selesai: {DST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

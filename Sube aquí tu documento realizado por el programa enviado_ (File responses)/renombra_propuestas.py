#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Renombra a:  Grupo - fecha - hora - Nombre.pdf

Reglas:
- Sólo se usa el encabezado de la PRIMERA PÁGINA, buscando la PRIMERA línea que empieza con
  'Propuesta del' y que termina con la hora ‘HH:MM’ (o ‘HH.MM’).
- Patrón tolerante: ‘Propuesta del Grupo #### | dd/mm/yyyy | hh:mm’
  (admite - o / en fecha, : o . en hora, barras verticales unicode, espacios, saltos).
- Si no se detecta grupo: '####'; si falta fecha u hora: '-----' y '---'.
- “Nombre” sale del nombre del archivo: última parte tras el último guion; usa primer nombre,
  y si hay homónimos dentro del mismo grupo, añade segundo nombre.
- Opción --dry-run y --verbose.
"""

import os
import re
import sys
import unicodedata
import argparse
from collections import defaultdict

# --- Extracción: usamos PyMuPDF primero, luego pdfminer y al final pypdf ---
EXTRACTORS = []

try:
    import fitz  # PyMuPDF
    def extract_first_page_text_fitz(path):
        try:
            with fitz.open(path) as doc:
                if doc.page_count == 0:
                    return ""
                page = doc.load_page(0)
                # "text" preserva saltos; "blocks" daría aún más control si se necesitara.
                t = page.get_text("text") or ""
                return t
        except Exception:
            return ""
    EXTRACTORS.append(("pymupdf", extract_first_page_text_fitz))
except Exception:
    pass

try:
    from pdfminer.high_level import extract_text as pdfminer_extract_text
    def extract_first_page_text_pdfminer(path):
        try:
            txt = pdfminer_extract_text(path) or ""
            # Nos quedamos con los primeros caracteres (suele incluir página 1 completa)
            return txt[:30000]
        except Exception:
            return ""
    EXTRACTORS.append(("pdfminer", extract_first_page_text_pdfminer))
except Exception:
    pass

try:
    from pypdf import PdfReader
    def extract_first_page_text_pypdf(path):
        try:
            r = PdfReader(path)
            if not r.pages:
                return ""
            return r.pages[0].extract_text() or ""
        except Exception:
            return ""
    EXTRACTORS.append(("pypdf", extract_first_page_text_pypdf))
except Exception:
    pass

# --- Utilidades de texto y regex tolerantes ---
BAR_CHARS = r"\|\uFE31\uFE33\u2502"  # | y variantes frecuentes
HEADER_ANYWHERE_RE = re.compile(
    rf"""(?ixs)
    \bPropuesta \s+ del \b .*?           # arranca con "Propuesta del" (puede haber texto entre)
    Grupo \s* (\d{{3,4}}) \s*            # grupo de 3-4 dígitos
    [{BAR_CHARS}] \s* (\d{{1,2}}[/-]\d{{1,2}}[/-]\d{{2,4}}) \s*
    [{BAR_CHARS}] \s* (\d{{1,2}}[:.]\d{{2}}) \b
    """,
)

DATE_RE = re.compile(r"(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})")
TIME_RE = re.compile(r"(\d{1,2})[:.](\d{2})")

DASH_SPLIT_RE = re.compile(r"\s*[-–—]\s+")
INVALID_FS_CHARS_RE = re.compile(r'[\\/:*?"<>|]+')

STOPWORDS = {
    "DE","DEL","LA","LAS","LOS","Y","MC","MAC","VON","DA","DOS","DAS","DI","DU"
}

def normalize_spaces(s: str) -> str:
    # limpia caracteres invisibles frecuentes en PDFs
    s = s.replace("\u00A0", " ").replace("\u200B", "").replace("\u200E", "").replace("\u200F", "")
    s = s.replace("\u2028", " ").replace("\u2029", " ")
    s = re.sub(r"[\x00-\x08\x0B-\x1F\x7F]", " ", s)  # controla
    return re.sub(r"\s+", " ", s).strip()

def strip_accents_keepcase(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn")

def parse_date(s: str) -> str | None:
    m = DATE_RE.search(s)
    if not m: return None
    d,mn,y = map(int, m.groups())
    if y < 100: y += 2000
    return f"{d:02d}-{mn:02d}-{y:04d}"

def parse_time(s: str) -> str | None:
    m = TIME_RE.search(s)
    if not m: return None
    hh,mm = map(int, m.groups())
    return f"{hh:02d}-{mm:02d}"

def safe_segment(s: str) -> str:
    s = s.strip().replace("/", "-").replace(":", "-").replace(".", "-")
    s = INVALID_FS_CHARS_RE.sub("-", s)
    return normalize_spaces(s)

def first_two_names(full_name: str):
    txt = re.sub(r"\(\d+\)$", "", full_name.strip())
    tokens = re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+", txt, flags=re.UNICODE)
    if not tokens:
        return full_name.strip().title(), None
    def is_stop(t): return strip_accents_keepcase(t).upper() in STOPWORDS
    filtered = [t for t in tokens if not is_stop(t)] or tokens
    first = filtered[0].title()
    second = filtered[1].title() if len(filtered) > 1 else None
    return first, second

def pick_name_for_group(name_full: str, need_two: bool) -> str:
    first, second = first_two_names(name_full)
    return f"{first} {second}" if need_two and second else first

def unique_path(dst_path: str) -> str:
    if not os.path.exists(dst_path): return dst_path
    base, ext = os.path.splitext(dst_path); i = 1
    while True:
        cand = f"{base} ({i}){ext}"
        if not os.path.exists(cand): return cand
        i += 1

def derive_original_name_from_filename(filename_no_ext: str) -> str:
    parts = DASH_SPLIT_RE.split(filename_no_ext)
    candidate = parts[-1] if parts else filename_no_ext
    candidate = re.sub(r"\(\d+\)$", "", candidate).strip()
    return normalize_spaces(candidate)

def find_header_in_first_page(pdf_path: str, verbose=False):
    """
    Devuelve (grupo, fecha_std, hora_std) o (None,None,None) si no se halló.
    Usa PyMuPDF -> pdfminer -> pypdf. Busca la PRIMERA coincidencia
    que empiece con 'Propuesta del' y contenga 'Grupo #### | fecha | hora'.
    """
    for engine, fn in EXTRACTORS:
        txt = fn(pdf_path)
        if not txt:
            continue
        # Mantener saltos para DOTALL, pero limpiar invisibles
        txt = txt.replace("\u00A0", " ").replace("\u200B", "").replace("\u200E","").replace("\u200F","")
        m = HEADER_ANYWHERE_RE.search(txt)
        if m:
            grupo = m.group(1)
            fecha_std = parse_date(m.group(2)) or "-----"
            hora_std  = parse_time(m.group(3)) or "---"
            if verbose:
                print(f"[{engine}] {os.path.basename(pdf_path)} -> grupo={grupo}, fecha={fecha_std}, hora={hora_std}")
            return grupo, fecha_std, hora_std
        else:
            if verbose:
                print(f"[{engine}] sin match en {os.path.basename(pdf_path)}")
    return None, None, None

def main():
    ap = argparse.ArgumentParser(description="Renombra PDFs a 'Grupo - fecha - hora - Nombre.pdf' detectando el encabezado en la PRIMERA PÁGINA.")
    ap.add_argument("carpeta", nargs="?", default=".", help="Carpeta con PDFs. Default: .")
    ap.add_argument("--dry-run", action="store_true", help="Simula sin renombrar.")
    ap.add_argument("--verbose", action="store_true", help="Diagnóstico.")
    args = ap.parse_args()

    folder = os.path.abspath(args.carpeta)
    pdfs = [f for f in os.listdir(folder) if f.lower().endswith(".pdf")]
    pdfs.sort()
    if not pdfs:
        print("No se encontraron PDFs en:", folder)
        return

    # 1) Precalculamos homónimos por grupo
    group_first_to_files = defaultdict(list)
    staging = []

    for fname in pdfs:
        path = os.path.join(folder, fname)
        base, _ = os.path.splitext(fname)
        name_full = derive_original_name_from_filename(base)
        first_name, _ = first_two_names(name_full)

        grupo, fecha, hora = find_header_in_first_page(path, verbose=args.verbose)
        if grupo is None:
            grupo, fecha, hora = "####", "-----", "---"

        rec = {"path": path, "old": fname, "grupo": grupo, "fecha": fecha, "hora": hora,
               "name_full": name_full, "first_name": first_name}
        staging.append(rec)

        if grupo != "####":
            key = (grupo, strip_accents_keepcase(first_name).upper())
            group_first_to_files[key].append(rec)

    need_two = set(k for k, files in group_first_to_files.items() if len(files) > 1)

    # 2) Renombrar
    for rec in staging:
        fecha_seg = safe_segment(rec["fecha"] or "-----")
        hora_seg  = safe_segment(rec["hora"]  or "---")

        key = (rec["grupo"], strip_accents_keepcase(rec["first_name"]).upper())
        nombre_final = pick_name_for_group(rec["name_full"], need_two=(key in need_two))
        nombre_final = safe_segment(nombre_final)

        nuevo = f"{rec['grupo']} - {fecha_seg} - {hora_seg} - {nombre_final}.pdf"
        new_path = unique_path(os.path.join(os.path.dirname(rec["path"]), nuevo))

        if args.dry_run:
            print(f"[SIMULA] {rec['old']} -> {os.path.basename(new_path)}")
        else:
            os.rename(rec["path"], new_path)
            print(f"OK  {rec['old']} -> {os.path.basename(new_path)}")

if __name__ == "__main__":
    main()

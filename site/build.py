#!/usr/bin/env python3
"""Compila il sito Persian Home incorporando le foto di photos/ dentro template.html.

    python3 site/build.py

Ogni segnaposto {{PHOTO:nome}} nel template viene sostituito con la foto
photos/nome.jpg (o .png/.webp/.heic), ridimensionata e compressa.
Il risultato e' un singolo file HTML autosufficiente in dist/.
"""

import argparse
import base64
import io
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Manca Pillow. Installalo con:  pip install Pillow")

try:  # foto iPhone .HEIC
    import pillow_heif

    pillow_heif.register_heif_opener()
    HEIC = True
except ImportError:
    HEIC = False

RADICE = Path(__file__).resolve().parent
TEMPLATE = RADICE / "template.html"
FOTO = RADICE / "photos"
USCITA = RADICE / "dist" / "persian-home.html"

ESTENSIONI = (".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif")

# La pagina ritaglia ogni foto (object-fit: cover), quindi il vincolo e' il lato
# CORTO: e' quello che resta dopo il ritaglio. I riquadri del menu sono larghi
# ~340px, quindi 700px sul lato corto copre gli schermi retina con margine.
LATO_STANDARD = 700
LATO_PER_SLOT = {
    "sholezard": 900,  # foto grande dell'apertura
    "dolcetti": 900,   # foto grande della sezione storia
    "logo": 160,       # mostrato a 30px, resta PNG per la trasparenza
}
# Tetto sul lato lungo, per non trascinare foto molto allungate.
LATO_LUNGO_MAX = 1600

# Sotto questa risoluzione la foto sgrana: va rifatta.
SOGLIA_QUALITA = 700

LIMITE_PAGINA_MB = 15.0  # gli Artifact si fermano a 16 MB


def trova_foto(slug):
    for est in ESTENSIONI:
        for candidato in (FOTO / f"{slug}{est}", FOTO / f"{slug}{est.upper()}"):
            if candidato.exists():
                return candidato
    return None


def codifica(percorso, lato_corto_max):
    """Ridimensiona, comprime e restituisce (data-uri, lato_corto_originale, byte)."""
    with Image.open(percorso) as img:
        img = ImageOps.exif_transpose(img)  # raddrizza le foto da telefono
        originale = min(img.size)

        scala = min(lato_corto_max / originale, LATO_LUNGO_MAX / max(img.size), 1.0)
        if scala < 1.0:
            img = img.resize((max(1, round(img.width * scala)),
                              max(1, round(img.height * scala))), Image.LANCZOS)

        buf = io.BytesIO()
        if img.mode in ("RGBA", "LA", "P"):
            img.convert("RGBA").save(buf, "PNG", optimize=True)
            mime = "image/png"
        else:
            img.convert("RGB").save(buf, "JPEG", quality=QUALITA, optimize=True,
                                    progressive=True)
            mime = "image/jpeg"

    dati = buf.getvalue()
    uri = f"data:{mime};base64," + base64.b64encode(dati).decode()
    return uri, originale, len(dati)


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--qualita", type=int, default=82,
                        help="qualita JPEG 1-95 (default 82)")
    parser.add_argument("--lato", type=int, default=LATO_STANDARD,
                        help=f"lato corto in px (default {LATO_STANDARD})")
    parser.add_argument("--salta-mancanti", action="store_true",
                        help="continua anche se una foto manca, lasciando un riquadro vuoto")
    parser.add_argument("--anteprima", action="store_true",
                        help="versione da mostrare a un cliente: toglie i dati "
                             "amministrativi e le note di lavoro")
    args = parser.parse_args()

    global QUALITA
    QUALITA = args.qualita

    if not TEMPLATE.exists():
        sys.exit(f"Template non trovato: {TEMPLATE}")

    testo = TEMPLATE.read_text(encoding="utf-8")
    slot = list(dict.fromkeys(re.findall(r"\{\{PHOTO:([a-z0-9-]+)\}\}", testo)))
    if not slot:
        sys.exit("Nessun segnaposto {{PHOTO:...}} nel template.")

    print(f"\n  Persian Home — compilazione di {len(slot)} foto\n")
    print(f"  {'piatto':<24} {'file':<10} {'px':>6}  {'kB':>6}")
    print("  " + "-" * 50)

    sostituzioni, mancanti, sgranate, totale = {}, [], [], 0

    for slug in sorted(slot):
        percorso = trova_foto(slug)
        if percorso is None:
            mancanti.append(slug)
            sostituzioni[slug] = ""
            print(f"  {slug:<24} {'MANCA':<10} {'':>6}  {'':>6}")
            continue

        lato = LATO_PER_SLOT.get(slug, args.lato)
        uri, originale, byte = codifica(percorso, lato)
        sostituzioni[slug] = uri
        totale += len(uri)

        segnale = ""
        if slug != "logo" and originale < SOGLIA_QUALITA:
            sgranate.append((slug, originale))
            segnale = "  <- bassa risoluzione"

        print(f"  {slug:<24} {percorso.suffix.lstrip('.'):<10} "
              f"{originale:>6}  {byte / 1024:>6.0f}{segnale}")

    if mancanti and not args.salta_mancanti:
        print("\n  Foto mancanti in photos/: " + ", ".join(mancanti))
        print("  Aggiungile (jpg, png, webp o heic) oppure usa --salta-mancanti.\n")
        return 1

    pagina = re.sub(r"\{\{PHOTO:([a-z0-9-]+)\}\}",
                    lambda m: sostituzioni[m.group(1)], testo)

    uscita = USCITA
    if args.anteprima:
        pagina, tolti = re.subn(r"<!--INTERNO-->.*?<!--/INTERNO-->", "", pagina, flags=re.S)
        uscita = USCITA.with_name("persian-home-anteprima.html")
        print(f"\n  Anteprima cliente: rimosse {tolti} sezioni interne")
        rimasti = pagina.count('class="manca"')
        if rimasti:
            print(f"  ATTENZIONE: {rimasti} segnaposto ancora visibili, "
                  f"vanno racchiusi fra <!--INTERNO--> e <!--/INTERNO-->")

    uscita.parent.mkdir(parents=True, exist_ok=True)
    uscita.write_text(pagina, encoding="utf-8")
    peso = len(pagina.encode()) / 1024 / 1024

    print("  " + "-" * 50)
    print(f"\n  Scritto {uscita.relative_to(RADICE.parent)} — {peso:.2f} MB")

    if peso > LIMITE_PAGINA_MB:
        print(f"  Attenzione: oltre {LIMITE_PAGINA_MB} MB, un Artifact si ferma a 16 MB.")
        print(f"  Rilancia con --lato 700 --qualita 75 per alleggerire.")

    if sgranate:
        print(f"\n  Da rifare ad alta risoluzione ({len(sgranate)}):")
        for slug, px in sorted(sgranate, key=lambda x: x[1]):
            print(f"    {slug:<24} lato corto {px}px (servono almeno {SOGLIA_QUALITA})")

    if any(p.suffix.lower() in (".heic", ".heif") for p in FOTO.iterdir()) and not HEIC:
        print("\n  Ci sono file .heic ma manca il lettore: pip install pillow-heif")

    print()
    return 0


if __name__ == "__main__":
    sys.exit(main())

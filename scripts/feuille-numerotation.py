"""Feuille de numérotation 50 × 50 cm (traceur, échelle 1:1), posée sur la planche
avant de planter les clous, puis déchirée autour des clous à la fin du portrait.

Géométrie lue dans le moteur (`services/engine/boards/`) : mêmes repères A1–D60 que le
guide vocal, le site et les fichiers CNC. Sortie : SVG 540 × 540 mm (format fini 500 × 500 au centre, traits de coupe, Y vers le bas) ;
le PDF est produit par `scripts/feuille-numerotation-pdf.cjs`.

Le centre (sous le portrait) reste blanc et vierge : il est prisonnier des fils et sert
de fond. Tout le marquage est hors du cercle des clous.

Usage : python scripts/feuille-numerotation.py DOSSIER
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "services" / "engine"))
from stringart.geometry import BoardGeometry  # noqa: E402

TEAR_EVERY = 5        # déchirure radiale tous les 5 clous
INK = "#161412"
TINT = {"black": "#cfccc6", "white": "#ffffff"}   # A et C teintés clair (économie d'encre)
FONT = "DejaVu Sans, Arial, Helvetica, sans-serif"
DASH = 'stroke-dasharray="1.5 1.5"'
MARGIN = 20.0        # marge blanche autour du format fini (page 540 x 540 mm)
BLEED = 3.0          # fond perdu


def polar(c: float, r: float, a: float) -> tuple[float, float]:
    """Angle mathématique (Y vers le haut) -> coordonnées SVG (Y vers le bas)."""
    return c + r * math.cos(a), c - r * math.sin(a)


def to_square_edge(c: float, a: float, half: float) -> float:
    """Distance du centre au bord du carré dans la direction a."""
    return half / max(abs(math.cos(a)), abs(math.sin(a)))


def build_svg(geo: BoardGeometry) -> str:
    s = geo.board_size_mm
    c = s / 2
    r_n = geo.circle_diameter_mm / 2
    n, per = geo.nail_count, geo.nails_per_sector
    step = 2 * math.pi / n
    angles = [float(a) for a in geo.angles_rad()]
    bg = ["black", "white", "black", "white"]
    page = s + 2 * MARGIN
    b = BLEED
    o: list[str] = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{page}mm" height="{page}mm" viewBox="0 0 {page} {page}">',
        "<title>Feuille de numérotation DeeKra 50 x 50 cm, 1:1</title>",
        '<rect width="100%" height="100%" fill="#ffffff"/>',
    ]
    o += crop_marks(s)
    o += [
        f'<g transform="translate({MARGIN} {MARGIN})">',
        # quarts : A haut-gauche, B haut-droit, C bas-droit, D bas-gauche (comme la planche imprimée),
        # avec 3 mm de fond perdu au-delà de la coupe
        f'<rect x="{-b}" y="{-b}" width="{c + b}" height="{c + b}" fill="{TINT[bg[0]]}"/>',
        f'<rect x="{c}" y="{-b}" width="{c + b}" height="{c + b}" fill="{TINT[bg[1]]}"/>',
        f'<rect x="{c}" y="{c}" width="{c + b}" height="{c + b}" fill="{TINT[bg[2]]}"/>',
        f'<rect x="{-b}" y="{c}" width="{c + b}" height="{c + b}" fill="{TINT[bg[3]]}"/>',
        f'<circle cx="{c}" cy="{c}" r="{r_n - 1.0}" fill="#ffffff"/>',   # centre blanc, sous le portrait
    ]
    # Grandes lettres de zone dans les coins
    corners = {"A": (28, 28), "B": (s - 28, 28), "C": (s - 28, s - 28), "D": (28, s - 28)}
    for letter, (x, y) in corners.items():
        o.append(f'<text x="{x}" y="{y}" font-family="Georgia, DejaVu Serif, serif" font-size="26" '
                 f'font-weight="700" fill="{INK}" text-anchor="middle" dominant-baseline="central">{letter}</text>')
    # Déchirures : cercle passant par les clous + radiales jusqu'au bord, tous les 5 clous
    o.append(f'<circle cx="{c}" cy="{c}" r="{r_n}" fill="none" stroke="{INK}" stroke-width="0.3" {DASH}/>')
    for i in range(0, n, TEAR_EVERY):
        a = angles[i] + step / 2 if i else angles[0] - step / 2
        boundary = i % per == 0
        (x0, y0) = polar(c, r_n, a)
        (x1, y1) = polar(c, to_square_edge(c, a, c), a)
        o.append(f'<line x1="{x0:.3f}" y1="{y0:.3f}" x2="{x1:.3f}" y2="{y1:.3f}" stroke="{INK}" '
                 f'stroke-width="{0.6 if boundary else 0.3}" {DASH}/>')
    # Clous : point au diamètre du clou + cercle de visée ; repère complet « A12 » vers l'extérieur
    for i, a in enumerate(angles):
        x, y = polar(c, r_n, a)
        o.append(f'<circle cx="{x:.3f}" cy="{y:.3f}" r="2.2" fill="#ffffff" stroke="{INK}" stroke-width="0.2"/>')
        o.append(f'<circle cx="{x:.3f}" cy="{y:.3f}" r="{geo.nail_diameter_mm / 2}" fill="{INK}"/>')
        number = i % per + 1
        bold = number == 1 or number % 10 == 0
        lx, ly = polar(c, r_n + 3.6, a)
        o.append(f'<text x="{lx:.3f}" y="{ly:.3f}" transform="rotate({-math.degrees(a):.3f} {lx:.3f} {ly:.3f})" '
                 f'font-family="{FONT}" font-size="{3.0 if bold else 2.7}" font-weight="{700 if bold else 400}" '
                 f'fill="{INK}" dominant-baseline="central">{geo.label(i)}</text>')
    # Contrôle d'échelle (coin D) : deux règles de 100 mm
    o += ruler(70, s - 6, vertical=False)
    o += ruler(6, s - 70, vertical=True)
    o.append(f'<text x="120" y="{s - 15}" font-family="{FONT}" font-size="4" fill="{INK}" text-anchor="middle">'
             "Imprimer à 100 % : chaque règle = 100 mm</text>")
    o.append("</g></svg>")
    return "\n".join(o) + "\n"


def crop_marks(s: float) -> list[str]:
    """Traits de coupe aux 4 coins du format fini + mention dans la marge."""
    m, gap, ln = MARGIN, 3.0, 12.0
    o = []
    for cx in (m, m + s):
        for cy in (m, m + s):
            dx = -1 if cx == m else 1
            dy = -1 if cy == m else 1
            o.append(f'<line x1="{cx + dx * gap}" y1="{cy}" x2="{cx + dx * (gap + ln)}" y2="{cy}" stroke="#000" stroke-width="0.25"/>')
            o.append(f'<line x1="{cx}" y1="{cy + dy * gap}" x2="{cx}" y2="{cy + dy * (gap + ln)}" stroke="#000" stroke-width="0.25"/>')
    page = s + 2 * m
    txt = "COUPE : format fini 500 × 500 mm aux traits des coins (fond perdu 3 mm) · imprimer à 100 %"
    o.append(f'<text x="{page / 2}" y="{m / 2 + 2}" font-family="{FONT}" font-size="5" fill="#000" text-anchor="middle">{txt}</text>')
    o.append(f'<text x="{page / 2}" y="{page - m / 2 + 2}" font-family="{FONT}" font-size="5" fill="#000" text-anchor="middle">{txt}</text>')
    return o


def ruler(x: float, y: float, vertical: bool) -> list[str]:
    """Règle de 100 mm graduée au mm, les graduations vers l'intérieur de la feuille."""
    o = []
    for mm in range(0, 101):
        h = 5 if mm % 10 == 0 else 3.5 if mm % 5 == 0 else 2
        w = 0.35 if mm % 10 == 0 else 0.18
        if vertical:
            o.append(f'<line x1="{x}" y1="{y - mm:.2f}" x2="{x + h}" y2="{y - mm:.2f}" stroke="{INK}" stroke-width="{w}"/>')
        else:
            o.append(f'<line x1="{x + mm:.2f}" y1="{y}" x2="{x + mm:.2f}" y2="{y - h}" stroke="{INK}" stroke-width="{w}"/>')
    end = (x, y - 100) if vertical else (x + 100, y)
    o.append(f'<line x1="{x}" y1="{y}" x2="{end[0]}" y2="{end[1]}" stroke="{INK}" stroke-width="0.35"/>')
    return o


def main() -> None:
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    path = out / "feuille-numerotation-50x50.svg"
    path.write_text(build_svg(BoardGeometry.load()), encoding="utf-8")
    print(path)


if __name__ == "__main__":
    main()

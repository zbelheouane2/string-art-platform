"""Fichiers d'impression de la planche 50 x 50 cm, à l'échelle 1:1 (unités en mm).

Les positions des clous viennent de la géométrie du moteur (source de vérité
unique) : services/engine/boards/board-50x50-240-v1.json.

Usage : python scripts/planche-impression.py DOSSIER_SORTIE
Produit :
  planche-50x50-coupe.svg   500 x 500 mm, au format fini
  planche-50x50-impression.svg  520 x 520 mm : fonds perdus 3 mm + traits de coupe
  clous-positions.csv       repère, x_mm, y_mm (origine coin haut-gauche, Y vers le bas), angle
Le PDF est tiré du SVG d'impression par scripts/planche-impression-pdf.cjs.
"""

from __future__ import annotations

import csv
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "services" / "engine"))
from stringart.geometry import BoardGeometry  # noqa: E402

INK = "#161412"
PAPER = "#ffffff"
BLEED = 3.0
MARGIN = 10.0  # espace autour du format fini pour les traits de coupe
FONT = "DejaVu Sans, Arial, Helvetica, sans-serif"


def board_svg(g: BoardGeometry, offset: float, bleed: float) -> list[str]:
    size = g.board_size_mm
    c = size / 2
    r = g.circle_diameter_mm / 2
    dark = [True, False, True, False]  # A et C sur fond noir
    out: list[str] = [f'<g transform="translate({offset} {offset})">']
    # Quarts de fond (avec fonds perdus vers l'extérieur).
    quads = [(-bleed, -bleed), (c, -bleed), (c, c), (-bleed, c)]
    for k, (x, y) in enumerate(quads):
        out.append(f'<rect x="{x}" y="{y}" width="{c + bleed}" height="{c + bleed}" fill="{INK if dark[k] else PAPER}"/>')
    out.append(f'<circle cx="{c}" cy="{c}" r="{r - 4}" fill="{PAPER}"/>')
    out.append(f'<circle cx="{c}" cy="{c}" r="{r - 4}" fill="none" stroke="{INK}" stroke-opacity="0.25" stroke-width="0.25"/>')
    pos = g.positions_mm()
    ang = g.angles_rad()
    hole = g.nail_diameter_mm / 2
    for i in range(g.nail_count):
        x, y = pos[i]
        a = ang[i]
        sector, n = divmod(i, g.nails_per_sector)
        ink = PAPER if dark[sector] else INK
        # Repère de perçage : point au diamètre du clou + petite croix.
        out.append(f'<circle cx="{x:.3f}" cy="{y:.3f}" r="{hole:.3f}" fill="{ink}"/>')
        tx, ty = c + (r + 7.2) * math.cos(a), c - (r + 7.2) * math.sin(a)
        rot = -math.degrees(a) + (180 if math.cos(a) < 0 else 0)
        strong = n + 1 == 1 or (n + 1) % 10 == 0
        out.append(
            f'<text x="{tx:.3f}" y="{ty:.3f}" transform="rotate({rot:.3f} {tx:.3f} {ty:.3f})" fill="{ink}" '
            f'font-size="{3.6 if strong else 2.9}" font-weight="{700 if strong else 400}" '
            f'text-anchor="middle" dominant-baseline="central" font-family="{FONT}">{n + 1}</text>'
        )
    letters = [(22, 28), (size - 22, 28), (size - 22, size - 16), (22, size - 16)]
    for k, (x, y) in enumerate(letters):
        out.append(
            f'<text x="{x}" y="{y}" fill="{PAPER if dark[k] else INK}" font-size="20" font-family="Georgia, DejaVu Serif, serif" '
            f'text-anchor="middle">{g.sectors[k]}</text>'
        )
    out.append("</g>")
    return out


def crop_marks(size: float, offset: float) -> list[str]:
    """Traits de coupe aux quatre coins, décalés de 3 mm du format fini."""
    gap, length = 3.0, 6.0
    lines = []
    for cx in (offset, offset + size):
        for cy in (offset, offset + size):
            sx = -1 if cx == offset else 1
            sy = -1 if cy == offset else 1
            lines.append(f'<line x1="{cx + sx * gap}" y1="{cy}" x2="{cx + sx * (gap + length)}" y2="{cy}"/>')
            lines.append(f'<line x1="{cx}" y1="{cy + sy * gap}" x2="{cx}" y2="{cy + sy * (gap + length)}"/>')
    return [f'<g stroke="#000" stroke-width="0.25">', *lines, "</g>"]


def svg(width: float, body: list[str]) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}mm" height="{width}mm" viewBox="0 0 {width} {width}">\n'
        + "\n".join(body)
        + "\n</svg>\n"
    )


def main(out_dir: Path) -> None:
    g = BoardGeometry.load()
    out_dir.mkdir(parents=True, exist_ok=True)
    size = g.board_size_mm
    (out_dir / "planche-50x50-coupe.svg").write_text(
        svg(size, [f'<clipPath id="f"><rect width="{size}" height="{size}"/></clipPath>', '<g clip-path="url(#f)">', *board_svg(g, 0, 0), "</g>"]),
        encoding="utf-8",
    )
    page = size + 2 * MARGIN
    info = (
        f'<text x="{MARGIN}" y="{page - 2.5}" font-size="3" font-family="{FONT}" fill="#000">'
        f"{g.id} · planche {size:g} x {size:g} mm · cercle des clous Ø {g.circle_diameter_mm:g} mm · "
        f"{g.nail_count} clous Ø {g.nail_diameter_mm:g} mm · A1 à 9 h, sens horaire · fonds perdus {BLEED:g} mm · échelle 1:1</text>"
    )
    (out_dir / "planche-50x50-impression.svg").write_text(
        svg(page, [*board_svg(g, MARGIN, BLEED), *crop_marks(size, MARGIN), info]), encoding="utf-8"
    )
    pos = g.positions_mm()
    ang = g.angles_rad()
    with (out_dir / "clous-positions.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["repere", "x_mm", "y_mm", "angle_deg_depuis_centre"])
        for i in range(g.nail_count):
            w.writerow([g.label(i), f"{pos[i][0]:.2f}", f"{pos[i][1]:.2f}", f"{math.degrees(ang[i]) % 360:.2f}"])
    print("ok", out_dir)


if __name__ == "__main__":
    main(Path(sys.argv[1]))

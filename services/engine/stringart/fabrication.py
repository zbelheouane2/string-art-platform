"""Fichiers de fabrication CNC de la planche : perçage des clous, gravure, découpe.

Source de vérité : `BoardGeometry` (mêmes positions que le moteur, le PDF et le
guide vocal). Aucune dépendance externe : DXF (R12 ASCII), SVG et G-code (GRBL)
sont écrits à la main pour rester lisibles par tous les logiciels de CNC hobby.

Repère machine (DXF et G-code) : millimètres, origine X0 Y0 au coin
bas-gauche de la planche finie (coin du secteur D), Y vers le haut, Z0 sur le
dessus de la planche. Le SVG garde la convention image (Y vers le bas).

Usage :
    python -m stringart.fabrication --out dossier/ [--thickness 17]
"""

from __future__ import annotations

import argparse
import csv
import math
from dataclasses import dataclass, field
from pathlib import Path


from .geometry import BoardGeometry

Point = tuple[float, float]
Polyline = list[Point]


# --------------------------------------------------------------------------
# Paramètres (centralisés, modifiables en ligne de commande)
# --------------------------------------------------------------------------
@dataclass(frozen=True)
class CncParams:
    thickness_mm: float = 17.0          # MDF 17 mm
    # Perçage des avant-trous des clous
    drill_diameter_mm: float = 1.2      # clou de 1,5 mm : avant-trou ≈ 80 %
    drill_depth_mm: float = 10.0        # trou borgne, le clou s'enfonce ensuite de 2-3 mm de plus
    drill_peck_mm: float = 2.5          # débourrage tous les 2,5 mm
    drill_feed: float = 150.0           # mm/min en plongée
    drill_rpm: int = 10000
    # Découpe du contour
    endmill_diameter_mm: float = 3.175  # fraise 1/8" (3,175 mm) 2 dents
    cut_depth_per_pass_mm: float = 2.0
    cut_overcut_mm: float = 0.3         # on traverse de 0,3 mm dans le martyr
    cut_feed: float = 1000.0
    cut_plunge: float = 300.0
    cut_rpm: int = 18000
    tab_length_mm: float = 10.0         # 2 attaches par côté
    tab_height_mm: float = 3.0          # épaisseur laissée sous l'attache
    # Gravure (optionnelle)
    engrave_depth_mm: float = 0.4
    engrave_feed: float = 800.0
    engrave_plunge: float = 200.0
    engrave_rpm: int = 18000
    number_height_mm: float = 3.5
    number_radius_mm: float = 243.0     # centre des numéros (bord à 250, clous à 235)
    numbered: tuple[int, ...] = field(default=(1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60))
    letter_height_mm: float = 20.0
    # Déplacements
    safe_z_mm: float = 5.0
    hop_z_mm: float = 2.0               # hauteur de saut entre deux clous voisins


# --------------------------------------------------------------------------
# Police à un seul trait (chiffres + lettres de secteur), grille 4 x 6
# --------------------------------------------------------------------------
GLYPHS: dict[str, list[Polyline]] = {
    "0": [[(1, 0), (3, 0), (4, 1), (4, 5), (3, 6), (1, 6), (0, 5), (0, 1), (1, 0)]],
    "1": [[(1, 5), (2, 6), (2, 0)], [(1, 0), (3, 0)]],
    "2": [[(0, 5), (1, 6), (3, 6), (4, 5), (4, 4), (0, 0), (4, 0)]],
    "3": [[(0, 5), (1, 6), (3, 6), (4, 5), (4, 4), (3, 3), (4, 2), (4, 1), (3, 0), (1, 0), (0, 1)],
          [(1, 3), (3, 3)]],
    "4": [[(3, 0), (3, 6), (0, 2), (4, 2)]],
    "5": [[(4, 6), (0, 6), (0, 3), (3, 3), (4, 2), (4, 1), (3, 0), (0, 0)]],
    "6": [[(4, 5), (3, 6), (1, 6), (0, 5), (0, 1), (1, 0), (3, 0), (4, 1), (4, 2), (3, 3), (0, 3)]],
    "7": [[(0, 6), (4, 6), (1, 0)]],
    "8": [[(1, 3), (0, 4), (0, 5), (1, 6), (3, 6), (4, 5), (4, 4), (3, 3), (1, 3),
           (0, 2), (0, 1), (1, 0), (3, 0), (4, 1), (4, 2), (3, 3)]],
    "9": [[(4, 3), (1, 3), (0, 4), (0, 5), (1, 6), (3, 6), (4, 5), (4, 1), (3, 0), (1, 0), (0, 1)]],
    "A": [[(0, 0), (2, 6), (4, 0)], [(2 / 3, 2), (10 / 3, 2)]],
    "B": [[(0, 0), (0, 6), (3, 6), (4, 5), (4, 4), (3, 3), (0, 3)],
          [(3, 3), (4, 2), (4, 1), (3, 0), (0, 0)]],
    "C": [[(4, 5), (3, 6), (1, 6), (0, 5), (0, 1), (1, 0), (3, 0), (4, 1)]],
    "D": [[(0, 0), (0, 6), (2.5, 6), (4, 4.5), (4, 1.5), (2.5, 0), (0, 0)]],
}
GLYPH_W, GLYPH_H, GLYPH_ADVANCE = 4.0, 6.0, 5.5


def text_strokes(text: str, center: Point, height: float, up_angle_rad: float) -> list[Polyline]:
    """Texte centré sur `center`, dont le « haut » pointe vers `up_angle_rad` (Y vers le haut)."""
    s = height / GLYPH_H
    width = (len(text) - 1) * GLYPH_ADVANCE + GLYPH_W
    ux, uy = math.cos(up_angle_rad), math.sin(up_angle_rad)   # vers le haut du texte
    rx, ry = uy, -ux                                          # sens de lecture
    out: list[Polyline] = []
    for k, ch in enumerate(text):
        for stroke in GLYPHS[ch]:
            pts = []
            for gx, gy in stroke:
                lx = (k * GLYPH_ADVANCE + gx - width / 2) * s
                ly = (gy - GLYPH_H / 2) * s
                pts.append((center[0] + lx * rx + ly * ux, center[1] + lx * ry + ly * uy))
            out.append(pts)
    return out


# --------------------------------------------------------------------------
# Géométrie de fabrication (repère machine, Y vers le haut)
# --------------------------------------------------------------------------
@dataclass
class FabricationLayout:
    size: float
    holes: list[tuple[str, float, float]]      # (repère, x, y)
    outline: Polyline                          # contour fini, sens horaire
    engraving: list[Polyline]


def build_layout(geo: BoardGeometry, p: CncParams) -> FabricationLayout:
    size = geo.board_size_mm
    c = size / 2
    mm = geo.positions_mm()
    holes = [(geo.label(i), float(x), float(size - y)) for i, (x, y) in enumerate(mm)]

    engraving: list[Polyline] = []
    angles = geo.angles_rad()  # angle mathématique, Y vers le haut : valable tel quel ici
    for i, a in enumerate(angles):
        number = i % geo.nails_per_sector + 1
        if number in p.numbered:
            center = (c + p.number_radius_mm * math.cos(a), c + p.number_radius_mm * math.sin(a))
            engraving += text_strokes(str(number), center, p.number_height_mm, a)
    # Frontières de secteurs : traits radiaux entre D60|A1, A60|B1, B60|C1, C60|D1
    step = 2 * math.pi / geo.nail_count
    for s in range(len(geo.sectors)):
        a = float(angles[s * geo.nails_per_sector]) + 0.5 * step
        r0, r1 = geo.circle_diameter_mm / 2 + 3, size / 2 - 2
        engraving.append([(c + r0 * math.cos(a), c + r0 * math.sin(a)),
                          (c + r1 * math.cos(a), c + r1 * math.sin(a))])
    # Lettres des secteurs dans les coins (A haut-gauche, B haut-droit, C bas-droit, D bas-gauche)
    m = 30.0
    corners = {"A": (m, size - m), "B": (size - m, size - m), "C": (size - m, m), "D": (m, m)}
    for letter in geo.sectors:
        engraving += text_strokes(letter, corners[letter], p.letter_height_mm, math.pi / 2)

    outline = [(0.0, 0.0), (0.0, size), (size, size), (size, 0.0), (0.0, 0.0)]  # horaire
    return FabricationLayout(size, holes, outline, engraving)


# --------------------------------------------------------------------------
# Exports
# --------------------------------------------------------------------------
def write_dxf(layout: FabricationLayout, p: CncParams, path: Path) -> None:
    """DXF R12 ASCII, unités mm, calques DECOUPE / PERCAGE / GRAVURE / REPERES."""
    L: list[str] = []

    def add(*pairs):
        for code, val in pairs:
            L.extend([str(code), str(val)])

    add((0, "SECTION"), (2, "HEADER"), (9, "$ACADVER"), (1, "AC1009"),
        (9, "$INSUNITS"), (70, 4), (9, "$MEASUREMENT"), (70, 1),
        (9, "$EXTMIN"), (10, -5), (20, -5), (9, "$EXTMAX"), (10, layout.size + 5), (20, layout.size + 5),
        (0, "ENDSEC"))
    layers = [("DECOUPE", 1), ("PERCAGE", 5), ("GRAVURE", 3), ("REPERES", 8)]
    add((0, "SECTION"), (2, "TABLES"), (0, "TABLE"), (2, "LAYER"), (70, len(layers)))
    for name, color in layers:
        add((0, "LAYER"), (2, name), (70, 0), (62, color), (6, "CONTINUOUS"))
    add((0, "ENDTAB"), (0, "ENDSEC"), (0, "SECTION"), (2, "ENTITIES"))

    def polyline(pts: Polyline, layer: str, closed: bool = False):
        add((0, "POLYLINE"), (8, layer), (66, 1), (70, 1 if closed else 0))
        for x, y in pts:
            add((0, "VERTEX"), (8, layer), (10, f"{x:.4f}"), (20, f"{y:.4f}"))
        add((0, "SEQEND"), (8, layer))

    polyline(layout.outline[:-1], "DECOUPE", closed=True)
    for _, x, y in layout.holes:
        add((0, "CIRCLE"), (8, "PERCAGE"), (10, f"{x:.4f}"), (20, f"{y:.4f}"), (40, p.drill_diameter_mm / 2))
    for pts in layout.engraving:
        polyline(pts, "GRAVURE")
    for label, x, y in layout.holes:
        add((0, "POINT"), (8, "REPERES"), (10, f"{x:.4f}"), (20, f"{y:.4f}"))
    add((0, "ENDSEC"), (0, "EOF"))
    path.write_text("\n".join(L) + "\n", encoding="ascii")


def write_svg(layout: FabricationLayout, p: CncParams, path: Path) -> None:
    """SVG 1:1 en mm (Y vers le bas). Rouge = découpe, bleu = perçage, vert = gravure."""
    s = layout.size
    f = lambda pts: " ".join(f"{x:.3f},{s - y:.3f}" for x, y in pts)  # noqa: E731
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{s}mm" height="{s}mm" viewBox="0 0 {s} {s}">',
           '<title>Planche DeeKra 50 x 50 - CNC</title>',
           f'<g id="DECOUPE" fill="none" stroke="#e00000" stroke-width="0.3"><polygon points="{f(layout.outline[:-1])}"/></g>',
           '<g id="PERCAGE" fill="none" stroke="#0040ff" stroke-width="0.15">']
    for label, x, y in layout.holes:
        out.append(f'<circle id="{label}" cx="{x:.3f}" cy="{s - y:.3f}" r="{p.drill_diameter_mm / 2}"/>')
    out.append('</g><g id="GRAVURE" fill="none" stroke="#008a3a" stroke-width="0.25" '
               'stroke-linecap="round" stroke-linejoin="round">')
    for pts in layout.engraving:
        out.append(f'<polyline points="{f(pts)}"/>')
    out.append("</g></svg>")
    path.write_text("\n".join(out) + "\n", encoding="utf-8")


def _header(title: str, tool: str, rpm: int, p: CncParams) -> list[str]:
    return [f"( Planche DeeKra 50x50 - {title} )",
            f"( Outil : {tool} )",
            f"( MDF {p.thickness_mm:g} mm - origine X0 Y0 coin bas-gauche de la planche finie, Z0 dessus )",
            "G21 G90 G17 G94",
            f"G0 Z{p.safe_z_mm:.3f}",
            f"M3 S{rpm}",
            "G4 P3"]


def _footer(p: CncParams) -> list[str]:
    return [f"G0 Z{p.safe_z_mm:.3f}", "M5", "G0 X0 Y0", "M30"]


def gcode_drill(layout: FabricationLayout, p: CncParams) -> str:
    """Perçage en débourrage explicite (GRBL ne gère pas G83). Ordre : A1 -> D60."""
    g = _header("PERCAGE 240 avant-trous", f"foret carbure {p.drill_diameter_mm} mm (queue 3,175 mm)", p.drill_rpm, p)
    for label, x, y in layout.holes:
        g.append(f"( {label} )")
        g.append(f"G0 X{x:.3f} Y{y:.3f}")
        g.append(f"G0 Z{p.hop_z_mm:.3f}")
        depth = 0.0
        while depth < p.drill_depth_mm - 1e-9:
            depth = min(depth + p.drill_peck_mm, p.drill_depth_mm)
            g.append(f"G1 Z{-depth:.3f} F{p.drill_feed:.0f}")
            g.append("G0 Z0.500")
            if depth < p.drill_depth_mm:
                g.append(f"G0 Z{-depth + 0.5:.3f}")
        g.append(f"G0 Z{p.hop_z_mm:.3f}")
    g += _footer(p)
    return "\n".join(g) + "\n"


def gcode_engrave(layout: FabricationLayout, p: CncParams) -> str:
    g = _header("GRAVURE reperes (optionnelle)", "fraise a graver en V 60 degres", p.engrave_rpm, p)
    for pts in layout.engraving:
        x0, y0 = pts[0]
        g.append(f"G0 X{x0:.3f} Y{y0:.3f}")
        g.append(f"G0 Z{p.hop_z_mm:.3f}")
        g.append(f"G1 Z{-p.engrave_depth_mm:.3f} F{p.engrave_plunge:.0f}")
        for i, (x, y) in enumerate(pts[1:]):
            g.append(f"G1 X{x:.3f} Y{y:.3f}" + (f" F{p.engrave_feed:.0f}" if i == 0 else ""))
        g.append(f"G0 Z{p.hop_z_mm:.3f}")
    g += _footer(p)
    return "\n".join(g) + "\n"


def cut_path(layout: FabricationLayout, p: CncParams) -> list[Point]:
    """Contour décalé du rayon de fraise vers l'extérieur, sens horaire (fraisage en opposition).

    Coins arrondis au rayon de la fraise : la planche garde des angles vifs.
    """
    r = p.endmill_diameter_mm / 2
    s = layout.size
    pts: list[Point] = []
    # arcs extérieurs autour des coins ; les côtés droits les relient (départ en haut du côté gauche)
    corners = [((0, s), math.pi, math.pi / 2), ((s, s), math.pi / 2, 0.0),
               ((s, 0), 0.0, -math.pi / 2), ((0, 0), -math.pi / 2, -math.pi)]
    for (cx, cy), a0, a1 in corners:
        for k in range(9):
            a = a0 + (a1 - a0) * k / 8
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    pts.append(pts[0])
    return pts


def _tab_intervals(s: float, p: CncParams) -> list[tuple[float, float]]:
    """Positions des attaches le long de chaque côté (2 par côté, à 1/4 et 3/4)."""
    h = p.tab_length_mm / 2
    return [(s * f - h, s * f + h) for f in (0.25, 0.75)]


def gcode_cut(layout: FabricationLayout, p: CncParams) -> str:
    g = _header("DECOUPE contour 500 x 500 avec attaches",
                f"fraise carbure {p.endmill_diameter_mm} mm 2 dents (descendante si planche imprimee)", p.cut_rpm, p)
    path = cut_path(layout, p)
    s = layout.size
    tabs = _tab_intervals(s, p)
    total = p.thickness_mm + p.cut_overcut_mm
    n = math.ceil(total / p.cut_depth_per_pass_mm)
    tab_z = -(p.thickness_mm - p.tab_height_mm)

    def in_tab(x: float, y: float) -> bool:
        on_v = abs(x + p.endmill_diameter_mm / 2) < 0.01 or abs(x - s - p.endmill_diameter_mm / 2) < 0.01
        on_h = abs(y + p.endmill_diameter_mm / 2) < 0.01 or abs(y - s - p.endmill_diameter_mm / 2) < 0.01
        coord = y if on_v else x if on_h else None
        return coord is not None and any(a <= coord <= b for a, b in tabs)

    # densifier les côtés droits pour placer les attaches
    dense: list[Point] = [path[0]]
    for (x0, y0), (x1, y1) in zip(path, path[1:]):
        cuts = sorted({0.0, 1.0} | {t for t in _split_params(x0, y0, x1, y1, tabs, s, p)})
        for t in cuts[1:]:
            dense.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))

    g.append(f"G0 X{dense[0][0]:.3f} Y{dense[0][1]:.3f}")
    for k in range(1, n + 1):
        z = -min(k * p.cut_depth_per_pass_mm, total)
        g.append(f"( passe {k}/{n} Z{z:.2f} )")
        g.append(f"G1 Z{z:.3f} F{p.cut_plunge:.0f}")
        first = True
        prev_tab = False
        for (xa, ya), (xb, yb) in zip(dense, dense[1:]):
            mx, my = (xa + xb) / 2, (ya + yb) / 2
            tab = z < tab_z and in_tab(mx, my)
            if tab and not prev_tab:
                g.append(f"G1 Z{tab_z:.3f} F{p.cut_plunge:.0f}")
            if not tab and prev_tab:
                g.append(f"G1 Z{z:.3f} F{p.cut_plunge:.0f}")
            g.append(f"G1 X{xb:.3f} Y{yb:.3f}" + (f" F{p.cut_feed:.0f}" if first else ""))
            first = False
            prev_tab = tab
        if prev_tab:
            g.append(f"G1 Z{z:.3f} F{p.cut_plunge:.0f}")
    g += _footer(p)
    return "\n".join(g) + "\n"


def _split_params(x0, y0, x1, y1, tabs, s, p) -> list[float]:
    """Paramètres t (0..1) où un segment droit entre ou sort d'une attache."""
    out = []
    if abs(x1 - x0) < 1e-9 and abs(y1 - y0) > 1:      # côté vertical
        for a, b in tabs:
            for v in (a, b):
                t = (v - y0) / (y1 - y0)
                if 0 < t < 1:
                    out.append(t)
    elif abs(y1 - y0) < 1e-9 and abs(x1 - x0) > 1:    # côté horizontal
        for a, b in tabs:
            for v in (a, b):
                t = (v - x0) / (x1 - x0)
                if 0 < t < 1:
                    out.append(t)
    return out


def write_csv(layout: FabricationLayout, path: Path) -> None:
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["repere", "x_mm", "y_mm"])
        for label, x, y in layout.holes:
            w.writerow([label, f"{x:.3f}", f"{y:.3f}"])


def write_all(out_dir: Path, geo: BoardGeometry | None = None, p: CncParams | None = None) -> dict[str, Path]:
    geo = geo or BoardGeometry.load()
    p = p or CncParams()
    out_dir.mkdir(parents=True, exist_ok=True)
    layout = build_layout(geo, p)
    files = {
        "dxf": out_dir / "planche-50x50-cnc.dxf",
        "svg": out_dir / "planche-50x50-cnc.svg",
        "drill": out_dir / "1-percage-240-clous.nc",
        "engrave": out_dir / "2-gravure-reperes-optionnelle.nc",
        "cut": out_dir / "3-decoupe-contour.nc",
        "csv": out_dir / "clous-positions-cnc.csv",
    }
    write_dxf(layout, p, files["dxf"])
    write_svg(layout, p, files["svg"])
    files["drill"].write_text(gcode_drill(layout, p), encoding="ascii")
    files["engrave"].write_text(gcode_engrave(layout, p), encoding="ascii")
    files["cut"].write_text(gcode_cut(layout, p), encoding="ascii")
    write_csv(layout, files["csv"])
    return files


def main() -> None:
    ap = argparse.ArgumentParser(description="Fichiers CNC de la planche (DXF, SVG, G-code GRBL)")
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--board", default=None, help="identifiant de planche (défaut : planche standard)")
    ap.add_argument("--thickness", type=float, default=CncParams.thickness_mm)
    args = ap.parse_args()
    geo = BoardGeometry.load(args.board) if args.board else BoardGeometry.load()
    files = write_all(args.out, geo, CncParams(thickness_mm=args.thickness))
    for f in files.values():
        print(f)


if __name__ == "__main__":
    main()

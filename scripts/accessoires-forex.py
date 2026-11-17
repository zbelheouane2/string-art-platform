"""Accessoires du kit à découper (Forex, MDF ou carton, plusieurs épaisseurs), assemblés sans colle.

Pièces reprises de la photo « Préparez le kit » :
- Support de téléphone : une plaque + une patte arrière à encoche (mi-bois incliné à 70°).
- Dévidoir : 2 crochets en L clipsés sur le bord haut de la planche (fourche de 17,2 mm),
  2 traverses, 1 axe de bobine (bobine couchée), 1 barre-guide percée pour le fil.

Toutes les encoches ont des « dogbones » (petits dégagements ronds) pour qu'une fraise
de 3,175 mm donne des fonds d'encoche vraiment carrés.

Sorties (mm) : un jeu de pièces (DXF, SVG, PDF 1:1, G-code GRBL pour une CNC hobby) et
l'imbrication sur une plaque de 1220 x 2440 mm (DXF, SVG, PDF).

Usage : python scripts/accessoires-forex.py DOSSIER [--material forex-5mm]
Le PDF est produit ensuite par `node scripts/accessoires-forex-pdf.cjs DOSSIER`.
Dépendance : shapely >= 2.
"""

from __future__ import annotations

import argparse
import math
from dataclasses import dataclass
from pathlib import Path

from shapely import affinity
from shapely.geometry import Point, Polygon, box
from shapely.geometry.polygon import orient
from shapely.ops import unary_union


# --------------------------------------------------------------------------
# Paramètres
# --------------------------------------------------------------------------
@dataclass(frozen=True)
class Params:
    material: str = "forex-5mm"
    label: str = "Forex 5 mm"
    thickness: float = 5.0
    slot: float = 5.2               # largeur des encoches (épaisseur + jeu)
    router: bool = True             # découpe à la fraise (dogbones + G-code) ; sinon laser / lame
    easel: bool = True              # le chevalet est-il assez solide dans cette matière ?
    tool_d: float = 3.175           # fraise 1/8"
    board_thickness: float = 17.0   # planche MDF du portrait
    spacing: float = 8.0            # écart entre pièces sur la plaque
    sheet_w: float = 2440.0
    sheet_h: float = 1220.0
    sheet_margin: float = 10.0
    # G-code (Forex ; valeurs prudentes, aussi valables en MDF)
    rpm: int = 18000
    feed: float = 1500.0
    plunge: float = 400.0
    pass_depth: float = 2.6
    overcut: float = 0.2
    tab_len: float = 6.0
    tab_height: float = 1.5
    safe_z: float = 5.0

    @property
    def dog_r(self) -> float:
        return self.tool_d / 2 + 0.1

    @property
    def wide(self) -> float:
        """Largeur minimale d'une partie encochée : 3 fois l'encoche, au moins 20 mm."""
        return max(20.0, 3 * self.slot)


# Matières proposées. Jeu des encoches : Forex +0,2 mm (se déforme peu), MDF +0,15 mm,
# carton -0,4 mm (il s'écrase, l'emboîtement doit serrer). Le chevalet porte une planche
# de 3,3 kg : refusé en 3 mm et en carton (trop souple, il se couche ou se voile).
MATERIALS = [
    Params("forex-3mm", "Forex 3 mm", 3.0, 3.2, True, False, pass_depth=1.7),
    Params("forex-5mm", "Forex 5 mm", 5.0, 5.2, True, True),
    Params("forex-10mm", "Forex 10 mm", 10.0, 10.3, True, True, pass_depth=3.5),
    Params("mdf-3mm", "MDF 3 mm", 3.0, 3.15, True, False, feed=1200, pass_depth=1.6, rpm=16000),
    Params("mdf-5mm", "MDF 5 mm", 5.0, 5.15, True, True, feed=1200, pass_depth=2.0, rpm=16000),
    Params("carton-7mm", "Carton double cannelure 7 mm", 7.0, 6.6, False, False),
]


# --------------------------------------------------------------------------
# Outils géométriques
# --------------------------------------------------------------------------
def dogbone(p: Params, corner: tuple[float, float], away: tuple[float, float]) -> Polygon:
    """Dégagement rond dans un angle d'encoche ; `away` pointe hors de l'encoche.

    Le cercle (rayon fraise + 0,1 mm) est centré dans l'encoche, à un rayon de fraise du
    coin : la fraise peut y descendre et son bord atteint exactement le coin.
    """
    if not p.router:
        return Polygon()
    k = p.dog_r / math.sqrt(2)
    return Point(corner[0] - away[0] * k, corner[1] - away[1] * k).buffer(p.dog_r, 32)


def edge_slot(p: Params, cx: float, z_edge: float, depth: float, from_top: bool) -> Polygon:
    """Encoche ouverte de largeur `slot`, verticale, depuis le bord bas (z_edge) ou haut."""
    w = p.slot / 2
    if from_top:
        rect = box(cx - w, z_edge - depth, cx + w, z_edge + 50)
        bottom = z_edge - depth
        dogs = [dogbone(p, (cx - w, bottom), (-1, -1)), dogbone(p, (cx + w, bottom), (1, -1))]
    else:
        rect = box(cx - w, z_edge - 50, cx + w, z_edge + depth)
        top = z_edge + depth
        dogs = [dogbone(p, (cx - w, top), (-1, 1)), dogbone(p, (cx + w, top), (1, 1))]
    return unary_union([rect, *dogs])


def mortise(p: Params, cx: float, cy: float, length: float, horizontal: bool) -> Polygon:
    """Mortaise rectangulaire (trou) avec dogbones aux 4 coins."""
    a, b = (length / 2, p.slot / 2) if horizontal else (p.slot / 2, length / 2)
    rect = box(cx - a, cy - b, cx + a, cy + b)
    dogs = [dogbone(p, (cx + sx * a, cy + sy * b), (sx, sy)) for sx in (-1, 1) for sy in (-1, 1)]
    return unary_union([rect, *dogs])


@dataclass
class Piece:
    name: str
    shape: Polygon      # coordonnées en mm, Y vers le haut
    group: str
    pose: "Pose | None" = None


# --------------------------------------------------------------------------
# Pose 3D (pour l'aperçu monté) : point 3D = o + a·e1 + b·e2, épaisseur selon n (centrée)
# --------------------------------------------------------------------------
@dataclass
class Pose:
    o: tuple[float, float, float]
    e1: tuple[float, float, float]
    e2: tuple[float, float, float]
    n: tuple[float, float, float]


def generic_slot(p: Params, cx: float, z_edge: float, depth: float, width: float, from_top: bool) -> Polygon:
    """Encoche de largeur quelconque (fourche du crochet), avec dogbones au fond."""
    w = width / 2
    if from_top:
        rect, z = box(cx - w, z_edge - depth, cx + w, z_edge + 50), z_edge - depth
        dogs = [dogbone(p, (cx - w, z), (-1, -1)), dogbone(p, (cx + w, z), (1, -1))]
    else:
        rect, z = box(cx - w, z_edge - 50, cx + w, z_edge + depth), z_edge + depth
        dogs = [dogbone(p, (cx - w, z), (-1, 1)), dogbone(p, (cx + w, z), (1, 1))]
    return unary_union([rect, *dogs])


# --------------------------------------------------------------------------
# Support de téléphone (photo « Préparez le kit ») : plaque + patte arrière à encoche
# --------------------------------------------------------------------------
PHONE_ANGLE = 70.0      # inclinaison de la plaque
PLATE_W, PLATE_H = 75.0, 140.0


def phone_stand(p: Params) -> list[Piece]:
    a = math.radians(PHONE_ANGLE)
    u = (math.cos(a), math.sin(a))            # le long de la plaque, vers le haut et l'arrière
    n = (math.sin(a), -math.cos(a))           # épaisseur de la plaque, vers l'arrière
    f0 = (30.0, p.thickness * math.cos(a))    # pied de la face avant : le coin arrière touche la table
    H = 35.0                                  # hauteur de la patte au droit de la plaque
    at = lambda s, c: (f0[0] + s * u[0] + c * n[0], f0[1] + s * u[1] + c * n[1])  # noqa: E731
    s12, sH = 12 / u[1], H / u[1]
    leg = Polygon([(12, 0), (110, 0), (110, 8), (at(sH, 0)[0] + 20, H), at(sH, 0), at(s12, 0),
                   (20, 12), (20, 22), (12, 22)])
    s0 = sH / 2                               # mi-bois : moitié de la hauteur, le long de la plaque
    strip = Polygon([at(s0, -1), at(s0 + 80, -1), at(s0 + 80, p.slot), at(s0, p.slot)])
    dog = Polygon()
    if p.router:
        k = p.tool_d / 2 / math.sqrt(2)
        c = at(s0 + k * 1, p.slot - k * 1)
        c = (c[0], c[1])
        dog = Point(c).buffer(p.dog_r, 32)
    leg = leg.difference(unary_union([strip, dog]))

    lift = 0.0                                # le bord bas de la plaque repose sur la table
    plate = unary_union([box(-PLATE_W / 2, 0, PLATE_W / 2, PLATE_H).buffer(-8).buffer(8, 16),
                         box(-PLATE_W / 2, 0, PLATE_W / 2, 20)])   # coins bas vifs : appui stable
    plate = plate.difference(edge_slot(p, 0, 0, s0 - lift, from_top=False))

    T = p.thickness
    leg_pose = Pose((-T / 2, 0, 0), (0, 1, 0), (0, 0, 1), (1, 0, 0))
    base = at(lift, 0)
    plate_pose = Pose((0, base[0], base[1]), (1, 0, 0), (0, u[0], u[1]), (0, n[0], n[1]))
    g = "Support de téléphone"
    return [Piece("Téléphone · plaque", plate, g, plate_pose), Piece("Téléphone · patte", leg, g, leg_pose)]


# --------------------------------------------------------------------------
# Dévidoir (photo « Préparez le kit ») : 2 crochets en L + 4 barres (2 traverses,
# 1 axe de bobine, 1 barre-guide percée). Les crochets se clipsent sur le bord
# haut de la planche MDF : fourche à peine plus large que la planche (serrage).
# --------------------------------------------------------------------------
SPOOL_SPAN = 180.0      # écart intérieur entre les deux crochets (longueur de bobine maxi)
FORK_PLAY = 0.2         # jeu de la fourche sur la planche de 17 mm
ARM_Z0, ARM_H = 100.0, 25.0


def devidoir(p: Params) -> list[Piece]:
    T = p.thickness
    prong = max(10.0, 2 * T)
    gap = p.board_thickness + FORK_PLAY
    W = gap + 2 * prong                        # largeur du montant
    yc = W / 2                                 # axe de la planche
    z_top = ARM_Z0 + ARM_H
    hook = unary_union([
        box(0, -35, W, z_top),                                   # montant
        box(-60, ARM_Z0, 120, z_top),                            # bras
        Polygon([(0, ARM_Z0), (-30, ARM_Z0), (0, ARM_Z0 - 30)]),  # goussets
        Polygon([(W, ARM_Z0), (W + 30, ARM_Z0), (W, ARM_Z0 - 30)]),
    ])
    hook = hook.difference(generic_slot(p, yc, -35, 35, gap, from_top=False))   # fourche
    rails_y = (-50.0, 85.0)
    guide_y = 110.0
    for y in (*rails_y, guide_y):
        hook = hook.difference(edge_slot(p, y, ARM_Z0, ARM_H / 2, from_top=False))
    cradle = 10.0
    hook = hook.difference(edge_slot(p, yc, z_top, cradle, from_top=True))      # berceau de l'axe

    length = SPOOL_SPAN + 2 * T + 30
    xs = (-(SPOOL_SPAN + T) / 2, (SPOOL_SPAN + T) / 2)
    rail = box(-length / 2, 0, length / 2, ARM_H)
    for x in xs:
        rail = rail.difference(edge_slot(p, x, ARM_H, ARM_H / 2, from_top=True))
    guide = rail.difference(Point(0, ARM_H / 2).buffer(3.0, 32))               # œillet Ø 6
    axle_h, lock = 15.0, 3.0
    axle = box(-length / 2, 0, length / 2, axle_h)
    for x in xs:
        axle = axle.difference(edge_slot(p, x, 0, lock, from_top=False))

    g = "Dévidoir"
    hook_poses = [Pose((x - T / 2, 0, 0), (0, 1, 0), (0, 0, 1), (1, 0, 0)) for x in xs]
    bar_pose = lambda y, z: Pose((0, y - T / 2, z), (1, 0, 0), (0, 0, 1), (0, 1, 0))  # noqa: E731
    axle_z = z_top - cradle - lock
    return [Piece("Dévidoir · crochet", hook, g, hook_poses[0]), Piece("Dévidoir · crochet", hook, g, hook_poses[1]),
            Piece("Dévidoir · traverse", rail, g, bar_pose(rails_y[0], ARM_Z0)),
            Piece("Dévidoir · traverse", rail, g, bar_pose(rails_y[1], ARM_Z0)),
            Piece("Dévidoir · barre-guide percée", guide, g, bar_pose(guide_y, ARM_Z0)),
            Piece("Dévidoir · axe de bobine", axle, g, bar_pose(yc, axle_z))]


def dogbone_at_angle(p: Params, poly: Polygon, v: tuple[float, float]) -> Polygon:
    """Dogbone sur un angle rentrant quelconque : centre sur la bissectrice, côté vide."""
    coords = list(poly.exterior.coords)[:-1]
    i = min(range(len(coords)), key=lambda k: math.dist(coords[k], v))
    prev, nxt = coords[i - 1], coords[(i + 1) % len(coords)]
    d1 = _unit((prev[0] - v[0], prev[1] - v[1]))
    d2 = _unit((nxt[0] - v[0], nxt[1] - v[1]))
    bis = _unit((d1[0] + d2[0], d1[1] + d2[1]))        # vers l'intérieur de l'angle vide
    if not p.router:
        return Polygon()
    k = p.tool_d / 2
    c = (v[0] + bis[0] * k, v[1] + bis[1] * k)
    return Point(c).buffer(p.dog_r, 32)


def _unit(v):
    n = math.hypot(*v)
    return (v[0] / n, v[1] / n)


def all_pieces(p: Params) -> list[Piece]:
    return phone_stand(p) + devidoir(p)


# --------------------------------------------------------------------------
# Imbrication
# --------------------------------------------------------------------------
def normalize(shape: Polygon) -> Polygon:
    minx, miny, _, _ = shape.bounds
    return affinity.translate(shape, -minx, -miny)


def pair_nest(shape: Polygon, gap: float) -> Polygon:
    """Deux exemplaires tête-bêche, rapprochés au plus près (pour les flancs)."""
    a = normalize(shape)
    b = normalize(affinity.rotate(a, 180, origin="centroid"))
    best = None
    w = a.bounds[2]
    for dy in range(0, int(a.bounds[3]) + 1, 2):
        # glisser b vers a horizontalement tant qu'il ne touche pas (à `gap` près)
        lo, hi = 0.0, w + gap
        for _ in range(30):
            mid = (lo + hi) / 2
            if affinity.translate(b, mid, dy).distance(a) < gap:
                lo = mid
            else:
                hi = mid
        cand = unary_union([a, affinity.translate(b, hi, dy)])
        area = (cand.bounds[2] - cand.bounds[0]) * (cand.bounds[3] - cand.bounds[1])
        if best is None or area < best[0]:
            best = (area, hi, dy)
    _, dx, dy = best
    return [a, affinity.translate(b, dx, dy)]


def kit_blocks(p: Params) -> list[tuple[str, list[tuple[str, Polygon]]]]:
    """Un jeu de pièces groupé en blocs rectangulaires (flancs appariés tête-bêche)."""
    pieces = all_pieces(p)
    by_name: dict[str, list[Piece]] = {}
    for pc in pieces:
        by_name.setdefault(pc.name, []).append(pc)
    blocks = []
    for name, items in by_name.items():
        if len(items) == 2 and "flanc" in name:
            a, b = pair_nest(items[0].shape, p.spacing)
            blocks.append((name, [(name, a), (name, b)]))
        else:
            for it in items:
                blocks.append((name, [(name, normalize(it.shape))]))
    return blocks


def shelf_pack(blocks, width: float, height: float, gap: float, margin: float):
    """Rangement par étagères (blocs triés par hauteur, rotation de 90° si plus bas)."""
    placed = []
    items = []
    for name, shapes in blocks:
        u = unary_union([s for _, s in shapes])
        w, h = u.bounds[2] - u.bounds[0], u.bounds[3] - u.bounds[1]
        rot = h > w
        if rot:
            shapes = [(n, affinity.rotate(s, 90, origin=(0, 0))) for n, s in shapes]
            u = unary_union([s for _, s in shapes])
        shapes = [(n, affinity.translate(s, -u.bounds[0], -u.bounds[1])) for n, s in shapes]
        u = unary_union([s for _, s in shapes])
        items.append((u.bounds[3], u.bounds[2], shapes))
    items.sort(key=lambda it: -it[0])
    x, y, shelf_h = margin, margin, 0.0
    for h, w, shapes in items:
        if x + w > width - margin:
            x, y, shelf_h = margin, y + shelf_h + gap, 0.0
        if y + h > height - margin:
            return placed, False
        placed += [(n, affinity.translate(s, x, y)) for n, s in shapes]
        x += w + gap
        shelf_h = max(shelf_h, h)
    return placed, True


def nest_sheet(p: Params):
    """Nombre maximal de jeux complets sur la plaque."""
    best = ([], 0)
    for n in range(1, 60):
        blocks = kit_blocks(p) * n
        placed, ok = shelf_pack(blocks, p.sheet_w, p.sheet_h, p.spacing, p.sheet_margin)
        if not ok:
            break
        best = (placed, n)
    return best


# --------------------------------------------------------------------------
# Exports
# --------------------------------------------------------------------------
def rings(shape: Polygon):
    yield list(shape.exterior.coords)
    for r in shape.interiors:
        yield list(r.coords)


def write_dxf(placed, path: Path, extents) -> None:
    L: list[str] = []

    def add(*pairs):
        for c, v in pairs:
            L.extend([str(c), str(v)])

    add((0, "SECTION"), (2, "HEADER"), (9, "$ACADVER"), (1, "AC1009"), (9, "$INSUNITS"), (70, 4),
        (9, "$EXTMIN"), (10, 0), (20, 0), (9, "$EXTMAX"), (10, extents[0]), (20, extents[1]), (0, "ENDSEC"))
    add((0, "SECTION"), (2, "TABLES"), (0, "TABLE"), (2, "LAYER"), (70, 3))
    for name, col in (("DECOUPE_EXTERIEURE", 1), ("DECOUPE_INTERIEURE", 5), ("PLAQUE", 8)):
        add((0, "LAYER"), (2, name), (70, 0), (62, col), (6, "CONTINUOUS"))
    add((0, "ENDTAB"), (0, "ENDSEC"), (0, "SECTION"), (2, "ENTITIES"))

    def poly(pts, layer):
        add((0, "POLYLINE"), (8, layer), (66, 1), (70, 1))
        for x, y in pts[:-1]:
            add((0, "VERTEX"), (8, layer), (10, f"{x:.4f}"), (20, f"{y:.4f}"))
        add((0, "SEQEND"), (8, layer))

    poly([(0, 0), (extents[0], 0), (extents[0], extents[1]), (0, extents[1]), (0, 0)], "PLAQUE")
    for _, s in placed:
        for k, ring in enumerate(rings(s)):
            poly(ring, "DECOUPE_EXTERIEURE" if k == 0 else "DECOUPE_INTERIEURE")
    add((0, "ENDSEC"), (0, "EOF"))
    path.write_text("\n".join(L) + "\n", encoding="ascii")


def write_svg(placed, path: Path, extents, title: str, labels: bool = True) -> None:
    W, H = extents
    f = lambda ring: " ".join(f"{x:.3f},{H - y:.3f}" for x, y in ring)  # noqa: E731
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">',
         f"<title>{title}</title>", '<rect width="100%" height="100%" fill="#ffffff"/>',
         f'<rect x="0" y="0" width="{W}" height="{H}" fill="none" stroke="#999" stroke-width="0.5"/>',
         '<g id="DECOUPE" fill="#f1ede6" stroke="#d40000" stroke-width="0.35" fill-rule="evenodd">']
    for _, s in placed:
        d = " ".join(f"M{f(r)} Z" for r in rings(s))
        o.append(f'<path d="{d}"/>')
    o.append("</g>")
    if labels:
        o.append('<g id="ETIQUETTES" font-family="DejaVu Sans, Arial, sans-serif" fill="#555" text-anchor="middle">')
        for name, s in placed:
            c = s.representative_point()
            size = max(3.0, min(8.0, math.sqrt(s.area) / 9))
            o.append(f'<text x="{c.x:.1f}" y="{H - c.y:.1f}" font-size="{size:.1f}" dominant-baseline="central">'
                     f"{name.split(' · ')[-1]}</text>")
        o.append("</g>")
    o.append("</svg>")
    path.write_text("\n".join(o) + "\n", encoding="utf-8")


def _path_with_tabs(ring, n_tabs: int, tab_len: float):
    """Segmente un contour fermé et marque les portions d'attache."""
    pts = ring[:]
    seglen = [math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    total = sum(seglen)
    centers = [total * (k + 0.5) / n_tabs for k in range(n_tabs)]
    spans = [(c - tab_len / 2, c + tab_len / 2) for c in centers]
    out = [(pts[0], False)]
    acc = 0.0
    for i, L in enumerate(seglen):
        a, b = pts[i], pts[i + 1]
        cuts = sorted({0.0, 1.0} | {(e - acc) / L for s in spans for e in s if 0 < (e - acc) / L < 1})
        for t0, t1 in zip(cuts, cuts[1:]):
            mid = acc + (t0 + t1) / 2 * L
            q = (a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1)
            out.append((q, any(s0 <= mid <= s1 for s0, s1 in spans)))
        acc += L
    return out


def gcode(placed, p: Params) -> str:
    r = p.tool_d / 2
    total = p.thickness + p.overcut
    n = math.ceil(total / p.pass_depth)
    depths = [-min(total, (k + 1) * total / n) for k in range(n)]
    tab_z = -(p.thickness - p.tab_height)
    g = ["( DeeKra - accessoires du kit : support telephone, support bobine, chevalet )",
         f"( {p.label} - encoches {p.slot} mm - fraise {p.tool_d} mm {'1 dent' if 'forex' in p.material else '2 dents'} )",
         "( Origine X0 Y0 coin bas-gauche de la plaque, Z0 dessus de la plaque )",
         "( Ordre : trous et mortaises d'abord, puis contours avec attaches )",
         "G21 G90 G17 G94", f"G0 Z{p.safe_z}", f"M3 S{p.rpm}", "G4 P3"]

    def run(ring_pts, tabs: int):
        path = _path_with_tabs(ring_pts, tabs, p.tab_len + p.tool_d) if tabs else [(q, False) for q in ring_pts]
        (x0, y0), _ = path[0]
        g.append(f"G0 X{x0:.3f} Y{y0:.3f}")
        g.append("G0 Z1.000")
        for z in depths:
            g.append(f"G1 Z{z:.3f} F{p.plunge:.0f}")
            first, prev = True, False
            for (x, y), tab in path[1:]:
                lift = tab and z < tab_z
                if lift and not prev:
                    g.append(f"G1 Z{tab_z:.3f}")
                elif not lift and prev:
                    g.append(f"G1 Z{z:.3f} F{p.plunge:.0f}")
                g.append(f"G1 X{x:.3f} Y{y:.3f}" + (f" F{p.feed:.0f}" if first or (prev and not lift) else ""))
                first, prev = False, lift
            if prev:
                g.append(f"G1 Z{z:.3f} F{p.plunge:.0f}")
        g.append(f"G0 Z{p.safe_z}")

    # 1. intérieurs (trous, mortaises) : outil décalé vers l'intérieur, sens trigonométrique
    for _, s in placed:
        for hole in s.interiors:
            inner = Polygon(hole).buffer(-r, 16, join_style="round")
            if inner.is_empty:
                continue
            for poly in getattr(inner, "geoms", [inner]):
                run(list(orient(poly, 1).exterior.coords), 0)
    # 2. contours extérieurs : décalés vers l'extérieur, sens horaire (opposition), avec attaches
    for _, s in placed:
        outer = Polygon(s.exterior).buffer(r, 16, join_style="round")
        ring = list(orient(outer, -1).exterior.coords)
        tabs = 4 if outer.length > 400 else 2
        run(ring, tabs)
    g += [f"G0 Z{p.safe_z}", "M5", "G0 X0 Y0", "M30"]
    return "\n".join(g) + "\n"


def write_all(out: Path, p: Params) -> dict:
    out = out / p.material
    out.mkdir(parents=True, exist_ok=True)
    # Un jeu : rangé sur une largeur de 600 mm (CNC hobby 6090)
    one, ok = shelf_pack(kit_blocks(p), 600, 900, p.spacing + 4, 10)
    assert ok
    u = unary_union([s for _, s in one])
    ext1 = (600.0, math.ceil(u.bounds[3] + 10))
    write_dxf(one, out / "accessoires-1-jeu.dxf", ext1)
    write_svg(one, out / "accessoires-1-jeu.svg", ext1, f"Accessoires DeeKra - {p.label} - 1 jeu")
    if p.router:
        (out / "accessoires-1-jeu.nc").write_text(gcode(one, p), encoding="ascii")
    sheet, n = nest_sheet(p)
    ext = (p.sheet_w, p.sheet_h)
    write_dxf(sheet, out / f"accessoires-plaque-122x244-{n}-jeux.dxf", ext)
    write_svg(sheet, out / f"accessoires-plaque-122x244-{n}-jeux.svg", ext,
              f"Accessoires DeeKra - {p.label} - plaque 122 x 244 - {n} jeux")
    return {"matiere": p.label, "chevalet": p.easel, "jeux_par_plaque": n, "un_jeu_mm": ext1}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("out", type=Path)
    ap.add_argument("--material", default=None, help="une seule matière (ex. forex-5mm)")
    a = ap.parse_args()
    for p in MATERIALS:
        if a.material in (None, p.material):
            print(write_all(a.out, p))


if __name__ == "__main__":
    main()

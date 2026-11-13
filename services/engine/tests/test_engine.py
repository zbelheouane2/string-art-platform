import math

import numpy as np
import pytest
from PIL import Image

from stringart import imaging, instructions, pipeline, render
from stringart.geometry import BoardGeometry
from stringart.lines import LineCache, segment_pixels
from stringart.solver import SolverParams, solve


@pytest.fixture(scope="module")
def geo():
    return BoardGeometry.load()


@pytest.fixture(scope="module")
def cache(geo):
    return LineCache(geo, 160)


def _portrait(size=600):
    """Image synthétique : disque sombre (« visage ») sur fond clair + dégradé."""
    yy, xx = np.mgrid[:size, :size]
    img = np.full((size, size), 220, np.float32)
    img -= 60 * (yy / size)
    img[(xx - size * 0.5) ** 2 + (yy - size * 0.45) ** 2 < (size * 0.22) ** 2] = 40
    rgb = np.repeat(img.clip(0, 255).astype(np.uint8)[..., None], 3, axis=2)
    return Image.fromarray(rgb)


# --- géométrie -------------------------------------------------------------

def test_board_has_240_nails_in_4_sectors(geo):
    assert geo.nail_count == 240 and geo.nails_per_sector == 60
    assert geo.sectors == ("A", "B", "C", "D")


@pytest.mark.parametrize("index,label", [(0, "A1"), (59, "A60"), (60, "B1"), (119, "B60"), (120, "C1"), (239, "D60")])
def test_labels(geo, index, label):
    assert geo.label(index) == label
    assert geo.index(label) == index


def test_label_roundtrip_all(geo):
    assert all(geo.index(geo.label(i)) == i for i in range(geo.nail_count))


@pytest.mark.parametrize("bad", ["E1", "A0", "A61", "B99"])
def test_invalid_labels(geo, bad):
    with pytest.raises(ValueError):
        geo.index(bad)


def test_positions_on_circle_and_clockwise_from_9_oclock(geo):
    pos = geo.positions_mm()
    c, r = geo.board_size_mm / 2, geo.circle_diameter_mm / 2
    assert np.allclose(np.hypot(pos[:, 0] - c, pos[:, 1] - c), r)
    # A1 près de 9 h (gauche), A60/B1 de part et d'autre de 12 h (haut), C1 juste après 3 h.
    assert pos[0, 0] < c - 0.99 * r and pos[0, 1] < c
    assert pos[59, 0] < c < pos[60, 0] and pos[59, 1] < c - 0.99 * r
    assert pos[120, 0] > c + 0.99 * r and pos[120, 1] > c


def test_nail_spacing(geo):
    pos = geo.positions_mm()
    spacing = np.hypot(*(pos[1] - pos[0]))
    assert spacing == pytest.approx(math.pi * geo.circle_diameter_mm / geo.nail_count, rel=1e-3)


def test_chord(geo):
    assert geo.chord_mm(0, 120) == pytest.approx(geo.circle_diameter_mm)
    assert geo.chord_mm(5, 5) == 0


def test_circular_distance(geo):
    assert geo.circular_distance(0, 239) == 1
    assert geo.circular_distance(10, 130) == 120


# --- segments ---------------------------------------------------------------

def test_segment_pixels_are_unique_and_in_bounds():
    px = segment_pixels(np.array([0.0, 0.0]), np.array([99.0, 49.0]), 100)
    assert len(px) == len(np.unique(px))
    assert px.min() >= 0 and px.max() < 100 * 100


def test_line_cache_fans(geo, cache):
    fan = cache.fans[0]
    assert len(fan.others) == geo.nail_count - 1 and 0 not in fan.others
    assert fan.lengths.sum() == len(fan.pixels)


# --- prétraitement ------------------------------------------------------------

def test_prepare_outputs(tmp_path):
    p = tmp_path / "p.png"
    _portrait().save(p)
    prepared = imaging.prepare(p, imaging.PreprocessParams(resolution=160))
    t = prepared.target
    assert t.shape == (160, 160) and t.dtype == np.float32
    assert 0 <= t.min() and t.max() <= 1
    assert t[~prepared.mask].max() == 0
    assert len(prepared.source_sha256) == 64


def test_crop_is_clamped_inside_image():
    img = Image.new("RGB", (648, 621), (255, 255, 255))
    out = imaging.center_square(img, (150, 0, 540))
    assert out.size == (540, 540)
    assert np.asarray(out).min() == 255  # aucune bande noire ajoutée


def test_rejects_small_image(tmp_path):
    p = tmp_path / "small.png"
    Image.new("RGB", (100, 100)).save(p)
    with pytest.raises(ValueError):
        imaging.load_image(p)


def test_quality_warnings_on_dark_photo():
    dark = Image.new("RGB", (600, 600), (10, 10, 10))
    prepared = imaging.prepare_pil(dark, imaging.PreprocessParams(resolution=120))
    assert "photo_trop_sombre" in prepared.quality["warnings"]


# --- solveur -------------------------------------------------------------------

def _solve(geo, cache, **kw):
    prepared = imaging.prepare_pil(_portrait(), imaging.PreprocessParams(resolution=160))
    return solve(prepared.target, prepared.importance, cache, SolverParams(**kw))


def test_solver_respects_constraints(geo, cache):
    params = dict(max_lines=400, min_gap=20)
    res = _solve(geo, cache, **params)
    seq = res.sequence
    assert seq[0] == 0 and 1 < len(seq) <= 401
    pairs = set()
    for a, b in zip(seq[:-1], seq[1:]):
        assert geo.circular_distance(a, b) >= 20
        pair = (min(a, b), max(a, b))
        assert pair not in pairs, "segment répété"
        pairs.add(pair)


def test_solver_is_deterministic(geo, cache):
    assert _solve(geo, cache, max_lines=200).sequence == _solve(geo, cache, max_lines=200).sequence


def test_solver_draws_more_in_dark_area(geo, cache):
    seq = _solve(geo, cache, max_lines=300).sequence
    density = render.thread_density(geo, seq, 160)
    yy, xx = np.mgrid[:160, :160]
    face = (xx - 80) ** 2 + (yy - 72) ** 2 < 25**2
    background = ((xx - 80) ** 2 + (yy - 80) ** 2 > 60**2) & ((xx - 80) ** 2 + (yy - 80) ** 2 < 75**2)
    assert density[face].mean() > 2 * density[background].mean()


# --- instructions -----------------------------------------------------------------

def test_thread_length(geo):
    seq = [0, 120, 0]
    expected = 2 * geo.circle_diameter_mm + math.pi * geo.nail_diameter_mm / 2
    assert instructions.thread_length_mm(geo, seq) == pytest.approx(expected)


def test_document_is_consistent(geo):
    out = pipeline.generate(
        _portrait(),
        preprocess=imaging.PreprocessParams(resolution=160),
        solver_params=SolverParams(max_lines=150),
        render_resolution=300,
    )
    doc = out.document
    assert doc["engine_version"] == instructions.ENGINE_VERSION
    assert doc["summary"]["lines"] == len(doc["steps"]) == len(doc["sequence"]) - 1
    assert doc["steps"][0]["from"] == "A1"
    for step, (a, b) in zip(doc["steps"], zip(doc["sequence"][:-1], doc["sequence"][1:])):
        assert geo.index(step["from"]) == a and geo.index(step["to"]) == b
    assert out.preview.size == (300, 300)


# --- visage, cadrage automatique, fond (phase 1b) ---------------------------------

from stringart import faces  # noqa: E402


@pytest.fixture(scope="module")
def astronaut():
    data = pytest.importorskip("skimage.data")
    return Image.fromarray(data.astronaut()).convert("RGB")


def test_face_detection_with_landmarks(astronaut):
    face = faces.detect_main_face(np.asarray(astronaut))
    assert face is not None
    cx, cy = face.center
    assert 180 < cx < 260 and 80 < cy < 160          # visage en haut au centre
    if face.landmarks:                                # YuNet : yeux au-dessus de la bouche
        (rex, rey), (lex, ley), _, (rmx, rmy), _ = face.landmarks
        assert rex < lex and max(rey, ley) < rmy


def test_auto_crop_frames_face():
    face = faces.Face(400, 300, 200, 240, 0.9)
    x, y, side = faces.auto_crop((1600, 1200), face, face_fraction=0.5)
    assert side == 480
    assert x == 500 - 240 and y == round(420 - 0.45 * 480)


def test_auto_crop_stays_inside_and_keeps_face_centered():
    face = faces.Face(500, 100, 150, 180, 0.9)       # visage près du bord droit
    x, y, side = faces.auto_crop((700, 600), face)
    assert 0 <= x and x + side <= 700 and 0 <= y and y + side <= 600
    cx = face.center[0]
    assert abs((cx - x) / side - 0.5) < 0.15


def test_no_face_falls_back_to_center_crop():
    img = _portrait()  # disque synthétique : aucun visage détecté
    prepared = imaging.prepare_pil(img, imaging.PreprocessParams(resolution=120))
    assert prepared.face is None and prepared.crop_box == (0, 0, 600)


def test_manual_crop_has_priority(astronaut):
    prepared = imaging.prepare_pil(astronaut, imaging.PreprocessParams(resolution=120), crop=(0, 0, 300))
    assert prepared.crop_box == (0, 0, 300)


def test_auto_crop_zooms_on_face(astronaut):
    prepared = imaging.prepare_pil(astronaut, imaging.PreprocessParams(resolution=200))
    x, y, side = prepared.crop_box
    assert side < 300                                  # recadré sur le visage
    assert prepared.face is not None
    assert prepared.face.h / 200 > 0.4                 # le visage occupe une bonne part du cercle


def test_background_light_keeps_face_darkness(astronaut):
    keep = imaging.prepare_pil(astronaut, imaging.PreprocessParams(resolution=200, background="keep"))
    light = imaging.prepare_pil(astronaut, imaging.PreprocessParams(resolution=200, background="light"))
    f = keep.face
    face_box = (slice(int(f.y + 0.2 * f.h), int(f.y + 0.8 * f.h)), slice(int(f.x + 0.2 * f.w), int(f.x + 0.8 * f.w)))
    assert np.allclose(keep.target[face_box], light.target[face_box], atol=0.05)
    assert light.target[keep.mask].sum() < keep.target[keep.mask].sum()


def test_light_penalty_reduces_threads_in_light_areas(geo, cache):
    prepared = imaging.prepare_pil(_portrait(), imaging.PreprocessParams(resolution=160))
    dens = {}
    for lp in (0.0, 0.3):
        seq = solve(prepared.target, prepared.importance, cache, SolverParams(max_lines=300, light_penalty=lp)).sequence
        dens[lp] = render.thread_density(geo, seq, 160)
    light = (prepared.target < 0.2) & prepared.mask
    assert dens[0.3][light].mean() < dens[0.0][light].mean()


def test_document_records_crop_and_face(astronaut):
    out = pipeline.generate(
        astronaut,
        preprocess=imaging.PreprocessParams(resolution=160),
        solver_params=SolverParams(max_lines=100),
        render_resolution=200,
    )
    doc = out.document
    assert len(doc["crop_box"]) == 3 and doc["face"] is not None
    assert all(0 <= v <= 1 for v in doc["face"]["box_rel"][2:])

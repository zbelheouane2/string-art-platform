"""Fichiers CNC : positions identiques au moteur, profondeurs et contour sûrs."""
import re

import pytest

from stringart.fabrication import CncParams, build_layout, gcode_cut, gcode_drill, write_all
from stringart.geometry import BoardGeometry


@pytest.fixture(scope="module")
def geo():
    return BoardGeometry.load()


def test_holes_match_engine_geometry(geo):
    layout = build_layout(geo, CncParams())
    mm = geo.positions_mm()
    assert len(layout.holes) == 240
    for i, (label, x, y) in enumerate(layout.holes):
        assert label == geo.label(i)
        assert x == pytest.approx(mm[i][0])
        assert y == pytest.approx(geo.board_size_mm - mm[i][1])  # Y machine vers le haut
    # A1 à 9 h, juste au-dessus du centre ; nails >= 14 mm du bord
    _, x, y = layout.holes[0]
    assert x < 20 and y > 250
    assert min(min(x, y, 500 - x, 500 - y) for _, x, y in layout.holes) > 14


def _z_values(code):
    return [float(z) for z in re.findall(r"Z(-?[\d.]+)", code)]


def test_drill_gcode_is_blind_and_complete(geo):
    p = CncParams()
    code = gcode_drill(build_layout(geo, p), p)
    assert min(_z_values(code)) == pytest.approx(-p.drill_depth_mm)
    assert code.count("Z-10.000") == 240
    assert p.drill_depth_mm < p.thickness_mm


def test_cut_goes_through_with_tabs(geo):
    p = CncParams(thickness_mm=17)
    code = gcode_cut(build_layout(geo, p), p)
    assert min(_z_values(code)) == pytest.approx(-17.3)
    assert "Z-14.000" in code  # attaches de 3 mm
    xs = [float(v) for v in re.findall(r"X(-?[\d.]+)", code)]
    assert min(xs) == pytest.approx(-p.endmill_diameter_mm / 2, abs=1e-3)
    assert max(xs) == pytest.approx(500 + p.endmill_diameter_mm / 2, abs=1e-3)


def test_write_all(tmp_path, geo):
    files = write_all(tmp_path, geo)
    dxf = files["dxf"].read_text()
    assert dxf.count("\nCIRCLE\n") == 240
    assert files["svg"].read_text().count("<circle") == 240

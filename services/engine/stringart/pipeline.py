"""Orchestration : photo -> séquence -> rendu -> document d'instructions."""

from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass
from pathlib import Path

from PIL import Image

from . import imaging, instructions, render
from .geometry import BoardGeometry
from .lines import LineCache
from .solver import SolverParams, solve

# Variantes proposées au client (réglages compréhensibles, pas de curseurs techniques).
VARIANTS: dict[str, imaging.PreprocessParams] = {
    "doux": imaging.PreprocessParams(clahe_clip=1.0, gamma=0.9, face_weight=1.0),
    "standard": imaging.PreprocessParams(clahe_clip=2.0, gamma=1.0, face_weight=1.0),
    "contraste": imaging.PreprocessParams(clahe_clip=3.0, gamma=1.3, face_weight=1.0),
}

_CACHES: dict[tuple[str, int], LineCache] = {}


def line_cache(geometry: BoardGeometry, resolution: int) -> LineCache:
    key = (geometry.id, resolution)
    if key not in _CACHES:
        _CACHES[key] = LineCache(geometry, resolution)
    return _CACHES[key]


@dataclass
class GenerationOutput:
    document: dict
    preview: Image.Image
    timings: dict


def generate(
    image: Image.Image,
    *,
    image_sha256: str = "",
    preprocess: imaging.PreprocessParams = VARIANTS["standard"],
    solver_params: SolverParams = SolverParams(),
    geometry: BoardGeometry | None = None,
    crop: tuple[int, int, int] | None = None,
    render_resolution: int = 1000,
) -> GenerationOutput:
    geometry = geometry or BoardGeometry.load()
    t0 = time.perf_counter()
    prepared = imaging.prepare_pil(image, preprocess, crop, image_sha256)
    cache = line_cache(geometry, preprocess.resolution)
    t1 = time.perf_counter()
    result = solve(prepared.target, prepared.importance, cache, solver_params)
    t2 = time.perf_counter()
    simulated = render.simulate(geometry, result.sequence, render_resolution)
    scores = render.metrics(prepared.target, simulated, prepared.mask)
    preview = render.to_image(geometry, simulated)
    t3 = time.perf_counter()
    doc = instructions.build_document(
        geometry,
        result.sequence,
        image_sha256=prepared.source_sha256,
        preprocess=asdict(preprocess),
        solver=solver_params.to_dict(),
        metrics=scores,
        quality=prepared.quality,
    )
    timings = {"prepare_s": round(t1 - t0, 2), "solve_s": round(t2 - t1, 2), "render_s": round(t3 - t2, 2)}
    doc["timings"] = timings
    return GenerationOutput(doc, preview, timings)


def save(output: GenerationOutput, out_dir: Path, name: str) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    output.preview.save(out_dir / f"{name}.png")
    (out_dir / f"{name}.json").write_text(json.dumps(output.document, ensure_ascii=False, indent=1), encoding="utf-8")

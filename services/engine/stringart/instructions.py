"""Instructions de réalisation : séquence lisible, longueur de fil, export JSON."""

from __future__ import annotations

import math

from .geometry import BoardGeometry

ENGINE_VERSION = "0.1.0"


def thread_length_mm(geometry: BoardGeometry, sequence: list[int]) -> float:
    """Somme des cordes + enroulement d'un demi-tour autour de chaque clou."""
    chords = sum(geometry.chord_mm(a, b) for a, b in zip(sequence[:-1], sequence[1:]))
    wraps = max(0, len(sequence) - 2) * math.pi * geometry.nail_diameter_mm / 2
    return chords + wraps


def steps(geometry: BoardGeometry, sequence: list[int]) -> list[dict]:
    return [
        {"step": k + 1, "from": geometry.label(a), "to": geometry.label(b)}
        for k, (a, b) in enumerate(zip(sequence[:-1], sequence[1:]))
    ]


def build_document(
    geometry: BoardGeometry,
    sequence: list[int],
    *,
    image_sha256: str,
    preprocess: dict,
    solver: dict,
    metrics: dict,
    quality: dict,
    safety_margin: float = 0.10,
) -> dict:
    length = thread_length_mm(geometry, sequence)
    return {
        "engine_version": ENGINE_VERSION,
        "board": geometry.id,
        "image_sha256": image_sha256,
        "params": {"preprocess": preprocess, "solver": solver},
        "summary": {
            "lines": len(sequence) - 1,
            "start": geometry.label(sequence[0]),
            "thread_length_m": round(length / 1000, 1),
            "thread_length_with_margin_m": round(length * (1 + safety_margin) / 1000, 1),
        },
        "photo_quality": quality,
        "metrics": metrics,
        "sequence": sequence,
        "steps": steps(geometry, sequence),
    }

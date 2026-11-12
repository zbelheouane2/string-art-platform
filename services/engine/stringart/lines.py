"""Pré-calcul des segments entre clous (rastérisation sur la grille de travail).

Pour chaque clou `a`, on stocke les pixels de tous les segments (a, b) dans un
format compact (CSR) pour évaluer d'un coup les 239 candidats avec NumPy.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .geometry import BoardGeometry


def segment_pixels(p0: np.ndarray, p1: np.ndarray, resolution: int, step: float = 0.5) -> np.ndarray:
    """Indices linéaires (y*R + x) des pixels traversés par le segment, sans doublon."""
    length = float(np.hypot(*(p1 - p0)))
    n = max(2, int(np.ceil(length / step)) + 1)
    t = np.linspace(0.0, 1.0, n)
    xs = np.clip(np.rint(p0[0] + (p1[0] - p0[0]) * t), 0, resolution - 1).astype(np.int32)
    ys = np.clip(np.rint(p0[1] + (p1[1] - p0[1]) * t), 0, resolution - 1).astype(np.int32)
    return np.unique(ys * resolution + xs)


@dataclass
class NailFan:
    """Tous les segments partant d'un clou."""

    others: np.ndarray    # (N-1,) index des clous d'arrivée
    pixels: np.ndarray    # pixels concaténés de tous les segments
    starts: np.ndarray    # (N-1,) début de chaque segment dans `pixels`
    lengths: np.ndarray   # (N-1,) nombre de pixels de chaque segment


class LineCache:
    def __init__(self, geometry: BoardGeometry, resolution: int):
        self.geometry = geometry
        self.resolution = resolution
        pts = geometry.positions_px(resolution)
        n = geometry.nail_count
        pair: dict[tuple[int, int], np.ndarray] = {}
        for i in range(n):
            for j in range(i + 1, n):
                pair[(i, j)] = segment_pixels(pts[i], pts[j], resolution)
        self.fans: list[NailFan] = []
        for a in range(n):
            others = np.array([b for b in range(n) if b != a], dtype=np.int32)
            segs = [pair[(min(a, b), max(a, b))] for b in others]
            lengths = np.array([len(s) for s in segs], dtype=np.int32)
            starts = np.concatenate([[0], np.cumsum(lengths)[:-1]]).astype(np.int64)
            self.fans.append(NailFan(others, np.concatenate(segs), starts, lengths))
        self._pair = pair

    def segment(self, a: int, b: int) -> np.ndarray:
        return self._pair[(min(a, b), max(a, b))]

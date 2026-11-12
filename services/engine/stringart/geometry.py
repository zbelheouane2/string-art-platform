"""Géométrie standardisée de la planche : positions des clous et repères lisibles.

Les coordonnées sont exprimées en millimètres, origine au coin haut-gauche de la
planche, axe Y vers le bas (convention image). Elles sont la source de vérité
unique pour le rendu, le PDF et le gabarit de fabrication.
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path

import numpy as np

BOARDS_DIR = Path(__file__).resolve().parent.parent / "boards"
DEFAULT_BOARD_ID = "board-50x50-240-v1"


@dataclass(frozen=True)
class BoardGeometry:
    id: str
    board_size_mm: float
    circle_diameter_mm: float
    nail_count: int
    sectors: tuple[str, ...]
    start_angle_deg: float
    clockwise: bool
    nail_diameter_mm: float

    @classmethod
    def load(cls, board_id: str = DEFAULT_BOARD_ID) -> "BoardGeometry":
        data = json.loads((BOARDS_DIR / f"{board_id}.json").read_text(encoding="utf-8"))
        geometry = cls(
            id=data["id"],
            board_size_mm=float(data["board_size_mm"]),
            circle_diameter_mm=float(data["circle_diameter_mm"]),
            nail_count=int(data["nail_count"]),
            sectors=tuple(data["sectors"]),
            start_angle_deg=float(data["start_angle_deg"]),
            clockwise=bool(data["clockwise"]),
            nail_diameter_mm=float(data["nail_diameter_mm"]),
        )
        geometry.validate()
        return geometry

    def validate(self) -> None:
        if self.nail_count <= 0 or self.nail_count % len(self.sectors) != 0:
            raise ValueError("nail_count doit être un multiple du nombre de secteurs")
        if self.circle_diameter_mm >= self.board_size_mm:
            raise ValueError("le cercle doit tenir dans la planche")

    # --- repères ---------------------------------------------------------
    @property
    def nails_per_sector(self) -> int:
        return self.nail_count // len(self.sectors)

    def label(self, index: int) -> str:
        """Index interne (0..N-1) -> repère lisible, ex. 0 -> 'A1', 239 -> 'D60'."""
        if not 0 <= index < self.nail_count:
            raise IndexError(f"clou hors plage : {index}")
        sector, position = divmod(index, self.nails_per_sector)
        return f"{self.sectors[sector]}{position + 1}"

    def index(self, label: str) -> int:
        """Repère lisible -> index interne. Inverse exact de `label`."""
        label = label.strip().upper()
        sector, number = label[0], int(label[1:])
        if sector not in self.sectors or not 1 <= number <= self.nails_per_sector:
            raise ValueError(f"repère invalide : {label}")
        return self.sectors.index(sector) * self.nails_per_sector + number - 1

    # --- positions -------------------------------------------------------
    def angles_rad(self) -> np.ndarray:
        """Angle mathématique (Y vers le haut) de chaque clou.

        Le décalage d'un demi-pas place la frontière entre deux secteurs entre
        deux clous (ex. A60 juste avant 12 h, B1 juste après).
        """
        step = 2 * math.pi / self.nail_count
        direction = -1.0 if self.clockwise else 1.0
        start = math.radians(self.start_angle_deg)
        i = np.arange(self.nail_count, dtype=np.float64)
        return start + direction * (i + 0.5) * step

    def positions_mm(self) -> np.ndarray:
        """Tableau (N, 2) des centres des clous en mm (x, y), Y vers le bas."""
        c = self.board_size_mm / 2
        r = self.circle_diameter_mm / 2
        a = self.angles_rad()
        return np.stack([c + r * np.cos(a), c - r * np.sin(a)], axis=1)

    def positions_px(self, resolution: int) -> np.ndarray:
        """Positions en pixels dans une image carrée couvrant le cercle des clous.

        L'image de travail est cadrée sur le cercle (diamètre = `resolution`).
        """
        mm = self.positions_mm()
        offset = (self.board_size_mm - self.circle_diameter_mm) / 2
        scale = (resolution - 1) / self.circle_diameter_mm
        return (mm - offset) * scale

    def chord_mm(self, i: int, j: int) -> float:
        """Distance entre les centres de deux clous."""
        return self.circle_diameter_mm * abs(math.sin(math.pi * (i - j) / self.nail_count))

    def circular_distance(self, i: int, j: int) -> int:
        d = abs(i - j) % self.nail_count
        return min(d, self.nail_count - d)

"""Détection du visage principal et cadrage automatique.

Détecteur principal : YuNet (OpenCV, modèle ONNX ~230 Ko, licence MIT, fourni
dans `models/`). Il donne le cadre du visage et 5 repères : yeux, nez, coins
de la bouche. Repli : cascade de Haar (cadre seul) si YuNet est indisponible.
Aucune donnée ne quitte la machine.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

YUNET_MODEL = Path(__file__).parent / "models" / "face_detection_yunet_2023mar.onnx"
DETECT_MAX_SIDE = 960          # la détection se fait sur une copie réduite


@dataclass(frozen=True)
class Face:
    x: float
    y: float
    w: float
    h: float
    score: float
    # Repères (x, y) : œil droit, œil gauche, nez, bouche droite, bouche gauche.
    landmarks: tuple[tuple[float, float], ...] | None = None

    @property
    def center(self) -> tuple[float, float]:
        return self.x + self.w / 2, self.y + self.h / 2

    def mapped(self, ox: float, oy: float, scale: float) -> "Face":
        """Coordonnées dans un repère recadré (origine ox, oy) puis mis à l'échelle."""
        f = lambda px, py: ((px - ox) * scale, (py - oy) * scale)
        lm = tuple(f(px, py) for px, py in self.landmarks) if self.landmarks else None
        x, y = f(self.x, self.y)
        return Face(x, y, self.w * scale, self.h * scale, self.score, lm)


def _yunet(bgr: np.ndarray) -> list[Face]:
    if not YUNET_MODEL.exists() or not hasattr(cv2, "FaceDetectorYN"):
        raise RuntimeError("YuNet indisponible")
    h, w = bgr.shape[:2]
    det = cv2.FaceDetectorYN.create(str(YUNET_MODEL), "", (w, h), 0.6, 0.3, 50)
    _, rows = det.detect(bgr)
    faces = []
    for r in rows if rows is not None else []:
        lm = tuple((float(r[4 + 2 * k]), float(r[5 + 2 * k])) for k in range(5))
        faces.append(Face(float(r[0]), float(r[1]), float(r[2]), float(r[3]), float(r[14]), lm))
    return faces


def _haar(bgr: np.ndarray) -> list[Face]:
    if not hasattr(cv2, "CascadeClassifier"):
        return []
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    rows = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
    return [Face(float(x), float(y), float(w), float(h), 0.5) for (x, y, w, h) in rows]


def detect_main_face(rgb: np.ndarray) -> Face | None:
    """Plus grand visage de l'image (coordonnées de l'image fournie), ou None."""
    h, w = rgb.shape[:2]
    scale = min(1.0, DETECT_MAX_SIDE / max(h, w))
    small = cv2.resize(rgb, (round(w * scale), round(h * scale)), interpolation=cv2.INTER_AREA) if scale < 1 else rgb
    bgr = cv2.cvtColor(np.ascontiguousarray(small), cv2.COLOR_RGB2BGR)
    try:
        faces = _yunet(bgr)
    except (RuntimeError, cv2.error):
        faces = _haar(bgr)
    if not faces:
        return None
    best = max(faces, key=lambda f: f.w * f.h)
    return best.mapped(0, 0, 1 / scale)


def auto_crop(
    size: tuple[int, int],
    face: Face,
    face_fraction: float = 0.5,
    face_center_y: float = 0.45,
    max_fraction: float = 0.7,
) -> tuple[int, int, int]:
    """Carré (x, y, côté) où le visage occupe `face_fraction` du diamètre.

    `face_center_y` : position verticale du centre du visage dans le carré
    (un peu au-dessus du milieu pour garder le cou et les épaules).
    """
    width, height = size
    cx, cy = face.center
    side = min(face.h / face_fraction, width, height)
    # Si l'image est trop étroite pour ce cadrage, on resserre un peu (jusqu'à
    # `max_fraction`) plutôt que de décentrer fortement le visage.
    room = min(2 * cx, 2 * (width - cx), (height - cy) / (1 - face_center_y), cy / face_center_y)
    side = int(round(min(side, max(room, face.h / max_fraction), width, height)))
    x = int(round(cx - side / 2))
    y = int(round(cy - face_center_y * side))
    x = min(max(0, x), width - side)
    y = min(max(0, y), height - side)
    return x, y, side

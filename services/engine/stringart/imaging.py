"""Prétraitement de la photo : chargement, recadrage, niveaux de gris, contraste.

Sortie : une carte de « noirceur cible » float32 dans [0, 1] (1 = noir),
masquée au disque des clous.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps

MAX_FILE_BYTES = 15 * 1024 * 1024
MIN_SIDE_PX = 400


@dataclass(frozen=True)
class PreprocessParams:
    resolution: int = 500          # côté de l'image de travail (px)
    clahe_clip: float = 2.0        # 0 = désactivé
    gamma: float = 1.0             # >1 assombrit les tons moyens de la cible
    invert: bool = False           # planche noire / fil blanc
    face_weight: float = 0.0       # 0 = pas de carte d'importance visage


@dataclass
class PreparedImage:
    target: np.ndarray             # (R, R) float32, noirceur 0..1, 0 hors disque
    importance: np.ndarray         # (R, R) float32, poids >= 0
    mask: np.ndarray               # (R, R) bool, disque des clous
    source_sha256: str
    quality: dict = field(default_factory=dict)


def load_image(path: str | Path) -> tuple[Image.Image, str]:
    path = Path(path)
    if path.stat().st_size > MAX_FILE_BYTES:
        raise ValueError("fichier trop volumineux (15 Mo maximum)")
    raw = path.read_bytes()
    img = Image.open(path)
    img = ImageOps.exif_transpose(img).convert("RGB")
    if min(img.size) < MIN_SIDE_PX:
        raise ValueError(f"image trop petite ({img.size[0]}x{img.size[1]}), minimum {MIN_SIDE_PX} px")
    return img, hashlib.sha256(raw).hexdigest()


def center_square(img: Image.Image, crop: tuple[int, int, int] | None = None) -> Image.Image:
    """Recadrage carré. `crop` = (x, y, côté) en pixels source, sinon centré."""
    if crop is None:
        side = min(img.size)
        x = (img.width - side) // 2
        y = (img.height - side) // 2
    else:
        x, y, side = crop
        # Le recadrage reste toujours dans l'image (sinon des bandes noires
        # seraient interprétées comme des zones à remplir de fil).
        side = max(1, min(side, img.width, img.height))
        x = min(max(0, x), img.width - side)
        y = min(max(0, y), img.height - side)
    return img.crop((x, y, x + side, y + side))


def luminance(rgb: np.ndarray) -> np.ndarray:
    """Luminance Rec.709 dans [0, 1]."""
    rgb = rgb.astype(np.float32) / 255.0
    return rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722


def disk_mask(resolution: int) -> np.ndarray:
    yy, xx = np.mgrid[:resolution, :resolution]
    c = (resolution - 1) / 2
    return (xx - c) ** 2 + (yy - c) ** 2 <= c * c


def quality_report(gray: np.ndarray, mask: np.ndarray) -> dict:
    """Indicateurs simples pour avertir le client (photo floue, sombre, terne)."""
    g8 = (gray * 255).astype(np.uint8)
    sharpness = float(cv2.Laplacian(g8, cv2.CV_64F)[mask].var())
    values = gray[mask]
    report = {
        "sharpness": round(sharpness, 1),
        "mean_brightness": round(float(values.mean()), 3),
        "contrast_std": round(float(values.std()), 3),
        "warnings": [],
    }
    if sharpness < 50:
        report["warnings"].append("photo_floue")
    if values.mean() < 0.25:
        report["warnings"].append("photo_trop_sombre")
    if values.mean() > 0.8:
        report["warnings"].append("photo_trop_claire")
    if values.std() < 0.12:
        report["warnings"].append("contraste_faible")
    return report


def _face_importance(gray: np.ndarray, weight: float) -> np.ndarray:
    imp = np.ones_like(gray, dtype=np.float32)
    if weight <= 0:
        return imp
    if not hasattr(cv2, "CascadeClassifier"):  # absent d'OpenCV 5 : pas de pondération
        return imp
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    g8 = (gray * 255).astype(np.uint8)
    faces = cascade.detectMultiScale(g8, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
    for (x, y, w, h) in faces:
        yy, xx = np.mgrid[: gray.shape[0], : gray.shape[1]]
        cx, cy = x + w / 2, y + h / 2
        sigma = 0.6 * max(w, h)
        imp += weight * np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * sigma**2)).astype(np.float32)
    return imp


def prepare(
    path: str | Path,
    params: PreprocessParams = PreprocessParams(),
    crop: tuple[int, int, int] | None = None,
) -> PreparedImage:
    img, sha = load_image(path)
    return prepare_pil(img, params, crop, sha)


def prepare_pil(
    img: Image.Image,
    params: PreprocessParams = PreprocessParams(),
    crop: tuple[int, int, int] | None = None,
    sha: str = "",
) -> PreparedImage:
    square = center_square(img.convert("RGB"), crop).resize(
        (params.resolution, params.resolution), Image.Resampling.LANCZOS
    )
    gray = luminance(np.asarray(square))
    mask = disk_mask(params.resolution)
    quality = quality_report(gray, mask)

    # Normalisation par percentiles (dans le disque uniquement).
    lo, hi = np.percentile(gray[mask], [1, 99])
    gray = np.clip((gray - lo) / max(hi - lo, 1e-6), 0, 1)

    if params.clahe_clip > 0:
        clahe = cv2.createCLAHE(clipLimit=params.clahe_clip, tileGridSize=(8, 8))
        gray = clahe.apply((gray * 255).astype(np.uint8)).astype(np.float32) / 255.0

    darkness = 1.0 - gray
    if params.invert:
        darkness = 1.0 - darkness
    if params.gamma != 1.0:
        darkness = np.power(darkness, 1.0 / params.gamma)

    darkness = darkness.astype(np.float32)
    darkness[~mask] = 0.0
    importance = _face_importance(gray, params.face_weight)
    importance[~mask] = 0.0
    return PreparedImage(darkness, importance, mask, sha, quality)

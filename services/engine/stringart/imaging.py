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

from . import faces as facemod

MAX_FILE_BYTES = 15 * 1024 * 1024
MIN_SIDE_PX = 400


@dataclass(frozen=True)
class PreprocessParams:
    resolution: int = 500          # côté de l'image de travail (px)
    clahe_clip: float = 2.0        # 0 = désactivé
    gamma: float = 1.0             # >1 assombrit les tons moyens de la cible
    invert: bool = False           # planche noire / fil blanc
    face_weight: float = 0.0       # 0 = pas de carte d'importance visage
    auto_crop: bool = True         # cadrage automatique sur le visage (si pas de recadrage manuel)
    face_fraction: float = 0.5     # hauteur du visage / diamètre du cercle visé
    feature_weight: float = 0.0    # importance des yeux et de la bouche (expérimental, sans gain mesuré)
    sharpen: float = 0.5           # renforcement des contours (masque flou), 0 = désactivé
    background: str = "light"      # "light" (fond éclairci derrière la personne) ou "keep"
    background_level: float = 0.35 # part de noirceur conservée dans le fond si "light"


@dataclass
class PreparedImage:
    target: np.ndarray             # (R, R) float32, noirceur 0..1, 0 hors disque
    importance: np.ndarray         # (R, R) float32, poids >= 0
    mask: np.ndarray               # (R, R) bool, disque des clous
    source_sha256: str
    quality: dict = field(default_factory=dict)
    crop_box: tuple[int, int, int] = (0, 0, 0)   # (x, y, côté) en pixels source, réellement appliqué
    face: facemod.Face | None = None             # visage dans le repère de travail (R x R)


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


def square_box(size: tuple[int, int], crop: tuple[int, int, int] | None = None) -> tuple[int, int, int]:
    """Carré (x, y, côté) gardé dans l'image. `crop` = (x, y, côté) en pixels source, sinon centré."""
    width, height = size
    if crop is None:
        side = min(width, height)
        return (width - side) // 2, (height - side) // 2, side
    x, y, side = crop
    # Le recadrage reste toujours dans l'image (sinon des bandes noires
    # seraient interprétées comme des zones à remplir de fil).
    side = max(1, min(side, width, height))
    x = min(max(0, x), width - side)
    y = min(max(0, y), height - side)
    return x, y, side


def center_square(img: Image.Image, crop: tuple[int, int, int] | None = None) -> Image.Image:
    x, y, side = square_box(img.size, crop)
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


def _gaussian(shape: tuple[int, int], cx: float, cy: float, sx: float, sy: float | None = None) -> np.ndarray:
    sy = sx if sy is None else sy
    yy, xx = np.mgrid[: shape[0], : shape[1]]
    return np.exp(-((xx - cx) ** 2 / (2 * sx**2) + (yy - cy) ** 2 / (2 * sy**2))).astype(np.float32)


def importance_map(shape: tuple[int, int], face: facemod.Face | None, face_weight: float, feature_weight: float) -> np.ndarray:
    """Poids >= 1 : le visage, puis les yeux et la bouche, comptent davantage."""
    imp = np.ones(shape, dtype=np.float32)
    if face is None:
        return imp
    cx, cy = face.center
    if face_weight > 0:
        imp += face_weight * _gaussian(shape, cx, cy, 0.6 * face.w, 0.6 * face.h)
    if feature_weight > 0 and face.landmarks:
        (rex, rey), (lex, ley), _, (rmx, rmy), (lmx, lmy) = face.landmarks
        eye_sigma = 0.11 * face.w
        imp += feature_weight * _gaussian(shape, rex, rey, eye_sigma)
        imp += feature_weight * _gaussian(shape, lex, ley, eye_sigma)
        imp += 0.7 * feature_weight * _gaussian(shape, (rmx + lmx) / 2, (rmy + lmy) / 2, 0.2 * face.w, 0.09 * face.h)
    return imp


def subject_mask(rgb: np.ndarray, face: facemod.Face) -> np.ndarray:
    """Probabilité 0..1 que chaque pixel appartienne à la personne (GrabCut).

    Initialisation : le visage est « sûrement la personne », un rectangle
    tête + buste est « probablement la personne », le reste est le fond.
    """
    res = rgb.shape[0]
    work = 256
    k = work / res
    small = cv2.resize(rgb, (work, work), interpolation=cv2.INTER_AREA)
    bgr = cv2.cvtColor(small, cv2.COLOR_RGB2BGR)
    m = np.full((work, work), cv2.GC_PR_BGD, np.uint8)
    cx, cy = face.center
    # Tête (ellipse un peu remontée pour les cheveux) et buste : « probablement la personne ».
    cv2.ellipse(m, (int(cx * k), int((cy - 0.12 * face.h) * k)), (int(0.85 * face.w * k), int(0.75 * face.h * k)), 0, 0, 360, int(cv2.GC_PR_FGD), -1)
    chin = int((face.y + 0.9 * face.h) * k)
    tx0, tx1 = int((cx - 1.3 * face.w) * k), int((cx + 1.3 * face.w) * k)
    m[max(chin, 0) :, max(tx0, 0) : max(tx1, 0)] = cv2.GC_PR_FGD
    # Cœur du visage : « sûrement la personne ».
    fx0, fy0 = int((face.x + 0.15 * face.w) * k), int((face.y + 0.15 * face.h) * k)
    fx1, fy1 = int((face.x + 0.85 * face.w) * k), int((face.y + 0.85 * face.h) * k)
    m[max(fy0, 0) : max(fy1, 0), max(fx0, 0) : max(fx1, 0)] = cv2.GC_FGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(bgr, m, None, bgd, fgd, 4, cv2.GC_INIT_WITH_MASK)
    except cv2.error:
        return np.ones((res, res), np.float32)
    fg = ((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD)).astype(np.float32)
    # On garde la composante connexe qui contient le visage, puis on adoucit le bord.
    n, labels = cv2.connectedComponents(fg.astype(np.uint8))
    lab = labels[min(int(cy * k), work - 1), min(int(cx * k), work - 1)]
    if lab > 0:
        fg = (labels == lab).astype(np.float32)
    fg = cv2.resize(fg, (res, res), interpolation=cv2.INTER_LINEAR)
    return cv2.GaussianBlur(fg, (0, 0), res / 120).clip(0, 1)


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
    img = img.convert("RGB")
    face = None
    if crop is None and params.auto_crop or params.face_weight or params.feature_weight or params.background != "keep":
        face = facemod.detect_main_face(np.asarray(img))
    if crop is None and params.auto_crop and face is not None:
        crop = facemod.auto_crop(img.size, face, params.face_fraction)
    box = square_box(img.size, crop)
    x, y, side = box
    res = params.resolution
    square = img.crop((x, y, x + side, y + side)).resize((res, res), Image.Resampling.LANCZOS)
    rgb = np.asarray(square)
    work_face = face.mapped(x, y, res / side) if face is not None else None
    if work_face is not None and not _face_visible(work_face, res):
        work_face = None

    gray = luminance(rgb)
    mask = disk_mask(res)
    quality = quality_report(gray, mask)

    # Normalisation par percentiles (dans le disque uniquement).
    lo, hi = np.percentile(gray[mask], [1, 99])
    gray = np.clip((gray - lo) / max(hi - lo, 1e-6), 0, 1)

    if params.clahe_clip > 0:
        clahe = cv2.createCLAHE(clipLimit=params.clahe_clip, tileGridSize=(8, 8))
        gray = clahe.apply((gray * 255).astype(np.uint8)).astype(np.float32) / 255.0

    if params.sharpen > 0:
        blurred = cv2.GaussianBlur(gray, (0, 0), res / 250)
        gray = np.clip(gray + params.sharpen * (gray - blurred), 0, 1).astype(np.float32)

    darkness = 1.0 - gray
    if params.invert:
        darkness = 1.0 - darkness
    if params.gamma != 1.0:
        darkness = np.power(darkness, 1.0 / params.gamma)

    if params.background == "light" and work_face is not None:
        subject = subject_mask(rgb, work_face)
        darkness = darkness * (params.background_level + (1 - params.background_level) * subject)

    darkness = darkness.astype(np.float32)
    darkness[~mask] = 0.0
    importance = importance_map(darkness.shape, work_face, params.face_weight, params.feature_weight)
    importance[~mask] = 0.0
    quality["face_detected"] = work_face is not None
    return PreparedImage(darkness, importance, mask, sha, quality, box, work_face)


def _face_visible(face: facemod.Face, res: int) -> bool:
    """Le centre du visage est dans le disque (sinon, recadrage manuel hors visage)."""
    cx, cy = face.center
    c = (res - 1) / 2
    return (cx - c) ** 2 + (cy - c) ** 2 <= c * c

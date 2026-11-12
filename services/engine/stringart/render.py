"""Simulation visuelle du résultat et métriques de qualité."""

from __future__ import annotations

import cv2
import numpy as np
from PIL import Image, ImageDraw

from .geometry import BoardGeometry
from .lines import segment_pixels


def thread_density(geometry: BoardGeometry, sequence: list[int], resolution: int) -> np.ndarray:
    """Nombre de passages de fil par pixel (grille cadrée sur le cercle)."""
    pts = geometry.positions_px(resolution)
    counts = np.zeros(resolution * resolution, dtype=np.float32)
    for a, b in zip(sequence[:-1], sequence[1:]):
        np.add.at(counts, segment_pixels(pts[a], pts[b], resolution), 1.0)
    return counts.reshape(resolution, resolution)


def simulate(
    geometry: BoardGeometry,
    sequence: list[int],
    resolution: int = 1000,
    thread_width_mm: float = 0.12,
    thread_opacity: float = 0.95,
    supersample: int = 3,
) -> np.ndarray:
    """Noirceur simulée 0..1.

    Le fil est tracé sur une grille fine (sur-échantillonnage) où chaque passage
    couvre une fraction réaliste du pixel, avec accumulation multiplicative
    (1 - (1 - a)^n), puis la grille est moyennée à la résolution demandée :
    c'est ce mélange qui produit les niveaux de gris perçus à distance.
    """
    fine = resolution * supersample
    px_mm = geometry.circle_diameter_mm / fine
    alpha = min(1.0, thread_opacity * thread_width_mm / px_mm)
    counts = thread_density(geometry, sequence, fine)
    dark = (1.0 - np.power(1.0 - alpha, counts)).astype(np.float32)
    return cv2.resize(dark, (resolution, resolution), interpolation=cv2.INTER_AREA)


def to_image(geometry: BoardGeometry, darkness: np.ndarray, draw_nails: bool = True) -> Image.Image:
    """Image PNG : planche blanche, fil noir, clous en gris."""
    res = darkness.shape[0]
    img = Image.fromarray(((1.0 - darkness) * 255).clip(0, 255).astype(np.uint8), mode="L").convert("RGB")
    if draw_nails:
        draw = ImageDraw.Draw(img)
        r = max(1, res // 400)
        for x, y in geometry.positions_px(res):
            draw.ellipse((x - r, y - r, x + r, y + r), fill=(150, 150, 150))
    return img


def _ssim(a: np.ndarray, b: np.ndarray) -> float:
    c1, c2 = 0.01**2, 0.03**2
    blur = lambda x: cv2.GaussianBlur(x, (11, 11), 1.5)
    mu_a, mu_b = blur(a), blur(b)
    var_a = blur(a * a) - mu_a**2
    var_b = blur(b * b) - mu_b**2
    cov = blur(a * b) - mu_a * mu_b
    s = ((2 * mu_a * mu_b + c1) * (2 * cov + c2)) / ((mu_a**2 + mu_b**2 + c1) * (var_a + var_b + c2))
    return float(s.mean())


def metrics(target: np.ndarray, simulated: np.ndarray, mask: np.ndarray, view_blur_px: float = 2.0) -> dict:
    """Compare cible et rendu à la même résolution, après un flou « vue à distance »."""
    if simulated.shape != target.shape:
        simulated = cv2.resize(simulated, target.shape[::-1], interpolation=cv2.INTER_AREA)
    t = cv2.GaussianBlur(target.astype(np.float32), (0, 0), view_blur_px)
    s = cv2.GaussianBlur(simulated.astype(np.float32), (0, 0), view_blur_px)
    diff = (t - s)[mask]
    return {
        "mse_blurred": round(float(np.mean(diff**2)), 5),
        "ssim_blurred": round(_ssim(t * mask, s * mask), 4),
        "mean_darkness_target": round(float(t[mask].mean()), 3),
        "mean_darkness_render": round(float(s[mask].mean()), 3),
    }

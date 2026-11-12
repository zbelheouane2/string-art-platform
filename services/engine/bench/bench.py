"""Banc d'essai qualité du moteur.

Génère chaque photo d'un dossier avec les réglages par défaut, puis mesure la
ressemblance entre le rendu simulé et la photo d'origine (même recadrage),
vue « à distance » (flou léger) :

- ssim_global : sur tout le disque ;
- ssim_visage : dans le cadre du visage détecté (si visage).

Usage :
    python bench/bench.py <dossier_photos> <dossier_sortie> [--variant standard]
"""

from __future__ import annotations

import argparse
import json
from dataclasses import replace
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from stringart import faces, imaging, pipeline

EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def _ssim_region(a: np.ndarray, b: np.ndarray, region: np.ndarray) -> float:
    c1, c2 = 0.01**2, 0.03**2
    blur = lambda x: cv2.GaussianBlur(x, (11, 11), 1.5)
    mu_a, mu_b = blur(a), blur(b)
    var_a, var_b = blur(a * a) - mu_a**2, blur(b * b) - mu_b**2
    cov = blur(a * b) - mu_a * mu_b
    s = ((2 * mu_a * mu_b + c1) * (2 * cov + c2)) / ((mu_a**2 + mu_b**2 + c1) * (var_a + var_b + c2))
    return float(s[region].mean())


def evaluate(img: Image.Image, out: pipeline.GenerationOutput, res: int = 500) -> dict:
    doc = out.document
    box = doc.get("crop_box")
    if box:
        x, y, side = box
        square = img.crop((x, y, x + side, y + side))
    else:
        square = imaging.center_square(img)
    gray = imaging.luminance(np.asarray(square.convert("RGB").resize((res, res), Image.Resampling.LANCZOS)))
    mask = imaging.disk_mask(res)
    lo, hi = np.percentile(gray[mask], [1, 99])
    ref = 1.0 - np.clip((gray - lo) / max(hi - lo, 1e-6), 0, 1)
    sim = np.asarray(out.preview.convert("L").resize((res, res), Image.Resampling.LANCZOS), np.float32) / 255.0
    sim = 1.0 - sim
    t = cv2.GaussianBlur(ref.astype(np.float32), (0, 0), 2.0) * mask
    s = cv2.GaussianBlur(sim.astype(np.float32), (0, 0), 2.0) * mask
    result = {"ssim_global": round(_ssim_region(t, s, mask), 4), "lines": doc["summary"]["lines"]}
    face = faces.detect_main_face(np.asarray(square.convert("RGB")))
    if face is not None:
        k = res / square.width
        fx, fy, fw, fh = face.x * k, face.y * k, face.w * k, face.h * k
        region = np.zeros_like(mask)
        region[int(max(fy, 0)) : int(fy + fh), int(max(fx, 0)) : int(fx + fw)] = True
        result["ssim_visage"] = round(_ssim_region(t, s, region & mask), 4)
    return result


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("images", type=Path)
    p.add_argument("out", type=Path)
    p.add_argument("--variant", default="standard")
    p.add_argument("--resolution", type=int, default=500)
    args = p.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    pre = replace(pipeline.VARIANTS[args.variant], resolution=args.resolution)
    results = {}
    for path in sorted(q for q in args.images.iterdir() if q.suffix.lower() in EXTS):
        img = Image.open(path).convert("RGB")
        out = pipeline.generate(img, preprocess=pre, render_resolution=800)
        out.preview.save(args.out / f"{path.stem}.png")
        results[path.stem] = {**evaluate(img, out), "timings": out.timings}
        print(path.stem, results[path.stem], flush=True)
    (args.out / "resultats.json").write_text(json.dumps(results, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()

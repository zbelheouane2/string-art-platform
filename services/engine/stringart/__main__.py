"""Ligne de commande du prototype.

Exemples :
    python -m stringart photo.jpg --out sortie/
    python -m stringart photo.jpg --out sortie/ --variants
    python -m stringart photo.jpg --out sortie/ --crop 110,0,260 --lines 3000
"""

from __future__ import annotations

import argparse
from dataclasses import replace
from pathlib import Path

from . import imaging, pipeline
from .solver import SolverParams


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(prog="stringart", description="Génère un patron String Art depuis une photo.")
    p.add_argument("image", type=Path)
    p.add_argument("--out", type=Path, default=Path("out"))
    p.add_argument("--variants", action="store_true", help="génère les variantes doux / standard / contraste")
    p.add_argument("--variant", default="standard", choices=sorted(pipeline.VARIANTS))
    p.add_argument("--lines", type=int, default=SolverParams.max_lines)
    p.add_argument("--line-weight", type=float, default=SolverParams.line_weight)
    p.add_argument("--min-gap", type=int, default=SolverParams.min_gap)
    p.add_argument("--resolution", type=int, default=500)
    p.add_argument("--crop", help="recadrage carré en pixels source : x,y,cote (sinon cadrage auto sur le visage)")
    p.add_argument("--no-auto-crop", action="store_true", help="recadrage centré au lieu du cadrage sur le visage")
    p.add_argument("--background", choices=["light", "keep"], default="light", help="éclaircir ou garder le fond")
    args = p.parse_args(argv)

    img, sha = imaging.load_image(args.image)
    solver = SolverParams(max_lines=args.lines, line_weight=args.line_weight, min_gap=args.min_gap)
    crop = tuple(int(v) for v in args.crop.split(",")) if args.crop else None
    names = sorted(pipeline.VARIANTS) if args.variants else [args.variant]
    for name in names:
        pre = replace(
            pipeline.VARIANTS[name],
            resolution=args.resolution,
            auto_crop=not args.no_auto_crop,
            background=args.background,
        )
        out = pipeline.generate(img, image_sha256=sha, preprocess=pre, solver_params=solver, crop=crop)
        stem = f"{args.image.stem}-{name}"
        pipeline.save(out, args.out, stem)
        s, m = out.document["summary"], out.document["metrics"]
        print(
            f"{stem}: {s['lines']} fils, {s['thread_length_m']} m de fil, "
            f"SSIM {m['ssim_blurred']}, {out.timings} -> {args.out / stem}.png"
        )
    warnings = out.document["photo_quality"]["warnings"]
    if warnings:
        print("Avertissements photo :", ", ".join(warnings))


if __name__ == "__main__":
    main()

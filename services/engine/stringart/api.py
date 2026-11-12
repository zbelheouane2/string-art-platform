"""Service HTTP du moteur (interne : appelé par le serveur du site, jamais par le navigateur).

    uvicorn stringart.api:app --host 0.0.0.0 --port 8000

Sécurité : si la variable ENGINE_TOKEN est définie, chaque requête doit porter
l'en-tête `X-Engine-Token`. Les photos ne sont ni enregistrées ni journalisées.
"""

from __future__ import annotations

import base64
import hmac
import io
import logging
import os
from dataclasses import replace
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from pydantic import BaseModel

from . import imaging, pipeline
from .instructions import ENGINE_VERSION
from .solver import SolverParams

log = logging.getLogger("stringart.api")
app = FastAPI(title="Moteur String Art", version=ENGINE_VERSION, docs_url=None, redoc_url=None)


def check_token(x_engine_token: Annotated[str | None, Header()] = None) -> None:
    expected = os.environ.get("ENGINE_TOKEN")
    if expected and not (x_engine_token and hmac.compare_digest(x_engine_token, expected)):
        raise HTTPException(status_code=401, detail="jeton invalide")


class Health(BaseModel):
    status: Literal["ok"]
    engine_version: str


class GenerationResult(BaseModel):
    document: dict
    preview_png_base64: str


@app.get("/health", response_model=Health)
def health() -> Health:
    return Health(status="ok", engine_version=ENGINE_VERSION)


def _parse_crop(value: str | None) -> tuple[int, int, int] | None:
    if not value:
        return None
    try:
        x, y, side = (int(v) for v in value.split(","))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="crop attendu au format x,y,côté") from exc
    if x < 0 or y < 0 or side <= 0:
        raise HTTPException(status_code=422, detail="crop invalide")
    return x, y, side


@app.post("/v1/generations", response_model=GenerationResult, dependencies=[Depends(check_token)])
def create_generation(
    photo: Annotated[UploadFile, File()],
    variant: Annotated[Literal["doux", "standard", "contraste"], Form()] = "standard",
    crop: Annotated[str | None, Form()] = None,
    background: Annotated[Literal["light", "keep"], Form()] = "light",
    preview_size: Annotated[int, Form(ge=200, le=1600)] = 1000,
) -> GenerationResult:
    raw = photo.file.read(imaging.MAX_FILE_BYTES + 1)
    try:
        img, sha = imaging.load_image_bytes(raw)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    pre = replace(pipeline.VARIANTS[variant], background=background)
    out = pipeline.generate(
        img,
        image_sha256=sha,
        preprocess=pre,
        solver_params=SolverParams(),
        crop=_parse_crop(crop),
        render_resolution=preview_size,
    )
    buf = io.BytesIO()
    out.preview.save(buf, format="PNG", optimize=True)
    log.info("génération %s : %s fils, %s", variant, out.document["summary"]["lines"], out.timings)
    return GenerationResult(document=out.document, preview_png_base64=base64.b64encode(buf.getvalue()).decode())

import io

import numpy as np
import pytest
from PIL import Image

pytest.importorskip("fastapi")
from fastapi.testclient import TestClient  # noqa: E402

from stringart.api import app  # noqa: E402

client = TestClient(app)


def _png(size=(500, 500), color=None) -> bytes:
    if color is None:
        yy, xx = np.mgrid[: size[1], : size[0]]
        arr = ((xx + yy) % 256).astype(np.uint8)
        img = Image.fromarray(np.repeat(arr[..., None], 3, axis=2))
    else:
        img = Image.new("RGB", size, color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_health():
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"


def test_generation_returns_document_and_preview():
    r = client.post(
        "/v1/generations",
        files={"photo": ("p.png", _png(), "image/png")},
        data={"variant": "standard", "preview_size": "200"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["document"]["steps"][0]["from"] == "A1"
    assert body["preview_png_base64"].startswith("iVBOR")  # signature PNG


def test_rejects_small_image():
    r = client.post("/v1/generations", files={"photo": ("p.png", _png((100, 100), "white"), "image/png")})
    assert r.status_code == 422 and "trop petite" in r.json()["detail"]


def test_rejects_non_image():
    r = client.post("/v1/generations", files={"photo": ("p.txt", b"bonjour", "text/plain")})
    assert r.status_code == 422


def test_rejects_bad_crop():
    r = client.post("/v1/generations", files={"photo": ("p.png", _png(), "image/png")}, data={"crop": "a,b"})
    assert r.status_code == 422


def test_token_required_when_configured(monkeypatch):
    monkeypatch.setenv("ENGINE_TOKEN", "secret-de-test")
    files = {"photo": ("p.png", _png(), "image/png")}
    assert client.post("/v1/generations", files=files).status_code == 401
    r = client.post("/v1/generations", files=files, data={"preview_size": "200"}, headers={"X-Engine-Token": "secret-de-test"})
    assert r.status_code == 200

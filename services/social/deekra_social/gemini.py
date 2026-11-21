"""Client minimal de l'API Gemini (REST generateContent).

- generate_image : image à partir d'un texte et d'images de référence.
- generate_json  : réponse JSON (contrôle qualité, légendes) à partir de texte et d'images.
"""

from __future__ import annotations

import base64
import json
import logging
import time
from dataclasses import dataclass

import requests

log = logging.getLogger(__name__)
API = "https://generativelanguage.googleapis.com/v1beta/models"
RETRY_STATUS = {429, 500, 502, 503, 504}


class GeminiError(RuntimeError):
    pass


@dataclass
class ImageInput:
    data: bytes
    mime: str = "image/jpeg"

    def part(self) -> dict:
        return {"inline_data": {"mime_type": self.mime, "data": base64.b64encode(self.data).decode()}}


class GeminiClient:
    def __init__(self, api_key: str, image_model: str, text_model: str,
                 session: requests.Session | None = None, timeout: int = 120,
                 retries: int = 3, backoff: float = 4.0):
        self._key = api_key
        self.image_model = image_model
        self.text_model = text_model
        self.http = session or requests.Session()
        self.timeout = timeout
        self.retries = retries
        self.backoff = backoff

    def _post(self, model: str, body: dict) -> dict:
        url = f"{API}/{model}:generateContent"
        for attempt in range(self.retries + 1):
            resp = self.http.post(url, json=body, timeout=self.timeout,
                                  headers={"x-goog-api-key": self._key})
            if resp.status_code == 200:
                return resp.json()
            if resp.status_code in RETRY_STATUS and attempt < self.retries:
                wait = self.backoff * (2 ** attempt)
                log.warning("Gemini %s : HTTP %s, nouvel essai dans %.0f s", model, resp.status_code, wait)
                time.sleep(wait)
                continue
            # Le corps d'erreur de Google ne contient pas la clé ; on le tronque quand même.
            raise GeminiError(f"Gemini {model} : HTTP {resp.status_code} {resp.text[:300]}")
        raise GeminiError("Gemini : nombre d'essais dépassé")

    @staticmethod
    def _parts(data: dict) -> list[dict]:
        cands = data.get("candidates") or []
        if not cands:
            raison = (data.get("promptFeedback") or {}).get("blockReason", "aucun résultat")
            raise GeminiError(f"Gemini : réponse vide ({raison})")
        return (cands[0].get("content") or {}).get("parts") or []

    def generate_image(self, prompt: str, refs: list[ImageInput] | None = None,
                       aspect_ratio: str = "4:5") -> bytes:
        parts: list[dict] = [{"text": prompt}] + [r.part() for r in (refs or [])]
        body = {
            "contents": [{"role": "user", "parts": parts}],
            "generationConfig": {
                "responseModalities": ["IMAGE"],
                "imageConfig": {"aspectRatio": aspect_ratio},
            },
        }
        for part in self._parts(self._post(self.image_model, body)):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                return base64.b64decode(inline["data"])
        raise GeminiError("Gemini : aucune image dans la réponse")

    def generate_json(self, prompt: str, images: list[ImageInput] | None = None) -> dict:
        parts: list[dict] = [{"text": prompt}] + [i.part() for i in (images or [])]
        body = {
            "contents": [{"role": "user", "parts": parts}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.7},
        }
        texte = "".join(p.get("text", "") for p in self._parts(self._post(self.text_model, body)))
        try:
            return json.loads(texte)
        except json.JSONDecodeError as exc:
            raise GeminiError(f"Gemini : JSON invalide ({exc})") from exc

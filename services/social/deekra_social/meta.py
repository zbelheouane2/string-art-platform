"""Publication Facebook (page) et Instagram (compte professionnel) via l'API Meta Graph.

Instagram exige une image accessible par URL publique : on publie d'abord la photo
sur la page Facebook, puis on donne à Instagram l'URL de cette photo hébergée par Meta.
Aucun hébergement supplémentaire n'est donc nécessaire.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass

import requests

log = logging.getLogger(__name__)


class MetaError(RuntimeError):
    pass


@dataclass
class Publication:
    facebook_post_id: str | None = None
    facebook_photo_id: str | None = None
    instagram_media_id: str | None = None


class MetaClient:
    def __init__(self, page_id: str, page_token: str, ig_user_id: str | None, version: str = "v24.0",
                 session: requests.Session | None = None, timeout: int = 60,
                 poll_interval: float = 3.0, poll_max: int = 40):
        self.page_id = page_id
        self._token = page_token
        self.ig_user_id = ig_user_id
        self.base = f"https://graph.facebook.com/{version}"
        self.http = session or requests.Session()
        self.timeout = timeout
        self.poll_interval = poll_interval
        self.poll_max = poll_max

    def _check(self, resp: requests.Response, quoi: str) -> dict:
        try:
            data = resp.json()
        except ValueError:
            data = {}
        if resp.status_code != 200 or "error" in data:
            err = data.get("error", {})
            # Le message d'erreur Meta ne contient pas le jeton.
            raise MetaError(f"{quoi} : HTTP {resp.status_code} {err.get('type', '')} {err.get('message', resp.text[:200])}")
        return data

    def publier_facebook(self, image: bytes, legende: str) -> Publication:
        resp = self.http.post(
            f"{self.base}/{self.page_id}/photos",
            data={"message": legende, "published": "true", "access_token": self._token},
            files={"source": ("visuel.jpg", image, "image/jpeg")},
            timeout=self.timeout,
        )
        data = self._check(resp, "Facebook photos")
        return Publication(facebook_post_id=data.get("post_id"), facebook_photo_id=data.get("id"))

    def url_photo(self, photo_id: str) -> str:
        resp = self.http.get(f"{self.base}/{photo_id}",
                             params={"fields": "images", "access_token": self._token}, timeout=self.timeout)
        images = self._check(resp, "Facebook URL photo").get("images") or []
        if not images:
            raise MetaError("Facebook : aucune URL pour la photo")
        return max(images, key=lambda i: i.get("width", 0))["source"]

    def publier_instagram(self, image_url: str, legende: str) -> str:
        if not self.ig_user_id:
            raise MetaError("Identifiant du compte Instagram absent")
        resp = self.http.post(f"{self.base}/{self.ig_user_id}/media",
                              data={"image_url": image_url, "caption": legende, "access_token": self._token},
                              timeout=self.timeout)
        conteneur = self._check(resp, "Instagram media")["id"]
        for _ in range(self.poll_max):
            resp = self.http.get(f"{self.base}/{conteneur}",
                                 params={"fields": "status_code", "access_token": self._token}, timeout=self.timeout)
            statut = self._check(resp, "Instagram statut").get("status_code")
            if statut == "FINISHED":
                break
            if statut in {"ERROR", "EXPIRED"}:
                raise MetaError(f"Instagram : conteneur {statut}")
            time.sleep(self.poll_interval)
        else:
            raise MetaError("Instagram : délai de préparation dépassé")
        resp = self.http.post(f"{self.base}/{self.ig_user_id}/media_publish",
                              data={"creation_id": conteneur, "access_token": self._token}, timeout=self.timeout)
        return self._check(resp, "Instagram publication")["id"]

    def publier(self, image: bytes, legende: str, instagram: bool = True) -> Publication:
        pub = self.publier_facebook(image, legende)
        log.info("Facebook publié : %s", pub.facebook_post_id)
        if instagram and self.ig_user_id:
            pub.instagram_media_id = self.publier_instagram(self.url_photo(pub.facebook_photo_id), legende)
            log.info("Instagram publié : %s", pub.instagram_media_id)
        return pub

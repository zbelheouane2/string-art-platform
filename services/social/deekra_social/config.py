"""Chargement de la configuration (fichiers JSON) et des secrets (variables d'environnement)."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]          # services/social
REPO = ROOT.parents[1]                               # racine du dépôt
CONFIG_DIR = ROOT / "config"
ASSETS_DIR = ROOT / "assets"


class ConfigError(RuntimeError):
    """Configuration ou secret manquant."""


def _load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


@dataclass(frozen=True)
class Settings:
    social: dict
    sujets: list[dict]
    occasions: list[dict]
    config_dir: Path
    produit: dict | None = None

    @classmethod
    def load(cls, config_dir: Path | None = None) -> "Settings":
        d = Path(config_dir) if config_dir else CONFIG_DIR
        social = _load_json(d / "social.json")
        sujets = _load_json(d / "sujets.json")["sujets"]
        occasions = _load_json(d / "occasions.json")["occasions"]
        produit_path = d / "produit.json"
        produit = _load_json(produit_path) if produit_path.exists() else {}
        settings = cls(social=social, sujets=sujets, occasions=occasions, config_dir=d, produit=produit)
        settings.validate()
        return settings

    def validate(self) -> None:
        ids = [s["id"] for s in self.sujets]
        if len(ids) != len(set(ids)):
            raise ConfigError("Identifiants de sujets en double")
        familles = {f for jour in self.semaine_type.values() for f in jour}
        presentes = {s["famille"] for s in self.sujets}
        manquantes = familles - presentes
        if manquantes:
            raise ConfigError(f"Aucun sujet pour les familles : {sorted(manquantes)}")
        for s in self.sujets:
            if s["rendu"] == "gemini" and not s.get("prompt"):
                raise ConfigError(f"Sujet {s['id']} : prompt manquant")
            if s["rendu"] == "carte" and not s.get("carte"):
                raise ConfigError(f"Sujet {s['id']} : gabarit de carte manquant")
        for jour, familles_jour in self.semaine_type.items():
            if len(familles_jour) != len(self.creneaux):
                raise ConfigError(f"semaine_type.{jour} doit avoir {len(self.creneaux)} entrées")

    def fiche_produit(self, refs: list[str]) -> str:
        """Description exacte des éléments du produit présents dans les références."""
        fiches = self.produit or {}
        lignes = [fiches[r] for r in refs if r in fiches]
        if lignes and fiches.get("planche"):
            lignes.append(fiches["planche"])
        return "\n".join(f"- {l}" for l in dict.fromkeys(lignes))

    @property
    def creneaux(self) -> dict[str, str]:
        return self.social["creneaux"]

    @property
    def semaine_type(self) -> dict[str, list[str]]:
        return {k: v for k, v in self.social["semaine_type"].items() if not k.startswith("_")}

    @property
    def portraits(self) -> list[str]:
        return self.social["rendus"]["portraits"]

    def rendu_path(self, nom: str, kind: str = "fil") -> Path:
        return REPO / self.social["rendus"]["dossier"] / f"{nom}-{kind}.webp"


def secret(name: str) -> str:
    """Lit un secret dans l'environnement ; ne l'affiche jamais."""
    value = os.environ.get(name, "").strip()
    if not value:
        raise ConfigError(f"Variable d'environnement {name} absente")
    return value


def autopublish_enabled() -> bool:
    return os.environ.get("SOCIAL_AUTOPUBLISH", "").strip().lower() == "true"

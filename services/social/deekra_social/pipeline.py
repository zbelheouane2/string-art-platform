"""Orchestration : plan → visuel → contrôle → légende → lot sur disque → publication."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path

from . import captions, compose
from .config import ASSETS_DIR, REPO, Settings
from .gemini import GeminiClient, GeminiError, ImageInput
from .meta import MetaClient
from .planning import Plan

log = logging.getLogger(__name__)


class GenerationEchouee(RuntimeError):
    pass


@dataclass
class Visuel:
    plan: Plan
    image: bytes
    legende: str
    description: str
    essais: list[dict] = field(default_factory=list)

    def meta(self) -> dict:
        return {
            "date": self.plan.date.isoformat(),
            "creneau": self.plan.creneau,
            "heure": self.plan.heure,
            "famille": self.plan.famille,
            "sujet": self.plan.sujet["id"],
            "brief": self.plan.sujet["brief"],
            "portrait": self.plan.portrait,
            "angle": self.plan.angle,
            "ambiance": self.plan.ambiance,
            "registre": self.plan.registre,
            "horaire": self.plan.horaire,
            "occasion": self.plan.occasion["nom"] if self.plan.occasion else None,
            "description": self.description,
            "legende": self.legende,
            "essais": self.essais,
            "statut": "a_valider",
        }


def _ref_images(settings: Settings, plan: Plan) -> list[ImageInput]:
    images = []
    for ref in plan.refs:
        if ref.startswith("portrait"):
            if plan.portrait:
                path = settings.rendu_path(plan.portrait)
                images.append(ImageInput(path.read_bytes(), "image/webp"))
        else:
            path = ASSETS_DIR / "references" / f"{ref}.jpg"
            images.append(ImageInput(path.read_bytes(), "image/jpeg"))
    return images


def _creneaux_avant(settings: Settings, creneau: str) -> set[str]:
    ordre = list(settings.creneaux)
    return set(ordre[: ordre.index(creneau)]) if creneau in ordre else set()


def _carte(settings: Settings, plan: Plan) -> bytes:
    sujet = plan.sujet
    portraits = settings.portraits
    base = plan.portrait or portraits[0]
    i = portraits.index(base) if base in portraits else 0
    autres = [portraits[(i + k) % len(portraits)] for k in range(4)]
    rendus = [settings.rendu_path(p) for p in autres]
    photos = [settings.rendu_path(base, "photo")] if sujet["carte"] == "avant_apres" else []
    ecran = None
    if sujet.get("ecran"):
        # Captures réelles du générateur, en alternance français / arabe.
        lang = ["fr", "ar"][plan.date.toordinal() % 2]
        ecran = REPO / settings.social["rendus"]["dossier"] / sujet["ecran"].format(lang=lang)
    page = compose.html_carte(sujet["carte"], sujet.get("texte", {}), settings.social["offre"], rendus, photos, ecran)
    sortie = settings.social["sortie"]
    return compose.rendre_html(page, sortie["largeur"], sortie["hauteur"], sortie["qualite_jpeg"])


def accroches_recentes(dossier: Path | None, date, creneaux_avant: set[str], jours: int = 30,
                       limite: int = 40) -> list[str]:
    """Accroches des légendes déjà produites (lots enregistrés), pour éviter les répétitions.

    Retient les visuels des `jours` jours précédents et ceux du jour même dont le créneau
    est dans `creneaux_avant`.
    """
    if not dossier or not Path(dossier).exists():
        return []
    import datetime as dt
    seuil = date - dt.timedelta(days=jours)
    sorties = []
    for f in sorted(Path(dossier).rglob("*.json"), reverse=True):
        try:
            jour = dt.date.fromisoformat(f.stem[:10])
        except ValueError:
            continue
        creneau = f.stem[11:]
        if not (seuil <= jour < date or (jour == date and creneau in creneaux_avant)):
            continue
        try:
            legende = json.loads(f.read_text(encoding="utf-8")).get("legende", "")
        except (ValueError, OSError):
            continue
        sorties += [l.strip() for l in legende.splitlines()[:2] if l.strip()]
        if len(sorties) >= limite:
            break
    return sorties[:limite]


def generer(settings: Settings, plan: Plan, gemini: GeminiClient, historique: Path | None = None) -> Visuel:
    sujet = plan.sujet
    sortie = settings.social["sortie"]
    essais: list[dict] = []

    if sujet["rendu"] == "carte":
        image = _carte(settings, plan)
        controle = gemini.generate_json(captions.prompt_controle(sujet), [ImageInput(image)])
        essais.append({"essai": 1, "conforme": bool(controle.get("conforme")), "problemes": controle.get("problemes", [])})
    else:
        cfg = settings.social["gemini"]
        refs = _ref_images(settings, plan)
        prompt = captions.prompt_image(sujet, avec_portrait=bool(plan.portrait),
                                       angle=plan.angle, ambiance=plan.ambiance,
                                       avec_produit=any(not r.startswith("portrait") for r in plan.refs),
                                       fiche=settings.fiche_produit(plan.refs))
        image = None
        for n in range(1, cfg["essais_max"] + 2):
            try:
                brute = gemini.generate_image(prompt, refs, cfg["ratio"])
            except GeminiError as exc:
                essais.append({"essai": n, "erreur": str(exc)})
                continue
            controle = gemini.generate_json(captions.prompt_controle(sujet), [ImageInput(brute)])
            ok = bool(controle.get("conforme"))
            essais.append({"essai": n, "conforme": ok, "problemes": controle.get("problemes", [])})
            if ok:
                image = compose.finaliser(brute, sortie["largeur"], sortie["hauteur"], sortie["qualite_jpeg"])
                break
        if image is None:
            raise GenerationEchouee(f"{plan.slug} : aucune image conforme après {len(essais)} essais ({essais})")

    description = controle.get("description", sujet["brief"])
    legende = None
    for _ in range(3):
        donnees = gemini.generate_json(
            captions.prompt_legende(
                sujet, settings.social["offre"], description, plan.occasion, plan.registre,
                settings.social.get("atouts", {}).get("liste"),
                accroches_recentes(historique, plan.date, _creneaux_avant(settings, plan.creneau),
                                   settings.social.get("variations", {}).get("historique_jours", 30)),
            ), [ImageInput(image)])
        try:
            legende = captions.assembler(donnees, settings.social)
            break
        except captions.LegendeInvalide as exc:
            log.warning("%s : légende refusée (%s), nouvel essai", plan.slug, exc)
    if legende is None:
        raise GenerationEchouee(f"{plan.slug} : aucune légende valide")
    return Visuel(plan, image, legende, description, essais)


def enregistrer(visuel: Visuel, dossier: Path) -> Path:
    dossier.mkdir(parents=True, exist_ok=True)
    base = dossier / visuel.plan.slug
    base.with_suffix(".jpg").write_bytes(visuel.image)
    base.with_suffix(".json").write_text(json.dumps(visuel.meta(), ensure_ascii=False, indent=2), encoding="utf-8")
    base.with_suffix(".txt").write_text(visuel.legende, encoding="utf-8")
    return base.with_suffix(".jpg")


def publier_fichier(meta: MetaClient, image_path: Path, instagram: bool = True) -> dict:
    """Publie un visuel déjà généré (lot validé) et met à jour son fichier JSON."""
    info_path = image_path.with_suffix(".json")
    info = json.loads(info_path.read_text(encoding="utf-8"))
    if info.get("statut") == "publie":
        raise RuntimeError(f"{image_path.name} est déjà publié")
    legende = image_path.with_suffix(".txt").read_text(encoding="utf-8").strip()
    pub = meta.publier(image_path.read_bytes(), legende, instagram=instagram)
    info.update(statut="publie", facebook_post_id=pub.facebook_post_id,
                facebook_photo_id=pub.facebook_photo_id, instagram_media_id=pub.instagram_media_id)
    info_path.write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding="utf-8")
    return info

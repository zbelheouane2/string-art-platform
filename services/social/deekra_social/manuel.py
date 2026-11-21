"""Mode semi-automatique (gratuit) : sans clé API Gemini.

1. `preparer` : pour une date, rend directement les cartes de marque et écrit une fiche
   de prompts détaillés pour les visuels à générer dans l'application Gemini, avec la
   liste des images de référence à joindre.
2. Le propriétaire génère les images dans l'application et les transmet.
3. `importer` : recadre au format 1080 × 1350, pose le logo, enregistre la légende
   (vérifiée) et marque le visuel « à valider ».
4. `valider` : après accord du propriétaire, le visuel passe « validé ».
5. La tâche planifiée publie à l'heure du créneau les visuels validés du jour.
"""

from __future__ import annotations

import datetime as dt
import json
import shutil
from pathlib import Path

from . import captions, compose, pipeline
from .config import ASSETS_DIR, Settings
from .planning import Plan, plan_jour

STATUTS = ("a_generer", "a_valider", "valide", "publie")

INTENTIONS = {
    "creatif": "Visuel artistique qui fait découvrir la matière du produit (fil, clous, lignes) et la culture algérienne.",
    "pack": "Montrer le kit DeeKra réel (boîte kraft, planche aux clous laiton, bobine sur dévidoir, support) dans une scène neuve.",
    "resultat": "Montrer le portrait en fil terminé, mis en valeur dans un intérieur.",
    "emotion": "Faire ressentir l'émotion du cadeau et du souvenir.",
    "guide": "Rassurer : c'est simple, guidé, sans talent artistique.",
    "atout": "Mettre en avant un point fort du produit.",
    "offre": "Donner envie de commander.",
    "communaute": "Faire réagir la communauté.",
    "occasion": "Visuel de l'occasion du calendrier algérien.",
}


def _meta_plan(plan: Plan) -> dict:
    return {
        "date": plan.date.isoformat(), "creneau": plan.creneau, "heure": plan.heure,
        "famille": plan.famille, "sujet": plan.sujet["id"], "brief": plan.sujet["brief"],
        "rendu": plan.sujet["rendu"], "portrait": plan.portrait, "angle": plan.angle,
        "ambiance": plan.ambiance, "registre": plan.registre, "horaire": plan.horaire,
        "occasion": plan.occasion["nom"] if plan.occasion else None,
        "commercial": plan.sujet.get("commercial", True), "cta": plan.sujet.get("cta"),
    }


def references(settings: Settings, plan: Plan) -> list[tuple[str, Path]]:
    """Images à joindre dans l'application Gemini : (description, chemin)."""
    refs = []
    for ref in plan.refs:
        if ref.startswith("portrait"):
            if plan.portrait:
                refs.append((f"vrai rendu du moteur DeeKra (portrait « {plan.portrait} »)", settings.rendu_path(plan.portrait)))
        else:
            refs.append((f"notre produit ({ref})", ASSETS_DIR / "references" / f"{ref}.jpg"))
    return refs


def prompt_detaille(settings: Settings, plan: Plan) -> str:
    refs = references(settings, plan)
    base = captions.prompt_image(plan.sujet, avec_portrait=bool(plan.portrait), angle=plan.angle,
                                 ambiance=plan.ambiance, avec_produit=any(not r.startswith("portrait") for r in plan.refs),
                                 fiche=settings.fiche_produit(plan.refs))
    joint = ""
    if refs:
        liste = "; ".join(f"image {i}: {d}" for i, (d, _) in enumerate(refs, 1))
        joint = f"\n\nAttached reference images ({liste})."
    return (
        f"Create one photorealistic image, vertical 4:5 (1080 x 1350 px).\n\n{base}{joint}\n\n"
        "Quality: high-end commercial photography, natural skin tones, realistic hands with five fingers, "
        "accurate perspective, fine details on the black threads and brass nails, no distortion of the product."
    )


def preparer(settings: Settings, date: dt.date, lots: Path) -> Path:
    """Rend les cartes, écrit la fiche de prompts du jour. Retourne le chemin de la fiche."""
    dossier = lots / date.isoformat()
    dossier.mkdir(parents=True, exist_ok=True)
    refs_dir = dossier / "references"
    lignes = [f"# Visuels DeeKra du {date.strftime('%d/%m/%Y')}", ""]
    for plan in plan_jour(settings, date):
        info = _meta_plan(plan)
        base = dossier / plan.slug
        existant = json.loads(base.with_suffix(".json").read_text(encoding="utf-8")) if base.with_suffix(".json").exists() else {}
        garder = existant.get("statut") in {"valide", "publie"} or (existant.get("statut") == "a_valider" and existant.get("legende"))
        titre = f"## {plan.heure} · {plan.famille} · {plan.sujet['id']}"
        if plan.occasion:
            titre += f" · {plan.occasion['nom']}"
        lignes += [titre, "", f"**Objectif :** {INTENTIONS.get(plan.famille, '')} {plan.sujet['brief']}", ""]
        if garder:
            lignes += [f"Déjà prêt (statut : {existant['statut']}).", ""]
            continue
        if plan.sujet["rendu"] == "carte":
            image = pipeline._carte(settings, plan)
            base.with_suffix(".jpg").write_bytes(image)
            info["statut"] = "a_valider"
            info["legende"] = ""
            lignes += ["Carte de marque préparée automatiquement : rien à générer.", ""]
        else:
            info["statut"] = "a_generer"
            refs = references(settings, plan)
            if refs:
                refs_dir.mkdir(exist_ok=True)
                lignes.append("**Images à joindre dans Gemini, dans cet ordre :**")
                for i, (desc, src) in enumerate(refs, 1):
                    cible = refs_dir / f"{plan.creneau}-{i}{src.suffix}"
                    shutil.copyfile(src, cible)
                    lignes.append(f"{i}. `{cible.name}` : {desc}")
                lignes.append("")
            lignes += ["**Prompt à coller :**", "", "```", prompt_detaille(settings, plan), "```", ""]
        base.with_suffix(".json").write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding="utf-8")
    fiche = dossier / "prompts.md"
    fiche.write_text("\n".join(lignes), encoding="utf-8")
    return fiche


def importer(settings: Settings, date: dt.date, creneau: str, lots: Path,
             image: Path | None, legende: str) -> Path:
    """Enregistre le visuel (si fourni) et sa légende ; statut « à valider »."""
    base = lots / date.isoformat() / f"{date.isoformat()}-{creneau}"
    info_path = base.with_suffix(".json")
    if not info_path.exists():
        raise FileNotFoundError(f"Lancez d'abord « preparer » pour le {date}")
    info = json.loads(info_path.read_text(encoding="utf-8"))
    if info.get("statut") == "publie":
        raise RuntimeError("Visuel déjà publié")
    sortie = settings.social["sortie"]
    if image is not None:
        data = compose.finaliser(Path(image).read_bytes(), sortie["largeur"], sortie["hauteur"], sortie["qualite_jpeg"])
        base.with_suffix(".jpg").write_bytes(data)
    elif not base.with_suffix(".jpg").exists():
        raise FileNotFoundError("Aucune image pour ce créneau")
    texte = legende.strip()
    captions.verifier(texte, settings.social)
    for tag in settings.social["hashtags_fixes"]:
        if tag.lower() not in texte.lower():
            raise captions.LegendeInvalide(f"Hashtag de marque manquant : {tag}")
    base.with_suffix(".txt").write_text(texte, encoding="utf-8")
    info.update(statut="a_valider", legende=texte)
    info_path.write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding="utf-8")
    return base.with_suffix(".jpg")


def valider(lots: Path, date: dt.date, creneaux: list[str]) -> list[str]:
    faits = []
    for c in creneaux:
        info_path = lots / date.isoformat() / f"{date.isoformat()}-{c}.json"
        info = json.loads(info_path.read_text(encoding="utf-8"))
        if info.get("statut") != "a_valider" or not info.get("legende"):
            raise RuntimeError(f"{info_path.stem} n'est pas prêt (statut {info.get('statut')})")
        if not info_path.with_suffix(".jpg").exists():
            raise RuntimeError(f"{info_path.stem} : image manquante")
        info["statut"] = "valide"
        info_path.write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding="utf-8")
        faits.append(info_path.stem)
    return faits


def a_publier(lots: Path, date: dt.date, creneau: str) -> Path | None:
    """Visuel validé du créneau, s'il existe."""
    base = lots / date.isoformat() / f"{date.isoformat()}-{creneau}"
    info_path = base.with_suffix(".json")
    if not info_path.exists():
        return None
    info = json.loads(info_path.read_text(encoding="utf-8"))
    if info.get("statut") == "valide" and base.with_suffix(".jpg").exists():
        return base.with_suffix(".jpg")
    return None

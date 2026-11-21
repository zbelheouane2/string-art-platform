"""Choix des sujets du jour : semaine type, occasions, rotation et variations.

Le choix est déterministe : pour une date et un créneau donnés, on obtient
toujours le même plan. On peut donc relancer une génération sans changer le
plan, et la rotation garantit qu'un sujet ne revient pas avant que tous ceux
de sa famille soient passés. À chaque retour, il change d'angle de vue,
d'ambiance (saison) et de registre de légende.
"""

from __future__ import annotations

import datetime as dt
from dataclasses import dataclass, field

from .config import Settings

JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
EPOQUE = dt.date(2026, 1, 3)  # un samedi : origine des rotations
SAISONS = {12: "hiver", 1: "hiver", 2: "hiver", 3: "printemps", 4: "printemps", 5: "printemps",
           6: "ete", 7: "ete", 8: "ete", 9: "automne", 10: "automne", 11: "automne"}
# Prompts qui imposent déjà leur cadrage : on n'ajoute pas d'angle de vue.
CADRAGES_IMPOSES = ("top-down", "flat lay", "macro", "close-up", "knolling", "split composition",
                    "over-the-shoulder", "product photograph")


@dataclass(frozen=True)
class Plan:
    date: dt.date
    creneau: str
    heure: str
    famille: str
    sujet: dict
    portrait: str | None = None
    occasion: dict | None = None
    refs: list[str] = field(default_factory=list)
    angle: str | None = None
    ambiance: str | None = None
    registre: str | None = None
    horaire: str = "normal"

    @property
    def slug(self) -> str:
        return f"{self.date.isoformat()}-{self.creneau}"

    def resume(self) -> str:
        occ = f" [{self.occasion['nom']}]" if self.occasion else ""
        por = f" · portrait {self.portrait}" if self.portrait else ""
        ang = f" · angle « {self.angle} »" if self.angle else ""
        return f"{self.date} {self.heure} {self.famille:<10} {self.sujet['id']}{occ}{por}{ang} · légende : {self.registre}"


def horaire_du_jour(settings: Settings, date: dt.date) -> tuple[str, dict[str, str]]:
    """Horaires des créneaux (normaux ou spéciaux, par exemple pendant le Ramadan)."""
    for h in settings.social.get("horaires_speciaux", []):
        if dt.date.fromisoformat(h["debut"]) <= date <= dt.date.fromisoformat(h["fin"]):
            return h["nom"], h["creneaux"]
    return "normal", settings.creneaux


def famille_du_creneau(settings: Settings, date: dt.date, creneau: str) -> str:
    jour = JOURS[date.weekday()]
    index = list(settings.creneaux).index(creneau)
    return settings.semaine_type[jour][index]


def _occurrences(settings: Settings, date: dt.date, creneau: str, famille: str) -> int:
    """Nombre de fois où la famille est apparue avant (date, créneau) depuis l'époque."""
    creneaux = list(settings.creneaux)
    stop = creneaux.index(creneau)
    jours = (date - EPOQUE).days
    if jours < 0:
        raise ValueError(f"Date antérieure à {EPOQUE}")
    par_semaine = sum(f == famille for familles in settings.semaine_type.values() for f in familles)
    semaines, reste = divmod(jours, 7)
    total = semaines * par_semaine
    for i in range(reste):
        jour = JOURS[(EPOQUE + dt.timedelta(days=semaines * 7 + i)).weekday()]
        total += sum(f == famille for f in settings.semaine_type[jour])
    total += sum(f == famille for f in settings.semaine_type[JOURS[date.weekday()]][:stop])
    return total


def _fenetre(settings: Settings, occ: dict) -> tuple[dt.date, dt.date]:
    jour_j = dt.date.fromisoformat(occ["date"])
    avant = occ.get("jours_avant", settings.social["occasion"]["jours_avant"])
    fin = dt.date.fromisoformat(occ["fin"]) if occ.get("fin") else jour_j
    return jour_j - dt.timedelta(days=avant), max(fin, jour_j)


def _jour_retenu(occ: dict, debut: dt.date, date: dt.date) -> bool:
    """Pour les longues saisons, seulement quelques soirs par semaine, bien répartis."""
    n = occ.get("jours_par_semaine")
    if not n or n >= 7:
        return True
    offsets = {round(i * 7 / n) for i in range(n)}
    return (date - debut).days % 7 in offsets


def occasion_active(settings: Settings, date: dt.date, creneau: str) -> dict | None:
    if creneau != settings.social["occasion"]["creneau"]:
        return None
    actives = []
    for occ in settings.occasions:
        debut, fin = _fenetre(settings, occ)
        if debut <= date <= fin and _jour_retenu(occ, debut, date):
            proximite = abs((dt.date.fromisoformat(occ["date"]) - date).days)
            actives.append((-occ.get("priorite", 1), proximite, occ["id"], occ))
    return min(actives)[3] if actives else None


def _choisir_portrait(settings: Settings, refs: list[str], rang: int) -> str | None:
    for ref in refs:
        if ref == "portrait":
            portraits = settings.portraits
            return portraits[rang % len(portraits)]
        if ref.startswith("portrait:"):
            return ref.split(":", 1)[1]
    return None


def _variations(settings: Settings, sujet: dict, date: dt.date, passage: int, rang_global: int):
    var = settings.social.get("variations", {})
    angles = var.get("angles", [])
    registres = var.get("registres_legende", [])
    angle = ambiance = None
    if sujet["rendu"] == "gemini":
        prompt = sujet["prompt"].lower()
        if angles and not any(c in prompt for c in CADRAGES_IMPOSES):
            # Décalage propre à chaque sujet pour que deux sujets d'un même jour n'aient pas le même angle.
            decalage = sum(map(ord, sujet["id"]))
            angle = angles[(passage + decalage) % len(angles)]
        ambiance = var.get("ambiances_saison", {}).get(SAISONS[date.month])
    # Créneaux consécutifs : registres différents ; décalage d'un cran chaque semaine pour
    # qu'une même famille (même jour, même créneau) ne garde pas toujours le même registre.
    semaine = (date - EPOQUE).days // 7
    registre = registres[(rang_global + semaine) % len(registres)] if registres else None
    return angle, ambiance, registre


def plan_creneau(settings: Settings, date: dt.date, creneau: str) -> Plan:
    if creneau not in settings.creneaux:
        raise ValueError(f"Créneau inconnu : {creneau}")
    horaire, heures = horaire_du_jour(settings, date)
    heure = heures.get(creneau, settings.creneaux[creneau])
    rang_global = (date - EPOQUE).days * len(settings.creneaux) + list(settings.creneaux).index(creneau)
    if rang_global < 0:
        raise ValueError(f"Date antérieure à {EPOQUE}")

    occasion = occasion_active(settings, date, creneau)
    if occasion:
        debut, _ = _fenetre(settings, occasion)
        passage = sum(_jour_retenu(occasion, debut, debut + dt.timedelta(days=i))
                      for i in range((date - debut).days))
        variante = occasion["variantes"][passage % len(occasion["variantes"])]
        commercial = occasion.get("commercial", True)
        sujet = {
            "id": f"occasion-{occasion['id']}-{passage % len(occasion['variantes']) + 1}",
            "famille": "occasion",
            "rendu": "gemini",
            "brief": occasion["brief"],
            "prompt": variante["prompt"],
            "refs": variante.get("refs", []),
            "cta": "commande" if commercial else "partage",
            "commercial": commercial,
        }
        refs = list(sujet["refs"])
        angle, ambiance, registre = _variations(settings, sujet, date, passage, rang_global)
        return Plan(date, creneau, heure, "occasion", sujet, _choisir_portrait(settings, refs, rang_global),
                    occasion, refs, angle, ambiance, registre, horaire)

    famille = famille_du_creneau(settings, date, creneau)
    candidats = [s for s in settings.sujets if s["famille"] == famille]
    rang = _occurrences(settings, date, creneau, famille)
    sujet = candidats[rang % len(candidats)]
    passage = rang // len(candidats)  # combien de fois ce sujet est déjà passé
    refs = list(sujet.get("refs", []))
    portrait = _choisir_portrait(settings, refs, rang_global)
    if sujet["rendu"] == "carte" and sujet["carte"] in {"avant_apres", "devinette"}:
        portrait = _portrait_avec_photo(settings, rang_global)
    angle, ambiance, registre = _variations(settings, sujet, date, passage, rang_global)
    return Plan(date, creneau, heure, famille, sujet, portrait, None, refs, angle, ambiance, registre, horaire)


def _portrait_avec_photo(settings: Settings, rang: int) -> str:
    avec_photo = [p for p in settings.portraits if settings.rendu_path(p, "photo").exists()]
    pool = avec_photo or settings.portraits
    return pool[rang % len(pool)]


def plan_jour(settings: Settings, date: dt.date) -> list[Plan]:
    return [plan_creneau(settings, date, c) for c in settings.creneaux]

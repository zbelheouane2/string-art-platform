"""Ligne de commande.

  python -m deekra_social plan    [--date AAAA-MM-JJ] [--jours N]
  python -m deekra_social lot     [--date AAAA-MM-JJ] [--creneau midi] --sortie DOSSIER
  python -m deekra_social apercu  --sujet ID [--portrait NOM] --sortie DOSSIER   (cartes seulement, sans API)
  python -m deekra_social publier FICHIER.jpg --oui
  python -m deekra_social auto    --creneau midi --sortie DOSSIER

Mode semi-automatique (sans clé Gemini) :
  python -m deekra_social preparer  --date AAAA-MM-JJ --sortie DOSSIER
  python -m deekra_social importer  --date AAAA-MM-JJ --creneau midi --legende FICHIER.txt [--image IMAGE] --sortie DOSSIER
  python -m deekra_social valider   --date AAAA-MM-JJ [--creneau midi ...] --sortie DOSSIER
  python -m deekra_social programme --creneau midi --sortie DOSSIER   (tâche planifiée)
"""

from __future__ import annotations

import argparse
import datetime as dt
import logging
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

from . import pipeline
from .config import ConfigError, Settings, autopublish_enabled, secret
from .gemini import GeminiClient
from .meta import MetaClient
from .planning import Plan, plan_creneau, plan_jour

log = logging.getLogger("deekra_social")


def _aujourdhui(settings: Settings) -> dt.date:
    return dt.datetime.now(ZoneInfo(settings.social["fuseau"])).date()


def _gemini(settings: Settings) -> GeminiClient:
    cfg = settings.social["gemini"]
    return GeminiClient(secret("GEMINI_API_KEY"), cfg["modele_image"], cfg["modele_texte"])


def _meta(settings: Settings) -> MetaClient:
    import os
    return MetaClient(secret("META_PAGE_ID"), secret("META_PAGE_TOKEN"),
                      os.environ.get("META_IG_USER_ID") or None, settings.social["meta"]["version_graph"])


def cmd_plan(settings: Settings, args) -> int:
    debut = args.date or _aujourdhui(settings)
    for j in range(args.jours):
        for p in plan_jour(settings, debut + dt.timedelta(days=j)):
            print(p.resume())
    return 0


def cmd_lot(settings: Settings, args) -> int:
    date = args.date or _aujourdhui(settings)
    plans = [plan_creneau(settings, date, args.creneau)] if args.creneau else plan_jour(settings, date)
    gemini = _gemini(settings)
    erreurs = 0
    for p in plans:
        log.info("Génération %s", p.resume())
        try:
            v = pipeline.generer(settings, p, gemini, historique=Path(args.sortie))
            print(pipeline.enregistrer(v, Path(args.sortie) / date.isoformat()))
        except Exception as exc:  # un échec n'empêche pas les autres créneaux
            erreurs += 1
            log.error("%s : %s", p.slug, exc)
    return 1 if erreurs else 0


def cmd_apercu(settings: Settings, args) -> int:
    from . import compose
    sujet = next((s for s in settings.sujets if s["id"] == args.sujet), None)
    if not sujet or sujet["rendu"] != "carte":
        log.error("Sujet de type carte introuvable : %s", args.sujet)
        return 2
    date = _aujourdhui(settings)
    p = Plan(date, "apercu", "", sujet["famille"], sujet, args.portrait or settings.portraits[0], None, [])
    image = pipeline._carte(settings, p)
    out = Path(args.sortie)
    out.mkdir(parents=True, exist_ok=True)
    (out / f"{sujet['id']}.jpg").write_bytes(image)
    print(out / f"{sujet['id']}.jpg")
    return 0


def cmd_publier(settings: Settings, args) -> int:
    if not args.oui:
        log.error("Ajoutez --oui pour confirmer la publication publique.")
        return 2
    info = pipeline.publier_fichier(_meta(settings), Path(args.fichier), instagram=not args.sans_instagram)
    print(info.get("facebook_post_id"), info.get("instagram_media_id"))
    return 0


def cmd_auto(settings: Settings, args) -> int:
    """Utilisé par la tâche planifiée : génère le créneau, publie seulement si SOCIAL_AUTOPUBLISH=true."""
    date = _aujourdhui(settings)
    p = plan_creneau(settings, date, args.creneau)
    if args.horaire and args.horaire != p.horaire:
        log.info("Horaire %s inactif aujourd'hui (%s) : rien à faire", args.horaire, p.horaire)
        return 0
    v = pipeline.generer(settings, p, _gemini(settings), historique=Path(args.sortie))
    chemin = pipeline.enregistrer(v, Path(args.sortie) / date.isoformat())
    if not autopublish_enabled():
        log.info("Publication automatique désactivée : visuel enregistré dans %s", chemin)
        return 0
    info = pipeline.publier_fichier(_meta(settings), chemin)
    log.info("Publié : Facebook %s, Instagram %s", info.get("facebook_post_id"), info.get("instagram_media_id"))
    return 0


def cmd_preparer(settings: Settings, args) -> int:
    from . import manuel
    print(manuel.preparer(settings, args.date or _aujourdhui(settings) + dt.timedelta(days=1), Path(args.sortie)))
    return 0


def cmd_importer(settings: Settings, args) -> int:
    from . import manuel
    legende = Path(args.legende).read_text(encoding="utf-8")
    print(manuel.importer(settings, args.date, args.creneau, Path(args.sortie), args.image, legende))
    return 0


def cmd_valider(settings: Settings, args) -> int:
    from . import manuel
    creneaux = args.creneau or list(settings.creneaux)
    for f in manuel.valider(Path(args.sortie), args.date, creneaux):
        print("validé :", f)
    return 0


def cmd_programme(settings: Settings, args) -> int:
    """Tâche planifiée : publie le visuel validé du créneau ; sinon, génère et publie si l'automatique est activé."""
    from . import manuel
    date = _aujourdhui(settings)
    p = plan_creneau(settings, date, args.creneau)
    if args.horaire and args.horaire != p.horaire:
        log.info("Horaire %s inactif aujourd'hui (%s) : rien à faire", args.horaire, p.horaire)
        return 0
    chemin = manuel.a_publier(Path(args.sortie), date, args.creneau)
    if chemin:
        info = pipeline.publier_fichier(_meta(settings), chemin)
        log.info("Publié : Facebook %s, Instagram %s", info.get("facebook_post_id"), info.get("instagram_media_id"))
        return 0
    if autopublish_enabled():
        return cmd_auto(settings, args)
    log.info("Aucun visuel validé pour %s %s : rien à publier", date, args.creneau)
    return 0


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    parser = argparse.ArgumentParser(prog="deekra_social")
    parser.add_argument("--config", type=Path, default=None)
    sub = parser.add_subparsers(dest="cmd", required=True)
    date = lambda s: dt.date.fromisoformat(s)  # noqa: E731

    sp = sub.add_parser("plan"); sp.add_argument("--date", type=date); sp.add_argument("--jours", type=int, default=7)
    sl = sub.add_parser("lot"); sl.add_argument("--date", type=date); sl.add_argument("--creneau"); sl.add_argument("--sortie", required=True)
    sa = sub.add_parser("apercu"); sa.add_argument("--sujet", required=True); sa.add_argument("--portrait"); sa.add_argument("--sortie", required=True)
    su = sub.add_parser("publier"); su.add_argument("fichier"); su.add_argument("--oui", action="store_true"); su.add_argument("--sans-instagram", action="store_true")
    sx = sub.add_parser("auto"); sx.add_argument("--creneau", required=True); sx.add_argument("--sortie", required=True)
    sx.add_argument("--horaire", help="normal ou nom d'un horaire spécial (Ramadan) : le lancement ne fait rien si cet horaire n'est pas actif")

    sr = sub.add_parser("preparer"); sr.add_argument("--date", type=date); sr.add_argument("--sortie", required=True)
    si = sub.add_parser("importer"); si.add_argument("--date", type=date, required=True); si.add_argument("--creneau", required=True)
    si.add_argument("--image", type=Path); si.add_argument("--legende", required=True); si.add_argument("--sortie", required=True)
    sv = sub.add_parser("valider"); sv.add_argument("--date", type=date, required=True); sv.add_argument("--creneau", action="append"); sv.add_argument("--sortie", required=True)
    sg = sub.add_parser("programme"); sg.add_argument("--creneau", required=True); sg.add_argument("--sortie", required=True); sg.add_argument("--horaire")

    args = parser.parse_args(argv)
    try:
        settings = Settings.load(args.config)
        return {"plan": cmd_plan, "lot": cmd_lot, "apercu": cmd_apercu,
                "publier": cmd_publier, "auto": cmd_auto, "preparer": cmd_preparer,
                "importer": cmd_importer, "valider": cmd_valider, "programme": cmd_programme}[args.cmd](settings, args)
    except ConfigError as exc:
        log.error("%s", exc)
        return 2


if __name__ == "__main__":
    sys.exit(main())

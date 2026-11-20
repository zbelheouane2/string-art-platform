"""Mise en forme finale des visuels.

- finaliser : recadre l'image Gemini au format 1080 × 1350 et pose le logo.
- carte     : gabarit HTML aux couleurs DeeKra, rendu en image par Chromium (Playwright).
  Les textes posés sur les cartes viennent de la configuration, jamais de l'IA.
"""

from __future__ import annotations

import base64
import html
import io
import os
from pathlib import Path

from PIL import Image, ImageStat

from .config import ASSETS_DIR

COULEURS = {
    "paper": "#ffffff", "plaster": "#f1f0ec", "ink": "#1a1916",
    "ink_soft": "#55524c", "emerald": "#0e5443", "brass": "#a9803f",
}


def _cover(img: Image.Image, w: int, h: int) -> Image.Image:
    ratio = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * ratio), round(img.height * ratio)), Image.LANCZOS)
    left, top = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((left, top, left + w, top + h))


def _logo_pour(fond: Image.Image) -> Image.Image:
    lum = ImageStat.Stat(fond.convert("L")).mean[0]
    nom = "logo-encre.png" if lum > 140 else "logo-creme.png"
    return Image.open(ASSETS_DIR / "logo" / nom).convert("RGBA")


def finaliser(data: bytes, largeur: int = 1080, hauteur: int = 1350, qualite: int = 90,
              logo: bool = True) -> bytes:
    img = _cover(Image.open(io.BytesIO(data)).convert("RGB"), largeur, hauteur)
    if logo:
        marge = round(largeur * 0.045)
        lw = round(largeur * 0.2)
        zone = img.crop((largeur - marge - lw, marge, largeur - marge, marge + lw // 2))
        lg = _logo_pour(zone)
        lg = lg.resize((lw, round(lg.height * lw / lg.width)), Image.LANCZOS)
        base = img.convert("RGBA")
        base.alpha_composite(lg, (largeur - marge - lw, marge))
        img = base.convert("RGB")
    out = io.BytesIO()
    img.save(out, "JPEG", quality=qualite, optimize=True, progressive=True)
    return out.getvalue()


def _data_uri(path: Path) -> str:
    mime = {".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg"}[path.suffix]
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


CSS = """
@import url('https://fonts.googleapis.com/css2?family=Young+Serif&family=Figtree:wght@400;600&family=Noto+Naskh+Arabic:wght@600&family=Alexandria:wght@400;600&display=block');
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 1080px; height: 1350px; overflow: hidden; }
body { background: %(plaster)s; color: %(ink)s; font-family: Figtree, system-ui, sans-serif;
       display: flex; flex-direction: column; padding: 72px 76px 64px; position: relative; }
.logo { position: absolute; top: 40px; inset-inline-end: 52px; width: 260px; }
.fr { font-family: 'Young Serif', Georgia, serif; font-size: 66px; line-height: 1.1; max-width: 760px; }
.ar { font-family: 'Noto Naskh Arabic', 'Alexandria', serif; font-size: 58px; line-height: 1.5;
      direction: rtl; text-align: right; color: %(emerald)s; }
.sous { font-size: 30px; color: %(ink_soft)s; line-height: 1.4; }
.sous-ar { font-family: Alexandria, sans-serif; font-size: 28px; color: %(ink_soft)s; direction: rtl; text-align: right; }
.rond { border-radius: 50%%; background: #fff; box-shadow: 0 18px 50px rgba(26,25,22,.14); object-fit: cover; }
.planche { background: #fff; border-radius: 28px; padding: 26px; box-shadow: 0 18px 50px rgba(26,25,22,.12); }
.planche img { display: block; width: 100%%; }
.grow { flex: 1; display: flex; align-items: center; justify-content: center; gap: 40px; }
.pied { display: flex; justify-content: space-between; align-items: center; gap: 24px;
        border-top: 2px solid rgba(26,25,22,.12); padding-top: 26px; font-size: 26px; color: %(ink_soft)s; }
.pied .ar-pied { font-family: Alexandria, sans-serif; direction: rtl; }
.clou { width: 14px; height: 14px; border-radius: 50%%; background: %(brass)s; display: inline-block; }
.pill { background: %(emerald)s; color: #fff; border-radius: 999px; padding: 18px 40px; font-weight: 600; font-size: 34px; white-space: nowrap; }
.num { font-family: 'Young Serif', serif; font-size: 92px; color: %(emerald)s; line-height: 1; }
.etape { display: flex; gap: 34px; align-items: center; padding: 30px 0; border-bottom: 2px solid rgba(26,25,22,.1); }
.etape .t { font-size: 46px; font-weight: 600; } .etape .d { font-size: 32px; color: %(ink_soft)s; margin-top: 6px; }
.etape .a { font-family: Alexandria, sans-serif; font-size: 32px; color: %(emerald)s; direction: rtl; margin-top: 6px; }
.liste { list-style: none; font-size: 34px; } .liste li { padding: 18px 0; border-bottom: 2px solid rgba(26,25,22,.1); display: flex; gap: 22px; align-items: center; }
.prix { font-family: 'Young Serif', serif; font-size: 96px; color: %(ink)s; white-space: nowrap; }
.badge { position: absolute; font-family: 'Young Serif', serif; font-size: 44px; background: %(ink)s; color: #fff;
         width: 84px; height: 84px; border-radius: 50%%; display: flex; align-items: center; justify-content: center; }
""" % COULEURS


def _page(corps: str, logo: bool = True) -> str:
    lg = f'<img class="logo" src="{_data_uri(ASSETS_DIR / "logo" / "logo-encre.png")}" alt="">' if logo else ""
    return f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{lg}{corps}</body></html>'


def _fr(texte: str) -> str:
    """Échappe le texte et applique l'espace insécable française avant ? ! : ;"""
    t = html.escape(texte)
    for signe in "?!:;":
        t = t.replace(f" {signe}", f"&nbsp;{signe}")
    return t


def _titres(texte: dict, top: int = 120) -> str:
    fr = _fr(texte.get("fr", ""))
    ar = html.escape(texte.get("ar", ""))
    return f'<div style="margin-top:{top}px"><div class="fr">{fr}</div><div class="ar" style="margin-top:14px">{ar}</div></div>'


def _pied(offre: dict) -> str:
    return (f'<div class="pied"><span><span class="clou"></span>&nbsp; {html.escape(offre["paiement"])}</span>'
            f'<span class="ar-pied">{html.escape(offre["paiement_ar"])}</span></div>')


def html_carte(gabarit: str, texte: dict, offre: dict, rendus: list[Path], photos: list[Path],
               ecran: Path | None = None) -> str:
    """Construit le HTML d'une carte. rendus/photos : chemins des vrais rendus et photos sources."""
    r = [_data_uri(p) for p in rendus]
    ph = [_data_uri(p) for p in photos]
    prix = html.escape(offre["prix"]) if offre.get("afficher_prix") else ""

    if gabarit == "avant_apres":
        corps = _titres(texte) + f"""
        <div class="grow" style="gap:28px">
          <div style="text-align:center"><img class="rond" src="{ph[0]}" style="width:330px;height:330px"><div class="sous" style="margin-top:18px">Photo · صورة</div></div>
          <svg width="90" height="40" viewBox="0 0 90 40"><path d="M2 20h80m-16-14 16 14-16 14" stroke="{COULEURS['brass']}" stroke-width="5" fill="none" stroke-linecap="round"/></svg>
          <div style="text-align:center"><div class="planche" style="width:470px"><img src="{r[0]}"></div><div class="sous" style="margin-top:18px">En fil · بالخيط</div></div>
        </div>""" + _pied(offre)
    elif gabarit == "chiffres":
        stats = [("240", "clous déjà posés", "مسمار جاهز"), ("1", "seul fil continu", "خيط واحد"), ("4–6 h", "de calme, guidé", "ساعات من الهدوء")]
        lignes = "".join(f'<div style="text-align:center;flex:1"><div class="num">{a}</div><div class="sous">{b}</div><div class="sous-ar" style="text-align:center">{c}</div></div>' for a, b, c in stats)
        corps = _titres(texte) + f"""
        <div class="grow"><div class="planche" style="width:600px"><img src="{r[0]}"></div></div>
        <div style="display:flex;gap:20px;margin-bottom:34px">{lignes}</div>""" + _pied(offre)
    elif gabarit == "galerie":
        cases = "".join(f'<div class="planche" style="padding:16px"><img src="{u}"></div>' for u in r[:4])
        corps = _titres(texte) + f"""
        <div class="grow"><div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;width:820px">{cases}</div></div>
        <div class="sous" style="text-align:center;margin-bottom:24px">Rendus réels de notre logiciel · نتائج حقيقية من برنامجنا</div>""" + _pied(offre)
    elif gabarit == "etapes":
        etapes = [("Saisissez le code", "imprimé dans la boîte", "أدخل الرمز"),
                  ("Ajoutez une photo", "un visage net, de face", "أضف صورة"),
                  ("Suivez la voix", "clou après clou, à votre rythme", "اتبع الصوت")]
        lignes = "".join(f'<div class="etape"><div class="num">{i}</div><div><div class="t">{t}</div><div class="d">{d}</div><div class="a">{a}</div></div></div>' for i, (t, d, a) in enumerate(etapes, 1))
        corps = _titres(texte) + f'<div class="grow" style="flex-direction:column;align-items:stretch;gap:0">{lignes}</div>' + _pied(offre)
    elif gabarit in {"offre", "offre_kit"}:
        if gabarit == "offre":
            visuel = f'<div class="planche" style="width:520px"><img src="{r[0]}"></div>'
        else:
            items = [("Planche 50 × 50 cm, 240 clous posés", "لوحة 50×50 سم بمسامير جاهزة"), ("Bobine de fil noir et dévidoir", "بكرة خيط أسود"),
                     ("Support de téléphone", "حامل الهاتف"), ("Code pour créer votre portrait", "رمز لإنشاء صورتك"), ("Guide vocal AR · FR · EN", "دليل صوتي بثلاث لغات")]
            visuel = '<ul class="liste" style="width:100%">' + "".join(
                f'<li><span class="clou"></span><span style="flex:1">{a}</span><span style="font-family:Alexandria;font-size:26px;color:{COULEURS["emerald"]};direction:rtl">{b}</span></li>' for a, b in items) + "</ul>"
        prix_html = f'<div class="prix">{prix}</div>' if prix else ""
        corps = _titres(texte, 100) + f"""
        <div class="grow">{visuel}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:30px">{prix_html}
          <span class="pill">{html.escape(offre["livraison"])}</span></div>""" + _pied(offre)
    elif gabarit == "points":
        lignes = "".join(
            f'<div class="etape"><span class="clou" style="width:22px;height:22px;flex:none"></span><div style="flex:1"><div class="t" style="font-size:42px">{html.escape(a)}</div>'
            f'<div class="a" style="text-align:right;font-size:34px">{html.escape(b)}</div></div></div>'
            for a, b in texte.get("points", []))
        corps = _titres(texte, 100) + f"""
        <div class="grow" style="gap:44px;align-items:center">
          <div class="planche" style="width:330px;flex:none"><img src="{r[0]}"></div>
          <div style="flex:1">{lignes}</div>
        </div>""" + _pied(offre)
    elif gabarit == "ecran":
        if ecran is None:
            raise ValueError("Gabarit ecran : capture d'écran manquante")
        lignes = "".join(
            f'<div class="etape"><span class="clou" style="width:22px;height:22px;flex:none"></span><div style="flex:1"><div class="t" style="font-size:40px">{html.escape(a)}</div>'
            f'<div class="a" style="text-align:right;font-size:32px">{html.escape(b)}</div></div></div>'
            for a, b in texte.get("points", []))
        corps = _titres(texte, 100) + f"""
        <div class="grow" style="gap:48px;align-items:center">
          <div style="flex:none;width:380px;border-radius:52px;background:{COULEURS['ink']};padding:16px;box-shadow:0 24px 60px rgba(26,25,22,.25)">
            <img src="{_data_uri(ecran)}" style="display:block;width:100%;border-radius:38px"></div>
          <div style="flex:1">{lignes}</div>
        </div>""" + _pied(offre)
    elif gabarit == "question":
        corps = f"""
        <div class="grow" style="flex-direction:column;gap:34px">
          <div class="planche" style="width:420px"><img src="{r[0]}"></div>
          <div class="fr" style="text-align:center;font-size:60px">{_fr(texte["fr"])}</div>
          <div class="ar" style="text-align:center">{html.escape(texte["ar"])}</div>
          <div class="sous">Répondez en commentaire · أجيبونا في التعليقات</div>
        </div>"""
    elif gabarit == "citation":
        corps = f"""
        <div class="grow" style="flex-direction:column;gap:40px;text-align:center">
          <svg width="90" height="70" viewBox="0 0 90 70"><text x="0" y="90" font-size="150" font-family="Young Serif, serif" fill="{COULEURS['brass']}">“</text></svg>
          <div class="fr" style="font-size:78px;text-align:center;max-width:880px">{_fr(texte["fr"])}</div>
          <div class="ar" style="text-align:center;font-size:62px">{html.escape(texte["ar"])}</div>
          <div style="display:flex;gap:16px">{'<span class="clou"></span>' * 5}</div>
        </div>"""
    elif gabarit == "devinette":
        corps = _titres(texte) + f"""
        <div class="grow"><div class="planche" style="width:640px"><img src="{r[0]}"></div></div>
        <div style="display:flex;justify-content:center;gap:26px;margin-bottom:30px;font-size:44px;font-weight:600">
          <span class="pill" style="background:{COULEURS['ink']}">A · 1 500</span><span class="pill" style="background:{COULEURS['ink']}">B · 3 000</span><span class="pill" style="background:{COULEURS['ink']}">C · 6 000</span></div>""" + _pied(offre)
    elif gabarit == "duel":
        corps = _titres(texte) + f"""
        <div class="grow" style="gap:36px">
          <div style="position:relative"><div class="planche" style="width:430px"><img src="{r[0]}"></div><div class="badge" style="top:-30px;left:-24px">1</div></div>
          <div style="position:relative"><div class="planche" style="width:430px"><img src="{r[1]}"></div><div class="badge" style="top:-30px;left:-24px">2</div></div>
        </div>
        <div class="sous" style="text-align:center;margin-bottom:24px">Votez 1 ou 2 en commentaire · صوّتوا 1 أو 2</div>""" + _pied(offre)
    else:
        raise ValueError(f"Gabarit inconnu : {gabarit}")
    return _page(corps)


def rendre_html(page: str, largeur: int = 1080, hauteur: int = 1350, qualite: int = 90) -> bytes:
    """Rendu HTML → JPEG via Chromium headless."""
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        # CHROMIUM_PATH : navigateur déjà installé (sinon celui téléchargé par « playwright install »).
        browser = p.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None)
        try:
            pg = browser.new_page(viewport={"width": largeur, "height": hauteur}, device_scale_factor=1)
            pg.set_content(page, wait_until="networkidle", timeout=60_000)
            pg.evaluate("document.fonts.ready")
            png = pg.screenshot(type="png")
        finally:
            browser.close()
    img = Image.open(io.BytesIO(png)).convert("RGB")
    out = io.BytesIO()
    img.save(out, "JPEG", quality=qualite, optimize=True, progressive=True)
    return out.getvalue()

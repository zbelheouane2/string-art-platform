"""Prompts de style, contrôle qualité des images et rédaction des légendes."""

from __future__ import annotations

import re

STYLE = (
    "Photorealistic, premium lifestyle photography for the Algerian brand DeeKra (personalised string art kits). "
    "Warm natural light, palette of off-white, ink black, emerald green (#0e5443) and brass gold accents. "
    "Contemporary Algerian interiors and culture, modest and respectful styling. Clean composition, "
    "keep the top-right corner calm and uncluttered for a logo. "
    "No text, no letters, no watermark, no logo, no brand names in the image. Vertical 4:5 format."
)

PORTRAIT_RULE = (
    "One of the reference images is a real circular string art portrait made of black thread on a white board "
    "with brass nails: reproduce it faithfully, do not redraw or change the face, keep it circular and monochrome."
)

PRODUCT_RULE = (
    "The attached product reference images only show what our real product looks like (kraft box, stand, wooden "
    "unwinder, phone stand, board with brass nails). Reproduce the product faithfully, but invent a completely new scene: "
    "different setting, people, composition, camera angle and background. Never copy the scene, framing, "
    "person or decor of the reference images."
)

CTA = {
    "commentaire": "Invite à répondre en commentaire (question simple).",
    "partage": "Invite à enregistrer ou partager le post.",
    "prive": "Invite à envoyer sa photo en message privé pour voir le résultat.",
    "commande": "Invite à commander, en rappelant le paiement à la livraison.",
}


def prompt_image(sujet: dict, avec_portrait: bool, angle: str | None = None,
                 ambiance: str | None = None, avec_produit: bool = False) -> str:
    regle = f" {PORTRAIT_RULE}" if avec_portrait else ""
    if avec_produit:
        regle += f" {PRODUCT_RULE}"
    variation = ""
    if angle:
        variation += f"\nCamera: {angle}."
    if ambiance:
        variation += f"\nLight: {ambiance}."
    return f"{sujet['prompt']}{regle}{variation}\n\nStyle: {STYLE}"


def prompt_controle(sujet: dict) -> str:
    return (
        "Tu es directeur artistique de la marque DeeKra (kits de portraits en fil, Algérie). "
        "Vérifie l'image jointe avant publication sur Facebook et Instagram.\n"
        f"Brief : {sujet['brief']}\n"
        "Refuse l'image si : texte ou lettres lisibles parasites, filigrane, logo ou marque inventée, "
        "mains ou visages déformés, anatomie incohérente, image hors sujet par rapport au brief, "
        "célébrité ou personne publique reconnaissable, tenue ou scène inappropriée pour un public algérien familial, "
        "portrait en fil déformé ou en couleur. Les petits détails d'interface sur un écran de téléphone sont acceptés.\n"
        'Réponds en JSON : {"conforme": true|false, "problemes": ["..."], "description": "description courte de l\'image en français"}'
    )


def prompt_legende(sujet: dict, offre: dict, description: str, occasion: dict | None,
                   registre: str | None = None, atouts: list[str] | None = None,
                   recentes: list[str] | None = None) -> str:
    commercial = sujet.get("commercial", True)
    prix = (f"Prix à mentionner : {offre['prix']}." if commercial and offre.get("afficher_prix") and sujet.get("cta") == "commande"
            else "Ne mentionne aucun prix.")
    occ = f"Occasion du moment : {occasion['nom']}." if occasion else ""
    if not commercial:
        occ += (" C'est une date de mémoire ou de recueillement : ton sobre et respectueux, vœux ou hommage, "
                "aucune incitation à l'achat, aucun emoji festif.")
    reg = f"Registre de cette légende : {registre}.\n" if registre else ""
    forts = ("Points forts vérifiés sur lesquels t'appuyer (un seul, celui qui sert le brief ; ne cite jamais de concurrent) : "
             + " ; ".join(atouts) + ".\n") if atouts else ""
    deja = ("Accroches déjà publiées récemment, à ne pas répéter ni paraphraser : "
            + " | ".join(recentes) + ".\n") if recentes else ""
    return (
        "Tu es community manager de DeeKra, marque algérienne de kits de portraits en fil (string art) : "
        "une planche 50 × 50 cm avec 240 clous déjà posés, un fil noir, un code pour transformer sa photo en portrait, "
        "et un guide vocal en arabe, français et anglais. Aucun talent artistique nécessaire. "
        f"{offre['paiement']}, {offre['livraison'].lower()}.\n"
        "Ton : chaleureux, simple, fier du patrimoine algérien, rassurant. Jamais de fausse urgence, "
        "jamais de faux avis ou de témoignage inventé, jamais de promesse non vérifiable, ne dis pas que l'image montre un client.\n"
        f"Brief du post : {sujet['brief']}\n"
        f"Ce que montre l'image : {description}\n"
        f"Appel à l'action : {CTA.get(sujet.get('cta', 'commentaire'))}\n{prix} {occ}\n"
        f"{reg}{forts}{deja}"
        "Écris la légende pour Facebook et Instagram : accroche en arabe (une ligne, arabe simple avec une touche de darija possible), "
        "accroche en français (une ligne), corps en français (2 à 3 phrases courtes), une phrase d'appel à l'action en français, "
        "la même phrase en arabe, et 4 à 6 hashtags pertinents (français, arabe ou anglais) sans #DeeKra. Un emoji maximum par ligne.\n"
        'Réponds en JSON : {"accroche_ar": "", "accroche_fr": "", "corps": "", "cta_fr": "", "cta_ar": "", "hashtags": ["#..."]}'
    )


class LegendeInvalide(ValueError):
    pass


def assembler(donnees: dict, social: dict) -> str:
    champs = ["accroche_ar", "accroche_fr", "corps", "cta_fr", "cta_ar"]
    manquants = [c for c in champs if not str(donnees.get(c, "")).strip()]
    if manquants:
        raise LegendeInvalide(f"Champs manquants : {manquants}")

    tags: list[str] = []
    for t in list(social["hashtags_fixes"]) + list(donnees.get("hashtags") or []):
        t = "#" + re.sub(r"[\s#]+", "", str(t))
        if len(t) > 1 and t.lower() not in {x.lower() for x in tags}:
            tags.append(t)
    tags = tags[: social["hashtags_max"]]

    lien = social["offre"].get("site") or ""
    wa = social["offre"].get("whatsapp") or ""
    contact = " · ".join(x for x in [lien, f"WhatsApp {wa}" if wa else ""] if x)

    blocs = [
        donnees["accroche_ar"].strip(),
        donnees["accroche_fr"].strip(),
        "",
        donnees["corps"].strip(),
        "",
        donnees["cta_fr"].strip(),
        donnees["cta_ar"].strip(),
    ]
    if contact:
        blocs.append(contact)
    blocs += ["", " ".join(tags)]
    texte = "\n".join(blocs).strip()
    verifier(texte, social)
    return texte


def verifier(texte: str, social: dict) -> None:
    if len(texte) > social["legende_max_caracteres"]:
        raise LegendeInvalide("Légende trop longue")
    bas = texte.lower()
    interdits = [m for m in social["mots_interdits"] if m.lower() in bas]
    if interdits:
        raise LegendeInvalide(f"Termes interdits : {interdits}")
    if texte.count("#") > 30:
        raise LegendeInvalide("Trop de hashtags pour Instagram")

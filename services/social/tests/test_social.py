import base64
import datetime as dt
import io
import json
from pathlib import Path

import pytest
from PIL import Image

from deekra_social import captions, compose, pipeline
from deekra_social.config import ConfigError, Settings
from deekra_social.gemini import GeminiClient, GeminiError
from deekra_social.meta import MetaClient, MetaError
from deekra_social.planning import EPOQUE, plan_creneau, plan_jour


@pytest.fixture(scope="module")
def settings():
    return Settings.load()


def _jpeg(w=800, h=1000, color=(240, 238, 232)) -> bytes:
    out = io.BytesIO()
    Image.new("RGB", (w, h), color).save(out, "JPEG")
    return out.getvalue()


class FakeResp:
    def __init__(self, status, data):
        self.status_code = status
        self._data = data
        self.text = json.dumps(data)

    def json(self):
        return self._data


class FakeSession:
    """Rejoue des réponses dans l'ordre et mémorise les appels."""

    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def _next(self, method, url, **kw):
        self.calls.append((method, url, kw))
        return self.responses.pop(0)

    def post(self, url, **kw):
        return self._next("POST", url, **kw)

    def get(self, url, **kw):
        return self._next("GET", url, **kw)


# ---------- configuration et planning ----------

def test_config_valide(settings):
    assert len(settings.sujets) >= 35
    familles = {s["famille"] for s in settings.sujets}
    assert {"creatif", "pack", "resultat", "emotion", "guide", "offre", "communaute"} <= familles


def test_rendus_existent(settings):
    for nom in settings.portraits:
        assert settings.rendu_path(nom).exists(), nom


def test_chouhada_exclus(settings):
    assert not {"benmhidi", "martyr"} & set(settings.portraits)


def test_references_existent(settings):
    refs = {r for s in settings.sujets for r in s.get("refs", []) if not r.startswith("portrait")}
    for r in refs:
        assert (Path(compose.ASSETS_DIR) / "references" / f"{r}.jpg").exists(), r


def test_plan_deterministe(settings):
    d = dt.date(2026, 11, 21)
    assert [p.sujet["id"] for p in plan_jour(settings, d)] == [p.sujet["id"] for p in plan_jour(settings, d)]


def test_plan_suit_semaine_type(settings):
    samedi = dt.date(2026, 11, 21)
    assert [p.famille for p in plan_jour(settings, samedi)] == settings.semaine_type["samedi"]


def test_rotation_sans_repetition_avant_epuisement(settings):
    """Un sujet ne revient pas avant que tous ceux de sa famille soient passés."""
    vus: dict[str, list[str]] = {}
    d = dt.date(2027, 9, 22)  # période sans occasion
    for i in range(28):
        for p in plan_jour(settings, d + dt.timedelta(days=i)):
            assert p.occasion is None
            vus.setdefault(p.famille, []).append(p.sujet["id"])
    for famille, ids in vus.items():
        n = len([s for s in settings.sujets if s["famille"] == famille])
        for k in range(0, len(ids) - n + 1, n):
            bloc = ids[k:k + n]
            assert len(set(bloc)) == len(bloc), famille


def test_occasion_prend_le_soir(settings):
    p = plan_creneau(settings, dt.date(2027, 5, 25), "soir")
    assert p.occasion and p.occasion["nom"] == "Fête des mères"
    assert plan_creneau(settings, dt.date(2027, 5, 15), "soir").occasion["nom"] == "Aïd el-Adha"
    assert plan_creneau(settings, dt.date(2027, 5, 25), "midi").occasion is None


def test_date_trop_ancienne(settings):
    with pytest.raises(ValueError):
        plan_creneau(settings, EPOQUE - dt.timedelta(days=1), "midi")


def test_config_invalide(tmp_path, settings):
    for f in ("social.json", "occasions.json"):
        (tmp_path / f).write_text(json.dumps(json.load(open(settings.config_dir / f))), encoding="utf-8")
    (tmp_path / "sujets.json").write_text(json.dumps({"sujets": [settings.sujets[0], settings.sujets[0]]}), encoding="utf-8")
    with pytest.raises(ConfigError):
        Settings.load(tmp_path)


# ---------- légendes ----------

def _donnees():
    return {"accroche_ar": "هدية ما تتنساش", "accroche_fr": "Le cadeau qu'on garde.", "corps": "Une photo, 240 clous, un fil.",
            "cta_fr": "Dites-nous en commentaire.", "cta_ar": "قولولنا في التعليقات", "hashtags": ["#StringArt", "Cadeau Algerie", "#deekra"]}


def test_legende_assemblee(settings):
    texte = captions.assembler(_donnees(), settings.social)
    assert texte.splitlines()[0] == "هدية ما تتنساش"
    assert "#DeeKra" in texte and "#ذكرى" in texte and "#CadeauAlgerie" in texte
    assert texte.lower().count("#deekra") == 1


def test_legende_refuse_mots_interdits(settings):
    d = _donnees() | {"corps": "Dernière chance, stock limité !"}
    with pytest.raises(captions.LegendeInvalide):
        captions.assembler(d, settings.social)


def test_legende_champ_manquant(settings):
    with pytest.raises(captions.LegendeInvalide):
        captions.assembler(_donnees() | {"cta_ar": ""}, settings.social)


def test_prompt_legende_prix(settings):
    offre = settings.social["offre"]
    p = captions.prompt_legende({"brief": "b", "cta": "commande"}, offre, "d", None)
    assert offre["prix"] in p
    p = captions.prompt_legende({"brief": "b", "cta": "commentaire"}, offre, "d", None)
    assert "aucun prix" in p


# ---------- composition ----------

def test_finaliser_format_et_logo():
    out = compose.finaliser(_jpeg(900, 900), 1080, 1350)
    img = Image.open(io.BytesIO(out))
    assert img.size == (1080, 1350)
    coin = img.crop((800, 50, 1030, 150)).convert("L")
    assert min(coin.getdata()) < 200  # le logo est posé


def test_html_carte_tous_gabarits(settings):
    rendus = [settings.rendu_path(p) for p in settings.portraits[:4]]
    photos = [settings.rendu_path("caftan", "photo")]
    for g in {s["carte"] for s in settings.sujets if s["rendu"] == "carte"}:
        ecran = settings.rendu_path("caftan").parent / "generateur" / "voice-fr.webp"
        page = compose.html_carte(g, {"fr": "Titre ?", "ar": "عنوان"}, settings.social["offre"], rendus, photos, ecran)
        assert "Titre&nbsp;?" in page or g == "etapes"


def test_html_carte_sans_prix(settings):
    offre = settings.social["offre"] | {"afficher_prix": False}
    page = compose.html_carte("offre", {"fr": "x", "ar": "y"}, offre, [settings.rendu_path("caftan")], [])
    assert offre["prix"] not in page


# ---------- Gemini ----------

def _gemini_image_resp(data: bytes):
    return FakeResp(200, {"candidates": [{"content": {"parts": [{"inlineData": {"mimeType": "image/png", "data": base64.b64encode(data).decode()}}]}}]})


def _gemini_json_resp(obj):
    return FakeResp(200, {"candidates": [{"content": {"parts": [{"text": json.dumps(obj, ensure_ascii=False)}]}}]})


def test_gemini_image_et_reessai():
    s = FakeSession([FakeResp(503, {}), _gemini_image_resp(b"IMG")])
    g = GeminiClient("k", "img", "txt", session=s, backoff=0)
    assert g.generate_image("p") == b"IMG"
    method, url, kw = s.calls[-1]
    assert url.endswith("/img:generateContent")
    assert kw["headers"]["x-goog-api-key"] == "k"
    assert kw["json"]["generationConfig"]["responseModalities"] == ["IMAGE"]


def test_gemini_erreur_sans_cle_dans_message():
    s = FakeSession([FakeResp(400, {"error": "bad"})])
    g = GeminiClient("SECRET-KEY", "img", "txt", session=s, backoff=0)
    with pytest.raises(GeminiError) as exc:
        g.generate_image("p")
    assert "SECRET-KEY" not in str(exc.value)


def test_gemini_reponse_bloquee():
    s = FakeSession([FakeResp(200, {"promptFeedback": {"blockReason": "SAFETY"}})])
    with pytest.raises(GeminiError, match="SAFETY"):
        GeminiClient("k", "i", "t", session=s).generate_image("p")


# ---------- pipeline complet (Gemini simulé) ----------

def test_generer_reessaie_si_non_conforme(settings):
    plan = plan_creneau(settings, dt.date(2026, 11, 21), "midi")  # creatif, rendu gemini
    assert plan.sujet["rendu"] == "gemini"
    s = FakeSession([
        _gemini_image_resp(_jpeg()), _gemini_json_resp({"conforme": False, "problemes": ["texte"]}),
        _gemini_image_resp(_jpeg()), _gemini_json_resp({"conforme": True, "description": "zellige et fil"}),
        _gemini_json_resp(_donnees()),
    ])
    v = pipeline.generer(settings, plan, GeminiClient("k", "i", "t", session=s))
    assert [e["conforme"] for e in v.essais] == [False, True]
    assert Image.open(io.BytesIO(v.image)).size == (1080, 1350)
    assert v.description == "zellige et fil"


def test_generer_echoue_proprement(settings):
    plan = plan_creneau(settings, dt.date(2026, 11, 21), "midi")
    n = settings.social["gemini"]["essais_max"] + 1
    s = FakeSession([r for _ in range(n) for r in (_gemini_image_resp(_jpeg()), _gemini_json_resp({"conforme": False}))])
    with pytest.raises(pipeline.GenerationEchouee):
        pipeline.generer(settings, plan, GeminiClient("k", "i", "t", session=s))


def test_enregistrer_puis_publier(settings, tmp_path):
    plan = plan_creneau(settings, dt.date(2026, 11, 21), "midi")
    v = pipeline.Visuel(plan, compose.finaliser(_jpeg()), "Légende", "desc")
    chemin = pipeline.enregistrer(v, tmp_path)
    assert json.loads(chemin.with_suffix(".json").read_text())["statut"] == "a_valider"

    s = FakeSession([
        FakeResp(200, {"id": "PHOTO", "post_id": "PAGE_POST"}),
        FakeResp(200, {"images": [{"width": 720, "source": "https://cdn/s.jpg"}, {"width": 1080, "source": "https://cdn/l.jpg"}]}),
        FakeResp(200, {"id": "CONT"}),
        FakeResp(200, {"status_code": "IN_PROGRESS"}),
        FakeResp(200, {"status_code": "FINISHED"}),
        FakeResp(200, {"id": "IGMEDIA"}),
    ])
    meta = MetaClient("PAGE", "TOKEN", "IG", session=s, poll_interval=0)
    info = pipeline.publier_fichier(meta, chemin)
    assert info["statut"] == "publie" and info["instagram_media_id"] == "IGMEDIA"
    assert s.calls[2][2]["data"]["image_url"] == "https://cdn/l.jpg"
    assert s.calls[0][2]["data"]["message"] == "Légende"
    with pytest.raises(RuntimeError):
        pipeline.publier_fichier(meta, chemin)  # pas de double publication


def test_meta_erreur():
    s = FakeSession([FakeResp(400, {"error": {"type": "OAuthException", "message": "Invalid token"}})])
    with pytest.raises(MetaError, match="OAuthException"):
        MetaClient("P", "T", None, session=s).publier(b"x", "l")


def test_auto_ne_publie_pas_sans_interrupteur(settings, tmp_path, monkeypatch):
    from deekra_social import __main__ as cli
    monkeypatch.delenv("SOCIAL_AUTOPUBLISH", raising=False)
    plan = plan_creneau(settings, dt.date(2026, 11, 21), "midi")
    monkeypatch.setattr(cli, "_gemini", lambda st: None)
    monkeypatch.setattr(cli.pipeline, "generer", lambda st, p, g, historique=None: pipeline.Visuel(p, compose.finaliser(_jpeg()), "L", "d"))
    monkeypatch.setattr(cli, "_meta", lambda st: (_ for _ in ()).throw(AssertionError("ne doit pas publier")))
    assert cli.main(["auto", "--creneau", "midi", "--sortie", str(tmp_path)]) == 0
    assert list(tmp_path.rglob("*.jpg"))


# ---------- calendrier algérien, variété ----------

def test_pas_de_fetes_etrangeres(settings):
    noms = " ".join(o["nom"].lower() + o["id"] for o in settings.occasions)
    for interdit in ("valentin", "noël", "noel", "halloween", "black friday", "christmas"):
        assert interdit not in noms
    for o in settings.occasions:
        for v in o["variantes"]:
            assert "christmas" not in v["prompt"].lower() or "no christmas" in v["prompt"].lower()


def test_fin_annee_couverte(settings):
    p = plan_creneau(settings, dt.date(2026, 12, 24), "soir")
    assert p.occasion["nom"] == "Fin d'année"


def test_priorite_en_cas_de_chevauchement(settings):
    # 8 mars 2027 : Ramadan, Aïd el-Fitr et Journée de la femme se chevauchent : l'Aïd gagne.
    assert plan_creneau(settings, dt.date(2027, 3, 8), "soir").occasion["nom"] == "Aïd el-Fitr"


def test_date_commemorative_non_commerciale(settings):
    p = plan_creneau(settings, dt.date(2027, 7, 5), "soir")
    assert p.occasion["id"] == "independance-2027"
    assert p.sujet["cta"] == "partage" and p.sujet["commercial"] is False
    prompt = captions.prompt_legende(p.sujet, settings.social["offre"], "d", p.occasion)
    assert "aucun prix" in prompt and "respectueux" in prompt


def test_longue_saison_pas_tous_les_soirs(settings):
    soirs = [plan_creneau(settings, dt.date(2027, 8, 1) + dt.timedelta(days=i), "soir").occasion for i in range(14)]
    ete = [o for o in soirs if o and o["id"] == "ete-diaspora-2027"]
    assert 4 <= len(ete) <= 8  # environ 3 soirs par semaine


def test_variantes_d_occasion_alternent(settings):
    ids = {plan_creneau(settings, dt.date(2026, 12, 15) + dt.timedelta(days=i), "soir").sujet["id"] for i in range(6)}
    assert len(ids) >= 3


def test_horaire_ramadan(settings):
    p = plan_creneau(settings, dt.date(2027, 2, 20), "soir")
    assert p.horaire == "Ramadan" and p.heure == "22:00"
    assert plan_creneau(settings, dt.date(2027, 4, 20), "soir").horaire == "normal"


def test_un_sujet_change_d_angle_a_chaque_passage(settings):
    from deekra_social.planning import _variations
    n = len(settings.social["variations"]["angles"])
    sujet = next(x for x in settings.sujets if x["id"] == "resultat-mur-salon")
    angles = [_variations(settings, sujet, dt.date(2027, 1, 1), k, 0)[0] for k in range(n)]
    assert len(set(angles)) == n


def test_registre_tourne_d_une_semaine_a_l_autre(settings):
    d = dt.date(2026, 11, 21)
    regs = [plan_creneau(settings, d + dt.timedelta(weeks=w), "midi").registre for w in range(3)]
    assert len(set(regs)) == 3


def test_registres_varies_sur_une_journee(settings):
    regs = [p.registre for p in plan_jour(settings, dt.date(2026, 11, 21))]
    assert len(set(regs)) == 3


def test_prompt_image_avec_variations():
    p = captions.prompt_image({"prompt": "P"}, False, angle="low angle", ambiance="winter")
    assert "Camera: low angle." in p and "Season: winter." in p


def test_accroches_recentes(tmp_path):
    (tmp_path / "2026-11-20").mkdir()
    (tmp_path / "2026-11-20" / "2026-11-20-midi.json").write_text(json.dumps({"legende": "A1\nB1\n\ncorps"}), encoding="utf-8")
    (tmp_path / "2026-11-20" / "2026-11-20-soir.json").write_text(json.dumps({"legende": "FUTUR\nX"}), encoding="utf-8")
    assert pipeline.accroches_recentes(tmp_path, dt.date(2026, 11, 20), {"midi"}) == ["A1", "B1"]
    prompt = captions.prompt_legende({"brief": "b"}, {"prix": "1", "paiement": "p", "livraison": "l"}, "d", None,
                                     recentes=["A1"], atouts=["fort"])
    assert "A1" in prompt and "fort" in prompt and "concurrent" in prompt


def test_atouts_dans_la_semaine(settings):
    familles = {f for jour in settings.semaine_type.values() for f in jour}
    assert "atout" in familles


def test_ecrans_generateur_existent(settings):
    base = settings.rendu_path("caftan").parent
    for s in settings.sujets:
        if s.get("ecran"):
            for lang in ("fr", "ar"):
                assert (base / s["ecran"].format(lang=lang)).exists(), s["id"]


def test_regle_produit_sans_copie():
    p = captions.prompt_image({"prompt": "P"}, False, avec_produit=True)
    assert "Never copy the scene" in p
    assert "Never copy" not in captions.prompt_image({"prompt": "P"}, False)

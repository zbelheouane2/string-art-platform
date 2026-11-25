# Réseaux sociaux DeeKra

Trois visuels par jour, générés avec Gemini et des gabarits aux couleurs de la marque, chacun avec sa légende en arabe et en français, publiés sur la page Facebook et le compte Instagram via l'API Meta Graph.

Stratégie de référence : document « Stratégie marketing DeeKra — Réseaux sociaux Algérie » (validé le 2026-11-20).

## Fonctionnement

1. **Plan** (`planning.py`) : la semaine type donne une famille par créneau (créatif, pack, résultat, émotion, guide, atout, offre, communauté). Le créneau du soir passe au thème de l'occasion (calendrier algérien) quelques jours avant la date. Le choix est déterministe : un sujet ne revient qu'après tous les autres de sa famille, avec un autre angle de vue, l'ambiance de la saison et un autre registre de légende.
2. **Visuel** :
   - `gemini` : image générée par Gemini. Les références sont des visuels du site (`assets/references/`) qui montrent le produit et de vrais rendus du moteur. La consigne impose de garder le produit fidèle et d'inventer une scène nouvelle.
   - `carte` : gabarit HTML (`compose.py`) rendu par Chromium, avec de vrais rendus du moteur, des photos sources, de vraies captures du générateur et des textes fixés dans la configuration.
3. **Contrôle** : Gemini relit l'image (texte parasite, mains déformées, hors sujet, célébrité, scène inappropriée). Si l'image est refusée, elle est régénérée.
4. **Logo** posé par le programme, jamais par l'IA.
5. **Légende** : Gemini décrit l'image, puis rédige selon le ton DeeKra, le registre du jour et un point fort vérifié. Il reçoit les accroches des 30 derniers jours pour éviter de les répéter. La légende est ensuite vérifiée (mots interdits, longueur, hashtags).
6. **Publication** : photo sur la page Facebook, puis Instagram à partir de l'URL de cette photo. Aucun hébergement supplémentaire n'est nécessaire.

## Mode semi-automatique (gratuit, sans clé API)

1. `preparer --date J` rend les cartes de marque du jour et écrit `prompts.md`, avec les prompts détaillés et les images de référence du produit à joindre dans l'application Gemini.
2. Le propriétaire génère les visuels dans l'application et les transmet.
3. `importer` recadre l'image en 1080 × 1350, pose le logo et enregistre la légende, qui est vérifiée. Le visuel passe au statut « à valider ».
4. `valider` intervient après l'accord du propriétaire. Les lots sont poussés sur la branche `social-lots`.
5. À chaque créneau, la tâche planifiée (`programme`) publie le visuel validé du jour. Seuls les secrets Meta sont nécessaires.

## Configuration (`config/`)

| Fichier | Contenu |
|---|---|
| `social.json` | Créneaux, semaine type, horaires du Ramadan, offre (prix, paiement, livraison), hashtags, mots interdits, portraits autorisés, modèles Gemini, version Graph, variations, points forts |
| `sujets.json` | Banque de sujets (prompts, références, gabarits et textes des cartes) |
| `occasions.json` | Calendrier algérien : dates, fenêtres, priorités, fréquence, variantes, dates commémoratives sans vente |

Les dates des fêtes religieuses sont approximatives et doivent être vérifiées chaque année. Les fêtes étrangères aux coutumes algériennes sont exclues. Les portraits de chouhada ne sont pas utilisés automatiquement.

## Secrets (jamais dans le code)

| Nom | Où |
|---|---|
| `GEMINI_API_KEY` | Secret GitHub du dépôt |
| `META_PAGE_ID`, `META_PAGE_TOKEN`, `META_IG_USER_ID` | Secrets GitHub du dépôt (jeton longue durée d'un utilisateur système Business Manager, permissions `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`) |
| `SOCIAL_AUTOPUBLISH` | Variable GitHub : `true` pour activer la publication automatique |

## Commandes

```bash
pip install -e ".[dev]" && python -m playwright install chromium   # ou CHROMIUM_PATH=/chemin/vers/chrome
python -m deekra_social plan --jours 7                     # plan de la semaine, sans API
python -m deekra_social apercu --sujet offre-cod --sortie /tmp/cartes   # carte seule, sans API
python -m deekra_social lot --date 2026-11-21 --sortie lots           # 3 visuels à valider
python -m deekra_social publier lots/2026-11-21/2026-11-21-midi.jpg --oui
python -m deekra_social auto --creneau midi --sortie lots             # tâche planifiée
pytest
```

## Tâche planifiée

> **Désactivée depuis le 25/11/2026** : le propriétaire publie lui-même deux posts par jour. Le bloc `schedule` du workflow est mis en commentaire ; le lancement manuel (`workflow_dispatch`) reste disponible.

`.github/workflows/social-deekra.yml` s'exécute aux trois créneaux, plus trois horaires de Ramadan qui ne s'activent que pendant cette période. Tant que `SOCIAL_AUTOPUBLISH` n'est pas à `true`, les lancements planifiés ne font rien. Les lots se génèrent alors à la main (mode `lot`), puis chaque visuel validé est publié (mode `publier`). Tout est archivé sur la branche `social-lots`.

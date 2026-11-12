# Historique

## 2026-11-12
- **Plateforme, étape 1 (fondations)** : site Next.js 16 en FR/EN/AR (RTL), page d'accueil avec portrait tissé en direct depuis le moteur, base PostgreSQL (Prisma 7, migration initiale, données de référence sans prix), service moteur FastAPI protégé par jeton, Docker Compose, 13 tests unitaires et 34 tests navigateur (dont accessibilité axe).
- Décision D1 validée : commerce sur mesure.
- Cahier des charges v1.1 (code d'activation, guidage audio, clous pré-posés, numérotation A1–D60).
- Études : concurrentielle, analyse du modèle de référence, dossier `docs/reverse-engineering/`.
- **Moteur v0.2.0 (phase 1b)** : cadrage automatique sur le visage (YuNet), fond éclairci, pénalité des zones claires, contours renforcés, banc d'essai qualité (`bench/bench.py`), 36 tests.
- **Moteur v0.1.0 (prototype phase 1a)** : `services/engine/` — géométrie, prétraitement, glouton, rendu, JSON, CLI, 26 tests.

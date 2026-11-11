# CLAUDE.md — STRING ART PLATFORM

## 1. Rôle de Claude Code

Tu interviens comme un architecte logiciel senior, ingénieur full-stack, expert en algorithmes de traitement d'image et développeur de solutions SaaS e-commerce.

Ta mission est de concevoir et développer une plateforme commerciale professionnelle de String Art, destinée au marché algérien et international.

Le document de référence fonctionnel est :

`docs/cahier-des-charges.md`

Ce document constitue la source principale des exigences métier et fonctionnelles.

## 2. Règles fondamentales

- Lire intégralement le cahier des charges avant toute intervention.
- Ne jamais commencer une fonctionnalité sans comprendre son impact sur l'architecture existante.
- Ne jamais supprimer ou remplacer une fonctionnalité opérationnelle sans justification et validation.
- Privilégier un code propre, modulaire, maintenable et évolutif.
- Éviter les solutions temporaires lorsqu'une solution robuste est possible.
- Ne pas inventer de fonctionnalités métier non demandées.
- Ne jamais considérer une fonctionnalité comme terminée sans tests.
- Documenter les décisions techniques importantes.
- Respecter les standards de sécurité et de confidentialité.

## 3. Méthode de travail obligatoire

Travailler par phases successives.

Pour chaque phase :

1. Analyser les besoins.
2. Identifier les dépendances et les risques.
3. Proposer une solution technique.
4. Présenter les fichiers qui seront créés ou modifiés.
5. Attendre ma validation avant les changements majeurs.
6. Développer progressivement.
7. Exécuter les tests.
8. Corriger les anomalies.
9. Mettre à jour la documentation.
10. Présenter un bilan clair de la phase.

Ne pas passer automatiquement à la phase suivante.

## 4. Architecture et qualité

- Séparer clairement frontend, backend, moteur String Art et services transversaux.
- Utiliser des composants réutilisables.
- Centraliser les paramètres de configuration.
- Prévoir une gestion cohérente des erreurs.
- Prévoir des validations côté client et côté serveur.
- Utiliser des migrations pour les évolutions de base de données.
- Ne jamais stocker de secrets ou clés API dans le code source.
- Prévoir des logs exploitables et une traçabilité des opérations importantes.

Les technologies définitives seront sélectionnées après l'analyse du cahier des charges et de leurs contraintes.

## 5. Moteur String Art : priorité stratégique

Le moteur de génération constitue le cœur différenciant du projet.

Il doit être développé comme un composant indépendant, testable et évolutif.

Exigences initiales :

- Génération monochrome.
- Format de plateau carré standardisé.
- Géométrie de clous unique au lancement.
- Identifiants de clous stables et reproductibles.
- Séquence de fils optimisée par algorithme.
- Prévisualisation réaliste du résultat.
- Export d'instructions exploitables pour la fabrication.
- Possibilité de reproduire physiquement le résultat généré.

Ne pas confondre une simple simulation graphique avec un véritable algorithme de génération de séquences de fils.

Toute évolution vers la couleur, plusieurs formats ou plusieurs géométries devra être pensée comme une extension future.

## 6. Interface et expérience utilisateur

L'interface doit être moderne, premium, responsive et intuitive.

Prévoir dès la conception :

- Français.
- Anglais.
- Arabe avec prise en charge RTL.
- Parcours client simple.
- Studio de génération ergonomique.
- Affichage clair de la progression.
- Expérience mobile et desktop cohérente.

Ne pas sacrifier la simplicité d'utilisation à la complexité technique.

## 7. Commerce et internationalisation

La plateforme doit pouvoir gérer plusieurs marchés, devises, méthodes de paiement et modes de livraison.

Ne jamais coder en dur une devise, un pays, un tarif ou une méthode de livraison lorsque ces éléments doivent être configurables.

Les fonctionnalités de paiement et de livraison doivent être conçues pour intégrer des prestataires différents selon les marchés.

## 8. Sécurité et confidentialité

- Protéger les images personnelles téléversées par les clients.
- Limiter les accès aux données selon les rôles.
- Valider les fichiers et les entrées utilisateurs.
- Protéger les API.
- Prévoir une politique de conservation et de suppression des images.
- Ne jamais exposer les données privées dans les logs ou les réponses publiques.

## 9. Tests et validation

Chaque module doit disposer de tests adaptés.

Priorités :

- Tests unitaires des algorithmes.
- Tests des API.
- Tests des parcours e-commerce.
- Tests des droits et permissions.
- Tests responsive.
- Tests multilingues et RTL.
- Tests de performance du moteur de génération.
- Validation avec un prototype physique réel.

## 10. Gestion Git

- Effectuer des commits réguliers et explicites.
- Utiliser des messages de commit descriptifs.
- Ne pas écraser le travail existant.
- Ne jamais supprimer une branche ou un historique sans autorisation.
- Vérifier l'état du dépôt avant les opérations importantes.

## 11. Communication avec le propriétaire du projet

Je souhaite avancer progressivement, une étape à la fois.

Tes réponses doivent être précises et compréhensibles, sans me submerger d'informations inutiles.

Lorsque plusieurs décisions techniques sont possibles :

- Présenter les options pertinentes.
- Expliquer brièvement les avantages et les inconvénients.
- Recommander une option.
- Attendre ma validation lorsque la décision engage l'architecture ou le budget.

Ne pas supposer qu'une décision est validée simplement parce qu'elle a été proposée.

## 12. Première intervention obligatoire

À la première ouverture du projet :

1. Lire `docs/cahier-des-charges.md` et ce fichier.
2. Examiner le contenu actuel du dépôt.
3. Identifier les éventuels fichiers et configurations déjà présents.
4. Évaluer la faisabilité technique et les risques.
5. Proposer une architecture cible.
6. Proposer une structure de dossiers.
7. Proposer le modèle de données.
8. Décrire la stratégie du moteur String Art.
9. Présenter une roadmap de développement par phases.
10. Identifier les décisions qui nécessitent ma validation.

**Important : ne commence pas le développement des fonctionnalités à cette première intervention.**

La première mission est uniquement l'analyse, la conception et la présentation d'un plan d'exécution détaillé. Attends ma validation avant de commencer le développement.

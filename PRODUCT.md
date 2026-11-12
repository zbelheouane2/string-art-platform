# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Validé par le propriétaire (2026-11-12) : Next.js (TypeScript) pour le site, PostgreSQL (Prisma, migrations), moteur Python exposé en service FastAPI, environnement local Docker. Commerce sur mesure (décision D1), pas Shopify. Hébergement non décidé (contrainte possible d'hébergement local en Algérie, loi 18-05).

## Users

- Acheteurs de cadeaux personnalisés (Algérie d'abord, puis France, Espagne, Tunisie, Golfe) qui veulent transformer une photo de proche en portrait String Art.
- Le réalisateur du portrait (souvent le même client ou la personne offerte) : adulte sans compétence artistique, qui suit des instructions clou par clou pendant plusieurs heures, téléphone posé à côté de la planche.
- Équipe interne : préparation des commandes, codes d'activation, livraison.

## Product Purpose

Vendre un kit physique (planche 50×50 cm, 240 clous pré-posés, fil) et un code d'activation qui permet de générer son propre portrait à partir d'une photo, puis de le réaliser grâce à un guide interactif (voix, vitesse réglable). Succès : le client obtient chez lui un portrait reconnaissable, identique à l'aperçu.

## Positioning

Moteur de génération propriétaire, testé et mesuré, avec cadrage automatique du visage ; numérotation de clous stable (A1–D60) ; adapté au marché algérien (paiement à la livraison, CIB/EDAHABIA, livraison Yalidine, arabe RTL).

## Operating Context

- Parcours : boutique → commande → livraison du kit avec code → saisie du code → photo → choix → guide de réalisation.
- Le guide est utilisé longtemps, sur mobile, mains occupées.
- Langues : français, anglais, arabe (RTL).

## Capabilities and Constraints

- Génération monochrome, planche carrée unique, 240 clous sur cercle Ø 470 mm (à confirmer sur planche réelle), secteurs A–D de 60 clous.
- Devises, prix, pays, moyens de paiement et de livraison : configurables, jamais codés en dur.
- Photos clients privées, conservation limitée (30 jours proposés, D7 non validée).
- Non décidé : nom de marque (D9), prix, hébergement, planche noire (D4).

## Brand Commitments

- Référence commerciale : Let's String. Le propriétaire souhaite un design « presque le même » que leur boutique (ambiance chaleureuse, cadeau, haut de gamme, structure de pages), mais le cahier des charges interdit de reprendre leur identité visuelle, leurs textes, photos ou logo. On reprend la structure et l'ambiance, avec notre propre palette, typographie et contenus.
- Nom de marque provisoire, configurable (D9 ouverte).

## Evidence on Hand

- Rendus réels du moteur (`/mnt/project-files/prototype-moteur/`), comparaison avec un générateur gratuit.
- Aucune photo produit, aucun témoignage, aucun avis client, aucun prix validé : ne pas en inventer.

## Product Principles

- Montrer le vrai résultat du moteur plutôt que des promesses.
- Simple pour quelqu'un qui n'a jamais fait de String Art.
- Algérie d'abord, international ensuite, sans rien coder en dur.
- Confidentialité des photos personnelles.

## Accessibility & Inclusion

WCAG 2.1 AA visé ; arabe en RTL complet ; usage mobile prioritaire.

# STRING ART PLATFORM
## Cahier des charges global — Spécifications fonctionnelles et techniques

**Version : 1.0**  
**Type de projet :** Plateforme Web / E-commerce / Génération algorithmique String Art  
**Développement :** Claude Code  
**Marché cible :** Algérie + International  
**Référence commerciale :** Let's String  
**Positionnement :** Marque indépendante avec technologie propriétaire.

---

# 1. VISION ET PRÉSENTATION DU PROJET

## 1.1. Présentation

Le projet consiste à développer une plateforme web spécialisée dans la création et la commercialisation de kits String Art personnalisés.

Le String Art est une technique artistique qui consiste à reproduire une image ou un portrait en tendant des fils entre des clous fixés sur une planche.

La plateforme doit permettre à un utilisateur de transformer sa propre photographie en un véritable patron String Art, puis de réaliser physiquement son portrait à l'aide d'un kit spécialement conçu à cet effet.

Le concept repose sur trois éléments complémentaires :

1. Une plateforme web permettant de générer des portraits String Art.
2. Une boutique e-commerce permettant de vendre des kits physiques et des patrons numériques.
3. Un assistant interactif permettant de guider le client pendant la réalisation de son portrait.

L'objectif est de développer un produit commercialisable à l'international, avec une expérience utilisateur simple, moderne et accessible même aux personnes sans compétences artistiques.

## 1.2. Vision commerciale

Créer une marque spécialisée dans les portraits personnalisés String Art.

La plateforme doit transformer une photographie personnelle en une expérience créative et en un objet décoratif personnalisé.

Les principaux marchés visés :
- Algérie.
- France.
- Espagne.
- Tunisie.
- Pays du Golfe.
- Autres marchés internationaux.

## 1.3. Positionnement

S'inspirer du modèle commercial de Let's String sans reproduire son identité visuelle, ses contenus protégés, son code ou ses éléments propriétaires.

Développer :
- Notre propre identité de marque.
- Notre propre interface utilisateur.
- Notre propre moteur algorithmique.
- Notre propre système de génération de patrons.
- Notre propre expérience de réalisation.
- Notre propre infrastructure e-commerce.

---

# 2. PRODUIT PHYSIQUE ET OFFRE COMMERCIALE

## 2.1. Format standard unique

Pour le lancement, la plateforme doit proposer un seul format de tableau.

Caractéristiques :
- Forme carrée.
- Dimensions physiques standardisées, à déterminer après validation du prototype de fabrication.
- Disposition standardisée des clous.
- Numérotation fixe des clous.
- Un seul gabarit de fabrication.
- Un seul format de patron PDF.

IMPORTANT : Le client ne doit pas pouvoir choisir entre plusieurs dimensions ou plusieurs formes au lancement.

Le système doit être conçu pour permettre l'ajout de nouveaux formats ultérieurement, sans nécessiter une refonte complète du moteur algorithmique.

## 2.2. Kits commercialisables

La plateforme doit permettre de vendre deux catégories principales :

### A. Kit physique complet

Le kit doit pouvoir comprendre :
- Une planche en bois préparée.
- Les clous positionnés selon le patron.
- Les fils nécessaires à la réalisation.
- Les accessoires de montage.
- Les outils nécessaires, selon la composition commerciale retenue.
- Un guide de démarrage.
- Un accès au guide numérique interactif.

La composition exacte du kit doit être administrable depuis le back-office.

### B. Patron numérique

Le client peut acheter uniquement le patron généré à partir de sa photographie.

Le produit numérique comprend :
- Le rendu final.
- Le plan de positionnement des clous.
- La liste numérotée des connexions.
- Le guide de réalisation PDF.
- Les instructions nécessaires à la reproduction du portrait.

### C. Offre combinée

Prévoir également une offre regroupant le kit physique et le patron numérique.

Les différentes offres doivent pouvoir être configurées et commercialisées indépendamment.

---

# 3. PARCOURS CLIENT

Le parcours client constitue l'un des éléments les plus importants du projet.

## 3.1. Parcours principal

1. Le client accède au site.
2. Il découvre le concept String Art.
3. Il clique sur « Create your String Art ».
4. Il importe une photographie.
5. Il ajuste et recadre sa photographie.
6. Il configure les paramètres autorisés.
7. Le moteur génère le portrait String Art.
8. Le client visualise le résultat.
9. Il peut régénérer ou modifier le résultat.
10. Il valide son portrait.
11. Il choisit le type de produit : numérique, physique ou combiné.
12. Il ajoute le produit au panier.
13. Il renseigne ses coordonnées et son adresse.
14. Il effectue le paiement selon les moyens disponibles dans son marché.
15. Il reçoit une confirmation de commande.
16. Il accède à ses instructions de réalisation ou reçoit son kit physique.

Le parcours doit être fluide, avec le minimum d'étapes inutiles.

## 3.2. Parcours invité

Autoriser un client à commencer une création sans créer immédiatement un compte.

La création de compte peut être proposée au moment de la sauvegarde ou de la commande.

Les créations temporaires doivent être associées à une session sécurisée et disposer d'une durée de conservation définie.

---

# 4. MODULE 1 — SITE WEB ET IDENTITÉ VISUELLE

## 4.1. Design général

Développer une interface premium, moderne, minimaliste et créative.

L'expérience visuelle doit mettre en valeur les portraits String Art.

Le site doit inspirer :
- La créativité.
- La personnalisation.
- La qualité artisanale.
- L'innovation technologique.
- Le plaisir de créer soi-même.

Éviter les interfaces génériques de boutiques e-commerce.

Privilégier une approche éditoriale et visuelle, avec de grandes photographies de réalisations, des animations discrètes et des démonstrations du processus de transformation.

## 4.2. Pages publiques

Développer les pages suivantes :

### Accueil
- Présentation du concept.
- Démonstration du processus.
- Exemples de créations.
- Bouton principal de création.
- Présentation des kits.
- Explication du fonctionnement.
- Témoignages clients.
- FAQ.
- Appels à l'action commerciaux.

### Create Your String Art
Interface principale de création.

### Boutique
- Catalogue des produits.
- Catégories.
- Fiches produits.
- Offres numériques et physiques.

### How It Works
Présentation des étapes de réalisation.

### Galerie
Exemples de portraits réalisés.

### FAQ
Questions sur les kits, la réalisation, les photos, les commandes et la livraison.

### Contact
Formulaire de contact et informations commerciales.

### Pages légales
- Conditions générales de vente.
- Politique de confidentialité.
- Politique de remboursement.
- Politique de livraison.
- Gestion des cookies lorsque nécessaire.

## 4.3. Responsive design

L'ensemble de la plateforme doit être optimisé pour :
- Smartphones.
- Tablettes.
- Ordinateurs.

La priorité UX doit être donnée aux smartphones, car une grande partie des utilisateurs importera leurs photographies depuis leur téléphone.

---

# 5. MODULE 2 — STRING ART ENGINE

## 5.1. Importance stratégique

Le moteur String Art représente le cœur technologique et la principale valeur ajoutée de la plateforme.

Il ne doit pas être considéré comme un simple filtre photographique.

Il doit transformer une photographie en une séquence réelle de connexions entre des clous, permettant de reproduire physiquement le portrait avec du fil.

Le résultat numérique doit correspondre exactement au patron physique généré.

## 5.2. Technologies envisagées

- Python.
- OpenCV.
- NumPy.
- Pillow.
- FastAPI.
- Algorithmes d'optimisation d'image.
- Algorithmes géométriques de calcul des segments.

Le choix définitif des bibliothèques doit être justifié par des tests comparatifs.

## 5.3. Étape 1 : Importation de la photographie

Formats acceptés :
- JPG.
- JPEG.
- PNG.
- WebP.

Fonctionnalités :
- Importation depuis un ordinateur.
- Importation depuis un smartphone.
- Prévisualisation.
- Recadrage.
- Rotation.
- Zoom.
- Repositionnement.
- Ajustement de la luminosité.
- Ajustement du contraste.

Le système doit vérifier la qualité et les dimensions de l'image.

Il doit avertir l'utilisateur si la photographie est trop sombre, floue ou si le sujet est difficile à distinguer.

## 5.4. Étape 2 : Prétraitement

Le moteur doit :
- Redimensionner l'image.
- Adapter l'image au format carré.
- Améliorer le contraste.
- Normaliser la luminosité.
- Convertir l'image dans l'espace colorimétrique adapté.
- Préparer une matrice de pixels exploitable par l'algorithme.

La possibilité de travailler avec des portraits en niveaux de gris doit être intégrée au MVP.

## 5.5. Étape 3 : Configuration des clous

Définir une géométrie standardisée.

Chaque clou possède :
- Un identifiant unique.
- Un numéro.
- Une position X.
- Une position Y.
- Une position physique sur le support.

Le moteur doit pouvoir générer les coordonnées des clous selon le gabarit standard.

Les positions doivent être reproductibles et identiques entre le rendu, le PDF et le support physique.

Le nombre de clous sera déterminé par les essais de qualité et les contraintes de fabrication.

## 5.6. Étape 4 : Calcul des connexions

Le moteur doit déterminer les connexions entre les différents clous.

Exemple :

| Ordre | Départ | Arrivée |
|---|---:|---:|
| 1 | 1 | 82 |
| 2 | 82 | 25 |
| 3 | 25 | 137 |
| 4 | 137 | 46 |
| 5 | 46 | 104 |

L'algorithme doit :

1. Initialiser le parcours.
2. Évaluer les segments possibles.
3. Simuler leur effet sur l'image.
4. Mesurer l'amélioration du rendu.
5. Sélectionner le segment qui réduit le mieux l'erreur.
6. Ajouter le segment au parcours.
7. Répéter l'opération jusqu'à atteindre le nombre de connexions souhaité.

L'algorithme devra intégrer :
- Une fonction de comparaison avec l'image cible.
- Une pénalité ou un contrôle des répétitions.
- La gestion de l'épaisseur des fils.
- La prise en compte des zones claires et sombres.
- Des critères de qualité.
- Un nombre maximal de connexions.
- Des conditions d'arrêt.

L'optimisation doit rechercher un compromis entre ressemblance visuelle, complexité de réalisation et consommation de fil.

## 5.7. Étape 5 : Simulation du fil

Le système doit reproduire le comportement visuel du fil.

Prendre en compte :
- Épaisseur du fil.
- Opacité.
- Superposition des segments.
- Densité des connexions.
- Couleur du fil.
- Effet des intersections.

Le rendu doit être suffisamment réaliste pour donner au client une idée crédible du résultat final.

La couleur initiale du fil doit être standardisée pour le MVP. L'architecture pourra accueillir plusieurs couleurs dans une version ultérieure.

## 5.8. Étape 6 : Évaluation du résultat

Le moteur doit comparer le rendu final avec la photographie originale.

Prévoir :
- Comparaison visuelle.
- Mesure d'erreur pixel.
- Mesure de similarité structurelle.
- Évaluation de la qualité du portrait.
- Détection des résultats insuffisamment exploitables.

Ne pas utiliser une seule métrique pour juger la qualité artistique.

Le système doit permettre de tester différents paramètres et de conserver le meilleur résultat.

## 5.9. Paramètres du moteur

Les paramètres suivants doivent être administrables :

- Nombre de clous.
- Nombre de connexions.
- Épaisseur du fil simulé.
- Contraste.
- Luminosité.
- Niveau de détail.
- Nombre maximal d'itérations.
- Critères d'arrêt.
- Paramètres d'optimisation.

Ne pas exposer tous ces paramètres aux clients.

L'utilisateur doit disposer d'une interface simple avec quelques réglages compréhensibles, tandis que les paramètres techniques restent dans l'administration.

---

# 6. MODULE 3 — STRING ART STUDIO

Développer un véritable studio interactif.

## 6.1. Interface

Afficher :
- Photographie originale.
- Rendu String Art.
- Comparaison avant/après.
- Aperçu du support.
- Nombre de clous.
- Nombre de connexions.
- Estimation de la quantité de fil.

## 6.2. Personnalisation

L'utilisateur doit pouvoir :
- Recadrer son image.
- Ajuster le contraste.
- Ajuster la luminosité.
- Modifier le niveau de détail parmi les options disponibles.
- Relancer la génération.

Le format physique carré reste unique.

## 6.3. Prévisualisation

La prévisualisation doit être interactive.

Prévoir :
- Zoom.
- Déplacement.
- Rotation si nécessaire.
- Affichage du rendu complet.
- Affichage des connexions.
- Simulation progressive de la construction.

Une animation doit permettre de visualiser la progression du fil, étape après étape.

## 6.4. Validation

Avant de passer commande, le client doit pouvoir confirmer son résultat.

La version validée doit être sauvegardée avec :
- L'image source.
- Le rendu final.
- Les paramètres du moteur.
- Les coordonnées des clous.
- La liste ordonnée des connexions.
- L'identifiant de la génération.

Une génération validée doit rester reproductible.

---

# 7. MODULE 4 — GÉNÉRATION DES PATRONS

Le système doit générer automatiquement tous les documents nécessaires à la fabrication.

## 7.1. Patron physique

Produire un PDF comprenant :
- Le contour du support.
- Les positions exactes des clous.
- Les numéros des clous.
- Les repères de fabrication.
- Les dimensions réelles.
- Les instructions de préparation.

Le document doit être adapté à une impression à l'échelle réelle, avec des repères de contrôle d'échelle.

## 7.2. Séquence des fils

Générer automatiquement la liste ordonnée des connexions.

Chaque connexion doit comporter :
- Numéro de l'étape.
- Clou de départ.
- Clou d'arrivée.
- Identifiant du fil si nécessaire.

La séquence doit être strictement identique à celle utilisée pour générer le rendu.

## 7.3. Guide PDF

Le guide doit comporter :

1. Présentation du résultat final.
2. Matériel nécessaire.
3. Préparation du support.
4. Explication de la numérotation.
5. Première étape.
6. Séquence complète.
7. Dernière étape.
8. Conseils de finition.

Le document doit être clair, illustré et imprimable.

## 7.4. Calcul des matériaux

Estimer automatiquement :
- Longueur totale du fil.
- Quantité nécessaire.
- Marge supplémentaire.
- Nombre de clous utilisés.

Les calculs doivent intégrer une marge de sécurité définie par l'administrateur.

---

# 8. MODULE 5 — ASSISTANT INTERACTIF DE RÉALISATION

Créer une interface dédiée au client qui réalise son portrait.

## Fonctionnalités

- Présentation de la création validée.
- Affichage de l'étape actuelle.
- Affichage du clou de départ.
- Affichage du clou d'arrivée.
- Identification visuelle des deux clous.
- Passage à l'étape suivante.
- Retour à l'étape précédente.
- Barre de progression.
- Enregistrement automatique.
- Reprise de la réalisation.

## Exemple

Étape 128 sur 1 200.

Clou de départ : 42.

Clou d'arrivée : 186.

Le système met visuellement en évidence les deux clous.

Après avoir terminé la connexion, le client valide l'étape suivante.

## Expérience mobile

L'assistant doit être parfaitement utilisable depuis un smartphone posé à côté du support physique.

Prévoir des boutons suffisamment grands et une interface sans distraction.

## Évolutions futures

- Assistant vocal.
- Instructions audio.
- Vidéos explicatives.
- Détection de progression par caméra, si techniquement réalisable.

Ces évolutions ne sont pas obligatoires pour le MVP.

---

# 9. MODULE 6 — E-COMMERCE

## 9.1. Catalogue

Développer un catalogue permettant de gérer :
- Kits physiques.
- Patrons numériques.
- Offres combinées.
- Accessoires complémentaires.
- Promotions.

## 9.2. Fiches produits

Chaque produit doit présenter :
- Nom.
- Description.
- Photographies.
- Prix.
- Composition.
- Caractéristiques.
- Disponibilité.
- Délais indicatifs.
- Conditions de livraison.

Pour les produits personnalisés, afficher le portrait généré par le client.

## 9.3. Panier

Fonctionnalités :
- Ajouter un produit.
- Modifier la quantité lorsque cela est pertinent.
- Supprimer un produit.
- Afficher le sous-total.
- Calculer les frais de livraison.
- Afficher le total.
- Appliquer un code promotionnel.

## 9.4. Commandes

Chaque commande doit avoir :
- Un numéro unique.
- Un client associé ou une commande invitée.
- Une liste de produits.
- Une création String Art associée.
- Une adresse de livraison si nécessaire.
- Un montant.
- Une devise.
- Un statut de paiement.
- Un statut de préparation.
- Un statut de livraison.
- Une date de création.

## 9.5. Paiements

Prévoir une architecture permettant plusieurs prestataires de paiement.

Les moyens de paiement seront activés selon les marchés et les possibilités réglementaires et techniques.

Ne pas imposer un prestataire unique à toute la plateforme.

Prévoir une intégration sécurisée avec vérification serveur des notifications de paiement.

Ne jamais stocker directement les données bancaires sensibles.

## 9.6. Livraison

Prévoir :
- Gestion des pays.
- Zones de livraison.
- Frais par zone.
- Transporteurs.
- Délais estimatifs.
- Numéro de suivi.
- Statuts de livraison.

---

# 10. MODULE 7 — ESPACE CLIENT

Créer un espace personnel permettant de retrouver :

## Profil
- Nom et prénom.
- Email.
- Téléphone.
- Pays.
- Adresses.

## Mes créations
- Créations en cours.
- Créations terminées.
- Portraits validés.
- Téléchargements disponibles.
- Historique des générations.

## Mes commandes
- Commandes passées.
- Statut.
- Paiement.
- Livraison.
- Factures ou justificatifs disponibles.

## Mes réalisations
- Progression.
- Dernière étape effectuée.
- Reprise de la réalisation.
- Historique des réalisations.

---

# 11. MODULE 8 — BACK-OFFICE ADMINISTRATEUR

Développer une interface d'administration complète.

## 11.1. Dashboard

Indicateurs :
- Chiffre d'affaires.
- Nombre de commandes.
- Nombre de clients.
- Panier moyen.
- Nombre de générations.
- Taux de conversion.
- Produits les plus vendus.
- Répartition par marché.
- Commandes en attente.
- Commandes en cours de livraison.

## 11.2. Gestion des produits

- Création.
- Modification.
- Suppression logique.
- Prix.
- Variantes commerciales.
- Images.
- Stock.
- Disponibilité.
- Composition des kits.

## 11.3. Gestion des commandes

- Recherche.
- Filtrage.
- Consultation.
- Modification des statuts.
- Gestion des paiements.
- Gestion des livraisons.
- Export des données.

## 11.4. Gestion des clients

- Liste des clients.
- Historique.
- Commandes.
- Créations.
- Coordonnées.
- Gestion des demandes de support.

## 11.5. Gestion du moteur

L'administrateur doit pouvoir :
- Consulter les générations.
- Consulter les paramètres utilisés.
- Identifier les erreurs.
- Consulter les durées de traitement.
- Consulter les statistiques de génération.
- Configurer les paramètres globaux.
- Activer ou désactiver certaines options.

## 11.6. Gestion des marchés

- Pays.
- Langues.
- Devises.
- Prix.
- Taxes.
- Paiements.
- Livraison.
- Disponibilité commerciale.

## 11.7. Gestion des utilisateurs

Prévoir plusieurs rôles :
- Super administrateur.
- Administrateur.
- Gestionnaire commercial.
- Gestionnaire des commandes.
- Gestionnaire du catalogue.

Chaque rôle doit avoir des autorisations spécifiques.

---

# 12. MODULE 9 — INTERNATIONALISATION

La plateforme doit être conçue dès le départ pour une exploitation internationale.

## Langues

- Français.
- Anglais.
- Arabe.

L'arabe doit disposer d'une véritable prise en charge RTL :
- Direction du texte.
- Alignements.
- Navigation.
- Formulaires.
- Composants d'interface.
- Emails.

Ne pas se contenter d'une traduction automatique superficielle.

## Devises

Prévoir :
- DZD.
- EUR.
- USD.
- Autres devises configurables.

La devise doit être liée au marché commercial sélectionné.

Les prix ne doivent pas être convertis arbitrairement à chaque affichage. Prévoir une gestion des tarifs par marché et des règles de conversion administrables.

## Marchés

Chaque marché doit pouvoir disposer de :
- Ses propres tarifs.
- Ses propres moyens de paiement.
- Ses propres transporteurs.
- Ses propres frais de livraison.
- Ses propres conditions commerciales.

L'architecture doit permettre d'ajouter facilement de nouveaux pays.

---

# 13. MODULE 10 — NOTIFICATIONS ET COMMUNICATION

Prévoir un système de notifications automatisées.

Événements :
- Création d'un compte.
- Création d'un portrait.
- Génération terminée.
- Commande créée.
- Paiement confirmé.
- Commande préparée.
- Commande expédiée.
- Commande livrée.
- Mot de passe oublié.

Canaux :
- Email.
- Notifications dans l'espace client.

Les notifications doivent être administrables et traduites.

Prévoir une architecture extensible vers d'autres canaux ultérieurement.

---

# 14. ARCHITECTURE TECHNIQUE

## 14.1. Architecture recommandée

### Frontend
- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- Bibliothèque de composants UI cohérente.

### Backend
- Next.js API ou architecture backend dédiée selon les besoins.
- API REST sécurisées.
- Gestion des sessions.
- Authentification.
- Gestion des rôles.

### Base de données
- PostgreSQL.
- Prisma ORM ou Drizzle ORM.

### Moteur String Art
- Python.
- OpenCV.
- NumPy.
- Pillow.
- FastAPI.

### Stockage
- Supabase Storage ou solution compatible S3.
- Gestion des photos.
- Gestion des rendus.
- Stockage des PDF.
- Gestion des fichiers générés.

### Traitements asynchrones
Prévoir un système de tâches en arrière-plan pour les générations longues.

Les générations doivent pouvoir être :
- Créées.
- Mises en file d'attente.
- Exécutées.
- Suivies.
- Terminées.
- Échouées.
- Relancées en cas d'erreur.

Prévoir un identifiant unique et une protection contre les générations en double.

### Hébergement
Choisir une architecture permettant de déployer indépendamment :
- L'application web.
- Le backend.
- Le moteur Python.
- La base de données.
- Le stockage.

Les décisions d'hébergement doivent tenir compte des coûts réels, de la disponibilité par marché et des contraintes de traitement des images.

---

# 15. STRUCTURE DE BASE DE DONNÉES

Prévoir au minimum les entités suivantes :

1. Users
2. UserAddresses
3. Roles
4. Permissions
5. Products
6. ProductVariants
7. ProductImages
8. ProductMaterials
9. Inventory
10. Markets
11. Currencies
12. MarketPrices
13. Orders
14. OrderItems
15. Payments
16. Shipments
17. StringArtProjects
18. UploadedImages
19. ImageProcessingJobs
20. StringArtGenerations
21. NailPositions
22. ThreadSequences
23. GeneratedFiles
24. CreationProgress
25. Coupons
26. Notifications
27. Reviews
28. SupportRequests
29. Settings
30. AuditLogs

Les relations, contraintes, index et règles de suppression doivent être documentés avant la mise en production.

Éviter de stocker chaque connexion dans une structure inutilement lourde si une séquence JSON structurée ou un stockage optimisé est plus pertinent.

Toute génération validée doit conserver une version immuable de ses paramètres et de ses résultats.

---

# 16. SÉCURITÉ ET PROTECTION DES DONNÉES

Exigences :

- Authentification sécurisée.
- Gestion des autorisations côté serveur.
- Validation de toutes les entrées.
- Protection contre les injections.
- Protection contre les accès directs non autorisés aux fichiers.
- Limitation des tentatives de connexion.
- Protection des API.
- Vérification des webhooks de paiement.
- Gestion sécurisée des secrets.
- Journalisation des opérations sensibles.
- Sauvegardes régulières.

## Protection des photographies

Les photographies personnelles doivent être traitées comme des données privées.

Prévoir :
- Accès privé aux fichiers.
- URLs temporaires sécurisées.
- Politique de conservation.
- Suppression des photos sur demande.
- Suppression automatique selon les règles de conservation.
- Contrôle des accès administrateurs.
- Absence d'utilisation des photos à des fins publicitaires sans autorisation distincte.

Ne pas utiliser les photographies des clients pour entraîner un modèle d'IA.

Prévoir les documents légaux et les exigences applicables dans les différents marchés.

---

# 17. PERFORMANCE ET EXPÉRIENCE UTILISATEUR

La plateforme doit être rapide et stable.

Objectifs :
- Chargement rapide des pages.
- Interface responsive.
- Optimisation des images.
- Chargement progressif des contenus.
- Gestion des générations longues.
- Affichage de la progression du moteur.
- Gestion des erreurs compréhensible pour l'utilisateur.
- Reprise après interruption lorsque possible.

Une génération ne doit jamais bloquer toute l'application.

Prévoir des tests de charge pour estimer le coût réel de plusieurs générations simultanées.

---

# 18. TESTS ET CONTRÔLE QUALITÉ

## 18.1. Tests du moteur

Tester avec plusieurs catégories :
- Portrait humain.
- Portrait de couple.
- Portrait d'enfant.
- Animal.
- Photographie sombre.
- Photographie claire.
- Photographie avec arrière-plan complexe.
- Photographie avec plusieurs sujets.

Évaluer :
- Ressemblance.
- Netteté.
- Contraste.
- Temps de traitement.
- Longueur de fil.
- Nombre de connexions.
- Reproductibilité.

## 18.2. Tests physiques

C'est une étape obligatoire.

Les patrons numériques doivent être testés sur un véritable support physique.

Vérifier :
- Correspondance des positions des clous.
- Précision des numéros.
- Respect de la séquence.
- Longueur réelle du fil.
- Faisabilité du parcours.
- Qualité du résultat physique.
- Différence entre simulation et résultat final.

Ne pas commercialiser le moteur avant d'avoir validé plusieurs réalisations physiques.

## 18.3. Tests e-commerce

- Création de commande.
- Paiement.
- Annulation.
- Remboursement.
- Livraison.
- Stock.
- Notifications.
- Commandes invitées.
- Gestion des erreurs de paiement.

## 18.4. Tests internationaux

- Langues.
- RTL.
- Devises.
- Prix.
- Paiements.
- Frais de livraison.
- Emails traduits.

---

# 19. ROADMAP DE DÉVELOPPEMENT

Le développement doit être organisé en phases successives.

## PHASE 0 — Cadrage technique
- Analyse du cahier des charges.
- Architecture.
- Modèle de données.
- Choix des dépendances.
- Initialisation GitHub.
- Création de CLAUDE.md.
- Documentation.

Livrable : architecture validée.

## PHASE 1 — String Art Engine
- Prétraitement.
- Géométrie des clous.
- Calcul des segments.
- Optimisation.
- Simulation.
- Évaluation.
- Tests comparatifs.

Livrable : moteur capable de générer un véritable parcours String Art.

## PHASE 2 — Studio
- Importation.
- Recadrage.
- Paramétrage.
- Génération.
- Comparaison.
- Prévisualisation.

Livrable : studio de création opérationnel.

## PHASE 3 — Patrons
- Positionnement des clous.
- Séquence des fils.
- PDF imprimable.
- Guide de réalisation.
- Calcul des matériaux.

Livrable : patron exploitable physiquement.

## PHASE 4 — Assistant de réalisation
- Instructions.
- Progression.
- Sauvegarde.
- Reprise.

Livrable : assistant fonctionnel.

## PHASE 5 — E-commerce
- Catalogue.
- Produits.
- Panier.
- Commandes.
- Paiements.
- Livraison.

Livrable : première boutique opérationnelle.

## PHASE 6 — Espace client
- Comptes.
- Créations.
- Historique.
- Commandes.
- Téléchargements.

Livrable : espace personnel.

## PHASE 7 — Back-office
- Dashboard.
- Produits.
- Stocks.
- Clients.
- Commandes.
- Générations.
- Utilisateurs.

Livrable : administration complète.

## PHASE 8 — Internationalisation
- Français.
- Anglais.
- Arabe.
- RTL.
- Marchés.
- Devises.

Livrable : plateforme multilingue et multi-marchés.

## PHASE 9 — Préproduction et lancement
- Tests complets.
- Sécurité.
- Performance.
- Tests physiques.
- Déploiement.
- Documentation.
- Lancement commercial.

Livrable : première version commercialisable.

---

# 20. PÉRIMÈTRE MVP

La première version doit se concentrer sur les fonctionnalités réellement indispensables.

### Indispensable

- Site vitrine.
- Importation de photographie.
- Un seul format carré.
- Moteur String Art monochrome initial.
- Prévisualisation.
- Génération des connexions.
- Génération du patron PDF.
- Génération du guide.
- Offre numérique.
- Offre kit physique.
- Panier.
- Commandes.
- Gestion administrative.
- Français et anglais au minimum, avec architecture arabe prête.
- Sécurité des photos.

### À reporter

- Plusieurs dimensions.
- Plusieurs formes.
- Portraits multicolores.
- Marketplace.
- Programme de fidélité.
- Application mobile native.
- Réalité augmentée.
- Assistant vocal.
- Génération de portraits de groupe avancée.

Ne pas développer les évolutions futures avant la validation du MVP.

---

# 21. RÈGLES DE TRAVAIL POUR CLAUDE CODE

Ces règles sont obligatoires pour toute la durée du développement.

## 21.1. Méthode de développement

Claude Code doit travailler comme un architecte logiciel senior et un développeur full-stack expérimenté.

Il doit :

1. Lire le présent cahier des charges avant toute intervention.
2. Analyser l'architecture existante avant toute modification.
3. Travailler par phases.
4. Découper les phases en tâches courtes.
5. Expliquer les choix techniques importants.
6. Développer du code modulaire.
7. Respecter les conventions de nommage.
8. Documenter les fonctionnalités.
9. Écrire des tests automatisés.
10. Vérifier le fonctionnement après chaque modification.

## 21.2. Interdictions

Ne jamais :
- Développer tous les modules simultanément.
- Remplacer une fonctionnalité opérationnelle sans justification.
- Supprimer du code existant sans analyse.
- Inventer une fonctionnalité comme étant opérationnelle.
- Utiliser des données fictives en production.
- Mettre des secrets dans le code source.
- Ignorer les erreurs.
- Contourner les tests.
- Ajouter des dépendances inutiles.
- Créer une architecture inutilement complexe.
- Sacrifier la précision du moteur pour gagner du temps.

## 21.3. Gestion GitHub

- Utiliser Git pour versionner les changements.
- Faire des commits réguliers.
- Créer des branches pour les développements importants.
- Ne jamais écraser une version stable sans sauvegarde.
- Documenter les modifications.
- Maintenir un README à jour.

## 21.4. Documentation obligatoire

Maintenir les fichiers suivants :

- CLAUDE.md : instructions permanentes.
- README.md : présentation et installation.
- docs/architecture.md : architecture.
- docs/database.md : base de données.
- docs/algorithm.md : moteur String Art.
- docs/roadmap.md : progression.
- docs/changelog.md : historique.
- docs/testing.md : tests et validations.

## 21.5. Validation à chaque phase

À la fin de chaque phase, Claude doit fournir :

- Fonctionnalités développées.
- Fichiers créés ou modifiés.
- Dépendances ajoutées.
- Tests réalisés.
- Résultats des tests.
- Problèmes connus.
- Fonctionnalités restant à développer.
- Instructions pour vérifier le résultat.

Ne jamais considérer une phase comme terminée si ses critères de validation ne sont pas satisfaits.

---

# 22. CRITÈRES FINAUX DE RÉUSSITE

Le projet sera considéré comme commercialement exploitable lorsque :

1. Un client peut importer une photographie.
2. Le moteur génère un véritable portrait String Art.
3. Le résultat est suffisamment fidèle pour être reproduit physiquement.
4. Le système génère des positions de clous exactes.
5. Le système calcule une séquence de fils reproductible.
6. Le patron PDF est imprimable et utilisable.
7. Le client peut suivre les instructions sur son smartphone.
8. Le client peut acheter le patron numérique.
9. Le client peut acheter un kit physique.
10. Les commandes peuvent être administrées.
11. Les paiements fonctionnent selon les marchés activés.
12. La plateforme fonctionne correctement sur mobile et ordinateur.
13. Les langues principales sont opérationnelles.
14. Les photographies des clients sont protégées.
15. Les tests physiques confirment la correspondance entre le patron et la réalisation.

---

# 23. INSTRUCTION FINALE

Ce cahier des charges constitue la référence fonctionnelle et technique du projet STRING ART PLATFORM.

Il ne faut pas interpréter ce document comme une demande de développement immédiat de toutes les fonctionnalités.

La priorité absolue est de construire un moteur String Art fiable, précis et capable de produire des patrons physiquement réalisables.

L'expérience e-commerce doit ensuite être construite autour de ce moteur.

Le développement doit être progressif, documenté, testé et validé à chaque étape.

**Objectif final : construire une plateforme internationale de personnalisation et de commercialisation de créations String Art, dotée de son propre moteur algorithmique et d'une expérience client premium.**

# Risques — Réorganisation de la page Analyse

**Agent :** Risk Analyst
**Date :** 2026-09-08

---

## P0 — Bloquant, à traiter avant/pendant le développement

### R1 — `phase_att` peut être vide sur les anciennes saisons (F8)

Comme `intention_attaque`/`Tableau_MATCH` (vides sur 2025-2026, confirmé normal par Romain, cf. mémoire `project-roadmap.md`), rien ne garantit que `phase_att` est renseigné sur tous les matchs déjà importés. Si `computeSuperiorites()` tombe sur un match sans aucune ligne `phase_att` non-vide, le bloc "Supériorités" afficherait "FENIX 0 — 0 ADVERSAIRE" — indiscernable d'un vrai match sans aucune exclusion.

**Mitigation actée** : le Developer vérifie en story si `phase_att` est peuplé sur au moins 3 matchs de saisons différentes avant de considérer F8 terminée. Si la colonne est vide sur certaines saisons, afficher "Non disponible pour ce match" plutôt que "0 — 0" (distinction déjà appliquée ailleurs dans l'app pour des données absentes vs réellement nulles — cohérent avec l'existant, pas un nouveau pattern à inventer).

### R2 — Migration de `sessionStorage.an_active_tab` avec un ancien id d'onglet (F2)

Un utilisateur ayant laissé l'app ouverte (ou dont le `sessionStorage` contient encore `resume`/`gardien`/`chat` d'avant ce déploiement) verrait `_analyseTab()` échouer silencieusement à activer un onglet qui n'existe plus dans `AN_TABS_MATCH`/`AN_TABS_SAISON`.

**Mitigation actée dans l'Architecture (§3)** : `_analyseTab()` doit vérifier l'existence de l'id avant activation et retomber sur le premier onglet par défaut sinon. À couvrir explicitement en QA (test avec un ancien id injecté manuellement en `sessionStorage`).

## P1 — Important, à ne pas ignorer mais pas bloquant

### R3 — Bug préexistant du calcul Supériorités corrigé silencieusement (F8)

Le calcul actuel (`generateResume3Points`/`generateIndicateurs`) est utilisé en production depuis le début du projet — les chiffres "Supériorités" que Romain a vus sur tous les matchs passés étaient calculés selon la méthode erronée (§4.1 de l'Architecture). Le nouveau calcul donnera potentiellement des chiffres très différents sur les mêmes matchs déjà analysés.

**Mitigation proposée** : le signaler explicitement à Romain au moment de la livraison de F8 (pas juste un changelog silencieux) — comparer sur un match qu'il connaît bien l'ancien vs le nouveau chiffre, pour qu'il comprenne que ce n'est pas une régression mais une correction. Le Developer/QA doit produire cette comparaison dans son rapport.

### R4 — Grille météo (F6) peut induire en erreur sur un petit échantillon

Une cellule de la grille terrain avec 1 seul tir raté affichera un "rouge total" (0% de réussite) alors que l'échantillon n'a aucune valeur statistique — même risque que celui déjà rencontré et traité pour l'Articulation défensive (STORY-37/38, seuil "Échantillon faible" à ≥5 séquences).

**Mitigation proposée** : appliquer le même principe de seuil minimal par cellule (ex. griser/atténuer une cellule avec moins de N tirs, N à définir en story, cohérent avec les seuils déjà choisis ailleurs dans l'app plutôt qu'un nouveau chiffre inventé) plutôt que de peindre une couleur pleine sur un échantillon d'1.

### R5 — Performance du flou Canvas (F6) sur terrain fréquemment redessiné

`ctx.filter = 'blur()'` sur Canvas 2D est plus coûteux qu'un remplissage simple, et `drawTerrain()` est appelé à chaque changement de filtre (Club/Résultat/GE) et au redimensionnement. Sur un match avec beaucoup de tirs, un rafraîchissement perceptiblement plus lent qu'aujourd'hui serait une régression UX silencieuse.

**Mitigation proposée** : mesurer en story sur le match le plus chargé de la saison ; si le flou est visiblement lent, réduire son rayon plutôt que le supprimer (l'effet "dégradé" reste l'objectif validé par Romain).

### R6 — Duplication du calcul Supériorités pas totalement éliminée si la story F8 est mal scopée

L'Architecture identifie explicitement 2 sites dupliqués (`generateResume3Points` L165-170, `generateIndicateurs` L271-276) — un développement partiel qui ne corrigerait que l'un des deux laisserait le bloc Essentiel (F1) et l'onglet Indicateurs afficher deux chiffres différents pour la même statistique, un bug plus visible et plus confus que l'ancien calcul uniforme (même si faux, il était au moins cohérent avec lui-même).

**Mitigation actée** : la story F8 doit explicitement lister les deux sites d'appel comme critère d'acceptation, pas seulement "corriger le calcul des supériorités".

## P2 — Mineur, à surveiller

### R7 — Bloc "Essentiel" saison redondant avec l'onglet "Tendances" (déjà noté au PRD)

Risque déjà identifié dans `docs/prd.md` §7 pour le bloc Essentiel match — s'applique symétriquement à la vue saison (le bloc Essentiel saison résume `generateSeasonCorrelations()`, qui reste consultable en détail dans l'onglet Tendances juste en dessous). Pas de mitigation technique — à observer à l'usage, ajuster si Romain trouve la redondance gênante après quelques semaines.

### R8 — Chips "questions types" (F12) désynchronisées si le Chat IA évolue plus tard

Les questions types sont des chaînes de texte pré-écrites correspondant à ce que le moteur rule-based sait traiter aujourd'hui. Si le moteur de réponse change de logique plus tard sans qu'on pense à revoir les chips, certaines pourraient déclencher une réponse générique/inadaptée.

**Mitigation proposée** : aucune action immédiate (hors scope), juste une note dans le code (commentaire) reliant les chips aux patterns du moteur rule-based qu'elles sont censées déclencher, pour qu'un futur changement du moteur pense à vérifier les chips.

## Synthèse

Aucun risque P0 ne remet en cause la faisabilité du cycle — R1 et R2 sont des cas de bord à couvrir en développement/QA, pas des blocages d'architecture. Le risque le plus important à communiquer à Romain reste R3 (les chiffres Supériorités vont changer sur des matchs déjà vus) : ce n'est pas un risque technique mais un risque de confiance si la correction n'est pas expliquée.

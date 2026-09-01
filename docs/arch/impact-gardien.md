# Architecture — Page Impact pour un gardien

**Agent :** Architect
**Date :** 2026-09-01

---

## 1. Décision technique

### F1 — Réutiliser le pattern déjà validé de `renderPlayerZones()` (mode joueur mobile)

Le Mode Lecture Joueur mobile (`js/player-mode.js`, fonction `renderPlayerZones()`) gère **déjà** parfaitement le cas gardien : filtre sur `finalite`/`gardien` via `matchPlayerName()`, libellés adaptatifs ("ARRÊTS ET BUTS CONCÉDÉS", "Arrêté"/"Encaissé"), grille de zones fonctionnelle pour les deux cas. C'est la meilleure référence disponible dans le projet — supérieure même à `printFicheJoueur()` (export PDF, qui gère les zones mais pas la grille de zones interactive ni les filtres).

**Décision** : porter ce même pattern (calcul `isGB` en tête de fonction, deux branches de filtre `DATA.filter()` selon `isGB`, libellés dynamiques) dans `updateImpactPage()` (`FENIX-HANDBALL-CF-SUIVI.html`, staff/desktop) — pas une réécriture depuis zéro, une adaptation directe d'un code déjà éprouvé en production.

**Alternative rejetée** : corriger `updateGardiensPage()`/`page-gardiens` en place (juste passer la comparaison stricte en `matchPlayerName()`, comme les 3 fixes du matin). Rejetée parce que :
- Ça laisserait deux implémentations parallèles de "l'Impact d'un joueur" à maintenir indéfiniment (une par filtre/canvas/zone pour joueur de champ, une autre quasi-identique pour gardien).
- `page-gardiens` n'a ni la grille "Efficacité par zone", ni le mode Comparer aligné avec le reste de l'app (visuellement daté, jamais retouché depuis les passes STORY-13→19).
- Ne répond pas à F2 (nom affiché) sans dupliquer encore une fois ce travail sur une 2e page.

### F2 — Nom du joueur affiché : nouvelle constante module partagée

`_posteLblMap` (mapping code poste → libellé complet) existe déjà, mais en portée locale à `printFicheJoueur()`. Remontée en constante module-level `POSTE_LABELS` (même fichier `js/page-joueurs.js`, au niveau où vit déjà `POSTE_POSITIONS` — le placement des joueurs sur le terrain SVG, pattern de constante partagée déjà établi dans ce fichier) : réutilisée par `printFicheJoueur()` (renommer son usage local vers la constante partagée) et par la nouvelle fonction d'affichage du nom sur `page-impact`. Évite une divergence future entre les deux libellés de poste.

### F4 — Décommissionnement de `page-gardiens`

**Confirmé accepté** (risque du PRD tranché) : recherche exhaustive (`grep -rn "page-gardiens\|updateGardiensPage\|filter-gardien\b\|goal-canvas-alg\|goal-canvas-face\|goal-canvas-ald\|drawGardienCanvas"`) ne remonte que des références internes à ce sous-système lui-même (le markup de la page, ses propres filtres, son propre appel de rafraîchissement) — aucun lien de navigation, aucun favori possible (jamais exposé par une URL dédiée, c'est une SPA à onglets), aucune autre fonctionnalité qui en dépend. Suppression sûre une fois F1 livrée et vérifiée.

**Ordre d'exécution impératif** : F4 ne doit être faite qu'**après** F1 vérifiée en conditions réelles (E2E) — jamais avant, pour ne jamais laisser de fenêtre sans aucun écran Impact fonctionnel pour un gardien.

## 2. Impact sur l'existant

- `openImpactForSelected()` (`FENIX-HANDBALL-CF-SUIVI.html:1416`) : la branche `if (detectIsGB(currentSelectedJoueur))` ne route plus vers `page-gardiens` — elle prépare le filtre `#filter-impact-joueur` (comme la branche `else` le fait déjà pour un joueur de champ) et affiche `page-impact`. Les deux branches convergent presque entièrement — à évaluer par le Developer si une fusion complète des deux branches est plus propre qu'une simple suppression de la branche GB (préférence Architecture : fusionner, une seule branche qui pré-sélectionne le bon joueur dans `#filter-impact-joueur` quel que soit son poste, puisque ce filtre est déjà commun aux deux types de joueurs contrairement à avant).
- `updateImpactPage()` : ajout d'un calcul `isGB` en tête (réutilise `detectIsGB()`, déjà utilisée ailleurs dans le fichier), deux branches de filtre pour `filteredAll`/`filtered` (club adverse + finalite + gardien, vs. club FENIX + resultat + joueur, actuel), libellés dynamiques pour les 3 stats et la légende, appel `getPlayerPoste()`/couleur d'efficacité à revoir pour le cas gardien (cf. §6 risque).
- `updateZoneEfficacite()` : le calcul `isGbSelected` existe déjà dans cette fonction (ligne ~3005) — **aucun changement nécessaire ici**, elle gère déjà les deux cas correctement. Bon signal que la divergence entre `updateImpactPage()` et `updateZoneEfficacite()` (l'une gère isGB, l'autre pas) est bien la seule vraie lacune à combler.
- Nouveau : petit bloc d'affichage nom+poste sous le titre de section (F2), alimenté par `JOUEURS_TERRAIN`/`POSTE_LABELS`, mis à jour en fin de `updateImpactPage()`.
- `page-gardiens`, `updateGardiensPage()`, `drawGardienCanvas()` : supprimés (F4), une fois F1 vérifiée.

## 3. Nouvelles structures de données

Aucune — toutes les données nécessaires (`DATA`, `COLS.gardien`/`COLS.finalite`/`COLS.impact`, `JOUEURS_TERRAIN`) existent déjà et sont déjà utilisées correctement ailleurs (`renderPlayerZones()`, `printFicheJoueur()`).

## 4. Nouvelles fonctions/modules

- `POSTE_LABELS` (constante module, `js/page-joueurs.js`) — mapping code poste → libellé complet, remplace la constante locale `_posteLblMap` de `printFicheJoueur()`.
- `updateImpactPage()` (existante, réécrite) : ajout de la branche gardien, calquée sur `renderPlayerZones()`.
- Pas de nouvelle fonction séparée pour F2 — quelques lignes ajoutées en fin de `updateImpactPage()` pour peupler un nouvel élément `#impact-joueur-nom` (nouveau, à ajouter au markup HTML par le Developer selon la maquette Designer).

## 5. Impact sur le Mode Lecture Joueur mobile (F3)

**Aucun changement de code attendu** — `renderPlayerZones()` gère déjà correctement les deux cas, c'est la référence utilisée pour F1. F3 reste néanmoins une story à part entière avec vérification E2E explicite (pas de changement de code ≠ pas de vérification : le principe "je ne fais pas confiance au code, je vérifie en conditions réelles", déjà appliqué toute la journée sur ce projet, s'applique ici aussi).

## 6. Risques

- **Grille "Efficacité par zone" et seuils par poste, confirmé — pas juste hypothétique** (`updateZoneEfficacite()`, ligne ~3040 : `const s = ZONE_SEUILS[cat];`) : cette ligne s'exécute à l'identique que `isGbSelected` soit vrai ou faux — les seuils vert/orange/rouge sont pensés pour un % de réussite au tir d'un joueur de champ, pas pour un % d'arrêt de gardien. Sans correction, un gardien à 38% d'arrêts (normal pour ce poste) pourrait être coloré "mauvais" avec un seuil taillé pour un ailier. **À corriger dans cette story** (pas juste à vérifier) : si F5 n'est pas prise, `updateZoneEfficacite()` doit sauter la coloration par seuil pour un gardien (afficher le % sans couleur sémantique, `zr-eff-grey` ou équivalent neutre) plutôt que d'appliquer un seuil trompeur.
- **Fusion des deux branches de `openImpactForSelected()`** : risque de régression sur le joueur de champ si la fusion est mal faite. Mitigé par un test de non-régression explicite (joueur de champ avant/après, comparaison exacte) en E2E.
- **F4 avant F1 vérifiée** : risque de régression totale (aucun écran Impact fonctionnel pour un gardien pendant la fenêtre entre suppression et fix) si l'ordre n'est pas respecté — mitigation : deux stories distinctes, F4 explicitement dépendante de la story F1.

## 7. Critère de bascule

Si un jour un 3e "type" de joueur apparaît (ex. un poste avec encore une autre source de colonnes), revoir la structure en branches `if (isGB)` pour quelque chose de plus généralisé (table de configuration par poste plutôt que des branches conditionnelles) — prématuré pour 2 cas seulement aujourd'hui.

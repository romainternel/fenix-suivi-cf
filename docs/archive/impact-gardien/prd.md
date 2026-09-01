# PRD — Page Impact pour un gardien

**Agent :** Product Manager
**Date :** 2026-09-01

---

## 1. Objectif

Faire fonctionner la page Impact pour un gardien en réutilisant l'écran moderne déjà utilisé pour les joueurs de champ (`page-impact`), au lieu de la page orpheline cassée (`page-gardiens`) — et afficher le nom du joueur consulté sur cet écran, pour tout le monde.

## 2. Features

### F1 — Impact d'un gardien sur `page-impact` (Must Have)
`openImpactForSelected()` route désormais un gardien vers `page-impact` (comme un joueur de champ), plus jamais vers `page-gardiens`. `updateImpactPage()` (et ses fonctions associées `updateZoneEfficacite()`, le calcul des stats générales, le dessin des 3 canvas) détecte le cas gardien et bascule sa source de données : club adverse (`row[COLS.club] !== 'FENIX'`), `finalite` ('Tir arrêté'/'But' encaissé) au lieu de `resultat`, comparaison sur `row[COLS.gardien]` via `matchPlayerName()` au lieu de `row[COLS.joueur]`.

### F2 — Nom du joueur/gardien affiché sur la page Impact (Must Have)
Un intitulé visible (ex. sous le titre "🎯 Impact au Shoot") affiche le nom complet du joueur actuellement sélectionné ("Tous les joueurs" si aucun filtre) — pour un joueur de champ comme pour un gardien.

### F3 — Vérification et alignement du Mode Lecture Joueur mobile (Must Have)
Un gardien connecté lui-même doit pouvoir consulter sa propre page Impact sans le même bug. Vérification explicite du code déjà en place (`js/player-mode.js`), correction si un écart est trouvé.

### F4 — Décommissionnement de `page-gardiens` (Should Have)
Une fois F1 livrée et vérifiée, `page-gardiens`/`updateGardiensPage()`/`drawGardienCanvas()` n'ont plus aucun appelant utile — à retirer pour ne pas laisser une deuxième implémentation morte et non maintenue derrière. Conditionné à la confirmation par l'Architect qu'aucune autre référence n'existe (déjà vérifié par grep exhaustif au moment du Brief, à re-confirmer avant suppression).

### F5 — Grille "Efficacité par zone" pour un gardien (Nice to Have)
La page Impact actuelle affiche une grille de zones colorées par seuil d'efficacité pour un joueur de champ (`getPlayerPoste()`, `ZONE_SEUILS`), absente pour un gardien. Étendre cette grille au cas gardien (avec ou sans seuils colorés — à trancher par le Designer) apporterait de la cohérence, mais n'est pas nécessaire pour que le bug soit résolu : les 3 vues terrain (zones d'arrêt/encaissement) suffisent déjà à répondre au besoin initial de Romain.

## 3. Priorités

| # | Feature | Priorité |
|---|---|---|
| F1 | Impact gardien sur page-impact | Must Have |
| F2 | Nom du joueur affiché | Must Have |
| F3 | Vérification mode joueur mobile | Must Have |
| F4 | Décommissionnement page-gardiens | Should Have |
| F5 | Grille efficacité par zone (gardien) | Nice to Have |

## 4. Critères d'acceptation

- Sélectionner un gardien (Gabin.S, Noah.O ou Enzo.D) puis "🎯 Impact" → stats non nulles cohérentes avec sa fiche (ex. Enzo Ditta : 15/40 arrêts/tirs, 38%), 3 vues terrain peuplées de points verts (arrêt)/croix rouges (but encaissé).
- Un joueur de champ sélectionné → comportement strictement inchangé (non-régression explicite, comparaison avant/après).
- Le nom du joueur consulté est visible à l'écran, pour les deux cas.
- Le mode joueur mobile testé explicitement pour un gardien connecté lui-même (pas supposé fonctionner).
- Si F4 livrée : recherche exhaustive (`grep`) confirmant qu'aucun code ne référence plus `page-gardiens`/`updateGardiensPage` avant suppression.

## 5. Hors scope

- Les 4 autres fonctionnalités déjà corrigées le jour même (onglet Gardien de l'Analyse, table GB, graphique de progression, et leur cause commune) — non concernées par ce cycle.
- Refonte visuelle de la page Impact au-delà de l'ajout du nom du joueur et, si F5 retenue, de la grille de zones.
- Export PDF/PPT — déjà fonctionnel pour un gardien, non touché.

## 6. Dépendances

- Aucune dépendance externe. Le fix des 3 régressions du matin (v246) est déjà en production — cette story s'appuie sur le même pattern (`matchPlayerName()`) mais sur un chemin de code différent.

## 7. Risques

- **F4 (suppression de page-gardiens)** : si un lien externe, un favori navigateur, ou une intégration future pointait vers cette page par son ID, la suppression casserait ce chemin. Impact jugé très faible (aucune navigation ne l'expose, confirmé par recherche exhaustive), mais l'Architect doit trancher formellement si le risque est acceptable ou s'il vaut mieux la laisser en l'état (morte mais présente) pour ce cycle.
- **F1** : réutiliser `updateImpactPage()` pour 2 cas (joueur/gardien) avec des colonnes sources différentes augmente légèrement sa complexité — à surveiller pour ne pas la rendre illisible (l'Architect doit statuer sur la structure du code, ex. sous-fonctions séparées vs. branches conditionnelles).

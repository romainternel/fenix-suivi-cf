# Code Review — STORY-36 : Refonte lisibilité du mode Articulation

**Agent :** Code Reviewer
**Date :** 2026-09-06

---

## Conformité à l'architecture

- `ARTIC_6M_ARC` + `_articArcY()` implémentés exactement comme spécifié dans `docs/arch/articulation-lisibilite.md` §1.1 — les positions dérivent bien de l'équation de l'ellipse plutôt que de décimales recopiées à la main. ✅
- `ARTIC_LAYOUTS` reste un objet statique calculé une seule fois via IIFE au chargement du script — conforme, aucun recalcul par rendu. ✅
- `.artic-poste.selected` passe bien de `box-shadow` à `outline` comme prescrit en §1.2, précisément pour éviter la collision avec le liseré d'efficacité — vérifié en test que les deux signaux coexistent (`outline` + `box-shadow` tous deux présents dans les styles calculés). ✅
- `computeArticulationStats`, `_articBlockEff`, `ARTIC_BLOCKS`, `_articPrimaryEntry`, `_articCourtSvg` sont bien inchangés — aucun calcul de donnée retouché, conformément au PRD (hors scope explicite). ✅
- La carte "Référence adverse" est construite au moment du rendu (dépend de `g`/`dispositif`), pas ajoutée dans la constante `ARTIC_BLOCKS` — respecte la distinction faite par l'Architect entre donnée dépendante du rendu et bloc indépendant de `lineup`. ✅

## Scope

Le diff touche exclusivement `js/page-analyse.js` (bloc Articulation) et `css/style.css` (classes `.artic-*`), plus le bump de cache-busting sur `FENIX-HANDBALL-CF-SUIVI.html` — aucun fichier hors périmètre modifié. Aucune fonctionnalité non demandée n'a été ajoutée (pas de nouveau filtre sur les données, pas de retouche de `_articCourtSvg()`).

## Réutilisation vs duplication

Aucune duplication introduite. Le gabarit de carte (`artic-block-card`) est réutilisé tel quel pour la nouvelle carte Référence plutôt que dupliqué avec un style ad hoc — exactement la recommandation du PRD (critère d'acceptation "même gabarit visuel").

## Lisibilité et maintenabilité

- Les commentaires ajoutés expliquent le "pourquoi" (référence à la source de vérité géométrique, raison du passage `outline`), pas le "quoi" — conforme aux conventions du projet.
- `nManual`, `manualMark`, `referenceCard` sont des noms clairs, cohérents avec le style de nommage existant (`_artic*`, camelCase).

## Remarques

**Note (hors scope, pré-existante, non introduite par cette story) :** `_articPrimaryEntry()` appelle `_articJoueurStats(pKey, manuel, { get: () => joueurMap })` puis retombe sur `|| joueurMap.get(manuel) || null` — un objet factice imitant l'interface d'une `Map` pour au final produire le même résultat qu'un simple `joueurMap.get(manuel)`. Ce code date d'avant STORY-36 (v259) et n'a pas été touché par cette story ; il fonctionne correctement (vérifié en test) mais mériterait une simplification lors d'un futur passage sur ce bloc. Ne bloque pas cette story.

**Note :** Le seuil d'affichage `(n<3)` reste basé sur `possessions < 5` dans tout le bloc Articulation (incohérence de libellé déjà présente avant cette story, documentée comme telle dans STORY-34/v258) — non modifié ici, cohérent avec le reste de la feature.

Aucune remarque bloquante.

## Verdict

**APPROUVÉ** — conforme à l'architecture, au design et au PRD. Prêt pour QA.

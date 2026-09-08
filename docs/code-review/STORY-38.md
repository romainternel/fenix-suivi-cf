# Code Review — STORY-38 : Simplification du mode Articulation (flux unique)

**Agent :** Code Reviewer
**Date :** 2026-09-08

---

## Conformité à l'architecture

- `_articPrimaryEntry` simplifiée exactement comme spécifié (§1.2) — plus de branche `topdef`, plus d'appel à `_articJoueurStats`. ✅
- `_articRankedCombos` implémentée comme spécifié (§1.3), seuil `>= 5` vérifié identique à celui de `_articDefClass` (`possessions < 5` → `noref`) — pas de décalage d'unité (lève le risque R2 du Risk Analyst). ✅
- Résumé sous le terrain réutilise `_articBlockEff`/`_articBlockDetail` sans les modifier (§1.4) — vérifié par lecture, aucun changement de signature ni de logique interne. ✅
- Sélection depuis le classement réutilise `_setArticManualCombo` sans modification (§1.5). ✅
- `_toggleArticPosteEditor` et la fermeture inconditionnelle de l'encart dans `_setArticManualJoueur`/`_setArticManualCombo` implémentées comme spécifié (§1.6). ✅
- Fonctions retirées (`_setArticViewMode`, `_setArticListingFilter`, `_selectArticPoste`, `_articPosteHighlighted`, `_resetArticManual`, `_articJoueurStats`, `ARTIC_LISTING_CHARNIERES`) : recherche exhaustive effectuée avant suppression (grep sur tout le projet, pas seulement le bloc Articulation) — aucune référence résiduelle trouvée, y compris dans le second point d'appel (`_setEncGraphMode`, ligne ~1599) qui réinitialisait l'ancien `_articSelectedPoste`. Lève le risque R1. ✅

## Scope

Diff contenu à `js/page-analyse.js` (bloc Articulation) et `css/style.css` (classes `.artic-*`), plus bump de cache-busting. Aucun fichier hors périmètre touché.

## Cas limites vérifiés (Risk R5)

- Largeur "À 6" avec le groupe Fiable vide mais Échantillon faible non vide : message "Aucune composition fiable observée." affiché, le second groupe reste visible. Vérifié en conditions réelles avec un jeu de données réduit.
- Aucune composition observée du tout pour une largeur : message générique "Aucune composition observée pour cette largeur." (cas combiné, testé par construction du code — les deux branches vides se recouvrent proprement).
- Aucune donnée d'articulation sur toute la période : message pré-existant inchangé, testé avec `matchData = []`.

## Réutilisation vs duplication

Aucune duplication nouvelle. Le résumé sous le terrain et les anciennes cartes utilisaient déjà le même calcul — la fusion évite d'avoir deux implémentations différentes de la même donnée.

## Lisibilité et maintenabilité

- Les commentaires expliquent le "pourquoi" des choix (seuil de fiabilité repris de `_articDefClass`, fermeture inconditionnelle de l'encart, raison de la suppression du mode Suggestion) plutôt que de décrire le code.
- La taille de `_drawArticulationCourt` reste importante (une seule fonction assemble tout le rendu) mais c'est le pattern déjà en place depuis STORY-34 et non remis en cause par cette story — cohérent avec le reste du fichier.

## Remarques

**Note (héritée, non résolue par cette story) :** `_articEffClass()` reste définie mais totalement non appelée nulle part dans le fichier (vérifié par grep : un seul résultat, sa propre définition) — déjà signalé en Code Review STORY-37, la story actuelle ne l'a pas supprimée car l'Architecture de ce cycle ne le demandait pas explicitement. À reconsidérer lors d'un futur nettoyage si elle reste inutilisée.

Aucune remarque bloquante.

## Verdict

**APPROUVÉ** — conforme à l'architecture et au design, aucune référence résiduelle aux éléments retirés, cas limites vérifiés. Prêt pour QA.

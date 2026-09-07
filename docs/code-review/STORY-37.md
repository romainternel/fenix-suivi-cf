# Code Review — STORY-37 : Recentrage collectif du mode Articulation

**Agent :** Code Reviewer
**Date :** 2026-09-07

---

## Conformité à l'architecture

- `_articTauxDefense(stat)` et `_articDefClass(tauxDef, possessions)` implémentées exactement comme spécifié (`docs/arch/articulation-charnieres-collectives.md` §1.1/1.2), seuils vérifiés par calcul (miroir exact de `_articEffClass` via complément à 100 : 38→62, 55→45). ✅
- `_articEffClass()` conservée mais non appelée (vérifié par grep : un seul résultat, sa propre définition) — conforme à la décision de ne pas la supprimer prématurément. ✅
- `computeArticulationStats`, `_articBlockEff`, `ARTIC_BLOCKS` (structure), `_articPrimaryEntry` non modifiées dans leur calcul — seule leur consommation en aval change, conformément au PRD (hors scope explicite). ✅
- `_articPrimaryEntry()` continue de calculer `eff` en interne (nécessaire au tri du mode Suggestion) sans l'exposer dans le HTML — vérifié qu'aucun site de rendu n'interpole plus `s.eff`/`topStats.eff`/`stat.eff` dans une chaîne affichée à l'utilisateur (recherche exhaustive `\.eff}%` et `efficacité` dans tout le fichier : les seules occurrences restantes dans le bloc Articulation sont des commentaires, toutes les occurrences de code affiché appartiennent à d'autres features non concernées par cette story). ✅ — lève le risque R1 du Risk Analyst.

## Scope

Diff contenu à `js/page-analyse.js` (bloc Articulation) et `css/style.css` (classes `.artic-*`), plus bump de cache-busting. Aucun fichier hors périmètre touché.

## Réutilisation vs duplication

Aucune duplication. La carte "Référence" réutilise le même gabarit `.artic-block-card` que les 3 charnières, avec l'ajout cohérent d'un `.artic-block-sub` réutilisé identiquement sur les 4 cartes.

## Lisibilité et maintenabilité

- Les commentaires mis à jour (lignes 2453-2454, 2605-2608, 2620-2624, 2517-2519 de la version précédente) expliquent bien le changement de convention (pourquoi le sens du % s'inverse) plutôt que de simplement décrire le nouveau code — un futur lecteur comprendra pourquoi `_articEffClass` existe encore sans être appelée.
- Renommage cohérent de bout en bout : `ARTIC_BLOCKS[].label`, tooltip du bouton Suggestion, `modeLabel` dans les tooltips de poste, libellé du `<select>` ("le plus utilisée"/"suggestion") — pas de libellé oublié dans un coin (vérifié par grep sur "Top Def"/"AFFICHAGE"/anciens noms de blocs : 0 résultat dans le HTML généré).

## Remarques

**Note (mineure) :** Le paramètre interne `window._articViewMode === 'topdef'` et la fonction `_setArticViewMode('topdef')` gardent leur nom de code `'topdef'` alors que l'UI affiche "Suggestion" — décision assumée de l'Architecture (§1.4, "aucune raison de renommer l'API interne, seul le texte visible change"), cohérente avec la pratique déjà en place pour `data-tab="enclenchements"` (onglet renommé "Intention attaque" en v256 sans renommer l'attribut interne). Pas une remarque bloquante, juste un rappel pour le futur lecteur qui chercherait "suggestion" dans le code JS sans la trouver.

**Note (héritée, non introduite par cette story) :** `_articPrimaryEntry()` conserve son appel convoluté `_articJoueurStats(pKey, manuel, { get: () => joueurMap })` déjà signalé en Code Review STORY-36 — toujours non bloquant, toujours hors scope de cette story.

Aucune remarque bloquante.

## Verdict

**APPROUVÉ** — conforme à l'architecture, au design et au PRD. Le point de risque le plus sensible (résidu de l'ancienne métrique) a été vérifié exhaustivement et est absent. Prêt pour QA.

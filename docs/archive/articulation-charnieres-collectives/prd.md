# PRD — Recentrage collectif du mode Articulation (charnières défensives)

**Agent :** Product Manager
**Date :** 2026-09-07

---

## 1. Objectif

Faire des 3 charnières défensives collectives (6/4/2) le cœur de l'écran Articulation, exprimées en % de réussite défensive lu dans le sens normal, et retirer toute évaluation individuelle visible — sans toucher au calcul des séquences sous-jacent.

## 2. Features

### F1 — Métrique de réussite défensive
Nouvelle fonction dérivée : `tauxReussiteDef = (possessions − buts − po) / possessions × 100`. S'applique partout où une charnière ou la référence globale affiche un %, en remplacement de l'actuelle "efficacité attaque adverse". Seuils de couleur inversés par rapport à `_articEffClass()` actuel : haut = vert = bon (à redéfinir, pas une simple relecture de `_articEffClass`).

### F2 — Charnières au centre de l'écran
Les 3 cartes (à 6, à 4 = Bloc Central, à 2 = les deux centraux) + la carte Référence passent de "sous le terrain, en petit" à l'élément visuellement dominant de l'écran — le terrain devient secondaire (sert à composer/visualiser qui est où), les charnières deviennent le résultat qu'on lit en premier.

### F3 — Ronds-poste sans évaluation individuelle
Retrait complet du liseré de couleur individuel sur `.artic-poste`. Le rond n'affiche plus que le nom du joueur et, le cas échéant, le badge "+N" (nombre d'autres joueurs vus à ce poste) et le marqueur `✎` (override manuel) — aucune information de performance.

### F4 — Panneau de détail simplifié
Le panneau ouvert au clic sur un poste perd le % individuel par joueur ; il garde la liste des joueurs observés à ce poste avec leur nombre de séquences (repère purement descriptif pour choisir qui placer manuellement), et le sélecteur manuel existant.

### F5 — Devenir de "Top Def"
Conservé comme heuristique de **composition suggérée** : sélectionne toujours, en interne, le joueur individuellement le plus économe par poste (logique de calcul inchangée), mais ce choix n'affiche plus aucun chiffre à l'écran — seul son effet (la composition qui apparaît sur le terrain, puis évaluée collectivement via les 3 cartes) est visible. Renommé pour refléter ce rôle (proposition Designer).

## 3. Priorités

| # | Feature | Priorité |
|---|---|---|
| F1 | Métrique de réussite défensive | **Must Have** |
| F2 | Charnières au centre de l'écran | **Must Have** |
| F3 | Ronds-poste sans évaluation individuelle | **Must Have** |
| F4 | Panneau de détail simplifié | **Must Have** |
| F5 | Devenir de "Top Def" | **Should Have** — la mécanique existe déjà et fonctionne, seul son habillage change |

## 4. Critères d'acceptation

- Toute carte de charnière (Référence, 6, 4, 2) affiche un % où plus haut = meilleure défense, avec une couleur verte pour les valeurs hautes (cohérent avec le reste de l'app), sans aucune mention d'"efficacité adverse" résiduelle dans les libellés utilisateur.
- Les 3 cartes de charnières + Référence sont visuellement au-dessus ou immédiatement après le terrain, dans une zone visuellement dominante — pas après un défilement supplémentaire par rapport au terrain.
- Aucun rond-poste n'affiche de liseré de couleur ni de % individuel, quel que soit le mode (auto, Top Def, override manuel).
- Le panneau de détail par poste n'affiche plus de % individuel par joueur, seulement son nombre de séquences observées.
- Le mode "Top Def" reste sélectionnable, change bien la composition affichée sur le terrain, sans afficher de chiffre individuel justifiant ce choix.
- Les chiffres de séquences/possessions affichés (dans les cartes ou tooltips) restent strictement identiques à avant ce cycle — seule la métrique dérivée (%) et sa présentation changent.
- Non-régression : bascule dispositif, bascule Attaque/Défense avec désactivation, vue match et vue saison, sélection manuelle avec/sans donnée.

## 5. Hors scope

- `computeArticulationStats()` (calcul des possessions/buts/PO par poste et par bloc) — inchangé, seule la formule dérivée du % change.
- Le tracé du terrain et le placement des postes sur la courbe (STORY-36) — inchangés.
- STORY-35 (classement automatique des meilleures charnières P2-P5) : ce cycle ne le développe pas, mais le PRD note explicitement que STORY-35 devient largement redondant avec les cartes de charnières déjà en place — à trancher avec Romain après ce cycle, pas dans celui-ci (cf. Architecture pour la recommandation).

## 6. Dépendances

- `_articBlockEff()` et `ARTIC_BLOCKS` (existants) restent la base de calcul des 3 charnières — seule la formule de `%` dérivée en sortie change.
- `_articPrimaryEntry()` (logique Top Def / le+utilisé) reste utilisée pour composer le terrain, mais son résultat numérique (`eff`) ne doit plus être exposé dans le rendu HTML.

## 7. Risques

- **Confusion transitoire pour Romain** s'il repense en "plus bas = mieux" par habitude des 3 dernières versions — atténué par le changement de sémantique de couleur (vert=haut) qui casse volontairement l'ancien réflexe visuel plutôt que de le prolonger silencieusement.
- **`_articEffClass()` partagée ailleurs ?** à vérifier en architecture — si cette fonction n'est utilisée que par le mode Articulation, elle peut être adaptée/remplacée sans risque de régression croisée sur une autre feature.

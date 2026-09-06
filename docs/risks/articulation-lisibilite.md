# Risques — Refonte lisibilité du mode Articulation

**Agent :** Risk Analyst
**Date :** 2026-09-06

---

Feature purement front-end sur une page déjà en production (aucune connectivité, aucune donnée backend nouvelle, aucun accès multi-rôle concerné) — les catégories de risque pertinentes ici sont la régression croisée sur une feature existante et les cas limites de rendu visuel, pas la connectivité/concurrence/permissions.

## Tableau de risques

| # | Risque | Probabilité | Impact | Recommandation |
|---|---|---|---|---|
| R1 | Collision `outline`/`box-shadow` entre `.artic-poste.selected` et la classe d'efficacité (`fort`/`moyen`/`faible`/`noref`) — si le Developer garde `box-shadow` pour les deux états au lieu de suivre la consigne de l'Architecture (`outline` pour la sélection), l'un des deux signaux devient invisible | Moyenne | Faible (cosmétique, mais trompeur : on peut croire qu'un poste n'est plus sélectionné) | Critère d'acceptation explicite : cliquer sur un poste `fort` (ou `faible`) et vérifier que le halo de sélection ET le liseré de couleur sont visibles simultanément |
| R2 | Postes P1/P6 du dispositif 0-6 proches du but (`y≈20.8`, marge ≈5.4 unités de viewBox) — sur un petit format (iPad portrait, terrain réduit proportionnellement), cette marge en pixels réels devient minime, risque de chevauchement visuel avec le rectangle du but | Moyenne | Moyen (lisibilité dégradée sur l'appareil cible réel du staff, cf. CLAUDE.md §8) | Tester explicitement le rendu à largeur iPad portrait (~768px) avant livraison ; si chevauchement constaté, augmenter légèrement la marge (`x` plus proche du centre ou `ry` réduit pour l'arc de placement, sans toucher au tracé du terrain lui-même) |
| R3 | Espacement plus large entre postes du dispositif 1-5 (seulement 4 sur la ligne des 6m, `x=15,32,68,85`) — le badge "+N" et le nouvel indicateur `✎` (override manuel) pourraient se chevaucher visuellement si deux ronds voisins restent proches malgré l'espacement recalculé | Faible | Faible | Vérifier visuellement l'espacement minimal entre ronds adjacents une fois codé, particulièrement en 1-5 avec badge + indicateur simultanés sur un même poste |
| R4 | La carte "Référence" fusionnée dans le panneau d'indicateurs doit gérer les mêmes cas limites que les 3 cartes Bloc (échantillon faible `n<5`, dispositif à très peu de séquences comme le "1 séq." déjà rencontré en test v259) — risque d'oubli du format `(n<3)` ou d'un style incohérent en la codant "à part" au lieu de réutiliser le même gabarit | Faible (code de calcul déjà existant et déjà testé) | Faible | Réutiliser strictement le même template de carte que `ARTIC_BLOCKS`/`_articBlockEff` pour la Référence — pas de branche de code séparée |
| R5 | Incohérence entre le nouveau bouton "Réinitialiser" et le comportement déjà existant de `_setArticDispositif` (qui vide déjà `_articManualPoste` au changement de dispositif) — l'indicateur "N postes modifiés" pourrait rester affiché un instant après un changement de dispositif si l'ordre de rendu n'est pas respecté | Faible | Faible | Critère d'acceptation : changer de dispositif fait disparaître immédiatement la ligne "N postes modifiés" (déjà couvert par le code existant — vérification en QA, pas de nouveau code de garde nécessaire) |

## Classement

- **P1** : R1, R2 — à vérifier explicitement avant livraison (critères d'acceptation dédiés), pas bloquants pour démarrer le développement mais bloquants pour le go-live sans vérification.
- **P2** : R3, R4 — à couvrir en QA standard, pas de mitigation de conception supplémentaire nécessaire.
- **P3** : R5 — comportement déjà correct dans le code existant, simple point de vérification.

Aucun risque P0 identifié — rien ne justifie de bloquer le découpage en stories.

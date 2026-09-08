# QA-45 — Matrice 2×2 : refonte visuelle

**Agent :** QA
**Date :** 2026-09-09
**Méthode :** tests réels dans un navigateur (serveur statique local, port 8210), données réelles Supabase (1 match en Attaque et Défense, vue saison complète).

---

## Critères d'acceptation

- [x] Matrice visiblement plus grande (plafond de hauteur relevé 430→500px) et lisible — `docs/regression/screenshots/story45-matrix-final.png`.
- [x] 4 quadrants visuellement distincts avec libellé coloré (gris "Sous-utilisé"/"Abandonner", vert "Exploiter ⭐", orange "Corriger ⚠") — nettement plus francs qu'avant (opacités doublées/triplées).
- [x] Chaque bulle affiche nom de famille + % d'efficacité, positionnée à la même donnée sous-jacente qu'avant (positions `xS`/`yS` non modifiées, vérifié par lecture de code).
- [x] Survol d'une bulle → agrandissement visible (rayon ×1.25) + libellé en gras coloré — testé par un `mousemove` programmatique exact sur les coordonnées réelles de la bulle "6vs5", confirmé par capture avant/après (`story45-matrix-final.png` vs `story45-hover.png`) et par le contenu du tooltip DOM.
- [x] Non-régression : bascule Vue générale ↔ Matrice ↔ Articulation, et Attaque ↔ Défense, toutes fonctionnelles après le changement — testées dans cet ordre exact sur le même match.
- [x] Non-régression vue saison : matrice testée avec 8 familles réelles (255 possessions) — cas le plus dense rencontré, aucun chevauchement de libellé (`docs/regression/screenshots/story45-saison-matrix.png`).

## Bugs trouvés et corrigés pendant le cycle (avant remise finale)

1. **Libellés superposés malgré l'anti-collision** : sur le match de test, "Jeu Pivot", "Isoler" et "Jeu Rapide" (proches en fréquence ET efficacité) avaient des boîtes de texte *adjacentes* non détectées comme en collision par un test de bornes strict. Remonté au Developer, corrigé (marge de 5px ajoutée au test). Re-vérifié : les 3 libellés sont maintenant clairement séparés.
2. **Texte coupé en bord de canvas** : le libellé de la famille la plus utilisée (proche du bord droit) avait sa moitié droite ("· 29%") invisible, hors-canvas. Remonté, corrigé (centre du texte bridé aux bords). Re-vérifié : "Jeu Rapide · 29%" entièrement visible.

## Note (mineure, non bloquante)

En vue saison (8 familles, échantillon dense), une bulle ("6vs5") se retrouve visuellement proche du libellé de quadrant "Sous-utilisé" (coin fixe) — pas un chevauchement de texte-sur-texte, juste une proximité. L'anti-collision ne couvre que bulle-vs-bulle, pas bulle-vs-libellé-de-quadrant (non demandé explicitement par les critères d'acceptation). Reste lisible, à garder en tête si Romain la remarque.

## Régressions détectées

Aucune.

## Verdict

**PASSED** — tous les critères d'acceptation validés en conditions réelles sur 3 contextes différents (Attaque, Défense, Saison), avec 2 bugs visuels trouvés et corrigés pendant le cycle plutôt qu'après mise en production.

# STORY-43 — Timeline : refonte visuelle et bascules sur la courbe

**En tant que** Romain (staff),
**Je veux** une évolution de score qui "claque" visuellement, avec des repères toutes les 10 minutes et les bascules du match directement visibles sur la courbe,
**Afin de** lire l'histoire du match d'un coup d'œil sans devoir croiser la courbe avec la liste des bascules en dessous.

## Contexte technique

- Zone concernée : `drawTimeline(matchName, matchData)` (`js/page-analyse.js:470+`). Le calcul (`getSortedGoals`, `scoreHistory`, `normPos()`) n'est **pas modifié** — uniquement le rendu Canvas 2D à l'intérieur de la fonction.
- Nouveau tracé : aire remplie dégradée (vert au-dessus de zéro, rouge en-dessous, écart FENIX − Adversaire), grille verticale toutes les 10 minutes (au lieu de la grille actuelle), cf. mockup validé (`https://claude.ai/code/artifact/5868bd9c-b206-4ae8-b859-b9d146b43380`) pour le rendu de référence (fait en SVG dans le mockup — à porter en Canvas 2D ici puisque `drawTimeline` dessine déjà sur `#timeline-canvas`).
- Marqueurs de bascules : `detectAllBascules()` (`js/page-analyse.js:318+`) retourne déjà la liste des bascules avec leur position temporelle (déjà utilisée pour la liste "⚡ Bascules du match" et `renderBasculContext`) — réutiliser cette même liste et `normPos()` (déjà calculée dans `drawTimeline`) pour placer un losange + ligne pointillée sur la courbe à chaque bascule, sans recalcul.
- DPR scaling déjà en place dans `drawTimeline` (L474-482) — le nouveau rendu doit le conserver (pas de régression floue sur écran Retina/iPhone).

## Critères d'acceptation

- [ ] La courbe affiche l'écart de score (FENIX − Adversaire) avec une aire remplie dégradée vert (positif) / rouge (négatif), et une grille verticale à 0/10/20/30/40/50/60 minutes (ou plus si prolongation), avec les repères de minutes lisibles.
- [ ] Chaque bascule détectée par `detectAllBascules()` apparaît comme un marqueur distinct directement sur la courbe (losange + ligne pointillée verticale), positionné au bon instant.
- [ ] Le score à la mi-temps (`#timeline-scores`) continue de s'afficher exactement comme aujourd'hui.
- [ ] Le rendu reste net sur un écran à `devicePixelRatio` élevé (test sur simulation Retina/iPhone).
- [ ] Non-régression : la timeline se redessine correctement après un changement de filtre, un redimensionnement de fenêtre, et un changement de match.

## Hors scope

- `detectAllBascules()`, `getSortedGoals()`, `normPos()` — calculs inchangés.
- La liste textuelle "⚡ Bascules du match" en dessous de la timeline — reste affichée telle quelle, en complément du nouveau tracé (pas un remplacement).

## Dépend de

- Aucune.

## Taille

M

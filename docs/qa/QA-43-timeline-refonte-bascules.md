# QA-43 — Timeline : refonte visuelle et bascules sur la courbe

**Agent :** QA
**Date :** 2026-09-09
**Méthode :** tests réels dans un navigateur (serveur statique local, port 8190), données réelles Supabase (2 matchs, dont un avec 11 bascules détectées et un avec seulement des moments clés).

---

## Critères d'acceptation

- [x] Aire dégradée vert/rouge selon l'écart FENIX-Adversaire, grille verticale toutes les 10 minutes (0/10/20/30/40/50/60), repères lisibles — `docs/regression/screenshots/story43-timeline.png` (match perdu, majoritairement rouge en 2e mi-temps) et `story43-timeline-match2.png` (match gagné en remontée, majoritairement vert).
- [x] Chaque bascule détectée par `detectAllBascules()` apparaît en losange sur la courbe + ligne pointillée verticale, à la bonne position temporelle — 11 bascules positionnées correctement sur le premier match testé, vérifié visuellement contre la liste "⚡ Bascules du match" en dessous (mêmes horaires).
- [x] `#timeline-scores` inchangé — "Final : 20-29" / "Final : 34-31" affichés correctement sur les 2 matchs testés, format identique à avant la story.
- [x] Rendu net sur DPR élevé : simulé `devicePixelRatio = 3` puis redessiné → canvas physique 2721×1140 pour un canvas logique 907×380 (ratio exact 3×), capture d'écran confirmant un rendu net sans flou (`docs/regression/screenshots/story43-timeline-retina.png`).
- [x] Non-régression changement de filtre : implicite (le graphique ne dépend pas des filtres Club/Résultat/GE, seulement du match sélectionné — vérifié par lecture de `updateAnalysePage()`, `matchData` non filtrée par ces 3 filtres pour la Timeline).
- [x] Non-régression changement de match : re-testé sur un 2e match réel, légende adaptée au nom de l'adversaire réel ("L'UNION devant" au lieu de "BILLERE devant"), échelle et couleurs recalculées correctement.
- [x] Non-régression redimensionnement : fenêtre réduite à 900px de large → canvas redessiné à la nouvelle largeur (723px), rendu cohérent, aucune distorsion (`docs/regression/screenshots/story43-timeline-resized.png`).
- [x] **Non-régression interactions (au-delà des critères explicites, vérifiée par prudence)** : tooltip au survol d'une bascule (`initTimelineTooltip`) déclenché programmatiquement → contenu correct affiché. Clic sur un moment clé → panneau de séquences ouvert avec le bon titre ("MC1 — Retard critique 1-4"). Les deux mécanismes dépendent de la géométrie changée par cette story — vérifiés plutôt que supposés fonctionnels.

## Note (non bloquante)

Avec 11 bascules sur un même match, les lignes pointillées verticales (bascules + moments clés) créent une zone assez dense en haut du graphique. Reste lisible (couleurs distinctes), mais à garder en tête si Romain la trouve chargée sur les matchs à beaucoup de bascules — la story ne demandait pas de mécanisme de dé-densification, ce n'est donc pas un écart au cahier des charges.

## Régressions détectées

Aucune.

## Verdict

**PASSED** — tous les critères d'acceptation validés en conditions réelles sur 2 matchs différents, y compris les mécanismes d'interaction (tooltip, clic) non explicitement listés mais dépendant de la géométrie changée.

# STORY-27 — Page Impact fonctionnelle pour un gardien (vue staff) + nom du joueur affiché

**En tant que** coach,
**Je veux** voir les zones d'arrêt et d'encaissement d'un gardien sur le même écran Impact que pour un joueur de champ, avec le nom du joueur consulté visible à l'écran,
**Afin de** analyser un gardien sans passer par un écran séparé cassé, et savoir en un coup d'œil qui je suis en train de regarder.

## Contexte technique
- Zone concernée : `openImpactForSelected()` et `updateImpactPage()` (`FENIX-HANDBALL-CF-SUIVI.html`), `updateZoneEfficacite()` (déjà partiellement correcte, cf. critère R1 ci-dessous)
- Référence directe à suivre : `renderPlayerZones()` (`js/player-mode.js`) — gère déjà correctement le cas gardien pour le Mode Lecture Joueur mobile, même logique à porter côté staff/desktop
- Nouvelle constante module `POSTE_LABELS` (`js/page-joueurs.js`, remplace la constante locale `_posteLblMap` de `printFicheJoueur()`, qui doit être mise à jour pour la réutiliser)
- Spec exacte : `docs/design/impact-gardien.md`, `docs/visual/impact-gardien.md`

## Critères d'acceptation
- [ ] `openImpactForSelected()` route désormais un gardien vers `page-impact` (comme un joueur de champ) — plus jamais vers `page-gardiens`
- [ ] `updateImpactPage()` détecte le cas gardien (`detectIsGB()`) et bascule sa source de données : club adverse + `finalite` (Tir arrêté/But) + comparaison sur `row[COLS.gardien]` via `matchPlayerName()`, au lieu de club FENIX + `resultat` + `row[COLS.joueur]`
- [ ] Les 3 vues terrain (Externe Gauche/Central/Externe Droit) affichent les points d'arrêt (vert) et de but encaissé (rouge) pour un gardien sélectionné
- [ ] Libellés adaptatifs selon le cas : `ARRÊTS`/`TIRS SUBIS` (au lieu de `BUTS`/`TIRS`), légende "Arrêt"/"But encaissé" (au lieu de "But"/"Tir raté"), filtre Résultat avec les bonnes options pour un gardien
- [ ] Nom + poste du joueur actuellement sélectionné affiché sous le titre de section (`Enzo Ditta — Gardien de but`), pour un joueur de champ comme pour un gardien ; "Tous les joueurs" si aucun filtre
- [ ] **Mitigation R1 (Risk Analyst, P0)** : la coloration par seuil de la grille "Efficacité par zone" (`ZONE_SEUILS`) est neutralisée pour un gardien — affichage du % sans couleur sémantique trompeuse, pas de seuil de joueur de champ appliqué à un % d'arrêt
- [ ] **Mitigation R2 (Risk Analyst, P0) — non-régression explicite obligatoire** : comparer un joueur de champ avant/après cette story sur les mêmes chiffres exacts (stats + zones), pas une vérification visuelle approximative
- [ ] Testé : sélectionner chacun des 3 gardiens réels (Gabin.S, Noah.O, Enzo.D) → stats cohérentes avec leur fiche respective (ex. Enzo Ditta 15/40, 38%)

## Hors scope
- F3 (Mode Lecture Joueur mobile) — déjà correct, story de vérification séparée (STORY-28)
- F4 (suppression de `page-gardiens`) — story séparée (STORY-29), ne commence qu'après cette story vérifiée
- F5 (grille de zones sans seuil pour un gardien, au-delà de la simple neutralisation R1) — Nice to Have, pas retenue ce cycle
- Toute autre page liée aux gardiens déjà corrigée le jour même (onglet Analyse, table GB, graphique de progression)

## Dépend de
- Aucune

## Taille
L

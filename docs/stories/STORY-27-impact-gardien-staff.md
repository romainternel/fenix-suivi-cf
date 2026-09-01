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
- [x] `openImpactForSelected()` route désormais un gardien vers `page-impact` (comme un joueur de champ) — plus jamais vers `page-gardiens`. Testé : `document.querySelector('.page.active').id === 'page-impact'` pour un gardien sélectionné.
- [x] `updateImpactPage()` détecte le cas gardien et bascule sa source de données : club adverse + `finalite` (Tir arrêté/But) + comparaison sur `row[COLS.gardien]` via `matchPlayerName()`, au lieu de club FENIX + `resultat` + `row[COLS.joueur]`
- [x] Les 3 vues terrain affichent les points d'arrêt (vert) et de but encaissé (rouge) pour un gardien — testé sur Gabin SALTEL : 6 points verts + 10 croix rouges répartis sur les 3 vues, cohérent avec 6/16 arrêts
- [x] Libellés adaptatifs : `ARRÊTS`/`TIRS SUBIS`, légende "Arrêt"/"But encaissé" — vérifiés visuellement (`docs/e2e/screenshots/story-27-impact-gardien.png`). Filtre Résultat testé explicitement : "Arrêt" seul → 6 points, "But encaissé" seul → 10 points, somme exacte = 16
- [x] Nom + poste affiché sous le titre de section (`Gabin SALTEL — Gardien de But`, `Antonin VACHE — Demi-Centre`), "Tous les joueurs" si aucun filtre — testé pour les 2 cas
- [x] **Mitigation R1 (P0)** : coloration par seuil de la grille "Efficacité par zone" neutralisée pour un gardien — testé explicitement : 7 cellules avec pourcentage affiché (0%/33%/100%/75%/25%), aucune classe `zr-eff-vert/orange/rouge` appliquée
- [x] **Mitigation R2 (P0) — non-régression explicite** : Antonin Vache avant/après identique (2/4, 50%, mêmes points sur les mêmes vues terrain, légende "But marqué"/"Tir raté" inchangée) — `docs/e2e/screenshots/story-27-impact-joueur-champ-nonregression.png`
- [x] Testé : les 3 gardiens réels (Gabin.S 6/16 38%, Noah.O 15/40 38%, Enzo.D 15/40 38%) — cohérents avec la table GB de la page Notes (STORY-26/v246)

## Hors scope
- F3 (Mode Lecture Joueur mobile) — déjà correct, story de vérification séparée (STORY-28)
- F4 (suppression de `page-gardiens`) — story séparée (STORY-29), ne commence qu'après cette story vérifiée
- F5 (grille de zones sans seuil pour un gardien, au-delà de la simple neutralisation R1) — Nice to Have, pas retenue ce cycle
- Toute autre page liée aux gardiens déjà corrigée le jour même (onglet Analyse, table GB, graphique de progression)

## Dépend de
- Aucune

## Taille
L

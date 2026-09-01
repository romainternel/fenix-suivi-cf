# STORY-32 — Bascule terrain ↔ photo corps entier au clic sur l'avatar

**En tant que** Romain (staff),
**Je veux** cliquer sur l'avatar du joueur sélectionné pour voir sa photo corps entier à la place du terrain,
**Afin d'** avoir un visuel plus impactant du joueur sans quitter la fiche.

## Contexte technique

- Zone concernée : `js/page-joueurs.js` — nouvelle fonction `toggleCourtPhoto()`, nouvelle variable module `let _courtPhotoMode = false;`. `selectJoueur()` (~L96) doit remettre `_courtPhotoMode = false` à chaque changement de joueur sélectionné.
- Zone DOM : `.court-container` (`FENIX-HANDBALL-CF-SUIVI.html:617-665`, contient `#hb-court-svg`) — passe en `position:relative`. **Important (cf. `docs/risks/photos-joueurs.md` R4)** : le SVG terrain doit être masqué via CSS (`display:none`), jamais retiré du DOM — `renderCourtPlayers()` continue ainsi de le maintenir à jour même masqué, évitant un terrain obsolète au retour.
- Réutilise `getPlayerPhoto(nom, 'corps')` de `js/player-photos.js` (STORY-30).
- `.jp-avatar` (dans `selectJoueur()`) devient cliquable (`cursor:pointer`, classe `.jp-avatar-clickable`) **uniquement** si `getPlayerPhoto(nom, 'corps')` renvoie une URL pour le joueur actuellement sélectionné — sinon curseur par défaut, pas de handler de clic.
- Nouveau bouton "↩ Terrain" en overlay (`.court-back-btn`) visible uniquement en mode photo — specs visuelles dans `docs/visual/photos-joueurs.md` §3-4.

## Critères d'acceptation

- [x] Joueur sélectionné a une photo corps entier → avatar cliquable (curseur pointer, léger effet hover)
- [x] Clic sur l'avatar → le terrain est remplacé visuellement par la photo corps entier, dans la même zone (`.court-container`) — vérifié Marius.C, screenshot conforme au design
- [x] Un bouton "↩ Terrain" apparaît et permet de revenir à l'affichage terrain — testé dans les deux sens
- [x] Changer de joueur sélectionné pendant que la photo est affichée → retour automatique à l'affichage terrain — vérifié (`_courtPhotoMode` repasse à `false`, SVG réaffiché)
- [x] Changer le filtre match/bilan pendant que le mode photo est actif, puis revenir au terrain → le terrain reflète bien le filtre à jour — garanti par construction : `#hb-court-svg` est masqué via `display:none` (jamais retiré du DOM), `#court-players` reste présent et continue d'être mis à jour par `renderCourtPlayers()` même masqué
- [x] Joueur sélectionné sans photo corps entier → avatar non cliquable, aucun changement visuel au clic — vérifié Yoran.C
- [x] 0 erreur console dans tous les cas

**Livré en v250 (2026-09-01).**

## Hors scope

- Comportement équivalent en mode joueur mobile (pas de terrain interactif dans ce mode — hors scope PRD)
- Export PDF/PPT (STORY-31)

## Dépend de

STORY-30

## Taille

M

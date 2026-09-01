# STORY-31 — Photo corps entier sur la couverture de l'export PDF/PPT

**En tant que** Romain (staff),
**Je veux** que la page de couverture de l'export PDF/PowerPoint d'un joueur affiche sa photo corps entier quand elle existe,
**Afin de** partager un document plus visuel et professionnel avec le joueur, ses parents, ou en réunion staff.

## Contexte technique

- Zone concernée : `js/page-joueurs.js` — fonction `printFicheJoueur()` (~L1129-1141, bloc `pdf-slide-cover`). `exportJoueurPPT()` réutilise `printFicheJoueur(true)` pour son rendu, donc un seul point de modification couvre les deux exports (PDF impression + PowerPoint).
- Réutilise `getPlayerPhoto(nom, 'corps')` de `js/player-photos.js` (STORY-30) — aucune nouvelle logique de résolution.
- Layout cible : photo ancrée en bas-droite du slide de couverture, ~45-55% de la hauteur, `object-fit:contain`, `drop-shadow` — voir `docs/design/photos-joueurs.md` §3 et `docs/visual/photos-joueurs.md` §5 pour les specs exactes (`.pdf-cover-photo`).
- Point déjà vérifié en Architecture/Risques (R5) : `printFicheJoueur()` attend déjà le `decode()` de toutes les `<img>` du print zone avant `window.print()` / capture `html2canvas` — la nouvelle image en bénéficie automatiquement, aucun changement nécessaire sur ce mécanisme.

## Critères d'acceptation

- [x] Joueur avec photo corps entier disponible → visible sur la page de couverture, export **PDF** (impression navigateur) — vérifié Marius.C, effet "carte joueur" bas-droite avec drop-shadow
- [x] Même joueur → visible sur la page de couverture, export **PowerPoint** (`exportJoueurPPT()`) — export réel déclenché et téléchargé (`Marius.C_suivi_CF.pptx`) sans erreur
- [x] Joueur sans photo corps entier → page de couverture strictement identique à l'actuelle (logo + nom + poste + période), aucun espace vide résiduel — vérifié Yoran.C
- [x] Le texte existant (nom, poste, période, logo) reste entièrement lisible, aucun chevauchement avec la photo pour un nom de longueur normale
- [x] 0 erreur console pendant l'export, dans les deux cas (avec/sans photo)

**Livré en v250 (2026-09-01).**

## Hors scope

- Modification des autres slides de l'export (détail actions, matchs, graphique, impact) — uniquement la couverture
- Portrait sur l'avatar (STORY-30, prérequis)

## Dépend de

STORY-30

## Taille

S

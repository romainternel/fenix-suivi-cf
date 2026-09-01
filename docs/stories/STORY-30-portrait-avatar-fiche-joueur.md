# STORY-30 — Portrait joueur sur l'avatar de la fiche (staff + mode joueur)

**En tant que** Romain (staff) ou un joueur consultant sa propre fiche,
**Je veux** voir la vraie photo portrait du joueur sélectionné à la place des initiales génériques,
**Afin de** rendre la fiche joueur plus personnelle et identifiable en un coup d'œil.

## Contexte technique

- Zone concernée : `js/page-joueurs.js` — fonction `selectJoueur()` (~L96-180, bloc `jpHeader`, `.jp-avatar`) ; `js/player-mode.js` (~L300, `.pmf-avatar`, même pattern).
- Nouveau fichier `js/player-photos.js` : constante `PLAYER_PHOTOS` (mapping nom canonique → URLs) + fonction `getPlayerPhoto(nomJoueur, type)` résolvant via `matchPlayerName()` (déjà dans `js/utils.js`). Voir `docs/arch/photos-joueurs.md` §2 pour le format exact.
- Nouveau dossier `assets/photos/` pour les fichiers image.
- Nouveau tag `<script src="js/player-photos.js?v=NNN">` dans `FENIX-HANDBALL-CF-SUIVI.html`, positionné après `utils.js` et avant `page-joueurs.js`/`player-mode.js`.
- `JOUEURS_TERRAIN` est reconstruit à chaque import Excel (`FENIX-HANDBALL-CF-SUIVI.html:1628`) — `PLAYER_PHOTOS` doit rester dans un fichier séparé, jamais fusionné dans cette structure, pour survivre aux réimports.
- **Prérequis avant de démarrer** : demander à Romain au moins 1 photo portrait déjà redimensionnée (WebP, ≤ 300px de large, cf. `docs/risks/photos-joueurs.md` R1) pour pouvoir tester réellement — ne pas utiliser les photos haute résolution brutes fournies en exemple.

## Critères d'acceptation

- [ ] `getPlayerPhoto(nom, 'portrait')` retourne l'URL si le nom matche une clé de `PLAYER_PHOTOS` (via `matchPlayerName`, tolérant les formats "Prénom" / "Prénom.Initiale"), `null` sinon
- [ ] Sur la page Joueurs, sélectionner un joueur avec photo → `.jp-avatar` affiche l'image (`object-fit:cover`, cercle), plus les initiales
- [ ] Sélectionner un joueur sans photo → `.jp-avatar` affiche les initiales, strictement identique au comportement actuel (aucune régression visuelle)
- [ ] Photo référencée mais fichier introuvable (404) → repli automatique sur les initiales via `onerror`, aucune icône "image cassée" visible
- [ ] Même comportement vérifié en mode joueur mobile (`player-mode.js`, `.pmf-avatar`) pour le joueur connecté
- [ ] `alt="{nom du joueur}"` présent sur chaque `<img>` de photo
- [ ] Vérifié sur la prod déployée (GitHub Pages), pas seulement en local (risque de casse de fichier Windows→Linux, cf. R2)
- [ ] 0 erreur console dans tous les cas (avec photo, sans photo, photo cassée)

## Hors scope

- Photo corps entier / export PDF-PPT (STORY-31)
- Interaction clic sur l'avatar / bascule terrain (STORY-32)
- Interface d'upload ou d'édition de la photo dans l'app

## Dépend de

Aucune

## Taille

M

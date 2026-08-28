# STORY-19 — Panneau latéral pour Comptes et Vue joueur

**En tant que** membre du staff,
**Je veux** que "Comptes joueurs" et "Vue joueur" s'ouvrent dans un panneau qui glisse depuis le bord plutôt qu'une fenêtre centrée,
**Afin de** avoir une sensation de navigation plus intégrée à l'appli, moins "boîte de dialogue système".

## Contexte technique
- Zone concernée : `js/player-mode.js` (`openPlayerAccountsModal()`, `closePlayerAccountsModal()`, `openPreviewModal()`, `closePreviewModal()`), `css/style.css`, `FENIX-HANDBALL-CF-SUIVI.html` (`#pa-modal`, `#preview-modal`)
- Spec exacte : `docs/design/navigation-refonte.md` §3 · `docs/arch/navigation-refonte.md` §1.3
- Nouvelle classe partagée `.slide-panel` + `.slide-panel-overlay` — les deux modales existantes migrent vers cette classe commune plutôt que de dupliquer le pattern deux fois
- Changement JS mécanique : `el.style.display = 'flex'/'none'` → `el.classList.add('open')/.remove('open')` (nécessaire pour que la transition CSS d'entrée/sortie fonctionne)
- **Avant de commencer :** recenser (grep `position:fixed` + `z-index` élevé) toutes les modales existantes du fichier HTML pour décider explicitement lesquelles migrent dans cette story et lesquelles restent en l'état (R7) — ne pas laisser deux styles de fenêtre coexister sans décision explicite.

## Critères d'acceptation
- [ ] "Comptes joueurs" et "Vue joueur" s'ouvrent en glissant depuis la droite (`transform: translateX`), pas en fondu centré
- [ ] Un overlay semi-transparent (`opacity 0→0.55`, 200ms ease-out) apparaît derrière le panneau, cliquable pour fermer
- [ ] Le contenu interne de chaque panneau (formulaire de compte, sélecteur de joueur, boutons "Annuler"/"Voir sa vue") est strictement identique à aujourd'hui — aucun changement fonctionnel
- [ ] Échap ferme le panneau ouvert, le focus revient sur le bouton déclencheur (bouton "Outils" ou son entrée de menu, cf. STORY-12)
- [ ] Navigation clavier : le focus reste piégé dans le panneau tant qu'il est ouvert (Tab ne sort pas vers le contenu de fond)
- [ ] Résultat du recensement des autres modales du fichier documenté (dans cette story ou en commentaire de commit) : migrées, ou explicitement laissées en l'état avec la raison
- [ ] Testé sur desktop et mobile (le panneau latéral doit rester utilisable à 375px — probablement pleine largeur plutôt que partiel à cette taille, à valider visuellement)

## Hors scope
- Le déclencheur (bouton "Outils") — déjà livré en STORY-12
- Toute nouvelle fonctionnalité dans les panneaux eux-mêmes

## Dépend de
- STORY-13 (tokens visuels de base, pour les couleurs/durées d'animation cohérentes avec le reste)
- STORY-12 (le déclencheur doit exister, même si le comportement `onclick` ne change pas — pratique à tester ensemble)

## Taille
M

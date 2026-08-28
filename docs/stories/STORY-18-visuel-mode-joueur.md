# STORY-18 — Passe visuelle : mode joueur mobile

**En tant que** joueur consultant l'app sur mon téléphone,
**Je veux** que l'interface reflète le même soin visuel que la version staff,
**Afin de** ressentir que l'outil est fait avec le même sérieux, pas juste "la version light" du staff.

## Contexte technique
- Zone concernée : `js/player-mode.js` (styles inline dans les fonctions de rendu), `css/style.css` (classes `.pmf-*`, `.pm-*`)
- Spec exacte : `docs/visual/navigation-refonte.md` — appliquer les **mêmes tokens** que le reste de l'appli (F4, cohérence transverse), sans copier la structure de navigation staff (qui reste à onglets pleine page, différente de la nav desktop — décision Design déjà actée, non remise en cause)
- **Zone sensible :** cette page a reçu plusieurs correctifs mobiles cette semaine même (canvas Impact pleine largeur, header sticky, matching de noms, temps de jeu, badge signature) — voir `docs/audit-final/AUDIT-2026-08-28.md`. Cette story ne touche à aucune logique, uniquement au CSS/à la présentation.

## Critères d'acceptation
- [ ] Cartes KPI (`.pmf-kpi-box`), carte signature, cartes ACTIONS utilisent les mêmes tokens de couleur/ombre que le reste de l'appli (pas de palette parallèle)
- [ ] Onglets Ma Fiche / Stats Match / Impact (`.pm-tab-btn`) alignés visuellement sur la même échelle "Onglet" que Analyse/Joueurs (cohérence F4), sans changer leur mécanique (`pmTab()` non touché)
- [ ] Badges pleins rouge/vert migrés vers le pattern texte foncé/fond clair, y compris dans le tableau détaillé ATT+/ATT-/DEF+/DEF- (4 quadrants)
- [ ] **Non-régression explicite, testée à 375px (iPhone SE) :** canvas "Impact" toujours pleine largeur en premier, header sticky "Stats Match" non masqué, état vide "Données non disponibles" toujours affiché correctement sans donnée importée, badge signature affiche toujours le libellé sans parenthèse (ex. "But", pas "But (But DG)")
- [ ] Comparaison avant/après validée visuellement par Romain sur un vrai viewport mobile (375-430px)

## Hors scope
- Toute logique de calcul, matching de noms, temps de jeu (déjà livrés et audités, non concernés par cette story)
- La structure de navigation à onglets du mode joueur (inchangée)

## Dépend de
- STORY-13 (tokens visuels de base)

## Taille
M

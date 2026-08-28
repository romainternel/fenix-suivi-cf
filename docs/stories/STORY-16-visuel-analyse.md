# STORY-16 — Passe visuelle : page Analyse (bloc match + 5 onglets)

**En tant que** membre du staff,
**Je veux** que la page Analyse (bloc terrain+cartes et les 5 onglets) ait un rendu visuel soigné et cohérent,
**Afin de** naviguer dans l'écran le plus dense de l'application sans fatigue visuelle.

## Contexte technique
- Zone concernée : `FENIX-HANDBALL-CF-SUIVI.html` (`#page-analyse`), `css/style.css`, `js/page-analyse.js` (styles inline générés dynamiquement dans les fonctions de rendu — plusieurs sections construisent leur HTML via `innerHTML` avec des styles en dur, à migrer vers les classes `.surface-*`)
- Spec exacte : `docs/visual/navigation-refonte.md`
- Le bloc terrain+cartes utilise `.surface-hero` (carte proéminente, cf. Visual §3) — c'est le bloc le plus important de l'écran, toujours visible
- Les onglets eux-mêmes (structure) ont été livrés en STORY-14 — cette story les habille visuellement (style `.pm-tab-btn` réutilisé en STORY-14 est ici affiné pour desktop selon l'échelle typographique "Onglet" de Visual §2)

## Critères d'acceptation
- [ ] Bloc terrain+cartes en `.surface-hero`
- [ ] Cartes des 5 onglets (résumé/coach, indicateurs, cards familles enclenchement, gardien, chat) en `.surface-card`
- [ ] Onglets stylés selon l'échelle "Onglet" de Visual §2 (état actif/inactif, hover, focus conformes à Visual §4)
- [ ] Cards familles enclenchement : pas plus de 3 niveaux typographiques simultanés (règle assainie — le Visual Crafter note que ces cards empilent actuellement 4-5 tailles différentes)
- [ ] Badges pleins rouge/vert (ex. "⚡ FAIBLESSE ADV", "⭐ FORCE") migrés vers le pattern texte foncé/fond clair
- [ ] Canvas (timeline, camembert, matrice) non affectés dans leur logique de dessin — seuls les conteneurs autour (cartes, marges) sont retouchés
- [ ] Vérification explicite : les 3 correctifs mobiles très récents ne sont pas régressés — canvas Impact pleine largeur, header sticky non masqué, état vide "Importe un fichier Excel..." toujours correctement affiché (cf. `docs/audit-final/AUDIT-2026-08-28.md`)
- [ ] Comparaison avant/après validée visuellement par Romain sur au moins une section détaillée (ex. Enclenchements) en plus de la vue d'ensemble

## Hors scope
- La structure des onglets elle-même (STORY-14, déjà livrée)
- Toute autre page

## Dépend de
- STORY-13 (tokens visuels de base)
- STORY-14 (structure des onglets doit exister avant l'habillage — un changement de structure après le polish visuel ferait recommencer le travail, cf. Architecture §1.1)

## Taille
L

# STORY-17 — Passe visuelle : page Joueurs (terrain + fiche)

**En tant que** membre du staff,
**Je veux** que la page Joueurs (terrain SVG + panneau fiche + sous-onglets Fiche/Notes/Graphique/Impact) ait un rendu cohérent avec le reste de la refonte,
**Afin de** avoir une expérience homogène sur tout l'outil, pas seulement sur Dashboard/Analyse.

## Contexte technique
- Zone concernée : `FENIX-HANDBALL-CF-SUIVI.html` (`#page-joueurs`), `js/page-joueurs.js` (styles inline dans les fonctions de rendu de fiche), `css/style.css`
- Spec exacte : `docs/visual/navigation-refonte.md`
- Sous-onglets existants (Fiche/Notes/Graphique/Impact) : structure inchangée, uniquement l'habillage visuel des boutons de sous-onglet (même échelle "Onglet" que STORY-16, pour cohérence entre les deux usages d'onglets de l'appli)

## Critères d'acceptation
- [ ] Panneau fiche joueur en `.surface-card` / `.surface-hero` selon l'importance du bloc (fiche principale en hero, détail par match en card standard)
- [ ] Sous-onglets Fiche/Notes/Graphique/Impact stylés selon la même échelle "Onglet" que la page Analyse (STORY-16) — cohérence transverse
- [ ] Badges "#1 au poste" / "Top ATT au poste" etc. conformes au pattern texte foncé/fond clair
- [ ] Terrain SVG (positions joueurs) : pas de changement de logique, uniquement vérification que le nouveau système d'ombres/radius ne dégrade pas la lisibilité des ronds de joueurs (contraste avec le fond du terrain)
- [ ] Comparaison avant/après validée visuellement par Romain

## Hors scope
- Toute autre page
- La logique de positionnement des joueurs sur le terrain (inchangée)

## Dépend de
- STORY-13 (tokens visuels de base)

## Taille
M

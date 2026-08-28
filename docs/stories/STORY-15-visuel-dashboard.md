# STORY-15 — Passe visuelle : Dashboard

**En tant que** membre du staff,
**Je veux** que le Dashboard reflète le même niveau de soin visuel que le reste de l'application refondue,
**Afin de** avoir une première impression de sérieux et de clarté dès l'écran d'accueil.

## Contexte technique
- Zone concernée : `FENIX-HANDBALL-CF-SUIVI.html` (`#page-dashboard`), `css/style.css`
- Spec exacte : `docs/visual/navigation-refonte.md` (tokens et règles définis en STORY-13, appliqués ici)
- Contenu et données affichées **inchangés** — uniquement hiérarchie, espacement, ombres, cohérence des composants

## Critères d'acceptation
- [ ] Les cartes du tableau joueurs et des encarts stats utilisent `.surface-card` (STORY-13) au lieu du style plat actuel
- [ ] Pas plus de 3 niveaux typographiques simultanés par carte (règle Visual §2)
- [ ] Les badges succès/danger pleins (texte blanc sur fond `--fenix-success`/`--fenix-danger`) sont remplacés par le pattern "texte foncé sur fond clair" (Visual §6) partout où c'est un badge textuel — pas sur les indicateurs sans texte (points de couleur)
- [ ] États hover sur les lignes/cartes cliquables du Dashboard conformes à Visual §4
- [ ] Comparaison avant/après validée visuellement par Romain (pas de métrique automatisée — critère de jugement assumé, cf. PRD)
- [ ] Aucune donnée affichée n'a changé (mêmes chiffres, mêmes filtres, même comportement des sélecteurs)

## Hors scope
- Toute autre page

## Dépend de
- STORY-13 (tokens visuels de base)

## Taille
M

# STORY-39 — Bloc "Essentiel" en tête de page (match + saison)

**En tant que** Romain (staff),
**Je veux** un bloc unique, toujours visible sans scroller, qui résume le résultat et les 2-3 faits marquants du match (ou de la saison),
**Afin de** comprendre l'essentiel en quelques secondes avant d'aller chercher le détail dans les onglets.

## Contexte technique

- Zone concernée : `js/page-analyse.js` (`generateResume3Points()` L145-248, `generateSeasonCorrelations()` L1171+), `FENIX-HANDBALL-CF-SUIVI.html` (structure de `#analyse-content`/`#analyse-empty`), `css/style.css` (nouvelle classe `.essentiel`).
- **Dépend de STORY-42** (recalcul des Supériorités) : le candidat "Supériorités" de `generateResume3Points()` (L204-212) utilise aujourd'hui le calcul bugué décrit en `docs/arch/reorganisation-page-analyse.md` §4.1 — développer STORY-42 avant ou en même temps que celle-ci, jamais après, pour ne pas afficher un chiffre faux dans le tout premier bloc que Romain voit.
- **Vue match** : `generateResume3Points()` n'est pas réécrite dans son calcul — seul son point d'écriture change, de `#ia-analyse` (dans l'onglet Résumé) vers un nouveau conteneur `#essentiel-match` positionné avant les onglets. Le HTML produit (`.ia-diagnostic`/`.ia-point`) reste identique.
- **Vue saison** : nouvelle fonction `_extractSignauxForts(rows)` (petite, ~10 lignes) qui filtre les lignes déjà marquées "🔑 Signal fort" par `generateSeasonCorrelations()` et en garde les 1-2 plus importantes (déjà triées par écart) pour `#essentiel-saison`. Aucun nouveau seuil.
- Nouvelle classe CSS `.essentiel` (fond dégradé léger, bordure gauche colorée selon victoire/défaite/nul ou neutre en vue saison, `box-shadow: var(--shadow-md)`) — cf. `docs/visual/reorganisation-page-analyse.md` pour les valeurs exactes.

## Critères d'acceptation

- [ ] En vue match, le bloc Essentiel apparaît avant tout onglet, sans scroller sur un écran desktop standard, et affiche le résultat (✅/❌/➖ + score) suivi des mêmes top 3 constats qu'aujourd'hui dans l'onglet Résumé (texte et icônes identiques).
- [ ] L'onglet "Résumé"/"Vue d'ensemble" ne contient plus ce bloc en double — il n'apparaît qu'une fois, en Essentiel.
- [ ] En vue saison, le bloc Essentiel affiche "N matchs analysés cette saison" + le décompte V/D/N, suivi des 1-2 signaux forts les plus importants issus de `generateSeasonCorrelations()`, avec un texte strictement identique à celui déjà affiché dans le tableau de corrélations pour ces lignes.
- [ ] Cas "pas assez de données" (déjà géré aujourd'hui) : le bloc Essentiel affiche le même message qu'aujourd'hui ("Pas assez de données pour générer un résumé"), pas un bloc vide ou cassé.
- [ ] Le candidat "Supériorités" du bloc Essentiel utilise `computeSuperiorites()` (STORY-42), pas l'ancien calcul dupliqué.
- [ ] Non-régression : le contenu du bloc Essentiel change bien quand on change de match dans le filtre, et quand on bascule saison ↔ match précis.

## Hors scope

- Le calcul de `generateResume3Points()`/`generateSeasonCorrelations()` lui-même (hors le remplacement du calcul Supériorités, propriété de STORY-42).
- La réorganisation des onglets (STORY-40) et l'accordéon terrain (STORY-41) — cette story ne touche que le nouveau bloc Essentiel, pas le reste de la page.

## Dépend de

- STORY-42 (recalcul des Supériorités numériques) — à développer avant ou en parallèle, jamais après.

## Taille

M

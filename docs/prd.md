# PRD — Réorganisation de la page Analyse

**Agent :** Product Manager
**Date :** 2026-09-08

---

## 1. Objectif

Produire une nouvelle organisation de la page Analyse — moins de sections de même rang, un point d'entrée de synthèse unique, une structure commune vue match/vue saison — et la faire valider par Romain sur un exemple visuel concret AVANT tout découpage en stories de développement.

## 2. Features

### F1 — Bloc "Essentiel du match" (nouveau point d'entrée)
Un bloc unique en tête de page, systématiquement visible, réunissant : résultat + score, le verdict du résumé IA condensé en 1-2 phrases (pas la version longue actuelle), 3-4 indicateurs clés (parmi ceux d'`generateIndicateurs()`), et — si pertinent — le fait tactique le plus marquant du match (plus grosse famille en utilisation ou plus gros écart vs moyenne saison, en s'appuyant sur `computeEncStats`/`computeEncStatsSaison` déjà en place). Aucune nouvelle donnée : une sélection et une mise en forme de ce qui existe déjà.

### F2 — Regroupement des sections (5 → 3)
Fusionner les onglets actuels selon la logique validée en brainstorm : "Vue d'ensemble" (Résumé texte + Timeline/score/moments/bascules), "Tactique" (Intention attaque + Gardien), et une 3e section pour ce qui reste secondaire (Coach + Chat IA groupés, moins mis en avant que les 2 premières). Aucun contenu supprimé — uniquement regroupé.

### F3 — Bloc terrain/nuage de tirs replié par défaut
Le bloc terrain + cartes comparatives FENIX/Adversaire passe en accordéon fermé par défaut, ouvrable en un clic — libère la hauteur d'écran au-dessus de la ligne de flottaison pour F1 et le contenu de la section active.

### F4 — Structure commune vue match / vue saison
La vue "Saison complète" reprend la même ossature que la vue d'un match (bloc de synthèse en tête, mêmes sections) plutôt qu'une page à part quasiment indépendante — avec un contenu adapté à l'échelle saison (ex. tendances au lieu d'un résumé de match unique).

### F5 — Exemple visuel de validation
Un mockup HTML/visuel de la page réorganisée, avec des données réalistes (pas de vrais placeholders génériques), que Romain peut regarder et annoter avant toute story de développement. Condition de sortie du cycle Designer/Visual Crafter — pas une feature du produit final.

### F6 — Terrain : mode "Météo"
Ajouté suite aux retours de Romain sur le mockup F5 (pas prévu au brief initial). En plus du nuage de tirs existant, une option affiche un dégradé de couleur par zone du terrain (rouge = faible réussite, vert = forte réussite), sans pourcentages affichés, plusieurs zones distinctes possibles simultanément.

### F7 — Indicateur "Rythme du match"
Ajouté suite aux retours de Romain. Le nombre de possessions n'a pas de sens en comparaison FENIX/Adversaire (mécaniquement proches) — remplacé par une jauge à 4 paliers (Faible/Normal/Élevé/Très élevé) sur un seul nombre.

### F8 — Recalcul des Supériorités numériques
Ajouté suite aux retours de Romain, qui a détaillé la méthode de calcul attendue et révélé au passage un bug fonctionnel dans le calcul actuel (cf. `docs/arch/reorganisation-page-analyse.md` §4). Le nouveau calcul agrège, par blocs de séquences consécutives en `phase_att` +/-, les buts marqués par chaque équipe sur l'ensemble du match, dans les deux sens (nous en supériorité, eux en supériorité) — remplace le calcul actuel qui traitait les deux camps indépendamment.

### F9 — Timeline : refonte visuelle et bascules sur la courbe
Ajouté suite aux retours de Romain ("il faut qu'elle claque niveau design"). Courbe/aire au lieu du tracé actuel, grille toutes les 10 minutes, marqueurs de bascules directement sur la courbe (en plus de la liste déjà existante en dessous).

### F10 — Drill-down familles enrichi
Ajouté suite aux retours de Romain. Le détail par intention (niveau intermédiaire du clic sur une famille) affiche désormais but/tir, PB et jet franc subi sur une ligne, en plus du % déjà affiché. Le niveau 2 (détail par enclenchement) n'est pas modifié.

### F11 — Matrice 2×2 : refonte visuelle
Ajouté suite aux retours de Romain ("pas assez bien dimensionnée [...] c'est fade"). Aucun changement de calcul — matrice agrandie, quadrants teintés et libellés, bulles avec ombre et effet de survol.

### F12 — Chat IA : questions types
Ajouté suite aux retours de Romain. Rangée de questions pré-écrites cliquables au-dessus de la conversation, déclenchant le moteur rule-based existant — pas de connexion à une vraie IA (hors scope, cf. CLAUDE.md §9).

## 3. Priorités

| # | Feature | Priorité |
|---|---|---|
| F5 | Exemple visuel de validation | **Must Have** — rien ne se construit sans cette validation |
| F1 | Bloc "Essentiel du match" | **Must Have** |
| F3 | Bloc terrain replié par défaut | **Must Have** |
| F8 | Recalcul des Supériorités numériques | **Must Have** — corrige un bug fonctionnel identifié, pas une simple préférence |
| F2 | Regroupement des sections (5 → 3) | **Should Have** — direction retenue du brainstorm, validée par Romain sur le mockup |
| F4 | Structure commune vue match/saison | **Should Have** — dépend de la structure finale retenue en F2 |
| F6 | Terrain : mode "Météo" | **Should Have** — validé sur le mockup, ajouté en cours de cycle |
| F7 | Indicateur "Rythme du match" | **Should Have** — validé sur le mockup, ajouté en cours de cycle |
| F9 | Timeline : refonte visuelle et bascules | **Should Have** — validé sur le mockup, ajouté en cours de cycle |
| F10 | Drill-down familles enrichi | **Could Have** — amélioration ponctuelle, pas structurante |
| F11 | Matrice 2×2 : refonte visuelle | **Could Have** — pur polish visuel |
| F12 | Chat IA : questions types | **Could Have** — amélioration ponctuelle, pas structurante |

## 4. Critères d'acceptation

- Un exemple visuel de la page réorganisée est produit et présenté à Romain avant toute story de développement (F5).
- Le bloc "Essentiel du match" est visible sans scroller, sur un écran desktop standard (F1).
- Le bloc terrain/nuage de tirs est replié par défaut et ré-ouvrable en un clic, sans perte de la fonctionnalité existante (F3).
- Aucune fonctionnalité actuelle (résumé IA, coach, indicateurs, timeline, moments clés, bascules, familles, gardien, chat, corrélations saison) ne disparaît du produit final — seule leur organisation change.
- La vue match et la vue saison sont visuellement reconnaissables comme la même application (F4).

## 5. Hors scope

- Le mode "Préparation/Debrief/Saison" dynamique (vision 12 mois du Brainstormer) — pas dans ce cycle.
- Toute modification de calcul ou de donnée sous-jacente à un bloc existant.
- Suppression du Chat IA ou de toute autre fonctionnalité — seulement une mise en avant réduite le cas échéant.
- Le détail d'implémentation (stories, architecture technique) — produit seulement après validation du visuel par Romain, pas dans ce cycle-ci.

## 6. Dépendances

- Toutes les fonctions de calcul déjà en place (`generateResume3Points`, `generateIndicateurs`, `computeEncStats`/`computeEncStatsSaison`, `drawTimeline`, `findMomentsCles`, `detectAllBascules`, `renderEncFamillesSection`, `renderGardienEncSection`, `generateSeasonCorrelations`) — réutilisées telles quelles, aucune n'est remise en cause par ce cycle.

## 7. Risques

- **Le regroupement 5→3 (F2) peut ne pas convenir à Romain une fois visualisé** — c'est justement pourquoi F5 (exemple visuel) est un Must Have avant toute story : le risque est absorbé par le point de validation, pas par une hypothèse figée.
- **Le contenu du bloc "Essentiel" (F1) peut sembler redondant** avec la section qu'il résume juste en dessous — à surveiller en Design : la synthèse doit donner envie d'aller voir le détail, pas le dupliquer.

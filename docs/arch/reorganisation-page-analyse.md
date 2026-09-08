# Architecture — Réorganisation de la page Analyse

**Agent :** Architect
**Date :** 2026-09-08

---

## 0. Périmètre couvert par ce document

Ce cycle a débordé du brief/PRD initial (réorganisation pure, F1-F5) suite aux allers-retours de validation sur le mockup visuel (`https://claude.ai/code/artifact/5868bd9c-b206-4ae8-b859-b9d146b43380`). Romain a validé ("ok parfait") une version qui inclut, en plus de F1-F4 :

- **F6** — Terrain : option "🌡️ Météo" (heatmap de réussite par zone, en plus du nuage de points existant)
- **F7** — Indicateur "Possessions" : jauge de rythme de match (4 paliers), plus une comparaison FENIX/ADV
- **F8** — Indicateur "Supériorités numériques" : recalcul complet selon une méthode par blocs de `phase_att`, remplaçant le calcul actuel (bug fonctionnel identifié, cf. §4)
- **F9** — Timeline : refonte visuelle (courbe/aire SVG) + marqueurs de bascules directement sur la courbe
- **F10** — Drill-down familles : enrichissement du niveau "intention" (but/tir, PB, jet franc) — le niveau 2 "enclenchement" existe déjà, inchangé
- **F11** — Matrice 2×2 : refonte visuelle uniquement (pas de nouveau calcul)
- **F12** — Chat IA : questions types suggérées (chips cliquables)

Ce document couvre l'ensemble F1-F12. F8 est de loin la pièce la plus lourde (nouveau calcul, pas une simple réorganisation) — traitée en détail au §4.

## 1. Principe général

Aucune des fonctions de calcul existantes n'est réécrite, sauf le calcul des Supériorités (F8, remplacé) — cf. PRD §6 "Dépendances". Tout le reste est : déplacement de HTML existant (F1-F4), ajout d'un mode d'affichage alternatif sur une donnée déjà chargée (F6), enrichissement d'un affichage existant avec des champs déjà présents en base (F10), ou refonte visuelle pure sans toucher au JS de calcul (F9 pour la partie tracé, F11).

## 2. F1 — Bloc "Essentiel"

- **Vue match** : `generateResume3Points()` (`js/page-analyse.js:145-248`) reste inchangée dans son calcul. Seul son point d'ancrage HTML change : au lieu d'écrire dans `#ia-analyse` à l'intérieur de l'onglet Résumé, elle écrit dans un nouveau conteneur `#essentiel-match`, positionné en tête de `#analyse-content`, avant les onglets. Le HTML existant (`.ia-diagnostic`/`.ia-point`) est repris à l'identique — pas de nouvelle classe CSS pour le contenu, seulement pour le conteneur englobant (`.essentiel`, cf. `docs/visual/reorganisation-page-analyse.md`).
- **Vue saison** : `generateSeasonCorrelations()` (`js/page-analyse.js:1171+`) déjà des lignes marquées "🔑 Signal fort" — l'Architecture ajoute une petite extraction (`_extractSignauxForts(rows)`, nouvelle fonction, ~10 lignes) qui filtre ces lignes déjà calculées et en garde 1-2 pour `#essentiel-saison`. Aucun nouveau seuil, aucune nouvelle donnée — juste une sélection sur un tableau déjà produit.

## 3. F2 + F4 — Regroupement des onglets et structure commune

- `updateAnalysePage()` (`FENIX-HANDBALL-CF-SUIVI.html`/`js/page-analyse.js:58-118`) garde son branchement match/saison actuel. Ce qui change : le tableau des onglets passe de 5 (`resume/timeline/enclenchements/gardien/chat`) à 3 en vue match (`overview/tactique/notes`) et 2 en vue saison (`tactique/tendances`), déclarés dans une constante `AN_TABS_MATCH`/`AN_TABS_SAISON` plutôt que codés en dur dans le HTML — permet à `_analyseTab()` de rester générique.
- Le contenu de chaque nouvel onglet est un **regroupement de conteneurs DOM existants** (on déplace les `<div>` cibles dans le nouveau parent), pas une réécriture : `#an-tab-overview` contient les anciens contenus de `resume` (moins le bloc résumé IA, remonté en F1) + `timeline`. `#an-tab-tactique` contient `enclenchements` + `gardien`. `#an-tab-notes` contient coach + chat.
- `sessionStorage.an_active_tab` (déjà utilisé, cf. CLAUDE.md §5) continue de fonctionner sans changement — il stocke un id d'onglet, les nouveaux ids (`overview`/`tactique`/`notes`) remplacent simplement les anciens comme valeurs possibles. Un onglet actif sauvegardé sous un ancien nom (`resume`, `gardien`...) avant ce déploiement doit retomber proprement sur le premier onglet par défaut plutôt que planter — `_analyseTab()` doit vérifier que l'id demandé existe dans `AN_TABS_MATCH`/`AN_TABS_SAISON` avant de l'activer.

## 4. F8 — Recalcul des Supériorités numériques (pièce la plus lourde)

### 4.1 Bug identifié dans le calcul actuel

Le calcul existant (`js/page-analyse.js:165-170` dans `generateResume3Points`, dupliqué `271-276` dans `generateIndicateurs`) :

```js
const getSup = (data, sign) => data.filter(r => (r[COLS.phase_att] || '').toString().includes(sign));
const fSup = getSup(fenixData, '+'), aSup = getSup(advData, '+');
const fSupB = fSup.filter(r => r[COLS.resultat] === 'But').length;
// ... idem aSupB sur advData filtré sur SON PROPRE phase_att = '+'
```

filtre chaque équipe sur **son propre** `phase_att = '+'`, indépendamment l'une de l'autre. Concrètement : `fSupB` = buts FENIX marqués pendant que FENIX était en supériorité ; `aSupB` = buts adverses marqués pendant que l'ADVERSAIRE était en supériorité (donc pendant que FENIX était en infériorité, sur une séquence *différente* du match). Ce ne sont pas deux mesures de la même séquence — le calcul actuel ne peut donc jamais capturer "un but encaissé par nous alors qu'on était en supériorité" (un but adverse marqué avec `phase_att = '-'` côté adverse n'est filtré nulle part). C'est exactement le scénario que Romain a décrit comme le cœur du calcul ("on marque une fois et eux deux fois" *pendant le même bloc*). Confirmé bug fonctionnel, pas juste un raffinement.

### 4.2 Algorithme validé avec Romain

1. **Ordonner chronologiquement** toutes les lignes du match (FENIX + adverse mélangées), pas seulement les buts. `getSortedGoals()` (`js/utils.js:233-244`) fait déjà cet ordonnancement mais uniquement sur les lignes `resultat === 'But'` — F8 a besoin de la même logique (tri par `parseTimecode(r[COLS.position])`, avec le même offset MT2 si `min2 < max1`) appliquée à **toutes** les lignes du match. Extraire cette logique commune en `getSortedRows(matchData)` (nouvelle fonction, `js/utils.js`), et faire réécrire `getSortedGoals()` par-dessus (`getSortedRows(matchData).filter(r => r.row[COLS.resultat] === 'But')`) pour ne pas dupliquer le tri.
2. **Détecter les blocs** : parcourir `getSortedRows()` dans l'ordre ; un bloc démarre dès qu'une ligne a `phase_att` non vide contenant `+` ou `-` ; il continue tant que les lignes suivantes ont aussi un `phase_att` non-neutre (peu importe si c'est '+' ou '-', peu importe le club — un bloc mélange les deux camps par construction) ; il se termine dès qu'une ligne a un `phase_att` vide/neutre. Pas de contrainte de durée réelle (~2 min) à coder en dur — Romain l'a donnée comme contexte (durée d'une exclusion), pas comme un seuil de validation ; se fier uniquement à la valeur de `phase_att` ligne par ligne, exactement comme il l'a décrit ("dès que l'un ou l'autre repasse à autre chose que - ou + [...] on repart normal").
3. **Agréger par bloc puis sur le match entier** : pour chaque bloc, compter les buts (`resultat === 'But'`) et tirs (buts + `Tir raté`) de FENIX et de l'adversaire séparément, puis sommer ces compteurs sur tous les blocs du match. Résultat : deux totaux — `supBilan.fenix = {buts, tirs}` et `supBilan.adv = {buts, tirs}` — représentant "le score et l'efficacité de chaque équipe sur l'ensemble des séquences où une des deux équipes était en supériorité", dans les deux sens confondus.
4. **Nouvelle fonction** `computeSuperiorites(matchData)` (`js/page-analyse.js`, à côté de `computeEncStats`) implémentant 1-3, retournant `{fenix: {buts, tirs}, adv: {buts, tirs}}`. Remplace les deux blocs dupliqués `getSup(...)` dans `generateResume3Points` et `generateIndicateurs` — un seul point de calcul au lieu de deux copies divergentes (dette déjà présente avant ce cycle, l'occasion de la corriger).
5. **Affichage** (F1 + indicateur clé) : `FENIX {buts} — {buts} ADVERSAIRE` en gros, puis `FENIX {buts}/{tirs} possessions ({%}) · ADVERSAIRE {buts}/{tirs} possessions ({%})` — cf. mockup validé. Le verdict (✅/❌) compare simplement les deux totaux de buts.

### 4.3 Point d'attention (à couvrir en Risk Analyst)

`phase_att` n'est renseigné que si le coach l'a saisi dans l'Excel pour cette ligne — comme `intention_attaque`/`articulation_def` (cf. CLAUDE.md §5, colonnes introduites saison par saison), il faut vérifier si `phase_att` est bien peuplé sur toutes les saisons disponibles ou seulement à partir d'une saison donnée, sous peine d'un bilan "0-0" silencieux sur les anciens matchs (déjà un piège connu et documenté pour `intention_attaque`/`Tableau_MATCH`, cf. `project-roadmap.md` mémoire — même classe de problème).

## 5. F6 — Terrain, mode "Météo"

- `drawTerrain(data)` (`FENIX-HANDBALL-CF-SUIVI.html:2482+`) dessine aujourd'hui un marqueur par ligne via `row[COLS.position_terrain]` ("x;y" en %). F6 ajoute un second mode de rendu sur les **mêmes données déjà filtrées** (`terrainData`, ligne 2472-2477) — pas de nouvelle donnée, juste une deuxième fonction de rendu :
  - `drawTerrainMeteo(data)` (nouvelle fonction) : découpe le terrain en grille (proposé : 6 colonnes × 4 lignes, ajustable), calcule par cellule un taux de réussite = `buts / (buts + tirsRatés)` sur les points dont `x;y` tombe dans cette cellule (ignore PB/PO/Jet franc pour ce calcul, un ratio but/tir pur comme demandé), puis peint chaque cellule avec une couleur interpolée sur une échelle rouge→vert (`getEffColor()` existe déjà dans `js/utils.js` pour ce type d'échelle, cf. CLAUDE.md §3 — à vérifier si réutilisable tel quel ou si un dégradé continu dédié est nécessaire).
  - Lissage : un flou (`ctx.filter = 'blur(Npx)'`, supporté par Canvas 2D) appliqué après le remplissage des cellules donne l'effet "dégradé continu, plusieurs zones" du mockup plutôt qu'une grille de blocs nets.
  - Cellules sans données (aucun tir) : transparentes, pas de couleur par défaut trompeuse.
- Toggle `Nuage de tirs / 🌡️ Météo` : un bouton dans `.court-toggle` (déjà maquetté), état géré par une variable module-level `_terrainMode` ('dots'|'meteo'), `drawTerrain()` devient le dispatcher qui appelle l'une ou l'autre fonction — pas de duplication du filtrage `terrainData`.

## 6. F9 — Timeline (refonte visuelle)

- Le calcul (`getSortedGoals`, `scoreHistory`, `normPos`) dans `drawTimeline()` (`js/page-analyse.js:470-...`) n'est pas modifié — c'est un rendu Canvas 2D déjà fonctionnel (grille, courbe, DPR scaling). F9 est un **remplacement du rendu** (nouveau style de tracé : aire remplie dégradée vert/rouge de part et d'autre du zéro, grille verticale toutes les 10 min au lieu de l'actuelle, cf. mockup) à l'intérieur de la même fonction — le contrat d'entrée (`matchName, matchData`) et de sortie (`#timeline-scores` rempli) ne change pas.
- Marqueurs de bascules sur la courbe : `detectAllBascules()` (`js/page-analyse.js:318+`) retourne déjà la liste des bascules avec leur position temporelle (réutilisée aujourd'hui pour `renderBasculContext`/la liste "⚡ Bascules du match") — F9 consomme cette même liste pour placer les losanges sur le tracé (via `normPos()`, déjà disponible) plutôt que de recalculer quoi que ce soit.

## 7. F10 — Drill-down familles enrichi

- `_buildEncIntentionDetailTable`/le tableau détail niveau 2 existant (CLAUDE.md §5) reste inchangé — c'est le niveau intermédiaire (liste des intentions dans une famille, ex. ISO 2/ISO 3/ISO 4) qui gagne 3 colonnes : but/tir, PB, jet franc subi. Ces trois compteurs se calculent avec les mêmes filtres `COLS.resultat`/`COLS.finalite` déjà utilisés ailleurs dans le module (`But`/`Tir raté`/`PB`/`Jet franc`) — juste une agrégation par `intention_attaque` au lieu d'une agrégation par famille. Aucune nouvelle colonne DATA nécessaire.

## 8. F11 — Matrice 2×2 (visuel uniquement)

- Aucun changement de calcul. La fonction qui positionne aujourd'hui les points sur la matrice (à identifier précisément en story — probablement dans le même fichier que `_drawEncPie`/`computeEncStats`, non auditée en détail dans ce cycle car F11 est pure présentation) doit exposer ses coordonnées fréquence/efficacité de la même façon ; seule la couche CSS/SVG change (quadrants teintés, tailles de bulles, ombres — cf. `docs/visual/reorganisation-page-analyse.md`). Le Developer doit localiser cette fonction en story avant de commencer (pas fait ici pour ne pas dupliquer un audit qui sera de toute façon refait au moment du développement).

## 9. F12 — Chat IA, questions types

- Purement additif : une rangée de boutons au-dessus de l'interface de chat existante, chacun pré-remplissant le message utilisateur avec une question type et déclenchant l'envoi comme si l'utilisateur l'avait tapée — aucune modification du moteur de réponse rule-based existant (toujours pas connecté à l'API Claude, cf. CLAUDE.md §9, hors scope de ce cycle).

## 10. Fichiers impactés (résumé)

- `js/utils.js` : nouvelle `getSortedRows()`, `getSortedGoals()` réécrite par-dessus.
- `js/page-analyse.js` : nouvelle `computeSuperiorites()` (remplace le calcul dupliqué), `_extractSignauxForts()`, enrichissement du niveau intention du drill-down, refonte du rendu `drawTimeline()`, restructuration des onglets (`AN_TABS_MATCH`/`AN_TABS_SAISON`, `_analyseTab()` durci contre un id obsolète en `sessionStorage`).
- `FENIX-HANDBALL-CF-SUIVI.html` : nouvelle `drawTerrainMeteo()` + dispatcher `_terrainMode`, restructuration HTML des onglets/accordéon terrain, chips Chat IA.
- `css/style.css` : nouvelles classes pour `.essentiel`, `.accordion-*`, jauge de rythme, `.sup-score-main`, marqueurs de bascule SVG, matrice 2×2 refaite, `.info-i` (tooltips ⓘ) — cf. `docs/visual/reorganisation-page-analyse.md` pour le détail exact des tokens.

## 11. Dépendances entre stories

F1/F2/F4 (réorganisation pure) sont indépendantes de F6-F12 (nouvelles capacités) et peuvent être développées/testées séparément. F8 (Supériorités) est la seule story qui touche un calcul partagé entre deux endroits (`generateResume3Points` ET `generateIndicateurs`) — à développer et tester avant ou en parallèle de F1, jamais après (F1 affiche le résultat de F8 dans le bloc Essentiel).

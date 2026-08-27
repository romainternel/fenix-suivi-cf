# PRD — Module Analyse FENIX Handball

**Agent :** Product Manager (pipeline BMAD)
**Date :** 2026-06-17
**Version :** 1.0
**Inputs :** ANALYST-analyse-module.md · UX-RESEARCH-analyse-module.md · AUDIT-NUIT-2026-06-16.md
**Destinataires :** Designer · Architect

---

## 1. Vision produit

> Le module Analyse permet au staff FENIX de comprendre **pourquoi** un match a basculé et **quel enclenchement** l'a déclenché — une réponse que ni la timeline actuelle, ni aucun outil amateur du marché, ne fournit aujourd'hui.

---

## 2. Objectifs mesurables

| # | Objectif | Seuil de succès |
|---|----------|-----------------|
| O1 | Le coach identifie la famille d'enclenchement la plus efficace du match | En moins de 30 secondes après sélection du match |
| O2 | Le coach sait si une performance est une force FENIX ou une faiblesse adverse ponctuelle | Un badge visible sans calcul mental, dès l'affichage des cards |
| O3 | Le coach localise visuellement le moment bascule sur la timeline | En moins de 10 secondes, sans interaction (marqueur affiché d'office) |
| O4 | Le staff identifie le système adverse qui met le gardien en difficulté | En 1 seul tableau, lecture immédiate signal vert/rouge |
| O5 | Le module peut être utilisé en déplacement sur tablette | Toutes les vues R1 et R2 lisibles sur viewport ≥ 768 px |

---

## 3. Features retenues — décision par feature de l'audit (15 de la section 2E)

| # | Intitulé audit | Décision | Raison |
|---|----------------|----------|--------|
| 1 | Tableau enclenchements × résultat (match + saison) | **RETENU R1** | Fondation de toute l'analyse — base du parser famille |
| 2 | Matrice défense attaquée × résultat FENIX | **REPORTÉ R2** | Bloqué par Bug critique #23 (COLS.defense_attaquee absent) — valeur élevée mais prérequis technique non résolu |
| 3 | Efficacité possession par enclenchement (buts / tirs + PB) | **RETENU R1** | Métrique clé recommandée par l'Analyst ET la littérature académique — s'intègre dans les cards famille |
| 4 | Timeline momentum (courbe d'écart relatif glissant) | **RETENU R1** | Besoin critique #1 du coach — réutilise `scoreHistory[]` existant, effort maîtrisé |
| 5 | Gardien : % arrêts par enclenchement adverse | **RETENU R1** | Besoin #4 explicitement demandé — données disponibles, parser famille est la seule dépendance |
| 6 | Radar joueur multi-dimensionnel (5 axes vs médiane poste) | **REPORTÉ R3** | Valeur certaine mais hors scope module Analyse — à intégrer dans page-joueurs.js |
| 7 | Comparaison enclenchements saison V vs D | **RETENU R2** | Extension naturelle de la feature #1 en vue saison — nécessite le parser famille (R1) |
| 8 | Gardien : comparaison match précédent / match actuel par zone | **REPORTÉ R2** | Valeur réelle, mais prérequis = feature #5 validée en R1 |
| 9 | Évolution KPI par bilan (graphique multi-bilans) | **REPORTÉ R3** | Complexité L, besoin moins urgent que les features core |
| 10 | Drill-down saison → bilan → match → période | **EXCLU** | Complexité architecture L, scope trop large pour ce PRD — envisageable si BILANS évolue |
| 11 | Corrélation défense × gardien adverse | **REPORTÉ R2** | Dépend du fix Bug #23 comme la feature #2 |
| 12 | Action joueur × enclenchement | **REPORTÉ R3** | Hors périmètre module Analyse — à rattacher à la page joueur ou une vue future |
| 13 | Détection automatique du pattern perdant | **EXCLU** | Complexité XL, données insuffisantes pour un modèle fiable à ce stade |
| 14 | Export tableau enclenchements (CSV/Excel) | **REPORTÉ R3** | Valeur utile mais non urgente — le coach n'a pas exprimé ce besoin en priorité |
| 15 | Notation pression du score | **EXCLU** | Colonnes `score_fenix`/`score_adv` absentes du mapping COLS (Bug #22) — débloqué seulement si les colonnes Excel sont confirmées |

---

## 4. Features détaillées — R1 et R2

---

### F-00 — Parser enclenchement → famille (fondation technique)

> Cette feature n'est pas visible par le coach mais est le prérequis de toutes les autres. Elle est traitée en premier par l'Architect.

**Description utilisateur**
En tant que développeur, je veux une fonction utilitaire `getEncFamille(encStr)` qui retourne `"Faire courir"`, `"Jeu Pivot"` ou `"Isoler"` à partir de la chaîne brute `enclenchement` — afin que toutes les features d'analyse puissent s'appuyer sur cette classification.

**Données nécessaires**
- `enclenchement` (COLS index 9) — format `"8;0;Bloc 4"`, parsing sur `split(';')[0]`
- Table de mapping `{ cléEnclenchement → famille }` — à valider avec le coach avant implémentation

**Règle métier clé**
La partie 1 de l'enclenchement (`split(';')[0]`) est la clé de classification. Si la clé est inconnue → retourner `"Autre"` sans planter. Le mapping est une constante JS configurable (objet `ENC_FAMILLE_MAP`).

**Critères d'acceptation**
- `getEncFamille("8;0;Bloc 4")` retourne `"Faire courir"` (ou la famille configurée pour la clé `"8"`)
- `getEncFamille("")` retourne `"Autre"` sans exception
- `getEncFamille(null)` retourne `"Autre"` sans exception
- La table `ENC_FAMILLE_MAP` est un objet JS éditable sans modifier le reste du code
- Le coach a validé le mapping initial lors d'une session de 15 min avant le développement

**Dépendances**
Aucune dépendance amont. Cette feature débloque F-01, F-03, F-04.

---

### F-01 — 3 cards famille d'enclenchement (Bite)

**Description utilisateur**
En tant que coach, je veux voir en un coup d'oeil l'efficacité de chaque famille d'attaque (Faire courir / Jeu Pivot / Isoler) pour le match sélectionné — afin d'identifier immédiatement notre arme principale ce soir.

**Données nécessaires**
- `enclenchement` (COLS index 9) → famille via `getEncFamille()`
- `finalite` (COLS index 8) : `"But"` / `"Tir arrêté"` / `"Poteau"` / etc.
- Action PB dans les colonnes actions (index 16-18) pour le calcul possession
- `club` pour filtrer `club === 'FENIX'`

**Règle métier clé**
**Efficacité possession** = Buts / (Tirs + Pertes de balle) par famille, sur les lignes `club === 'FENIX'` uniquement.
Un tir = toute ligne avec `finalite` non vide. Une PB = ligne avec `action_att` contenant une PB (définition exacte à confirmer avec l'Analyst).

**Critères d'acceptation**
- 3 cards affichées côte à côte (horizontal desktop, empilées tablette)
- Chaque card affiche : nom famille · efficacité possession en grand · nombre de tirs · nombre de buts · barre de progression colorée
- La barre de progression est verte si efficacité > moyenne saison de cette famille, rouge si en dessous
- Si une famille a 0 possession sur ce match, la card est grisée avec le label "Non utilisé"
- Clic sur une card → expansion inline avec le tableau Snack (F-01b)

**Dépendances**
F-00 (parser famille) · `generateSeasonCorrelations()` pour la moyenne saison (prérequis : ≥ 3 matchs)

---

### F-01b — Tableau détail famille (Snack, expandable)

**Description utilisateur**
En tant que coach, je veux, après avoir cliqué sur une famille, voir le détail de chaque enclenchement de cette famille — afin de savoir quel mouvement précis a fonctionné ou échoué.

**Données nécessaires**
Mêmes colonnes que F-01.

**Règle métier clé**
Regrouper par clé enclenchement (partie 1 du split) dans la famille sélectionnée. Trier par nombre de tirs décroissant.

**Critères d'acceptation**
- Tableau inline sous la card, 4 colonnes : Enclenchement · Tirs · Buts · Efficacité %
- Tri par tirs décroissant
- Ligne "Total famille" en bas en gras
- Fermeture au second clic sur la card
- Affichage correct si 1 seul enclenchement dans la famille

**Dépendances**
F-01 · F-00

---

### F-02 — Badges force/faiblesse (Besoin #3)

**Description utilisateur**
En tant que coach, je veux savoir immédiatement si l'efficacité d'une famille ce soir est notre performance habituelle ou une faiblesse inhabituelle de l'adversaire — afin d'éviter de tirer de fausses conclusions tactiques.

**Données nécessaires**
- Efficacité possession de chaque famille sur le match actuel (issue de F-01)
- Moyenne saison par famille (issue de `generateSeasonCorrelations()` étendue)

**Règle métier clé**
- `effMatch / effMoyenneSaison >= 1.5` → badge **"Faiblesse adverse"** (orange, icône eclair)
- `|effMatch - effMoyenneSaison| <= 10%` ET variance saison faible → badge **"Force FENIX"** (vert, icône étoile)
- Sinon → pas de badge
- Si moins de 3 matchs en saison → badges masqués, message "Données saison insuffisantes"

**Critères d'acceptation**
- Le badge s'affiche dans la card famille sous l'efficacité
- Le badge inclut une ligne de sous-texte : "Moy. saison X% · Ce match Y% (écart +Z%)"
- Si < 3 matchs : message explicite "Min. 3 matchs pour comparer" (pas de badge silencieusement absent)
- Les deux badges distincts visuellement (couleur + icône différents)
- Un seul badge maximum par card (priorité : Faiblesse adverse > Force FENIX)

**Dépendances**
F-01 · `generateSeasonCorrelations()` étendue aux familles

---

### F-03 — Timeline enrichie avec courbe d'écart et marqueur bascule

**Description utilisateur**
En tant que coach, je veux voir sur la timeline du match le moment exact où le score s'est retourné contre nous — et quels enclenchements adverses ont été utilisés pendant ce basculement — afin de comprendre la cause tactique du retournement.

**Données nécessaires**
- `scoreHistory[]` déjà construit dans `drawTimeline()`
- `enclenchement` (COLS index 9) → famille via F-00
- `club` pour distinguer possessions FENIX vs adversaire
- `position` (index timecode) pour l'axe temporel

**Règle métier clé**
1. Calculer `diff = scoreFENIX - scoreADV` à chaque possession (sur `scoreHistory[]` existant)
2. Algorithme de détection bascule : identifier le point de diff minimal (creux) ET le premier croisement de zéro (diff passe de positif à négatif ou inversement)
3. Nommer "moment bascule" : la possession où `diff` atteint son minimum absolu ou croise zéro pour la première fois dans le sens défavorable
4. Si le match n'a pas de bascule (FENIX mène du début à la fin) → pas de marqueur, message "Aucune bascule détectée"

**Critères d'acceptation**
- La courbe `écart` (ligne pointillée orange) est superposée sur le canvas timeline existant
- La zone où `diff < 0` est colorée en rouge translucide, zone `diff > 0` en vert translucide
- Le moment bascule est marqué d'une ligne verticale pointillée orange avec label "Bascule"
- Une section contextuelle s'affiche **sous** le canvas avec : possessions concernées · enclenchements adverses pendant le run · enclenchements FENIX pendant le run
- La section contextuelle réutilise le composant `moment-badge` existant
- Si `clientWidth = 0` au moment du dessin (Bug #8), le canvas diffère le dessin via `requestAnimationFrame`

**Dépendances**
F-00 · `drawTimeline()` · `findMomentsCles()` (peut coexister — les runs ≥3 buts restent affichés en complément)

---

### F-04 — Tableau gardien × famille adverse

**Description utilisateur**
En tant que co-coach, je veux voir si notre gardien est en difficulté face à certains types d'attaque adverses — afin de préparer une stratégie défensive ciblée avant le prochain match.

**Données nécessaires**
- `enclenchement` (COLS index 9) → famille via F-00 — lignes `club !== 'FENIX'`
- `gardien` (COLS index 10) : nom du gardien FENIX en jeu (sur les lignes adversaires)
- `finalite` (COLS index 8) : "Tir arrêté" / "But"
- `field_position` (COLS index 12) : zone pour le Snack heatmap

**Règle métier clé**
- Filtrer uniquement les lignes `club !== 'FENIX'` (attaques adverses)
- Calculer `% arrêts = Tirs arrêtés / Total tirs` par gardien par famille
- Signal : si `% arrêts < (moyenne gardien saison - 15%)` → ALERTE rouge ; si `> (moyenne + 10%)` → BON vert ; sinon → neutre gris
- Si plusieurs gardiens ont joué : sélecteur de gardien en haut du bloc (garder le dernier gardien actif par défaut)

**Critères d'acceptation**
- Tableau compact : 5 colonnes — Système adverse · Tirs · Arrêts · % arrêts · Signal
- Signal lisible en un coup d'oeil (couleur + texte court : "ALERTE" / "BON" / "—")
- Ligne en-tête avec nom du gardien et % arrêts global du match
- Sélecteur gardien visible si ≥ 2 gardiens ont joué dans le match
- Clic sur une ligne famille → heatmap compacte filtrée sur cette famille (canvas existant réorienté)
- Si famille a < 3 tirs → afficher "(n<3)" sans signal pour éviter les artefacts sur petit volume

**Dépendances**
F-00 · Canvas impact zones existant (réorientation, pas réécriture)

---

### F-05 — Enclenchements saison V vs D (R2)

**Description utilisateur**
En tant que coach, je veux voir quels systèmes d'attaque sont associés à nos victoires sur toute la saison et lesquels apparaissent dans nos défaites — afin d'identifier notre force offensive structurelle.

**Données nécessaires**
- `enclenchement` (COLS index 9) → famille via F-00
- Résultat match (V/D/N) depuis `MATCHS[]`
- `rencontre` pour l'agrégation par match

**Règle métier clé**
Agréger par famille : pour chaque match, calculer l'efficacité possession de la famille. Grouper ensuite par résultat (V/D/N). Afficher la moyenne d'efficacité par famille par résultat.

**Critères d'acceptation**
- Tableau : colonnes Famille · Eff. moy. Victoires · Eff. moy. Défaites · Différence
- Différence colorée : vert si famille plus efficace en V, rouge si plus efficace en D (anomalie)
- Prérequis : ≥ 5 matchs (message explicatif sinon)
- S'intègre dans la section `generateSeasonCorrelations()` existante (nouvelle ligne ou bloc dédié)

**Dépendances**
F-00 · `generateSeasonCorrelations()` · R1 complet (F-00 à F-04 validés)

---

### F-06 — Matrice défense attaquée × résultat FENIX (R2, bloquée par Bug #23)

**Description utilisateur**
En tant que coach, je veux savoir contre quelle défense adverse FENIX est le plus en difficulté — afin de cibler les semaines d'entraînement en conséquence.

**Données nécessaires**
- `defense_attaquee` (COLS index 5, actuellement non mappée — Bug #23)
- `resultat`, `club`

**Règle métier clé**
Filtrer `club === 'FENIX'`. Croiser `defense_attaquee × finalite`. Calculer efficacité possession par défense adverse. Trier par efficacité croissante (défenses problématiques en tête).

**Critères d'acceptation**
- Bug #23 résolu au préalable (`defense_attaquee` correctement mappée dans COLS)
- Tableau : Défense adverse · Possessions · Tirs · Buts · Efficacité possession
- Ligne colorée en rouge si efficacité < 40%, verte si > 60%
- Vue match ET vue saison (toggle)

**Dépendances**
Fix Bug #23 (COLS.defense_attaquee) · F-00 recommandé pour la cohérence globale

---

## 5. Ordre de livraison — releases

### Release 1 — Valeur maximale, effort minimum (4–6 jours dev)

**Objectif :** Le coach peut répondre à ses 3 questions critiques pour n'importe quel match.

| Feature | Effort estimé |
|---------|---------------|
| F-00 : Parser enclenchement → famille | S (½ jour) |
| F-01 + F-01b : 3 cards famille + tableau expandable | M (1 jour) |
| F-02 : Badges force/faiblesse | S (½ jour) |
| F-03 : Timeline enrichie + section bascule | M (1,5 jours) |
| F-04 : Tableau gardien × famille adverse | M (1 jour) |

**Prérequis avant dev R1 :**
1. Session coach 15 min → valider la table `ENC_FAMILLE_MAP` (mapping enclenchements → familles)
2. Confirmer la définition exacte d'une "perte de balle" dans les colonnes actions (index 16-18)
3. Fix Bug #8 inclus dans F-03 (canvas `clientWidth = 0`)

**Valeur livrée R1 :** les 3 besoins critiques de l'Analyst sont couverts. Le coach peut, en 30 secondes sur n'importe quel match :
- Voir quelle famille d'attaque a fonctionné (F-01)
- Savoir si c'est notre force ou leur faiblesse (F-02)
- Voir visuellement le moment bascule (F-03)
- Identifier si le gardien a subi des faiblesses par système (F-04)

---

### Release 2 — Vue saison et défense (3–4 jours dev)

**Objectif :** Croiser les insights match avec les tendances saison et la dimension défense attaquée.

| Feature | Effort estimé | Prérequis |
|---------|---------------|-----------|
| F-05 : Enclenchements saison V vs D | M (1 jour) | F-00 validé |
| F-06 : Matrice défense attaquée × résultat | M (1,5 jours) | Fix Bug #23 obligatoire |
| F-08 de l'audit : Gardien match N vs N-1 par zone | M (1 jour) | F-04 validé |
| F-11 de l'audit : Corrélation défense × gardien adverse | M (1 jour) | Fix Bug #23 obligatoire |

**Condition de lancement R2 :** Bug #23 résolu ET R1 complète + stable (pas de régression).

---

### Release 3 — Profondeur et export (2–3 jours dev, après validation terrain R2)

**Objectif :** Compléter l'analyse avec les dimensions joueur individuel et la portabilité des données.

| Feature | Description |
|---------|-------------|
| F-09 de l'audit : Évolution KPI par bilan | Courbe de progression multi-bilans |
| F-12 de l'audit : Action joueur × enclenchement | Contribution individuelle aux systèmes |
| F-14 de l'audit : Export CSV/Excel | Partage des données brutes |
| F-06 radar joueur (audit) | Déplacer dans page-joueurs.js |

---

## 6. Ce qui ne change pas — l'existant conservé tel quel

Les fonctions suivantes de `js/page-analyse.js` sont conservées **sans modification** :

| Fonction | Conservation |
|----------|-------------|
| `updateAnalysePage()` | Point d'entrée — les nouvelles features s'y branchent en ajout |
| `generateResume3Points()` | Résumé 3 stats auto — conservé tel quel |
| `generateIndicateurs()` | Cards KPIs FENIX vs ADV avec MT1/MT2 — conservé tel quel |
| `saveCoachAnalyse()` | Notes libres coach localStorage — conservé tel quel |
| `sendChatMessage()` / `generateChatResponse()` | Chatbot local — conservé, enrichissement optionnel R3 |
| `generateSeasonCorrelations()` | **Étendu** (colonnes famille ajoutées) mais logique de base intacte |
| `drawTimeline()` | **Étendu** (courbe écart ajoutée) mais canvas et `scoreHistory[]` réutilisés |
| `findMomentsCles()` | **Coexiste** avec la nouvelle détection bascule — les runs ≥3 buts restent affichés |

**Composants CSS réutilisés :**
- Classes `avantage` / `desavantage` → réutilisées pour les signaux force/faiblesse
- Composant `moment-badge positif/negatif` → réutilisé pour la section contextuelle bascule
- Composant `card(label, fVal, aVal, options)` → réutilisé comme base des cards famille

---

## 7. Risques produit

### R1 — Table de mapping `ENC_FAMILLE_MAP` incomplète ou instable
**Description :** Le coach encode des noms d'enclenchement librement depuis le logiciel vidéo. Les clés peuvent varier d'un match à l'autre (casse, typos, nouveaux mouvements). Si 30% des enclenchements tombent dans "Autre", les cards famille sont inutilisables.
**Probabilité :** Haute. **Impact :** Critique (toutes les features R1 dépendent du parser).
**Mitigation :** Session de validation obligatoire avec le coach avant le premier commit. Afficher dans l'UI le % d'enclenchements classés vs non classés. Logguer les clés inconnues en console. Rendre le mapping éditable dans un objet JS simple (pas en dur dans les fonctions).

### R2 — Volume insuffisant par famille pour des statistiques robustes
**Description :** Si un match contient seulement 3 possessions en "Faire courir", un % d'efficacité de 33% vs 67% n'est pas significatif mais sera affiché comme tel.
**Probabilité :** Moyenne. **Impact :** Modéré (mauvaise décision tactique).
**Mitigation :** Afficher `(n=X)` en sous-texte de chaque card. Si `n < 5` → afficher "(trop peu de données)" à la place de la barre de progression. Ne pas afficher le badge force/faiblesse si `n < 5`.

### R3 — Bug #23 non résolu avant R2 (defense_attaquee non mappée)
**Description :** F-06 et F-11 dépendent du mapping `defense_attaquee` dans COLS. Si le fix est retardé (incertitude sur la colonne Excel source), la R2 est partiellement bloquée.
**Probabilité :** Moyenne. **Impact :** Modéré (R2 incomplète mais R1 non affectée).
**Mitigation :** Identifier la colonne Excel source lors de la session avec le coach (même session que le mapping ENC_FAMILLE_MAP). Si confirmation impossible → sortir F-06 et F-11 de R2 et les passer en R3 plutôt que de bloquer la release.

### R4 — Régression sur `drawTimeline()` lors de l'extension R1 (F-03)
**Description :** `drawTimeline()` est une fonction canvas complexe (234 lignes). L'ajout de la courbe d'écart et des marqueurs bascule peut casser l'affichage existant (scores, courbes bleue/rouge) si mal intégré.
**Probabilité :** Moyenne. **Impact :** Modéré (timeline principale brisée).
**Mitigation :** L'Architect isole la logique de dessin de la courbe d'écart dans une fonction distincte `drawMomentumOverlay(ctx, scoreHistory, canvas)` appelée après le dessin existant. Pas de modification des lignes de dessin existantes. Tests visuels sur 3 matchs de référence avant merge.

### R5 — Tablette : lisibilité des 3 cards sur viewport < 900px
**Description :** 3 cards côte à côte sur tablette en portrait (768px) peuvent être trop compressées pour être lisibles.
**Probabilité :** Haute. **Impact :** Faible-Modéré (UX dégradée, pas de perte de données).
**Mitigation :** Le Designer définit le breakpoint de bascule horizontal → vertical (empilées) dès le wireframe. Valeur suggérée : ≤ 850px → cards empilées. L'objectif O5 impose que ce soit validé sur tablette réelle avant livraison R1.

---

## Annexe — Colonnes de référence

| Colonne | Index COLS | Usage dans ce PRD |
|---------|------------|-------------------|
| `enclenchement` | 9 | F-00, F-01, F-03, F-04, F-05 |
| `finalite` | 8 | F-01, F-04 (But / Tir arrêté) |
| `club` | — | Filtre FENIX vs adversaire dans toutes les features |
| `gardien` | 10 | F-04 |
| `field_position` | 12 | F-04 (heatmap zone) |
| `defense` / `defense_attaquee` | 5 (Bug #23 à clarifier) | F-06, F-11 (R2) |
| `periode` | 13 | F-03 (MT1/MT2) |
| `position` | timecode | F-03 (axe temporel timeline) |
| `action_joueur`, `action_att`, `action_def` | 16-18 | F-05, R3 (contribution joueur) |

---

*Document PRD v1.0 — à lire avec ANALYST-analyse-module.md et UX-RESEARCH-analyse-module.md pour le contexte complet.*

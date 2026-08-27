# UX Research — Module Analyse

**Agent :** UX Researcher  
**Date :** 2026-06-17  
**Input :** Entretien utilisateur + ANALYST-analyse-module.md + AUDIT-NUIT-2026-06-16.md + js/page-analyse.js + recherche web extensive

---

## Partie 1 — Ce que font les autres (web research)

### 1A — Outils handball existants

#### Handball.ai (EHF Official Partner)

Handball.ai est l'outil de référence au niveau professionnel mondial, officiellement partenaire de l'EHF depuis la saison 2023/24. Il couvre toutes les compétitions majeures : EHF EURO, EHF Champions League, championnats continentaux. L'outil a été validé scientifiquement dans une étude publiée dans *Sensors* (MDPI, 2023) avec une fiabilité intra-observateur de 0.913–0.957 et inter-observateur de 0.904–0.937.

**Ce que Handball.ai analyse sur les systèmes offensifs :**
- Analyse des contre-attaques vs attaques placées vs jeu rapide (fast breaks, positional attacks, running back strategies)
- Nombre de possessions par système et efficacité associée
- Identification de qui a généré la supériorité offensive (notion de "créateur de supériorité" — information absente des autres outils)
- Localisation des tirs avec probabilités de conversion par zone
- Analyse gardien intégrée à chaque type d'attaque

**Ce que Handball.ai ne fait pas bien :** la classification par "famille d'attaque" au sens du coach amateur (Faire courir / Jeu Pivot / Isoler) n'existe pas telle quelle. Les taxonomies pro sont davantage positionnelles (attaque placée par axe, aile, pivot, 9m) que systémiques.

Sources : [Handball.ai](https://handball.ai/) | [PMC validation study](https://pmc.ncbi.nlm.nih.gov/articles/PMC10422213/) | [Sideline Sports / EHF partnership](https://sidelinesports.com/blog/ehf-euro-analysis-with-xps-video-analyzer-handball-ai/)

---

#### XPS Video Analyzer (Sideline Sports)

Utilisé en conjonction avec Handball.ai pour les compétitions EHF. Le workflow type : tagging vidéo des actions en temps différé → liaison automatique avec les événements statistiques → génération de clips annotés. Les enclenchements sont taggués manuellement par l'analyste dans XPS, puis croisés avec les stats Handball.ai.

**Pattern UX à retenir :** le tagging par catégories d'actions est au cœur du workflow. C'est exactement ce que fait l'app FENIX avec la colonne `enclenchement` — mais sans exploitation analytique derrière.

---

#### Advanced Metrics (advanced-metrics.com)

Application dédiée handball, disponible sur App Store. Fonctionnalités clés :
- Enregistrement de chaque action (buts, turnovers, arrêts) en temps réel ou post-match
- Visualisation des zones de but les plus ciblées et efficacité par joueur
- Accès aux statistiques live pendant les matchs
- Dashboard coach avec KPIs configurables

**Pattern UX notable :** l'interface permet de "bridger the gap between coaching staff and athletes" — interface duale staff/joueur, comme l'app FENIX.

Source : [Advanced Metrics App Store](https://mwm.ai/apps/advanced-metrics-handball/6740020795) | [advanced-metrics.com](https://advanced-metrics.com/)

---

#### SaveZone / PerformingStats (performingstats.de)

Application spécialisée analyse gardien, avec des fonctionnalités avancées :
- Visualisation interactive des zones de but avec positionnement précis des tirs
- Heatmaps de performance identifiant forces et vulnérabilités
- Pourcentages d'arrêts par zone et par type de tir
- Reconnaissance de patterns par machine learning
- Tendances historiques et métriques comparatives entre matchs

**Pattern UX très pertinent pour FENIX :** la grille de but 3×3 (9 zones) est le standard de visualisation. La déclinaison "par type d'attaque" est ce que FENIX vise pour le Besoin #4.

Sources : [PerformingStats](https://www.performingstats.de/) | [SaveZone App Store](https://apps.apple.com/au/app/savezone/id6742418142)

---

#### Spiideo AutoData, Dartfish, Hudl Sportscode

- **Spiideo** : tracking automatique par caméra AI, données positionnelles temps réel. Hors périmètre amateur.
- **Dartfish** : workflow vidéo + annotations tactiques, export clips. Utilisé par fédérations et clubs pros. Dashboard de session d'analyse avec codes couleur par famille d'action.
- **Hudl Sportscode** : outil pro le plus répandu en Europe. Interface personnalisable à l'extrême. Statistiques, heatmaps, rapports. Tagging des systèmes offensifs via "code windows" configurables.

**Ce que Hudl Sportscode révèle sur l'UX :** la personnalisation totale des catégories de tagging est sa force. L'analyste crée ses propres familles de systèmes. C'est précisément la taxonomie que le coach FENIX a créée (Faire courir / Jeu Pivot / Isoler).

Sources : [Best Handball Video Analysis 2026](https://wifitalents.com/best/handball-video-analysis-software/) | [Hudl Sportscode](https://www.hudl.com/en_gb/products/sportscode) | [Dartfish Handball](https://www.dartfish.com/handball/) | [Spiideo AutoData](https://www.spiideo.com/autodata/autodata-handball/)

---

#### HandStatistiques.fr, iSquad, ORION SporTech (France amateur)

Outils du marché français amateur :
- **HandStatistiques.fr** : stats des championnats français amateur (consultation, pas d'analyse)
- **iSquad** : analyse statistique post-match, identification forces/faiblesses, aide aux décisions tactiques
- **ORION SporTech** : KPIs collectifs handball, indicateurs de performance offensive et défensive

**Observation clé :** aucun de ces outils n'offre la granularité "famille d'enclenchement × efficacité possession" que vise le module FENIX. C'est un vrai différentiateur.

Sources : [ORION SporTech](https://orion-sportech.com/handball-statistiques-indicateurs-performance-collective/) | [iSquad](https://www.isquad.info/fr/analyse-statistique-du-handball-pour-suivre-les-performances-des-equipes-et-des-joueurs/) | [HandStatistiques.fr](https://handstatistiques.fr/)

---

### 1B — UX/UI des dashboards sports analytics

#### Le principe des 3 secondes

La règle universelle des dashboards analytiques sportifs : **si l'utilisateur ne peut pas identifier la tendance clé en 3 secondes, le design a échoué** (source : SGX Studio, LSports). Pour un coach post-match fatigué, ce principe est encore plus critique. Les implications concrètes :

- La métrique la plus importante (efficacité famille d'enclenchement) doit être en top-left ou en headline
- Le code couleur vert/rouge doit être immédiatement lisible sans lire les chiffres
- Les tableaux détaillés sont accessibles mais pas en première vue

#### La hiérarchie "Bite / Snack / Meal"

Pattern documenté par SGX Studio pour les dashboards sportifs :
- **Bite** : insight card avec 1 chiffre + label + couleur (ex: "Faire courir : 67% ↑")
- **Snack** : mini-graphique ou tableau 3 colonnes (ex: tableau famille × buts × efficacité)
- **Meal** : vue complète drill-down (ex: timeline annotée avec tous les enclenchements)

Ce pattern est parfaitement adapté au contexte FENIX : le coach veut d'abord le résumé (Bite), puis peut creuser (Meal).

Sources : [SGX Studio](https://sgx.studio/sports-data-ux-design-making-complex-stats-digestible/) | [LSports Data Visualization](https://www.lsports.eu/blog/sports-data-visualization/)

---

#### Radar charts vs cards vs tables

Selon les recherches et l'étude comparative (Lollypop Design / UX Planet) :

| Format | Meilleur usage | Limite |
|--------|----------------|--------|
| **Radar chart** | Profil multi-dimensionnel d'un joueur ou d'une équipe sur 5+ axes simultanés | Mauvais pour la comparaison précise de valeurs proches |
| **Cards KPI** | Comparaison rapide FENIX vs adversaire, avec avantage coloré | Pas adapté aux tendances dans le temps |
| **Tableau** | Classement de 3–8 items avec plusieurs métriques | Lecture lente, dense |
| **Bar chart horizontal** | Comparaison de familles d'enclenchements entre elles | Nécessite un axe de référence (moyenne saison) |
| **Timeline annotée** | Séquences et moments clés dans le temps | Complexe à construire, riche en information |

**Recommandation générale :** pour 3 familles d'enclenchements, les cards KPI horizontales + bar chart d'efficacité sont supérieures au radar (trop complexe pour 3 items seulement).

Sources : [Lollypop Design](https://lollypop.design/blog/2019/november/dashboard-design-in-the-sports-industry/) | [UX Planet Designing Sports Analytics](https://uxplanet.org/designing-sports-analytics-fa686c10aae6) | [Pencil & Paper Dashboard Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)

---

#### Dashboards coach spécialisés

Une étude publiée sur PMC (NCT Cooperative Design, 2022) sur la conception participative d'un dashboard coach pour la prescription d'entraînement identifie les principes clés :
- Le coach veut des **décisions actionnables**, pas des données brutes
- L'interface doit s'adapter au **mindset du moment** (post-match = analyse causale, préparation = comparaison adversaire)
- Les alertes et signaux forts (émoji, couleur saturée, badge) sont plus efficaces que les chiffres seuls pour déclencher l'attention

Source : [PMC Coach Dashboard Co-Design](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9737713/)

---

#### Patterns football et basketball transférables

**Football (Tableau Football Dashboards) :** les dashboards Tableau publiés par clubs professionnels organisent systématiquement les KPIs en : (1) résumé résultat, (2) radar d'efficacité, (3) heatmap spatiale, (4) timeline d'événements. Ce séquencement correspond exactement au flux de lecture naturel d'un coach.

**Basketball (ESPN GameFlow) :** le GameFlow ESPN affiche l'écart de score + probabilité de victoire sur une timeline unique, avec des marqueurs d'événements clés (foul-out, timeout, run). Le pattern "score differential over time" est universel.

Sources : [Tableau Football Dashboards](https://www.quantizeanalytics.co.uk/tableau-football-dashboard-examples/) | [FiveThirtyEight NBA Win Probability](https://fivethirtyeight.com/features/every-nba-teams-chance-of-winning-in-every-minute-across-every-game/) | [GameFlow Research](https://www.researchgate.net/publication/309080509_GameFlow_Narrative_Visualization_of_NBA_Basketball_Games)

---

### 1C — Analyse tactique handball

#### Métriques clés pour l'efficacité offensive

La recherche académique publiée dans *PMC* et *MDPI* sur les championnats du monde identifie les métriques suivantes comme les plus prédictives du résultat :

1. **Efficacité tir** (goals/shots) — seuils pro : >60% excellent, 55–60% correct, <55% insuffisant
2. **Efficacité possession** (goals / shots + turnovers) — métrique plus robuste car intègre les possessions sans tir
3. **Efficacité par type d'attaque :**
   - Contre-attaque : efficacité la plus haute (>70% en pro), car défense déséquilibrée
   - Attaque rapide : efficacité intermédiaire (~60%)
   - Attaque placée : efficacité plus basse (~45–50%) mais volume le plus important
4. **Assists** — les équipes qui gagnent font en moyenne 18.7 assists vs 14.5 pour les perdants

**Observation clé :** la contre-attaque est systématiquement la plus efficace quelle que soit la défense adverse. Dans la taxonomie FENIX, "Faire courir" correspond probablement aux transitions rapides. Son efficacité devrait être naturellement plus haute.

Sources : [PMC Comparative Analysis Winning/Losing Teams](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7544740/) | [PMC Tactical Variables Elite Handball](https://pmc.ncbi.nlm.nih.gov/articles/PMC9249053/) | [INEFC Effectiveness Offensive Systems](https://revista-apunts.com/en/effectiveness-of-offensive-systems-in-handball/)

---

#### Défenses attaquées : 0-6, 1-5, 2-4

Une étude MDPI sur les positions défensives en handball (utilisant des systèmes de positionnement locaux) révèle :

- La **défense 0-6** est la plus stable et la moins perturbable par l'attaque adverse
- La **défense 1-5** et la **défense 3-3** sont les plus faciles à perturber mais aussi les plus adaptables
- La **défense 2-4** est intermédiaire

**Implication pour FENIX :** si l'adversaire joue en 0-6, FENIX devrait s'attendre à une efficacité plus basse en attaque placée. Si l'adversaire passe en 1-5, c'est une opportunité d'exploiter le jeu pivot (le 1 avancé crée un couloir). Croiser `defense_attaquee × enclenchement × résultat` est donc analytiquement très puissant.

La **corrélation triplette** (enclenchement × défense attaquée × résultat) est décrite par les chercheurs comme "le cœur analytique du handball moderne" (source : Audit NUIT 2026-06-16, section 2A, qui cite cette formulation).

Sources : [MDPI Defensive Organizations](https://www.mdpi.com/1424-8220/22/15/5692) | [ResearchGate Offensive/Defensive Play](https://www.researchgate.net/publication/328720393_Offensive_and_Defensive_Play_in_Handball_in_a_2-Year_World_Championship_Cycle_Characteristics_and_Tendencies)

---

#### Force récurrente vs faiblesse ponctuelle — méthodes analytiques

La recherche en analytics sportifs identifie deux approches pour distinguer "notre force" vs "leur faiblesse" :

**Approche 1 — Comparaison à la moyenne saison (méthode FENIX selon l'Analyst)**
Si l'efficacité d'un enclenchement est ≥1.5× la moyenne saison, c'est probablement une faiblesse adverse ponctuelle. Si elle est consistante sur tous les matchs (faible variance), c'est une force FENIX.

**Approche 2 — Ajustement par la force de l'adversaire (méthode académique)**
En sports analytics avancés, on ajuste les métriques pour la force de l'opposition. Exemple : une équipe marquant 35 buts contre un adversaire de bas niveau est moins informative qu'une équipe en marquant 28 contre le leader du championnat.

**Approche recommandée pour FENIX (pragmatique) :** la méthode de l'Analyst est correcte et réalisable avec les données disponibles (moyenne saison + variance). L'ajustement par force adverse est hors périmètre à ce stade (données d'opposition insuffisantes).

Source : [Sportmonks Team Form Analytics](https://www.sportmonks.com/glossary/team-form-analytics/) | [Data Calculus Opponent Analysis](https://datacalculus.com/en/blog/sports-teams-and-clubs/data-analyst/data-analysts-guide-to-opponent-analysis-for-sports-teams)

---

#### Analyse gardien par position et système adverse

La recherche académique (PMC, World Championship 2015) établit les standards de l'analyse gardien handball :
- Division de la cage en **9 zones** (grille 3×3 : Haut/Centre/Bas × Gauche/Centre/Droite)
- Efficacité par zone : zone centrale basse = la plus difficile à arrêter ; zones hautes = plus favorables au gardien
- Efficacité par poste tireur : 65.6% des tirs viennent des backs à 9m (efficacité 38–40%) ; pivots et ailiers tirent de plus près (efficacité plus haute pour le tireur, plus dure pour le gardien)
- **Efficacité globale moyenne en pro : 45.84%**

Ce qui manque dans la littérature : croiser l'efficacité du gardien avec le **système offensif adverse** (pas seulement la zone ou le poste tireur). C'est précisément le Besoin #4 de FENIX — et c'est innovant même à l'échelle pro.

Sources : [PMC Goalkeeper World Championship 2015](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5819469/) | [Medium Goalkeeper Season Analysis](https://medium.com/@fe.alvarezdiaz/detailed-analysis-of-a-handball-goalkeepers-performance-across-seasons-a7ba0ba9aabe)

---

### 1D — Visualisation du moment bascule

#### Bundesliga Match Momentum (AWS) — La référence

Le système le plus documenté et le plus avancé pour la visualisation du momentum match est le **Bundesliga Match Facts powered by AWS**, développé par Sportec Solutions avec DFL et AWS.

**Comment il fonctionne :**
- Calcul toutes les minutes des activités offensives des deux équipes sur les **5 dernières minutes**
- Variables prises en compte : tirs cadrés (avec xG et xSave), avancées en zone offensive, corners, centres, ballons reçus en surface, coups francs en zone offensive, possession dans le camp adverse, expulsions
- Momentum = différence entre la menace offensive des deux équipes
- Valeur positive = momentum côté équipe domicile ; valeur négative = momentum visiteur
- **Visualisation :** courbe oscillant autour de zéro, affichée en plein écran à la mi-temps ou en cas de retournement complet

**Applicabilité pour FENIX :** le principe des 5 dernières possessions glissantes est directement transposable. Au lieu de "5 dernières minutes", FENIX utiliserait "5 dernières possessions" (une possession = une ligne DATA). Le momentum serait : différence des buts sur les 5 dernières possessions de chaque équipe.

Sources : [AWS Bundesliga Match Momentum Blog](https://aws.amazon.com/blogs/media/bundesliga-match-fact-match-momentum-revealing-the-games-invisible-pulse/) | [Bundesliga Official](https://www.bundesliga.com/en/bundesliga/news/bundesliga-match-facts-aws-match-momentum-34052) | [DFL](https://www.dfl.de/en/innovation/bundesliga-match-facts-match-momentum-expands-the-data-offering/)

---

#### Méthodes de détection algorithmique des points de bascule

**CUSUM (Cumulative Sum)** — algorithme recommandé par la recherche académique pour détecter les turning points dans les sports :
- Calcule la somme cumulative des écarts par rapport à une baseline (ici : 0 = égalité)
- Un turning point est détecté quand la somme cumulative recroise zéro
- Simple à implémenter, robuste, sans paramètre complexe

**Autres approches identifiées :**
- Hidden Markov Models (HMM) — trop complexe pour FENIX
- CatBoost / Random Forest — nécessite un historique de matchs important
- Approche Elo par possession — intéressante mais complexe

**Recommandation pour FENIX :** l'approche CUSUM sur l'écart de score est la plus adaptée. Combinée à la détection de runs (déjà implémentée via `findMomentsCles()`), elle couvre les deux dimensions : le momentum continu ET les pics ponctuels.

Sources : [MLFEF Paper arXiv](https://arxiv.org/pdf/2402.12149) | [ResearchGate Momentum Shift Forecasting](https://www.researchgate.net/publication/383112267_Investigating_and_Forecasting_Momentum_Shift_Effects_on_Strategy_Development_in_Sports_Competitions) | [Opta Analyst What is Match Momentum](https://theanalyst.com/articles/what-is-match-momentum)

---

#### Win Probability Chart et GameFlow — Patterns NBA/ESPN

Le pattern ESPN GameFlow est le plus documenté pour les courbes de momentum :
- Axe X : temps (ici possessions numérotées ou timecode normalisé)
- Axe Y : probabilité de victoire (ou, pour FENIX : écart de score relatif)
- Marqueurs noirs majeurs aux changements de période, gris mineurs toutes les minutes
- Tooltip au survol : score actuel, possession, probabilité, description de l'action
- Visualisation du "score differential over time" : directement lisible, universellement compris

**Approche Medium (Points Momentum Chart) :** une implémentation open-source visualise le momentum comme un scatter plot des points de chaque équipe sur l'axe du temps, avec une ligne de tendance glissante. Le renversement se lit immédiatement quand les courbes se croisent.

Sources : [Medium Points Momentum Chart](https://medium.com/@sumit.tripathi/analyse-sports-better-with-points-momentum-chart-25a158cb7f5c) | [Devpost Match Momentum Dashboard](https://devpost.com/software/match-momentum-dashboard) | [Raskie Momentum Charts History](https://raskie.com/post/momentum-charts-a-brief-history) | [FiveThirtyEight NBA Win Probability](https://fivethirtyeight.com/features/every-nba-teams-chance-of-winning-in-every-minute-across-every-game/)

---

## Partie 2 — Analyse de l'existant

### 2.1 Ce qui existe dans le code — cartographie fonctionnelle

La page analyse (`js/page-analyse.js`, 750 lignes) contient les fonctions suivantes, lues en détail :

| Fonction | Description | Réutilisabilité |
|----------|-------------|-----------------|
| `updateAnalysePage()` | Point d'entrée, filtre sur 1 match | Base solide — réutiliser |
| `generateResume3Points()` | Top 3 stats auto-générées (efficacité, PB, gardien, supériorités, MT1/MT2) | Réutiliser le pattern scoring + tri |
| `generateIndicateurs()` | KPIs FENIX vs ADV avec MT1/MT2 — cards HTML avec classes `avantage`/`desavantage` | Réutiliser le composant `card()` pour les familles |
| `drawTimeline()` | Canvas évolution du score sur 60 min normalisées — courbe bleue FENIX + rouge ADV | ETENDRE : ajouter la courbe d'écart + marqueurs d'enclenchements |
| `findMomentsCles()` | Détection de runs ≥3 buts consécutifs → badges HTML | REMPLACER par détection CUSUM + enrichissement enclenchements |
| `generateChatResponse()` | Chatbot local — répond aux questions sur les enclenchements, supériorités, gardien, buteurs | ENRICHIR : ajouter familles, moment bascule |
| `generateSeasonCorrelations()` | Tableau V/D/N × 6 KPIs avec signal fort/modéré — agrégation saison | ETENDRE : ajouter colonnes familles enclenchements |
| `saveCoachAnalyse()` | Notes coach localStorage | Garder tel quel |

**Patterns UI déjà en place et réutilisables :**
- Composant `card(label, fVal, aVal, options)` — parfait pour les 3 familles (Faire courir, Jeu Pivot, Isoler)
- Classe CSS `avantage` / `desavantage` — déjà stylée, réutiliser pour force/faiblesse
- Système de badges `moment-badge positif/negatif` — réutiliser pour les badges famille
- Canvas 2D avec `ctx` — réutiliser pour la courbe de momentum enrichie

---

### 2.2 Ce qui manque — gap analytique

**Côté données :**
- Aucun parsing de la colonne `enclenchement` (format `"8;0;Bloc 4"`) — aucune fonction n'existe
- Aucune classification par famille (Faire courir / Jeu Pivot / Isoler) — la mapping n'est pas codée
- `defense_attaquee` non mappée dans COLS (Bug critique #23 de l'audit)
- Pas de reconstruction de l'écart de score en continu (seulement au global via `scoreHistory[]` dans `drawTimeline`)

**Côté UX :**
- `findMomentsCles()` détecte les runs mais n'indique pas **quels enclenchements** ont été utilisés pendant ce run
- Aucune vue famille d'enclenchement
- Aucune comparaison match actuel vs moyenne saison
- Pas de vue gardien par enclenchement adverse

---

### 2.3 Ce qui est réutilisable directement

La fonction `drawTimeline()` construit déjà un `scoreHistory[]` — tableau de `{pos, fenix, adv}` pour chaque but. C'est la base parfaite pour calculer l'écart `fenix - adv` à chaque possession et tracer la courbe de momentum.

La boucle `generateSeasonCorrelations()` agrège déjà tous les matchs par résultat (V/D/N). Elle peut être étendue pour calculer `efficacitéParFamille` par match puis la moyenner.

La fonction `generateChatResponse()` contient déjà un bloc `enclenchements` (ligne 519–532) qui groupe les buts par `row[COLS.enclenchement]`. C'est le même mécanisme que celui nécessaire pour l'analyse des familles — il manque juste la couche de classification par famille.

---

### 2.4 Contraintes UX spécifiques à cette app

**Contexte d'usage :**
- Usage exclusivement post-match, sur desktop ou tablette (pas de temps réel)
- Utilisateurs : 2 personnes (coach principal + Max), tous les deux familiers des données
- Pas d'export requis à ce stade (hors scope selon l'Analyst)

**Contraintes techniques :**
- Vanilla JS sans framework ni bundler — pas de composants réactifs, pas de state management
- Canvas 2D natif pour les graphiques (pas de Chart.js pour la timeline, mais Chart.js est disponible pour les radars joueurs via `renderPmfGraph`)
- Données Excel → SheetJS → `DATA[]` — les données sont en mémoire, les accès sont synchrones et rapides
- `enclenchement` est une chaîne multi-parties nécessitant un parser `encStr.split(';')[0]` pour le nom du mouvement

**Contraintes UX mobile/tablette (issues identifiées dans l'audit) :**
- Bug #8 : canvas timeline ne se redimensionne pas si la fenêtre change d'orientation
- Bug #18 : pas de ResizeObserver sur le container timeline
- Bug #20 : `position: fixed` + clavier virtuel iOS = problème sur le chat
- Le module Analyse est staff uniquement (pas mode joueur) — tablette raisonnable, mobile moins critique

---

## Partie 3 — Recommandations UX par besoin

### Besoin #1 — CRITIQUE : Le moment bascule

#### Diagnostic actuel

`findMomentsCles()` détecte des runs de buts consécutifs (≥3) mais :
- Affiche seulement "Série de X buts FENIX" — aucun contexte tactique
- N'identifie pas le moment de basculement proprement dit (le point d'inversion de l'écart)
- Ne croise pas avec `enclenchement`

`drawTimeline()` trace les courbes de score mais sans courbe d'écart ni marqueurs d'enclenchements.

#### Pattern recommandé : Timeline enrichie + Zone bascule

**Visualisation principale : Courbe d'écart de score annotée**

Sur le canvas existant, ajouter une 3e courbe : `écart = fenix - adv` à chaque possession. Cette courbe oscille autour de zéro. Quand elle passe sous zéro → zone danger (fond rouge translucide). Quand elle repasse au-dessus → zone reprise (fond vert translucide).

Le **moment bascule** est le point de l'écart minimal (le creux de la courbe) ou le moment où FENIX passe de positif à négatif. Le marquer avec un pictogramme vertical sur la timeline (ligne pointillée orange + label "Bascule").

**Enrichissement tactique : Section "Pendant ce moment"**

Sous la timeline, une section contextuelle s'affiche automatiquement quand un moment bascule est détecté :

```
BASCULE DÉTECTÉE — Possession 18 à 24 (score passé de +3 à -2)
┌─────────────────────────────────────────────────────────────┐
│ Enclenchements adverses pendant ce run (6 possessions) :    │
│  • Jeu Pivot × 3 (2 buts) — efficacité 67%                 │
│  • Faire courir × 2 (2 buts) — efficacité 100%             │
│  • Isoler × 1 (0 but)                                       │
│                                                              │
│ Enclenchements FENIX pendant ce run :                       │
│  • Jeu Pivot × 2 (0 but)   • Faire courir × 1 (0 but)      │
└─────────────────────────────────────────────────────────────┘
```

**Algorithme de détection (implémentation suggérée) :**

1. Reconstruire `scoreHistory[]` déjà disponible dans `drawTimeline` — calculer `diff = fenix - adv` à chaque possession
2. Identifier : (a) les runs adverses ≥3 buts (déjà fait), (b) les inversions de signe du diff, (c) le creux le plus profond
3. Classer chaque possession en famille d'enclenchement via la fonction de parsing à créer
4. Afficher le contexte tactique de la séquence identifiée

**Justification UX :** le Bundesliga Match Momentum utilise exactement ce pattern de "rolling 5-event window". Les recherches sur CUSUM confirment que l'inversion de signe cumulatif est le signal le plus robuste de turning point. La présentation en deux blocs (ce que l'adversaire a fait / ce que FENIX a fait) répond directement à la question du coach : "est-ce notre effondrement ou leur excellence ?"

---

### Besoin #2 — CRITIQUE : Famille d'enclenchement efficace

#### Pattern recommandé : 3 cards + tableau détail

**Niveau 1 (Bite) — 3 cards horizontales :**

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ FAIRE COURIR │ │  JEU PIVOT   │ │    ISOLER    │
│     67%      │ │     52%      │ │     44%      │
│   eff. poss. │ │   eff. poss. │ │   eff. poss. │
│  8T · 6G     │ │  12T · 7G   │ │   6T · 3G    │
│  ████████░░  │ │  ██████░░░░  │ │  █████░░░░░  │
└──────────────┘ └──────────────┘ └──────────────┘
```

Chaque card affiche :
- Nom de la famille
- Efficacité possession (buts / tirs + PB) en grand format
- Tirs (T) et buts (G)
- Barre de progression colorée (vert si > moyenne saison, rouge si dessous)

**Niveau 2 (Snack) — Tableau détail expandable :**

Clic sur une card → expansion inline avec le détail des enclenchements de cette famille :

```
FAIRE COURIR — détail des 8 tirs
┌──────────────────┬─────┬──────┬───────┐
│ Enclenchement    │ Tirs│ Buts │  Eff. │
├──────────────────┼─────┼──────┼───────┤
│ Croisé sans ball │  4  │  3   │  75%  │
│ Jeu rapide       │  3  │  2   │  67%  │
│ Transition zone  │  1  │  1   │ 100%  │
└──────────────────┴─────┴──────┴───────┘
```

**Pourquoi ce pattern :**
- 3 familles = 3 cards : le format card est optimal pour 3–6 items (pas de radar pour si peu d'items)
- L'efficacité possession (buts / tirs + PB) est la métrique recommandée par l'Analyst ET par la littérature académique (ne biaise pas les tirs faciles)
- Le tableau détail expandable évite le surencombrement initial
- La barre de progression contextualise immédiatement par rapport à la moyenne saison

**Données nécessaires :**
- Mapping `enclenchement → famille` (à créer avec le coach, ex: `"8" → "Faire courir"`, `"Bloc" → "Jeu Pivot"`)
- Parser `encStr.split(';')[0]` pour extraire le type d'enclenchement
- Calcul `efficacitéPossession = buts / (tirs + PB)` par famille

---

### Besoin #3 — IMPORTANT : Force récurrente vs faiblesse ponctuelle

#### Pattern recommandé : Badge contextuel inline dans les cards

Ce besoin ne nécessite pas un module séparé — il s'intègre directement dans les cards du Besoin #2 et dans le tableau de corrélations saison existant.

**Pattern de badge :**

```
┌──────────────────────────────────────────────────────────┐
│  FAIRE COURIR         67%          ████████░░            │
│                                                          │
│  ⭐ FORCE FENIX — efficacité constante sur 8 matchs      │
│     Moy. saison : 64% · Ce match : 67% (écart : +3%)    │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  JEU PIVOT            78%          █████████░            │
│                                                          │
│  ⚡ FAIBLESSE ADVERSE — performance inhabituelle          │
│     Moy. saison : 44% · Ce match : 78% (écart : +34%)   │
└──────────────────────────────────────────────────────────┘
```

**Logique de décision :**
- `effMatchActuel / effMoyenneSaison >= 1.5` → badge "Faiblesse adverse" (orange/jaune)
- `effMatchActuel` proche de `effMoyenneSaison` (±10%) ET consistant → badge "Force FENIX" (vert étoile)
- Ni l'un ni l'autre → pas de badge (neutre)

**Justification UX :**
- Le badge est une "affordance immédiate" — le coach n'a pas à calculer mentalement
- Les deux couleurs distincts (vert stable = force, orange = pic inhabituel) parlent visuellement
- La ligne de sous-texte "Moy. saison X% · Ce match Y% (écart +Z%)" donne la preuve chiffrée immédiatement
- Ce pattern est documenté dans la littérature UX sportive (SGX Studio : "insight cards with contextual comparison")

**Contrainte :** nécessite MIN 3 matchs pour calculer une moyenne saison fiable (même garde-fou que `generateSeasonCorrelations()`).

---

### Besoin #4 — UTILE : Gardien par enclenchement adverse

#### Pattern recommandé : Tableau gardien × famille + heatmap compacte

Le staff veut savoir si le gardien est en difficulté sur certains types d'attaque ennemie. La visualisation doit être lisible pour un coach, pas pour un data scientist.

**Structure en deux blocs :**

**Bloc 1 — Vue par famille adverse (tableau compact) :**

```
Gardien : MARTIN  |  % arrêts global : 38%

┌──────────────────┬───────┬──────┬────────┬──────────┐
│ Système adverse  │ Tirs  │ Arr. │ % arr. │ Signal   │
├──────────────────┼───────┼──────┼────────┼──────────┤
│ Faire courir     │   8   │  4   │  50%   │  ✅ OK   │
│ Jeu Pivot        │  12   │  3   │  25%   │  🔴 ALERTE│
│ Isoler           │   5   │  2   │  40%   │  ➡ Moy.  │
└──────────────────┴───────┴──────┴────────┴──────────┘
```

Signal calculé : si % arrêts < (moyenne gardien saison - 15%) → Alerte ; si > (moy + 10%) → Bon.

**Bloc 2 — Heatmap compacte des zones de but (canvas existant à réorienter) :**

La heatmap de but 3×3 (déjà implémentée pour les joueurs) est réutilisée pour le gardien, mais filtrée sur les enclenchements adverses d'une famille choisie. L'utilisateur clique sur "Jeu Pivot" dans le tableau → la heatmap se met à jour pour montrer uniquement les tirs reçus en "Jeu Pivot".

**Pourquoi ce pattern :**
- Le tableau répond directement à la question "quel système met mon gardien en difficulté ?"
- La heatmap donne le "comment" (zone préférentielle de tir dans ce système)
- Le signal coloré (vert/rouge) évite la lecture mentale des chiffres
- Le filtre interactif famille → heatmap est un pattern "drill-down" léger, réalisable en vanilla JS

**Gestion des rotations :** si plusieurs gardiens ont joué, afficher un sélecteur de gardien en haut du bloc. Les données existantes (`COLS.gardien`) permettent ce filtre.

**Données nécessaires :**
- Filtrer `club !== 'FENIX'` (lignes adverses)
- Croiser `enclenchement → famille` × `finalite` (Tir arrêté / But)
- Identifier le gardien FENIX actif (`COLS.gardien` sur les lignes adverses)

---

### Synthèse des priorités de mise en oeuvre

| Besoin | Pattern UX recommandé | Complexité implémentation | Réutilisation code existant |
|--------|------------------------|---------------------------|-----------------------------|
| #1 Moment bascule | Courbe d'écart + section contextuelle enclenchements | Moyenne (enrichir drawTimeline + findMomentsCles) | `scoreHistory[]`, `findMomentsCles()`, canvas existant |
| #2 Famille enclenchements | 3 cards + tableau expandable | Faible-Moyenne (nouveau composant, parser à créer) | Composant `card()`, classe `avantage/desavantage` |
| #3 Force vs faiblesse | Badge inline dans les cards | Faible (logique décisionnelle simple) | `generateSeasonCorrelations()` pour la moy. saison |
| #4 Gardien par enclenchement | Tableau × famille + heatmap filtrable | Moyenne (canvas réorienter + filtre interactif) | Canvas existant impact zones, filtres existants |

**Ordre de développement recommandé :**
1. Créer le parser `enclenchement → famille` et le mapping (fondation de tout)
2. Besoin #2 (cards familles) — le plus visible, le plus rapide à construire
3. Besoin #3 (badges force/faiblesse) — s'ajoute aux cards du Besoin #2
4. Besoin #4 (gardien × famille) — bloc indépendant
5. Besoin #1 (moment bascule enrichi) — le plus complexe, enrichit la timeline existante

---

## Appendice — Sources consolidées

- [Handball.ai — official site](https://handball.ai/)
- [Handball.ai — scientific validation PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10422213/)
- [Sideline Sports / EHF partnership](https://sidelinesports.com/blog/ehf-euro-analysis-with-xps-video-analyzer-handball-ai/)
- [Best Handball Video Analysis Software 2026](https://wifitalents.com/best/handball-video-analysis-software/)
- [Advanced Metrics Handball App](https://advanced-metrics.com/)
- [SaveZone / PerformingStats](https://www.performingstats.de/)
- [Dartfish Handball](https://www.dartfish.com/handball/)
- [Hudl Sportscode](https://www.hudl.com/en_gb/products/sportscode)
- [Spiideo AutoData Handball](https://www.spiideo.com/autodata/autodata-handball/)
- [ORION SporTech handball KPIs](https://orion-sportech.com/handball-statistiques-indicateurs-performance-collective/)
- [iSquad analyse handball](https://www.isquad.info/fr/analyse-statistique-du-handball-pour-suivre-les-performances-des-equipes-et-des-joueurs/)
- [SGX Studio Sports Data UX](https://sgx.studio/sports-data-ux-design-making-complex-stats-digestible/)
- [LSports Sports Data Visualization](https://www.lsports.eu/blog/sports-data-visualization/)
- [Lollypop Design Sports Dashboard](https://lollypop.design/blog/2019/november/dashboard-design-in-the-sports-industry/)
- [UX Planet Designing Sports Analytics](https://uxplanet.org/designing-sports-analytics-fa686c10aae6)
- [PMC Coach Dashboard Co-Design](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9737713/)
- [Pencil & Paper Dashboard Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)
- [Tableau Football Dashboard Examples](https://www.quantizeanalytics.co.uk/tableau-football-dashboard-examples/)
- [PMC Comparative Analysis Winning/Losing Teams Handball](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7544740/)
- [PMC Tactical Variables Elite Handball](https://pmc.ncbi.nlm.nih.gov/articles/PMC9249053/)
- [INEFC Effectiveness Offensive Systems Handball](https://revista-apunts.com/en/effectiveness-of-offensive-systems-in-handball/)
- [MDPI Defensive Organizations LPS Handball](https://www.mdpi.com/1424-8220/22/15/5692)
- [ResearchGate Offensive/Defensive Play World Cycle](https://www.researchgate.net/publication/328720393_Offensive_and_Defensive_Play_in_Handball_in_a_2-Year_World_Championship_Cycle_Characteristics_and_Tendencies)
- [PMC Goalkeeper Performance World Championship 2015](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5819469/)
- [Medium Goalkeeper Season Analysis](https://medium.com/@fe.alvarezdiaz/detailed-analysis-of-a-handball-goalkeepers-performance-across-seasons-a7ba0ba9aabe)
- [AWS Bundesliga Match Momentum](https://aws.amazon.com/blogs/media/bundesliga-match-fact-match-momentum-revealing-the-games-invisible-pulse/)
- [Bundesliga Official Match Momentum](https://www.bundesliga.com/en/bundesliga/news/bundesliga-match-facts-aws-match-momentum-34052)
- [Opta Analyst What is Match Momentum](https://theanalyst.com/articles/what-is-match-momentum)
- [arXiv MLFEF Momentum Paper](https://arxiv.org/pdf/2402.12149)
- [Medium Points Momentum Chart](https://medium.com/@sumit.tripathi/analyse-sports-better-with-points-momentum-chart-25a158cb7f5c)
- [FiveThirtyEight NBA Win Probability](https://fivethirtyeight.com/features/every-nba-teams-chance-of-winning-in-every-minute-across-every-game/)
- [GameFlow Narrative Visualization NBA](https://www.researchgate.net/publication/309080509_GameFlow_Narrative_Visualization_of_NBA_Basketball_Games)
- [Sportmonks Team Form Analytics](https://www.sportmonks.com/glossary/team-form-analytics/)

# Audit complet de régression — 2026-09-01

**Agents :** Regression Guardian (cadrage + verdict) / E2E Tester (exécution)
**Environnement testé :** https://romainternel.github.io/fenix-suivi-cf/FENIX-HANDBALL-CF-SUIVI.html (production, GitHub Pages, v245 confirmée déployée)
**Donnée de test :** `ESSAI IA STAT.xlsm` (réimportée réellement pendant l'audit, C3)
**Outil :** MCP Playwright, navigateur réel

---

## 1. Périmètre testé

Toute la checklist Critique + Important (22 features), aucun périmètre restreint demandé. Secondaire non testé (hors périmètre par défaut).

### Critique (7)
C1 Authentification Staff · C2 Authentification Joueur · C3 Import Excel · C4 Dashboard staff · C5 Page Joueurs (terrain+fiche) · C6 Mode Lecture Joueur mobile · C7 Persistance des filtres cross-page

### Important (15)
I1 Page Analyse · I2 Page Notes (ATT/DEF + table GB) · I3 Graphique évolution joueur · I4 Stats Gardien (fiche) · I5 Page Impact · I6 Familles d'enclenchement (camembert) · I7 Comptes joueurs (panneau) · I8 Export PDF/PPT · I9 Menu Outils · I10 Onglets internes Analyse · I11 Panneau Vue joueur · I12 Migration locale → Supabase · I13 Note libre coach · I14 Éditeur de familles tactiques · I15 Éditeur de bilans

---

## 2. Résultat par feature

| # | Feature | Résultat | Preuve |
|---|---|---|---|
| C1 | Authentification Staff | ✅ | connexion "Partage" réussie |
| C2 | Authentification Joueur | ✅ | cycle complet compte test créé/connecté/supprimé |
| C3 | Import Excel | ✅ | `docs/regression/screenshots/audit-c4-dashboard.png`, 364 lignes, 0 erreur console |
| C4 | Dashboard staff | ✅ | `audit-c4-dashboard.png` — chiffres cohérents (27/48, 30/54, 56%) |
| C5 | Page Joueurs — terrain + fiche | ✅ | `audit-c5-joueur-fiche.png` — Antonin Vache 2/4, 50% |
| C6 | Mode Lecture Joueur mobile | ✅ | `audit-c6-mode-joueur.png`, `audit-c6-stats-match.png`, `audit-c6-zones.png` — 3 onglets à 375px |
| C7 | Persistance des filtres cross-page | ✅ | filtre match Analyse→Dashboard confirmé cohérent |
| I1 | Page Analyse | ⚠️❌ | Résumé/Timeline/Enclenchements ✅ ; **onglet Gardien cassé** (détail §3) |
| I2 | Page Notes (ATT/DEF + table GB) | ⚠️❌ | Table joueurs ✅ ; **table GB vide** (détail §3) |
| I3 | Graphique évolution joueur | ⚠️❌ | Joueur de champ ✅ (`audit-i3-graphique-joueur-champ.png`) ; **gardien cassé** (détail §3) |
| I4 | Stats Gardien (fiche) | ✅ | `audit-i4-gardien.png` — Gabin Saltel 6/16, 38% |
| I5 | Page Impact | ✅ | `audit-i5-impact.png` |
| I6 | Familles d'enclenchement (camembert) | ✅ | `audit-i6-enclenchements.png` — 8 familles, n=74, couv 84% |
| I7 | Comptes joueurs (panneau) | ✅ | création/suppression re-testées sur Antonin.V |
| I8 | Export PDF/PPT | ⚠️ NON VÉRIFIABLE | inchangé — `window.print()` bloque Playwright (connu depuis 2026-08-26), non retenté |
| I9 | Menu Outils | ✅ | `audit-i9-menu-outils.png` — 5 entrées |
| I10 | Onglets internes Analyse | ✅ | 5 onglets accessibles (`audit-i10-timeline.png`, `audit-i10-gardien-tab.png`) |
| I11 | Panneau Vue joueur (preview) | ✅ | `audit-i11-preview.png` |
| I12 | Migration locale → Supabase | ✅ | état "aucune donnée à migrer" correctement affiché |
| I13 | Note libre coach | ✅ | sauvegarde réussie, nettoyée après test |
| I14 | Éditeur de familles tactiques | ✅ | 17 correspondances, bandeau config. initiale présent |
| I15 | Éditeur de bilans | ✅ | 2 bilans réels affichés correctement |

**19/22 ✅ · 3/22 ⚠️❌ (régression, même cause racine) · 1/22 ⚠️ non vérifiable (connu, hors régression)**

---

## 3. Régression détectée — I1 / I2 / I3 (même cause racine)

### Résumé
Trois features distinctes de la checklist échouent silencieusement (aucune erreur console, aucun message d'erreur affiché) dès qu'elles concernent un **gardien** :
- **I1** : l'onglet "Gardien" de la page Analyse affiche "Aucune donnée gardien." alors que 3 gardiens (Gabin, Noah, Enzo) ont des données réelles sur le match sélectionné.
- **I2** : la table GB de la page Notes est vide.
- **I3** : le bouton "📈 Graphique" depuis la fiche d'un gardien ouvre une page blanche (canvas jamais initialisé, reste à sa taille par défaut 300×150px).

### Cause racine
La colonne `Gardien` de la feuille Excel `DATA` contient le **prénom seul** (`"Gabin"`, `"Noah"`, `"Enzo"` — confirmé en lisant `DATA` en production), alors que le reste de l'app utilise depuis le 2026-08-27 (changement de format de la feuille `Joueurs`) le format court `"Prénom.Initiale"` (`"Gabin.S"`, `GARDIENS_FENIX = ["Noah.O","Enzo.D","Gabin.S"]`).

La quasi-totalité du code gère déjà cette différence via `matchPlayerName()` (fonction de correspondance floue prénom/nom-court, déjà utilisée à une dizaine d'endroits dans `js/utils.js`, `js/player-mode.js`, `js/page-joueurs.js`, `js/page-analyse.js`). **Trois endroits ont été oubliés** lors de cette migration de format et comparent encore directement, sans passer par `matchPlayerName()` :

| Fichier | Ligne | Code fautif | Feature impactée |
|---|---|---|---|
| `js/page-analyse.js` | 2424 | `!GARDIENS_FENIX.includes(gardien)` | I1 (onglet Gardien) |
| `js/page-notes-graph.js` | 223 | `!GARDIENS_FENIX.includes(gardien)` | I2 (table GB) |
| `js/page-notes-graph.js` | 611 | `row[COLS.gardien] !== gardien` | I3 (graphique gardien) |

`"Gabin".includes` dans `GARDIENS_FENIX = ["Gabin.S", ...]` est toujours `false` (comparaison exacte, pas une sous-chaîne) ; `"Gabin" !== "Gabin.S"` est toujours `true` → dans les 3 cas, la condition de filtrage élimine systématiquement tous les gardiens, sans jamais lever d'erreur.

### Ce qui n'est PAS affecté
- **I4** (fiche gardien individuelle, page Joueurs) fonctionne correctement : elle utilise déjà `matchPlayerName()`.
- Le module "Bon gardien : 42% d'arrêts" affiché dans le résumé de match (onglet Résumé de I1) fonctionne également — logique de calcul différente, non affectée.
- Le graphique de progression pour un **joueur de champ** fonctionne parfaitement (`audit-i3-graphique-joueur-champ.png`).

### Ancienneté
Ce bug n'a pas été introduit par les stories de ce cycle (STORY-20 à STORY-26, migration Supabase) — aucun des 3 fichiers/lignes concernés n'a été touché par ce cycle. Il date très probablement du changement de format des noms de joueurs du 2026-08-27 (mémoire long-terme du projet), où la correction via `matchPlayerName()` n'a pas été appliquée de façon exhaustive. Il n'avait jamais été détecté car aucun audit précédent n'avait testé spécifiquement un gardien sur ces 3 parcours (l'audit du 2026-08-28 avait testé I3/I4 sans distinguer joueur de champ / gardien).

### Sévérité
**Important, pas Critique** : aucune perte de données, aucun crash, l'app reste utilisable — mais 3 fonctionnalités sont invisibles pour la catégorie "gardien" de l'effectif (3 joueurs sur ~21), sans aucun signal d'erreur qui alerterait Romain que quelque chose ne va pas.

### Correction proposée (non appliquée — hors mandat du Regression Guardian)
Remplacer les 3 comparaisons strictes par `matchPlayerName()`, à l'identique du pattern déjà utilisé partout ailleurs dans le même fichier pour ce même problème. Correctif à faible risque, cohérent avec l'existant, ne touche à aucune autre logique.

---

## 4. Verdict global

**RÉGRESSION DÉTECTÉE** — 3 features (I1 onglet Gardien, I2 table GB, I3 graphique gardien) silencieusement cassées pour tout gardien, même cause racine, préexistante à ce cycle. Aucune régression Critique. Le reste de l'application (19/22 features testées, dont les 7 Critiques) est conforme.

**Recommandation** : correctif ciblé (3 lignes, pattern déjà éprouvé) avant la prochaine session de suivi de match impliquant l'analyse d'un gardien.

---

## 5. Suivi — corrigé le jour même (v246)

Romain a validé la correction le jour même. Le correctif s'est révélé légèrement plus profond que prévu pour I2 (`calculateGardienNotes()` créait deux entrées séparées par gardien selon le format de nom, pas seulement un filtre à assouplir) — détail complet et vérification dans `docs/regression/v246.md`. Les 3 features sont désormais ✅ dans la checklist.

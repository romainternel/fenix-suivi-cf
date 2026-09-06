# Architecture — Articulation défensive (efficacité par poste occupé)

**Agent :** Architect
**Date :** 2026-09-02

---

## 1. Décision technique — pipeline de données

**Extension additive du pipeline existant**, aucune nouvelle structure. Vérifié dans le code réel avant de concevoir (pas supposé) :

- `XLSX.utils.sheet_to_json(sheet, { header: 1 })` (`FENIX-HANDBALL-CF-SUIVI.html:1419`) lit déjà la feuille `DATA` en tableaux positionnels génériques — aucune limite de nombre de colonnes codée en dur. Les 7 nouvelles colonnes sont lues automatiquement, sans changement.
- **Point réel à modifier** : `buildMatchDataRows()` (`js/supabase-client.js:268`) construit les lignes envoyées à Supabase par **nom d'en-tête normalisé**, via `DATA_HEADER_TO_COLUMN` (ligne 65) — toute colonne dont l'en-tête normalisé n'y figure pas est **silencieusement ignorée** (`if (!col) return;`, ligne 279). Sans ajout, les 7 nouvelles colonnes seraient importées puis perdues avant Supabase.

### Changements exacts

**`js/supabase-client.js`**
```js
// DATA_HEADER_TO_COLUMN — ajouter (en-tête Excel normalisé -> nom colonne Supabase)
articulationdef: 'articulation_def',
p1: 'p1', p2: 'p2', p3: 'p3', p4: 'p4', p5: 'p5', p6: 'p6',
```
```js
// MATCH_DATA_COLUMN_ORDER — ajouter à la fin, DANS CET ORDRE (doit correspondre exactement à COLS)
'articulation_def', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6',
```

**`FENIX-HANDBALL-CF-SUIVI.html`** — `const COLS = {...}` (ligne 1057)
```js
articulation_def: 22, p1: 23, p2: 24, p3: 25, p4: 26, p5: 27, p6: 28
```

**`supabase/schema.sql`** — ajouter au bloc `match_data` (ou script de migration séparé à exécuter une fois dans le SQL Editor, cf. §5) :
```sql
alter table match_data add column if not exists articulation_def text;
alter table match_data add column if not exists p1 text;
alter table match_data add column if not exists p2 text;
alter table match_data add column if not exists p3 text;
alter table match_data add column if not exists p4 text;
alter table match_data add column if not exists p5 text;
alter table match_data add column if not exists p6 text;
```
`add column if not exists` : additif, non destructif, rejouable sans risque si déjà appliqué.

### Pourquoi
- Suit exactement le pattern déjà utilisé pour `intention_attaque` (STORY-24bis / migration Enclenchement→Intention attaque) — même mécanique de bout en bout, donc risque minimal et code prévisible pour quiconque relit ce fichier plus tard.
- Aucune colonne `not null` : les lignes non taguées par Romain (la majorité, cf. capture) restent `null`, comportement déjà toléré partout ailleurs dans l'app pour des colonnes optionnelles.

## 2. Décision technique — agrégation et calcul

**Nouvelle fonction `computeArticulationStats(matchData)`** (`js/page-analyse.js`, à côté de `computeGbEncStats`), calquée sur son pattern exact (regroupement par sous-catégorie + calcul d'efficacité) :

- Filtre les lignes adverses (`club !== 'FENIX'`) qui sont une vraie fin de possession (`(row[COLS.possession]||'').toString().trim()`, même filtre que `computeEncStats`) **et** dont `COLS.articulation_def` est renseigné.
- Pour chaque ligne éligible : lit le dispositif (`0-6` ou `1-5`, extrait de la valeur `ARTICULATION DEF 0-6`/`ARTICULATION DEF 1-5`), et les 6 joueurs (`P1`...`P6`).
- Agrège à deux niveaux :
  1. **Par poste** : `Map<poste, Map<joueur, {tirs, buts, po, eff}>>` — pour afficher qui a occupé chaque poste et son efficacité adverse associée (poste isolé, un seul joueur à la fois dans cette vue).
  2. **Par combinaison de charnière centrale** : clé = `P2|P3|P4|P5` (jointure des 4 noms dans l'ordre positionnel — pas triée, l'ordre des postes est sémantique), valeur = `{tirs, buts, po, eff, possessions}` — pour le classement F4.
- Efficacité adverse : **même formule que partout ailleurs dans cette section** (`(buts + po) / possessions * 100`) — pas une nouvelle métrique, juste un nouvel axe de regroupement.

**Seuil de significativité (résout la question ouverte du PRD)** : réutilise le seuil déjà en dur dans `renderEncFamillesSection()` pour les badges FORCE/POINT FAIBLE (`sd.matchCount >= 3 && s.possessions >= 5`) — **minimum 5 séquences (tirs adverses)** pour qu'un poste ou une combinaison soit éligible à un badge ou à figurer dans le classement des meilleures charnières. Sous ce seuil : affiché grisé avec `(n<3)` (poste individuel, cohérent avec le tableau Gardien existant) ou simplement absent du classement (combinaison de charnière).

## 3. Décision technique — intégration UI

**Nouveau mode dans `renderEncFamillesSection()`**, pas une nouvelle fonction de rendu indépendante ni une nouvelle route/page :
- `window._encGraphMode` passe de `'pie' | 'matrice'` à `'pie' | 'matrice' | 'articulation'`.
- Nouveau bouton `.enc-pie-mode-btn` "🎯 Articulation" à côté des deux existants, avec classe `artic-disabled` (cf. Visual) quand `isAdv === false`.
- Nouvelle fonction `_drawArticulationCourt(container, matchData)` appelée quand `mode === 'articulation'`, symétrique à `_drawEncPie()`/`_drawEncRadar()` déjà présentes pour les deux autres modes.
- **Un seul point d'insertion** : parce que `renderEncFamillesSection()` est déjà appelée à la fois pour la vue match (dans l'onglet "Intention attaque") et pour la vue saison complète (rendu direct sur la page), le nouveau mode apparaît automatiquement dans les deux contextes sans code dupliqué — confirme la décision Design §0.

## 4. Impact sur l'existant

| Fichier | Changement |
|---|---|
| `js/supabase-client.js` | `DATA_HEADER_TO_COLUMN` +7 entrées, `MATCH_DATA_COLUMN_ORDER` +7 entrées (fin de liste) |
| `FENIX-HANDBALL-CF-SUIVI.html` | `COLS` +7 entrées (22-28) |
| `supabase/schema.sql` | +7 colonnes nullable sur `match_data` (migration additive à exécuter une fois) |
| `js/page-analyse.js` | Nouvelles fonctions `computeArticulationStats()`, `_drawArticulationCourt()`, `_rankCentralHinges()` ; `renderEncFamillesSection()` étendue (nouveau bouton mode, dispatch) |
| `css/style.css` | Nouvelles classes `.artic-*` (cf. Visual) |

**Aucun changement** sur le reste du pipeline (auth, autres pages, autres tables) — feature strictement additive et localisée à la section Intention attaque / Défense.

## 5. Procédure de migration (à communiquer à Romain, pas à automatiser)

Comme pour STORY-20, la migration SQL s'exécute manuellement dans la console Supabase (pas de CLI configurée en permanence, décision déjà actée au niveau projet) :
1. Romain exécute le bloc `alter table` ci-dessus une fois dans le SQL Editor Supabase, **avant** le premier réimport contenant les nouvelles colonnes.
2. Le prochain réimport Excel peuple alors normalement les 7 colonnes.
3. Aucune donnée existante n'est affectée (colonnes ajoutées vides sur les lignes déjà en base — de toute façon remplacées en intégralité au prochain import, cf. convention `replaceTable`).

## 6. Risques (aperçu — détail Risk Analyst)

- Si Romain réimporte **avant** d'avoir exécuté la migration SQL manuelle : Supabase rejettera l'insert (colonnes inconnues) — l'import échoue proprement (message d'erreur déjà géré par le `try/catch` autour de `replaceTable`, cf. `FENIX-HANDBALL-CF-SUIVI.html:1565`), aucune corruption possible, mais mauvaise surprise si non anticipé.
- Couverture de données très partielle en début de vie de la feature (tagging manuel progressif) — traité côté Design (état vide explicite) plutôt que traité comme un bug.

## 7. Critère de bascule

Si un jour cette donnée devait être éditable dans l'app (plutôt qu'exclusivement importée depuis Excel), il faudrait alors une vraie UI de saisie par séquence — hors de portée de l'architecture actuelle (Excel = seule source de vérité pour `match_data`) et non demandé ici.

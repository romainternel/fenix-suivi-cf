# Architecture — Articulation offensive (mode "Articulation" côté Attaque)

**Agent :** Architect
**Date :** 2026-09-15

---

## 0. Vérifications faites avant d'écrire ce document

- Lecture directe des deux fichiers Excel du repo (`IA STAT SAISON 26-27.xlsm`, `ESSAI IA STAT.xlsm`) : colonnes AD-AJ confirmées (`ARTICULATION ATT`, `ALG`, `ARG`, `DC`, `ARD`, `ALD`, `PVT`), sémantique du marqueur `+` confirmée (coïncide avec `Phase att = "+"`), taux de remplissage confirmé (120/227 lignes ATT PLAC sur la saison en cours).
- Lecture complète du code existant de l'articulation défensive (`js/page-analyse.js`, fonctions `computeArticulationStats`, `_articEffClass`, `_articTauxDefense`, `_articDefClass`, `_articArcY`, `ARTIC_LAYOUTS`, `_articCourtSvg`, `_articPrimaryEntry`, `ARTIC_BLOCKS`, `_articBlockEff`, `_articBlockDetail`, `ARTIC_FINALITE_GROUPS`, `computeArticCombos`, `_articRankedCombos`, `_drawArticulationCourt`, `_redrawArticCourt`, `_setArticDispositif`, `_setArticWidth`, `_setArticManualJoueur`, `_setArticManualCombo`) et de son point d'intégration (`renderEncFamillesSection`, `_setEncGraphMode`, `_setEncTeamMode`, lignes 1639-1720).
- Lecture complète du pipeline d'import réel : `FENIX-HANDBALL-CF-SUIVI.html` (`COLS`, `processFile()` → `buildMatchDataRows(jsonData)`) et `js/supabase-client.js` (`DATA_HEADER_TO_COLUMN`, `MATCH_DATA_COLUMN_ORDER`, `rowToPositionalArray`). **Important, découvert à cette lecture** : l'import Supabase est déjà piloté par **nom d'en-tête normalisé**, pas par index de colonne — ajouter les 7 nouvelles colonnes ne touche donc à aucune logique de lecture de fichier, seulement à 3 tables de correspondance (voir §2).

## 1. Nommage retenu (COLS + Supabase)

Pour éviter toute confusion avec les clés `p1`-`p6` (défense) et avec `ALG`/`ALD` déjà utilisés ailleurs dans le code pour un tout autre concept (vues photo de la page Impact, `IMPACT_VIEW_ALG`/`IMPACT_VIEW_ALD`), les nouvelles clés `COLS` et colonnes Supabase sont **explicitement préfixées** :

| Excel (en-tête réel) | Clé `COLS` | Colonne Supabase (`match_data`) |
|---|---|---|
| `ARTICULATION ATT` | `articulation_att` | `articulation_att` |
| `ALG` | `att_alg` | `att_alg` |
| `ARG` | `att_arg` | `att_arg` |
| `DC` | `att_dc` | `att_dc` |
| `ARD` | `att_ard` | `att_ard` |
| `ALD` | `att_ald` | `att_ald` |
| `PVT` | `att_pvt` | `att_pvt` |

## 2. Modifications de l'import (couche données) — 3 fichiers, aucun changement de logique de lecture

### 2.1 `supabase/schema.sql`
Ajouter 7 colonnes `text` à `match_data`, à la suite de `p6` :
```sql
  att_alg            text,
  att_arg            text,
  att_dc             text,
  att_ard            text,
  att_ald            text,
  att_pvt            text,
  articulation_att   text
```
(migration à exécuter manuellement dans le SQL Editor Supabase, comme pour STORY-33 — `alter table match_data add column ... text;` × 7, pas de recréation de table).

### 2.2 `js/supabase-client.js`
- `DATA_HEADER_TO_COLUMN` (ligne ~88-89) : ajouter après `articulationdef: 'articulation_def'` :
  ```js
  articulationatt: 'articulation_att',
  alg: 'att_alg', arg: 'att_arg', dc: 'att_dc', ard: 'att_ard', ald: 'att_ald', pvt: 'att_pvt',
  ```
  (`_normaliseHeader('ARTICULATION ATT')` → `'articulationatt'`, `_normaliseHeader('ALG')` → `'alg'`, etc. — vérifié par relecture de `_normaliseHeader`, aucune collision avec une clé normalisée existante).
- `MATCH_DATA_COLUMN_ORDER` (ligne ~98-105) : ajouter à la fin, **dans le même ordre que les nouvelles clés `COLS`** (§3) :
  ```js
  'articulation_att', 'att_alg', 'att_arg', 'att_dc', 'att_ard', 'att_ald', 'att_pvt',
  ```

### 2.3 `FENIX-HANDBALL-CF-SUIVI.html` — `COLS`
Ajouter à la suite de `p6: 28` :
```js
articulation_att: 29, att_alg: 30, att_arg: 31, att_dc: 32, att_ard: 33, att_ald: 34, att_pvt: 35
```
Aucune autre modification du pipeline d'import n'est nécessaire — `processFile()`/`buildMatchDataRows()` sont déjà génériques par nom de colonne (cf. §0).

### 2.4 Résilience (critère PRD §2.1)
Un fichier Excel sans ces colonnes : `idxToColumn` (dans `buildMatchDataRows`) associera `null` pour les en-têtes absents, les colonnes correspondantes ne seront simplement jamais peuplées dans `obj` → valeurs `undefined` en base pour ces colonnes, comportement déjà éprouvé pour `articulation_def`/`p1`-`p6` sur d'anciens exports (STORY-33 §résilience). Aucun code défensif supplémentaire à écrire.

## 3. Couche calcul (`js/page-analyse.js`) — nouvelles fonctions, aucune modification des fonctions défense existantes

### 3.1 Constantes

```js
const ARTIC_ATT_POSTES = ['att_alg', 'att_arg', 'att_dc', 'att_ard', 'att_ald', 'att_pvt'];

// Arc des 9m — même terrain que _articCourtSvg(), tracé pointillé existant
// (path "M 0,25 A 52,44 0 0,0 100,25"). Centre déduit géométriquement de ce path
// (rétro-calculé comme ARTIC_6M_ARC l'a été pour le 6m) : à x=0 et x=100, y=25 connu ;
// avec rx=52, cx=50 imposé par la symétrie du path, cy résolu par l'équation d'ellipse.
const ARTIC_ATT_9M_ARC = { cx: 50, cy: 12.92, rx: 52, ry: 44 };

// Disposition des 6 postes offensifs — PVT/ALG/ALD sur la courbe des 6m (même arc et même
// _articArcY que la défense, ARTIC_6M_ARC), ARG/DC/ARD sur l'arc des 9m ci-dessus. Written
// as a function of the two arcs so qu'un futur ajustement du tracé SVG (les deux <path> de
// _articCourtSvg) se répercute automatiquement ici, comme pour ARTIC_LAYOUTS (défense).
const ARTIC_ATT_LAYOUT = (() => {
    const sixM = { att_alg: 12, att_pvt: 50, att_ald: 88 };
    const neufM = { att_arg: 25, att_dc: 50, att_ard: 75 };
    const out = {};
    Object.keys(sixM).forEach(k => { out[k] = [sixM[k], _articArcY(sixM[k], ARTIC_6M_ARC)]; });
    Object.keys(neufM).forEach(k => { out[k] = [neufM[k], _articArcY(neufM[k], ARTIC_ATT_9M_ARC)]; });
    return out;
})();

// 2 groupements demandés (Brief/PRD) — même structure que ARTIC_BLOCKS pour rester
// extensible (ajouter un 3e groupement plus tard = une ligne).
const ARTIC_ATT_BLOCKS = [
    { key: 'total', label: '6 complet', postes: ARTIC_ATT_POSTES },
    { key: 'base_arriere', label: 'Base arrière', postes: ['att_arg', 'att_dc', 'att_ard'] },
];
```

### 3.2 Agrégation — `computeArticulationAttStats(matchData)`

Miroir de `computeArticulationStats`, différences délibérées :
- Filtre `r[COLS.club] === 'FENIX'` (propre attaque, pas l'adversaire).
- Lit `r[COLS.articulation_att]` (au lieu de `articulation_def`) ; **pas de distinction de dispositif** — toute valeur non vide (`"ARTICULATION ATT"` ou `"ARTICULATION ATT +"`) est acceptée telle quelle, sans split/comparaison (cf. Brief : les deux sont regroupés pour cette v1).
- Lit `r[COLS.resultat]` (pas `finalite` — c'est la ligne FENIX elle-même, pas une ligne adverse ; `resultat`/`finalite` sont identiques sur les lignes FENIX, cf. CLAUDE.md §5, mais `resultat` est la convention déjà utilisée partout ailleurs pour les stats FENIX).
- Compte `But` et `Tir raté` séparément (pas de fusion but+PO) — nécessaire pour la formule d'efficacité standard (§3.4).
- **Filtre `COLS.possession`** repris à l'identique de la défense (une ligne comptée par séquence, le tag étant répété sur toutes les lignes d'une même séquence). **Point de vigilance explicite, documenté ici et dans le Risk doc** : au moins une ligne "2' obt" observée dans les données réelles ne porte pas la marque `Possession` alors qu'elle porte bien `articulation_att` — à vérifier empiriquement par le Developer (comparaison du total obtenu avec et sans ce filtre sur un vrai match) avant de considérer le filtre définitivement correct ; même classe de problème que le bug "Jet franc" de STORY-44 (colonne `possession` absente sur certains types de lignes sans que ce soit une anomalie de saisie).

```js
function computeArticulationAttStats(matchData) {
    const postes = new Map(); // pKey -> Map(joueur -> {buts, tirs, possessions, eff})
    let total = 0;
    const global = { buts: 0, tirs: 0, possessions: 0, eff: 0 };
    matchData.filter(r => r[COLS.club] === 'FENIX').forEach(r => {
        if (!(r[COLS.possession] || '').toString().trim()) return;
        if (!(r[COLS.articulation_att] || '').toString().trim()) return;
        const res = (r[COLS.resultat] || '').toString().trim();
        const isBut = res === 'But', isTir = res === 'Tir raté';
        total++;
        global.possessions++;
        if (isBut) global.buts++; else if (isTir) global.tirs++;
        ARTIC_ATT_POSTES.forEach(pKey => {
            const joueur = _resolveArticJoueur(r[COLS[pKey]]);
            if (!joueur) return;
            if (!postes.has(pKey)) postes.set(pKey, new Map());
            const joueurMap = postes.get(pKey);
            if (!joueurMap.has(joueur)) joueurMap.set(joueur, { buts: 0, tirs: 0, possessions: 0, eff: 0 });
            const s = joueurMap.get(joueur);
            s.possessions++;
            if (isBut) s.buts++; else if (isTir) s.tirs++;
        });
    });
    postes.forEach(joueurMap => joueurMap.forEach(s => {
        const denom = s.buts + s.tirs;
        s.eff = denom > 0 ? Math.round(s.buts / denom * 100) : 0;
    }));
    const gDenom = global.buts + global.tirs;
    global.eff = gDenom > 0 ? Math.round(global.buts / gDenom * 100) : 0;
    return { postes, total, global };
}
```

Note : `_resolveArticJoueur` est **réutilisée telle quelle** (déjà générique, ne dépend pas du dispositif défense).

### 3.3 `_articPrimaryEntry` — réutilisée telle quelle

Déjà générique (prend `pKey`/`joueurMap` + lit `window._articManualPoste`). Pour l'attaque, elle sera appelée avec **une map d'état séparée** (`window._articAttManualPoste`, §4) — la fonction elle-même n'a pas besoin d'être dupliquée si on lui passe la bonne map en paramètre. **Décision technique** : plutôt que de la modifier pour accepter un paramètre supplémentaire (risque de régression sur le seul appelant existant), écrire une petite fonction jumelle `_articAttPrimaryEntry(pKey, joueurMap)` identique mais lisant `window._articAttManualPoste` — 6 lignes dupliquées, plus sûr qu'une modification de signature d'une fonction déjà utilisée en production.

### 3.4 Efficacité — **formule standard, pas d'inversion**

```js
// Contrairement à _articTauxDefense (inversion nécessaire côté défense, cf. STORY-37), l'efficacité
// offensive se lit directement : plus haut = attaque plus efficace, aucun miroir de sens à faire.
// Seuils repris de _articEffClass (38/55) mais appliqués dans le sens direct (Visual Crafter §3).
function _articAttEffClass(eff, possessions) {
    if (possessions < 5) return 'noref';
    if (eff >= 55) return 'fort';
    if (eff >= 38) return 'moyen';
    return 'faible';
}
```

### 3.5 `_articAttBlockEff` / `_articAttBlockDetail` — miroir de `_articBlockEff`/`_articBlockDetail`

Mêmes signatures `(matchData, lineup, blockPostes)` (pas de paramètre `dispositif`, il n'existe pas côté attaque), même logique de filtrage par lignes exactement occupées par `lineup` sur `blockPostes`, mêmes groupes `ARTIC_FINALITE_GROUPS` réutilisés tels quels pour le détail (But/Tir raté/PB/PO/Jet franc — la table de correspondance ne dépend pas du sens attaque/défense). Le calcul d'efficacité de bloc :

```js
function _articAttBlockEff(matchData, lineup, blockPostes) {
    if (blockPostes.some(pk => !lineup[pk])) return { possessions: 0, buts: 0, tirs: 0, eff: 0, incomplete: true };
    let buts = 0, tirs = 0, possessions = 0;
    matchData.filter(r => r[COLS.club] === 'FENIX').forEach(r => {
        if (!(r[COLS.possession] || '').toString().trim()) return;
        if (!(r[COLS.articulation_att] || '').toString().trim()) return;
        if (!blockPostes.every(pk => _resolveArticJoueur(r[COLS[pk]]) === lineup[pk])) return;
        possessions++;
        const res = (r[COLS.resultat] || '').toString().trim();
        if (res === 'But') buts++; else if (res === 'Tir raté') tirs++;
    });
    const denom = buts + tirs;
    return { possessions, buts, tirs, eff: denom > 0 ? Math.round(buts / denom * 100) : 0, incomplete: false };
}
```

`_articAttBlockDetail` : identique à `_articBlockDetail` mais avec les mêmes filtres club/possession/articulation_att que ci-dessus (au lieu de `club !== FENIX` + `articulation_def`).

### 3.6 Classement — `computeArticAttCombos` / `_articRankedAttCombos`

Miroir exact de `computeArticCombos`/`_articRankedCombos`, mêmes seuils Fiable (≥5)/Faible (<5), tri décroissant sur `eff` (pas `tauxDef`) :

```js
function computeArticAttCombos(matchData, blockPostes) {
    const combos = new Map();
    matchData.filter(r => r[COLS.club] === 'FENIX').forEach(r => {
        if (!(r[COLS.possession] || '').toString().trim()) return;
        if (!(r[COLS.articulation_att] || '').toString().trim()) return;
        const joueurs = blockPostes.map(pk => _resolveArticJoueur(r[COLS[pk]]));
        if (joueurs.some(j => !j)) return;
        const key = joueurs.join(' / ');
        if (!combos.has(key)) combos.set(key, { buts: 0, tirs: 0, possessions: 0 });
        const s = combos.get(key);
        s.possessions++;
        const res = (r[COLS.resultat] || '').toString().trim();
        if (res === 'But') s.buts++; else if (res === 'Tir raté') s.tirs++;
    });
    return combos;
}

function _articRankedAttCombos(matchData, blockPostes) {
    const combos = computeArticAttCombos(matchData, blockPostes);
    const entries = [...combos.entries()].map(([combo, s]) => {
        const denom = s.buts + s.tirs;
        return { combo, ...s, eff: denom > 0 ? Math.round(s.buts / denom * 100) : 0 };
    });
    const fiables = entries.filter(e => e.possessions >= 5).sort((a, b) => b.eff - a.eff);
    const faibles = entries.filter(e => e.possessions < 5).sort((a, b) => b.eff - a.eff);
    return { fiables, faibles };
}
```

### 3.7 Rendu — `_drawArticulationAttCourt(container, matchData)`

Miroir de `_drawArticulationCourt`, **sans le bloc "DISPOSITIF"** (pas de bascule géométrique) — la barre de contrôle ne contient que la ligne "LARGEUR" (`ARTIC_ATT_BLOCKS`). Réutilise `_articCourtSvg()` **telle quelle** (même fond de terrain), `ARTIC_ATT_LAYOUT` pour le placement des 6 ronds, `window._articAttManualPoste`/`window._articAttOpenPoste`/`window._articAttWidth` comme état (§4), `_articAttPrimaryEntry`, `_articAttBlockEff`, `_articAttBlockDetail`, `_articRankedAttCombos`, `_articAttEffClass`. Le libellé du résumé est **"de réussite offensive"** (Design §6), pas "de réussite défensive". Structure HTML identique (mêmes classes `.artic-*`) pour hériter du CSS existant sans rien ajouter à `style.css`.

Cas vide identique : `if (!stats.total) { container.innerHTML = '<p class="artic-empty">Pas encore de données d'articulation offensive sur cette période.</p>'; return; }`.

### 3.8 Handlers d'état

```js
function _redrawArticAttCourt() {
    if (window._encCurrentMatchData) _drawArticulationAttCourt(document.getElementById('enc-articulation-wrap'), window._encCurrentMatchData);
}
function _setArticAttWidth(widthKey) { window._articAttWidth = widthKey; _redrawArticAttCourt(); }
function _setArticAttManualJoueur(pKey, joueurNom) {
    if (!window._articAttManualPoste) window._articAttManualPoste = {};
    if (joueurNom) window._articAttManualPoste[pKey] = joueurNom; else delete window._articAttManualPoste[pKey];
    window._articAttOpenPoste = null;
    _redrawArticAttCourt();
}
function _setArticAttManualCombo(postesCsv, joueursCsv) {
    const postes = postesCsv.split(','), joueurs = joueursCsv.split(',');
    if (!window._articAttManualPoste) window._articAttManualPoste = {};
    postes.forEach((pk, i) => { window._articAttManualPoste[pk] = joueurs[i]; });
    window._articAttOpenPoste = null;
    _redrawArticAttCourt();
}
function _toggleArticAttPosteEditor(pKey) {
    window._articAttOpenPoste = (window._articAttOpenPoste === pKey) ? null : pKey;
    _redrawArticAttCourt();
}
```
(`_toggleArticPosteEditor` défense reste inchangée — même besoin d'une jumelle plutôt qu'un paramètre ajouté, cf. §3.3.)

## 4. État global — variables parallèles, jamais partagées avec la défense

```
window._articAttWidth       // 'total' | 'base_arriere' — équivalent window._articWidth
window._articAttManualPoste // { att_alg: 'Nom', ... } — équivalent window._articManualPoste
window._articAttOpenPoste   // pKey ouvert ou null — équivalent window._articOpenPoste
```
Aucun `window._articAttDispositif` — n'existe pas côté attaque. Ces variables ne sont **jamais lues ni écrites** par le code défense existant — bascule Attaque ↔ Défense en mode Articulation = changer uniquement quelle fonction de dessin est appelée (§5), chaque côté garde son propre état intact (répond au critère d'acceptation PRD §4.8).

## 5. Points d'intégration — 3 modifications ciblées, aucune réécriture

Toutes les trois dans `renderEncFamillesSection`/`_setEncGraphMode`/`_setEncTeamMode` (`js/page-analyse.js`, lignes identifiées lors de la lecture initiale) :

1. **Ligne ~1655** — bouton "🎯 Articulation" : retirer la condition `!isAdv` du `class` (`artic-disabled`) et du `title` ("Disponible uniquement en mode Défense"). Le bouton devient `<button class="enc-pie-mode-btn${mode==='articulation'?' active':''}" onclick="_setEncGraphMode('articulation')" title="Voir la composition ${isAdv?'défensive':'offensive'} par poste">🎯 Articulation</button>`.
2. **Ligne ~1689** (`_setEncTeamMode`) — supprimer les 2 lignes `if (mode === 'fenix' && window._encGraphMode === 'articulation') window._encGraphMode = 'pie';` (et son commentaire devenu faux) : le mode Articulation reste actif quel que soit le côté choisi.
3. **Ligne ~1716** (`_setEncGraphMode`, bloc `if (mode === 'articulation')`) — dispatcher selon le côté actif :
   ```js
   if (mode === 'articulation') {
       if (articWrap && window._encCurrentMatchData) {
           if (window._encTeamMode === 'adv') _drawArticulationCourt(articWrap, window._encCurrentMatchData);
           else _drawArticulationAttCourt(articWrap, window._encCurrentMatchData);
       }
   }
   ```
   (`window._encTeamMode === 'adv'` est déjà la source de vérité utilisée par `_setEncTeamMode`/`renderEncFamillesSection` — pas de nouvelle variable à introduire pour ce test.)

Aucune autre fonction existante n'est modifiée. Aucune nouvelle route, aucun nouvel onglet, aucun nouveau conteneur DOM (`#enc-articulation-wrap` déjà partagé, vidé/repeuplé par `innerHTML` comme aujourd'hui pour la défense).

## 6. CSS

Aucune nouvelle classe (Visual Crafter §4). Zéro modification de `css/style.css`.

## 7. Résumé des fichiers touchés

| Fichier | Nature du changement |
|---|---|
| `supabase/schema.sql` | +7 colonnes documentées (migration manuelle à exécuter par Romain en SQL Editor) |
| `js/supabase-client.js` | +7 entrées `DATA_HEADER_TO_COLUMN`, +7 entrées `MATCH_DATA_COLUMN_ORDER` |
| `FENIX-HANDBALL-CF-SUIVI.html` | +7 entrées `COLS` |
| `js/page-analyse.js` | +constantes (§3.1), +8 nouvelles fonctions (§3.2-3.8), 3 modifications ciblées (§5) |
| `css/style.css` | Aucun changement |

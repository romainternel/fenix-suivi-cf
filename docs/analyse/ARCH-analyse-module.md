# ARCH — Module Analyse FENIX Handball

**Agent :** Architect (pipeline BMAD)
**Date :** 2026-06-17
**Version :** 1.0
**Inputs :** PRD-analyse-module.md · DESIGN-analyse-module.md · js/page-analyse.js · utils.js · FENIX-HANDBALL-CF-SUIVI.html
**Destinataires :** Dev

---

## 0. Rappel du contexte technique

- **App vanilla JS** — aucun framework, aucun bundler, aucun module ES6 import/export
- **Données** : tableau global `DATA[]`, index fixes via `COLS` object (ligne 1044 du HTML)
- **Fichier cible principal** : `js/page-analyse.js` (~750 lignes actuelles)
- **CSS cible** : `css/style.css` — bloc à ajouter en fin de fichier
- **Contrainte d'intégration** : toutes les nouvelles fonctions sont appelées depuis `updateAnalysePage()` et `generateSeasonCorrelations()` existantes

### COLS de référence (extrait confirmé ligne 1044–1050 HTML)

```javascript
const COLS = {
    position: 0, rencontre: 1, club: 2, phase_att: 3, ge: 4, defense_attaquee: 5,
    resultat: 6, joueur: 7, finalite: 8, enclenchement: 9, gardien: 10,
    position_tir: 11, field_position: 12, periode: 13, possession: 14,
    position_terrain: 15, action_joueur: 16, action_att: 17, action_def: 18, impact: 19,
    saison: 20
};
```

**Colonnes utilisées par le module Analyse :**

| COLS key | Index | Feature(s) |
|---|---|---|
| `enclenchement` | 9 | F-00, F-01, F-02, F-03, F-04, F-05 |
| `finalite` | 8 | F-01, F-04 |
| `club` | 2 | Toutes (filtre FENIX vs ADV) |
| `resultat` | 6 | F-01 (But / Tir raté / PB) |
| `gardien` | 10 | F-04 |
| `field_position` | 12 | F-04 (heatmap filtrée) |
| `rencontre` | 1 | F-05 (agrégation par match) |
| `periode` | 13 | F-03 (MT1/MT2) |
| `position` | 0 | F-03 (axe temporel) |

**Note sur `finalite` vs `resultat` :** Dans `generateSeasonCorrelations()` existant (ligne 674), `finalite` est utilisé avec la valeur `"Tir arrêté"` pour les arrêts gardien. Dans `generateResume3Points()` (ligne 65), `resultat` est utilisé avec `"Tir raté"` pour les tirs ratés FENIX. Ces deux colonnes semblent coexister avec des valeurs différentes. Les fonctions F-01 et F-04 devront utiliser les deux selon le contexte : `resultat` pour les lignes FENIX, `finalite` pour les tirs adverses.

---

## 1. Nouvelles variables globales

À ajouter **en tête** de `js/page-analyse.js`, après la ligne 3 (`let chatHistory = [];`) :

```javascript
// ===== MODULE ANALYSE — Variables globales =====

/**
 * Mapping clé enclenchement → famille tactique.
 * La clé est la partie 0 du split(';') de la colonne enclenchement.
 * OBLIGATOIRE : valider avec le coach avant la première utilisation.
 * Clés marquées "// ?" = hypothèses à confirmer.
 */
const ENC_FAMILLE_MAP = {};  // Voir section 7 pour la proposition initiale

/**
 * Cache des stats famille par match — évite les recalculs si
 * updateAnalysePage() est rappelée sans changement de match.
 * Structure : { matchName: { fenix: Map, adv: Map } }
 * Type : Object (null reset à chaque changement de match)
 */
let _encStatsCache = null;

/**
 * Nom de match actuellement en cache — permet d'invalider _encStatsCache.
 * Type : string | null
 */
let _encStatsCacheMatch = null;

/**
 * Index de la famille sélectionnée dans le tableau F-04 (heatmap filtrée).
 * null = aucun filtre actif (tous les tirs adverses affichés).
 * Type : string | null   (valeur = nom famille, ex: 'Jeu Pivot')
 */
let _gardienFamilleFilter = null;

/**
 * Gardien actuellement sélectionné dans le sélecteur F-04.
 * null = pas encore initialisé (auto-détecté au premier rendu).
 * Type : string | null
 */
let _gardienSelected = null;

/**
 * Résultat de la dernière détection bascule — évite de recalculer
 * l'overlay canvas à chaque resize si les données n'ont pas changé.
 * Type : { index: number, avant: number, apres: number } | null
 */
let _lastBasculeResult = null;

/**
 * Stats saison par famille — calculées une fois par session (toute la DATA).
 * Invalidé uniquement si DATA change (rechargement fichier).
 * Structure : Map<famille, { effMoy: number, cv: number, matchCount: number }>
 * Type : Map | null
 */
let _encStatsSaison = null;
```

---

## 2. Nouvelles fonctions — signatures et algorithmes

### 2.0 Fonctions utilitaires (pré-requis à tout le reste)

---

#### `getEncFamille(encStr)`

```javascript
/**
 * Retourne la famille tactique d'un enclenchement.
 * @param {string|null|undefined} encStr - Valeur brute de COLS.enclenchement
 * @returns {'Faire courir'|'Jeu Pivot'|'Isoler'|'Autre'} - Jamais null, jamais d'exception
 */
function getEncFamille(encStr) {
    if (!encStr || typeof encStr !== 'string') return 'Autre';
    const cle = encStr.split(';')[0].trim();
    if (!cle) return 'Autre';
    return ENC_FAMILLE_MAP[cle] ?? 'Autre';
}
```

**Complexité :** O(1) — lookup objet pur.

**Cas limites testés :**
- `getEncFamille("8;0;Bloc 4")` → famille de la clé `"8"` (selon ENC_FAMILLE_MAP)
- `getEncFamille("")` → `"Autre"`
- `getEncFamille(null)` → `"Autre"`
- `getEncFamille(undefined)` → `"Autre"`
- `getEncFamille(";sous-partie")` → `"Autre"` (clé vide après split)

---

#### `logEncFamillesInconnues(rows)`

```javascript
/**
 * Détecte les clés d'enclenchement non présentes dans ENC_FAMILLE_MAP.
 * Loggue en console.warn et retourne le Set des clés inconnues.
 * À appeler depuis updateAnalysePage() après filtrage matchData.
 * @param {Array} rows - Lignes DATA du match (ou DATA complet)
 * @returns {Set<string>} - Clés inconnues
 */
function logEncFamillesInconnues(rows) {
    const inconnues = new Set();
    rows.forEach(r => {
        const enc = (r[COLS.enclenchement] || '').toString();
        const cle = enc.split(';')[0].trim();
        if (cle && !ENC_FAMILLE_MAP[cle]) inconnues.add(cle);
    });
    if (inconnues.size > 0) {
        console.warn('[FENIX Analyse] Clés enclenchement non classifiées :', [...inconnues]);
    }
    return inconnues;
}
```

**Complexité :** O(n) sur les lignes.

---

#### `computeEncCoverage(rows)`

```javascript
/**
 * Calcule le taux de couverture du mapping (lignes classifiées hors 'Autre').
 * @param {Array} rows - Lignes avec un enclenchement non vide
 * @returns {{ total: number, classifiees: number, pct: number }}
 */
function computeEncCoverage(rows) {
    const avecEnc = rows.filter(r => (r[COLS.enclenchement] || '').toString().trim());
    const classifiees = avecEnc.filter(r => getEncFamille(r[COLS.enclenchement]) !== 'Autre');
    const total = avecEnc.length;
    return {
        total,
        classifiees: classifiees.length,
        pct: total > 0 ? Math.round(classifiees.length / total * 100) : 100
    };
}
```

---

### 2.1 F-00/01/02 — Calcul des stats famille

---

#### `computeEncStats(matchData, isAdv)`

```javascript
/**
 * Calcule les statistiques par famille d'enclenchement pour un match donné.
 * @param {Array} matchData - Lignes filtrées sur le match (DATA.filter(rencontre))
 * @param {boolean} isAdv - true = lignes adversaires (club !== 'FENIX'), false = FENIX
 * @returns {Map<string, {tirs: number, buts: number, pb: number, eff: number, possessions: number}>}
 *   Clés : 'Faire courir', 'Jeu Pivot', 'Isoler', 'Autre'
 *   eff = buts / (tirs + pb) * 100, arrondi entier (0 si dénominateur nul)
 */
function computeEncStats(matchData, isAdv) {
    // 1. Filtrer selon le camp
    const rows = matchData.filter(r =>
        isAdv ? r[COLS.club] !== 'FENIX' : r[COLS.club] === 'FENIX'
    );

    // 2. Initialiser la Map avec les 4 familles (y compris 'Autre')
    const FAMILLES = ['Faire courir', 'Jeu Pivot', 'Isoler', 'Autre'];
    const stats = new Map();
    FAMILLES.forEach(f => stats.set(f, { tirs: 0, buts: 0, pb: 0, eff: 0, possessions: 0 }));

    // 3. Agréger
    rows.forEach(r => {
        const famille = getEncFamille(r[COLS.enclenchement]);
        const s = stats.get(famille);

        // Tirs = lignes avec finalite non vide OU resultat === 'But' | 'Tir raté'
        // Règle : on utilise resultat pour FENIX, finalite pour ADV
        // (cf. analyse du code existant, section 0)
        const estBut = isAdv
            ? r[COLS.finalite] === 'But'
            : r[COLS.resultat] === 'But';
        const estTirRate = isAdv
            ? r[COLS.finalite] === 'Tir arrêté' || r[COLS.finalite] === 'Tir raté'
            : r[COLS.resultat] === 'Tir raté';
        const estPB = r[COLS.resultat] === 'PB';

        // Compter les possessions (toute ligne avec enclenchement renseigné)
        if ((r[COLS.enclenchement] || '').toString().trim()) {
            s.possessions++;
        }

        if (estBut) { s.buts++; s.tirs++; }
        else if (estTirRate) { s.tirs++; }
        else if (estPB) { s.pb++; }
    });

    // 4. Calculer efficacité possession = buts / (tirs + pb)
    stats.forEach(s => {
        const denom = s.tirs + s.pb;
        s.eff = denom > 0 ? Math.round(s.buts / denom * 100) : 0;
    });

    return stats;
}
```

**Complexité :** O(n) sur les lignes du match.

**Important — définition PB :** Le PRD section 5 signale que la définition exacte d'une perte de balle (index 16-18 ou colonne `resultat`) doit être confirmée avec l'Analyst. L'implémentation ci-dessus utilise `resultat === 'PB'` (cohérent avec `generateResume3Points()` ligne 69 existant). **À valider avant le premier commit F-01.**

---

#### `computeEncStatsSaison(isAdv)`

```javascript
/**
 * Calcule les stats famille sur toute la saison (DATA complet).
 * Résultat mis en cache dans _encStatsSaison (invalidé si DATA change).
 * @param {boolean} isAdv - true = lignes adversaires, false = FENIX
 * @returns {Map<string, {effMoy: number, cv: number, matchCount: number, effParMatch: number[]}>}
 *   effMoy = moyenne des eff% par match (pas eff globale saison)
 *   cv = coefficient de variation (écart-type / moyenne) — indicateur de consistance
 *   matchCount = nombre de matchs avec >= 1 possession dans cette famille
 */
function computeEncStatsSaison(isAdv) {
    // Utiliser le cache si disponible
    const cacheKey = isAdv ? 'adv' : 'fenix';
    if (_encStatsSaison && _encStatsSaison.has(cacheKey)) {
        return _encStatsSaison.get(cacheKey);
    }

    if (!_encStatsSaison) _encStatsSaison = new Map();

    if (typeof MATCHS === 'undefined' || !MATCHS || MATCHS.length === 0) {
        const empty = new Map();
        _encStatsSaison.set(cacheKey, empty);
        return empty;
    }

    // 1. Collecter l'eff% par famille par match
    const FAMILLES = ['Faire courir', 'Jeu Pivot', 'Isoler', 'Autre'];
    const byFamille = new Map();
    FAMILLES.forEach(f => byFamille.set(f, { effParMatch: [], matchCount: 0 }));

    MATCHS.forEach(matchName => {
        const matchData = DATA.filter(r => r[COLS.rencontre] === matchName);
        if (matchData.length === 0) return;

        const matchStats = computeEncStats(matchData, isAdv);

        matchStats.forEach((s, famille) => {
            const entry = byFamille.get(famille);
            // N'inclure le match que si la famille a été utilisée (>= 1 possession)
            if (s.possessions >= 1) {
                entry.effParMatch.push(s.eff);
                entry.matchCount++;
            }
        });
    });

    // 2. Calculer effMoy et cv pour chaque famille
    const result = new Map();
    byFamille.forEach((entry, famille) => {
        const arr = entry.effParMatch;
        const n = arr.length;
        if (n === 0) {
            result.set(famille, { effMoy: 0, cv: 0, matchCount: 0, effParMatch: [] });
            return;
        }
        const mean = arr.reduce((s, v) => s + v, 0) / n;
        // Ecart-type population (pas échantillon — données complètes de la saison)
        const variance = arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
        const std = Math.sqrt(variance);
        const cv = mean > 0 ? std / mean : 0;
        result.set(famille, {
            effMoy: Math.round(mean),
            cv: Math.round(cv * 100) / 100,  // 2 décimales
            matchCount: n,
            effParMatch: arr
        });
    });

    _encStatsSaison.set(cacheKey, result);
    return result;
}
```

**Complexité :** O(M × n) avec M = nombre de matchs, n = lignes moyennes par match. Mis en cache après le premier appel.

**Fonctions réutilisées :** `computeEncStats()`.

---

### 2.2 F-01/02 — Rendu des cards familles

---

#### `renderEncFamillesSection(matchData)`

```javascript
/**
 * Génère et injecte la section HTML des 3 cards famille (F-01) + badges (F-02).
 * Insère le HTML dans #enc-familles-section (élément à créer dans le HTML).
 * @param {Array} matchData - Lignes du match sélectionné
 * @returns {void}
 */
function renderEncFamillesSection(matchData) {
    const container = document.getElementById('enc-familles-section');
    if (!container) return;

    // 1. Calcul stats match FENIX
    const statsMatch = computeEncStats(matchData, false);

    // 2. Calcul stats saison (pour badges et barre de progression)
    const statsSaison = computeEncStatsSaison(false);

    // 3. Détection couverture (avertissement si < 80%)
    const coverage = computeEncCoverage(matchData.filter(r => r[COLS.club] === 'FENIX'));
    const warningHtml = coverage.pct < 80 && coverage.total > 0
        ? `<div class="enc-coverage-warning">
             <span>⚠</span>
             ${100 - coverage.pct}% des enclenchements non classifiés (clé inconnue)
             — résultats partiels. Mettre à jour ENC_FAMILLE_MAP.
           </div>`
        : '';

    // 4. Nombre total de possessions FENIX (pour le badge [n=X])
    const totalPoss = matchData.filter(r =>
        r[COLS.club] === 'FENIX' &&
        (r[COLS.enclenchement] || '').toString().trim()
    ).length;

    // 5. Construire les 3 cards dans l'ordre défini
    const FAMILLES_ORDER = ['Faire courir', 'Jeu Pivot', 'Isoler'];
    const FAMILLE_COLORS = {
        'Faire courir': 'var(--enc-faire-courir)',
        'Jeu Pivot':    'var(--enc-jeu-pivot)',
        'Isoler':       'var(--enc-isoler)',
        'Autre':        'var(--enc-autre)'
    };
    const FAMILLE_IDS = {
        'Faire courir': 'courir',
        'Jeu Pivot':    'pivot',
        'Isoler':       'isoler'
    };

    let cardsHtml = '';
    FAMILLES_ORDER.forEach(famille => {
        const s = statsMatch.get(famille) || { tirs: 0, buts: 0, pb: 0, eff: 0, possessions: 0 };
        const saisonData = statsSaison.get(famille) || { effMoy: 0, cv: 0, matchCount: 0 };
        const couleur = FAMILLE_COLORS[famille];
        const familleId = FAMILLE_IDS[famille];

        // État "non utilisé" si 0 possessions
        if (s.possessions === 0) {
            cardsHtml += _buildEncCardDisabled(famille, couleur, familleId);
            return;
        }

        // Badge F-02
        const badgeHtml = _buildEncBadge(s, saisonData);

        // Barre de progression
        const barreHtml = _buildEncBarre(s.eff, saisonData);

        // Avertissement volume faible (n < 5)
        const nWarning = s.possessions < 5
            ? `<span style="font-style:italic;font-size:0.72rem;color:#94A3B8;">(données insuffisantes pour badge)</span>`
            : '';

        cardsHtml += `
        <div class="enc-famille-card" id="enc-card-${familleId}"
             style="border-top-color:${couleur};--enc-couleur:${couleur};"
             onclick="_toggleEncDetail('${familleId}')">
          <div class="enc-card-header">
            <span class="enc-famille-dot" style="background:${couleur};"></span>
            <span class="enc-famille-name">${famille.toUpperCase()}</span>
            <span class="enc-card-caret" id="enc-caret-${familleId}">▼</span>
          </div>
          <div class="enc-famille-eff">${s.eff}%</div>
          <div class="enc-famille-sublabel">EFF. POSSESSION</div>
          <div class="enc-famille-meta">
            ${s.tirs} tirs &nbsp;·&nbsp; ${s.buts} buts &nbsp;·&nbsp; (n=${s.possessions} poss.)
            ${nWarning}
          </div>
          ${barreHtml}
          ${badgeHtml}
          <button class="enc-detail-toggle" onclick="event.stopPropagation();_toggleEncDetail('${familleId}')">
            ▼ Voir le détail
          </button>
          <div class="enc-detail-panel" id="enc-detail-${familleId}" style="display:none;">
            ${_buildEncDetailTable(matchData, famille)}
          </div>
        </div>`;
    });

    // 6. Injecter
    container.innerHTML = `
      <div class="section-header">
        <span class="section-title">⚡ ENCLENCHEMENTS OFFENSIFS</span>
        <span class="enc-badges-header">
          <span class="enc-badge-n">n=${totalPoss} poss.</span>
          <span class="enc-badge-couv ${coverage.pct >= 80 ? 'ok' : 'warn'}">
            Couv. ${coverage.pct}%
          </span>
        </span>
      </div>
      ${warningHtml}
      <div class="enc-famille-grid">
        ${cardsHtml}
      </div>`;
}
```

**Fonctions réutilisées :** `computeEncStats()`, `computeEncStatsSaison()`, `computeEncCoverage()`, `_buildEncBadge()`, `_buildEncBarre()`, `_buildEncDetailTable()`, `_buildEncCardDisabled()`, `_toggleEncDetail()`.

---

#### Fonctions helpers de rendu (privées, préfixe `_`)

Ces fonctions sont des helpers purs de template. Elles ne touchent pas au DOM directement, ne doivent pas être appelées de l'extérieur.

```javascript
/**
 * Construit le HTML du badge F-02 (force / faiblesse / données insuffisantes).
 * @param {{ eff, possessions }} sMatch - Stats match de la famille
 * @param {{ effMoy, cv, matchCount }} sSaison - Stats saison de la famille
 * @returns {string} HTML du badge (peut être vide si aucun badge applicable)
 */
function _buildEncBadge(sMatch, sSaison) {
    // Pas de badge si données saison insuffisantes
    if (sSaison.matchCount < 3) {
        return `<div class="enc-badge-nodata">
          ○ Min. 3 matchs pour comparer (${sSaison.matchCount} joué${sSaison.matchCount > 1 ? 's' : ''})
        </div>`;
    }
    // Pas de badge si volume match trop faible
    if (sMatch.possessions < 5) return '';

    const effMoy = sSaison.effMoy;
    const effMatch = sMatch.eff;

    // Priorité 1 : Faiblesse adverse (notre eff >> notre moyenne)
    if (effMoy > 0 && effMatch / effMoy >= 1.5) {
        const ecart = effMatch - effMoy;
        return `<div class="enc-badge-faiblesse">
          ⚡ FAIBLESSE ADVERSE
          <div class="enc-badge-sub">Moy. saison : ${effMoy}% · Ce match : ${effMatch}% (+${ecart}%)</div>
        </div>`;
    }

    // Priorité 2 : Force FENIX (performance stable et dans la moyenne)
    const relDiff = effMoy > 0 ? Math.abs(effMatch - effMoy) / effMoy : 1;
    if (relDiff <= 0.10 && sSaison.cv < 0.20) {
        const ecart = effMatch - effMoy;
        const signe = ecart >= 0 ? '+' : '';
        return `<div class="enc-badge-force">
          ⭐ FORCE FENIX
          <div class="enc-badge-sub">Moy. saison : ${effMoy}% · Ce match : ${effMatch}% (${signe}${ecart}%)</div>
        </div>`;
    }

    return '';
}

/**
 * Construit la barre de progression HTML (Zone D de la card).
 * @param {number} effMatch - Efficacité match (0-100)
 * @param {{ effMoy, matchCount }} sSaison - Stats saison
 * @returns {string} HTML de la barre
 */
function _buildEncBarre(effMatch, sSaison) {
    let fillClass = 'noref';
    let refText = 'Pas de référence saison';

    if (sSaison.matchCount >= 3) {
        const effMoy = sSaison.effMoy;
        fillClass = effMatch >= effMoy ? 'above' : 'below';
        refText = `moy. saison : ${effMoy}%`;
    }

    const width = Math.min(effMatch, 100);
    return `<div class="enc-progress-track">
      <div class="enc-progress-fill ${fillClass}" style="width:${width}%"></div>
    </div>
    <div class="enc-progress-ref">${refText}</div>`;
}

/**
 * Construit le tableau de détail F-01b pour une famille.
 * @param {Array} matchData - Lignes du match
 * @param {string} famille - Famille cible ('Faire courir', etc.)
 * @returns {string} HTML du tableau (vide si pas de données)
 */
function _buildEncDetailTable(matchData, famille) {
    // 1. Filtrer et agréger par clé enclenchement (partie 0 du split)
    const rows = matchData.filter(r =>
        r[COLS.club] === 'FENIX' &&
        getEncFamille(r[COLS.enclenchement]) === famille
    );

    const byEnc = new Map();
    rows.forEach(r => {
        const enc = (r[COLS.enclenchement] || '').toString();
        const cle = enc.split(';')[0].trim() || 'Inconnu';
        // Utiliser le libellé complet (partie 2 si disponible, sinon clé)
        const parts = enc.split(';');
        const label = parts.length >= 3 ? parts[2].trim() : (parts.length >= 1 ? parts[0].trim() : cle);

        if (!byEnc.has(cle)) byEnc.set(cle, { label, tirs: 0, buts: 0 });
        const s = byEnc.get(cle);
        if (r[COLS.resultat] === 'But') { s.buts++; s.tirs++; }
        else if (r[COLS.resultat] === 'Tir raté') { s.tirs++; }
    });

    if (byEnc.size === 0) return '<p style="color:#94A3B8;font-size:0.82rem;">Aucune donnée.</p>';

    // 2. Trier par tirs décroissants
    const sorted = [...byEnc.entries()]
        .sort((a, b) => b[1].tirs - a[1].tirs);

    // 3. Totaux
    let totalTirs = 0, totalButs = 0;
    sorted.forEach(([, s]) => { totalTirs += s.tirs; totalButs += s.buts; });
    const totalEff = totalTirs > 0 ? Math.round(totalButs / totalTirs * 100) : 0;

    // 4. Construire le tableau
    let lignes = '';
    sorted.forEach(([, s]) => {
        const eff = s.tirs > 0 ? Math.round(s.buts / s.tirs * 100) : 0;
        const effColor = eff >= 60 ? '#059669' : eff < 40 ? '#DC2626' : '#64748B';
        lignes += `<tr>
          <td style="text-align:left">${s.label}</td>
          <td>${s.tirs}</td>
          <td>${s.buts}</td>
          <td style="color:${effColor};font-weight:600">${eff}%</td>
        </tr>`;
    });

    return `<table class="enc-detail-table">
      <thead><tr><th>Enclenchement</th><th>Tirs</th><th>Buts</th><th>Eff.</th></tr></thead>
      <tbody>${lignes}</tbody>
      <tfoot>
        <tr class="enc-detail-total">
          <td>Total famille</td>
          <td>${totalTirs}</td>
          <td>${totalButs}</td>
          <td>${totalEff}%</td>
        </tr>
      </tfoot>
    </table>`;
}

/**
 * Card état "non utilisé" pour une famille absente du match.
 */
function _buildEncCardDisabled(famille, couleur, familleId) {
    return `<div class="enc-famille-card disabled" id="enc-card-${familleId}"
         style="border-top-color:${couleur};">
      <div class="enc-card-header">
        <span class="enc-famille-dot" style="background:${couleur};opacity:0.4"></span>
        <span class="enc-famille-name">${famille.toUpperCase()}</span>
      </div>
      <div class="enc-famille-vide">Non utilisé ce match<br>
        <small>(0 possession enregistrée)</small>
      </div>
    </div>`;
}

/**
 * Toggle expand/collapse du détail d'une card famille.
 * Met à jour le caret et le texte du bouton.
 * @param {string} familleId - 'courir' | 'pivot' | 'isoler'
 */
function _toggleEncDetail(familleId) {
    const panel = document.getElementById(`enc-detail-${familleId}`);
    const caret = document.getElementById(`enc-caret-${familleId}`);
    const card  = document.getElementById(`enc-card-${familleId}`);
    if (!panel) return;

    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'block';
    if (caret) caret.textContent = isOpen ? '▼' : '▲';
    if (card) card.classList.toggle('expanded', !isOpen);

    // Mettre à jour le texte du bouton toggle
    const btn = card?.querySelector('.enc-detail-toggle');
    if (btn) btn.textContent = isOpen ? '▼ Voir le détail' : '▲ Masquer le détail';
}
```

---

### 2.3 F-03 — Timeline enrichie

---

#### `detectBasculeMoment(scoreHistory)`

```javascript
/**
 * Détecte le moment bascule dans l'historique de score.
 * Algorithme en deux passes :
 *   Passe 1 : premier croisement zéro défavorable (diff passe de >= 0 à < 0)
 *   Passe 2 : creux minimum de diff (argmin)
 * Retourne le plus informatif des deux (croisement si existe, sinon creux).
 *
 * @param {Array<{pos, fenix, adv}>} scoreHistory - Tableau construit dans drawTimeline()
 * @returns {{ index: number, avant: number, apres: number } | null}
 *   index = index dans scoreHistory du moment bascule
 *   avant = diff juste avant (positif ou zéro)
 *   apres = diff au moment bascule (négatif ou minimum)
 *   null si aucune bascule (FENIX mène tout le match)
 */
function detectBasculeMoment(scoreHistory) {
    if (!scoreHistory || scoreHistory.length < 2) return null;

    // Calculer le diff à chaque point
    const diffs = scoreHistory.map(p => p.fenix - p.adv);

    // Passe 1 : premier croisement zéro défavorable
    let crossingIdx = -1;
    for (let i = 1; i < diffs.length; i++) {
        if (diffs[i - 1] >= 0 && diffs[i] < 0) {
            crossingIdx = i;
            break;
        }
    }

    // Passe 2 : creux minimum (ignorer le premier point à 0-0)
    let minDiff = 0;
    let minIdx = -1;
    for (let i = 1; i < diffs.length; i++) {
        if (diffs[i] < minDiff) {
            minDiff = diffs[i];
            minIdx = i;
        }
    }

    // Aucune bascule si FENIX n'est jamais derrière
    if (crossingIdx === -1 && minIdx === -1) return null;

    // Préférer le croisement zéro (plus précis tactiquement)
    const idx = crossingIdx !== -1 ? crossingIdx : minIdx;
    return {
        index: idx,
        avant: diffs[idx - 1] !== undefined ? diffs[idx - 1] : 0,
        apres: diffs[idx]
    };
}
```

**Complexité :** O(n) sur scoreHistory.

---

#### `drawMomentumOverlay(ctx, scoreHistory, canvas, padding)`

```javascript
/**
 * Dessine la courbe d'écart et le marqueur bascule sur le canvas de drawTimeline().
 * DOIT être appelée APRÈS drawTimeline() — superpose des éléments sur le canvas existant.
 * Ne modifie aucune des lignes de dessin existantes de drawTimeline().
 *
 * @param {CanvasRenderingContext2D} ctx - Context du canvas timeline
 * @param {Array<{pos, fenix, adv}>} scoreHistory - Même tableau que drawTimeline()
 * @param {HTMLCanvasElement} canvas - L'élément canvas
 * @param {{ top, right, bottom, left }} padding - Même padding que drawTimeline()
 * @param {number} roundedMax - Même échelle Y que drawTimeline()
 * @param {number} maxPos - 60 (minutes normalisées)
 * @returns {void}
 */
function drawMomentumOverlay(ctx, scoreHistory, canvas, padding, roundedMax, maxPos) {
    if (!scoreHistory || scoreHistory.length < 2) return;

    const graphWidth  = canvas.width  - padding.left - padding.right;
    const graphHeight = canvas.height - padding.top  - padding.bottom;

    // 1. Calculer les diff et leur plage
    const diffs = scoreHistory.map(p => p.fenix - p.adv);
    const maxAbsDiff = Math.max(...diffs.map(Math.abs), 1);

    // Fonction de mapping Y pour la courbe d'écart
    // On normalise l'écart sur la MOITIÉ de la hauteur du graphe (axe propre)
    // L'axe zéro est au centre du graphe (mi-hauteur)
    const diffToY = (diff) => {
        const midY = padding.top + graphHeight / 2;
        return midY - (diff / maxAbsDiff) * (graphHeight / 2) * 0.8;
        // 0.8 = facteur pour ne pas toucher les bords hauts/bas
    };
    const posToX = (pos) => padding.left + (pos / maxPos) * graphWidth;

    // 2. Zones colorées (AVANT la courbe pour rester en fond)
    ctx.save();

    // Zone avantage (diff > 0) — vert translucide
    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.beginPath();
    const midY = padding.top + graphHeight / 2;
    ctx.moveTo(posToX(scoreHistory[0].pos), midY);
    scoreHistory.forEach(p => {
        const diff = p.fenix - p.adv;
        if (diff > 0) ctx.lineTo(posToX(p.pos), diffToY(diff));
    });
    // Fermer le polygone sur la ligne zéro
    // (simplification : on dessine les zones séparément par segment continu)
    ctx.closePath();
    ctx.fill();

    // Zone danger (diff < 0) — rouge translucide
    // Approche robuste : dessiner segment par segment
    ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
    let inDanger = false;
    ctx.beginPath();
    scoreHistory.forEach((p, i) => {
        const diff = p.fenix - p.adv;
        const x = posToX(p.pos);
        if (diff < 0) {
            if (!inDanger) {
                ctx.moveTo(x, midY);
                inDanger = true;
            }
            ctx.lineTo(x, diffToY(diff));
        } else {
            if (inDanger) {
                ctx.lineTo(x, midY);
                inDanger = false;
            }
        }
    });
    if (inDanger) ctx.lineTo(posToX(scoreHistory[scoreHistory.length - 1].pos), midY);
    ctx.closePath();
    ctx.fill();

    // 3. Ligne zéro (tirets gris discrets)
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, midY);
    ctx.lineTo(canvas.width - padding.right, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Courbe d'écart (gold, continue, 2px)
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    scoreHistory.forEach((p, i) => {
        const x = posToX(p.pos);
        const y = diffToY(p.fenix - p.adv);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 5. Marqueur bascule
    const bascule = detectBasculeMoment(scoreHistory);
    _lastBasculeResult = bascule;  // Stocker pour renderBasculContext()

    if (bascule) {
        const bPos = scoreHistory[bascule.index].pos;
        const bX = posToX(bPos);

        // Ligne verticale pointillée
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(bX, padding.top);
        ctx.lineTo(bX, padding.top + graphHeight);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label "BASCULE" avec fond blanc
        const label = 'BASCULE';
        ctx.font = '700 11px Inter, sans-serif';
        const tw = ctx.measureText(label).width;
        const lx = Math.min(bX - tw / 2, canvas.width - padding.right - tw - 4);
        const ly = padding.top + 14;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(lx - 3, ly - 12, tw + 6, 16);
        ctx.fillStyle = '#F59E0B';
        ctx.textAlign = 'left';
        ctx.fillText(label, lx, ly);

        // Triangle pointant vers le bas au creux
        const cY = diffToY(bascule.apres);
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.moveTo(bX, cY + 8);
        ctx.lineTo(bX - 5, cY);
        ctx.lineTo(bX + 5, cY);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}
```

**Notes critiques :**
- Le paramètre `padding` doit être **le même objet** que celui utilisé dans `drawTimeline()` (ligne 276 : `{ top: 40, right: 30, bottom: 40, left: 45 }`)
- `roundedMax` et `maxPos` doivent aussi être passés depuis `drawTimeline()` pour garantir l'alignement X/Y
- La courbe d'écart utilise son propre axe Y (centré à mi-hauteur), indépendant de l'axe score

**Gestion Bug #8 (canvas clientWidth = 0) :** Voir section 3 — modification de `drawTimeline()`.

---

#### `renderBasculContext(matchData, basculeResult)`

```javascript
/**
 * Affiche la section contextuelle "Pendant ce moment" sous le canvas.
 * @param {Array} matchData - Lignes du match
 * @param {{ index, avant, apres } | null} basculeResult - Résultat de detectBasculeMoment()
 * @returns {void}
 */
function renderBasculContext(matchData, basculeResult) {
    const container = document.getElementById('enc-bascule-section');
    if (!container) return;

    // Cas : aucune bascule
    if (!basculeResult) {
        container.innerHTML = `
          <div class="enc-bascule-none">
            ✓ Aucune bascule détectée — FENIX a mené du début à la fin.
          </div>`;
        return;
    }

    // 1. Identifier les possessions "pendant le run"
    // Fenêtre : possessions basculeIdx-3 à basculeIdx+3 dans les buts triés
    const goals = getSortedGoals(matchData);  // Réutilise getSortedGoals() de utils.js
    const idx = basculeResult.index;
    const windowStart = Math.max(0, idx - 3);
    const windowEnd   = Math.min(goals.length - 1, idx + 3);
    const runGoals = goals.slice(windowStart, windowEnd + 1);

    // 2. Séparer FENIX et adversaire pendant le run
    const advGoals  = runGoals.filter(g => g.row[COLS.club] !== 'FENIX');
    const fenGoals  = runGoals.filter(g => g.row[COLS.club] === 'FENIX');

    // 3. Agréger par famille
    const aggrFamille = (goalsList) => {
        const byFam = new Map();
        goalsList.forEach(g => {
            const fam = getEncFamille(g.row[COLS.enclenchement]);
            if (!byFam.has(fam)) byFam.set(fam, { count: 0, buts: 0 });
            const s = byFam.get(fam);
            s.count++;
            if (g.row[COLS.resultat] === 'But') s.buts++;
        });
        return [...byFam.entries()].sort((a, b) => b[1].count - a[1].count);
    };

    const advFams = aggrFamille(advGoals);
    const fenFams = aggrFamille(fenGoals);

    const FAMILLE_COLORS = {
        'Faire courir': 'var(--enc-faire-courir)',
        'Jeu Pivot':    'var(--enc-jeu-pivot)',
        'Isoler':       'var(--enc-isoler)',
        'Autre':        'var(--enc-autre)'
    };

    const buildFamRows = (fams, isAdv) => {
        if (fams.length === 0) return '<p style="color:#94A3B8;font-size:0.82rem;">Aucune possession.</p>';
        const maxButs = Math.max(...fams.map(([, s]) => s.buts));
        return fams.map(([fam, s]) => {
            const eff = s.count > 0 ? Math.round(s.buts / s.count * 100) : 0;
            const isMax  = isAdv  && s.buts === maxButs && maxButs > 0;
            const isEchec = !isAdv && s.buts === 0 && s.count > 0;
            const badge = isMax
                ? `<span style="color:#F59E0B;font-size:0.72rem;font-weight:700"> ← MAX</span>`
                : isEchec
                ? `<span style="color:#EF4444;font-size:0.72rem;font-weight:700"> ← ECHEC</span>`
                : '';
            const dot = `<span style="background:${FAMILLE_COLORS[fam] || '#94A3B8'};
                          width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:4px"></span>`;
            return `<div class="enc-bascule-row">
              ${dot}${fam} &nbsp;×${s.count} poss. → ${s.buts} but${s.buts > 1 ? 's' : ''} (eff. ${eff}%)${badge}
            </div>`;
        }).join('');
    };

    // 4. Info score
    const avant  = basculeResult.avant >= 0 ? `+${basculeResult.avant}` : `${basculeResult.avant}`;
    const apres  = basculeResult.apres >= 0 ? `+${basculeResult.apres}` : `${basculeResult.apres}`;
    const posRange = goals.length > 0
        ? `Possessions ${windowStart + 1} à ${windowEnd + 1}`
        : '';

    container.innerHTML = `
      <div class="enc-bascule-section">
        <div class="enc-bascule-header">
          ┊ BASCULE DÉTECTÉE — ${posRange} · Écart passé de ${avant} à ${apres}
        </div>
        <div class="enc-bascule-block">
          <div class="enc-bascule-block-title">ATTAQUE ADVERSE pendant ce run (${advGoals.length} poss.)</div>
          ${buildFamRows(advFams, true)}
        </div>
        <div class="enc-bascule-block">
          <div class="enc-bascule-block-title">ATTAQUE FENIX pendant ce run (${fenGoals.length} poss.)</div>
          ${buildFamRows(fenFams, false)}
        </div>
      </div>`;
}
```

**Fonctions réutilisées :** `getSortedGoals()` (utils.js), `getEncFamille()`.

---

### 2.4 F-04 — Gardien × famille adverse

---

#### `computeGbEncStats(matchData)`

```javascript
/**
 * Calcule les statistiques gardien × famille adverse pour un match.
 * @param {Array} matchData - Lignes du match
 * @returns {Map<string, Map<string, {arrets, tirs, pct}>>}
 *   Clé externe : nom gardien
 *   Clé interne : famille ('Faire courir', 'Jeu Pivot', 'Isoler', 'Autre')
 *   arrets = finalite === 'Tir arrêté'
 *   tirs   = arrets + (finalite === 'But' ou resultat === 'But' pour les lignes ADV)
 *   pct    = Math.round(arrets / tirs * 100) ou 0 si tirs === 0
 */
function computeGbEncStats(matchData) {
    // Seules les lignes adversaires (attaques sur le gardien FENIX)
    const advRows = matchData.filter(r => r[COLS.club] !== 'FENIX');

    const FAMILLES = ['Faire courir', 'Jeu Pivot', 'Isoler', 'Autre'];
    const byGardien = new Map();

    advRows.forEach(r => {
        const gardien = (r[COLS.gardien] || '').toString().trim();
        if (!gardien) return;

        // Initialiser le gardien si premier rencontre
        if (!byGardien.has(gardien)) {
            const famMap = new Map();
            FAMILLES.forEach(f => famMap.set(f, { arrets: 0, tirs: 0, pct: 0 }));
            byGardien.set(gardien, famMap);
        }

        const famille = getEncFamille(r[COLS.enclenchement]);
        const s = byGardien.get(gardien).get(famille);

        // finalite : 'Tir arrêté' = arrêt, 'But' = but adverse
        const estArret = r[COLS.finalite] === 'Tir arrêté';
        const estBut   = r[COLS.finalite] === 'But' || r[COLS.resultat] === 'But';

        if (estArret) { s.arrets++; s.tirs++; }
        else if (estBut) { s.tirs++; }
        // Les lignes sans tir (PB adversaire, etc.) ne comptent pas
    });

    // Calculer les pct
    byGardien.forEach(famMap => {
        famMap.forEach(s => {
            s.pct = s.tirs > 0 ? Math.round(s.arrets / s.tirs * 100) : 0;
        });
    });

    return byGardien;
}
```

**Complexité :** O(n) sur les lignes adverses du match.

---

#### `renderGardienEncSection(matchData)`

```javascript
/**
 * Génère et injecte la section F-04 (tableau gardien × famille + heatmap filtrée).
 * @param {Array} matchData - Lignes du match
 * @returns {void}
 */
function renderGardienEncSection(matchData) {
    const container = document.getElementById('enc-gardien-section');
    if (!container) return;

    const gbStats = computeGbEncStats(matchData);
    if (gbStats.size === 0) {
        container.innerHTML = `<p style="color:#94A3B8;font-size:0.85rem;">
          Aucune donnée gardien pour ce match.</p>`;
        return;
    }

    // 1. Sélection du gardien affiché
    const gardiens = [...gbStats.keys()];
    // Auto-sélection : garder le dernier gardien actif (le plus de tirs subis)
    if (!_gardienSelected || !gbStats.has(_gardienSelected)) {
        let maxTirs = -1;
        gardiens.forEach(g => {
            let t = 0;
            gbStats.get(g).forEach(s => t += s.tirs);
            if (t > maxTirs) { maxTirs = t; _gardienSelected = g; }
        });
    }

    // 2. Calculer la moyenne saison du gardien pour les signaux
    const moyenneSaison = _computeGbMoyenneSaison(_gardienSelected);

    // 3. Construire le sélecteur (si >= 2 gardiens)
    const selectHtml = gardiens.length >= 2
        ? `<label class="enc-gardien-select-label">Gardien :</label>
           <select id="enc-gardien-select" onchange="_onGardienChange(this.value)">
             ${gardiens.map(g =>
               `<option value="${g}" ${g === _gardienSelected ? 'selected' : ''}>${g}</option>`
             ).join('')}
           </select>`
        : `<strong>${_gardienSelected}</strong>`;

    // 4. Calculer le % arrêts global du gardien sur ce match
    const famMap = gbStats.get(_gardienSelected);
    let totalArrets = 0, totalTirs = 0;
    famMap.forEach(s => { totalArrets += s.arrets; totalTirs += s.tirs; });
    const pctGlobal = totalTirs > 0 ? Math.round(totalArrets / totalTirs * 100) : 0;
    const moyRef = moyenneSaison !== null
        ? `&nbsp;·&nbsp; Moy. saison : ${moyenneSaison}%`
        : '';

    // 5. Construire les lignes du tableau
    const FAMILLES_ORDER = ['Faire courir', 'Jeu Pivot', 'Isoler', 'Autre'];
    const hasSaisonRef = moyenneSaison !== null;

    let rows = '';
    FAMILLES_ORDER.forEach(famille => {
        const s = famMap.get(famille) || { arrets: 0, tirs: 0, pct: 0 };
        if (s.tirs === 0) return;  // Masquer les familles sans tirs

        let signalHtml = '';
        if (s.tirs < 3) {
            signalHtml = `<td class="enc-signal-neutre" style="font-style:italic;">(n&lt;3)</td>`;
        } else if (!hasSaisonRef) {
            signalHtml = `<td class="enc-signal-neutre">—</td>`;
        } else {
            const diff = s.pct - moyenneSaison;
            if (diff < -15) {
                signalHtml = `<td class="enc-signal-alerte">🔴 ALERTE</td>`;
            } else if (diff > 10) {
                signalHtml = `<td class="enc-signal-bon">✅ BON</td>`;
            } else {
                signalHtml = `<td class="enc-signal-neutre">—</td>`;
            }
        }

        // Classe de ligne sélectionnée (filtre heatmap)
        const rowCls = _gardienFamilleFilter === famille ? 'enc-gardien-row selected' : 'enc-gardien-row';

        rows += `<tr class="${rowCls}" onclick="_onGardienFamilleClick('${famille}')">
          <td style="text-align:left">
            <span class="enc-famille-dot" style="background:var(--enc-${famille.toLowerCase().replace(/ /g,'-')},#94A3B8)"></span>
            ${famille}
          </td>
          <td>${s.tirs}</td>
          <td>${s.arrets}</td>
          <td>${s.pct}%</td>
          ${signalHtml}
        </tr>`;
    });

    // Ligne Total
    rows += `<tr class="enc-gardien-total">
      <td>Total</td>
      <td>${totalTirs}</td>
      <td>${totalArrets}</td>
      <td>${pctGlobal}%</td>
      <td>—</td>
    </tr>`;

    const noteRef = !hasSaisonRef
        ? `<p style="font-size:0.72rem;color:#94A3B8;font-style:italic;margin-top:0.5rem;">
             Min. 3 matchs pour calculer les signaux gardien.</p>`
        : '';

    container.innerHTML = `
      <div class="section-header">
        <span class="section-title">GARDIEN × SYSTÈMES ADVERSES</span>
      </div>
      <div class="enc-gardien-header">
        ${selectHtml}
        <span class="enc-gardien-global">% arrêts global ce match : <strong>${pctGlobal}%</strong>${moyRef}</span>
      </div>
      <div class="enc-gardien-layout">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="text-align:left">Système adverse</th>
                <th>Tirs</th>
                <th>Arr.</th>
                <th>% arr.</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          ${noteRef}
          <p style="font-size:0.72rem;color:#94A3B8;font-style:italic;margin-top:0.25rem;">
            Cliquer sur une ligne pour filtrer la heatmap.
          </p>
        </div>
        <div id="enc-gardien-heatmap">
          <!-- Canvas zones de but filtré — réorienté depuis le canvas existant -->
        </div>
      </div>`;

    // Rendre la heatmap initiale (aucun filtre)
    _renderGardienHeatmap(matchData, _gardienFamilleFilter);
}

/** Callback changement gardien */
function _onGardienChange(gardienName) {
    _gardienSelected = gardienName;
    _gardienFamilleFilter = null;  // Reset filtre famille
    const matchFilter = document.getElementById('filter-analyse-match').value;
    const matchData = DATA.filter(r => r[COLS.rencontre] === matchFilter);
    renderGardienEncSection(matchData);
}

/** Callback clic ligne famille → filtre heatmap */
function _onGardienFamilleClick(famille) {
    _gardienFamilleFilter = (_gardienFamilleFilter === famille) ? null : famille;
    const matchFilter = document.getElementById('filter-analyse-match').value;
    const matchData = DATA.filter(r => r[COLS.rencontre] === matchFilter);
    // Re-rendre uniquement la heatmap + mettre à jour la classe selected
    _renderGardienHeatmap(matchData, _gardienFamilleFilter);
    // Mettre à jour les classes de lignes sans reconstruire tout le DOM
    document.querySelectorAll('.enc-gardien-row').forEach(tr => {
        const isSelected = tr.onclick?.toString().includes(`'${_gardienFamilleFilter}'`);
        tr.classList.toggle('selected', isSelected);
    });
}

/**
 * Calcule la moyenne % arrêts du gardien sur toute la saison.
 * @param {string} gardienName - Nom du gardien
 * @returns {number|null} - Moyenne en %, null si < 3 matchs
 */
function _computeGbMoyenneSaison(gardienName) {
    if (typeof MATCHS === 'undefined' || !MATCHS) return null;

    const pcts = [];
    MATCHS.forEach(matchName => {
        const matchData = DATA.filter(r => r[COLS.rencontre] === matchName);
        const gbStats = computeGbEncStats(matchData);
        if (!gbStats.has(gardienName)) return;

        let t = 0, a = 0;
        gbStats.get(gardienName).forEach(s => { t += s.tirs; a += s.arrets; });
        if (t > 0) pcts.push(Math.round(a / t * 100));
    });

    return pcts.length >= 3
        ? Math.round(pcts.reduce((s, v) => s + v, 0) / pcts.length)
        : null;
}

/**
 * Réoriente le canvas de zones de but existant sur les tirs adverses filtrés.
 * Réutilise les fonctions de dessin zones existantes (ne les réécrit pas).
 * @param {Array} matchData - Lignes du match
 * @param {string|null} familleFilter - Famille à filtrer, null = toutes
 */
function _renderGardienHeatmap(matchData, familleFilter) {
    const heatmapContainer = document.getElementById('enc-gardien-heatmap');
    if (!heatmapContainer) return;

    // Filtrer les tirs adverses (sur le gardien FENIX)
    let advRows = matchData.filter(r =>
        r[COLS.club] !== 'FENIX' &&
        (r[COLS.finalite] === 'But' || r[COLS.finalite] === 'Tir arrêté') &&
        r[COLS.gardien] === _gardienSelected
    );

    if (familleFilter) {
        advRows = advRows.filter(r => getEncFamille(r[COLS.enclenchement]) === familleFilter);
    }

    const titre = familleFilter
        ? `Zones adverses — ${familleFilter} (${advRows.length} tirs)`
        : `Zones adverses (tous systèmes — ${advRows.length} tirs)`;

    // NOTE IMPLÉMENTATION : Cette fonction appelle les fonctions de dessin zones
    // existantes (drawZones ou equivalent) avec les données filtrées advRows.
    // Le Dev doit identifier la fonction de dessin zones dans page-impact.js ou
    // la page zones existante et la réorienter ici.
    // Si cette fonction n'est pas extractible : créer un mini-canvas 3×3 dédié.
    heatmapContainer.innerHTML = `
      <div style="font-size:0.75rem;color:#64748B;margin-bottom:0.5rem;">${titre}</div>
      <canvas id="enc-gardien-canvas" width="180" height="200"></canvas>
      ${familleFilter
        ? `<button onclick="_onGardienFamilleClick(null)" class="enc-filter-reset">
             Tout afficher
           </button>`
        : ''}`;

    // Dessiner le mini-canvas zones 3×3
    _drawMiniZoneCanvas('enc-gardien-canvas', advRows);
}

/**
 * Dessine un mini canvas 3×3 zones de but avec les tirs fournis.
 * Version simplifiée autonome — ne dépend pas du canvas impact existant.
 * @param {string} canvasId
 * @param {Array} rows - Lignes avec field_position renseigné
 */
function _drawMiniZoneCanvas(canvasId, rows) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grille 3×3 (haut-gauche, haut-centre, haut-droite, etc.)
    const ZONE_MAP = {
        'HG': 0, 'HC': 1, 'HD': 2,
        'MG': 3, 'MC': 4, 'MD': 5,
        'BG': 6, 'BC': 7, 'BD': 8,
    };
    // Compter par zone
    const counts = new Array(9).fill(0);
    const buts   = new Array(9).fill(0);
    rows.forEach(r => {
        const zone = (r[COLS.field_position] || '').toString().trim().toUpperCase();
        const idx = ZONE_MAP[zone];
        if (idx !== undefined) {
            counts[idx]++;
            if (r[COLS.finalite] === 'But') buts[idx]++;
        }
    });

    // Dessiner la grille
    const cw = canvas.width, ch = canvas.height - 20;  // 20px pour le titre
    const cellW = cw / 3, cellH = ch / 3;
    const maxCount = Math.max(...counts, 1);

    for (let i = 0; i < 9; i++) {
        const col = i % 3, row = Math.floor(i / 3);
        const x = col * cellW, y = row * cellH;
        const intensity = counts[i] / maxCount;
        const isBut = buts[i] > 0;

        // Fond coloré par intensité (rouge = danger, vert = arrêts)
        ctx.fillStyle = isBut
            ? `rgba(220, 38, 38, ${0.15 + intensity * 0.5})`   // rouge
            : `rgba(16, 185, 129, ${0.1 + intensity * 0.3})`;  // vert
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

        // Bordure
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellW, cellH);

        // Texte : nb tirs (buts/arrêts)
        if (counts[i] > 0) {
            ctx.fillStyle = '#0F172A';
            ctx.font = '700 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${counts[i]}`,
                x + cellW / 2, y + cellH / 2 + 4
            );
        }
    }

    // Légende basse
    ctx.fillStyle = '#64748B';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('But = rouge · Arrêt = vert', 2, ch + 14);
}
```

---

### 2.5 F-05 — Enclenchements saison V vs D

---

#### `renderEncSaisonSection()`

```javascript
/**
 * Génère et injecte le tableau F-05 (familles V vs D saison).
 * S'intègre dans generateSeasonCorrelations() — appelée en fin de cette fonction.
 * @returns {void}
 */
function renderEncSaisonSection() {
    const container = document.getElementById('enc-saison-section');
    if (!container) return;

    // Prérequis : >= 5 matchs
    if (typeof MATCHS === 'undefined' || !MATCHS || MATCHS.length < 5) {
        const n = MATCHS ? MATCHS.length : 0;
        container.innerHTML = `
          <div class="corr-block">
            <div class="corr-title">EFFICACITÉ PAR FAMILLE — SAISON</div>
            <p style="color:#64748B;font-size:0.85rem;text-align:center;padding:12px 0">
              Données insuffisantes (${n} match${n > 1 ? 's' : ''} — minimum requis : 5).<br>
              Cette vue sera disponible à partir du 5e match.
            </p>
          </div>`;
        return;
    }

    // 1. Agréger par famille × résultat
    const FAMILLES = ['Faire courir', 'Jeu Pivot', 'Isoler'];
    const groups = { V: new Map(), D: new Map(), N: new Map() };
    FAMILLES.forEach(f => {
        groups.V.set(f, []);
        groups.D.set(f, []);
        groups.N.set(f, []);
    });

    MATCHS.forEach(matchName => {
        const matchData = DATA.filter(r => r[COLS.rencontre] === matchName);
        if (matchData.length === 0) return;

        // Résultat du match
        const fenButs = matchData.filter(r => r[COLS.club] === 'FENIX' && r[COLS.resultat] === 'But').length;
        const advButs = matchData.filter(r => r[COLS.club] !== 'FENIX' && r[COLS.resultat] === 'But').length;
        const res = fenButs > advButs ? 'V' : fenButs < advButs ? 'D' : 'N';

        // Stats famille pour ce match (FENIX uniquement)
        const matchStats = computeEncStats(matchData, false);
        FAMILLES.forEach(f => {
            const s = matchStats.get(f);
            if (s && s.possessions >= 1) {
                groups[res].get(f).push(s.eff);
            }
        });
    });

    // 2. Calculer les moyennes
    const avg = arr => arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;

    const nV = groups.V.get('Faire courir').length > 0
        ? [...new Set(MATCHS.filter(m => {
            const fd = DATA.filter(r => r[COLS.rencontre] === m && r[COLS.club] === 'FENIX' && r[COLS.resultat] === 'But').length;
            const ad = DATA.filter(r => r[COLS.rencontre] === m && r[COLS.club] !== 'FENIX' && r[COLS.resultat] === 'But').length;
            return fd > ad;
        }))].length
        : 0;
    const nD = MATCHS.length - nV;  // Approximation — à affiner si nul est significatif

    // 3. Construire le tableau
    let rows = '';
    FAMILLES.forEach(f => {
        const effV = avg(groups.V.get(f));
        const effD = avg(groups.D.get(f));
        const diff = (effV !== null && effD !== null) ? effV - effD : null;

        const fmtEff = (v, arr) => {
            if (v === null) return '<td style="text-align:center;color:#94A3B8">—</td>';
            const bgColor = v >= 60 ? '#D1FAE5' : v < 40 ? '#FEE2E2' : 'transparent';
            return `<td style="text-align:center;background:${bgColor};font-weight:600">${v}%<br>
              <small style="color:#94A3B8;font-weight:400">(n=${arr.length})</small></td>`;
        };

        let diffHtml = '<td style="text-align:center;color:#94A3B8">—</td>';
        if (diff !== null) {
            const color  = diff > 2 ? '#10B981' : diff < -2 ? '#EF4444' : '#64748B';
            const arrow  = diff > 2 ? '↑' : diff < -2 ? '↓' : '→';
            const signe  = diff > 0 ? '+' : '';
            const prefix = diff < -2 ? '' : '';
            diffHtml = `<td style="text-align:center;color:${color};font-weight:700">
              ${signe}${diff}% ${arrow}
            </td>`;
        }

        const FAMILLE_COLORS = {
            'Faire courir': 'var(--enc-faire-courir)',
            'Jeu Pivot':    'var(--enc-jeu-pivot)',
            'Isoler':       'var(--enc-isoler)',
        };
        const dot = `<span style="background:${FAMILLE_COLORS[f]};width:8px;height:8px;
                      border-radius:50%;display:inline-block;margin-right:6px"></span>`;

        rows += `<tr>
          <td style="text-align:left">${dot}${f}</td>
          ${fmtEff(effV, groups.V.get(f))}
          ${fmtEff(effD, groups.D.get(f))}
          ${diffHtml}
        </tr>`;
    });

    const vCount = MATCHS.filter(m => {
        const fd = DATA.filter(r => r[COLS.rencontre] === m && r[COLS.club] === 'FENIX' && r[COLS.resultat] === 'But').length;
        const ad = DATA.filter(r => r[COLS.rencontre] === m && r[COLS.club] !== 'FENIX' && r[COLS.resultat] === 'But').length;
        return fd > ad;
    }).length;
    const dCount = MATCHS.filter(m => {
        const fd = DATA.filter(r => r[COLS.rencontre] === m && r[COLS.club] === 'FENIX' && r[COLS.resultat] === 'But').length;
        const ad = DATA.filter(r => r[COLS.rencontre] === m && r[COLS.club] !== 'FENIX' && r[COLS.resultat] === 'But').length;
        return fd < ad;
    }).length;

    container.innerHTML = `
      <div class="corr-block">
        <div class="corr-title">EFFICACITÉ PAR FAMILLE — SAISON (V=${vCount} · D=${dCount})</div>
        <div style="overflow-x:auto">
          <table class="corr-table enc-saison-table">
            <thead>
              <tr>
                <th style="text-align:left">Famille</th>
                <th style="text-align:center;color:#10B981">Eff. moy. V</th>
                <th style="text-align:center;color:#EF4444">Eff. moy. D</th>
                <th style="text-align:center">Diff. V–D</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <p style="font-size:0.72rem;color:#64748B;margin-top:0.5rem;">
          Diff. vert = famille plus efficace en victoire (normal). 
          Diff. rouge = famille plus efficace en défaite (signal à surveiller).
        </p>
      </div>`;
}
```

**Complexité :** O(M × n) — même ordre que `computeEncStatsSaison()`. Appel à `computeEncStats()` par match, mais sans mise en cache (acceptable car appelé une seule fois par session en vue saison).

**Fonctions réutilisées :** `computeEncStats()`.

---

## 3. Modifications des fonctions existantes

### 3.1 `updateAnalysePage()` — ajout des appels F-01/02/03/04

**Fichier :** `js/page-analyse.js`
**Lignes concernées :** 53–57 (les appels existants `generateResume3Points`, `generateIndicateurs`, `drawTimeline`, `findMomentsCles`)

**Avant (lignes 53–57) :**
```javascript
            generateResume3Points(matchFilter, matchData, hasPeriode);
            generateIndicateurs(matchFilter, matchData, hasPeriode);
            drawTimeline(matchFilter, matchData);
            findMomentsCles(matchFilter, matchData);
```

**Après :**
```javascript
            generateResume3Points(matchFilter, matchData, hasPeriode);
            generateIndicateurs(matchFilter, matchData, hasPeriode);

            // F-01/02 — Cards familles d'enclenchement
            logEncFamillesInconnues(matchData);  // Loguer les clés inconnues
            renderEncFamillesSection(matchData);

            // F-03 — Timeline enrichie (overlay appelé dans drawTimeline modifié)
            drawTimeline(matchFilter, matchData);

            // F-04 — Gardien × famille adverse
            _gardienFamilleFilter = null;  // Reset filtre à chaque changement de match
            _gardienSelected = null;       // Reset sélection gardien
            renderGardienEncSection(matchData);

            findMomentsCles(matchFilter, matchData);
```

**Pourquoi :** Les nouvelles features s'insèrent entre les indicateurs et la timeline, puis la section gardien avant les moments clés, conformément au flux de page défini dans DESIGN section 0.

---

### 3.2 `drawTimeline()` — appel de l'overlay + fix Bug #8

**Fichier :** `js/page-analyse.js`
**Lignes concernées :** 233–238 (début de la fonction)

**Avant (lignes 233–238) :**
```javascript
        function drawTimeline(matchName, matchData) {
            const canvas = document.getElementById('timeline-canvas');
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
```

**Après :**
```javascript
        function drawTimeline(matchName, matchData) {
            const canvas = document.getElementById('timeline-canvas');
            const container = canvas.parentElement;

            // Fix Bug #8 — canvas.clientWidth = 0 si l'élément est rendu mais pas mesuré
            if (container.clientWidth === 0) {
                requestAnimationFrame(() => drawTimeline(matchName, matchData));
                return;
            }

            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
```

**Pourquoi :** Le Bug #8 (canvas `clientWidth = 0`) est mentionné dans le PRD F-03 comme critère d'acceptation obligatoire. Le `requestAnimationFrame` permet au navigateur de terminer le layout avant de dessiner.

**Modification 2 — appel de l'overlay en fin de drawTimeline**

**Avant (fin de `drawTimeline()`, après la ligne 387) :**
```javascript
            // [fin de la fonction — rien après la légende]
        }
```

**Après :**
```javascript
            // === F-03 — Overlay momentum (APRÈS tout le dessin existant) ===
            const padding = { top: 40, right: 30, bottom: 40, left: 45 };
            // Note : padding est déjà déclaré plus haut dans la fonction.
            // Pour ne pas dupliquer, extraire la variable padding en dehors
            // du bloc actuel (voir note implémentation ci-dessous).
            drawMomentumOverlay(ctx, scoreHistory, canvas, padding, roundedMax, maxPos);
            renderBasculContext(matchData, _lastBasculeResult);
        }
```

**Note implémentation :** La variable `padding` est déclarée ligne 276 dans le corps existant de `drawTimeline()`. Elle est déjà disponible dans le scope de la fonction. Il suffit d'ajouter les 2 appels en toute fin de corps, avant la fermeture `}`. Pas besoin de déplacer la déclaration.

---

### 3.3 `generateSeasonCorrelations()` — ajout du bloc F-05

**Fichier :** `js/page-analyse.js`
**Ligne concernée :** 748 (dernier `}` de la fonction, avant la fermeture)

**Avant (ligne 748, fin de la fonction) :**
```javascript
            container.innerHTML = `
                <div class="corr-block">
                    ...
                </div>
            `;
        }
```

**Après (ajouter après le `container.innerHTML = ...` existant, avant le `}` de fermeture) :**
```javascript
            container.innerHTML = `
                <div class="corr-block">
                    ...
                </div>
            `;

            // F-05 — Bloc familles V vs D (s'ajoute après le tableau existant)
            // L'élément #enc-saison-section doit être présent dans le HTML
            // (dans le même conteneur que #saison-correlations ou juste après)
            renderEncSaisonSection();
        }
```

**Pourquoi :** F-05 est une Release 2 qui s'intègre dans la vue saison. Elle s'ajoute en fin du bloc existant sans perturber les données ou l'affichage existant.

---

### 3.4 Invalidation cache `_encStatsSaison` au rechargement fichier

Il faut invalider `_encStatsSaison` quand les données sont rechargées. Chercher dans le HTML la fonction appelée après chargement du fichier Excel (probablement `loadFromLocalStorage()` ou une fonction de parse).

**A ajouter au point de rechargement des données :**
```javascript
// Invalider les caches module Analyse
_encStatsCache = null;
_encStatsCacheMatch = null;
_encStatsSaison = null;
_lastBasculeResult = null;
```

---

## 4. Ordre d'implémentation recommandé

```
Étape 0 — PRÉREQUIS BLOQUANT (avant tout code)
  └── Session coach 15 min : extraire les clés uniques de enclenchement
      et valider le mapping ENC_FAMILLE_MAP
      Commande JS à lancer en console :
      [...new Set(DATA.map(r => (r[COLS.enclenchement]||'').split(';')[0].trim()))].filter(Boolean).sort()

Étape 1 — Fondation parser (F-00)
  ├── Déclarer les variables globales (section 1)
  ├── Renseigner ENC_FAMILLE_MAP avec le mapping validé (section 7)
  ├── Implémenter getEncFamille()
  ├── Implémenter logEncFamillesInconnues()
  └── Implémenter computeEncCoverage()
  TEST : appeler getEncFamille() en console sur 5 valeurs réelles

Étape 2 — Calcul stats (base de F-01/02/04/05)
  ├── Implémenter computeEncStats()
  └── Implémenter computeEncStatsSaison()
  TEST : console.log([...computeEncStats(matchData, false).entries()])

Étape 3 — Rendu cards F-01/02 (dépend étape 2)
  ├── Ajouter #enc-familles-section dans le HTML (entre indicateurs et timeline)
  ├── Implémenter _buildEncBadge(), _buildEncBarre(), _buildEncDetailTable()
  ├── Implémenter _buildEncCardDisabled(), _toggleEncDetail()
  ├── Implémenter renderEncFamillesSection()
  ├── Modifier updateAnalysePage() (appels section 3.1)
  └── Ajouter classes CSS (section 5)
  TEST : sélectionner un match, vérifier les 3 cards

Étape 4 — Timeline enrichie F-03 (dépend étape 1)
  ├── Modifier drawTimeline() — fix Bug #8 + appel overlay (section 3.2)
  ├── Implémenter detectBasculeMoment()
  ├── Implémenter drawMomentumOverlay()
  ├── Ajouter #enc-bascule-section dans le HTML (sous le canvas timeline)
  └── Implémenter renderBasculContext()
  TEST : match avec bascule connue, vérifier marqueur + section contextuelle

Étape 5 — Gardien F-04 (dépend étape 1)
  ├── Implémenter computeGbEncStats()
  ├── Implémenter _computeGbMoyenneSaison()
  ├── Implémenter _drawMiniZoneCanvas()
  ├── Implémenter _renderGardienHeatmap()
  ├── Implémenter renderGardienEncSection()
  ├── Ajouter #enc-gardien-section dans le HTML
  └── Implémenter _onGardienChange(), _onGardienFamilleClick()
  TEST : vérifier tableau + heatmap + sélecteur si 2 gardiens

Étape 6 — Saison F-05, Release 2 (dépend étapes 1 + 2 + génération saison)
  ├── Modifier generateSeasonCorrelations() (appel section 3.3)
  ├── Ajouter #enc-saison-section dans le HTML (dans le conteneur saison)
  └── Implémenter renderEncSaisonSection()
  TEST : vue sans match sélectionné, >= 5 matchs

Étape 7 — Invalidation cache (dépend toutes étapes)
  └── Ajouter reset des variables globales au rechargement fichier (section 3.4)
```

**Dépendances inter-étapes :**

```
Étape 0 ← bloque tout
Étape 1 ← bloque 2, 3, 4, 5, 6
Étape 2 ← bloque 3, 5, 6
Étape 3 ← indépendant de 4 et 5 (peut être parallèle)
Étape 4 ← indépendant de 5 (peut être parallèle avec 3)
Étape 5 ← indépendant de 3 et 4 (peut être parallèle)
Étape 6 ← dépend de 1 et 2 uniquement
```

---

## 5. Nouvelles classes CSS nécessaires

À ajouter dans `css/style.css` dans un bloc `/* === MODULE ANALYSE — ENCLENCHEMENTS === */` en fin de fichier.

| Classe | Feature | Rôle fonctionnel |
|---|---|---|
| `.enc-famille-grid` | F-01 | Grid 3 colonnes responsive (1 col ≤ 850px) |
| `.enc-famille-card` | F-01 | Card individuelle avec border-top colorée et hover |
| `.enc-famille-card.expanded` | F-01b | État expandé : outline couleur famille |
| `.enc-famille-card.disabled` | F-01 | État non utilisé : opacity 0.45, fond gris, bordure tirets |
| `.enc-famille-dot` | F-01 | Pastille ronde 10px couleur famille |
| `.enc-famille-name` | F-01 | Label famille Inter 700 uppercase |
| `.enc-famille-eff` | F-01 | Valeur efficacité Bebas Neue 2.2rem |
| `.enc-famille-sublabel` | F-01 | Label "EFF. POSSESSION" Inter 0.6rem uppercase #64748B |
| `.enc-famille-meta` | F-01 | Ligne métriques secondaires Inter 0.8rem #64748B |
| `.enc-famille-vide` | F-01 | Texte état non utilisé centré, opacité réduite |
| `.enc-progress-track` | F-01 | Fond barre progression 6px border-radius 3px |
| `.enc-progress-fill` | F-01 | Remplissage barre (states : `.above`, `.below`, `.noref`) |
| `.enc-progress-ref` | F-01 | Texte référence saison sous la barre Inter 0.65rem |
| `.enc-badge-force` | F-02 | Badge vert Force FENIX (fond #D1FAE5, bordure #10B981) |
| `.enc-badge-faiblesse` | F-02 | Badge ambre Faiblesse adverse (fond #FEF3C7, bordure #F59E0B) |
| `.enc-badge-nodata` | F-02 | Badge gris données insuffisantes (fond transparent, bordure tirets) |
| `.enc-badge-sub` | F-02 | Sous-texte dans les badges Inter 0.65rem |
| `.enc-detail-toggle` | F-01b | Bouton texte "Voir le détail" (transparent, bleu, hover underline) |
| `.enc-detail-panel` | F-01b | Conteneur tableau expandable (overflow hidden, transition max-height) |
| `.enc-detail-table` | F-01b | Tableau détail enclenchements (headers bleu, alternance lignes) |
| `.enc-detail-total` | F-01b | Ligne Total tableau (bold, fond #EFF6FF, bordure top bleue) |
| `.enc-card-caret` | F-01 | Caret ▼/▲ Inter 0.7rem (float right ou flex) |
| `.enc-card-header` | F-01 | Flex row : dot + nom + caret |
| `.enc-coverage-warning` | F-00 | Avertissement couverture < 80% (fond #FEF3C7, bordure gold) |
| `.enc-badges-header` | F-01 | Badges n= et couv% dans le section-header |
| `.enc-badge-n` | F-01 | Badge nombre de possessions (fond gris neutre) |
| `.enc-badge-couv.ok` | F-00 | Badge couverture verte (>= 80%) |
| `.enc-badge-couv.warn` | F-00 | Badge couverture rouge (< 80%) |
| `.enc-bascule-section` | F-03 | Conteneur section contextuelle bascule (fond #FFFBEB, bordure gold) |
| `.enc-bascule-header` | F-03 | En-tête "BASCULE DÉTECTÉE" Bebas Neue 1rem #92400E |
| `.enc-bascule-block` | F-03 | Bloc "Attaque adverse" / "Attaque FENIX" |
| `.enc-bascule-block-title` | F-03 | Titre de bloc Inter 700 0.7rem uppercase #64748B |
| `.enc-bascule-row` | F-03 | Ligne d'enclenchement dans la section contextuelle |
| `.enc-bascule-none` | F-03 | État "Aucune bascule" fond #D1FAE5 couleur #059669 |
| `.enc-gardien-layout` | F-04 | Flex row tableau (65%) + heatmap (35%), empilé ≤ 768px |
| `.enc-gardien-header` | F-04 | Flex row sélecteur + % arrêts global |
| `.enc-gardien-select-label` | F-04 | Label "Gardien :" Inter 700 0.72rem uppercase |
| `.enc-gardien-global` | F-04 | Texte % arrêts global Inter 0.82rem |
| `.enc-gardien-row` | F-04 | Ligne tableau cliquable (hover #F1F5F9, cursor pointer) |
| `.enc-gardien-row.selected` | F-04 | Ligne sélectionnée fond #EFF6FF bordure-left couleur famille |
| `.enc-gardien-total` | F-04 | Ligne Total tableau gardien (bold, fond --fenix-gray) |
| `.enc-signal-alerte` | F-04 | Cellule signal rouge (#FEE2E2 / #DC2626) |
| `.enc-signal-bon` | F-04 | Cellule signal vert (#D1FAE5 / #059669) |
| `.enc-signal-neutre` | F-04 | Cellule signal gris (#64748B) |
| `.enc-filter-reset` | F-04 | Bouton "Tout afficher" reset filtre heatmap |
| `.enc-saison-table` | F-05 | Tableau V vs D (extension de .corr-table existant) |

**Variables CSS à déclarer** (à ajouter dans le bloc `:root` existant) :

```css
:root {
  --enc-faire-courir:  #0EA5E9;
  --enc-jeu-pivot:     #8B5CF6;
  --enc-isoler:        #F59E0B;
  --enc-autre:         #94A3B8;
  --bascule-line:      #F59E0B;
  --zone-danger:       rgba(239, 68, 68, 0.12);
  --zone-avantage:     rgba(16, 185, 129, 0.12);
}
```

---

## 6. Points de risque technique

### R1 — ENC_FAMILLE_MAP incomplet ou erroné

**Probabilité :** Haute (données handball encodées librement par l'opérateur vidéo).
**Impact :** Critique — si > 20% des lignes tombent en "Autre", les 3 cards famille deviennent inutilisables.

**Mitigation concrète :**
1. Avant tout commit, exécuter en console : `[...new Set(DATA.map(r => (r[COLS.enclenchement]||'').split(';')[0].trim()))].filter(Boolean).sort()` pour extraire toutes les clés uniques réelles
2. Afficher `logEncFamillesInconnues()` dans la console à chaque chargement de match (déjà prévu)
3. Afficher le badge couverture dans l'UI si < 80% (déjà prévu dans `renderEncFamillesSection()`)
4. Rendre `ENC_FAMILLE_MAP` modifiable sans retoucher le code — c'est déjà une constante objet JS en tête de fichier

**Indicateur de succès :** couverture >= 80% sur le premier match de test.

---

### R2 — Régression sur `drawTimeline()` lors de l'ajout de l'overlay

**Probabilité :** Moyenne (fonction canvas de 155 lignes, sensible).
**Impact :** Modéré — si le canvas existant est cassé, la timeline est inutilisable.

**Mitigation concrète :**
1. `drawMomentumOverlay()` est **appelé après** tout le dessin existant, dans le même scope — aucune ligne existante n'est modifiée
2. `ctx.save()` / `ctx.restore()` wrappent tout le dessin de l'overlay — le contexte canvas est restauré proprement
3. Tester visuellement sur 3 matchs de référence avant merge (matcher 1 victoire, 1 défaite, 1 match sans bascule)
4. Si régression : commenter les 2 lignes d'appel ajoutées suffit à revenir en arrière sans diff

---

### R3 — Confusion `resultat` vs `finalite` pour les tirs

**Probabilité :** Haute (deux colonnes avec des valeurs partiellement redondantes).
**Impact :** Modéré — mauvais comptage des tirs et arrêts → stats incorrectes.

**Mitigation concrète :**
- Règle documentée dans `computeEncStats()` : `resultat` pour les lignes FENIX, `finalite` pour les lignes ADV (confirmé par l'analyse du code existant aux lignes 65-77 et 674)
- Ajouter un test de cohérence en console : pour un match connu, vérifier que `buts FENIX (via computeEncStats)` == `fenixButs (via generateResume3Points)`
- Si incohérence : inspecter les valeurs réelles de `finalite` sur les lignes ADV avec `DATA.filter(r => r[COLS.club] !== 'FENIX').map(r => r[COLS.finalite]).filter(Boolean)`

---

### R4 — `scoreHistory[]` non accessible depuis `drawMomentumOverlay()`

**Probabilité :** Faible (la variable est locale à `drawTimeline()`).
**Impact :** Bloquant — l'overlay n'a pas les données pour dessiner.

**Mitigation concrète :**
`scoreHistory` est déclaré à la ligne 259 de `drawTimeline()`. Pour le passer à `drawMomentumOverlay()`, deux options :
- **Option A (recommandée) :** Passer `scoreHistory` en paramètre de `drawMomentumOverlay()` — déjà prévu dans la signature définie en section 2.3
- **Option B (à éviter) :** Le déclarer en variable globale `let _lastScoreHistory` — risque de désynchronisation si plusieurs matchs sont chargés rapidement

Choisir Option A.

---

### R5 — Performance sur la vue saison avec beaucoup de matchs

**Probabilité :** Faible à moyenne (season complète = 20-30 matchs max en handball amateur).
**Impact :** Faible — léger freeze de l'UI sur `computeEncStatsSaison()`.

**Mitigation concrète :**
`computeEncStatsSaison()` est mis en cache dans `_encStatsSaison`. Le cache est calculé **une fois** par session (ou rechargement fichier). Sur 30 matchs × ~150 lignes = 4500 itérations — imperceptible en JS vanilla. Pas d'optimisation supplémentaire nécessaire.

---

### R6 — Heatmap gardien : canvas zones existant non extractible

**Probabilité :** Moyenne (dépend de l'architecture du canvas impact existant).
**Impact :** Faible — la fonction `_drawMiniZoneCanvas()` de fallback est prévue et autonome.

**Mitigation concrète :**
`_drawMiniZoneCanvas()` est fournie comme implémentation autonome (mini canvas 3×3). Elle ne dépend pas du canvas impact existant. Si l'intégration avec le canvas zones existant s'avère trop complexe, utiliser directement `_drawMiniZoneCanvas()` — la valeur fonctionnelle est identique (heatmap filtrée par famille).

---

### R7 — Élément HTML manquant (`#enc-familles-section`, `#enc-bascule-section`, etc.)

**Probabilité :** Certaine — ces éléments n'existent pas encore dans le HTML.
**Impact :** Bloquant si oublié — toutes les fonctions vérifient l'existence avec `if (!container) return;` donc pas de crash, mais rien ne s'affiche.

**Mitigation concrète :**
Liste des éléments HTML à ajouter dans `FENIX-HANDBALL-CF-SUIVI.html`, dans `#analyse-content`, dans l'ordre du flux de page :

```html
<!-- Après #indicateurs-grid et avant #timeline-canvas -->
<div id="enc-familles-section"></div>

<!-- Après le canvas timeline-canvas et #moments-cles -->
<div id="enc-bascule-section"></div>

<!-- Après enc-bascule-section et avant #moments-cles -->
<div id="enc-gardien-section"></div>

<!-- Dans le conteneur de la vue saison (où se trouve #saison-correlations) -->
<div id="enc-saison-section"></div>
```

---

## 7. ENC_FAMILLE_MAP — proposition initiale

```javascript
const ENC_FAMILLE_MAP = {
    // ───────────────────────────────────────────────────────────────────────
    // FAIRE COURIR — transitions rapides, contre-attaque, fatigue défensive
    // Caractéristiques : départ après récupération, défense non en place
    // Efficacité attendue : la plus haute (~60-70%)
    // ───────────────────────────────────────────────────────────────────────
    '1':   'Faire courir',   // Contre-attaque directe          // ? à valider
    '2':   'Faire courir',   // Jeu rapide / fast break          // ? à valider
    '3':   'Faire courir',   // Transition après récupération    // ? à valider
    'CA':  'Faire courir',   // Contre-attaque (sigle texte)     // ? à valider
    'FC':  'Faire courir',   // "Faire courir" explicite         // ? à valider
    'JR':  'Faire courir',   // Jeu rapide (sigle)               // ? à valider

    // ───────────────────────────────────────────────────────────────────────
    // JEU PIVOT — exploitation du pivot, blocs, supériorités intérieures
    // Caractéristiques : pivot direct/indirect, croisés, écrans, blocs pivot
    // Efficacité attendue : intermédiaire (~45-55%)
    // ───────────────────────────────────────────────────────────────────────
    '4':   'Jeu Pivot',      // Pivot direct                     // ? à valider
    '5':   'Jeu Pivot',      // Pivot indirect                   // ? à valider
    '6':   'Jeu Pivot',      // Croisé autour pivot              // ? à valider
    '7':   'Jeu Pivot',      // Bloc pivot libérateur            // ? à valider
    '8':   'Jeu Pivot',      // Croisé sans ballon (ex: "8;0;Bloc 4") — CLEF CONFIRMÉE dans les docs
    '9':   'Jeu Pivot',      // Jeu en bloc                      // ? à valider
    'JP':  'Jeu Pivot',      // "Jeu Pivot" explicite            // ? à valider
    'PIV': 'Jeu Pivot',      // Pivot (sigle)                    // ? à valider
    'Bloc':'Jeu Pivot',      // Bloc (si encodé en texte partie 1) // ? à valider

    // ───────────────────────────────────────────────────────────────────────
    // ISOLER — duel 1v1, exploitation supériorité individuelle
    // Caractéristiques : fixation défenseur, décalage, pénétration zone libre
    // Efficacité attendue : la plus basse (~35-45%)
    // ───────────────────────────────────────────────────────────────────────
    '10':  'Isoler',         // Isolation arrière                // ? à valider
    '11':  'Isoler',         // Isolation ailier                 // ? à valider
    '12':  'Isoler',         // Duel direct 1v1                  // ? à valider
    '13':  'Isoler',         // Décalage + tir                   // ? à valider
    'IS':  'Isoler',         // "Isoler" explicite               // ? à valider
    'ISO': 'Isoler',         // Isolation (sigle)                // ? à valider
    '1v1': 'Isoler',         // Duel direct (format texte)       // ? à valider

    // ───────────────────────────────────────────────────────────────────────
    // NOTE — Toutes les clés sont marquées "? à valider"
    // car le mapping réel dépend de l'encodage spécifique du logiciel vidéo FENIX.
    //
    // PROCÉDURE DE VALIDATION (session 15 min avec le coach) :
    // 1. Exécuter en console :
    //    [...new Set(DATA.map(r => (r[COLS.enclenchement]||'').split(';')[0].trim()))]
    //      .filter(Boolean).sort()
    // 2. Afficher la liste au coach — il attribue une famille à chaque clé
    // 3. Remplacer ce mapping par le mapping validé
    // 4. Conserver ce commentaire pour référence historique
    // ───────────────────────────────────────────────────────────────────────
};
```

---

## Annexe A — Éléments HTML à ajouter dans FENIX-HANDBALL-CF-SUIVI.html

Emplacement : dans `#analyse-content`, entre les sections existantes.

```html
<!-- ═══════════════════════════════════════════════ -->
<!-- F-01/02 — Cards familles d'enclenchement       -->
<!-- À insérer après #indicateurs-grid              -->
<!-- ═══════════════════════════════════════════════ -->
<div class="section" id="enc-familles-section">
  <!-- Injecté par renderEncFamillesSection() -->
</div>

<!-- ═══════════════════════════════════════════════ -->
<!-- F-03 — Section contextuelle bascule            -->
<!-- À insérer après le canvas #timeline-canvas     -->
<!-- ═══════════════════════════════════════════════ -->
<div id="enc-bascule-section">
  <!-- Injecté par renderBasculContext() -->
</div>

<!-- ═══════════════════════════════════════════════ -->
<!-- F-04 — Gardien × famille adverse               -->
<!-- À insérer après enc-bascule-section            -->
<!-- et avant #moments-cles                         -->
<!-- ═══════════════════════════════════════════════ -->
<div class="section" id="enc-gardien-section">
  <!-- Injecté par renderGardienEncSection() -->
</div>

<!-- ═══════════════════════════════════════════════ -->
<!-- F-05 — Saison V vs D (vue sans match)          -->
<!-- À insérer après #saison-correlations           -->
<!-- dans le conteneur de la vue saison vide        -->
<!-- ═══════════════════════════════════════════════ -->
<div id="enc-saison-section">
  <!-- Injecté par renderEncSaisonSection() -->
</div>
```

---

## Annexe B — Checklist de validation Architect → Dev

Avant de démarrer le développement :

- [ ] Session coach terminée — ENC_FAMILLE_MAP renseigné avec les clés réelles
- [ ] Définition PB confirmée : `resultat === 'PB'` est bien la bonne colonne (pas action_att/action_def)
- [ ] Les 4 éléments HTML (Annexe A) ajoutés dans le bon ordre dans `#analyse-content`
- [ ] Les variables CSS `--enc-faire-courir`, `--enc-jeu-pivot`, `--enc-isoler`, `--enc-autre`, `--bascule-line` déclarées dans `:root`
- [ ] `scoreHistory` passé en paramètre de `drawMomentumOverlay()` (Option A section R4) — pas de variable globale
- [ ] Invalidation des caches (`_encStatsSaison`, etc.) ajoutée au point de rechargement des données

---

*Document ARCH v1.0 — pipeline BMAD FENIX — à transmettre au Dev pour implémentation R1.*

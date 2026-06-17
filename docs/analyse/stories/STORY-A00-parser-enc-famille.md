# STORY A-00 — Parser `getEncFamille()` + `ENC_FAMILLE_MAP` + coverage check

**Sprint :** 1
**Taille :** S (½ journée)
**Priorité :** BLOQUANTE — prérequis absolu de toutes les autres stories

---

## User Story

En tant que **développeur** (au service du coach FENIX),
je veux une fonction utilitaire `getEncFamille(encStr)` fiable et une table de mapping `ENC_FAMILLE_MAP` validée avec le coach,
afin que toutes les features d'analyse (cards, timeline, gardien, saison) puissent classifier les enclenchements en familles tactiques sans jamais planter.

---

## Contexte technique

**Fichiers modifiés :**
- `js/page-analyse.js` — ajout en tête de fichier (après la ligne `let chatHistory = [];`)
- `FENIX-HANDBALL-CF-SUIVI.html` — bump du `?v=` sur le `<script src="js/page-analyse.js">`

**Données source :**
- Colonne `enclenchement` = `COLS.enclenchement` = index 9
- Format : `"8;0;Bloc 4"` → la clé de classification est `encStr.split(';')[0].trim()` = `"8"`
- Valeurs nulles et vides possibles — doivent retourner `"Autre"` sans exception

**Contexte existant :**
- Ligne 1044 du HTML : `const COLS = { ..., enclenchement: 9, ... }`
- Aucune fonction de classification n'existe actuellement
- `DATA[]` est le tableau global des lignes Excel

---

## Implémentation

### Variables globales à ajouter en tête de `page-analyse.js`

```javascript
// ===== MODULE ANALYSE — Variables globales =====

/**
 * Mapping clé enclenchement → famille tactique.
 * La clé est la partie 0 du split(';') de la colonne enclenchement.
 * OBLIGATOIRE : valider avec le coach AVANT le premier commit.
 * Toutes les clés sont marquées // ? à valider
 */
const ENC_FAMILLE_MAP = {
    // FAIRE COURIR
    '1':   'Faire courir',   // ? à valider
    '2':   'Faire courir',   // ? à valider
    '3':   'Faire courir',   // ? à valider
    'CA':  'Faire courir',   // ? à valider
    'FC':  'Faire courir',   // ? à valider
    'JR':  'Faire courir',   // ? à valider
    // JEU PIVOT
    '4':   'Jeu Pivot',      // ? à valider
    '5':   'Jeu Pivot',      // ? à valider
    '6':   'Jeu Pivot',      // ? à valider
    '7':   'Jeu Pivot',      // ? à valider
    '8':   'Jeu Pivot',      // CLEF CONFIRMÉE dans les docs (ex: "8;0;Bloc 4")
    '9':   'Jeu Pivot',      // ? à valider
    'JP':  'Jeu Pivot',      // ? à valider
    'PIV': 'Jeu Pivot',      // ? à valider
    'Bloc':'Jeu Pivot',      // ? à valider
    // ISOLER
    '10':  'Isoler',         // ? à valider
    '11':  'Isoler',         // ? à valider
    '12':  'Isoler',         // ? à valider
    '13':  'Isoler',         // ? à valider
    'IS':  'Isoler',         // ? à valider
    'ISO': 'Isoler',         // ? à valider
    '1v1': 'Isoler',         // ? à valider
};

/** Cache des stats famille par match. */
let _encStatsCache = null;
let _encStatsCacheMatch = null;
/** Stats saison par famille — cache session. */
let _encStatsSaison = null;
/** Filtre famille actif dans la heatmap gardien. */
let _gardienFamilleFilter = null;
/** Gardien sélectionné dans F-04. */
let _gardienSelected = null;
/** Résultat dernière détection bascule. */
let _lastBasculeResult = null;
```

### Fonctions utilitaires

```javascript
/**
 * Retourne la famille tactique d'un enclenchement.
 * @param {string|null|undefined} encStr
 * @returns {'Faire courir'|'Jeu Pivot'|'Isoler'|'Autre'}
 */
function getEncFamille(encStr) {
    if (!encStr || typeof encStr !== 'string') return 'Autre';
    const cle = encStr.split(';')[0].trim();
    if (!cle) return 'Autre';
    return ENC_FAMILLE_MAP[cle] ?? 'Autre';
}

/**
 * Détecte et loggue les clés d'enclenchement non classifiées.
 * @param {Array} rows - Lignes DATA du match
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

/**
 * Calcule le taux de couverture du mapping.
 * @param {Array} rows - Lignes avec enclenchement non vide
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

### Commande de validation (à lancer en console avant le premier commit)

```javascript
// Extraire toutes les clés uniques réelles pour les soumettre au coach :
[...new Set(DATA.map(r => (r[COLS.enclenchement]||'').split(';')[0].trim()))].filter(Boolean).sort()
```

---

## CSS

Aucun CSS requis pour cette story. Les variables CSS seront ajoutées dans A-01.

---

## Critères d'acceptation

- [ ] `getEncFamille("8;0;Bloc 4")` retourne `"Jeu Pivot"` (selon la clé `"8"` dans `ENC_FAMILLE_MAP`)
- [ ] `getEncFamille("")` retourne `"Autre"` sans exception ni console.error
- [ ] `getEncFamille(null)` retourne `"Autre"` sans exception ni console.error
- [ ] `getEncFamille(undefined)` retourne `"Autre"` sans exception ni console.error
- [ ] `getEncFamille(";sous-partie")` retourne `"Autre"` (clé vide après split)
- [ ] `computeEncCoverage(matchData)` retourne un objet `{total, classifiees, pct}` avec `pct` entre 0 et 100
- [ ] `logEncFamillesInconnues(matchData)` affiche en `console.warn` les clés non classifiées (testé en ouvrant les DevTools sur un match réel)
- [ ] Le `?v=` sur `<script src="js/page-analyse.js?v=...">` dans le HTML est bumped après ce commit
- [ ] La session de validation avec le coach a eu lieu — `ENC_FAMILLE_MAP` contient les vraies clés du fichier Excel (coverage ≥ 80% sur le premier match de test)

---

## Hors scope

- Aucun rendu HTML/CSS (c'est une pure fondation technique)
- Pas de modification de `updateAnalysePage()` dans cette story
- Pas de gestion de la casse des clés (la normalisation est dans le mapping — à gérer lors de la session coach)

---

## Dépend de

Aucune dépendance amont. Cette story est le prérequis absolu de A-01, A-02, A-03, A-04, A-05, A-06, A-07, A-08.

---

## Risques

**R1 (Critique) :** ENC_FAMILLE_MAP incomplet si la session coach n'a pas lieu avant le commit. Mitigation : ne pas merger cette story tant que la session n'a pas eu lieu et que la couverture n'est pas ≥ 80%.

**R2 (Modéré) :** Format `enclenchement` différent selon les matchs (casse, espaces, nouvelles valeurs). Mitigation : `logEncFamillesInconnues()` est appelée à chaque chargement de match — surveiller la console.

---

*Story A-00 — pipeline BMAD FENIX — Scrum Master 2026-06-17*

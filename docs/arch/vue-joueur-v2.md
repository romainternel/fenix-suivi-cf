# Architecture — Vue Joueur Mobile v2
**Agent :** Architect  
**Date :** 2026-06-15  
**Input :** docs/prd.md + docs/design/vue-joueur-v2.md  
**Code lu :** player-mode.js (l.590–740), style.css (l.2005–2097), FENIX-HANDBALL-CF-SUIVI.html (l.3380–3413)

---

## ÉTAT ACTUEL — Ce qui existe

```
FENIX-HANDBALL-CF-SUIVI.html   ~5 700 lignes   (HTML + JS inline)
css/style.css                  ~2 100 lignes
js/player-mode.js              ~1 250 lignes
js/utils.js, page-joueurs.js, page-notes-graph.js, page-analyse.js
```

**Structures clés utilisées par les 11 features :**
- `BILANS[]` — array of `{ nom, label, matchs[], saison }` — déjà disponible
- `_getPmBilanMatchs()` — retourne les matchs du bilan courant (Stats Match)
- `renderPmfGraph(nom)` — génère le Chart.js joueur de champ (6 datasets) ou GB (4 datasets)
- `_pmfChart` — instance Chart.js courante (détruite avant rechargement)
- `.pmf-canvases` — CSS grid 3 colonnes pour les canvas impact
- `pm-match-page` — div avec padding:76px 24px 24px inline

---

## DÉCISIONS TECHNIQUES PAR FEATURE

---

### F-01 — Graph Ma Fiche : filtre période + 2 courbes mobile

**Décision :** Étendre `renderPmfGraph(nom)` en `renderPmfGraph(nom, bilanFilter)`.  
À l'intérieur : si `bilanFilter`, filtrer `MATCHS` → `played` uniquement sur les matchs du bilan.  
Sur mobile (`isMobile = window.innerWidth < 600`) : masquer les 4 datasets secondaires par défaut via `hidden: true` sur le dataset Chart.js.

**Pourquoi pas un rebuild complet ?**  
`_pmfChart` est déjà détruit/recréé à chaque appel. Ajouter `bilanFilter` en paramètre est non-destructif.

**Nouvelles variables globales :**
```javascript
let _pmfPeriodFilter = '';     // '' = toute saison, sinon nom du bilan
let _pmfShowDetail   = false;  // toggle courbes ATT/DEF/Médiane/Tendance
```

**Nouveau sélecteur HTML** (injecté dans le DOM par `renderPlayerFiche()`) :
```html
<div id="pmf-period-wrap" style="display:flex;align-items:center;gap:8px">
  <select id="pmf-period-sel" onchange="pmfSetPeriod(this.value)">
    <option value="">Toute la saison</option>
    <!-- options injectées dynamiquement depuis BILANS -->
  </select>
</div>
```
Affiché uniquement si `BILANS.length > 0` (F-08).

**Nouvelle fonction :**
```javascript
function pmfSetPeriod(bilanNom) {
    _pmfPeriodFilter = bilanNom;
    _pmfShowDetail = false;         // reset le toggle à chaque changement de période
    const nom = getSessionPlayerNom();
    if (_pmfChart) { _pmfChart.destroy(); _pmfChart = null; }
    renderPmfGraph(nom, bilanNom);
    renderPmfDiagnostic(nom, bilanNom);   // F-02
}
function togglePmfDetail() {
    _pmfShowDetail = !_pmfShowDetail;
    const nom = getSessionPlayerNom();
    if (_pmfChart) { _pmfChart.destroy(); _pmfChart = null; }
    renderPmfGraph(nom, _pmfPeriodFilter);
}
```

**Impact existant :** `renderPmfGraph` reçoit un 2e param optionnel → rétrocompatible. `pmTab('fiche')` continue d'appeler `renderPlayerFiche()` → pas de changement.

---

### F-02 — Diagnostic ↑↓ entre bilans

**Décision :** Nouvelle fonction `renderPmfDiagnostic(nom, bilanNom)` qui injecte dans `#pmf-diagnostic`.

**Algorithme :**
```javascript
function _computeBilanAvgTotal(nom, bilanMatchs, isGB) {
    // Pour chaque match du bilan, calculer le TOTAL (même logique que renderPmfGraph)
    // Retourne la moyenne des totaux sur les matchs où le joueur a eu des actions
    // Retourne null si < 2 matchs avec données
}

function renderPmfDiagnostic(nom, bilanNom) {
    const el = document.getElementById('pmf-diagnostic');
    if (!el || !bilanNom) { if (el) el.innerHTML = ''; return; }
    const isGB = detectIsGB(nom);
    const bIdx = BILANS.findIndex(b => b.nom === bilanNom);
    if (bIdx <= 0) { el.innerHTML = ''; return; }  // pas de bilan précédent
    const curr = _computeBilanAvgTotal(nom, BILANS[bIdx].matchs,   isGB);
    const prev = _computeBilanAvgTotal(nom, BILANS[bIdx-1].matchs, isGB);
    if (curr === null || prev === null) { el.innerHTML = ''; return; }
    const delta = +(curr - prev).toFixed(1);
    const abs   = Math.abs(delta);
    if (abs < 0.5) { el.innerHTML = '<span style="color:#64748B">= Stable vs période préc.</span>'; return; }
    const arrow = delta > 0 ? '↑' : '↓';
    const color = delta > 0 ? '#10B981' : '#EF4444';
    const sign  = delta > 0 ? '+' : '';
    el.innerHTML = `<span style="color:${color}">${arrow} ${sign}${delta} pts vs période préc.</span>`;
}
```

**Nouveau div HTML** (injecté dans renderPlayerFiche) :
```html
<div id="pmf-diagnostic" style="font-size:0.8rem;font-weight:600;margin-bottom:6px"></div>
```

---

### F-03 — Info-bulle note joueur de champ

**Décision :** Dans `renderPlayerFiche()`, le KPI NOTE existe déjà dans `statsHTML` :  
```javascript
`<div class="pmf-kpi-box"><div class="pmf-kpi-val" style="color:${noteColor}">${noteDisplay}</div><div class="pmf-kpi-lbl">NOTE</div></div>`
```
→ Ajouter le badge ℹ dans la div `.pmf-kpi-lbl` :
```javascript
`<div class="pmf-kpi-lbl">NOTE<span title="ATT+ - ATT- + DEF+ - DEF- : chaque action positive ou négative compte" style="cursor:help;background:#CBD5E1;color:#1E293B;border-radius:50%;width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;margin-left:3px">i</span></div>`
```
**Risque :** Aucun. Copie exacte du pattern GB existant (ligne 218 player-mode.js).

---

### F-04 — Stats perso avant stats équipe

**Décision :** Réorganiser l'ordre des divs dans le HTML ET l'ordre des appels dans `renderPlayerMatchStats()`.

**HTML actuel (pm-match-page) :**
```
pm-match-banner → pm-ai-card → pm-match-cards → pm-match-player-table → pm-match-extras
```
**HTML nouveau :**
```
pm-match-banner → pm-match-player-table → pm-match-extras → pm-ai-card → pm-match-cards
```

**JS renderPlayerMatchStats() :** Déplacer les 2 appels de fonctions dans le même ordre que les divs.  
**Risque :** `onPmmZoneClick()` dépend de `_pmmImpactRows` défini dans `renderPlayerMatchExtras()` — pas de changement d'ordre de ces deux fonctions l'une par rapport à l'autre, juste par rapport aux cards. ✅ Safe.

---

### F-05 — Header Stats Match sticky

**Décision :** CSS uniquement. Ajouter une classe `pm-stats-header` sur le div header existant dans pm-match-page.

**CSS ajouté :**
```css
.pm-stats-header {
    position: sticky;
    top: 56px;
    background: white;
    z-index: 50;
    padding: 10px 0 14px;
    margin: -20px 0 16px;
    box-shadow: 0 2px 6px rgba(0,0,0,.06);
}
```

**Pourquoi `-margin: -20px 0 16px` ?**  
pm-match-page a `padding:76px 24px 24px` inline. Le header est le premier enfant, donc naturellement à 76px du haut. Le margin-top négatif le remonte à 56px, compensant les 20px d'écart (`76 - 56 = 20`). Le margin-bottom recrée l'espace entre header et contenu.

**Risque :** Si un ancêtre de pm-match-page a `overflow: hidden` → sticky ne fonctionne pas. Vérifier au QA.

---

### F-06 — Canvas Zones responsive

**Décision :** CSS uniquement. Remplacer le comportement `@media (max-width: 500px)` existant pour `.pmf-canvases`.

**Existant (à remplacer) :**
```css
@media (max-width: 500px) { .pmf-canvases { grid-template-columns: 1fr; } }
@media (...) { .pmf-canvases { grid-template-columns: repeat(2, 1fr) !important; }
               .pmf-canvas-wrap:last-child { grid-column: span 2; max-width: 52%; margin: 0 auto; } }
```

**Nouveau (mobile-first, face en premier) :**
```css
@media (max-width: 600px) {
    .pmf-canvases {
        grid-template-columns: repeat(2, 1fr);
    }
    /* Ordre HTML : alg (1er), face (2e), ald (3e) */
    .pmf-canvas-wrap:nth-child(1) { order: 2; }           /* alg → 2e ligne gauche */
    .pmf-canvas-wrap:nth-child(2) { order: 1; grid-column: span 2; }  /* face → 1er, pleine largeur */
    .pmf-canvas-wrap:nth-child(3) { order: 3; }           /* ald → 2e ligne droite */
}
```

**Pourquoi CSS order plutôt que réordonner le DOM ?**  
Le DOM est généré par JS dans player-mode.js à plusieurs endroits (renderPlayerMatchExtras, renderPlayerZones). Changer CSS une fois > changer JS partout.

---

### F-07 — Zones filtrables par résultat

**Décision :** Nouvelle variable + nouvelle fonction dans player-mode.js.

**Nouvelle variable globale :**
```javascript
let _pmzResultFilter = '';   // '' | 'pos' | 'neg'
```

**Nouvelle fonction :**
```javascript
function setPmzFilter(type) {
    _pmzResultFilter = (_pmzResultFilter === type) ? '' : type;   // toggle
    renderPlayerZones();   // rerender complet (simple, fiable)
}
```

**HTML buttons** (injectés dans `renderPlayerZones()`) :
```html
<div class="pmz-filter-bar">
  <button class="pmz-btn${_pmzResultFilter===''?' pmz-active':''}"   onclick="setPmzFilter('')">Tout</button>
  <button class="pmz-btn${_pmzResultFilter==='pos'?' pmz-active':''}" onclick="setPmzFilter('pos')">Buts</button>
  <button class="pmz-btn${_pmzResultFilter==='neg'?' pmz-active':''}" onclick="setPmzFilter('neg')">Ratés</button>
</div>
```
Labels adaptés pour GB : "Arrêts" / "Buts encaissés".

**Filtrage appliqué avant `_drawImpactCanvas()` :**
```javascript
const filtered = _pmzResultFilter === 'pos'
    ? impactRows.filter(r => isGB ? r[COLS.finalite]==='Tir arrêté' : r[COLS.resultat]==='But')
    : _pmzResultFilter === 'neg'
    ? impactRows.filter(r => isGB ? r[COLS.finalite]!=='Tir arrêté' : r[COLS.resultat]==='Tir raté')
    : impactRows;
```

**Risque :** `renderPlayerZones()` reconstruit tout le DOM à chaque appel (innerHTML) → les canvas sont recréés → `_drawImpactCanvas` s'exécute après le prochain frame. Pas de risque de canvas orphelin.

---

### F-08 — Sélecteur période masqué si aucun bilan

**Décision :** Condition `BILANS.length > 0` dans deux endroits :
1. `renderPlayerFiche()` : n'injecter `#pmf-period-wrap` que si `BILANS.length > 0`
2. `buildPmMatchNav()` : déjà gère `pm-bilan-wrap` via `style.display`. Vérifier qu'il n'affiche pas le wrap si `BILANS.length === 0`.

**Risque :** Aucun.

---

### F-09 — Stat vedette "Ta signature"

**Décision :** Nouvelle fonction `computePlayerSignature(nom, isGB)` dans player-mode.js.

**Algorithme joueur de champ :**
```javascript
function computePlayerSignature(nom, isGB) {
    if (isGB) return computeGBSignature(nom);
    // 1. Compter les actions positives par catégorie pour CE joueur
    const playerCounts = {};  // { 'But': 3, 'PD': 5, ... }
    // 2. Compter la moyenne de l'équipe pour chaque action (tous les joueurs FENIX)
    const teamCounts = {};    // { 'But': [2,1,3,4,...], ... }
    // 3. Comparer : si playerCounts[action] >= 1.5 * teamAvg[action] → candidat
    // 4. Retourner l'action avec le ratio le plus élevé, ou null si aucune
}
```

**Seuil 1.5x :** Si un joueur a 50% de plus que la moyenne équipe sur une action, c'est sa signature. Configurable si besoin.

**Performances :** O(n × actions) sur DATA. Acceptable pour 1000–5000 lignes. Calculé une fois dans `renderPlayerFiche()`, pas à chaque render.

**Condition d'affichage :** playerCount >= 3 occurrences ET ratio >= 1.5x. Sinon `null`, et le bloc n'est pas affiché.

---

### F-10 — Session reprend sur dernier onglet

**Décision :** 2 lignes.

```javascript
// Dans pmTab(tab) :
sessionStorage.setItem('pm_active_tab', tab);

// Dans setupPlayerUI() :
const savedTab = sessionStorage.getItem('pm_active_tab') || 'fiche';
if (typeof DATA !== 'undefined' && DATA.length > 0) pmTab(savedTab);
```

---

### F-11 — Canvas terrain réduit

**Décision :** CSS uniquement.

```css
@media (max-width: 600px) {
    .terrain-wrapper-small { max-height: 130px; }
}
```

Le canvas interne lit `container.clientHeight` → suit automatiquement.

---

## NOUVELLES VARIABLES GLOBALES

```javascript
let _pmfPeriodFilter  = '';    // période sélectionnée dans graph Ma Fiche
let _pmfShowDetail    = false; // toggle courbes secondaires graph
let _pmzResultFilter  = '';    // filtre résultat onglet Zones
```

## NOUVELLES FONCTIONS (player-mode.js)

```
pmfSetPeriod(bilanNom)            → change _pmfPeriodFilter, rerender graph + diagnostic
togglePmfDetail()                 → toggle _pmfShowDetail, rerender graph
renderPmfDiagnostic(nom, bilan)   → calcule et affiche le ↑↓
_computeBilanAvgTotal(nom, matchs, isGB) → calcule moyenne TOTAL sur un bilan
computePlayerSignature(nom, isGB) → retourne { action, ratio } ou null
computeGBSignature(nom)           → version gardien (zones d'arrêts)
setPmzFilter(type)                → change _pmzResultFilter, rerender zones
```

## IMPACT SUR L'EXISTANT

| Fichier | Changement | Risque |
|---------|------------|--------|
| player-mode.js | +~300 lignes | Aucun — fichier séparé |
| css/style.css | +~45 lignes, 1 règle remplacée | Faible — vérifier pmf-canvases staff |
| FENIX-HANDBALL-CF-SUIVI.html | Réorder divs pm-match-page, classe pm-stats-header | Faible |

## TAILLE FICHIERS APRÈS

```
player-mode.js    ~1 550 lignes  (was ~1 250)
css/style.css     ~2 150 lignes  (was ~2 100)
FENIX-HANDBALL-CF-SUIVI.html  ~5 710 lignes  (was ~5 700)
```
→ **Aucun risque d'explosion de fichier.**

## RISQUES

| Risque | Probabilité | Mitigation |
|--------|------------|------------|
| Sticky header bloqué par overflow:hidden ancêtre | Faible | Vérifier au QA — supprimer overflow si besoin |
| `_computeBilanAvgTotal` retourne null → erreur JS | Moyenne | Guard `if (curr === null \|\| prev === null) return` |
| F-06 CSS order + nth-child : HTML order différent dans pm-match-extras | Faible | Même génération JS → même ordre. Vérifier au QA |
| F-09 signature sur équipe avec peu de joueurs (< 5) | Moyenne | Seuil min 5 joueurs avec données, sinon null |
| Android Chrome canvas redraw async | Faible | `requestAnimationFrame` déjà utilisé dans certains draws |

## ORDRE D'IMPLÉMENTATION (pour le Scrum Master)

```
Bloc 1 — CSS/HTML purs, sans logique  : F-05, F-06, F-08 (condition bilan), F-10, F-11
Bloc 2 — JS simple, réutilise l'existant : F-03, F-04, F-07
Bloc 3 — JS avec nouveau calcul : F-01, F-02, F-09
```

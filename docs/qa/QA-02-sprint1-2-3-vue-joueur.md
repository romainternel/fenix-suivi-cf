# QA-02 — Vue Joueur Mobile v2 · Sprint 1-2-3

**Agent :** QA  
**Date :** 2026-06-16  
**Scope :** Stories S-01 à S-11 (S-09, S-10 abandonnées) + extras hors stories  
**Version vérifiée :** v104  
**Méthode :** Lecture du code (player-mode.js, style.css, FENIX-HANDBALL-CF-SUIVI.html)

---

## Résultats par story

### S-01 — Session reprend sur le dernier onglet actif

| Critère | Statut | Preuve |
|---------|--------|--------|
| `pm_active_tab` sauvegardé à chaque changement d'onglet | ✅ | player-mode.js:115 `sessionStorage.setItem('pm_active_tab', tab)` |
| Reprise sur l'onglet sauvegardé au chargement | ✅ | player-mode.js:87 `sessionStorage.getItem('pm_active_tab') \|\| 'fiche'` |
| Défaut "fiche" si pas de sauvegarde | ✅ | Fallback `\|\| 'fiche'` ligne 87 |
| Fonctionne pour les 3 onglets | ✅ | `pmTab()` appelé pour fiche/match/zones |

**Verdict S-01 : ✅ PASSED**

---

### S-02 — Canvas terrain réduit mobile

| Critère | Statut | Preuve |
|---------|--------|--------|
| ≤ 130px de hauteur sur mobile | ✅ | style.css:616 `@media (max-width:600px) { .terrain-wrapper-small { max-height:130px; } }` |
| Points proportionnels (pas d'étirement) | ✅ | Canvas JS lit `clientHeight` → suit automatiquement |
| Desktop inchangé | ✅ | Media query `max-width:600px` n'affecte pas desktop |
| Aucune régression page staff | ✅ | `.terrain-wrapper-small` est la même classe — comportement identique |

**Verdict S-02 : ✅ PASSED**

---

### S-03 — Barre de filtres Stats Match sticky

| Critère | Statut | Preuve |
|---------|--------|--------|
| Classe `pm-stats-header` présente sur le div | ✅ | FENIX-HANDBALL-CF-SUIVI.html:3404 |
| CSS `position:sticky; top:56px` | ✅ | style.css:1696-1700 |
| `box-shadow` et `z-index:50` | ✅ | style.css:1697-1699 |
| Filtres cliquables en position sticky | ✅ | Pas de `pointer-events:none` |
| **Sur mobile (< 520px) : top:56px masqué sous pm-bar (92px)** | ❌ | style.css:2097 pm-bar = 92px, mais `.pm-stats-header` reste à `top:56px` → le header se colle derrière la barre sur iPhone |

**Verdict S-03 : ⚠️ PARTIAL** — Fonctionne sur desktop/iPad. Bug sur iPhone (header caché sous pm-bar).

---

### S-04 — Canvas zones de tir lisibles sur mobile (face en premier)

| Critère | Statut | Preuve |
|---------|--------|--------|
| Face affiché en premier | ✅ | style.css:2132 `nth-child(2) { order:-1 }` (face = 2e enfant DOM) |
| **Face affiché en pleine largeur (≥ 300px)** | ❌ | `grid-column: span 2` est appliqué à `last-child` (ald) et NON à face → face = demi-largeur seulement |
| **alg + ald côte à côte en dessous** | ❌ | Layout réel : face+alg en haut, ald seul centré en bas (`max-width:52%`) — l'inverse de l'AC |
| Desktop 3 colonnes inchangé | ✅ | Media query `max-width:520px` uniquement |
| Fonctionne Zones ET Stats Match | ✅ | Même classe `.pmf-canvases` |
| Labels suivent leurs canvas | ✅ | Labels générés dans le même `.pmf-canvas-wrap` |
| Aucune régression staff | ✅ | `.pmf-canvases` du staff non affecté |

**Verdict S-04 : ❌ FAILED** — Le `grid-column: span 2` est sur `ald` au lieu de `face`. Layout inversé par rapport à l'AC.

**Fix requis :** Dans `@media (max-width:520px)` — style.css ~l.2131 :
```css
/* AVANT (incorrect) */
.pmf-canvas-wrap:nth-child(2) { order: -1; }
.pmf-canvas-wrap:last-child { grid-column: span 2; max-width: 52%; margin: 0 auto; }

/* APRÈS (correct) */
.pmf-canvas-wrap:nth-child(2) { order: -1; grid-column: span 2; }
.pmf-canvas-wrap:last-child { /* rien — comportement naturel (demi-col) */ }
```

---

### S-05 — Info-bulle "comment est calculée ma note" (joueur de champ)

| Critère | Statut | Preuve |
|---------|--------|--------|
| Badge "i" visible à côté de NOTE | ✅ | player-mode.js:265 inline dans `.pmf-kpi-lbl` |
| Tap → info visible | ✅ | `onclick="showPmTooltip(...)"` — popup custom au lieu de `title` natif |
| Note : `title` natif non utilisé (silencieux sur iOS touch) | ✅ | Choix intentionnel → `showPmTooltip()` adapté mobile |
| Badge absent pour GB | ✅ | Dans le bloc `isGB` : pas de badge i sur NOTE GB (déjà présent séparément) |
| Même style visuel que "i" GB | ✅ | Style inline identique (CBD5E1, 14px, border-radius:50%) |
| Aucune régression KPIs | ✅ | Bloc `pmf-kpi-lbl` non restructuré |

**Verdict S-05 : ✅ PASSED** (deviation mineure : popup custom vs title natif — supérieur pour mobile)

---

### S-06 — Stats personnelles affichées avant les stats équipe

| Critère | Statut | Preuve |
|---------|--------|--------|
| Ordre HTML : banner → player-table → extras → ai-card → match-cards | ✅ | FENIX-HANDBALL-CF-SUIVI.html:3425-3429 |
| Première section visible sans scroll = stats perso | ✅ | `pm-match-player-table` en 2e position |
| Zones de tir avant cartes équipe | ✅ | `pm-match-extras` en 3e position |
| Cartes équipe toujours présentes | ✅ | `pm-match-cards` toujours dans le DOM |
| `onPmmZoneClick()` fonctionnel | ✅ | `_pmmImpactRows` défini dans `renderPlayerMatchExtras()` avant utilisation |

**Verdict S-06 : ✅ PASSED**

---

### S-07 — Filtrer les zones de tir par résultat (Tout / Buts / Ratés)

| Critère | Statut | Preuve |
|---------|--------|--------|
| Légende filtre visible dans onglet Zones | ✅ | `_fi()` helper → items Tout/But/Raté dans `renderPlayerZones()` l.1072 |
| Tap "Buts" → seuls ● verts, stats recalculées | ✅ | `displayRows` filtré l.1051, utilisé pour canvas + stats l.1132-1133 |
| Tap "Ratés" → seuls ✕ rouges, stats recalculées | ✅ | Filtre `'neg'` confirmé l.1052 |
| **Tap sur item actif → toggle vers "Tout"** | ⚠️ | `onPmzResultFilter(val)` affecte directement sans toggle — cliquer sur "Buts" actif reste sur "Buts". Le retour à Tout nécessite de cliquer "Tout" explicitement |
| GB : labels "Arrêts" / "Buts encaissés" | ✅ | Logique `isGB` dans `renderPlayerZones()` |
| Zone grid non filtrée (utilise `_pmmImpactRows`) | ✅ | `_pmmImpactRows` utilisé pour la grid, `displayRows` pour le canvas |
| Même filtre sur page Impact staff | ✅ | `onImpactResultFilter()` dans HTML:inline + sync dans `updateImpactPage()` |
| Aucune régression Stats Match | ✅ | Filtre uniquement dans `renderPlayerZones()` et `onPmmZoneClick()` |

**Verdict S-07 : ✅ PASSED** (minor : pas de toggle sur item actif — UX dégradée mais non bloquante)

---

### S-08 — Masquer le sélecteur de période si aucun bilan

| Critère | Statut | Preuve |
|---------|--------|--------|
| `BILANS.length === 0` → sélecteur absent | ✅ | player-mode.js:1341 `bilanWrap.style.display = BILANS.length ? 'flex' : 'none'` |
| `BILANS.length >= 1` → sélecteur visible | ✅ | Condition ternaire |
| Aucune erreur JS si BILANS vide | ✅ | Guard `BILANS.length` (truthy/falsy) |
| Sélecteur MATCH toujours visible | ✅ | Seul `pm-bilan-wrap` conditionné, pas `pm-match-sel` |
| Aucune régression vue staff | ✅ | `buildPmMatchNav()` côté joueur uniquement |

**Verdict S-08 : ✅ PASSED**

---

### S-09 — Filtre période graph / S-10 — Diagnostic ↑↓

**Statut : ABANDONNÉS** sur décision utilisateur — hors scope QA.

---

### S-11 — Badge "Ta signature"

| Critère | Statut | Preuve |
|---------|--------|--------|
| Badge affiché si ratio ≥ 1.5x et ≥ 3 occurrences | ✅ | `computePlayerSignature()` l.411, seuils confirmés |
| Bloc absent si aucune action ne ressort | ✅ | `sigHTML = sig ? ... : ''` — aucun placeholder |
| GB : signature possible sur une zone | ✅ | Branche `isGB` dans `computePlayerSignature()` |
| Badge entre KPIs et graph | ✅ | player-mode.js:271-280, injecté après `actionsHTML` et avant graph |
| Aucune erreur JS si peu de joueurs | ✅ | Guard `if (playersWithData.size < 5) return null` |
| < 5 joueurs FENIX → badge absent | ✅ | Confirmé |
| Aucune régression Ma Fiche | ✅ | Ajout uniquement dans la zone signature |

**Verdict S-11 : ✅ PASSED**

---

## Extras hors stories

| Feature | Statut | Note |
|---------|--------|------|
| Graph légende symboles (Tendance/Médiane) | ✅ | `pointStyle:'line'` → tiret dans légende |
| Graph légende cliquable | ✅ | Natif Chart.js 4, aucun code ajouté |
| ATT/DEF card order (ATT+/ATT− puis DEF+/DEF−) | ✅ | `_buildDetailedActionsHTML()` réordonnée |
| Graph mobile fin (borderWidth, pointRadius réduits) | ✅ | `isPhone = Math.min(screen.width, screen.height) < 500` |
| Graph paysage (hauteur réduite) | ✅ | CSS `@media (orientation:landscape) and (max-height:600px)` + `orientationchange` listener |

---

## Bugs à corriger

### 🔴 BLOQUANT — S-04 : face non en pleine largeur sur mobile

**Fichier :** `css/style.css` ~ligne 2131  
**Ce qui se passe :** `grid-column: span 2` appliqué à `last-child` (ald) au lieu de `nth-child(2)` (face). Layout réel : face+alg côte à côte en haut, ald centré en bas. Inverse de l'AC.  
**Fix :**
```css
/* Ligne 2132 — remplacer */
.pmf-canvas-wrap:nth-child(2) { order: -1; grid-column: span 2; }
/* Ligne 2133 — supprimer */
/* .pmf-canvas-wrap:last-child { grid-column: span 2; max-width: 52%; margin: 0 auto; } */
```

### 🟡 MAJEUR — S-03 : header sticky caché sous pm-bar sur iPhone

**Fichier :** `css/style.css` ~ligne 1696  
**Ce qui se passe :** `.pm-stats-header { top: 56px }` mais sur iPhone (< 520px) la pm-bar fait 92px → le header colle à 56px, masqué sous la barre.  
**Fix :** Ajouter dans la media query `max-width: 520px` :
```css
.pm-stats-header { top: 92px; }
```

### 🟢 MINEUR — S-07 : pas de toggle sur item actif

**Comportement actuel :** Cliquer sur "Buts" actif ne ramène pas à "Tout" — il faut cliquer "Tout" explicitement.  
**Fix :** Dans `onPmzResultFilter(val)` :
```javascript
function onPmzResultFilter(val) {
    _pmzResultFilter = (_pmzResultFilter === val) ? '' : val;
    renderPlayerZones();
}
```

---

## Verdict global

| Story | Résultat |
|-------|----------|
| S-01 Session onglet | ✅ PASSED |
| S-02 Terrain réduit | ✅ PASSED |
| S-03 Header sticky | ⚠️ PARTIAL (bug iPhone) |
| S-04 Canvas face premier | ❌ FAILED (layout inversé) |
| S-05 Tooltip note | ✅ PASSED |
| S-06 Stats perso avant | ✅ PASSED |
| S-07 Filtre résultat | ✅ PASSED (minor toggle) |
| S-08 Masquer bilan vide | ✅ PASSED |
| S-11 Badge signature | ✅ PASSED |

> **PASSED WITH BUGS** — 7/9 stories passées, 1 bug bloquant (S-04) et 1 majeur (S-03 iPhone) à corriger avant release.

### Priorités de correction

1. 🔴 S-04 — `grid-column: span 2` sur face et non ald (2 lignes CSS)
2. 🟡 S-03 — `top: 92px` pour sticky header sur iPhone (1 ligne CSS)
3. 🟢 S-07 — Toggle sur item actif (1 ligne JS)

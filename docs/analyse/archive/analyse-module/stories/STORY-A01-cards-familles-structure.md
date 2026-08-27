# STORY A-01 — Cards familles — structure HTML + données de base

**Sprint :** 2
**Taille :** M (1 journée)
**Priorité :** Haute — première feature visible du module Analyse

---

## User Story

En tant que **coach FENIX**,
je veux voir en un coup d'oeil l'efficacité de chaque famille d'attaque (Faire courir / Jeu Pivot / Isoler) pour le match sélectionné — avec le nombre de tirs, de buts et une barre de progression comparant à la saison —
afin d'identifier immédiatement quelle arme offensive a fonctionné ce soir.

---

## Contexte technique

**Fichiers modifiés :**
- `js/page-analyse.js` — ajout de `computeEncStats()`, `computeEncStatsSaison()`, `renderEncFamillesSection()`, `_buildEncBarre()`, `_buildEncCardDisabled()`
- `css/style.css` — ajout du bloc `/* === MODULE ANALYSE — ENCLENCHEMENTS === */` en fin de fichier
- `FENIX-HANDBALL-CF-SUIVI.html` — ajout du `<div id="enc-familles-section">` + variables CSS `:root` + bump `?v=`

**Fonctions existantes modifiées :**
- `updateAnalysePage()` — ajout des appels `logEncFamillesInconnues(matchData)` et `renderEncFamillesSection(matchData)` après `generateIndicateurs()` et avant `drawTimeline()`

**Données utilisées :**
- `COLS.enclenchement` (index 9) → famille via `getEncFamille()` [A-00]
- `COLS.club` (index 2) → filtre `=== 'FENIX'`
- `COLS.resultat` (index 6) → `'But'`, `'Tir raté'`, `'PB'` pour les lignes FENIX
- `COLS.finalite` (index 8) → `'But'`, `'Tir arrêté'` pour les lignes ADV
- `MATCHS[]` global → liste des matchs pour `computeEncStatsSaison()`

---

## Implémentation

### 1. Variables CSS à déclarer dans `:root` (HTML, bloc existant)

```css
:root {
  --enc-faire-courir:  #0EA5E9;
  --enc-jeu-pivot:     #8B5CF6;
  --enc-isoler:        #F59E0B;
  --enc-autre:         #94A3B8;
  --bascule-line:      #F59E0B;
}
```

### 2. Élément HTML à insérer dans `#analyse-content`

Après `#indicateurs-grid` (ou son conteneur `.section`), avant le canvas `#timeline-canvas` :

```html
<div class="section" id="enc-familles-section">
  <!-- Injecté par renderEncFamillesSection() -->
</div>
```

### 3. Fonctions JS à ajouter dans `page-analyse.js`

#### `computeEncStats(matchData, isAdv)` — calcul stats match

```javascript
function computeEncStats(matchData, isAdv) {
    const rows = matchData.filter(r =>
        isAdv ? r[COLS.club] !== 'FENIX' : r[COLS.club] === 'FENIX'
    );
    const FAMILLES = ['Faire courir', 'Jeu Pivot', 'Isoler', 'Autre'];
    const stats = new Map();
    FAMILLES.forEach(f => stats.set(f, { tirs: 0, buts: 0, pb: 0, eff: 0, possessions: 0 }));

    rows.forEach(r => {
        const famille = getEncFamille(r[COLS.enclenchement]);
        const s = stats.get(famille);
        const estBut     = isAdv ? r[COLS.finalite] === 'But'
                                 : r[COLS.resultat] === 'But';
        const estTirRate = isAdv ? (r[COLS.finalite] === 'Tir arrêté' || r[COLS.finalite] === 'Tir raté')
                                 : r[COLS.resultat] === 'Tir raté';
        const estPB      = r[COLS.resultat] === 'PB';

        if ((r[COLS.enclenchement] || '').toString().trim()) s.possessions++;
        if (estBut)      { s.buts++; s.tirs++; }
        else if (estTirRate) { s.tirs++; }
        else if (estPB)  { s.pb++; }
    });

    stats.forEach(s => {
        const denom = s.tirs + s.pb;
        s.eff = denom > 0 ? Math.round(s.buts / denom * 100) : 0;
    });
    return stats;
}
```

#### `computeEncStatsSaison(isAdv)` — calcul stats saison avec cache

Voir ARCH section 2.1 pour l'implémentation complète (O(M×n), cache `_encStatsSaison`).

#### `renderEncFamillesSection(matchData)` — rendu principal

Voir ARCH section 2.2 pour l'implémentation complète.
Points clés :
- Appelle `computeEncStats(matchData, false)` pour le match
- Appelle `computeEncStatsSaison(false)` pour la référence saison
- Appelle `computeEncCoverage()` — affiche l'avertissement si < 80%
- Injecte dans `#enc-familles-section`

#### `_buildEncBarre(effMatch, sSaison)` — barre de progression

```javascript
function _buildEncBarre(effMatch, sSaison) {
    let fillClass = 'noref';
    let refText = 'Pas de référence saison';
    if (sSaison.matchCount >= 3) {
        fillClass = effMatch >= sSaison.effMoy ? 'above' : 'below';
        refText = `moy. saison : ${sSaison.effMoy}%`;
    }
    const width = Math.min(effMatch, 100);
    return `<div class="enc-progress-track">
      <div class="enc-progress-fill ${fillClass}" style="width:${width}%"></div>
    </div>
    <div class="enc-progress-ref">${refText}</div>`;
}
```

#### `_buildEncCardDisabled(famille, couleur, familleId)` — état non utilisé

```javascript
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
```

### 4. Modification de `updateAnalysePage()`

Ajouter après `generateIndicateurs(matchFilter, matchData, hasPeriode);` :

```javascript
// F-01/02 — Cards familles
logEncFamillesInconnues(matchData);
renderEncFamillesSection(matchData);
```

### 5. CSS à ajouter en fin de `style.css`

```css
/* ===================================================== */
/* MODULE ANALYSE — ENCLENCHEMENTS                       */
/* ===================================================== */

.enc-famille-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}
@media (max-width: 850px) {
  .enc-famille-grid { grid-template-columns: 1fr; }
}

.enc-famille-card {
  background: var(--fenix-white, #fff);
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: var(--shadow-md, 0 2px 8px rgba(0,0,0,0.1));
  border-top: 3px solid transparent;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.15s ease;
}
.enc-famille-card:hover {
  box-shadow: var(--shadow-lg, 0 4px 16px rgba(0,0,0,0.15));
  transform: translateY(-1px);
}
.enc-famille-card.disabled {
  opacity: 0.45;
  cursor: default;
  background: var(--fenix-gray, #F1F5F9);
  border-style: dashed;
  border-color: #CBD5E1;
}

.enc-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 0.5rem;
}
.enc-famille-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.enc-famille-name {
  font-family: Inter, sans-serif;
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  flex: 1;
}
.enc-card-caret {
  font-size: 0.7rem;
  color: #94A3B8;
}
.enc-famille-eff {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2.2rem;
  color: var(--fenix-dark, #0F172A);
  line-height: 1;
  margin: 0.4rem 0 0.1rem;
}
.enc-famille-sublabel {
  font-family: Inter, sans-serif;
  font-weight: 700;
  font-size: 0.6rem;
  text-transform: uppercase;
  color: #64748B;
  letter-spacing: 1px;
  margin-bottom: 0.4rem;
}
.enc-famille-meta {
  font-family: Inter, sans-serif;
  font-size: 0.8rem;
  color: #64748B;
  margin-bottom: 0.4rem;
}
.enc-famille-vide {
  text-align: center;
  color: #94A3B8;
  font-family: Inter, sans-serif;
  font-size: 0.85rem;
  padding: 1rem 0;
}

.enc-progress-track {
  height: 6px;
  background: var(--fenix-gray, #F1F5F9);
  border-radius: 3px;
  margin: 0.6rem 0 0.2rem;
  overflow: hidden;
}
.enc-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}
.enc-progress-fill.above { background: var(--fenix-success, #10B981); }
.enc-progress-fill.below { background: var(--fenix-danger, #EF4444); }
.enc-progress-fill.noref { background: #94A3B8; }
.enc-progress-ref {
  font-family: Inter, sans-serif;
  font-size: 0.65rem;
  color: #94A3B8;
  margin-bottom: 0.5rem;
}

.enc-coverage-warning {
  background: #FEF3C7;
  border: 1px solid var(--fenix-gold, #F59E0B);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-family: Inter, sans-serif;
  font-size: 0.8rem;
  color: #92400E;
  margin-bottom: 1rem;
}
.enc-badges-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.enc-badge-n, .enc-badge-couv {
  font-family: Inter, sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
}
.enc-badge-n { background: #F1F5F9; color: #64748B; }
.enc-badge-couv.ok   { background: #D1FAE5; color: #059669; }
.enc-badge-couv.warn { background: #FEE2E2; color: #DC2626; }
```

---

## Critères d'acceptation

- [ ] Après sélection d'un match, 3 cards s'affichent dans `#enc-familles-section` (Faire courir / Jeu Pivot / Isoler)
- [ ] Chaque card affiche : nom famille en couleur distinctive, valeur efficacité possession en grand (Bebas Neue ≥ 2rem), métriques secondaires (nb tirs, nb buts, n= possessions), barre de progression colorée
- [ ] La barre de progression est verte si `eff >= moy. saison`, rouge si en dessous, grise si < 3 matchs saison
- [ ] Si une famille a 0 possession sur ce match, sa card est grisée (opacity 0.45) avec le texte "Non utilisé ce match"
- [ ] Si couverture < 80%, un bandeau d'avertissement ambre s'affiche au-dessus des 3 cards
- [ ] Sur tablette (viewport 768px–850px), les 3 cards s'empilent verticalement (1 colonne)
- [ ] `computeEncStats(matchData, false)` retourne une Map avec les 4 familles — vérifiable en console
- [ ] `logEncFamillesInconnues(matchData)` est appelé — les clés inconnues apparaissent dans la console
- [ ] `updateAnalysePage()` n'a pas de régression : `generateResume3Points`, `generateIndicateurs`, `drawTimeline`, `findMomentsCles` fonctionnent toujours
- [ ] Le `?v=` est bumped dans le HTML sur tous les fichiers modifiés

---

## Hors scope

- Expand/collapse du tableau détail (A-02)
- Badge Force/Faiblesse (A-03)
- Gestion de la carte "Autre" (non affichée dans le grid, seulement dans les données internes)

---

## Dépend de

- **A-00** — `getEncFamille()`, `ENC_FAMILLE_MAP`, `logEncFamillesInconnues()`, `computeEncCoverage()` doivent être implémentés et le mapping validé avec le coach

---

*Story A-01 — pipeline BMAD FENIX — Scrum Master 2026-06-17*

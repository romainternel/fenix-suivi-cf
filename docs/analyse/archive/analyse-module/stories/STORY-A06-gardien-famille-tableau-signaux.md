# STORY A-06 — Gardien × famille adverse — tableau + signaux

**Sprint :** 4
**Taille :** M (1 journée)
**Priorité :** Haute — besoin #4 du coach (F-04)

---

## User Story

En tant que **co-coach FENIX**,
je veux voir un tableau compact indiquant le pourcentage d'arrêts de notre gardien face à chaque type de système adverse (Faire courir / Jeu Pivot / Isoler), avec un signal visuel clair (ALERTE / BON / neutre) basé sur sa moyenne saison —
afin de préparer une stratégie défensive ciblée avant le prochain match.

---

## Contexte technique

**Fichiers modifiés :**
- `js/page-analyse.js` — ajout de `computeGbEncStats()`, `_computeGbMoyenneSaison()`, `renderGardienEncSection()`, `_onGardienChange()`
- `css/style.css` — ajout des classes `.enc-gardien-layout`, `.enc-gardien-header`, `.enc-gardien-select-label`, `.enc-gardien-global`, `.enc-gardien-row`, `.enc-gardien-total`, `.enc-signal-alerte`, `.enc-signal-bon`, `.enc-signal-neutre`
- `FENIX-HANDBALL-CF-SUIVI.html` — ajout de `<div class="section" id="enc-gardien-section">` + bump `?v=`

**Élément HTML à insérer :**

```html
<!-- Après #enc-bascule-section et avant #moments-cles -->
<div class="section" id="enc-gardien-section">
  <!-- Injecté par renderGardienEncSection() -->
</div>
```

**Appel depuis `updateAnalysePage()` :**

```javascript
// F-04 — Gardien × famille adverse
_gardienFamilleFilter = null;  // Reset filtre à chaque changement de match
_gardienSelected = null;       // Reset sélection gardien
renderGardienEncSection(matchData);
```

**Données utilisées :**
- `COLS.club` (2) → filtre `!== 'FENIX'` (attaques adverses)
- `COLS.gardien` (10) → nom du gardien FENIX en jeu (sur les lignes adversaires)
- `COLS.finalite` (8) → `'Tir arrêté'` (arrêts), `'But'` (buts adverses)
- `COLS.enclenchement` (9) → famille via `getEncFamille()` (A-00)
- `MATCHS[]` → liste matchs pour la moyenne saison

---

## Règles métier (F-04)

| Signal | Condition | Affichage |
|--------|-----------|-----------|
| ALERTE (rouge) | `% arrêts ce match < (moy. saison - 15 pts)` | Fond #FEE2E2, texte "ALERTE" #DC2626 |
| BON (vert) | `% arrêts ce match > (moy. saison + 10 pts)` | Fond #D1FAE5, texte "BON" #059669 |
| NEUTRE | Dans l'intervalle [moy-15, moy+10] | Fond transparent, "—" #64748B |
| Volume insuffisant | `tirs < 3` | "(n<3)" italique #94A3B8 |
| Pas de référence | `matchCount < 3` | "—" gris, note sous tableau |

Gardien affiché par défaut : celui avec le plus de tirs subis (le dernier actif).
Sélecteur de gardien affiché uniquement si ≥ 2 gardiens ont joué dans le match.

---

## Implémentation

### Fonction `computeGbEncStats(matchData)`

```javascript
/**
 * Calcule les stats gardien × famille adverse pour un match.
 * @param {Array} matchData
 * @returns {Map<string, Map<string, {arrets, tirs, pct}>>}
 *   Clé externe : nom gardien · Clé interne : famille
 */
function computeGbEncStats(matchData) {
    const advRows = matchData.filter(r => r[COLS.club] !== 'FENIX');
    const FAMILLES = ['Faire courir', 'Jeu Pivot', 'Isoler', 'Autre'];
    const byGardien = new Map();

    advRows.forEach(r => {
        const gardien = (r[COLS.gardien] || '').toString().trim();
        if (!gardien) return;

        if (!byGardien.has(gardien)) {
            const famMap = new Map();
            FAMILLES.forEach(f => famMap.set(f, { arrets: 0, tirs: 0, pct: 0 }));
            byGardien.set(gardien, famMap);
        }

        const famille = getEncFamille(r[COLS.enclenchement]);
        const s = byGardien.get(gardien).get(famille);

        const estArret = r[COLS.finalite] === 'Tir arrêté';
        const estBut   = r[COLS.finalite] === 'But' || r[COLS.resultat] === 'But';

        if (estArret)    { s.arrets++; s.tirs++; }
        else if (estBut) { s.tirs++; }
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

### Fonction `_computeGbMoyenneSaison(gardienName)`

```javascript
/**
 * Moyenne % arrêts du gardien sur toute la saison.
 * @returns {number|null} null si < 3 matchs
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
```

### Fonction `renderGardienEncSection(matchData)` — structure du tableau

Voir ARCH section 2.4 pour l'implémentation complète (rendu HTML + sélecteur gardien + appel heatmap).

Points clés :
- Auto-sélection du gardien avec le plus de tirs
- Construction des 5 colonnes : Système adverse · Tirs · Arr. · % arr. · Signal
- Ligne Total en bas
- Note "Min. 3 matchs pour calculer les signaux" si pas de référence saison
- Appel à `_renderGardienHeatmap(matchData, null)` en fin pour le canvas vide initial (A-07)

### CSS à ajouter dans le bloc `/* MODULE ANALYSE */`

```css
.enc-gardien-layout {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  align-items: flex-start;
}
@media (max-width: 768px) {
  .enc-gardien-layout { flex-direction: column; }
}
.enc-gardien-layout .table-container { flex: 1; }
#enc-gardien-heatmap { flex: 0 0 200px; }

.enc-gardien-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}
.enc-gardien-select-label {
  font-family: Inter, sans-serif;
  font-weight: 700;
  font-size: 0.72rem;
  text-transform: uppercase;
  color: #64748B;
}
.enc-gardien-global {
  font-family: Inter, sans-serif;
  font-size: 0.82rem;
  color: var(--fenix-dark, #0F172A);
}
.enc-gardien-row { cursor: pointer; }
.enc-gardien-row:hover { background: #F1F5F9; }
.enc-gardien-row.selected {
  background: #EFF6FF;
  border-left: 3px solid var(--enc-couleur, var(--fenix-blue, #0A2463));
}
.enc-gardien-total {
  font-weight: 700;
  background: var(--fenix-gray, #F1F5F9);
  border-top: 2px solid var(--fenix-blue, #0A2463);
}

.enc-signal-alerte {
  background: #FEE2E2;
  color: #DC2626;
  font-family: Inter, sans-serif;
  font-weight: 700;
  font-size: 0.78rem;
  border-radius: 4px;
  padding: 0.15rem 0.3rem;
}
.enc-signal-bon {
  background: #D1FAE5;
  color: #059669;
  font-family: Inter, sans-serif;
  font-weight: 700;
  font-size: 0.78rem;
  border-radius: 4px;
  padding: 0.15rem 0.3rem;
}
.enc-signal-neutre {
  color: #64748B;
  font-family: Inter, sans-serif;
  font-size: 0.78rem;
  text-align: center;
}
```

---

## Critères d'acceptation

- [ ] Après sélection d'un match, la section `#enc-gardien-section` affiche un tableau 5 colonnes : Système adverse · Tirs · Arr. · % arr. · Signal
- [ ] La ligne d'en-tête indique le nom du gardien et son % arrêts global pour ce match
- [ ] Le signal "ALERTE" (rouge) s'affiche pour les familles où `% arrêts < (moy. saison - 15 pts)` ET `tirs >= 3`
- [ ] Le signal "BON" (vert) s'affiche pour les familles où `% arrêts > (moy. saison + 10 pts)` ET `tirs >= 3`
- [ ] Les familles avec `tirs < 3` affichent "(n<3)" sans signal vert/rouge
- [ ] Si `matchCount < 3` pour ce gardien, tous les signaux affichent "—" et une note apparaît sous le tableau
- [ ] Un sélecteur `<select>` s'affiche uniquement si ≥ 2 gardiens ont joué dans le match — changer de gardien met à jour le tableau
- [ ] Les familles avec 0 tirs sur ce match sont masquées (ligne absente du tableau)
- [ ] La ligne "Total" affiche les cumuls corrects et est en gras
- [ ] Le `?v=` est bumped dans le HTML

---

## Hors scope

- Heatmap filtrée par famille (A-07)
- Comparaison gardien match N vs N-1 (R2 de l'audit)

---

## Dépend de

- **A-00** — `getEncFamille()`
- Variables globales `_gardienSelected`, `_gardienFamilleFilter` déclarées dans A-00

---

*Story A-06 — pipeline BMAD FENIX — Scrum Master 2026-06-17*

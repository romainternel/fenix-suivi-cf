# STORY A-07 — Gardien × famille — filtre heatmap zones

**Sprint :** 4
**Taille :** S (½ journée)
**Priorité :** Moyenne — complète F-04 avec le filtre visuel zones de tir

---

## User Story

En tant que **co-coach FENIX**,
je veux, en cliquant sur une ligne du tableau gardien, voir instantanément la heatmap des zones de tir filtrée sur ce système adverse uniquement —
afin de voir d'où tire l'adversaire quand il utilise ce système et où notre gardien est le plus en difficulté.

---

## Contexte technique

**Fichiers modifiés :**
- `js/page-analyse.js` — ajout de `_renderGardienHeatmap()`, `_drawMiniZoneCanvas()`, `_onGardienFamilleClick()`
- `css/style.css` — ajout de `.enc-filter-reset`
- `FENIX-HANDBALL-CF-SUIVI.html` — bump `?v=` uniquement (le `<div id="enc-gardien-heatmap">` est créé dynamiquement par `renderGardienEncSection()` dans A-06)

**Placement :** Le canvas mini heatmap est injecté dans `<div id="enc-gardien-heatmap">` à l'intérieur du layout flex de `renderGardienEncSection()`. Le `<div>` existe dans le DOM après A-06 est exécuté.

**Données utilisées :**
- `COLS.club` (2), `COLS.finalite` (8), `COLS.gardien` (10), `COLS.field_position` (12), `COLS.enclenchement` (9)
- `_gardienSelected` (global, mis à jour dans A-06)
- `_gardienFamilleFilter` (global, null = tous les tirs)

**Grille zones 3×3 :**

| HG | HC | HD |
|----|----|----|
| MG | MC | MD |
| BG | BC | BD |

Clés attendues dans `COLS.field_position` : `'HG'`, `'HC'`, `'HD'`, `'MG'`, `'MC'`, `'MD'`, `'BG'`, `'BC'`, `'BD'`.

---

## Implémentation

### Fonction `_renderGardienHeatmap(matchData, familleFilter)`

```javascript
/**
 * Réoriente le canvas zones de but sur les tirs adverses filtrés.
 * @param {Array} matchData - Lignes du match
 * @param {string|null} familleFilter - Famille à filtrer, null = toutes
 */
function _renderGardienHeatmap(matchData, familleFilter) {
    const heatmapContainer = document.getElementById('enc-gardien-heatmap');
    if (!heatmapContainer) return;

    let advRows = matchData.filter(r =>
        r[COLS.club] !== 'FENIX' &&
        (r[COLS.finalite] === 'But' || r[COLS.finalite] === 'Tir arrêté') &&
        (r[COLS.gardien] || '').toString().trim() === _gardienSelected
    );

    if (familleFilter) {
        advRows = advRows.filter(r => getEncFamille(r[COLS.enclenchement]) === familleFilter);
    }

    const titre = familleFilter
        ? `Zones adverses — ${familleFilter} (${advRows.length} tirs)`
        : `Zones adverses (tous systèmes — ${advRows.length} tirs)`;

    const resetBtn = familleFilter
        ? `<button onclick="_onGardienFamilleClick(null)" class="enc-filter-reset">
             Tout afficher
           </button>`
        : '';

    heatmapContainer.innerHTML = `
      <div style="font-size:0.75rem;color:#64748B;margin-bottom:0.4rem;">${titre}</div>
      ${resetBtn}
      <canvas id="enc-gardien-canvas" width="180" height="200"></canvas>`;

    _drawMiniZoneCanvas('enc-gardien-canvas', advRows);
}
```

### Fonction `_drawMiniZoneCanvas(canvasId, rows)`

```javascript
/**
 * Dessine le mini canvas 3×3 zones de but.
 * Rouge = buts adverses · Vert = tirs arrêtés
 */
function _drawMiniZoneCanvas(canvasId, rows) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ZONE_MAP = {
        'HG': 0, 'HC': 1, 'HD': 2,
        'MG': 3, 'MC': 4, 'MD': 5,
        'BG': 6, 'BC': 7, 'BD': 8,
    };

    const counts = new Array(9).fill(0);
    const buts   = new Array(9).fill(0);

    rows.forEach(r => {
        const zone = (r[COLS.field_position] || '').toString().trim().toUpperCase();
        const idx  = ZONE_MAP[zone];
        if (idx !== undefined) {
            counts[idx]++;
            if (r[COLS.finalite] === 'But') buts[idx]++;
        }
    });

    const cw = canvas.width, ch = canvas.height - 20;
    const cellW = cw / 3, cellH = ch / 3;
    const maxCount = Math.max(...counts, 1);

    for (let i = 0; i < 9; i++) {
        const col = i % 3, row = Math.floor(i / 3);
        const x = col * cellW, y = row * cellH;
        const intensity = counts[i] / maxCount;
        const isBut = buts[i] > 0;

        ctx.fillStyle = isBut
            ? `rgba(220, 38, 38, ${0.15 + intensity * 0.5})`
            : `rgba(16, 185, 129, ${0.1 + intensity * 0.3})`;
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellW, cellH);

        if (counts[i] > 0) {
            ctx.fillStyle = '#0F172A';
            ctx.font = '700 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${counts[i]}`, x + cellW / 2, y + cellH / 2 + 4);
        }
    }

    // Légende
    ctx.fillStyle = '#64748B';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('But = rouge · Arrêt = vert', 2, ch + 14);
}
```

### Fonction `_onGardienFamilleClick(famille)`

```javascript
/**
 * Toggle du filtre famille → heatmap.
 * null = réinitialiser le filtre
 */
function _onGardienFamilleClick(famille) {
    _gardienFamilleFilter = (_gardienFamilleFilter === famille) ? null : famille;

    const matchFilter = document.getElementById('filter-analyse-match')?.value;
    if (!matchFilter) return;
    const matchData = DATA.filter(r => r[COLS.rencontre] === matchFilter);

    // Mettre à jour seulement la heatmap + les classes selected (pas tout le DOM)
    _renderGardienHeatmap(matchData, _gardienFamilleFilter);

    document.querySelectorAll('.enc-gardien-row').forEach(tr => {
        const familleInOnclick = tr.getAttribute('onclick') || '';
        const isSelected = _gardienFamilleFilter &&
                           familleInOnclick.includes(`'${_gardienFamilleFilter}'`);
        tr.classList.toggle('selected', !!isSelected);
    });
}
```

### CSS à ajouter dans le bloc `/* MODULE ANALYSE */`

```css
.enc-filter-reset {
  background: transparent;
  border: 1px solid #CBD5E1;
  border-radius: 4px;
  color: #64748B;
  font-family: Inter, sans-serif;
  font-size: 0.72rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  margin-bottom: 0.4rem;
  display: block;
}
.enc-filter-reset:hover {
  background: #F1F5F9;
  color: var(--fenix-blue, #0A2463);
}
```

---

## Critères d'acceptation

- [ ] À l'affichage initial (sans filtre), le canvas `#enc-gardien-canvas` montre la heatmap de TOUS les tirs adverses sur ce gardien pour ce match
- [ ] Clic sur une ligne du tableau (famille) filtre le canvas sur cette famille uniquement — le titre du canvas change en "Zones adverses — [Famille] (N tirs)"
- [ ] La ligne sélectionnée dans le tableau passe en fond bleu clair (`.enc-gardien-row.selected`)
- [ ] Un second clic sur la même ligne réinitialise le filtre (tous les tirs à nouveau)
- [ ] Le bouton "Tout afficher" (visible quand un filtre est actif) réinitialise le filtre
- [ ] Les zones avec des buts adverses sont en rouge, les zones d'arrêts en vert — intensité proportionnelle au volume
- [ ] Le chiffre dans chaque case indique le nombre total de tirs sur cette zone
- [ ] Si 0 tirs adverses pour ce gardien, le canvas est vide mais ne crash pas
- [ ] Changer de gardien via le sélecteur (A-06) réinitialise le filtre famille et met à jour le canvas
- [ ] Le `?v=` est bumped dans le HTML

---

## Hors scope

- Distinction haut/bas/gauche/droite dans chaque zone (niveau de détail R3)
- Affichage des noms de zone sur le canvas
- Intégration avec le canvas impact zones existant de la page principale (si trop complexe, `_drawMiniZoneCanvas()` autonome est la solution retenue per ARCH R6)

---

## Dépend de

- **A-00** — `getEncFamille()`
- **A-06** — `renderGardienEncSection()` qui crée le `<div id="enc-gardien-heatmap">` dans le DOM et appelle `_renderGardienHeatmap()` initialement

---

*Story A-07 — pipeline BMAD FENIX — Scrum Master 2026-06-17*

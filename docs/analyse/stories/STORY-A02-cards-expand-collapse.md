# STORY A-02 — Cards familles — expand/collapse tableau détail

**Sprint :** 2
**Taille :** S (½ journée)
**Priorité :** Haute — complète l'expérience Bite → Snack de F-01b

---

## User Story

En tant que **coach FENIX**,
je veux, après avoir cliqué sur une family card, voir le détail de chaque enclenchement appartenant à cette famille — avec le nombre de tirs, buts et efficacité par enclenchement —
afin de savoir quel mouvement précis a fonctionné ou échoué dans la famille sélectionnée.

---

## Contexte technique

**Fichiers modifiés :**
- `js/page-analyse.js` — ajout de `_buildEncDetailTable()` et `_toggleEncDetail()`
- `css/style.css` — ajout des classes `.enc-detail-toggle`, `.enc-detail-panel`, `.enc-detail-table`, `.enc-detail-total`, `.enc-famille-card.expanded`
- `FENIX-HANDBALL-CF-SUIVI.html` — bump `?v=` uniquement

**Dépendance directe :** Les fonctions sont intégrées dans le HTML généré par `renderEncFamillesSection()` (A-01). Il suffit d'ajouter les fonctions `_buildEncDetailTable()` et `_toggleEncDetail()` dans `page-analyse.js`.

**Données utilisées :**
- Mêmes colonnes que A-01 : `COLS.enclenchement` (9), `COLS.resultat` (6), `COLS.club` (2)
- Regroupement par clé enclenchement (`encStr.split(';')[0].trim()`) dans la famille sélectionnée
- Tri par nombre de tirs décroissant

---

## Implémentation

### 1. Fonction `_buildEncDetailTable(matchData, famille)`

```javascript
/**
 * Construit le tableau HTML de détail F-01b pour une famille.
 * Appelée depuis renderEncFamillesSection() dans le template de chaque card.
 */
function _buildEncDetailTable(matchData, famille) {
    const rows = matchData.filter(r =>
        r[COLS.club] === 'FENIX' &&
        getEncFamille(r[COLS.enclenchement]) === famille
    );

    const byEnc = new Map();
    rows.forEach(r => {
        const enc = (r[COLS.enclenchement] || '').toString();
        const cle = enc.split(';')[0].trim() || 'Inconnu';
        const parts = enc.split(';');
        // Libellé : partie 2 si disponible, sinon clé
        const label = parts.length >= 3 ? parts[2].trim()
                    : parts.length >= 1  ? parts[0].trim()
                    : cle;
        if (!byEnc.has(cle)) byEnc.set(cle, { label, tirs: 0, buts: 0 });
        const s = byEnc.get(cle);
        if (r[COLS.resultat] === 'But')       { s.buts++; s.tirs++; }
        else if (r[COLS.resultat] === 'Tir raté') { s.tirs++; }
    });

    if (byEnc.size === 0) return '<p style="color:#94A3B8;font-size:0.82rem;">Aucune donnée.</p>';

    // Trier par tirs décroissants
    const sorted = [...byEnc.entries()].sort((a, b) => b[1].tirs - a[1].tirs);

    let totalTirs = 0, totalButs = 0;
    sorted.forEach(([, s]) => { totalTirs += s.tirs; totalButs += s.buts; });
    const totalEff = totalTirs > 0 ? Math.round(totalButs / totalTirs * 100) : 0;

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
      <thead><tr>
        <th style="text-align:left">Enclenchement</th>
        <th>Tirs</th><th>Buts</th><th>Eff.</th>
      </tr></thead>
      <tbody>${lignes}</tbody>
      <tfoot>
        <tr class="enc-detail-total">
          <td>Total famille</td>
          <td>${totalTirs}</td><td>${totalButs}</td><td>${totalEff}%</td>
        </tr>
      </tfoot>
    </table>`;
}
```

### 2. Fonction `_toggleEncDetail(familleId)`

```javascript
/**
 * Toggle expand/collapse du panneau de détail d'une card famille.
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
    if (card)  card.classList.toggle('expanded', !isOpen);

    const btn = card?.querySelector('.enc-detail-toggle');
    if (btn) btn.textContent = isOpen ? '▼ Voir le détail' : '▲ Masquer le détail';
}
```

### 3. Intégration dans `renderEncFamillesSection()` (déjà prévu)

Le template de chaque card (généré dans A-01) doit inclure :

```html
<button class="enc-detail-toggle"
        onclick="event.stopPropagation();_toggleEncDetail('${familleId}')">
  ▼ Voir le détail
</button>
<div class="enc-detail-panel" id="enc-detail-${familleId}" style="display:none;">
  ${_buildEncDetailTable(matchData, famille)}
</div>
```

Le `onclick` de la card elle-même appelle aussi `_toggleEncDetail(familleId)`.

### 4. CSS à ajouter dans le bloc `/* MODULE ANALYSE */`

```css
.enc-famille-card.expanded {
  box-shadow: 0 0 0 2px var(--enc-couleur, var(--fenix-blue, #0A2463)), var(--shadow-md, 0 2px 8px rgba(0,0,0,0.1));
}

.enc-detail-toggle {
  background: transparent;
  border: none;
  color: var(--fenix-blue, #0A2463);
  font-family: Inter, sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem 0;
  display: block;
  width: 100%;
  text-align: left;
}
.enc-detail-toggle:hover { text-decoration: underline; }

.enc-detail-panel {
  margin-top: 0.75rem;
  border-top: 1px solid var(--fenix-gray, #F1F5F9);
  padding-top: 0.75rem;
}

.enc-detail-table {
  width: 100%;
  border-collapse: collapse;
  font-family: Inter, sans-serif;
  font-size: 0.82rem;
}
.enc-detail-table thead tr {
  background: var(--fenix-blue, #0A2463);
  color: white;
}
.enc-detail-table th {
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  padding: 0.5rem 0.6rem;
  text-align: center;
}
.enc-detail-table tbody tr:nth-child(odd)  { background: #fff; }
.enc-detail-table tbody tr:nth-child(even) { background: var(--fenix-gray, #F1F5F9); }
.enc-detail-table td { padding: 0.45rem 0.6rem; text-align: center; }

.enc-detail-total {
  font-weight: 700;
  background: #EFF6FF !important;
  border-top: 2px solid var(--fenix-blue, #0A2463);
}
```

---

## Critères d'acceptation

- [ ] Clic sur une card (ou sur le bouton "Voir le détail") ouvre un tableau inline sous la card avec les colonnes : Enclenchement · Tirs · Buts · Eff.
- [ ] Le tableau est trié par tirs décroissants
- [ ] Une ligne "Total famille" en gras est présente en bas du tableau
- [ ] La colonne Eff. est colorée : verte si ≥ 60%, rouge si < 40%, grise sinon
- [ ] Un second clic sur la card (ou sur "Masquer le détail") ferme le panneau
- [ ] Le caret de la card passe de ▼ à ▲ quand le panneau est ouvert
- [ ] Si la famille n'a qu'un seul enclenchement, le tableau s'affiche correctement (1 ligne + Total — valeurs identiques, acceptable)
- [ ] Si `matchData` ne contient aucune ligne FENIX pour cette famille, le panneau affiche "Aucune donnée." sans crash
- [ ] Le `?v=` est bumped dans le HTML

---

## Hors scope

- Badge Force/Faiblesse dans la card (A-03)
- Animation CSS de type `max-height` transition (simple `display:none/block` suffit pour la V1)
- Affichage de la famille "Autre" dans le tableau (non priorisé)

---

## Dépend de

- **A-00** — `getEncFamille()`
- **A-01** — `renderEncFamillesSection()` qui génère le HTML de la card et appelle `_buildEncDetailTable()` et `_toggleEncDetail()`

---

*Story A-02 — pipeline BMAD FENIX — Scrum Master 2026-06-17*

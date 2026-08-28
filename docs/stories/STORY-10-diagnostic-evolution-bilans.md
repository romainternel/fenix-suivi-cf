# STORY-10 — Diagnostic automatique d'évolution entre deux bilans (↑↓)

**En tant que** joueur,  
**Je veux** voir automatiquement si j'ai progressé ou régressé par rapport à la période précédente,  
**Afin de** savoir objectivement si ma forme actuelle va dans le bon sens.

## Contexte technique
- Fichier : `js/player-mode.js`
- Div `#pmf-diagnostic` créé par STORY-09 — cette story l'alimente
- Nouvelles fonctions :
  ```javascript
  function _computeBilanAvgTotal(nom, bilanMatchs, isGB)  // → number | null
  function renderPmfDiagnostic(nom, bilanNom)             // → injecte dans #pmf-diagnostic
  ```

**`_computeBilanAvgTotal(nom, bilanMatchs, isGB)` :**
```javascript
// Pour chaque match de bilanMatchs où le joueur a des actions :
// calculer son TOTAL (même logique que renderPmfGraph)
// Retourner la moyenne, ou null si < 2 matchs avec données
```
Pour joueur de champ : TOTAL = (ATT+ - ATT-) + (DEF+ - DEF-)  
Pour GB : TOTAL = Score zone-pondéré (réutiliser `calculateGardienNotes` si disponible, sinon arrêts - buts×0.5)

**`renderPmfDiagnostic(nom, bilanNom)` :**
```javascript
if (!bilanNom) { el.innerHTML = ''; return; }
const bIdx = BILANS.findIndex(b => b.nom === bilanNom);
if (bIdx <= 0) { el.innerHTML = ''; return; }   // premier bilan = pas de précédent
const curr = _computeBilanAvgTotal(nom, BILANS[bIdx].matchs,   isGB);
const prev = _computeBilanAvgTotal(nom, BILANS[bIdx-1].matchs, isGB);
if (curr === null || prev === null) { el.innerHTML = ''; return; }
const delta = +(curr - prev).toFixed(1);
// delta >= +0.5 → ↑ vert, delta <= -0.5 → ↓ rouge, sinon = gris
```

**Appelée dans `pmfSetPeriod()` (STORY-09)** après rechargement du graph.  
**Appelée dans `renderPlayerFiche()`** au premier rendu si `_pmfPeriodFilter` est déjà défini.

## Critères d'acceptation
- [ ] Sélectionner le 2e bilan ou suivant → indicateur ↑ ou ↓ ou = affiché sous le titre du graph
- [ ] Sélectionner le 1er bilan (pas de précédent) → aucun indicateur
- [ ] Sélectionner "Toute la saison" → aucun indicateur
- [ ] Delta ≥ +0.5 → "↑ +X.X pts vs période préc." en vert (#10B981)
- [ ] Delta ≤ -0.5 → "↓ -X.X pts vs période préc." en rouge (#EF4444)
- [ ] |Delta| < 0.5 → "= Stable vs période préc." en gris (#64748B)
- [ ] Si données insuffisantes (< 2 matchs sur un bilan) → aucun indicateur (pas d'erreur JS)
- [ ] Fonctionne pour joueurs de champ ET gardiens

## Hors scope
- Pas d'historique multi-bilans (juste bilan N vs bilan N-1)
- Pas de graphique comparatif entre bilans

## Dépend de
- **STORY-09** (div `#pmf-diagnostic` et `pmfSetPeriod()` doivent exister)

## Taille
M

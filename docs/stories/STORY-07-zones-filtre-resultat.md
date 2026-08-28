# STORY-07 — Filtrer les zones de tir par résultat (Tout / Buts / Ratés)

**En tant que** joueur,  
**Je veux** choisir d'afficher uniquement mes buts ou uniquement mes tirs ratés sur les zones,  
**Afin de** repérer où je suis efficace et où je dois progresser.

## Contexte technique
- Fichier : `js/player-mode.js`
- Fonction à modifier : `renderPlayerZones()` — ligne ~953
- Nouvelle variable globale (module-level) : `let _pmzResultFilter = '';  // '' | 'pos' | 'neg'`
- Nouvelle fonction : `setPmzFilter(type)` — toggle + appel `renderPlayerZones()`

**Logique de filtrage** (à insérer dans `renderPlayerZones()` avant `_drawImpactCanvas`) :
```javascript
const isGB = detectIsGB(nom);
const filteredRows = _pmzResultFilter === 'pos'
    ? impactRows.filter(r => isGB ? r[COLS.finalite]==='Tir arrêté' : r[COLS.resultat]==='But')
    : _pmzResultFilter === 'neg'
    ? impactRows.filter(r => isGB ? r[COLS.finalite]!=='Tir arrêté' : r[COLS.resultat]==='Tir raté')
    : impactRows;
```

**HTML buttons** à injecter dans `content.innerHTML` (dans `renderPlayerZones()`), sous le titre de la card :
```html
<div class="pmz-filter-bar" style="display:flex;gap:8px;margin-bottom:12px">
  <button class="pmz-btn ..." onclick="setPmzFilter('')">Tout</button>
  <button class="pmz-btn ..." onclick="setPmzFilter('pos')">[Buts / Arrêts]</button>
  <button class="pmz-btn ..." onclick="setPmzFilter('neg')">[Ratés / Buts encaissés]</button>
</div>
```
Labels adaptés selon `isGB` : "Arrêts" et "Buts encaissés" pour les gardiens.

**Style boutons** (à ajouter dans `css/style.css`) :
```css
.pmz-btn { padding:6px 14px; border-radius:20px; border:1.5px solid #CBD5E1; background:white; font-size:0.8rem; font-weight:600; cursor:pointer; color:#475569; }
.pmz-btn.pmz-active { background:#0A2463; border-color:#0A2463; color:white; }
```

**Recalcul des stats header** (nb tirs, %) selon `filteredRows`.

## Critères d'acceptation
- [ ] Boutons "Tout" / "Buts" / "Ratés" visibles sous le titre dans l'onglet Zones
- [ ] Tap "Buts" → seuls les ● verts dessinés sur les canvas, stat header recalculée
- [ ] Tap "Ratés" → seuls les ✕ rouges dessinés sur les canvas, stat header recalculée
- [ ] Tap sur le bouton actif → revient à "Tout"
- [ ] Pour un GB : labels "Arrêts" et "Buts encaissés" (pas "Buts" et "Ratés")
- [ ] Changer d'onglet et revenir → filtre réinitialisé à "Tout"
- [ ] Aucune régression sur l'onglet Stats Match (zones de tir match non affectées)

## Hors scope
- Pas de filtre résultat dans l'onglet Stats Match (seulement dans Zones)
- Pas de filtre par zone combiné dans cette story

## Dépend de
- Aucune

## Taille
M

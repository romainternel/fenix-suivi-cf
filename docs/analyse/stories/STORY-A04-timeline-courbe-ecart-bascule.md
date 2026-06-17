# STORY A-04 — Timeline — courbe d'écart + détection bascule

**Sprint :** 3
**Taille :** M (1 journée)
**Priorité :** Haute — besoin critique #1 du coach (F-03 partie canvas)

---

## User Story

En tant que **coach FENIX**,
je veux voir sur la timeline du match une courbe visuelle montrant l'évolution de l'écart de score (FENIX - ADV) avec une zone rouge quand on est derrière et un marqueur "BASCULE" au moment exact du retournement —
afin de localiser visuellement en moins de 10 secondes le moment où le match a changé de sens.

---

## Contexte technique

**Fichiers modifiés :**
- `js/page-analyse.js` — ajout de `detectBasculeMoment()` et `drawMomentumOverlay()`, modification de `drawTimeline()` (fix Bug #8 + appel overlay en fin de fonction)
- `FENIX-HANDBALL-CF-SUIVI.html` — bump `?v=` uniquement (pas de nouvel élément HTML — le canvas est existant)

**Fonction existante modifiée — `drawTimeline(matchName, matchData)` :**
- Lignes 233–238 : ajout du fix Bug #8 (`requestAnimationFrame` si `clientWidth === 0`)
- Fin de la fonction (après la légende existante) : appels `drawMomentumOverlay()` et `renderBasculContext()` (A-05)

**Données utilisées :**
- `scoreHistory[]` — tableau `{pos, fenix, adv}` déjà construit dans `drawTimeline()` (variable locale ligne ~259)
- `ctx` — contexte canvas 2D déjà existant
- `canvas` — élément `#timeline-canvas` déjà existant
- `padding` — objet `{ top: 40, right: 30, bottom: 40, left: 45 }` déjà déclaré dans `drawTimeline()`

**Contrainte critique :** `drawMomentumOverlay()` est appelée APRÈS tout le dessin existant. Les lignes de dessin existantes (scores bleu/rouge) ne sont PAS modifiées. Utilisation de `ctx.save()` / `ctx.restore()` pour ne pas altérer l'état du contexte.

---

## Implémentation

### 1. Fix Bug #8 dans `drawTimeline()`

Modifier les premières lignes de `drawTimeline()` (lignes 233–238 actuelles) :

```javascript
function drawTimeline(matchName, matchData) {
    const canvas = document.getElementById('timeline-canvas');
    const container = canvas.parentElement;

    // Fix Bug #8 — canvas.clientWidth = 0 si le layout n'est pas terminé
    if (container.clientWidth === 0) {
        requestAnimationFrame(() => drawTimeline(matchName, matchData));
        return;
    }

    canvas.width  = container.clientWidth;
    canvas.height = container.clientHeight;
    // ... reste de la fonction inchangé ...
```

### 2. Fonction `detectBasculeMoment(scoreHistory)`

```javascript
/**
 * Détecte le moment bascule dans l'historique de score.
 * Deux passes :
 *   Passe 1 : premier croisement zéro défavorable (diff passe de >= 0 à < 0)
 *   Passe 2 : creux minimum de diff (argmin)
 * Retourne le croisement si trouvé, sinon le creux.
 *
 * @param {Array<{pos, fenix, adv}>} scoreHistory
 * @returns {{ index: number, avant: number, apres: number } | null}
 *   null si FENIX mène du début à la fin (aucune bascule)
 */
function detectBasculeMoment(scoreHistory) {
    if (!scoreHistory || scoreHistory.length < 2) return null;

    const diffs = scoreHistory.map(p => p.fenix - p.adv);

    // Passe 1 : premier croisement zéro défavorable
    let crossingIdx = -1;
    for (let i = 1; i < diffs.length; i++) {
        if (diffs[i - 1] >= 0 && diffs[i] < 0) {
            crossingIdx = i;
            break;
        }
    }

    // Passe 2 : creux minimum (en ignorant le point initial 0-0)
    let minDiff = 0, minIdx = -1;
    for (let i = 1; i < diffs.length; i++) {
        if (diffs[i] < minDiff) {
            minDiff = diffs[i];
            minIdx = i;
        }
    }

    if (crossingIdx === -1 && minIdx === -1) return null;

    const idx = crossingIdx !== -1 ? crossingIdx : minIdx;
    return {
        index: idx,
        avant: diffs[idx - 1] !== undefined ? diffs[idx - 1] : 0,
        apres: diffs[idx]
    };
}
```

### 3. Fonction `drawMomentumOverlay(ctx, scoreHistory, canvas, padding, roundedMax, maxPos)`

Voir ARCH section 2.3 pour l'implémentation complète.

Points clés de l'algorithme :
1. Calculer `diffs[]` et `maxAbsDiff`
2. Mapping Y : axe zéro à mi-hauteur du graphe, `diffToY(d) = midY - (d / maxAbsDiff) * (graphHeight/2) * 0.8`
3. Dessiner les zones colorées (vert translucide si diff > 0, rouge si diff < 0) AVANT la courbe
4. Dessiner la ligne zéro en tirets gris (#94A3B8, lineWidth 1)
5. Dessiner la courbe d'écart (gold #F59E0B, lineWidth 2, continue)
6. Appeler `detectBasculeMoment(scoreHistory)` → stocker dans `_lastBasculeResult`
7. Si bascule détectée : ligne verticale pointillée gold + label "BASCULE" avec fond blanc + triangle au creux
8. `ctx.save()` au début, `ctx.restore()` à la fin

### 4. Appels en fin de `drawTimeline()`

Ajouter avant le dernier `}` de la fonction :

```javascript
// === F-03 — Overlay momentum (APRÈS tout le dessin existant) ===
drawMomentumOverlay(ctx, scoreHistory, canvas, padding, roundedMax, maxPos);
renderBasculContext(matchData, _lastBasculeResult);  // implémenté dans A-05
```

Note : `scoreHistory`, `ctx`, `canvas`, `padding`, `roundedMax`, `maxPos` sont toutes des variables déjà déclarées dans le corps de `drawTimeline()` — aucune variable globale nécessaire.

---

## CSS

Aucun nouveau CSS requis pour cette story (tout se passe sur canvas). Le CSS de la section contextuelle est dans A-05.

---

## Critères d'acceptation

- [ ] Sur un match où FENIX a été mené à un moment, une courbe gold (orange) est visible superposée sur le canvas timeline existant, représentant l'écart de score point par point
- [ ] Les zones où FENIX est devant (diff > 0) sont colorées en vert translucide sur le canvas
- [ ] Les zones où FENIX est derrière (diff < 0) sont colorées en rouge translucide sur le canvas
- [ ] Sur un match avec bascule, une ligne verticale pointillée gold et le label "BASCULE" sont visibles sur le canvas
- [ ] Le dessin existant (courbes score bleu/rouge, axes, labels) n'est pas altéré
- [ ] Sur un match où FENIX mène du début à la fin, aucun marqueur "BASCULE" n'apparaît sur le canvas
- [ ] Bug #8 fixé : si le canvas avait `clientWidth === 0`, le dessin est différé via `requestAnimationFrame` et s'affiche correctement (tester en rechargement)
- [ ] `detectBasculeMoment([{fenix:1,adv:0,pos:5}, {fenix:1,adv:2,pos:15}])` retourne un objet avec `index: 1` (testable en console)
- [ ] `detectBasculeMoment([{fenix:2,adv:0,pos:5}, {fenix:4,adv:1,pos:20}])` retourne `null` (FENIX mène toujours)
- [ ] Le `?v=` est bumped dans le HTML

---

## Hors scope

- Section contextuelle "Pendant ce moment" (A-05)
- Gestion du cas où `scoreHistory[]` est vide (la fonction retourne `null` proprement)
- Affichage de la période MT1/MT2 sur la courbe d'écart (non demandé en V1)

---

## Dépend de

- **A-00** — `getEncFamille()` (utilisé par `renderBasculContext()` appelé juste après)
- `drawTimeline()` existante — doit être comprise avant de la modifier (lire les lignes 233–387 de `page-analyse.js`)

---

## Risque principal

**R2 (Arch) — Régression sur `drawTimeline()` :**
Mitigation : `drawMomentumOverlay()` est appelée APRÈS tout le dessin existant, wrappée dans `ctx.save()/restore()`. Si régression constatée, commenter les 2 lignes d'appel ajoutées pour revenir à l'état antérieur sans autre diff.

Tester sur 3 matchs de référence : 1 victoire, 1 défaite, 1 match sans bascule.

---

*Story A-04 — pipeline BMAD FENIX — Scrum Master 2026-06-17*

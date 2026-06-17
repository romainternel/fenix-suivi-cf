# STORY A-05 — Timeline — section contextuelle "Pendant ce moment"

**Sprint :** 3
**Taille :** S (½ journée)
**Priorité :** Haute — complète F-03 en répondant au "pourquoi" de la bascule

---

## User Story

En tant que **coach FENIX**,
je veux voir, sous la timeline, un résumé des enclenchements utilisés par l'adversaire et par FENIX pendant le moment de bascule —
afin de comprendre la cause tactique du retournement (quel système adverse a percé ? quel système FENIX a échoué ?).

---

## Contexte technique

**Fichiers modifiés :**
- `js/page-analyse.js` — ajout de `renderBasculContext()`
- `css/style.css` — ajout des classes `.enc-bascule-section`, `.enc-bascule-header`, `.enc-bascule-block`, `.enc-bascule-block-title`, `.enc-bascule-row`, `.enc-bascule-none`
- `FENIX-HANDBALL-CF-SUIVI.html` — ajout de `<div id="enc-bascule-section">` + bump `?v=`

**Élément HTML à insérer :**

```html
<!-- Après le canvas #timeline-canvas (et avant #enc-gardien-section) -->
<div id="enc-bascule-section">
  <!-- Injecté par renderBasculContext() -->
</div>
```

**Données utilisées :**
- `_lastBasculeResult` — global mis à jour par `drawMomentumOverlay()` (A-04) juste avant l'appel à `renderBasculContext()`
- `matchData` — lignes du match, toutes colonnes
- `COLS.club` (2), `COLS.enclenchement` (9), `COLS.resultat` (6)
- Fenêtre temporelle : possessions `[idxBascule - 3, idxBascule + 3]` dans les buts triés
- Réutilise `getSortedGoals(matchData)` de `utils.js` si disponible, sinon adapter

**Logique "pendant ce run" :**
- Prendre les possessions indexées `idx - 3` à `idx + 3` dans les buts triés (bornés au match)
- Soit ~6–7 possessions autour du moment bascule
- Séparer FENIX et adversaire
- Agréger par famille, trier par nombre de possessions décroissant

---

## Implémentation

### Élément HTML

Voir ci-dessus. Le `<div id="enc-bascule-section">` est injecté via `innerHTML` depuis JS.

### Fonction `renderBasculContext(matchData, basculeResult)`

Voir ARCH section 2.3 pour l'implémentation complète.

Résumé de la logique :

```javascript
function renderBasculContext(matchData, basculeResult) {
    const container = document.getElementById('enc-bascule-section');
    if (!container) return;

    // Cas : aucune bascule détectée
    if (!basculeResult) {
        container.innerHTML = `<div class="enc-bascule-none">
          ✓ Aucune bascule détectée — FENIX a mené du début à la fin.
        </div>`;
        return;
    }

    // 1. Identifier les possessions "pendant le run" (fenêtre ±3 autour du bascule)
    // 2. Séparer FENIX et adversaire
    // 3. Agréger par famille (nombre de possessions + buts)
    // 4. Afficher les 2 blocs ("Attaque adverse" et "Attaque FENIX")
    // 5. Marquer la famille adverse avec le max de buts (← MAX)
    //    et les familles FENIX avec 0 but (← ECHEC)
}
```

Indicateurs dans les lignes :
- `← MAX` (gold) : famille adverse avec le plus de buts pendant le run
- `← ECHEC` (rouge) : famille FENIX sans aucun but pendant le run

### CSS à ajouter dans le bloc `/* MODULE ANALYSE */`

```css
.enc-bascule-section {
  background: #FFFBEB;
  border-left: 4px solid var(--fenix-gold, #F59E0B);
  border-radius: 8px;
  padding: 1rem 1.2rem;
  margin-top: 0.75rem;
  margin-bottom: 1rem;
}
.enc-bascule-header {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem;
  color: #92400E;
  margin-bottom: 0.75rem;
}
.enc-bascule-block {
  margin-bottom: 0.75rem;
}
.enc-bascule-block-title {
  font-family: Inter, sans-serif;
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #64748B;
  letter-spacing: 0.5px;
  margin-bottom: 0.35rem;
  padding-bottom: 0.2rem;
  border-bottom: 1px solid #FDE68A;
}
.enc-bascule-row {
  font-family: Inter, sans-serif;
  font-size: 0.82rem;
  color: var(--fenix-dark, #0F172A);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0.2rem 0;
}
.enc-bascule-none {
  background: #D1FAE5;
  color: #059669;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-family: Inter, sans-serif;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
```

---

## Critères d'acceptation

- [ ] Quand un match avec bascule est sélectionné et `_lastBasculeResult` est non null, la section `#enc-bascule-section` affiche le bloc avec fond ambre et titre "BASCULE DÉTECTÉE"
- [ ] La section affiche deux blocs distincts : "ATTAQUE ADVERSE pendant ce run" et "ATTAQUE FENIX pendant ce run"
- [ ] Chaque bloc liste les familles utilisées pendant le run avec le nombre de possessions, le nombre de buts et l'efficacité %
- [ ] La famille adverse avec le maximum de buts est annotée "← MAX" en gold
- [ ] Les familles FENIX sans aucun but pendant le run sont annotées "← ECHEC" en rouge
- [ ] Le titre de la section indique l'écart avant et après : "Score passé de +X à Y"
- [ ] Quand FENIX mène du début à la fin (aucune bascule), la section affiche un bloc vert "Aucune bascule détectée — FENIX a mené du début à la fin"
- [ ] Si `#enc-bascule-section` est absent du HTML, la fonction retourne silencieusement sans crash
- [ ] Le `?v=` est bumped dans le HTML

---

## Hors scope

- Réutilisation du composant `moment-badge` existant (si la structure HTML est trop différente, un style dédié est créé — acceptable)
- Affichage du minutage exact de chaque possession pendant le run
- Bouton "Voir toutes les possessions" drill-down (R3)

---

## Dépend de

- **A-00** — `getEncFamille()`
- **A-04** — `_lastBasculeResult` mis à jour par `drawMomentumOverlay()`, appel à `renderBasculContext()` en fin de `drawTimeline()`

---

*Story A-05 — pipeline BMAD FENIX — Scrum Master 2026-06-17*

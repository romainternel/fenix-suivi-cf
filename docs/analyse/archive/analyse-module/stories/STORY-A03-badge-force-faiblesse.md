# STORY A-03 — Badge Force/Faiblesse dans les cards

**Sprint :** 2
**Taille :** S (½ journée)
**Priorité :** Haute — répond directement au besoin #3 du coach (F-02)

---

## User Story

En tant que **coach FENIX**,
je veux savoir immédiatement si l'efficacité d'une famille d'attaque ce soir est notre performance habituelle ("Force FENIX") ou une faiblesse inhabituelle de l'adversaire ("Faiblesse adverse") —
afin d'éviter de tirer de fausses conclusions tactiques sur nos propres capacités.

---

## Contexte technique

**Fichiers modifiés :**
- `js/page-analyse.js` — ajout de `_buildEncBadge()`
- `css/style.css` — ajout des classes `.enc-badge-force`, `.enc-badge-faiblesse`, `.enc-badge-nodata`, `.enc-badge-sub`
- `FENIX-HANDBALL-CF-SUIVI.html` — bump `?v=` uniquement

**Intégration :** `_buildEncBadge()` est appelée depuis `renderEncFamillesSection()` (déjà prévu dans A-01 — Zone E de la card). Cette story ajoute la fonction et le CSS, pas de modification de la logique de rendu.

**Données utilisées :**
- `sMatch.eff` (efficacité match) et `sMatch.possessions` — issus de `computeEncStats()` (A-01)
- `sSaison.effMoy`, `sSaison.cv`, `sSaison.matchCount` — issus de `computeEncStatsSaison()` (A-01)

---

## Règles métier (F-02)

| Condition | Badge affiché | Priorité |
|-----------|---------------|----------|
| `effMatch / effMoy >= 1.5` ET `possessions >= 5` ET `matchCount >= 3` | Faiblesse adverse (orange) | 1 (prioritaire) |
| `|effMatch - effMoy| / effMoy <= 0.10` ET `cv < 0.20` ET `possessions >= 5` ET `matchCount >= 3` | Force FENIX (vert) | 2 |
| `matchCount < 3` | Message "Min. 3 matchs" (gris) | — (toujours visible si < 3) |
| `possessions < 5` | Aucun badge (volume insuffisant) | — |
| Aucune des conditions ci-dessus | Pas de badge | — |

Un seul badge maximum par card. La priorité Faiblesse adverse > Force FENIX.

---

## Implémentation

### Fonction `_buildEncBadge(sMatch, sSaison)`

```javascript
/**
 * Construit le HTML du badge F-02.
 * @param {{ eff, possessions }} sMatch
 * @param {{ effMoy, cv, matchCount }} sSaison
 * @returns {string} HTML du badge (peut être vide)
 */
function _buildEncBadge(sMatch, sSaison) {
    // Pas de badge si données saison insuffisantes
    if (sSaison.matchCount < 3) {
        return `<div class="enc-badge-nodata">
          ○ Min. 3 matchs pour comparer (${sSaison.matchCount} joué${sSaison.matchCount > 1 ? 's' : ''})
        </div>`;
    }
    // Pas de badge si volume match trop faible
    if (sMatch.possessions < 5) return '';

    const effMoy   = sSaison.effMoy;
    const effMatch = sMatch.eff;

    // Priorité 1 : Faiblesse adverse
    if (effMoy > 0 && effMatch / effMoy >= 1.5) {
        const ecart = effMatch - effMoy;
        return `<div class="enc-badge-faiblesse">
          ⚡ FAIBLESSE ADVERSE
          <div class="enc-badge-sub">Moy. saison : ${effMoy}% · Ce match : ${effMatch}% (+${ecart}%)</div>
        </div>`;
    }

    // Priorité 2 : Force FENIX
    const relDiff = effMoy > 0 ? Math.abs(effMatch - effMoy) / effMoy : 1;
    if (relDiff <= 0.10 && sSaison.cv < 0.20) {
        const ecart = effMatch - effMoy;
        const signe = ecart >= 0 ? '+' : '';
        return `<div class="enc-badge-force">
          ⭐ FORCE FENIX
          <div class="enc-badge-sub">Moy. saison : ${effMoy}% · Ce match : ${effMatch}% (${signe}${ecart}%)</div>
        </div>`;
    }

    return '';
}
```

### CSS à ajouter dans le bloc `/* MODULE ANALYSE */`

```css
.enc-badge-force {
  background: #D1FAE5;
  color: #059669;
  border-left: 3px solid #10B981;
  border-radius: 6px;
  padding: 0.35rem 0.6rem;
  margin-top: 0.5rem;
  font-family: Inter, sans-serif;
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
}
.enc-badge-faiblesse {
  background: #FEF3C7;
  color: #92400E;
  border-left: 3px solid var(--fenix-gold, #F59E0B);
  border-radius: 6px;
  padding: 0.35rem 0.6rem;
  margin-top: 0.5rem;
  font-family: Inter, sans-serif;
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
}
.enc-badge-nodata {
  background: transparent;
  color: #94A3B8;
  border: 1px dashed #CBD5E1;
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  margin-top: 0.5rem;
  font-family: Inter, sans-serif;
  font-size: 0.65rem;
  font-style: italic;
}
.enc-badge-sub {
  font-family: Inter, sans-serif;
  font-weight: 400;
  font-size: 0.65rem;
  margin-top: 0.15rem;
  text-transform: none;
}
```

---

## Critères d'acceptation

- [ ] Une card dont `effMatch / effMoy >= 1.5` ET `possessions >= 5` ET `matchCount >= 3` affiche le badge "FAIBLESSE ADVERSE" en orange avec sous-texte "Moy. saison : X% · Ce match : Y% (+Z%)"
- [ ] Une card dont `|effMatch - effMoy| / effMoy <= 0.10` ET `cv < 0.20` ET conditions remplies affiche le badge "FORCE FENIX" en vert avec sous-texte
- [ ] Si les deux conditions sont remplies simultanément, seul le badge "FAIBLESSE ADVERSE" s'affiche (priorité)
- [ ] Si `matchCount < 3`, toutes les cards affichent le message gris "Min. 3 matchs pour comparer (X joués)" — même si la card est non utilisée (famille absente)
- [ ] Si `possessions < 5` ET `matchCount >= 3`, aucun badge ne s'affiche (volume insuffisant) — pas de message silencieux, juste absence de badge
- [ ] Les deux badges sont visuellement distincts : couleur différente (vert vs orange) ET icône différente (⭐ vs ⚡)
- [ ] Les sous-textes affichent les bonnes valeurs numériques (pas de valeurs dures en dur)
- [ ] La card "Non utilisé" (0 possessions) n'affiche pas de badge (géré par la condition `possessions < 5`)
- [ ] Le `?v=` est bumped dans le HTML

---

## Hors scope

- Icônes SVG (les emojis Unicode ⭐ ⚡ suffisent pour la V1)
- Badge pour la famille "Autre"
- Modification des seuils (1.5 et 0.10 sont configurés dans la fonction — à ajuster si le coach le demande)

---

## Dépend de

- **A-00** — `getEncFamille()`, `ENC_FAMILLE_MAP`
- **A-01** — `renderEncFamillesSection()` qui appelle `_buildEncBadge()` en Zone E de chaque card, `computeEncStatsSaison()` pour les données saison

---

*Story A-03 — pipeline BMAD FENIX — Scrum Master 2026-06-17*

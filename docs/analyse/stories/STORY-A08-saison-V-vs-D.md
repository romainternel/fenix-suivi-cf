# STORY A-08 — Saison V vs D par famille

**Sprint :** 5 (Release 2)
**Taille :** M (1 journée)
**Priorité :** Normale — R2, démarrée uniquement après validation terrain de R1

---

## User Story

En tant que **coach FENIX**,
je veux voir quels systèmes d'attaque sont associés à nos victoires sur toute la saison et lesquels apparaissent dans nos défaites —
afin d'identifier notre force offensive structurelle et détecter les anomalies (système plus efficace en défaite que victoire).

---

## Contexte technique

**Fichiers modifiés :**
- `js/page-analyse.js` — ajout de `renderEncSaisonSection()`, modification de `generateSeasonCorrelations()` (ajout d'un appel en fin de fonction)
- `css/style.css` — ajout de `.enc-saison-table`
- `FENIX-HANDBALL-CF-SUIVI.html` — ajout de `<div id="enc-saison-section">` dans la vue saison + bump `?v=`

**Élément HTML à insérer :**

```html
<!-- Après #saison-correlations (dans le conteneur vue saison vide) -->
<div id="enc-saison-section">
  <!-- Injecté par renderEncSaisonSection() -->
</div>
```

**Modification de `generateSeasonCorrelations()` :**

Ajouter en fin de la fonction (avant le `}` de fermeture, après le dernier `container.innerHTML = ...`) :

```javascript
// F-05 — Tableau familles V vs D
renderEncSaisonSection();
```

**Condition d'affichage :** Vue sans match sélectionné (vue saison) uniquement. Prérequis : ≥ 5 matchs dans `MATCHS[]`. Si `MATCHS.length < 5` → message explicite.

**Données utilisées :**
- `COLS.enclenchement` (9), `COLS.club` (2), `COLS.resultat` (6), `COLS.rencontre` (1)
- `MATCHS[]` global — liste de tous les matchs de la saison
- `DATA[]` global
- Résultat match calculé via comptage de buts par match : `fenButs > advButs → 'V'`, `< → 'D'`, `= → 'N'`
- `computeEncStats(matchData, false)` (A-01) pour l'efficacité par famille par match

---

## Règles métier (F-05)

- Agréger par famille : pour chaque match, calculer l'efficacité possession de la famille (via `computeEncStats`)
- Grouper les efficacités par résultat (V/D/N)
- Calculer la **moyenne des efficacités** par famille par résultat (pas l'efficacité globale)
- Afficher Famille · Eff. moy. V · Eff. moy. D · Diff. V–D

**Colonne Diff. V–D = Eff. moy. V - Eff. moy. D :**
- Diff. positive (V > D) → vert — NORMAL, force offensive en victoire
- Diff. négative (V < D) → rouge — ANOMALIE, système plus efficace quand on perd
- |Diff.| < 3% → neutre gris

**Cellules Eff. moy. V et Eff. moy. D colorées selon niveau absolu :**
- > 60% → fond #D1FAE5 (vert)
- 40–60% → fond transparent
- < 40% → fond #FEE2E2 (rouge)

---

## Implémentation

### Fonction `renderEncSaisonSection()`

Voir ARCH section 2.5 pour l'implémentation complète.

Résumé de l'algorithme :

```javascript
function renderEncSaisonSection() {
    const container = document.getElementById('enc-saison-section');
    if (!container) return;

    // Prérequis : >= 5 matchs
    if (typeof MATCHS === 'undefined' || !MATCHS || MATCHS.length < 5) {
        // Afficher message "Données insuffisantes (N matchs — minimum requis : 5)"
        return;
    }

    // 1. Pour chaque match, calculer le résultat (V/D/N) et l'eff. par famille (FENIX)
    // 2. Grouper les eff[] par famille × résultat
    // 3. Calculer les moyennes
    // 4. Construire le tableau HTML
}
```

Calcul du résultat par match :

```javascript
const fenButs = matchData.filter(r => r[COLS.club] === 'FENIX' && r[COLS.resultat] === 'But').length;
const advButs = matchData.filter(r => r[COLS.club] !== 'FENIX' && r[COLS.resultat] === 'But').length;
const res = fenButs > advButs ? 'V' : fenButs < advButs ? 'D' : 'N';
```

Seules les familles `['Faire courir', 'Jeu Pivot', 'Isoler']` sont affichées (pas "Autre").

### CSS à ajouter dans le bloc `/* MODULE ANALYSE */`

```css
.enc-saison-table {
  width: 100%;
  border-collapse: collapse;
  font-family: Inter, sans-serif;
  font-size: 0.85rem;
}
.enc-saison-table thead tr {
  background: var(--fenix-blue, #0A2463);
  color: white;
}
.enc-saison-table th {
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  padding: 0.6rem 0.75rem;
}
.enc-saison-table tbody tr:nth-child(odd)  { background: #fff; }
.enc-saison-table tbody tr:nth-child(even) { background: var(--fenix-gray, #F1F5F9); }
.enc-saison-table td {
  padding: 0.55rem 0.75rem;
  text-align: center;
}
```

---

## Critères d'acceptation

- [ ] Quand aucun match n'est sélectionné (vue saison) ET ≥ 5 matchs dans la saison, le tableau "EFFICACITÉ PAR FAMILLE — SAISON" s'affiche dans `#enc-saison-section`
- [ ] Le tableau comporte 4 colonnes : Famille · Eff. moy. V · Eff. moy. D · Diff. V–D
- [ ] Les cellules Eff. moy. V et Eff. moy. D sont colorées selon le niveau absolu (vert ≥ 60%, rouge < 40%, transparent entre les deux)
- [ ] La colonne Diff. V–D affiche une flèche (↑ vert si V > D, ↓ rouge si V < D, → gris si neutre)
- [ ] Si `MATCHS.length < 5`, le bloc affiche "Données insuffisantes (N matchs — minimum requis : 5)" avec le nombre exact de matchs joués
- [ ] Chaque cellule Eff. moy. indique en sous-texte `(n=X)` le nombre de matchs ayant contribué
- [ ] Le tableau "saison V vs D" ne s'affiche PAS quand un match est sélectionné (la section `#enc-saison-section` est dans la vue saison, pas dans la vue match)
- [ ] La fonction `generateSeasonCorrelations()` existante n'est pas perturbée — les tableaux existants s'affichent toujours correctement
- [ ] Si une famille n'a aucun match avec des possessions en V ou en D, sa cellule affiche "—"
- [ ] Le `?v=` est bumped dans le HTML

---

## Hors scope

- Vue toggle "par match" / "par saison" dans ce tableau (R3)
- Nulle (N) : les matchs nuls sont calculés mais non affichés dans ce tableau (colonnes V et D suffisent)
- Comparaison avec la saison précédente (R3)

---

## Condition de lancement

**Cette story est Release 2.** Ne démarrer qu'après :
1. R1 complète (A-00 à A-07) validée et stable (pas de régression)
2. ≥ 5 matchs disponibles dans la base de données
3. `ENC_FAMILLE_MAP` stable (pas d'ajout de clés depuis le début de saison)

---

## Dépend de

- **A-00** — `getEncFamille()`, `ENC_FAMILLE_MAP`
- **A-01** — `computeEncStats()` (réutilisée ici sans modification)
- `generateSeasonCorrelations()` existante — comprendre son fonctionnement avant de la modifier

---

*Story A-08 — pipeline BMAD FENIX — Scrum Master 2026-06-17*

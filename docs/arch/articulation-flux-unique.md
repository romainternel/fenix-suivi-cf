# Architecture — Simplification du mode Articulation (flux unique)

**Agent :** Architect
**Date :** 2026-09-08

---

## 1. Décision technique

### 1.1 État global — remplacer, pas cumuler

`window._articViewMode` (Le+utilisée/Suggestion) et `window._articListingFilter` (Poste/Charnière) sont **supprimés** et remplacés par deux nouveaux états plus simples :

```js
window._articWidth        // 'total' | 'central' | 'p34' — clé dans ARTIC_BLOCKS, largeur active
window._articOpenPoste    // pKey ou null — quel encart d'édition de poste est ouvert
```

`window._articManualPoste` et `window._articDispositif` restent inchangés. `window._articSelectedPoste` avait déjà été retiré en STORY-38 (remplacé par `_articListingFilter`, lui-même retiré ici) — pas de résidu à nettoyer de ce côté.

### 1.2 `_articPrimaryEntry` simplifiée — plus de branche Suggestion

Sans le toggle Composition, `_articPrimaryEntry` n'a plus qu'un seul comportement (le plus utilisé) :

```js
function _articPrimaryEntry(pKey, joueurMap) {
    const manuel = window._articManualPoste && window._articManualPoste[pKey];
    if (manuel) return [manuel, joueurMap.get(manuel) || null];
    return [...joueurMap.entries()].sort((a, b) => b[1].possessions - a[1].possessions)[0];
}
```

La branche `topdef` (tri par `eff` individuel) et son usage de `_articJoueurStats` avec l'objet `Map` factice (déjà signalé comme code alambiqué en Code Review STORY-36/37) disparaissent avec elle — l'occasion de nettoyer ce point plutôt que de le reporter encore, puisque la fonction est de toute façon réécrite pour ce cycle.

### 1.3 Classement groupé Fiable/Échantillon faible — dérivé de `computeArticCombos`, pas un nouveau calcul

```js
function _articRankedCombos(matchData, dispositif, blockPostes) {
    const combos = computeArticCombos(matchData, dispositif, blockPostes); // inchangée
    const entries = [...combos.entries()].map(([combo, s]) => ({
        combo, ...s, tauxDef: _articTauxDefense(s),
    }));
    const fiables = entries.filter(e => e.possessions >= 5).sort((a, b) => b.tauxDef - a.tauxDef);
    const faibles = entries.filter(e => e.possessions < 5).sort((a, b) => b.tauxDef - a.tauxDef);
    return { fiables, faibles };
}
```

Seuil `>= 5` repris tel quel de `_articDefClass`/`_articEffClass` (cohérence des seuils déjà établie dans tout le module) — pas un nouveau chiffre inventé pour ce cycle.

### 1.4 Résumé sous le terrain — réutilise `_articBlockEff` + `_articBlockDetail` sur le `lineup` courant

Pas de nouvelle fonction de calcul : le résumé pour la largeur active s'obtient en appelant, avec le `block` correspondant à `window._articWidth` :

```js
const block = ARTIC_BLOCKS.find(b => b.key === window._articWidth);
const stat = _articBlockEff(matchData, dispositif, lineup, block.postes);   // déjà existante
const detail = _articBlockDetail(matchData, dispositif, lineup, block.postes); // déjà existante
```

Exactement le même calcul qu'utilisaient les anciennes cartes "concerned" — seul l'endroit où le résultat est inséré dans le HTML change (sous le terrain plutôt que dans une carte du haut).

### 1.5 Sélection depuis le classement — réutilise `_setArticManualCombo` sans modification

Cliquer une ligne du classement appelle `_setArticManualCombo(postesCsv, joueursCsv)`, déjà écrite en STORY-38 pour exactement cet usage — aucun changement necessaire à cette fonction.

### 1.6 Encart d'édition d'un rond — nouveau rendu, mécanisme de sélection existant

Le clic sur un rond appelle une nouvelle fonction `_toggleArticPosteEditor(pKey)` qui bascule `window._articOpenPoste` puis redessine. Le rendu de l'encart (liste des joueurs observés + `<select>` complet) réutilise exactement le HTML/logique de l'ancien panneau de détail du filtre Poste (STORY-38), déplacé sous le terrain au lieu de la colonne de droite — le `<select>` continue d'appeler `_setArticManualJoueur(pKey, this.value)`, inchangée.

```js
function _toggleArticPosteEditor(pKey) {
    window._articOpenPoste = window._articOpenPoste === pKey ? null : pKey;
    _redrawArticCourt();
}
```

`_setArticManualJoueur` est étendue d'une seule ligne : fermer l'encart après sélection (`window._articOpenPoste = null;`) avant le redraw, pour l'UX "je choisis, l'encart se referme" du Design §3.

## 2. Impact sur l'existant

| Élément | Changement |
|---|---|
| `_drawArticulationCourt` | Réécriture du bandeau de contrôles (Largeur remplace Composition), suppression de la rangée de 4 cartes, ajout du résumé sous le terrain, ajout de l'encart d'édition conditionnel, classement de la colonne de droite réduit à la seule largeur active groupée Fiable/Échantillon faible |
| `_articPrimaryEntry` | Simplifiée (plus de branche `topdef`) |
| `_setArticViewMode`, `_articDefClass` usage sur les cartes du haut, `_articPosteHighlighted`, `_setArticListingFilter`, `_selectArticPoste` | **Supprimées** (remplacées par `_toggleArticPosteEditor`/`window._articWidth`) |
| `_articBlockEff`, `_articBlockDetail`, `computeArticCombos`, `computeArticulationStats`, `_articTauxDefense`, `_articDefClass`, `_setArticManualCombo`, `_setArticManualJoueur`, `ARTIC_BLOCKS`, `ARTIC_LAYOUTS`, `_articArcY`, `_articCourtSvg` | **Inchangées** |
| `css/style.css` | Suppression des classes propres aux éléments retirés (`.artic-blocks-section`, `.artic-block-card.concerned/unconcerned`, `.artic-manual-indicator`, `.artic-listing-filter`), nouvelles classes pour le résumé sous le terrain et l'encart d'édition |

## 3. Nouvelles structures de données

Aucune — uniquement des états UI (`_articWidth`, `_articOpenPoste`) et une fonction de dérivation pure (`_articRankedCombos`) sans nouvel objet persistant.

## 4. Nouvelles fonctions

| Fonction | Rôle |
|---|---|
| `_articRankedCombos(matchData, dispositif, blockPostes)` | Classement groupé Fiable (≥5 séq.)/Échantillon faible (<5) pour la colonne de droite |
| `_toggleArticPosteEditor(pKey)` | Ouvre/ferme l'encart d'édition sous le terrain pour un poste donné |
| `_setArticWidth(widthKey)` | Change `window._articWidth`, redessine (même forme que `_setArticDispositif`) |

## 5. Risques

- **Régression du seuil de fiabilité** si `_articRankedCombos` utilise un opérateur différent (`>` au lieu de `>=`) de celui déjà établi ailleurs — à vérifier explicitement en Code Review contre `_articDefClass`/`_articEffClass` (`possessions < 5` → noref, donc le seuil de bascule est bien `>= 5`).
- **`_setArticManualJoueur` appelée par deux origines différentes** (le nouvel encart sous le terrain, et potentiellement un futur appel) doit fermer l'encart dans tous les cas, pas seulement quand appelée depuis l'encart lui-même — la fermer inconditionnellement au début de la fonction est plus sûr que de la fermer seulement dans le handler de l'encart.

## 6. Critère de bascule

Sans objet pour ce cycle — c'est une simplification, pas une extension ; aucun nouveau seuil de complexité n'est introduit.

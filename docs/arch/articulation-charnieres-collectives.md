# Architecture — Recentrage collectif du mode Articulation (charnières défensives)

**Agent :** Architect
**Date :** 2026-09-07

---

## 1. Décision technique

### 1.1 Métrique de réussite défensive — dérivée à l'affichage, pas un nouveau calcul de fond

`_articBlockEff()` et `computeArticulationStats()` retournent déjà `{ buts, po, possessions, eff }` où `eff` est l'efficacité attaque adverse. Plutôt que de dupliquer ces fonctions ou de modifier leur contrat (qui pourrait avoir d'autres appelants futurs), une fonction pure dérive la nouvelle métrique à l'affichage :

```js
function _articTauxDefense(stat) {
    return stat.possessions > 0 ? Math.round((stat.possessions - stat.buts - stat.po) / stat.possessions * 100) : 0;
}
```

Alternative rejetée : changer `eff` pour qu'il représente directement le taux de réussite défensive dans `computeArticulationStats`/`_articBlockEff`. Rejetée parce que ces fonctions et leur `eff` (efficacité attaque adverse) sont un concept générique de "performance d'une séquence adverse" qui pourrait resservir tel quel si une autre vue (non collective) était réintroduite un jour — dériver à l'affichage garde le calcul de base neutre et n'affecte qu'un seul point de sortie.

### 1.2 Classes de couleur — nouvelle fonction, ancienne conservée mais non appelée dans le rendu

`_articEffClass(eff, possessions)` reste en l'état (confirmé par grep : aucun autre appelant dans tout le projet que les 5 sites internes à `_drawArticulationCourt`) mais n'est plus invoquée pour le rendu des ronds/cartes. Une nouvelle fonction la remplace pour la métrique inversée :

```js
function _articDefClass(tauxDef, possessions) {
    if (possessions < 5) return 'noref';
    if (tauxDef > 62) return 'fort';
    if (tauxDef >= 45) return 'moyen';
    return 'faible';
}
```

Seuils choisis en miroir exact des seuils actuels de `_articEffClass` (`eff < 38` → fort, `<= 55` → moyen, sinon faible) via complément à 100 (`100-38=62`, `100-55=45`), pour que le comportement perçu (mêmes séquences classées dans les mêmes catégories qualitatives) ne change pas, seul le sens de lecture du nombre affiché change. `_articEffClass` elle-même n'est pas supprimée dans ce cycle (aucun risque à la garder morte, cf. Note du Code Reviewer à prévoir) mais n'est plus appelée — un futur nettoyage pourra la retirer si elle reste inutilisée.

### 1.3 Retrait de l'affichage individuel — suppression de code, pas de flag conditionnel

Le liseré de couleur sur `.artic-poste` et le % dans le panneau de détail sont des LIGNES DE CODE supprimées (classe non ajoutée au HTML généré, colonne non générée dans le template du panneau), pas un état caché via CSS (`display:none`) — conformément à la règle du projet de ne pas garder de code mort conditionné par un flag. `_articPrimaryEntry()` continue de calculer `topStats.eff`/`s.eff` en interne (nécessaire pour trier "le plus économe" en mode Suggestion) mais cette valeur n'est simplement plus interpolée dans le HTML produit.

### 1.4 Renommage "Top Def" → "Suggestion"

Changement de libellé et de tooltip uniquement (`_setArticViewMode('topdef')` conserve son nom de fonction/paramètre interne — aucune raison de renommer l'API interne, seul le texte visible change) :

```js
<button class="enc-pie-mode-btn${window._articViewMode==='topdef'?' active':''}" onclick="_setArticViewMode('topdef')" title="Compose automatiquement le terrain avec le joueur historiquement le plus économe à chaque poste, à titre de suggestion — juge ensuite la charnière obtenue dans les cartes ci-dessus.">💡 Suggestion</button>
```

## 2. Impact sur l'existant

| Élément | Changement |
|---|---|
| `_drawArticulationCourt` | Réordonnancement du HTML généré (charnières avant le terrain), retrait du liseré de couleur des ronds, retrait du % dans le panneau de détail, ajout de la ligne récapitulative des 6 noms, renommage des libellés de boutons/cartes |
| `computeArticulationStats`, `_articBlockEff`, `ARTIC_BLOCKS`, `_articPrimaryEntry` | **Inchangées** dans leur calcul — seule leur consommation en aval change |
| `_articEffClass` | Non supprimée mais non appelée dans le rendu (remplacée par `_articDefClass`) |
| `css/style.css` | `.artic-poste.fort/.moyen/.faible/.noref` (liseré individuel) supprimées ; `.artic-block-eff.fort/.moyen/.faible/.noref` conservées mais réinterprétées (même nom de classe, sens inversé de la donnée qu'elles colorent — aucun changement CSS nécessaire ici, seul le JS change quelle classe est posée pour quelle valeur) ; nouveau style pour le titre de section et la liste récapitulative |

Aucun impact sur d'autres pages, sur Supabase, ou sur l'import Excel.

## 3. Nouvelles structures de données

Aucune. `_articTauxDefense()` et `_articDefClass()` sont des fonctions pures sans état.

## 4. Nouvelles fonctions

| Fonction | Rôle |
|---|---|
| `_articTauxDefense(stat)` | Dérive le % de réussite défensive à partir d'un objet `{buts, po, possessions}` déjà produit par `_articBlockEff`/`computeArticulationStats` |
| `_articDefClass(tauxDef, possessions)` | Classe qualitative (fort/moyen/faible/noref) sur la métrique inversée, seuils en miroir de `_articEffClass` |

## 5. Risques

- **Incohérence si un appel à `_articEffClass`/`eff` brut subsiste par erreur dans un coin du rendu** (ex. un label oublié affichant encore l'ancienne métrique) — à vérifier explicitement en Code Review, poste par poste et carte par carte, puisque le remplacement touche 5 sites d'appel distincts.
- **`_articEffClass` devient du code mort** si aucun autre usage n'apparaît — accepté pour ce cycle (pas de suppression prématurée), à réévaluer si elle reste inutilisée après plusieurs cycles.

## 6. Critère de bascule

Si une autre feature du projet a un jour besoin d'afficher une efficacité individuelle adverse ailleurs que dans ce mode (peu probable vu l'historique), `_articEffClass` reste disponible telle quelle — pas de suppression nécessaire pour ce cycle, seule sa consommation dans le mode Articulation change.

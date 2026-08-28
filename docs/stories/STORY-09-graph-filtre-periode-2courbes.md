# STORY-09 — Graph Ma Fiche : filtre période + 2 courbes sur mobile

**En tant que** joueur,  
**Je veux** choisir une période (bilan) pour voir mon évolution et avoir un graphique lisible sur téléphone,  
**Afin de** savoir si je suis en forme sur les derniers matchs sans me noyer dans 5 courbes.

## Contexte technique
- Fichier : `js/player-mode.js`
- Fonction à étendre : `renderPmfGraph(nom)` → `renderPmfGraph(nom, bilanFilter)`
- Fonction à modifier : `renderPlayerFiche()` — injecter le sélecteur de période + le div diagnostic
- Nouvelles variables globales :
  ```javascript
  let _pmfPeriodFilter = '';    // '' = toute saison, sinon nom du bilan
  let _pmfShowDetail   = false; // true = affiche 5 courbes, false = affiche 2 courbes
  ```
- Nouvelles fonctions :
  ```javascript
  function pmfSetPeriod(bilanNom) { ... }   // change filtre, rerender graph + diagnostic
  function togglePmfDetail()      { ... }   // toggle _pmfShowDetail, rerender graph
  ```

**Dans `renderPmfGraph(nom, bilanFilter)` :**
1. Si `bilanFilter` fourni → filtrer `MATCHS` sur `BILANS.find(b=>b.nom===bilanFilter)?.matchs || []`
2. Sur mobile (`window.innerWidth < 600`) ET `!_pmfShowDetail` → masquer datasets secondaires :
   - Joueur de champ : garder TOTAL JOUEUR + ligne zéro visible. Mettre `hidden: true` sur NOTE ATT, NOTE DEF, Médiane, Tendance
   - GB : garder Score Total + ligne zéro. Mettre `hidden: true` sur % Arrêts et Arrêts (bar)
3. `_pmfShowDetail = true` → tous les datasets visibles (comportement actuel)

**Sélecteur injecté dans `renderPlayerFiche()`,** dans la card "PROGRESSION" :
```javascript
const bilanOptions = (typeof BILANS !== 'undefined' && BILANS.length > 0)
    ? `<select id="pmf-period-sel" onchange="pmfSetPeriod(this.value)" ...>
         <option value="">Toute la saison</option>
         ${BILANS.map(b=>`<option value="${b.nom}" ${_pmfPeriodFilter===b.nom?'selected':''}>${b.label||b.nom}</option>`).join('')}
       </select>`
    : '';
```

**Div diagnostic** (injecté juste sous le sélecteur, avant le canvas graph) :
```html
<div id="pmf-diagnostic" style="font-size:0.8rem;font-weight:600;min-height:1.2em"></div>
```

**Bouton toggle** (sous le graph) :
```html
<button onclick="togglePmfDetail()" id="pmf-detail-btn" style="...">▾ Voir détail</button>
```
Texte change en "▴ Masquer détail" quand `_pmfShowDetail === true`.

**Réinitialisation :** Dans `pmTab('fiche')`, réinitialiser `_pmfPeriodFilter = ''` et `_pmfShowDetail = false` si on change d'onglet.

## Critères d'acceptation
- [ ] Sur mobile (375px) : le graph affiche 2 courbes par défaut (TOTAL + zéro)
- [ ] Sur desktop (≥ 600px) : le graph affiche toutes les courbes comme avant
- [ ] Tap "▾ Voir détail" → toutes les courbes s'affichent (mobile et desktop)
- [ ] Tap "▴ Masquer détail" → retour 2 courbes (mobile uniquement)
- [ ] Si `BILANS.length > 0` : sélecteur de période présent sous "PROGRESSION"
- [ ] Si `BILANS.length === 0` : pas de sélecteur (conforme STORY-08)
- [ ] Changer de période → graph rechargé sur les matchs de ce bilan uniquement
- [ ] "Toute la saison" → graph sur tous les matchs
- [ ] Aucune régression sur le graph GB (courbes Arrêts / Score / % Arrêts)

## Hors scope
- Pas de diagnostic ↑↓ dans cette story (STORY-10)
- Pas de modification de l'apparence des courbes (couleurs, styles)

## Dépend de
- STORY-08 (logique `BILANS.length > 0` documentée)

## Taille
L

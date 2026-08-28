# STORY-11 — Badge "Ta signature" : l'action où le joueur domine l'équipe

**En tant que** joueur,  
**Je veux** voir mis en avant l'action dans laquelle je suis au-dessus de mes coéquipiers,  
**Afin de** connaître mon point fort et d'en être fier.

## Contexte technique
- Fichier : `js/player-mode.js`
- Appelée dans `renderPlayerFiche()` après le rendu des stats KPI
- Nouvelles fonctions :
  ```javascript
  function computePlayerSignature(nom, isGB)  // → { label, ratio } | null
  function _renderSignatureBadge(sig)          // → HTML string
  ```

**`computePlayerSignature(nom, isGB)` — algorithme joueur de champ :**
```javascript
// 1. Collecter toutes les actions positives ATT + DEF du joueur (saison entière)
//    playerCounts[action] = nb occurrences
// 2. Collecter les mêmes pour TOUS les joueurs FENIX ayant des données
//    teamTotals[action] = somme occurrences, teamPlayers[action] = nb joueurs avec ≥1 occurrence
// 3. teamAvg[action] = teamTotals[action] / teamPlayers[action]
// 4. ratio[action] = playerCounts[action] / teamAvg[action]
// 5. Garder uniquement : playerCounts[action] >= 3 ET ratio >= 1.5
// 6. Retourner l'action avec le ratio max, ou null si aucune
```

**`computePlayerSignature(nom, isGB)` — algorithme gardien :**
```javascript
// Calculer le % d'arrêts par zone pour CE gardien
// Calculer la moyenne des % par zone pour TOUS les autres GB
// Si ce gardien a ≥ 5 tirs dans une zone ET son % >= 1.5x la moyenne → retourner la zone
// Retourner null si aucune zone ne ressort
```

**Condition minimum :** au moins 5 joueurs FENIX avec des données pour que la comparaison soit significative. Si équipe < 5 joueurs avec données → retourner null.

**HTML badge** (injecté dans `renderPlayerFiche()`) :
```html
<!-- Si sig !== null : -->
<div class="pmf-card pmf-signature">
    <div style="font-size:1.5rem">💥</div>
    <div>
        <div style="font-weight:700;color:#1E293B">${sig.label}</div>
        <div style="font-size:0.8rem;color:#92400E">Tu domines l'équipe sur cette action cette saison</div>
    </div>
</div>

<!-- Si sig === null : ne rien afficher -->
```

**CSS à ajouter dans style.css :**
```css
.pmf-signature {
    display: flex; align-items: center; gap: 14px;
    background: #FFFBEB; border-left: 4px solid #F59E0B;
}
```

## Critères d'acceptation
- [ ] Si le joueur a une action à ratio ≥ 1.5x avec ≥ 3 occurrences → badge "💥 [action]" affiché dans Ma Fiche
- [ ] Si aucune action ne ressort → bloc absent (aucun placeholder, aucun texte vide)
- [ ] Pour un GB : la signature peut être un % d'arrêts dans une zone ("Zone 6m central G")
- [ ] Le badge s'affiche entre les KPIs et le graph (selon maquette Designer)
- [ ] Aucune erreur JS si l'équipe a peu de joueurs ou peu de données
- [ ] Si < 5 joueurs FENIX avec des données → badge absent
- [ ] Aucune régression sur le reste de Ma Fiche

## Hors scope
- Pas de classement général "top 3" de l'équipe
- Pas d'affichage du ratio numérique (juste le label action)
- Pas de badge négatif ("ton point faible")

## Dépend de
- Aucune (peut être développée en parallèle de STORY-09/10)

## Taille
L

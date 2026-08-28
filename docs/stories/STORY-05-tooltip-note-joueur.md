# STORY-05 — Info-bulle "comment est calculée ma note" pour les joueurs de champ

**En tant que** joueur de champ,  
**Je veux** comprendre comment ma note est calculée en tapant sur un petit "i",  
**Afin de** savoir sur quoi travailler pour l'améliorer.

## Contexte technique
- Fichier : `js/player-mode.js`
- Fonction `renderPlayerFiche()` — ligne ~219 : template `statsHTML` pour joueurs de champ
- KPI NOTE existant :
  ```javascript
  `<div class="pmf-kpi-box"><div class="pmf-kpi-val" style="color:${noteColor}">${noteDisplay}</div><div class="pmf-kpi-lbl">NOTE</div></div>`
  ```
- Modèle à copier : badge 'i' GB (ligne ~218) :
  ```javascript
  `<span title="Score pondéré par zone..." style="cursor:help;background:#CBD5E1;color:#1E293B;border-radius:50%;width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;flex-shrink:0">i</span>`
  ```
- Texte du tooltip joueur de champ : `"Score calculé sur tes actions : (Actions ATT+) - (ATT-) + (Actions DEF+) - (DEF-)"`

## Critères d'acceptation
- [ ] Badge "i" visible à côté de "NOTE" dans les KPIs de Ma Fiche pour les joueurs de champ
- [ ] Tap/clic sur le "i" → tooltip visible (title attribute, natif navigateur)
- [ ] Badge "i" absent pour les gardiens (ils ont déjà leur propre "i" sur NOTE GB)
- [ ] Même style visuel que le "i" existant sur NOTE GB (fond gris clair, cercle)
- [ ] Aucune régression sur l'affichage des KPIs

## Hors scope
- Pas de modal custom — le `title` natif suffit
- Pas de modification pour les gardiens

## Dépend de
- Aucune

## Taille
S

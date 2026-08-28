# STORY-06 — Stats personnelles affichées avant les stats équipe dans Stats Match

**En tant que** joueur,  
**Je veux** voir mes propres stats en premier quand j'ouvre l'onglet Stats Match,  
**Afin de** trouver immédiatement ce qui me concerne sans scroller.

## Contexte technique
- Fichier HTML : `FENIX-HANDBALL-CF-SUIVI.html` — `pm-match-page` (~ligne 3407)
- Fichier JS : `js/player-mode.js` — `renderPlayerMatchStats()` (~ligne 954)

**Ordre actuel des divs dans pm-match-page :**
```html
<div id="pm-match-banner">
<div id="pm-ai-card">
<div id="pm-match-cards">        ← stats ÉQUIPE (actuellement 3e)
<div id="pm-match-player-table"> ← stats PERSO (actuellement 4e)
<div id="pm-match-extras">       ← zones perso (actuellement 5e)
```

**Ordre cible :**
```html
<div id="pm-match-banner">
<div id="pm-match-player-table"> ← stats PERSO (monte en 2e)
<div id="pm-match-extras">       ← zones perso (monte en 3e)
<div id="pm-ai-card">
<div id="pm-match-cards">        ← stats ÉQUIPE (descend en 5e)
```

**Dans `renderPlayerMatchStats()` :** les appels `renderMatchSummaryBanner()`, `renderAICard()`, `renderPlayerMatchTable()`, `renderPlayerMatchExtras()` → les réordonner dans le même ordre que les divs.

## Critères d'acceptation
- [ ] En ouvrant Stats Match (sans scroll), la première section visible est la table de stats personnelles du joueur
- [ ] Les zones de tir personnelles apparaissent avant les cartes FENIX / ADVERSAIRE
- [ ] Les cartes stats équipe sont toujours présentes, en bas de page
- [ ] Aucune donnée supprimée ou manquante
- [ ] `onPmmZoneClick()` fonctionne toujours (dépend de `_pmmImpactRows` — défini dans `renderPlayerMatchExtras`)

## Hors scope
- Pas de modification du contenu des sections (juste réordonnancement)
- Pas de modification du style des cartes

## Dépend de
- Aucune

## Taille
M

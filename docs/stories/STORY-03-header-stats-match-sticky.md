# STORY-03 — Barre de filtres Stats Match reste visible au scroll

**En tant que** joueur,  
**Je veux** voir en permanence sur quel match et quelle période je suis,  
**Afin de** ne pas perdre le contexte quand je scrolle dans les stats.

## Contexte technique
- Fichier HTML : `FENIX-HANDBALL-CF-SUIVI.html` — div header dans `pm-match-page` (~ligne 3383)
- Fichier CSS : `css/style.css`
- Ajouter la classe `pm-stats-header` sur le div `<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">` existant dans pm-match-page
- Ajouter en CSS :
  ```css
  .pm-stats-header {
      position: sticky;
      top: 56px;
      background: white;
      z-index: 50;
      padding: 10px 0 14px;
      margin: -20px 0 16px;
      box-shadow: 0 2px 6px rgba(0,0,0,.06);
  }
  ```
- Le `margin: -20px 0 16px` compense le padding-top de 76px du parent (76 - 56 = 20px d'écart)

## Critères d'acceptation
- [ ] En scrollant dans Stats Match, la barre "🏆 STATS DU MATCH + filtres" reste collée sous la pm-bar
- [ ] Le contenu scrolle EN DESSOUS de la barre (pas de chevauchement)
- [ ] Les filtres PÉRIODE et MATCH restent cliquables quand la barre est sticky
- [ ] Sur desktop, même comportement (barre sticky)
- [ ] Aucune régression sur les onglets Ma Fiche et Zones

## Hors scope
- Pas de modification du contenu des filtres
- Pas de sticky sur les autres onglets (Ma Fiche, Zones)

## Dépend de
- Aucune

## Taille
S

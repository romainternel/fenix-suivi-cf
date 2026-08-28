# STORY-04 — Canvas zones de tir lisibles sur mobile (face en premier)

**En tant que** joueur sur téléphone,  
**Je veux** que les 3 vues de tir soient lisibles sans zoom,  
**Afin de** comprendre mes zones de force et de faiblesse d'un coup d'œil.

## Contexte technique
- Fichier : `css/style.css`
- Classe existante `.pmf-canvases` — ligne ~2005 : `display: grid; grid-template-columns: repeat(3, 1fr)`
- Règle existante à REMPLACER (ligne ~2009) : `@media (max-width: 500px) { .pmf-canvases { grid-template-columns: 1fr; } }`
- Règle existante à REMPLACER (ligne ~2096) : `.pmf-canvases { grid-template-columns: repeat(2, 1fr) !important; }` + `.pmf-canvas-wrap:last-child { grid-column: span 2; ... }`
- Ordre HTML généré par JS : `alg (1er enfant)` → `face (2e enfant)` → `ald (3e enfant)`
- Nouvelle règle mobile :
  ```css
  @media (max-width: 600px) {
      .pmf-canvases { grid-template-columns: repeat(2, 1fr); }
      .pmf-canvas-wrap:nth-child(1) { order: 2; }
      .pmf-canvas-wrap:nth-child(2) { order: 1; grid-column: span 2; }
      .pmf-canvas-wrap:nth-child(3) { order: 3; }
  }
  ```

## Critères d'acceptation
- [ ] Sur 375px : canvas "face" (CENTRAL) affiché en premier en pleine largeur (≥ 300px)
- [ ] Sur 375px : canvas "alg" (EXT GAUCHE) et "ald" (EXT DROIT) côte à côte en dessous (~48% chacun)
- [ ] Sur desktop ≥ 601px : 3 colonnes égales (layout actuel inchangé)
- [ ] Fonctionne dans l'onglet Zones ET dans Stats Match (les deux utilisent `.pmf-canvases`)
- [ ] Les labels "EXT GAUCHE" / "CENTRAL" / "EXT DROIT" suivent leurs canvas respectifs
- [ ] Aucune régression sur la page Joueurs staff (vérifier que les canvas staff ne sont pas affectés)

## Hors scope
- Pas de changement de la logique de dessin (`_drawImpactCanvas`)
- Pas de modification de l'ordre dans le HTML/JS

## Dépend de
- Aucune (CSS uniquement)

## Taille
M

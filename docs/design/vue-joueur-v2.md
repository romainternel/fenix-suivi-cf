# Design — Vue Joueur Mobile v2
**Agent :** Designer  
**Date :** 2026-06-15  
**Input :** docs/prd.md (11 features, 3 sprints)  
**Référence :** Mobile 375px (iPhone SE) · Android 360px · Desktop 1024px+

---

## ÉCRAN 1 — MA FICHE (mobile 375px)

### Maquette — État données disponibles, bilan sélectionné

```
╔═══════════════════════════════════════╗  ← pm-bar fixe (56px, bleu marine)
║  🟡 FENIX  Martin  [J05–J09 📋]  ⋯  ║
╠═══════════════════════════════════════╣
║                                       ║
║  ┌─────────────────────────────────┐  ║
║  │ ██ MA                           │  ║  ← header couleur poste
║  │    Martin Guibert               │  ║
║  │    AD — Ailier Droit            │  ║
║  │    9 matchs · 312 min           │  ║
║  └─────────────────────────────────┘  ║
║                                       ║
║  ┌─────────────────────────────────┐  ║
║  │ ┌──────┐ ┌──────┐ ┌──────────┐ │  ║
║  │ │  4/9 │ │  73% │ │   +4   ℹ │ │  ║  ← ℹ = tooltip note
║  │ │BUT/TI│ │ EFF  │ │  NOTE    │ │  ║
║  │ └──────┘ └──────┘ └──────────┘ │  ║
║  │ ┌──────┐ ┌──────┐              │  ║
║  │ │  3   │ │  1   │              │  ║
║  │ │  PD  │ │  PB  │              │  ║
║  │ └──────┘ └──────┘              │  ║
║  └─────────────────────────────────┘  ║
║                                       ║
║  ┌─────────────────────────────────┐  ║
║  │ PROGRESSION    [J05–J09 ▼]      │  ║  ← sélecteur période intégré au titre
║  │ ↑ +2.3 pts vs période préc. ●   │  ║  ← diagnostic vert, discret
║  │ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │  ║
║  │                                 │  ║
║  │   [graph Chart.js 2 courbes]    │  ║
║  │   TOTAL ──── · · · · zéro      │  ║
║  │                                 │  ║
║  │         [▾ Voir détail]         │  ║  ← toggle pour ATT/DEF/Médiane
║  └─────────────────────────────────┘  ║
║                                       ║
║  ┌─────────────────────────────────┐  ║
║  │ 💥 TA SIGNATURE                 │  ║  ← badge si seuil atteint
║  │ Duel gagné att                  │  ║
║  │ Tu domines l'équipe sur         │  ║
║  │ cette action cette saison       │  ║
║  └─────────────────────────────────┘  ║
║                                       ║
║  ┌─────────────────────────────────┐  ║
║  │ ACTIONS     [tableau existant]  │  ║
║  └─────────────────────────────────┘  ║
╚═══════════════════════════════════════╝
```

### Interactions — Ma Fiche

| Action | Résultat |
|--------|----------|
| Tap [J05–J09 ▼] | Dropdown avec options : Toute la saison / J01–J04 / J05–J09 |
| Sélectionner une période | Graph rechargé, diagnostic ↑↓ affiché/masqué |
| Sélectionner "Toute la saison" | Diagnostic masqué, graph toute saison |
| Tap ℹ sur NOTE | Tooltip : "ATT+ - ATT- + DEF+ - DEF-" (même style que GB) |
| Tap [▾ Voir détail] | Graph repasse à 5 courbes (toggle) |
| Tap [▲ Masquer détail] | Graph revient 2 courbes |

### États — Ma Fiche

```
État SANS BILAN (début saison) :
  ┌─────────────────────────────────┐
  │ PROGRESSION                     │  ← PAS de sélecteur (BILANS vide)
  │ [graph toute saison, 2 courbes] │
  └─────────────────────────────────┘

État DIAGNOSTIC POSITIF :
  │ ↑ +2.3 pts vs période préc. ●  │  ← texte #10B981 (vert)

État DIAGNOSTIC NÉGATIF :
  │ ↓ -1.1 pts vs période préc. ●  │  ← texte #EF4444 (rouge)

État STABLE (delta < 0.5) :
  │ = Stable vs période préc.      │  ← texte #64748B (gris)

État PREMIER BILAN (pas de précédent) :
  │ [aucun diagnostic affiché]      │

État SANS SIGNATURE :
  │ [bloc 💥 absent — rien affiché] │
```

---

## ÉCRAN 2 — STATS MATCH (mobile 375px)

### Maquette — Header sticky + stats perso en premier

```
╔═══════════════════════════════════════╗  ← pm-bar fixe (56px)
║  🟡 FENIX  Martin  [⋯]              ║
╠═══════════════════════════════════════╣
║ ┌─────────────────────────────────┐   ║  ← STICKY sous pm-bar (top:56px)
║ │ 🏆 STATS DU MATCH               │   ║     background blanc, shadow bas
║ │ PÉRIODE [Toute saison ▼]        │   ║
║ │ MATCH   [J07 ROC-FENIX   ▼]    │   ║
║ └─────────────────────────────────┘   ║
║ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  ║  ← scroll commence ici
║                                       ║
║  ┌─────────────────────────────────┐  ║
║  │ [banner résultat match si dispo]│  ║
║  └─────────────────────────────────┘  ║
║                                       ║
║  ┌─────────────────────────────────┐  ║  ← MES STATS EN PREMIER
║  │ MES PERFORMANCES                │  ║
║  │ [table stats perso joueur]      │  ║
║  └─────────────────────────────────┘  ║
║                                       ║
║  ┌─────────────────────────────────┐  ║
║  │ MES ZONES DE TIR                │  ║
║  │ [canvas alg / face / ald]       │  ║
║  │ [grille zones cliquables]       │  ║
║  └─────────────────────────────────┘  ║
║                                       ║
║  ┌─────────────────────────────────┐  ║
║  │ POSITIONS SUR LE TERRAIN        │  ║
║  │ [canvas terrain — hauteur réduite│  ║  ← ≤ 140px hauteur mobile
║  └─────────────────────────────────┘  ║
║                                       ║
║  ┌──────────────┐ ┌──────────────┐   ║  ← STATS ÉQUIPE EN BAS
║  │ FENIX        │ │ ADVERSAIRE   │   ║
║  │ [card stats] │ │ [card stats] │   ║
║  └──────────────┘ └──────────────┘   ║
╚═══════════════════════════════════════╝
```

### Comportement sticky header

```
AVANT SCROLL :
  ┌─pm-bar (fixe)────────────────────┐  top: 0
  ├─header stats match (sticky)──────┤  top: 56px
  │  🏆 STATS DU MATCH               │
  │  PÉRIODE [▼]  MATCH [▼]          │
  └──────────────────────────────────┘
  │  contenu scrollable...           │

APRÈS SCROLL (contenu défilé) :
  ┌─pm-bar (fixe)────────────────────┐  top: 0
  ├─header stats match (toujours là) ┤  top: 56px  ← reste visible
  │  🏆 STATS DU MATCH               │
  │  PÉRIODE [J05–J09] MATCH [J07]   │  ← filtres actifs toujours visibles
  └──────────────────────────────────┘
  │  [stats équipe scrollées sous]   │
```

---

## ÉCRAN 3 — ZONES DE TIR (mobile 375px)

### Maquette — Filtre résultat + canvas responsive

```
╔═══════════════════════════════════════╗
║  pm-bar                               ║
╠═══════════════════════════════════════╣
║                                       ║
║  ┌─────────────────────────────────┐  ║
║  │ ZONES DE TIR — SAISON           │  ║
║  │ 4 buts / 9 tirs   73%  12 match │  ║  ← stats recalculées selon filtre
║  │                                 │  ║
║  │  ┌────────┐ ┌────────┐ ┌──────┐ │  ║  ← 3 boutons pill
║  │  │  Tout  │ │  Buts  │ │Ratés │ │  ║     44px hauteur min
║  │  │ actif  │ │        │ │      │ │  ║     Tout = rempli #0A2463
║  │  └────────┘ └────────┘ └──────┘ │  ║     autres = contour seulement
║  │                                 │  ║
║  │  ┌─────────────────────────────┐ │  ║  ← CENTRAL pleine largeur
║  │  │                             │ │  ║
║  │  │      [canvas FACE]          │ │  ║     ≥ 300px sur 375px
║  │  │                             │ │  ║
║  │  └─────────────────────────────┘ │  ║
║  │  EXT GAUCHE          EXT DROIT   │  ║
║  │  ┌──────────────┐ ┌────────────┐ │  ║  ← ALG + ALD côte à côte
║  │  │ [canvas ALG] │ │[canvas ALD]│ │  ║     ≈ 48% largeur chacun
║  │  └──────────────┘ └────────────┘ │  ║
║  │                                 │  ║
║  │  ● But    ✕ Raté                │  ║
║  └─────────────────────────────────┘  ║
╚═══════════════════════════════════════╝
```

### Layout canvas — Responsive rules

```
MOBILE < 600px :
  ┌──────────────────────────┐
  │     CENTRAL (face)        │  100% largeur
  └──────────────────────────┘
  ┌────────────┐ ┌────────────┐
  │ EXT GAUCHE │ │  EXT DROIT │  50% / 50%
  └────────────┘ └────────────┘

DESKTOP ≥ 600px :
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │EXT GAUCHE│ │ CENTRAL  │ │EXT DROIT │  33% / 33% / 33% (actuel)
  └──────────┘ └──────────┘ └──────────┘
```

### Interactions — Zones

| Action | Résultat |
|--------|----------|
| Tap [Tout] | Tous les tirs affichés, stats totales |
| Tap [Buts] | Seulement les ● verts, stats buts uniquement |
| Tap [Ratés] | Seulement les ✕ rouges, stats ratés uniquement |
| Tap bouton actif | Revient à [Tout] |
| Pour GB : label [Arrêts] | Seulement les ● verts (arrêts) |
| Pour GB : label [Buts encaissés] | Seulement les ✕ rouges |

---

## COMPOSANT — Tooltip note joueur de champ

```
  ┌──────────────────────────────────┐
  │  +4   ℹ                          │  ← le ℹ (même style que GB)
  └──────────────────────────────────┘
         ↕ tap
  ┌──────────────────────────────────┐
  │ Comment est calculée ta note ?   │
  │                                  │
  │ ATT+ - ATT- + DEF+ - DEF-        │
  │                                  │
  │ Chaque action positive ou        │
  │ négative notée par le staff      │
  │ compte dans ton score.           │
  └──────────────────────────────────┘
```

---

## COMPOSANT — Badge Signature (F-09)

```
  ┌─────────────────────────────────────┐
  │ 💥  TA SIGNATURE                    │
  │                                     │
  │  Duel gagné att                     │  ← nom de l'action
  │  Tu es au-dessus de l'équipe        │
  │  sur cette action cette saison      │
  └─────────────────────────────────────┘

  Si aucune action ne ressort :
  [bloc absent — rien affiché, aucun placeholder]
```

**Style :** fond légèrement coloré (ex. `#FEF3C7` — ambre clair), bordure gauche `#F59E0B`. Sobre, pas criard.

---

## COMPOSANT — Diagnostic évolution (F-02)

```
  Positif :   ↑ +2.3 pts vs période préc.   [couleur #10B981]
  Négatif :   ↓ -1.1 pts vs période préc.   [couleur #EF4444]
  Stable  :   = Stable vs période préc.      [couleur #64748B]
  Absent  :   [rien — pas de texte, pas de ligne vide]
```

**Position :** directement sous le titre "PROGRESSION [▼]", avant le graph. Petite taille (0.8rem), ne doit pas prendre l'espace du graph.

---

## TERRAIN VU DU DESSUS — Canvas réduit (F-11)

```
MOBILE avant :
  ┌──────────────────────────────────┐
  │                                  │
  │     [terrain 220px hauteur]      │  ← trop grand
  │                                  │
  └──────────────────────────────────┘

MOBILE après :
  ┌──────────────────────────────────┐
  │  [terrain 130px hauteur max]     │  ← compact
  └──────────────────────────────────┘
```

**Règle CSS :** `.terrain-wrapper-small { max-height: 130px }` sur mobile. Le canvas interne suit le ratio automatiquement.

---

## RÉCAPITULATIF — Composants réutilisés vs nouveaux

| Composant | Statut |
|-----------|--------|
| pm-bar, pm-tab-btn | Existant — pas touché |
| pmf-card, pmf-kpi-box | Existant — pas touché |
| `_drawImpactCanvas()` | Existant — pas touché, layout CSS change |
| Sélecteur de période (BILANS) | Existant dans Stats Match — à dupliquer dans Ma Fiche |
| Tooltip 'i' GB | Existant — à dupliquer pour joueurs de champ |
| **Graph Ma Fiche (toggle détail)** | Nouveau comportement |
| **Diagnostic ↑↓** | Nouveau composant |
| **Badge Signature** | Nouveau composant |
| **Boutons filtre Zones (Tout/Buts/Ratés)** | Nouveau composant |
| **Header sticky Stats Match** | Nouveau comportement CSS |

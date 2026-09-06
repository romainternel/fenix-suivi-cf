# Design — Refonte lisibilité du mode Articulation

**Agent :** Designer
**Date :** 2026-09-06

---

## 1. Principe général

Trois zones empilées, clairement séparées visuellement (fond/bordure différents), au lieu de l'empilement actuel où contrôles/terrain/données se fondent les uns dans les autres :

1. **Bandeau de contrôles** — dispositif, mode d'affichage, indicateur de personnalisation active
2. **Terrain** — 6 ronds avec nom seul, positionnés sur la courbe réelle du 6m, liseré de couleur comme seul signal d'efficacité
3. **Panneau d'indicateurs** — référence globale + 3 cartes Bloc en une seule rangée cohérente, puis détail au clic sur un poste

## 2. Maquette ASCII

```
┌───────────────────────────────────────────────────────────────────┐
│  🛡 DÉFENSE FENIX — INTENTION ATTAQUE ADVERSES     [Attaque][Défense]│
│  [Vue générale] [Matrice 2×2] [🎯 Articulation]                     │
├───────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │  DISPOSITIF   [ 0-6 (116 séq.) ] [ 1-5 (13 séq.) ]             │ │
│ │  AFFICHAGE    [ Le + utilisé ]  [ 🏆 Top Def ]                 │ │
│ │  ⚙ 2 postes modifiés manuellement · [Réinitialiser]             │ │  ← visible seulement si override actif
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│              ┌─────────────────────────────────────┐              │
│              │▓▓▓▓▓▓▓▓▓▓▓▓░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← but        │
│              │      ___________________            │              │
│              │    ╱                     ╲           │  ← ligne 6m  │
│              │(P1)                       (P6)       │    (arc réel)│
│              │  (P2)                   (P5)          │              │
│              │      (P3)         (P4)                │              │
│              │           ⌒⌒⌒⌒⌒⌒⌒⌒ (9m pointillé)      │              │
│              └─────────────────────────────────────┘              │
│                                                                     │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │  RÉFÉRENCE       BLOC TOTAL      BLOC CENTRAL      BLOC34      │ │
│ │  ADVERSE (0-6)    (6 postes)      (P2-P5)          (P3-P4)     │ │
│ │     48%          aucune séq.     aucune séq.        37%        │ │
│ │   116 séq.         avec ce         avec ce         43 séq.     │ │
│ │                     groupe          groupe                      │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─ P3 — détail par joueur ─────────────────────────────────────┐  │  ← apparaît seulement
│ │ Lukas.J     70 séq. · 51% eff. adverse                        │  │    au clic sur un poste
│ │ Isaac.M     31 séq. · 39% eff. adverse                        │  │
│ │ ─────────────────────────────────────────────────────────────│  │
│ │ Voir un autre joueur à ce poste : [— Auto (le + utilisé) — ▾] │  │
│ └────────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────┘
```

Sur le terrain, chaque rond n'affiche que le nom (ex. `P3 / Lukas.J`, deux lignes centrées, plus de troisième ligne pour le %). Le liseré du rond (2-3px) prend la couleur `fort`/`moyen`/`faible`/`noref` déjà définie dans `_articEffClass` — c'est le seul vestige visuel de l'efficacité individuelle sur le terrain lui-même, suffisant pour un repérage rapide sans lire de chiffre.

## 3. Positionnement des postes sur la courbe du 6m

Le tracé 6m dans `_articCourtSvg()` est un arc `M 12.5,10 A 37.5,30 0 0,0 87.5,10`, soit une demi-ellipse de centre `(50, 10)`, `rx=37.5`, `ry=30`. Tout poste sur cette ligne doit donc avoir :

```
y(x) = 10 + 30 · √(1 − ((x − 50) / 37.5)²)
```

**Dispositif 0-6** — les 6 postes répartis en x à l'intérieur du domaine de l'arc (`x ∈ [15, 85]`, marge conservée par rapport aux bords `[12.5, 87.5]` pour ne pas coller aux poteaux) :

| Poste | x | y (calculé) |
|---|---|---|
| P1 | 15 | 20.8 |
| P2 | 29 | 34.9 |
| P3 | 43 | 39.5 |
| P4 | 57 | 39.5 |
| P5 | 71 | 34.9 |
| P6 | 85 | 20.8 |

Résultat visuel : les ailiers (P1/P6) remontent près des poteaux, les postes centraux (P3/P4) s'enfoncent au plus profond de la courbe — exactement la forme d'une vraie ligne de 6m défensive.

**Dispositif 1-5** — seuls P1/P2/P5/P6 tiennent la ligne des 6m et suivent la même formule (avec un `x` plus resserré vers les côtés puisqu'ils ne sont que 4 sur la ligne) ; P3 et P4 sortent délibérément de la ligne (c'est la définition même du 1-5) et gardent une position dédiée, calée par rapport au tracé du 9m (`M 0,15 A 52,44 0 0,0 100,15`, centre `(50, 2.9)`, `ry=44` → profondeur ≈ 46.9 au centre) :

| Poste | x | y | Logique |
|---|---|---|---|
| P1 | 15 | 20.8 | sur l'arc 6m |
| P2 | 32 | 36.3 | sur l'arc 6m |
| P3 | 50 | 46 | en couverture, juste devant le 9m |
| P4 | 50 | 66 | avancé, au-delà du 9m |
| P5 | 68 | 36.3 | sur l'arc 6m |
| P6 | 85 | 20.8 | sur l'arc 6m |

## 4. Bandeau de contrôles

Un seul bloc visuellement délimité (fond légèrement teinté, bordure) contenant :
- Ligne "DISPOSITIF" : le toggle existant (0-6 / 1-5), inchangé fonctionnellement
- Ligne "AFFICHAGE" : le toggle existant (Le + utilisé / 🏆 Top Def), inchangé fonctionnellement
- Ligne conditionnelle : si `window._articManualPoste` contient au moins une entrée, afficher `⚙ N poste(s) modifié(s) manuellement · [Réinitialiser]` — nouveau, répond directement à la confusion "je ne sais plus si je regarde Top Def ou mon choix perso". Le lien Réinitialiser vide `_articManualPoste` et redessine.

Ce regroupement répond à l'hypothèse retenue dans le Brief sur "les filtres" : ce n'est pas un filtre qui manque, c'est la lisibilité de ceux qui existent déjà, notamment le fait qu'une sélection manuelle active était jusqu'ici invisible tant qu'on ne regardait pas chaque rond un par un.

## 5. Panneau d'indicateurs

Fusionne l'ancienne ligne "Efficacité attaque adverse (référence)" et les 3 cartes Bloc dans une seule rangée de 4 cartes de même gabarit : **Référence** (aucun filtre de composition — le calcul global déjà existant), **Bloc Total**, **Bloc Central**, **BLOC34**. Même style visuel que les cartes Bloc actuelles (`.artic-block-card`), la carte Référence utilisant le même composant pour une lecture uniforme au lieu d'une ligne de texte à part.

## 6. Interactions

- Clic sur un rond-poste : ouvre/ferme le panneau de détail sous le panneau d'indicateurs (comportement inchangé), qui liste chaque joueur observé à ce poste + le sélecteur manuel.
- Choix d'un joueur dans le sélecteur manuel : le rond du poste concerné affiche ce joueur (nom seul + liseré selon son efficacité si des données existent pour lui à ce poste, liseré neutre sinon) ; le bandeau de contrôles fait apparaître/incrémente l'indicateur "N poste(s) modifié(s)".
- Clic sur "Réinitialiser" : vide toutes les sélections manuelles, revient au mode Le+utilisé/Top Def actif.
- Bascule de dispositif ou de mode d'affichage : comportement inchangé (reset de la sélection de poste et des overrides manuels, déjà en place).

## 7. États

- **Aucune donnée d'articulation sur la période** : message existant inchangé (`artic-empty`).
- **Poste sans aucune donnée** : rond semi-transparent, nom remplacé par "—", pas de liseré coloré (gris neutre) — comportement actuel conservé, juste sans le "pas de donnée" qui n'a plus besoin d'être écrit en toutes lettres puisqu'il n'y a plus de zone de texte pour l'efficacité dans le rond.
- **Poste avec override manuel mais sans donnée pour ce joueur à ce poste** : nom affiché, liseré gris neutre (équivalent visuel du cas précédent) — le détail reste consultable dans le panneau si besoin d'explication.
- **Carte d'indicateur sans séquence correspondante** (bloc trop restrictif) : texte "aucune séquence avec ce groupe" à la place du pourcentage, comme aujourd'hui.

## 8. Responsive

Page Analyse = usage staff desktop/iPad (CLAUDE.md §8), pas de contrainte mobile stricte. Le bandeau de contrôles passe en colonne (au lieu de lignes côte à côte) sous ~600px de large si nécessaire ; les 4 cartes d'indicateurs passent de 4 à 2 par ligne sur iPad portrait, comme le permet déjà `.artic-blocks` en `flex-wrap`. Le terrain garde son `aspect-ratio` carré existant, se réduit proportionnellement.

## 9. Composants réutilisés vs nouveaux

**Réutilisés tels quels :** `_articCourtSvg()` (tracé du terrain, inchangé), `computeArticulationStats()`, `_articBlockEff()`, `_articEffClass()`, `ARTIC_BLOCKS`, le panneau de détail et son select (`_setArticManualJoueur`), les toggles dispositif/mode (`_setArticDispositif`, `_setArticViewMode`) — seule leur enveloppe visuelle change.

**Nouveaux :** le conteneur `.artic-control-bar` regroupant les toggles + l'indicateur de personnalisation active, le recalcul de `ARTIC_LAYOUTS` selon la formule de l'arc (§3), la carte "Référence" alignée dans `.artic-blocks` (remplace la ligne `.artic-global-eff` actuelle), le liseré coloré sur `.artic-poste` (remplace le texte `.artic-poste-eff`), le bouton "Réinitialiser" et son compteur de postes modifiés.

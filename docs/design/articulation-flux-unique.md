# Design — Simplification du mode Articulation (flux unique)

**Agent :** Designer
**Date :** 2026-09-08

---

## 1. Principe général

Un seul axe de choix visible (Largeur, à côté de Dispositif), une seule zone de classement (à droite, inchangée en position depuis v264), un seul endroit pour le résultat (sous le terrain, dans la même colonne que lui). Tout ce qui affichait la même information à deux endroits (cartes du haut + panneau latéral) disparaît au profit d'un seul affichage par information.

## 2. Maquette ASCII

```
┌───────────────────────────────────────────────────────────────────┐
│  🛡 DÉFENSE FENIX — INTENTION ATTAQUE ADVERSES     [Attaque][Défense]│
│  [Vue générale] [Matrice 2×2] [🎯 Articulation]                     │
├───────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │  DISPOSITIF   [ 0-6 (116 séq.) ] [ 1-5 (13 séq.) ]             │ │
│ │  LARGEUR      [ À 6 ]  [ À 4 ]  [ À 2 ]                        │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│    ┌─────────────────────────────┐   CLASSEMENT — À 2 (P3-P4)      │
│    │▓▓▓▓▓▓▓▓░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   FIABLE (≥5 séq.)               │
│    │      __________________     │   Lukas.J / Marius.C  65% (51) │
│    │    ╱                    ╲   │   Idris.F / Marius.C   57% (14)│
│    │ (P1)                  (P6) │   Idris.F / Yoran.C     55% (11)│
│    │  (P2)                (P5)   │   Yoran.C / Marius.C    43% (21)│
│    │      (P3)      (P4)         │   Idris.F / Lukas.J     31% (13)│
│    │           ⌒⌒⌒⌒⌒⌒⌒⌒          │   Marius.C / Idris.F     0%  (5)│
│    └─────────────────────────────┘   ÉCHANTILLON FAIBLE (n<5)      │
│    Zacharie.D · Louis.M · Lukas.J ·   Siméo.R / Marius.C 100%(n<3)(1)│
│    Marius.C · Leni.A · Isaac.M        ...                          │
│                                                                     │
│    ┌─────────────────────────────┐                                │
│    │   65% de réussite défensive │                                │
│    │   Lukas.J / Marius.C — 51 séq.│                              │
│    │   But 16 · Tir raté 15 · PB 18│                              │
│    │   PO 2 · Jet franc 0          │                              │
│    └─────────────────────────────┘                                │
└───────────────────────────────────────────────────────────────────┘

Clic sur un rond (ex. P3) → un encart s'ouvre juste sous le terrain,
AU-DESSUS du résumé (pousse le résumé plus bas, ne le remplace pas) :

    ┌─────────────────────────────────┐
    │ P3 — changer le joueur           │
    │ Lukas.J   64 séq.  (cliquable)   │
    │ Idris.F   28 séq.  (cliquable)   │
    │ Yoran.C    7 séq.  (cliquable)   │
    │ ──────────────────────────────  │
    │ [— Auto (le plus utilisée) — ▾] │  ← select complet, cf. §3
    └─────────────────────────────────┘
```

## 3. Réponses aux questions en suspens du Brief

**Interaction du clic sur un rond.** Un encart apparaît **sous le terrain** (pas ancré visuellement au rond lui-même, pour éviter tout risque de débordement/chevauchement près des bords du terrain) — libellé avec le poste cliqué, listant les joueurs déjà observés à ce poste (nom + nombre de séquences, cliquables) puis un `<select>` complet incluant une option **"— Auto (le plus utilisée) —"** en tête (revient à la composition par défaut pour ce poste, remplace l'ancien lien "Réinitialiser" global — un reset se fait maintenant poste par poste, à l'endroit où on l'a modifié) suivie de tous les joueurs du club. Choisir une option ferme l'encart et applique le changement. Recliquer sur le même rond rouvre l'encart ; cliquer un autre rond bascule l'encart sur ce nouveau poste (un seul encart ouvert à la fois).

**Tri du classement avec petits échantillons.** Deux groupes distincts plutôt qu'un tri unique masquant le problème : **"Fiable (≥5 séq.)"** trié par % décroissant, puis **"Échantillon faible (n<5)"** trié par % décroissant également mais visuellement séparé et systématiquement en dessous — les "meilleures défenses" que Romain demande sont donc toujours celles du premier groupe, sans qu'une anomalie à 1 séquence et 100% ne remonte artificiellement en tête.

## 4. Bandeau de contrôles

Deux lignes seulement, même style que l'existant (`.artic-control-bar`, `.artic-control-row`) :
- DISPOSITIF : 0-6 / 1-5 (inchangé)
- LARGEUR : À 6 / À 4 / À 2 (remplace la ligne COMPOSITION — mêmes boutons `.enc-pie-mode-btn`, mêmes libellés que les anciennes cartes)

Aucune ligne "N postes modifiés manuellement" n'est nécessaire dans le bandeau : l'état d'édition se lit directement sur le terrain (le rond modifié) et dans le résumé sous le terrain, plus besoin d'un indicateur séparé en haut.

## 5. Terrain et résumé (colonne de gauche)

Inchangés : tracé SVG, positions sur la courbe du 6m, ronds avec nom seul (aucun liseré individuel, cf. STORY-37). Sous le terrain, dans l'ordre :
1. La liste récapitulative des 6 noms (`.artic-recap`, inchangée).
2. (Si un rond vient d'être cliqué) l'encart d'édition du poste.
3. Le résumé de la largeur active : gros pourcentage coloré (mêmes seuils que `_articDefClass`), nom(s) des joueurs concernés, nombre de séquences, puis le détail But/Tir raté/PB/PO/Jet franc sur une ligne compacte.

## 6. Classement (colonne de droite)

Ne contient plus qu'une chose : le classement de la largeur active, groupé Fiable/Échantillon faible comme décrit en §3. Plus de `<select>` de filtre en tête de colonne (la largeur se choisit désormais dans le bandeau de contrôles, pas ici) — la colonne entière se résume à un titre ("CLASSEMENT — À 2 (P3-P4)") et la liste.

## 7. États

- **Largeur sans aucune composition observée** : classement vide → message "Aucune composition observée pour cette largeur." à la place des deux groupes.
- **Résumé sans donnée** (cas théorique si un rond est mis sur un joueur qui n'a jamais tenu ce poste) : le résumé affiche "Composition jamais observée" à la place du %, sans détail chiffré.
- **Encart d'édition sur un poste sans historique** : liste vide, uniquement le `<select>` "Autre joueur".

## 8. Responsive

Inchangé par rapport à STORY-38 : les deux colonnes passent en pile verticale sous ~700px (`flex-wrap` déjà en place sur `.artic-main-row`).

## 9. Composants réutilisés vs nouveaux vs retirés

**Réutilisés tels quels :** `_articCourtSvg()`, `ARTIC_LAYOUTS`/`_articArcY`, `ARTIC_BLOCKS`, `computeArticulationStats`, `computeArticCombos`, `_articBlockEff`, `_articBlockDetail`, `_articTauxDefense`, `_articDefClass`, `_setArticManualJoueur`, `_setArticManualCombo` (réutilisée pour le clic sur une ligne du classement), `_setArticDispositif`.

**Nouveaux :** le toggle Largeur dans le bandeau (remplace Composition), l'encart d'édition déclenché par clic sur un rond (nouvel état `window._articOpenPoste`), le bloc résumé sous le terrain (fusion visuelle de l'ancienne carte de largeur + de l'ancien panneau détail), le regroupement Fiable/Échantillon faible du classement.

**Retirés :** le toggle Composition (Le+utilisée/Suggestion) et son état `window._articViewMode`, le filtre Poste autonome et son `<select>` de tête de colonne, la rangée de 4 cartes en haut d'écran (`.artic-blocks-section`), le marquage concerné/non-concerné des cartes, le panneau de détail latéral tel qu'il existait (fusionné dans le résumé sous le terrain), l'indicateur "N postes modifiés · Réinitialiser" du bandeau (plus nécessaire sans liste de filtre séparée à réinitialiser).

# Design — Articulation défensive (efficacité par poste occupé)

**Agent :** Designer
**Date :** 2026-09-02

---

## 0. Décision de placement (résout Brief §7)

Romain a décrit deux points d'insertion en apparence différents (un "onglet à côté d'intention attaque" en vue match, un "onglet articulation" dans "Défense Fenix — Intention attaque adverses" en vue saison). **Ce sont en réalité le même point technique** : `renderEncFamillesSection()` est la fonction unique qui rend cette section, appelée aussi bien dans l'onglet "Intention attaque" (vue match) que directement sur la page (vue saison complète) — elle possède déjà un système de mode (`window._encGraphMode`, actuellement `pie` / `matrice`).

**Décision** : "Articulation" devient un **3e mode**, sélectionnable via un bouton à côté de "Vue générale" / "Matrice 2×2", **visible uniquement quand le toggle Attaque/Défense est sur Défense** (griser ou masquer le bouton en mode Attaque — l'articulation défensive n'existe pas côté attaque FENIX). Ce choix évite de dupliquer la logique entre vue match et vue saison, et respecte le fait que les deux formulations de Romain visaient le même écran.

## 1. Maquette — mode "Articulation" (Défense sélectionnée)

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🛡 DÉFENSE FENIX — INTENTION ATTAQUE ADVERSES  [⚡Attaque][🛡Défense] │
│                                    [Vue générale][Matrice 2×2][🎯Articulation] i │
├──────────────────────────────────────────────────────────────────────┤
│  Dispositif :  [ 0-6 (24 séq.) ]  [ 1-5 (11 séq.) ]  ← si les 2 coexistent │
│                                                                        │
│         ┌────────────────────────────────────┐                       │
│         │              🥅 BUT FENIX           │                       │
│         │   ┌──┐  ┌──┐  ┌──┐ ┌──┐  ┌──┐  ┌──┐ │                       │
│         │   │P1│  │P2│  │P3│ │P4│  │P5│  │P6│ │   ← 0-6, alignés      │
│         │   └──┘  └──┘  └──┘ └──┘  └──┘  └──┘ │                       │
│         │  Zach.D Leni.A Yoran.C Marius.C Issa.S Isaac.M              │
│         │   62%    54%    41%    38%    58%    65%  ← eff. adverse    │
│         └────────────────────────────────────┘                       │
│                                                                        │
│  🏆 MEILLEURES CHARNIÈRES CENTRALES (P2-P5)                           │
│  1. Leni.A · Yoran.C · Marius.C · Issa.S — 36% eff. adverse (18 séq.) │
│  2. Julien.L · Yoran.C · Marius.C · Issa.S — 41% eff. adverse (9 séq.)│
│  (échantillon < 6 séq. non affiché — pas assez de données)            │
│                                                                        │
│  Clic sur un poste → détail à droite / en dessous                     │
└──────────────────────────────────────────────────────────────────────┘
```

**Disposition 1-5** (P4 avancé, P3 en couverture) :

```
         ┌────────────────────────────────────┐
         │              🥅 BUT FENIX           │
         │   ┌──┐  ┌──┐        ┌──┐  ┌──┐  ┌──┐ │
         │   │P1│  │P2│        │P5│  │P6│      │   ← ligne à 6m
         │   └──┘  └──┘  ┌──┐  └──┘  └──┘      │
         │              │P3│                   │   ← reste en couverture
         │              └──┘                   │
         │               ┌──┐                  │
         │               │P4│  ← sorti, avancé  │
         │               └──┘                  │
         └────────────────────────────────────┘
```

## 2. États

- **Aucune donnée taguée sur la période** (pas de ligne avec `ARTICULATION DEF` renseigné) : message neutre "Pas encore de données d'articulation défensive sur cette période" à la place du demi-terrain — pas une erreur, juste un rappel que le tag est manuel et progressif.
- **Un seul dispositif présent** (ex. seulement du 0-6) : le sélecteur `[0-6][1-5]` ne s'affiche pas, le demi-terrain montre directement le dispositif disponible.
- **Les deux dispositifs coexistent** : sélecteur affiché, 0-6 sélectionné par défaut (le plus courant en général) ; changer de dispositif redessine le demi-terrain avec l'autre layout et recalcule les stats.
- **Poste avec plusieurs joueurs différents sur la période** (ex. blessure/rotation en cours de saison) : le poste affiche le joueur le plus fréquent + un badge discret "+2 autres" ; clic sur le poste liste tous les joueurs l'ayant occupé avec leur efficacité respective, pas seulement le plus fréquent.
- **Échantillon insuffisant pour un poste précis** (moins de 3 séquences) : efficacité affichée en gris avec `(n<3)`, cohérent avec le pattern déjà utilisé dans le tableau Gardien × Systèmes adverses.

## 3. Interactions

- **Clic sur un poste** → ouvre un panneau (sous le demi-terrain, comme le tableau de détail des familles) listant : joueur(s) ayant occupé ce poste, nombre de séquences, efficacité adverse, et un lien "voir toutes les séquences" (réutilise le pattern de drill-down déjà existant sur les cartes de famille).
- **Sélecteur de joueur** (au-dessus ou à côté du demi-terrain) : liste déroulante de tous les joueurs FENIX ayant occupé au moins un poste sur la période — le sélectionner met en évidence (surbrillance) tous les postes qu'il a occupés, avec son efficacité à chacun.
- **Bloc "Meilleures charnières centrales"** : purement informatif, pas cliquable dans une première version (peut évoluer si Romain le demande) — recalculé à chaque changement de filtre match/dispositif.
- **Bouton "Articulation" désactivé en mode Attaque** : curseur par défaut, `opacity` réduite, `title="Disponible uniquement en mode Défense"` au survol — cohérent avec le pattern déjà utilisé pour le bouton Matrice 2×2 quand non pertinent.

## 4. Responsive

Page Analyse = usage staff desktop/iPad exclusivement (comme le reste de la section Intention attaque) — pas de variante mobile à concevoir, cohérent avec les contraintes déjà actées du projet.

## 5. Composants réutilisés vs nouveaux

**Réutilisés** : structure de toggle Vue générale/Matrice 2×2 (`.enc-pie-mode-btn`), pattern de panneau de détail au clic (drill-down des cartes de famille), pattern `(n<3)` du tableau Gardien × Systèmes adverses, style de fond terrain (dégradé bleu, but avec filet) du terrain SVG existant de la page Joueurs — adapté en demi-terrain.

**Nouveaux** : le composant demi-terrain avec postes défensifs positionnés dynamiquement (0-6 vs 1-5), le sélecteur de dispositif, le bloc de classement des charnières centrales, le sélecteur de joueur dédié à ce mode.

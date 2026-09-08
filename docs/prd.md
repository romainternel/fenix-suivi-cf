# PRD — Simplification du mode Articulation (un seul flux : largeur → classement → terrain)

**Agent :** Product Manager
**Date :** 2026-09-08

---

## 1. Objectif

Réduire le mode Articulation à un seul axe de choix (largeur de charnière) et rassembler toute l'information de performance à un seul endroit (sous le terrain), en supprimant tout ce que les 4 derniers cycles ont ajouté sans que Romain ne l'ait redemandé explicitement dans ce retour.

## 2. Features

### F1 — Contrôles réduits à Dispositif + Largeur
Le bandeau de contrôles ne garde que deux choix : Dispositif (0-6/1-5, inchangé) et Largeur de charnière (À 6 / À 4 / À 2 — réutilise `ARTIC_BLOCKS`). Suppression du toggle Composition et du filtre Poste.

### F2 — Classement cliquable par largeur
Pour la largeur choisie, liste des compositions observées triées par % de réussite défensive décroissant (meilleure défense en tête), affichant nom(s) + % + nombre de séquences. Cliquer une ligne place cette composition sur le terrain (tous les postes de la largeur d'un coup).

### F3 — Résumé sous le terrain
Sous le terrain (pas à côté, pas dans un panneau séparé) : le % de réussite défensive de la composition actuellement affichée pour la largeur choisie + le détail du résultat adverse (But/Tir raté/PB/PO/Jet franc), recalculé à chaque changement de composition (classement cliqué ou rond modifié).

### F4 — Édition d'un joueur par clic sur le rond
Cliquer un rond du terrain permet de choisir un autre joueur pour ce poste précis (sélecteur inline au clic, pas de liste séparée). Remplace le filtre "Poste"/panneau latéral existant.

### F5 — Suppressions
Retrait complet : toggle Composition (Le+utilisée/Suggestion), filtre Poste et sa liste dédiée, rangée de 4 cartes (Référence + À6/À4/À2) en haut d'écran, marquage "concerné/non concerné" des cartes, panneau de détail latéral séparé.

## 3. Priorités

| # | Feature | Priorité |
|---|---|---|
| F1 | Contrôles réduits à Dispositif + Largeur | **Must Have** |
| F2 | Classement cliquable par largeur | **Must Have** |
| F3 | Résumé sous le terrain | **Must Have** |
| F4 | Édition d'un joueur par clic sur le rond | **Must Have** |
| F5 | Suppressions | **Must Have** (condition de F1-F3 : sans elles, l'écran reste aussi chargé qu'avant) |

## 4. Critères d'acceptation

- Le bandeau de contrôles n'affiche que Dispositif et Largeur — aucun autre toggle, aucun filtre Poste visible en permanence.
- Le classement d'une largeur donnée est trié par % de réussite défensive décroissant ; cliquer une ligne recompose immédiatement le terrain avec cette composition.
- Sous le terrain apparaît, pour la composition actuellement affichée : son % de réussite défensive + le détail But/Tir raté/PB/PO/Jet franc — ces chiffres changent aussi bien après un clic sur le classement qu'après une modification manuelle d'un rond.
- Cliquer un rond ouvre un moyen de choisir un autre joueur pour ce poste sans quitter la zone du terrain (pas de liste séparée ailleurs sur l'écran).
- Aucune carte "Référence/À6/À4/À2" ne subsiste en haut d'écran ; aucune classe ou logique "concerné/non concerné" ne subsiste dans le code.
- Les chiffres affichés (%, séquences, détail) restent calculés par les fonctions déjà existantes (`computeArticulationStats`, `_articBlockEff`, `_articBlockDetail`, `computeArticCombos`, `_articTauxDefense`, `_articDefClass`) — aucun recalcul de fond.
- Non-régression : bascule Dispositif, bascule Attaque/Défense (désactivation + reset), vue match et vue saison.

## 5. Hors scope

- Toute modification du calcul de fond (les fonctions listées ci-dessus restent inchangées, seule leur consommation dans le rendu change).
- STORY-35 (classement automatique des charnières P2-P5) — la feature F2 de ce cycle en couvre l'essentiel dans l'esprit (un classement par %), sans être formellement la même story ; pas de fusion formelle à faire ici.
- Le tracé du terrain (`_articCourtSvg()`) et le placement géométrique des postes (`ARTIC_LAYOUTS`/`_articArcY`) — inchangés.

## 6. Dépendances

- `ARTIC_BLOCKS` (structure des 3 largeurs), `computeArticCombos()` (classement), `_articBlockEff()`/`_articBlockDetail()` (résumé sous le terrain) — tous déjà écrits, réutilisés tels quels.
- `_setArticManualJoueur()` reste le mécanisme d'édition d'un poste ; seul son déclenchement change (depuis le rond, plus depuis une liste).

## 7. Risques

- **Perte d'un usage utile** : le filtre "Poste" permettait de voir TOUS les joueurs ayant occupé un poste avec leur fréquence, information purement descriptive. En le retirant au profit du seul clic-sur-rond, cette liste de fréquence doit rester accessible d'une manière ou d'une autre (probablement dans le sélecteur inline lui-même) pour ne pas perdre en même temps une information utile que Romain n'a pas explicitement demandé à retirer.
- **Classement trié par % sur petit échantillon** : sans garde-fou, une composition à 1 séquence et 100% peut apparaître en tête d'un classement "meilleures défenses" — le Designer doit trancher comment présenter ce cas sans fausser la lecture (déjà partiellement couvert par le repère `(n<3)` existant, à confirmer suffisant).

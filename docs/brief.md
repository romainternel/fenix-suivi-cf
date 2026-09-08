# Brief — Simplification du mode Articulation (un seul flux : largeur → classement → terrain)

**Agent :** Analyst
**Date :** 2026-09-08

---

## 1. Contexte

Entre v264 et v267, le mode Articulation a reçu quatre ajouts rapprochés sans reprise d'ensemble : un layout en deux colonnes (terrain + listing), un double système de filtre (Poste individuel / Charnière), des lignes cliquables, un marquage visuel "concerné/non concerné" sur les cartes du haut, et un panneau de détail séparé. Chaque ajout répondait à un retour ponctuel de Romain, mais l'empilement produit aujourd'hui un écran qu'il juge lui-même "pas clair du tout" : l'information pertinente (qui est le mieux, à quel point, pourquoi) est dispersée entre une rangée de cartes en haut, une colonne de liste à droite, et un panneau de détail encore plus bas.

## 2. Problème

Romain formule directement ce qui ne va pas et ce qu'il veut à la place :
- Trop de mécanismes de filtre coexistent (Dispositif, Composition Le+utilisée/Suggestion, Poste, Charnière) alors qu'il n'a besoin que d'un seul axe de choix : la **largeur de la charnière** (à 6, à 4, à 2).
- L'information de performance (% de réussite, détail du résultat adverse) est **loin du terrain** (colonne de droite, panneau séparé) alors qu'il veut la voir **directement sous le terrain**, au même endroit où il regarde déjà qui est où.
- Le réglage fin joueur-par-joueur doit se faire **en cliquant directement sur le rond du poste concerné**, pas via une liste ou un menu déroulant séparé du terrain.

## 3. Utilisateurs

Inchangé : Romain, staff/coach, desktop, préparation/débrief tactique (cf. cycles précédents).

## 4. Vision

Un seul flux de lecture, dans l'ordre où l'œil doit le parcourir : je choisis une largeur de charnière (6, 4 ou 2) → je vois un classement cliquable des meilleures compositions à cette largeur, triées par % de réussite défensive → je clique la meilleure (ou une autre) → le terrain affiche cette composition → juste sous le terrain, je vois son % et le détail du résultat adverse (But/Tir raté/PB/PO/Jet franc) → si je veux ajuster un seul joueur, je clique directement sur son rond.

## 5. Scope

**Dans le scope :**
- Remplacer les filtres actuels (Dispositif + Composition + Poste + Charnière) par exactement : **Dispositif** (0-6/1-5, inchangé, nécessaire car change la géométrie du terrain) + **Largeur de charnière** (À 6 / À 4 / À 2, remplace Poste+Charnière+Composition).
- Un classement cliquable des compositions pour la largeur choisie, trié par % de réussite défensive (les meilleures défenses en premier — "il me faut les meilleures défenses"), avec le nombre de séquences.
- Cliquer une ligne du classement place cette composition sur le terrain.
- Sous le terrain (pas sur le côté, pas dans un panneau séparé) : le % de réussite défensive de la composition actuellement affichée + le détail du résultat adverse (But/Tir raté/PB/PO/Jet franc), pour la largeur actuellement choisie.
- Cliquer directement sur un rond du terrain permet de changer le joueur de CE poste précis, sans passer par une liste séparée.

**Hors scope (retiré, pas remplacé) :**
- Le filtre "Poste" autonome et sa liste dédiée (qui a joué là, combien de fois) — remplacé par le clic direct sur le rond.
- Le toggle "Composition" (Le + utilisée / 💡 Suggestion) — remplacé par le classement par % qui répond directement à "quelle est la meilleure composition", sans avoir besoin d'un mode de calcul séparé.
- Le marquage visuel "concerné/non concerné" des cartes — n'a plus lieu d'être si une seule largeur est affichée à la fois (plus de cartes multiples simultanées à distinguer).
- La rangée de 4 cartes "Référence + À6/À4/À2" en haut d'écran — remplacée par l'affichage unique sous le terrain, propre à la largeur actuellement choisie (éviter de montrer la même information à deux endroits).
- Le calcul sous-jacent (`computeArticulationStats`, `_articBlockEff`, `_articBlockDetail`, `computeArticCombos`, `_articTauxDefense`) reste inchangé — c'est uniquement l'organisation de l'écran et le nombre de filtres visibles qui changent.

## 6. Critères de succès

- Un seul groupe de contrôles visible pour choisir la vue (Dispositif + Largeur), plus aucun autre filtre.
- Le classement des compositions est trié par % de réussite défensive, meilleure en tête.
- Le % et le détail du résultat adverse apparaissent sous le terrain, jamais ailleurs.
- Modifier un joueur se fait en cliquant sur son rond, sans liste séparée ni menu déroulant flottant à côté du terrain.
- Rien de plus à l'écran que ce qui précède — tout élément de v264-v267 non listé ci-dessus disparaît.

## 7. Questions en suspens

- Interaction exacte du clic sur un rond (sélecteur inline apparaissant au clic vs autre mécanisme) — à trancher par le Designer, la seule contrainte ferme étant "pas de liste séparée du terrain".
- Tri du classement strictement par % (avec le repère `(n<3)` déjà en place pour les échantillons faibles) vs un tri qui priorise d'abord les échantillons fiables — à trancher par le Designer/PM, Romain n'ayant précisé que "les meilleures défenses", pas la gestion des petits échantillons.

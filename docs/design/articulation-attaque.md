# Design — Articulation offensive (mode "Articulation" côté Attaque)

**Agent :** Designer
**Date :** 2026-09-15

---

## 1. Principe : réutilisation totale du langage visuel de l'articulation défensive

Romain connaît déjà le geste (clic sur un poste → panneau, bascule de groupement, classement cliquable). Aucune réinvention d'interaction n'est nécessaire ni souhaitable — ce document ne redéfinit que ce qui **doit** changer (données, disposition des postes, formule affichée), et confirme explicitement tout ce qui reste identique.

## 2. Point d'entrée — inchangé dans sa position, débridé dans son état

Le bouton "🎯 Articulation" (barre `⚡ Vue générale / Matrice 2×2 / 🎯 Articulation`, en haut à droite de la section Intentions attaque/Défense) est **aujourd'hui grisé avec l'infobulle "Disponible uniquement en mode Défense" dès que le toggle ⚡ Attaque / 🛡 Défense est sur Attaque**. Cette contrainte disparaît : le bouton reste cliquable dans les deux modes, sans changer de position ni d'apparence active/inactive.

Le contenu affiché change selon le mode :
- **🛡 Défense** → panneau existant, strictement inchangé.
- **⚡ Attaque** → nouveau panneau miroir décrit ci-dessous.

Basculer ⚡/🛡 pendant que "🎯 Articulation" est actif ne retombe plus sur "Vue générale" (comportement actuel, qui n'avait de sens que faute d'équivalent côté attaque) : chaque côté garde son panneau et son état (poste ouvert, override manuel, groupement actif) — bascule instantanée entre les deux, aucun recalcul perdu.

## 3. Disposition des 6 postes offensifs sur le demi-terrain

Même `<svg>` de demi-terrain que la défense (but en haut, mêmes dégradés/traits — aucune nouvelle image), mais une disposition différente car une **attaque placée** occupe le terrain différemment d'une **défense en ligne** :

- **PVT** (pivot) : poste central, au plus profond de la courbe des 6m (même courbe que les postes défensifs, x=50) — c'est la position la plus proche du but après les ailiers.
- **ALG / ALD** (ailier gauche/droit) : aux extrémités de cette même courbe des 6m (x≈12 / x≈88) — proches du poteau, comme un vrai ailier.
- **ARG / DC / ARD** (arrière gauche, demi-centre, arrière droit — la **base arrière**) : sur l'arc extérieur des 9m déjà tracé en pointillés sur le terrain existant (x≈25 / 50 / 75) — clairement plus loin du but que les 3 postes précédents, lisible au premier regard comme "la ligne arrière".

Résultat visuel : un éventail à deux profondeurs — PVT/ALG/ALD proches du but, ARG/DC/ARD sur l'arc extérieur — qui donne instantanément à Romain la lecture "base arrière vs postes de finition", sans légende nécessaire.

Chaque poste reprend exactement le style existant (rond, libellé du poste, nom du joueur, badge "+N" si plusieurs joueurs y sont passés, icône ✎ si override manuel) — même `.artic-poste`, même comportement de clic.

## 4. Contrôles au-dessus du terrain

Une seule ligne de contrôle (pas deux comme en défense, puisqu'il n'y a pas de "DISPOSITIF" côté attaque — une seule disposition existe) :

```
LARGEUR   [ 6 complet ]  [ Base arrière ]
```

- **6 complet** : les 6 postes (ALG-ARG-DC-ARD-ALD-PVT).
- **Base arrière** : ARG-DC-ARD uniquement — répond directement à "la meilleure base arrière" de la demande.

Mêmes boutons visuels que "LARGEUR" en défense (`.enc-pie-mode-btn`), actif/inactif identique.

## 5. Panneau d'édition d'un poste (clic sur un rond)

Identique trait pour trait à la défense : titre "`[POSTE]` — changer le joueur", liste des joueurs déjà observés à ce poste triée par fréquence (cliquable), puis un select complet de l'effectif avec "— Auto (le plus utilisé) —" en tête. Aucune différence de comportement.

## 6. Résumé sous le terrain — la différence de fond

**Ce résumé répond à une question différente de la défense et doit le dire clairement**, pour qu'un panneau qui se ressemble visuellement ne soit jamais lu de travers :

```
62%  DE RÉUSSITE OFFENSIVE
Julien.L / Issa.S / Idris.F / Louis.M / Roman.L / Yoran.C — 14 séq.
But 8 · Tir raté 5 · PB 3 · PO 1 · Jet franc 0
```

- Le nombre est l'**efficacité standard de l'application** : buts ÷ (buts + tirs ratés) — la même formule que partout ailleurs dans l'app (dashboard, fiches joueurs, cartes de familles). **Ce n'est pas la formule inversée de la défense** (qui répond à "quelle part des séquences adverses n'a rien donné", plus haut = meilleure défense) — ici plus haut = attaque plus efficace, lecture directe sans inversion mentale.
- Libellé explicite "**RÉUSSITE OFFENSIVE**" (au lieu de "réussite défensive") — le mot suffit à lever toute ambiguïté au moment de la lecture.
- Détail But/Tir raté/PB/PO/Jet franc conservé à l'identique (même reproche de transparence que la défense).
- Mêmes seuils de coloration (vert/orange/rouge) que la défense pour la cohérence visuelle globale de l'app, mais calculés sur l'efficacité directe (pas de miroir 100-x nécessaire ici puisqu'il n'y a pas d'inversion de sens).
- Cas vides identiques à la défense : composition incomplète (poste sans joueur connu) → message dédié ; composition jamais observée ensemble → message dédié ; aucune donnée sur la période → message dédié niveau section.

## 7. Classement (colonne de droite) — identique dans sa mécanique

Même titre "Classement — `[groupement]` (`[POSTES]`)", même regroupement Fiable (≥5 séq.) / Échantillon faible (<5), même tri décroissant sur le pourcentage affiché (ici l'efficacité offensive directe, pas un taux inversé), même clic pour placer toute la composition d'un coup sur le terrain.

## 8. Ce qui ne change pas du tout

- Emplacement dans la page (onglet Tactique, section Intentions attaque/Défense).
- Filtre MATCH global de la page (match précis ou saison complète) — s'applique de la même façon.
- Aucune nouvelle page, aucun nouvel onglet, aucune nouvelle icône de navigation.

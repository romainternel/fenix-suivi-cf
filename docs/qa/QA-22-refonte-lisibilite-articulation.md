# QA-22 — Refonte lisibilité du mode Articulation (STORY-36)

**Agent :** QA
**Date :** 2026-09-06

---

## Critères validés

- [x] `ARTIC_LAYOUTS` recalculé via `_articArcY`/`ARTIC_6M_ARC` pour le dispositif 0-6 (6 postes) et pour P1/P2/P5/P6 du dispositif 1-5 ; P3/P4 du 1-5 gardent leurs coordonnées fixes (`[50,46]`/`[50,66]`)
- [x] Visuellement, les 6 ronds du dispositif 0-6 suivent la courbe du 6m dessinée par `_articCourtSvg()` — vérifié par capture d'écran, forme de "ligne défensive courbée" conforme à la maquette du Designer
- [x] Chaque rond-poste n'affiche plus que le nom — vérifié pour les 3 branches : override manuel avec donnée, override manuel sans donnée (testé en pinçant un gardien sur un poste de champ), mode auto avec donnée
- [x] Cas "aucune donnée pour ce poste" (`!joueurMap.size`) : testé en tronquant artificiellement les données d'un match réel — rendu correct, `—`, classe `noref`, opacité réduite
- [x] Liseré de couleur sur le rond reflète `_articEffClass()` — vérifié `fort`/`moyen`/`faible`/`noref` visuellement sur données réelles (0-6 et 1-5)
- [x] `.artic-poste.selected` utilise `outline` — vérifié via `getComputedStyle` qu'un poste sélectionné ET coloré affiche SIMULTANÉMENT `outline: rgb(252,211,77) solid 1.6px` et `box-shadow: ... 0 0 0 3px` (ex. classe `moyen`)
- [x] Bandeau de contrôles (`.artic-control-bar`) regroupe visuellement Dispositif et Affichage — conforme à la maquette
- [x] Indicateur "N poste(s) modifié(s) manuellement · Réinitialiser" apparaît dès qu'un override est actif, avec le marqueur `✎` sur le poste concerné
- [x] "Réinitialiser" vide tous les overrides (`window._articManualPoste` revient à `{}`) et fait disparaître l'indicateur
- [x] Changer de dispositif fait immédiatement disparaître l'indicateur "N postes modifiés" — testé explicitement (`beforeChange: true` → `afterChange: false` après `_setArticDispositif`)
- [x] Carte "Référence adverse" au même gabarit que les 3 cartes Bloc, gère l'échantillon faible (`100% (n<3) · 1 séq.` vérifié sur le match AMICAL FENIX-BILLERE, dispositif 1-5)
- [x] Panneau de détail + sélecteur manuel fonctionnent à l'identique de l'existant (comportement inchangé, seulement l'enveloppe visuelle autour a changé)
- [x] Non-régression : bascule Vue générale/Matrice 2×2, désactivation du bouton Articulation en mode Attaque avec reset automatique (`window._encGraphMode` repasse à `'pie'`), fonctionnement identique en vue match ET en vue saison
- [x] Testé à largeur iPad portrait (768px) : les 6 postes du 0-6 restent clairement dégagés du rectangle du but, les 4 cartes d'indicateurs passent en grille 2×2 lisible (`.artic-blocks` en `flex-wrap`)

## Bugs trouvés

Aucun.

## Régressions détectées

Aucune. Les modes Vue générale et Matrice 2×2 (mode Attaque) ont été re-testés après les changements et fonctionnent identiquement à avant STORY-36.

## Verdict

**PASSED** — tous les critères d'acceptation de STORY-36 vérifiés, y compris les cas limites (poste sans donnée, échantillon faible sur la carte Référence, changement de dispositif avec override manuel actif).

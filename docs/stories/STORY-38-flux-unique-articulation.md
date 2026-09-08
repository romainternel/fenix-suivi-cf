# STORY-38 — Simplification du mode Articulation (flux unique : largeur → classement → terrain)

**En tant que** Romain (staff),
**Je veux** un seul choix de largeur de charnière (6/4/2), un classement cliquable des meilleures compositions à cette largeur, et le résultat détaillé directement sous le terrain,
**Afin de** comprendre en un coup d'œil quelle composition défend le mieux, sans avoir à regarder plusieurs zones d'écran différentes pour reconstituer l'information.

## Contexte technique

- Zone concernée : `js/page-analyse.js`, bloc Articulation (`_drawArticulationCourt` et tout ce qui l'entoure) ; `css/style.css` classes `.artic-*`.
- Cycle précédent directement concerné : v264-v267 (STORY-38 initiale + 3 retours directs) — ce cycle **remplace** leur UI, pas ne l'étend pas. cf. `docs/arch/articulation-flux-unique.md` pour le détail exact de ce qui est retiré/ajouté/réutilisé.
- Nouveaux états : `window._articWidth` (remplace `_articListingFilter`), `window._articOpenPoste` (nouveau). États retirés : `window._articViewMode`, `window._articListingFilter`, `window._articSelectedPoste` (déjà retiré en amont).
- Nouvelles fonctions : `_articRankedCombos()`, `_toggleArticPosteEditor()`, `_setArticWidth()` — cf. Architecture §4 pour leur code exact.
- Fonctions supprimées : `_setArticViewMode`, `_setArticListingFilter`, `_selectArticPoste`, `_articPosteHighlighted` — vérifier qu'aucun `onclick` résiduel ne les référence encore avant suppression (R1 du Risk Analyst).
- Fonctions inchangées (réutilisées telles quelles) : `computeArticulationStats`, `_articBlockEff`, `_articBlockDetail`, `computeArticCombos`, `_articTauxDefense`, `_articDefClass`, `_setArticManualCombo`, `_setArticManualJoueur` (étendue d'une ligne pour fermer l'encart), `ARTIC_BLOCKS`, `ARTIC_LAYOUTS`, `_articArcY`, `_articCourtSvg`, `_setArticDispositif`.

## Critères d'acceptation

- [ ] Le bandeau de contrôles n'affiche que 2 lignes : DISPOSITIF (0-6/1-5, inchangé) et LARGEUR (À 6 / À 4 / À 2) — aucun toggle Composition, aucun filtre Poste visible en permanence, aucune ligne "N postes modifiés".
- [ ] La colonne de droite affiche uniquement le classement de la largeur active, titré "CLASSEMENT — À N (postes)", groupé en deux sections : "Fiable (≥5 séq.)" triée par % de réussite défensive décroissant, puis "Échantillon faible (n<5)" triée pareil — vérifié qu'une composition à exactement 5 séquences tombe dans "Fiable" sans le label `(n<3)`.
- [ ] Cliquer une ligne du classement (fiable ou échantillon faible) place cette composition sur le terrain (`_setArticManualCombo`, réutilisée sans changement) et la marque active dans la liste.
- [ ] Sous le terrain (même colonne, pas la colonne de droite) : un bloc résumé affiche le % de réussite défensive (gros, coloré selon `_articDefClass`) de la composition actuellement affichée pour la largeur active, les noms concernés, le nombre de séquences, et le détail But/Tir raté/PB/PO/Jet franc sur une ligne compacte — recalculé aussi bien après un clic sur le classement qu'après une édition manuelle d'un rond.
- [ ] Cliquer un rond du terrain ouvre, sous le terrain (au-dessus du résumé), un encart listant les joueurs déjà observés à ce poste (nom + n séquences, cliquables) et un `<select>` complet avec une option "— Auto (le plus utilisée) —" en tête. Choisir une option ferme l'encart et applique le changement. Recliquer le même rond rouvre l'encart ; cliquer un autre rond bascule dessus.
- [ ] Aucune carte "Référence/À6/À4/À2" ne subsiste en haut d'écran ; aucune classe/logique `concerned`/`unconcerned` ne subsiste dans le code (`grep` négatif attendu).
- [ ] Cas "À 6" avec le groupe "Fiable" vide (déjà observé sur les données réelles) : affichage propre, pas de panneau cassé — message clair du type "Aucune composition fiable observée" plutôt qu'un vide silencieux.
- [ ] Les chiffres affichés (%, séquences, détail) restent strictement identiques à ceux déjà vérifiés en STORY-37/38 pour les mêmes compositions — seule la présentation change.
- [ ] Non-régression : bascule Dispositif (reset des overrides manuels, inchangé), bascule Attaque/Défense (désactivation + reset auto), vue match et vue saison.

## Hors scope

- Modification de `computeArticulationStats`, `_articBlockEff`, `_articBlockDetail`, `computeArticCombos`, `_articTauxDefense`, `_articDefClass` (calcul de fond).
- STORY-35 (classement automatique formel des charnières P2-P5) — ce cycle en couvre l'esprit via F2 mais ne le clôt pas formellement.
- Le tracé du terrain (`_articCourtSvg()`) et le placement géométrique des postes.
- Un mécanisme de reset global multi-postes (retiré, pas remplacé — cf. Risk R3, accepté).

## Dépend de

- Aucune (remplace l'UI de STORY-34/36/37/38, v258→v267 en production).

## Taille

M

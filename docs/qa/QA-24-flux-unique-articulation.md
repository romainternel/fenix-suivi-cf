# QA-24 — Simplification du mode Articulation (flux unique) (STORY-38)

**Agent :** QA
**Date :** 2026-09-08

---

## Critères validés

- [x] Bandeau de contrôles réduit à DISPOSITIF + LARGEUR — vérifié visuellement, aucun toggle Composition, aucun filtre Poste, aucune ligne "N postes modifiés" présente
- [x] Classement de la largeur active groupé Fiable (≥5 séq.)/Échantillon faible (n<5), trié par % décroissant dans chaque groupe — vérifié sur données réelles (À 6 : 50%/6 séq. en tête du groupe Fiable ; À 2 : 65%/51 séq. Lukas.J/Marius.C en tête)
- [x] Cliquer une ligne du classement place la composition sur le terrain et la marque active — vérifié : clic sur "Zacharie.D/Julien.L/Lukas.J/Marius.C/Leni.A/Isaac.M" (100%, 5 séq.) a bien mis à jour les 6 ronds avec marqueurs ✎
- [x] Résumé sous le terrain (% + noms + détail But/Tir raté/PB/PO/Jet franc) affiché dans la colonne du terrain, pas dans la colonne de droite — vérifié par capture d'écran, recalculé après clic sur le classement (100% affiché) et après édition manuelle d'un rond (repasse à "jamais observée")
- [x] Clic sur un rond ouvre l'encart d'édition sous le terrain avec les joueurs déjà observés (nom + n séquences, cliquables, le courant en surbrillance) + un `<select>` avec "— Auto (le plus utilisée) —" en tête — vérifié sur P3 (7 joueurs listés, Lukas.J actif)
- [x] Choisir un joueur dans l'encart (clic sur une ligne ou via le select) ferme l'encart et applique le changement — vérifié dans les deux sens (clic sur "Idris.F", puis "Auto" depuis le select, retour à "Lukas.J")
- [x] Aucune carte "Référence/À6/À4/À2" ne subsiste en haut d'écran ; recherche `grep` de `concerned`/`unconcerned`/`artic-blocks` : 0 résultat dans le code
- [x] Cas "À 6" avec groupe Fiable vide : message "Aucune composition fiable observée." affiché, groupe Échantillon faible reste visible — testé avec un jeu de données réduit
- [x] Cas sans aucune composition observée pour une largeur, et cas sans aucune donnée d'articulation du tout : messages appropriés, pas de panneau cassé
- [x] Chiffres identiques à ceux déjà vérifiés en STORY-37/38 pour les mêmes compositions (Lukas.J/Marius.C : 65%, 51 séq., But 16/Tir raté 15/PB 18/PO 2/Jet franc 0 — valeurs inchangées)
- [x] Non-régression : bascule Dispositif (vide les overrides manuels et ferme l'encart), bascule Attaque (désactivation + reset vers Vue générale)/Défense, vue match et vue saison, repli responsive sous 768px

## Bugs trouvés

Aucun.

## Régressions détectées

Aucune.

## Verdict

**PASSED** — tous les critères d'acceptation de STORY-38 vérifiés, y compris les cas limites explicitement à risque (classement "À 6" avec échantillon Fiable vide).

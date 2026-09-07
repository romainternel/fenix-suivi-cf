# QA-23 — Recentrage collectif du mode Articulation (STORY-37)

**Agent :** QA
**Date :** 2026-09-07

---

## Critères validés

- [x] Les 4 cartes (Référence, "À 6 (ligne complète)", "À 4 (centre)", "À 2 (les deux centraux)") s'affichent immédiatement après le bandeau de contrôles, avant le terrain, précédées du titre "🛡️ Charnières défensives — % de séquences arrêtées" — vérifié visuellement, ordre HTML confirmé
- [x] Chaque carte affiche `_articTauxDefense()` et non l'ancienne efficacité adverse — vérifié par calcul manuel : BLOC34 (0-6) affichait 37% (efficacité adverse) avant cette story, affiche maintenant 63% (= 100-37), confirmé sur capture d'écran
- [x] Couleur des cartes suit `_articDefClass()` — vérifié que 63% (haute réussite défensive) s'affiche en vert, alors que l'ancien système aurait affiché 37% en vert (sens inverse) : la bascule de sens est réelle, pas cosmétique
- [x] Aucun rond-poste n'affiche de liseré de couleur — vérifié par lecture de `className` sur les 6 ronds simultanément : `"artic-poste"` strictement, sans suffixe `fort/moyen/faible/noref`, dans les 3 modes (auto, Suggestion, override manuel)
- [x] Panneau de détail par poste sans % individuel — vérifié sur P3 (7 joueurs listés), chaque ligne ne contient que le nom et "N séq.", aucun pourcentage
- [x] Toggle "AFFICHAGE"→"COMPOSITION" et "🏆 Top Def"→"💡 Suggestion" renommés, comportement interne inchangé (`_setArticViewMode('topdef')` recompose bien le terrain)
- [x] Ligne récapitulative des 6 noms sous le terrain, séparés par "·" — vérifiée avec les 6 joueurs réels, et avec un poste sans donnée (affiche "—" à la bonne position, pas de virgule orpheline ni "undefined")
- [x] Aucune mention résiduelle d'"efficacité adverse"/anciens libellés dans l'UI — recherche exhaustive effectuée par le Code Reviewer, confirmée en re-testant visuellement le bandeau, les cartes, les tooltips et le panneau de détail
- [x] Chiffres de séquences/possessions strictement identiques à avant (43 séq. sur BLOC34/À2, 116 séq. sur la Référence 0-6, 13 séq. sur 1-5) — seule la métrique dérivée change
- [x] Non-régression : bascule dispositif 0-6/1-5, bascule Attaque (désactivation + reset vers `pie`)/Défense, sélection manuelle avec/sans donnée, vue match et vue saison

## Bugs trouvés

Aucun.

## Régressions détectées

Aucune.

## Verdict

**PASSED** — tous les critères d'acceptation de STORY-37 vérifiés, y compris le point le plus sensible (bascule réelle du sens de lecture du %, pas un simple renommage cosmétique).

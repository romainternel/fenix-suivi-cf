# STORY-48 — Mode "Articulation" côté Attaque (page Analyse, onglet Tactique)

**Agent :** Scrum Master
**Date :** 2026-09-15
**Réfs :** `docs/prd.md`, `docs/design/articulation-attaque.md`, `docs/visual/articulation-attaque.md`, `docs/arch/articulation-attaque.md` §3-6, `docs/risks/articulation-attaque.md` R1/R3/R4/R5
**Dépend de :** STORY-47 (import) livrée et vérifiée en conditions réelles avec de vraies données.

---

## Contexte

Le bouton "🎯 Articulation" existe déjà (section Intentions attaque/Défense, onglet Tactique) mais n'est cliquable qu'en mode 🛡 Défense. Cette story l'active aussi en mode ⚡ Attaque, où il affiche un demi-terrain avec les 6 postes offensifs (ALG/ARG/DC/ARD/ALD/PVT), un résumé d'efficacité pour un groupement choisi ("6 complet" ou "Base arrière"), et un classement des compositions observées — miroir du mode Défense existant, avec les adaptations documentées dans le Design (formule d'efficacité directe, pas de "Dispositif", libellé "réussite offensive").

## ⚠️ Vérification obligatoire avant de considérer le calcul correct (Risk R1)

Avant de figer le filtre de comptage, comparer sur un vrai match le nombre de lignes `articulation_att` non vides **avec** et **sans** le filtre `possession` (cf. Architecture §3.2, Risk R1). Si des lignes à issue "2' obt" (ou autre) sont exclues alors qu'elles ne sont doublons d'aucune autre ligne de la même séquence, appliquer le correctif STORY-44 (passe supplémentaire non filtrée pour ce(s) type(s) d'issue). Documenter dans le rapport de Code Review ce qui a été trouvé et fait, comme pour STORY-44.

## Ce qui doit être construit

Suivre `docs/arch/articulation-attaque.md` §3-6 comme spécification d'implémentation directe (constantes, fonctions, points d'intégration précisément identifiés avec numéros de ligne). En résumé :

1. **Constantes** : `ARTIC_ATT_POSTES`, `ARTIC_ATT_9M_ARC`, `ARTIC_ATT_LAYOUT`, `ARTIC_ATT_BLOCKS` (2 groupements : "6 complet", "Base arrière" = ARG-DC-ARD).
2. **Calcul** : `computeArticulationAttStats`, `_articAttPrimaryEntry`, `_articAttEffClass` (seuils 38/55, sens direct — **pas** d'inversion comme la défense), `_articAttBlockEff`, `_articAttBlockDetail`, `computeArticAttCombos`, `_articRankedAttCombos`.
3. **Rendu** : `_drawArticulationAttCourt` — même structure HTML/classes CSS que la défense (`.artic-*`, aucune nouvelle classe), sans le bloc "DISPOSITIF", libellé résumé "**de réussite offensive**".
4. **État** : `window._articAttWidth`/`window._articAttManualPoste`/`window._articAttOpenPoste` — jamais partagés avec l'état défense existant.
5. **Handlers** : `_redrawArticAttCourt`, `_setArticAttWidth`, `_setArticAttManualJoueur`, `_setArticAttManualCombo`, `_toggleArticAttPosteEditor`.
6. **Intégration** (3 modifications ciblées, aucune réécriture) :
   - Bouton "🎯 Articulation" cliquable dans les 2 modes (retirer la condition `!isAdv`).
   - `_setEncTeamMode` : ne plus retomber sur "Vue générale" en basculant vers Attaque.
   - `_setEncGraphMode` : dispatcher vers `_drawArticulationCourt` (défense) ou `_drawArticulationAttCourt` (attaque) selon `window._encTeamMode`.

## Ce qui ne doit PAS changer

- Toute fonction défense existante (`computeArticulationStats`, `_articTauxDefense`, `_articDefClass`, `_articBlockEff`, `_articBlockDetail`, `computeArticCombos`, `_articRankedCombos`, `_drawArticulationCourt`, `ARTIC_LAYOUTS`, `ARTIC_6M_ARC`, `ARTIC_BLOCKS`) — zéro modification, zéro renommage.
- `css/style.css` — aucune nouvelle classe (Visual Crafter §4).
- Le mode Défense doit rester identique au pixel près après cette story (non-régression explicite à vérifier, pas supposer).

## Critères d'acceptation

1. En mode ⚡ Attaque, "🎯 Articulation" n'est plus grisé, cliquable, affiche le demi-terrain avec les 6 postes peuplés depuis de vraies données (STORY-47).
2. Bascule "6 complet" / "Base arrière" → résumé et classement recalculés correctement (vérifier manuellement le calcul sur au moins un cas réel, comme fait pour STORY-42).
3. Clic sur un poste → panneau d'édition (liste des joueurs observés + select "Auto"), changement reflété immédiatement sur le terrain, dans le résumé et dans le classement.
4. Clic sur une ligne du classement → place toute la composition d'un coup.
5. Le résumé affiche "**de réussite offensive**" et un pourcentage égal à buts/(buts+tirs ratés) — vérifié manuellement, formule confirmée différente de la formule inversée de la défense.
6. Cas vides gérés explicitement : aucune donnée sur la période, composition incomplète, composition jamais observée ensemble — jamais un panneau cassé ou silencieusement blanc.
7. Bascule ⚡ Attaque ↔ 🛡 Défense pendant que "🎯 Articulation" est actif : chaque côté garde son panneau et son état (poste ouvert, override manuel, groupement actif) sans réinitialisation ni confusion visuelle (Risk R5 — vérifier explicitement en basculant plusieurs fois de suite).
8. Non-régression totale du mode Défense (tous les critères déjà couverts par la checklist I22, re-testés après cette story).
9. Testé en conditions réelles sur au moins 2 matchs différents (E2E Tester), y compris le cas "peu de données" (Risk R4 — beaucoup de compositions en Échantillon faible).

## Hors périmètre (rappel)

Distinction +/- (supériorité numérique), groupements autres que "6 complet"/"Base arrière", export PDF/PPT.

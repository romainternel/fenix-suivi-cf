# Code Review — STORY-42 : Indicateurs clés (rythme + Supériorités numériques)

**Agent :** Code Reviewer
**Date :** 2026-09-08

---

## Fichiers modifiés

- `js/page-analyse.js` : nouvelle `computeSuperiorites(matchData)` (avant `generateResume3Points`) ; `generateResume3Points()` et `generateIndicateurs()` réécrites pour l'utiliser ; `rythmeCard()` (nouvelle fonction locale à `generateIndicateurs`).
- `css/style.css` : `.tempo-scale`/`.tempo-seg`/`.tempo-marker`/`.tempo-labels`, `.sup-card`/`.sup-score-main`/`.sup-eff-row`, `.info-i` (+ pseudo-éléments hover).
- `FENIX-HANDBALL-CF-SUIVI.html` : bump `?v=269` → `?v=270` sur les 9 balises.
- `CLAUDE.md` : version `v269` → `v270` (§4, §9).

`js/utils.js` **non modifié** — point notable, cf. ci-dessous.

## Conformité Architecture

L'Architecture (`docs/arch/reorganisation-page-analyse.md` §4.2) prescrivait un tri chronologique (`getSortedRows()`, nouvelle fonction dans `js/utils.js`) suivi d'une détection explicite de "blocs" de lignes consécutives en `phase_att` +/-. Le Developer a implémenté une version simplifiée : un simple filtre à plat sur `matchData` (une ligne compte dès que `phase_att` contient `+` ou `-`, attribuée à son club), sans tri ni matérialisation de blocs.

**Vérification faite** : le total agrégé demandé ("le score du match, en supériorité") est la somme de tous les buts/tirs des lignes taguées +/-, quel que soit le bloc auquel elles appartiennent. Puisqu'aucune statistique par-bloc n'est affichée nulle part (seul le total match compte), le résultat du filtre à plat est mathématiquement identique à celui d'un calcul par blocs sommés. **Confirmé correct, pas une approximation.**

Ce choix a aussi un bénéfice de sécurité non anticipé par l'Architecture : implémenter `getSortedRows()` aurait nécessité soit dupliquer la logique de recalage MT2 de `getSortedGoals()` (`js/utils.js:233-244`), soit factoriser `getSortedGoals()` par-dessus — ce qui aurait changé la base de calcul de son offset (actuellement calculé sur les buts seuls, il l'aurait été sur toutes les lignes), un changement de comportement subtil pour une fonction partagée avec `drawTimeline()`, `findMomentsCles()` et `player-mode.js:1507`, hors scope de cette story. Le Developer a eu raison de l'éviter plutôt que de risquer une régression sur la timeline pour un besoin qui n'en avait pas besoin. **Bonne décision, à documenter dans l'Architecture pour que le prochain lecteur ne pense pas que c'est un oubli.**

## Vérifications systématiques

- **Duplication** : les deux sites dupliqués identifiés par l'Architecture (`generateResume3Points` ex-L165-170, `generateIndicateurs` ex-L271-276) sont bien remplacés par un seul appel à `computeSuperiorites()` — critère d'acceptation explicite de la story, respecté.
- **Scope** : aucun fichier touché en dehors de ce qu'annonçait la story. Pas de refactor opportuniste sur `card()`/`stats()` ni sur le reste de `generateIndicateurs`.
- **Conventions** : nommage cohérent avec l'existant (`computeSuperiorites` sans accent, comme `computeEncStats`/`computeArticulationStats`). Lecture de `COLS.phase_att`/`COLS.club`/`COLS.resultat` identique au reste du fichier.
- **Gestion des cas limites** : `phase.includes('+')`/`.includes('-')` préserve la tolérance de l'ancien code (comparaison par sous-chaîne, pas d'égalité stricte) — cohérent avec le principe déjà en place ailleurs dans le projet de ne jamais comparer une donnée Excel par égalité stricte. `hasData` couvre le cas R1 (match sans `phase_att` renseigné) : "Non disponible pour ce match" au lieu d'un "0 — 0" trompeur, conforme au critère d'acceptation.
- **Lisibilité** : le commentaire au-dessus de `computeSuperiorites` explique clairement le bug corrigé et pourquoi le tri n'est pas nécessaire — un futur lecteur n'a pas besoin de relire tout l'historique de session pour comprendre le choix.

## Remarques

**Recommandé** — Les largeurs de segments de la jauge (`21.4%`/`21.4%`/`28.6%`/`28.6%`) sont codées en dur dans `rythmeCard()` et ne sont pas dérivées des seuils `bands`/`domainMin`/`domainMax` définis juste au-dessus dans la même fonction. Si les paliers (50/53/56/60) changent un jour, quelqu'un devra penser à mettre à jour les deux à la fois sans qu'aucun lien dans le code ne l'y aide. Pas bloquant — ces seuils sont un choix produit fixe donné par Romain, peu susceptible de changer souvent — mais une petite fonction de calcul des largeurs à partir de `bands` éviterait la divergence silencieuse si jamais ça arrive.

**Note** — Le §4.2 de `docs/arch/reorganisation-page-analyse.md` décrit encore l'approche par tri/blocs comme le plan retenu. À corriger par l'Archiviste en fin de cycle pour que le document reflète l'implémentation réelle (plus simple, comportement identique) plutôt que de laisser un écart entre archi documentée et code livré.

## Addendum (passe Regression Guardian)

Une **3e occurrence non répertoriée par l'Architecture** du même bug a été trouvée pendant la passe de non-régression : `generateChatResponse()` (`js/page-analyse.js`, réponse "Supériorités numériques" du Chat IA rule-based) calculait son "Bilan" en comparant `fenixSupButs` (buts FENIX pendant la propre supériorité de FENIX) à `advSupButs` (buts adverses pendant la propre supériorité de l'adversaire) — exactement le même défaut que celui corrigé par cette story, laissé de côté car ni l'Architecture ni la story ne mentionnaient ce 3e site. Corrigé par nécessité (sinon le Chat IA aurait affiché un verdict contradictoire avec la carte Indicateurs pour le même match, régression perçue immédiate) : la ligne "Bilan" utilise désormais `computeSuperiorites(matchData)`, les 4 lignes de détail existantes (FENIX/Adversaire en +/-) conservées à l'identique — elles étaient déjà correctes en tant que faits bruts, seul le verdict agrégé était faux. Vérifié en conditions réelles : sur "J01 BILLERE-FENIX", le Chat IA affiche maintenant "✅ FENIX gagne les supériorités" avec un bilan 6-5, cohérent avec la carte Indicateurs clés (`docs/qa/QA-42-indicateurs-rythme-superiorites.md`).

## Verdict

**APPROUVÉ** — aucun point bloquant. Le Recommandé et la Note ci-dessus n'empêchent pas le passage en QA. Fix additionnel du Chat IA inclus, mêmes garanties de non-régression (fonction déjà testée, réutilisée telle quelle).

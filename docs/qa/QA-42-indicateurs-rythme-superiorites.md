# QA-42 — Indicateurs clés : jauge de rythme et recalcul des Supériorités numériques

**Agent :** QA
**Date :** 2026-09-08
**Méthode :** tests réels dans un navigateur (serveur statique local, port 8150), données réelles Supabase (4 matchs), `console.evaluate` pour vérifier les valeurs calculées en plus du rendu visuel.

---

## Critères d'acceptation

- [x] `computeSuperiorites()` appelée aux deux endroits (bloc Essentiel + indicateurs clés) — vérifié par recherche dans le code (aucune occurrence résiduelle de l'ancien `getSup(...)`) et par lecture des deux fonctions.
- [x] Exemple à 4 lignes de la story (2 FENIX `phase_att='+'` dont 1 but, 2 ADV `phase_att='-'` dont 2 buts) : testé littéralement via `computeSuperiorites()` en conditions réelles dans le navigateur → résultat exact `{fenix: {buts:1, tirs:2}, adv: {buts:2, tirs:2}}`, soit "FENIX 1 — 2 Adversaire". Conforme mot pour mot à l'exemple de Romain.
- [x] Affichage combine score exact + efficacité en possessions, sans mi-temps — vérifié visuellement (capture d'écran) sur le match "J01 BILLERE-FENIX" : "FENIX 6 — 5 Adversaire" / "FENIX 6/13 possessions (46%) · Adversaire 5/8 possessions (63%)".
- [x] ⓘ affiche l'explication de la méthode au survol — vérifié par capture d'écran après `hover`, texte lisible, bien positionné, ne déborde pas de la carte.
- [x] Match sans `phase_att` renseigné → "Non disponible pour ce match" plutôt que "0 — 0" — testé avec un jeu de données synthétique (copie d'un vrai match avec `phase_att` vidé), rendu confirmé, aucune classe avantage/désavantage appliquée par erreur.
- [x] Carte "Rythme du match" : une seule valeur (pas de comparaison FENIX/Adversaire), jauge 4 paliers, palier correct mis en évidence — testé sur "J01 BILLERE-FENIX" (56 possessions → marqueur à 42.9% de la jauge, dans le segment "Élevé", libellé "Élevé" affiché en dessous). Calcul du seuil vérifié manuellement (56 tombe bien dans 56-60).
- [x] Non-régression Efficacité/Pertes de balle : cartes identiques à avant (capture d'écran), MT1/MT2 toujours affichés pour ces cartes.
- [x] Comparaison ancien/nouveau calcul produite sur un match réel (cf. §Comparaison ci-dessous).

## Comparaison ancien/nouveau calcul (Risk R3)

Sur le match réel **"J01 BILLERE-FENIX"** (celui qui a le plus de séquences `phase_att` taguées, 37 lignes) :

| | Ancien calcul (bug) | Nouveau calcul (corrigé) |
|---|---|---|
| Affichage | FENIX 6b/10t **vs** ADV 1b/1t | **FENIX 6 — 5 Adversaire** |
| Lecture induite | "On écrase les supériorités, 6 buts contre 1" | "Bilan à peine positif, 6 contre 5" |

L'ancien calcul comparait FENIX à sa propre colonne `phase_att` (6/10 pendant que FENIX est en supériorité) et l'adversaire à SA propre colonne `phase_att` (1/1 pendant que l'ADVERSAIRE est en supériorité, donc pendant que FENIX est en infériorité) — deux séquences de jeu différentes, jamais comparables entre elles. Le nouveau calcul additionne, sur l'ensemble des séquences +/- du match, les buts marqués par chaque camp — bilan réel : 6 contre 5, beaucoup plus serré que ce que l'ancien chiffre laissait croire. **À signaler explicitement à Romain** : ce n'est pas une régression, c'est une correction — l'ancien chiffre était structurellement incapable de capturer un but adverse encaissé pendant une supériorité FENIX.

## Cas limite trouvé (non prévu explicitement par la story, testé quand même)

Sur **"AMICAL FENIX-LIMOGES"**, seules 2 lignes sont taguées `phase_att`, et ni l'une ni l'autre n'est un but ou un tir raté (1 Jet franc, 1 PB). Résultat : `hasData: true` (des séquences existent) mais `tirs: 0` des deux côtés → affichage "FENIX 0 — 0 Adversaire" / "FENIX 0/0 possessions (0%) · Adversaire 0/0 possessions (0%)". Pas de `NaN`, pas de plantage (division par zéro bien gardée), et la distinction avec "Non disponible pour ce match" est correcte (ici il y a bien des données, juste aucun tir dans cette fenêtre) — mais visuellement "0/0 (0%)" peut se lire comme une absence de donnée alors que c'est un vrai résultat. **Mineur, pas bloquant** — à améliorer plus tard si Romain le remarque (ex. remplacer "(0%)" par "—" quand `tirs === 0`).

## Régressions détectées

Aucune. Les cartes Buts/Tirs/Efficacité/Pertes de balle sont pixel-pour-pixel identiques à avant la story (mêmes classes, même sous-ligne MT1/MT2). Le bloc Essentiel (`#ia-analyse`) continue de produire 3 constats cohérents sur un vrai match, sans erreur console.

## Correction additionnelle trouvée et appliquée (3e occurrence du bug)

Le Regression Guardian a trouvé une 3e occurrence du même bug dans `generateChatResponse()` (réponse Chat IA "Supériorités numériques") — le "Bilan" comparait deux colonnes `phase_att` non comparables, comme l'ancien calcul des cartes. Corrigée par réutilisation de `computeSuperiorites()`. Re-testé après coup : sur "J01 BILLERE-FENIX", le Chat IA affiche "✅ FENIX gagne les supériorités" avec un bilan 6-5 — **cohérent avec la carte Indicateurs clés** (avant le fix, la comparaison interne 6 vs 1 aurait été trompeuse même si le sens du verdict était accidentellement correct sur ce match précis). Les 4 lignes de détail (FENIX/Adversaire en +/-) n'ont pas changé, seul le calcul du verdict final.

## Verdict

**PASSED WITH NOTES** — tous les critères d'acceptation sont validés en conditions réelles. Une seule note mineure cosmétique (cas "0/0 possessions") à traiter plus tard si besoin, pas bloquante pour la mise en production.

**Captures** : `docs/regression/screenshots/story42-indicateurs.png`, `docs/regression/screenshots/story42-tooltip.png`.

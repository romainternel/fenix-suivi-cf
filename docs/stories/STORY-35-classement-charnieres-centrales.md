# STORY-35 — Classement des meilleures charnières centrales (P2-P5)

**STATUT : CLÔTURÉE (vérifiée le 2026-09-22)** — jamais implémentée sous ce numéro de story, mais son besoin
est couvert et dépassé par le mode Articulation issu de STORY-37/38 (`_articRankedCombos()`,
`js/page-analyse.js`). STORY-38 l'avait explicitement laissée ouverte ("couvre l'esprit via F2 mais ne la
clôt pas formellement") — clôturée ici après vérification réelle des 6 critères d'acceptation en prod
(Analyse → Tactique → 🛡 Défense → 🎯 Articulation → largeur "À 4 (centre)") :
panneau "CLASSEMENT — À 4 (centre) (P2-P3-P4-P5)", groupé Fiable (≥5 séq.)/Échantillon faible (n<5), trié
par % de réussite défensive, lignes à poste incomplet exclues du calcul de combinaison, recalcul au
changement de filtre match. Périmètre même **plus large** que demandé à l'origine : les largeurs "À 6"
et "À 2" sont aussi disponibles en plus de "À 4 (centre)", via le même panneau (`ARTIC_BLOCKS`).

**En tant que** Romain (staff),
**Je veux** voir automatiquement les combinaisons de joueurs les plus efficaces aux postes 2 à 5,
**Afin de** composer mes lignes défensives centrales sur la base de données réelles plutôt que d'intuition seule.

## Contexte technique

- Zone concernée : `js/page-analyse.js`, nouvelle fonction `_rankCentralHinges(matchData)`, appelée depuis le mode "Articulation" (STORY-34) sous le demi-terrain.
- Clé de combinaison : jointure positionnelle `P2|P3|P4|P5` (pas triée — l'ordre des postes est sémantique, cf. `docs/arch/articulation-defensive.md` §2). Une ligne avec un des 4 postes vide est **exclue** du calcul de combinaison (cf. `docs/risks/articulation-defensive.md` R4) — peut néanmoins compter pour les postes individuels déjà couverts par STORY-34.
- Seuil minimum : **5 séquences (tirs adverses)** pour qu'une combinaison soit éligible au classement — même seuil que celui déjà utilisé pour les badges FORCE/POINT FAIBLE existants (`sd.matchCount >= 3 && s.possessions >= 5`), pas un nouveau nombre inventé.
- Affichage : bloc `.artic-hinge-board` (cf. `docs/visual/articulation-defensive.md` §4) sous le demi-terrain, 2-3 meilleures combinaisons classées par efficacité adverse croissante (plus bas = adversaire moins efficace = meilleure défense).

## Critères d'acceptation

- [x] Les combinaisons de postes P2-P5 sont calculées sur la période affichée (match sélectionné ou saison complète, cohérent avec le filtre déjà actif)
- [x] Seules les combinaisons avec ≥ 5 séquences apparaissent dans le classement **"Fiable"** (une section "Échantillon faible (n<5)" les affiche aussi séparément, en plus — pas dans l'AC d'origine mais cohérent avec la demande, pas une régression)
- [x] Une ligne avec un poste P2, P3, P4 ou P5 vide n'est jamais comptée dans une combinaison (`computeArticCombos`, `joueurs.some(j => !j)` exclu)
- [x] Les meilleures combinaisons sont affichées, triées par % de réussite défensive décroissant (métrique inversée par rapport au libellé d'origine "efficacité adverse croissante" — même tri logique, cf. `docs/arch/articulation-charnieres-collectives.md` §1.1), avec le nombre de séquences associé. Toutes les combinaisons fiables sont listées, pas limitées à 2-3 — plus complet que l'AC d'origine.
- [x] Aucune combinaison éligible sur la période → message clair "Aucune composition fiable observée" (équivalent plus informatif qu'une absence silencieuse)
- [x] Changement de filtre match → le classement se recalcule (comportement standard de toute la page Analyse, `matchData` recalculé en amont)

## Hors scope

- Combinaisons impliquant P1/P6 (uniquement la charnière centrale P2-P5, comme explicitement demandé)
- Interaction cliquable sur une ligne du classement (peut évoluer plus tard si demandé)

## Dépend de

STORY-34

## Taille

M

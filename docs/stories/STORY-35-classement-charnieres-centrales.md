# STORY-35 — Classement des meilleures charnières centrales (P2-P5)

**En tant que** Romain (staff),
**Je veux** voir automatiquement les combinaisons de joueurs les plus efficaces aux postes 2 à 5,
**Afin de** composer mes lignes défensives centrales sur la base de données réelles plutôt que d'intuition seule.

## Contexte technique

- Zone concernée : `js/page-analyse.js`, nouvelle fonction `_rankCentralHinges(matchData)`, appelée depuis le mode "Articulation" (STORY-34) sous le demi-terrain.
- Clé de combinaison : jointure positionnelle `P2|P3|P4|P5` (pas triée — l'ordre des postes est sémantique, cf. `docs/arch/articulation-defensive.md` §2). Une ligne avec un des 4 postes vide est **exclue** du calcul de combinaison (cf. `docs/risks/articulation-defensive.md` R4) — peut néanmoins compter pour les postes individuels déjà couverts par STORY-34.
- Seuil minimum : **5 séquences (tirs adverses)** pour qu'une combinaison soit éligible au classement — même seuil que celui déjà utilisé pour les badges FORCE/POINT FAIBLE existants (`sd.matchCount >= 3 && s.possessions >= 5`), pas un nouveau nombre inventé.
- Affichage : bloc `.artic-hinge-board` (cf. `docs/visual/articulation-defensive.md` §4) sous le demi-terrain, 2-3 meilleures combinaisons classées par efficacité adverse croissante (plus bas = adversaire moins efficace = meilleure défense).

## Critères d'acceptation

- [ ] Les combinaisons de postes P2-P5 sont calculées sur la période affichée (match sélectionné ou saison complète, cohérent avec le filtre déjà actif)
- [ ] Seules les combinaisons avec ≥ 5 séquences apparaissent dans le classement
- [ ] Une ligne avec un poste P2, P3, P4 ou P5 vide n'est jamais comptée dans une combinaison
- [ ] Les 2-3 meilleures combinaisons sont affichées, triées par efficacité adverse croissante, avec le nombre de séquences associé
- [ ] Aucune combinaison éligible sur la période → le bloc ne s'affiche pas (pas de message d'erreur, juste absent — cohérent avec les autres blocs optionnels de la section)
- [ ] Changement de filtre match → le classement se recalcule

## Hors scope

- Combinaisons impliquant P1/P6 (uniquement la charnière centrale P2-P5, comme explicitement demandé)
- Interaction cliquable sur une ligne du classement (peut évoluer plus tard si demandé)

## Dépend de

STORY-34

## Taille

M

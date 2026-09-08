# STORY-42 — Indicateurs clés : jauge de rythme et recalcul des Supériorités numériques

**En tant que** Romain (staff),
**Je veux** voir le rythme du match en un coup d'œil (sans comparer deux équipes qui ont mécaniquement le même nombre de possessions) et un score exact et fiable de ce qui se passe pendant les phases de supériorité/infériorité numérique,
**Afin de** avoir des indicateurs qui répondent vraiment à mes questions plutôt que des chiffres à réinterpréter.

## Contexte technique

C'est la story la plus lourde du cycle — elle corrige un bug fonctionnel existant, pas seulement une présentation.

### Bug identifié (calcul actuel des Supériorités)

`js/page-analyse.js:165-170` (`generateResume3Points`) et `js/page-analyse.js:271-276` (`generateIndicateurs`), dupliqués :
```js
const getSup = (data, sign) => data.filter(r => (r[COLS.phase_att] || '').toString().includes(sign));
const fSup = getSup(fenixData, '+'), aSup = getSup(advData, '+');
```
Filtre chaque équipe sur **son propre** `phase_att = '+'`, indépendamment — ne mesure jamais un but adverse marqué avec `phase_att = '-'` pendant une supériorité FENIX (le cas central décrit par Romain : "on marque une fois et eux deux fois" sur le même bloc). Cf. `docs/arch/reorganisation-page-analyse.md` §4 pour l'analyse complète.

### Algorithme de remplacement

1. Nouvelle fonction `getSortedRows(matchData)` (`js/utils.js`, à côté de `getSortedGoals()`) : même logique de tri chronologique (`parseTimecode(r[COLS.position])` + offset MT2 si nécessaire, cf. `js/utils.js:233-244`) mais sur **toutes** les lignes du match, pas seulement les buts. Réécrire `getSortedGoals()` par-dessus (`getSortedRows(matchData).filter(r => r.row[COLS.resultat] === 'But')`) pour ne pas dupliquer le tri.
2. Nouvelle fonction `computeSuperiorites(matchData)` (`js/page-analyse.js`) : parcourt `getSortedRows()` dans l'ordre, détecte les **blocs** de lignes consécutives où `phase_att` est non vide ('+' ou '-', peu importe le club — un bloc mélange les deux camps) ; un bloc se termine dès qu'une ligne a `phase_att` vide/neutre. Sur chaque bloc, compte les buts et tirs (buts + `Tir raté`) de FENIX et de l'adversaire séparément, puis somme ces compteurs sur tous les blocs du match. Retourne `{fenix: {buts, tirs}, adv: {buts, tirs}}`.
3. Remplacer les deux calculs dupliqués (`generateResume3Points` L165-170/L204-212, `generateIndicateurs` L271-276/L305-312) par un appel à `computeSuperiorites()`.
4. **Cas `phase_att` non renseigné (Risk R1)** : si aucune ligne du match n'a de `phase_att` non-vide, afficher "Non disponible pour ce match" plutôt que "0 — 0" silencieux (même logique que les autres colonnes introduites saison par saison, cf. CLAUDE.md §5).

### Jauge "Rythme du match" (remplace la carte "Possessions" comparée)

- Un seul nombre (possessions FENIX, représentatif — les deux équipes ont mécaniquement un nombre proche), classé sur 4 paliers fixes : 50-53 Faible / 53-56 Normal / 56-60 Élevé / 60+ Très élevé.
- Jauge visuelle à 4 segments colorés + repère sur la valeur réelle (cf. mockup validé et `docs/visual/reorganisation-page-analyse.md`).
- Remplace la carte `card('Possessions', tot.f.poss, tot.a.poss, ...)` (`js/page-analyse.js:304`) — ne compare plus FENIX à l'adversaire.

## Critères d'acceptation

- [ ] `computeSuperiorites()` est appelée aux deux endroits (bloc Essentiel via `generateResume3Points`, indicateurs clés via `generateIndicateurs`) — un seul point de calcul, plus aucune occurrence de l'ancien `getSup(...)` dupliqué dans le code (vérifié par recherche).
- [ ] Sur un match construit en test avec un bloc de supériorité connu (ex. 2 lignes FENIX `phase_att='+'` incluant 1 but, 2 lignes adverses `phase_att='-'` incluant 2 buts), le résultat affiché est bien "FENIX 1 — 2 Adversaire" pour ce bloc.
- [ ] L'affichage combine le score exact ("FENIX X — Y Adversaire") et l'efficacité en possessions de chaque équipe ("FENIX x/y (z%)"), sans découpage mi-temps.
- [ ] Un ⓘ à côté du titre explique la méthode de calcul par blocs (texte cohérent avec celui validé dans le mockup).
- [ ] Sur un match dont `phase_att` est entièrement vide, l'indicateur affiche "Non disponible pour ce match" et non "0 — 0".
- [ ] La carte "Rythme du match" affiche un seul nombre (pas de comparaison FENIX/Adversaire), avec la jauge à 4 paliers et le bon palier mis en évidence selon la valeur réelle du match.
- [ ] Non-régression : les autres cartes indicateurs (Efficacité, Pertes de balle) restent inchangées.
- [ ] Comparaison explicite ancien/nouveau calcul de Supériorités produite dans le rapport de développement sur au moins 1 match réel déjà vu par Romain (Risk R3 — communication du changement, pas une régression silencieuse).

## Hors scope

- Le calcul Efficacité/Pertes de balle/Gardien (inchangés).
- L'emplacement de ces cartes dans la nouvelle structure d'onglets (propriété de STORY-40) — cette story modifie le contenu des cartes, pas leur conteneur.

## Dépend de

- Aucune technique. **STORY-39 dépend de celle-ci** (le bloc Essentiel affiche le résultat de `computeSuperiorites()`).

## Taille

L

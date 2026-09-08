# STORY-44 — Détail par intention enrichi (but/tir, PB, jet franc)

**En tant que** Romain (staff),
**Je veux** voir, pour chaque intention à l'intérieur d'une famille, le nombre de buts/tirs, de pertes de balle et de jets francs subis sur une seule ligne,
**Afin de** juger la qualité réelle d'une intention sans avoir à recompter moi-même à partir du pourcentage seul.

## Contexte technique

- Zone concernée : le tableau de détail niveau 1 (liste des intentions dans une famille sélectionnée) dans `js/page-analyse.js` — le niveau 2 (`_buildEncIntentionDetailTable`, détail par enclenchement brut à l'intérieur d'une intention, cf. CLAUDE.md §5) reste **inchangé**, cette story n'enrichit que le niveau intermédiaire.
- Nouvelles colonnes calculées par intention : but/tir (`COLS.resultat === 'But'` / `'But' + 'Tir raté'`), PB (`COLS.resultat === 'PB'`), jet franc subi (`COLS.resultat === 'Jet franc'`) — mêmes filtres déjà utilisés ailleurs dans le module, agrégés par `intention_attaque` au lieu de par famille. Aucune nouvelle colonne DATA nécessaire.
- Format d'affichage (validé dans le mockup) : `{poss} poss. · {buts}/{tirs} tirs ({%}) · {pb} PB · {jf} JF subi` sur une seule ligne par intention.

## Critères d'acceptation

- [ ] Cliquer une famille (ex. "Isoler") affiche la liste de ses intentions (ISO 2/ISO 3/ISO 4...), chacune avec sa ligne de stats complète (poss., but/tir + %, PB, jet franc subi) tenant sur une seule ligne.
- [ ] Les chiffres affichés correspondent exactement à un comptage manuel sur les données du match testé (vérifié sur au moins une intention).
- [ ] Cliquer une intention (ex. "ISO 2") ouvre le détail par enclenchement existant en dessous, sans aucun changement de comportement par rapport à aujourd'hui.
- [ ] Non-régression sur le comportement déjà existant : sélection d'une famille différente ferme/reset le détail précédent, comme aujourd'hui.

## Hors scope

- Le niveau 2 (détail par enclenchement, `_buildEncIntentionDetailTable`) — inchangé.
- Toute modification de `getEncFamille()`/`famille_mapping`/l'éditeur de familles.

## Dépend de

- Aucune.

## Taille

S

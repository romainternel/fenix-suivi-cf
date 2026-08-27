# STORY-B00 — Lecture du catalogue Intention → Famille à l'import

**En tant que** développeur (au service du coach FENIX),
**Je veux** que l'import Excel lise la feuille `Enclenchements`/`Intention attaque` (colonnes Intention/Famille) et construise une table de correspondance normalisée,
**Afin de** disposer d'une source de vérité dynamique pour la classification, sans dépendre d'un code figé.

## Contexte technique
- Zone concernée : `processFile()` dans `FENIX-HANDBALL-CF-SUIVI.html` (~ligne 1468, juste après le bloc de lecture de la feuille `Bilan`).
- Nouvelle variable globale : `let INTENTION_FAMILLE_MAP = {};`
- Nouvelles fonctions utilitaires (à placer dans `js/page-analyse.js` ou dans le HTML à côté de `processFile`, à la discrétion du Developer selon la convention déjà en place pour les autres helpers d'import) : `normalizeIntention(str)`, `titleCaseFamille(str)`.
- Recherche de feuille tolérante : `workbook.SheetNames.find(n => /enclenchement|intention.?attaque/i.test(n))` (couvre le renommage annoncé mais non fait par l'utilisateur).
- Colonnes trouvées par en-tête (`intention`, `famille`), pas par position fixe — cf. `docs/analyse/ARCH-intention-attaque.md` §1.1.
- Fichier de test réel disponible : `ESSAI IA STAT.xlsm`, feuille `Enclenchements`, 16 lignes (`ISO 2..5`, `7vs6`, `1&2..5&6`, `GLISSE`, `FAIRE COURIR`, `RENTREE`, `SPECIAUX`, `6vs5`, `JEU RAPIDE`).

## Critères d'acceptation
- [ ] `INTENTION_FAMILLE_MAP` est reconstruite à chaque import (pas cumulée entre deux imports successifs).
- [ ] Réimporter `ESSAI IA STAT.xlsm` produit `INTENTION_FAMILLE_MAP['ISO 3'] === 'Isoler'`, `INTENTION_FAMILLE_MAP['7VS6'] === '7vs6'`, `INTENTION_FAMILLE_MAP['GLISSE'] === 'Jeu Pivot'`, `INTENTION_FAMILLE_MAP['JEU RAPIDE'] === 'Jeu Rapide'` (casse d'affichage normalisée, pas tout-majuscule brut).
- [ ] `normalizeIntention('Rentrée')`, `normalizeIntention('RENTREE')` et `normalizeIntention('Rentree')` retournent la **même** valeur (accents et casse neutralisés — cf. risque R3).
- [ ] Import d'un classeur **sans** feuille `Enclenchements`/`Intention attaque` → `INTENTION_FAMILLE_MAP` reste `{}`, aucune exception levée, le reste de l'import se déroule normalement.
- [ ] Import d'une feuille présente mais dont les en-têtes ne contiennent ni "intention" ni "famille" (classeur malformé) → `INTENTION_FAMILLE_MAP` reste `{}`, pas de crash.
- [ ] Le `?v=` est bumped sur les scripts concernés.

## Hors scope
- Utilisation de `INTENTION_FAMILLE_MAP` dans la classification réelle des lignes DATA (c'est STORY-B01).
- Toute modification de rendu HTML/CSS.

## Dépend de
Aucune.

## Taille
S

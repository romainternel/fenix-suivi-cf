# PRD — Intention attaque (classification dynamique des enclenchements)

**Agent :** Product Manager
**Date :** 2026-08-26
**Input :** `docs/analyse/ANALYST-intention-attaque.md`
**App actuelle :** v221

---

## 1. Objectif

Faire en sorte que la classification des enclenchements en familles tactiques soit pilotée par le catalogue Excel (`Enclenchements` / futur `Intention attaque`) que Romain maintient déjà, et non plus par une table codée en dur dans le JS. Aucune régression sur les saisons qui n'ont pas encore ce nouveau format.

---

## 2. Features

### F1 — Lecture du catalogue Intention → Famille à l'import *(Must Have)*
À l'import du classeur Excel, en plus des feuilles déjà lues (`Joueurs`, `Temps de Jeu`, `Bilan`), chercher une feuille correspondant à `Enclenchements` ou `Intention attaque` (recherche insensible à la casse/accents, comme déjà fait pour `Bilan`). Si trouvée, construire une table `{ intentionNormalisée: famille }` à partir de ses deux colonnes. Si absente (classeur ancien format), l'app fonctionne exactement comme avant (F2 bascule intégralement sur le texte libre).

### F2 — Classification hybride ligne par ligne *(Must Have)*
Pour chaque ligne DATA :
1. Si `Intention attaque` (nouvelle colonne) est renseignée → chercher dans la table F1. Trouvé → famille retournée. Absent du catalogue → "Non classifié" (voir F4), jamais une famille devinée.
2. Sinon → comportement actuel inchangé : parsing du texte libre `Enclenchement` via `ENC_FAMILLE_MAP` existant.
3. Aucune ligne ne doit planter si les deux champs sont vides — retour "Autre"/"Non classifié" comme aujourd'hui.

Le fait que la même ligne puisse avoir les deux colonnes renseignées (constaté dans les données réelles : 9 lignes sur le match test) ne doit pas provoquer de double-comptage — `Intention attaque` est toujours prioritaire quand présente.

### F3 — Liste des familles dérivée dynamiquement *(Must Have)*
`ENC_FAMILLES_ORDRE`, les couleurs et les identifiants DOM ne sont plus une liste figée de 9 noms. Ils sont calculés à partir de l'union des familles réellement rencontrées dans les données chargées (celles du catalogue F1 + celles encore utilisées par le parseur legacy, ex. si une vieille saison utilise encore "Rebond"). Une nouvelle famille ajoutée un jour dans le catalogue Excel doit apparaître automatiquement dans le camembert/matrice/cards à la prochaine réimportation, sans modification de code.

### F4 — Traitement des intentions orphelines *(Must Have)*
Une valeur `Intention attaque` absente du catalogue (cas réel constaté : `BLOC`, 4 occurrences dans le match test) ne doit jamais disparaître silencieusement dans "Autre" sans trace. Elle doit :
- être comptée séparément et visible dans le panneau "non classifiés" déjà existant (celui qui gère aujourd'hui les enclenchements texte-libre non mappés, v169/v170),
- rester réassignable manuellement à une famille via le mécanisme `enc_famille_custom` déjà en place (aucune nouvelle UI de réassignation à inventer, réutilisation stricte de l'existant).

### F5 — Indicateur de couverture de classification *(Should Have)*
Un indicateur simple (déjà dans l'esprit de `computeEncCoverage` envisagé lors du premier cycle Analyse) montrant le % de tirs classifiés vs "Non classifié"/orphelins sur le match ou la période affichée. Permet à Romain de repérer en un coup d'œil un souci de catalogue sans devoir ouvrir la console.

### F6 — Tolérance au renommage futur de la feuille *(Nice to Have — déjà couvert par F1)*
Romain a annoncé vouloir renommer la feuille `Enclenchements` → `Intention attaque` plus tard. F1 couvre déjà ce cas par la recherche de nom tolérante — aucun développement dédié supplémentaire, juste à documenter comme "déjà géré" pour ne pas générer une inquiétude inutile côté utilisateur.

---

## 3. Priorités

| # | Feature | Priorité |
|---|---------|----------|
| F1 | Lecture catalogue Intention→Famille | Must Have |
| F2 | Classification hybride par ligne | Must Have |
| F3 | Familles dérivées dynamiquement | Must Have |
| F4 | Intentions orphelines signalées + réassignables | Must Have |
| F5 | Indicateur de couverture | Should Have |
| F6 | Tolérance renommage feuille | Nice to Have (déjà inclus dans F1) |

Cette version ne livre rien si F1–F4 ne sont pas tous les quatre faits : ils forment un seul mécanisme cohérent, pas des incréments indépendants.

---

## 4. Critères d'acceptation

- [ ] Réimporter `ESSAI IA STAT.xlsm` (match `AMICAL FENIX-L'UNION`) classe correctement les intentions du catalogue (ISO 2-5, 7vs6, 1&2…5&6, GLISSE, FAIRE COURIR, RENTREE, SPECIAUX, 6vs5, JEU RAPIDE) dans les 8 familles attendues.
- [ ] Les 4 occurrences de `BLOC` apparaissent en "Non classifié" avec possibilité de les réassigner depuis l'UI existante — pas en `Autre` silencieux, pas de crash.
- [ ] Réimporter une saison historique (ancien format, ex. saison 2025-2026 testée lors de l'audit du 2026-08-26) produit des chiffres strictement identiques à avant ce chantier (mêmes % par famille, même camembert).
- [ ] "Jeu rapide" apparaît comme famille à part entière (camembert, matrice, cards, tableau V/D) dès qu'un match l'utilise ; "Bloc PVT" et "Rebond" n'apparaissent plus pour les matchs 100% nouveau format, mais restent affichables si une vieille saison legacy les utilise encore.
- [ ] Ajouter une 17ᵉ ligne dans la feuille Excel `Enclenchements` (nouvelle intention → famille existante ou nouvelle famille) et réimporter suffit à la voir apparaître, sans modification du code JS.
- [ ] Aucune régression sur `generateResume3Points`, `findMomentsCles`, le chat IA, ni sur les autres pages (Dashboard, Joueurs, Notes, Impact) — vérifié par Regression Guardian avant mise en production.

---

## 5. Hors scope

- Refonte visuelle/UX globale de la page Analyse ou de l'appli (chantier séparé).
- Migration Supabase (chantier séparé, déjà specé ailleurs).
- Réannotation rétroactive des saisons passées pour leur ajouter une `Intention attaque`.
- Renommage effectif de la feuille Excel (reporté par l'utilisateur ; F1 le rend non-urgent techniquement).
- Nouvelle UI de réassignation manuelle (F4 réutilise l'existant tel quel).

---

## 6. Dépendances

- Fichier Excel de test disponible et déjà inspecté (`ESSAI IA STAT.xlsm`, feuille `Enclenchements` 16 lignes, colonne `Intention attaque` en position 22).
- Aucune nouvelle librairie : `xlsx.js` (déjà utilisé) suffit à lire la feuille supplémentaire.
- Aucune dépendance sur le chantier Supabase — le fonctionnement reste 100% local (import Excel → localStorage), comme aujourd'hui.

---

## 7. Risques (haut niveau — détail dans `docs/analyse/RISKS-intention-attaque.md`)

- Le cas `BLOC` n'est qu'un exemple connu ; d'autres intentions orphelines apparaîtront probablement avec l'usage réel — F4 doit être un mécanisme générique, pas un correctif ponctuel.
- Risque de double-classification si une ligne a les deux colonnes renseignées avec des familles différentes selon la méthode — F2 tranche explicitement en faveur d'`Intention attaque`, à ne pas remettre en cause en cours de dev sans revalider avec Romain.
- Risque de casser les 15+ endroits du code qui itèrent aujourd'hui sur `ENC_FAMILLES_ORDRE` en dur si la dérivation dynamique (F3) n'est pas appliquée uniformément partout.

---

*PRD — pipeline BMAD FENIX — Product Manager 2026-08-26*

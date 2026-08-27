# Risques — Intention attaque (classification dynamique des enclenchements)

**Agent :** Risk Analyst
**Date :** 2026-08-26
**Input :** `docs/analyse/ARCH-intention-attaque.md`

---

## Tableau des risques

| # | Risque | Probabilité | Impact | Priorité | Recommandation |
|---|--------|-------------|--------|----------|-----------------|
| R1 | Un orphelin (`Intention attaque` absente du catalogue, ex. `BLOC`) est absorbé silencieusement dans "Autre" au lieu d'être signalé — le mécanisme même que cette feature doit garantir échoue. | Moyenne | Critique | **P0** | Critère d'acceptation explicite testé avec le cas réel `BLOC` (4 occurrences, match `AMICAL FENIX-L'UNION`) avant toute mise en production. Story dédiée de vérification bout-en-bout, pas seulement une revue de code. |
| R2 | Sur les ~15 sites remplaçant `ENC_FAMILLES_ORDRE`/`ENC_FAMILLE_COLORS`/`ENC_FAMILLE_IDS`, un site est oublié ou mal migré → le camembert, la matrice et le tableau V/D affichent des familles ou des couleurs différentes pour la même donnée. | Élevée | Élevé | **P0** | QA doit comparer explicitement camembert / matrice / cards / tableau V/D sur le même match après implémentation — pas une vérification page par page isolée. Prévoir une story de vérification transversale distincte des stories d'implémentation. |
| R3 | Normalisation insuffisante (accents, casse, espaces) entre la colonne `Intention attaque` de DATA et celle du catalogue Excel (`Rentrée` vs `RENTREE` vs `Rentree`) → correspondances légitimes basculent en "Non classifié" à tort. | Moyenne | Modéré | **P1** | `normalizeIntention()` doit strip les accents (`normalize('NFD')` + suppression diacritiques) en plus de la casse/espaces — critère d'acceptation à ajouter explicitement à la story F1/F2. |
| R4 | L'indicateur de couverture (F5) mélange les lignes "Autre" légitimes (aucune intention attendue, ex. actions défensives) avec les vraies "Non classifié" (intention donnée mais non reconnue) → un % anxiogène et non-actionnable, ignoré par Romain à l'usage. | Moyenne | Modéré | **P1** | Le dénominateur de couverture ne compte que les lignes où `Intention attaque` OU `Enclenchement` est renseigné ; le numérateur, celles correctement résolues en famille. Exclure explicitement les lignes sans aucune donnée d'enclenchement. |
| R5 | Une même ligne renseignée à la fois en `Enclenchement` (legacy) et en `Intention attaque` (nouveau) donne une famille différente selon la méthode utilisée → l'utilisateur constate un changement de chiffres sans en comprendre la cause. | Faible | Modéré | **P2** | Comportement techniquement correct (priorité à `Intention attaque`, décidé en PRD F2) — risque de communication, pas de code. Mentionner explicitement à Romain lors de la livraison que quelques tirs du match test peuvent légèrement changer de famille par rapport à une lecture 100% legacy. |
| R6 | La détection "tactique payante" (pattern Type 5, `page-analyse.js:~461`) compare une famille sur les dernières possessions à ses possessions antérieures — si un même match mélange ancien et nouveau format en cours de saison, la comparaison peut mélanger des définitions de famille légèrement différentes (ex. "Jeu PVT" legacy vs "Jeu Pivot" nouveau catalogue, si mal unifiées). | Faible | Modéré | **P2** | Vérifier que la normalisation de casse (`titleCaseFamille`) unifie bien les deux graphies avant comparaison. Pas de story dédiée — critère d'acceptation ajouté à la story de dérivation dynamique (F3). |
| R7 | Coût de recalcul de `getActiveFamilles()` si appelé à chaque render plutôt qu'à l'import (dataset actuel ~200 à quelques milliers de lignes — pas un problème aujourd'hui, mais une regression de discipline à éviter). | Faible | Faible | **P3** | Mise en cache explicite (`_familles_actives`), recalcul uniquement à l'import et à la réassignation manuelle — déjà spécifié en architecture, à vérifier en code review. |

---

## Risques P0/P1 → stories de mitigation

- **R1** → critère d'acceptation ajouté à la story de classification hybride (F2/F4) : test explicite avec `BLOC`.
- **R2** → story de vérification transversale dédiée, après l'implémentation de tous les sites de remplacement (pas fusionnée avec une story d'implémentation, pour qu'elle ne soit pas oubliée en cours de route).
- **R3** → critère d'acceptation ajouté à la story de lecture du catalogue (F1) : cas de test avec accent (`Rentrée`/`RENTREE`).
- **R4** → critère d'acceptation ajouté à la story de l'indicateur de couverture (F5).

---

## Ce qui n'est PAS un risque de cette feature (rappel de périmètre)

- La qualité du catalogue Excel lui-même (Romain le maintient, ce n'est pas à l'app de le valider sémantiquement).
- La ré-annotation des saisons passées (hors scope PRD, pas un risque à mitiger ici).
- Le multi-utilisateur / la synchronisation (concerne le chantier Supabase séparé, pas celui-ci — l'app reste mono-utilisateur local pour cette version).

---

*Risques — pipeline BMAD FENIX — Risk Analyst 2026-08-26*

# QA-47 — Import "Articulation offensive"

**Agent :** QA
**Date :** 2026-09-16
**Méthode :** vérifications en conditions réelles sur le projet Supabase de production (`oamldfduxwsghrxdsaxy`), via requêtes REST directes en lecture seule et un script Node reproduisant exactement `rowToPositionalArray`/`MATCH_DATA_COLUMN_ORDER` tels qu'utilisés par l'app.

---

## Critères d'acceptation (`docs/stories/STORY-47-import-articulation-attaque.md`)

- [x] **1. Migration SQL exécutée avant tout test réel** — confirmée par Romain, vérifiée indirectement (les colonnes existent : une requête sur `articulation_att` ne renvoie plus l'erreur `column does not exist` observée avant la migration).
- [x] **2. Réimport → 7 colonnes peuplées dans `match_data`** — vérifié par requête REST directe : **120 lignes** portent `articulation_att` non nul (exactement le nombre trouvé par lecture directe du fichier Excel avant ce cycle). Valeurs comparées ligne à ligne à l'Excel source : identiques (ex. `att_alg="Julien.L"`, `att_arg="Marius.C"`, `att_dc="Issa.S"`, `att_ard="Louis.M"`, `att_ald="Roman.L"`, `att_pvt="Idris.F"` sur la première ligne "But" de J01 BILLERE-FENIX — correspond exactement à la donnée Excel vérifiée lors du cadrage).
- [x] **3. Résilience fichier ancien sans ces colonnes** — non re-testée par un nouvel import (éviter une action destructive supplémentaire sur la prod sans nécessité) ; vérifiée par lecture de code (Code Review STORY-47) : le mapping est générique par nom d'en-tête (`idxToColumn`), un en-tête absent produit simplement `col = null` et la colonne correspondante n'est jamais peuplée — aucun branchement conditionnel spécifique à ajouter ni à casser. Comportement identique et déjà éprouvé pour `articulation_def`/`p1`-`p6` (STORY-33).
- [x] **4. `DATA` reconstruit depuis Supabase contient les 7 valeurs aux indices 29-35** — vérifié par un script Node appliquant EXACTEMENT `MATCH_DATA_COLUMN_ORDER`/`rowToPositionalArray` (copiés du code réel) sur 3 lignes réelles fraîchement récupérées de Supabase : `DATA[COLS.articulation_att]`, `DATA[COLS.att_alg]`, `DATA[COLS.att_arg]`, `DATA[COLS.att_dc]`, `DATA[COLS.att_ard]`, `DATA[COLS.att_ald]`, `DATA[COLS.att_pvt]` correspondent exactement aux valeurs nommées retournées par Supabase, sur les 3 lignes testées, sans aucune divergence.
- [x] **5. Non-régression du reste de l'import** — le nombre total de lignes (`350`) et de matchs (`J01 BILLERE-FENIX`, `J02 FENIX-LA CRAU`) est resté cohérent après le réimport ; aucune anomalie observée sur le Dashboard/page Analyse pendant les échanges avec Romain (capture d'écran fournie : cartes familles, camembert, "n=115 poss." — cohérent avec les données déjà connues).

## Incident rencontré pendant la vérification (transparence)

Le premier réimport tenté par Romain n'a pas peuplé les nouvelles colonnes (0 ligne avec `articulation_att` non nul, alors que la migration SQL était déjà faite). Root-cause probable : un onglet navigateur resté ouvert avant le déploiement du correctif (v282) exécutait encore l'ancien JS, sans le mapping des nouvelles colonnes — l'import s'est déroulé normalement mais sans elles. Résolu en demandant un rechargement forcé (Ctrl+F5) avant un second import, qui a fonctionné. Pas un défaut du code, mais un point à garder en tête pour tout futur changement de schéma d'import : **toujours vérifier après coup en conditions réelles plutôt que de supposer qu'un rechargement de page a eu lieu**.

## Verdict

**PASSED** — tous les critères vérifiables sans action destructive supplémentaire sont validés en conditions réelles sur la production. Import opérationnel, prêt pour STORY-48.

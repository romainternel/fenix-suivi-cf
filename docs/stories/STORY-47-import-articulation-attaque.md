# STORY-47 — Import "Articulation offensive" (colonnes ARTICULATION ATT/ALG/ARG/DC/ARD/ALD/PVT)

**Agent :** Scrum Master
**Date :** 2026-09-15
**Réfs :** `docs/brief.md`, `docs/prd.md`, `docs/arch/articulation-attaque.md` §0-2, `docs/risks/articulation-attaque.md` R2/R7

---

## Contexte

Le fichier Excel source (`IA STAT SAISON 26-27.xlsm`, onglet DATA, colonnes AD-AJ) contient déjà, depuis la saison 2026-2027, la composition offensive de FENIX ligne par ligne (`ARTICULATION ATT`/`ALG`/`ARG`/`DC`/`ARD`/`ALD`/`PVT`), jamais importée jusqu'ici. Cette story ne fait QUE le brancher jusqu'à `match_data` (Supabase) et `COLS` — aucun affichage. STORY-48 construit le visuel par-dessus.

## ⚠️ Prérequis bloquant, à exécuter avant tout réimport (P0, cf. Risk R2)

**Avant que cette story ne soit considérée testable en conditions réelles**, la migration SQL suivante doit être exécutée dans le SQL Editor du projet Supabase `oamldfduxwsghrxdsaxy` — **par Romain ou avec sa confirmation explicite**, jamais automatiquement par le Developer :

```sql
alter table match_data add column att_alg          text;
alter table match_data add column att_arg          text;
alter table match_data add column att_dc           text;
alter table match_data add column att_ard          text;
alter table match_data add column att_ald          text;
alter table match_data add column att_pvt          text;
alter table match_data add column articulation_att text;
```

Le Developer doit dire explicitement, dans son rapport, si cette migration a été faite (et par qui/comment) avant de déclarer la story testée en conditions réelles avec Supabase.

## Ce qui doit changer

1. **`supabase/schema.sql`** — documenter les 7 nouvelles colonnes de `match_data` (cf. Architecture §2.1), pour que le schéma versionné dans le repo reflète l'état réel de la base après la migration ci-dessus.
2. **`js/supabase-client.js`** :
   - `DATA_HEADER_TO_COLUMN` : ajouter `articulationatt: 'articulation_att'`, `alg: 'att_alg'`, `arg: 'att_arg'`, `dc: 'att_dc'`, `ard: 'att_ard'`, `ald: 'att_ald'`, `pvt: 'att_pvt'`.
   - `MATCH_DATA_COLUMN_ORDER` : ajouter à la fin `'articulation_att', 'att_alg', 'att_arg', 'att_dc', 'att_ard', 'att_ald', 'att_pvt'` — **dans cet ordre exact**, il doit correspondre à l'ordre des nouvelles clés `COLS` (point 3).
3. **`FENIX-HANDBALL-CF-SUIVI.html`** — `COLS` : ajouter `articulation_att: 29, att_alg: 30, att_arg: 31, att_dc: 32, att_ard: 33, att_ald: 34, att_pvt: 35` à la suite de `p6: 28`.
4. **Cache-busting** : bump `?v=N` sur les 9 balises (convention CLAUDE.md §4).

## Ce qui ne doit PAS changer

- Aucune modification de `processFile()` ni `buildMatchDataRows()` — le pipeline est déjà générique par nom de colonne (vérifié par l'Architecte), ces fonctions n'ont pas besoin d'être touchées.
- Aucune modification de `COLS.p1`-`p6`/`articulation_def` (défense) — colonnes strictement additives, à la suite des existantes.
- Aucun affichage, aucun nouveau bouton — cette story est invisible pour Romain une fois livrée (vérifiable uniquement en lisant `match_data` directement, ex. requête REST Supabase).

## Critères d'acceptation

1. Migration SQL exécutée (confirmée dans le rapport du Developer) avant tout test avec de vraies données Supabase.
2. Réimport de `IA STAT SAISON 26-27.xlsm` → les 7 nouvelles colonnes sont peuplées dans `match_data`, vérifié par une requête REST Supabase directe sur quelques lignes connues (comparer avec les valeurs lues directement dans le fichier Excel, cf. exemples réels donnés dans le Brief : ligne "ARTICULATION ATT" avec ALG=Julien.L/ARG=Marius.C/DC=Issa.S/ARD=Louis.M/ALD=Roman.L/PVT=Idris.F).
3. Réimport d'un fichier Excel antérieur à la saison 2026-2027 (`ESSAI IA STAT.xlsm`, colonnes présentes mais vides) → import complet sans erreur, colonnes simplement non peuplées (`null`), aucune régression sur les 29 colonnes existantes.
4. `window.DATA` (reconstruit depuis Supabase au boot via `rowToPositionalArray`) contient bien ces 7 valeurs aux indices 29-35 pour les lignes concernées — vérifiable via `browser_evaluate` sur `DATA[i]` après un rechargement de page (pas seulement dans `match_data` côté serveur).
5. Aucune régression sur le reste de l'import : dashboard, page Analyse, page Joueurs continuent de fonctionner à l'identique après ce réimport (checklist de régression Critique).

## Hors périmètre (rappel)

Aucun visuel, aucun calcul d'efficacité — c'est STORY-48.

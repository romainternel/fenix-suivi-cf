# Code Review — STORY-47 : Import "Articulation offensive"

**Agent :** Code Reviewer
**Date :** 2026-09-15

---

## Fichiers modifiés

- `supabase/schema.sql` : +7 colonnes `text` sur `match_data` (`articulation_att`, `att_alg`, `att_arg`, `att_dc`, `att_ard`, `att_ald`, `att_pvt`), commentaire renvoyant vers l'ordre attendu ailleurs.
- `js/supabase-client.js` : +7 entrées `DATA_HEADER_TO_COLUMN`, +7 entrées `MATCH_DATA_COLUMN_ORDER` (à la suite de `p6`).
- `FENIX-HANDBALL-CF-SUIVI.html` : +7 entrées `COLS` (indices 29-35, à la suite de `p6: 28`), bump `?v=281` → `?v=282` sur les 9 balises.
- `CLAUDE.md` : version bump, ligne `match_data` du tableau §5 mise à jour (29→36 colonnes, mention des deux jeux de colonnes d'articulation).

## Conformité Architecture (`docs/arch/articulation-attaque.md` §1-2)

Suivi à la lettre : nommage préfixé `att_*` (évite toute collision avec `ALG`/`ALD` déjà utilisés ailleurs pour un concept différent, Risk R7 — vérifié qu'aucune des 7 nouvelles clés `COLS` ni des 7 nouvelles colonnes Supabase n'entre en conflit avec une clé/colonne existante), ordre identique dans les 3 points de correspondance (`COLS`, `DATA_HEADER_TO_COLUMN` via ses valeurs, `MATCH_DATA_COLUMN_ORDER`) — vérifié programmatiquement (`grep` croisé des 3 fichiers, séquence `articulation_att, att_alg, att_arg, att_dc, att_ard, att_ald, att_pvt` identique partout).

Confirmation de la lecture Architecture §0 : `processFile()`/`buildMatchDataRows()` n'ont **pas** été touchées — correct, ces fonctions sont déjà génériques par nom de colonne, aucune modification nécessaire, et aucune n'a été faite (scope respecté au sens strict).

## Scope

Diff strictement limité aux 4 fichiers attendus. Aucune fonction de calcul (`computeArticulationAttStats` et consorts, prévues pour STORY-48) n'a été anticipée ici — bonne discipline de ne pas déborder sur la story suivante alors que rien n'empêchait techniquement de le faire dans le même diff.

## Prérequis bloquant (Risk R2) — statut vérifié, pas supposé

Le Developer a vérifié par une requête REST Supabase directe (lecture seule, `select=articulation_att,...&limit=1`) que la migration SQL **n'est pas encore appliquée** en production (`column match_data.articulation_att does not exist`) — diagnostic fait avant toute tentative d'écriture, conformément à la règle du projet sur l'absence d'environnement de test. La migration n'a **pas** été exécutée par le Developer, conformément à la story ("jamais automatiquement par le Developer"). C'est un blocage réel et attendu pour la suite du cycle (QA/E2E ne pourront pas vérifier de bout en bout tant qu'elle n'est pas faite), pas un oubli côté code.

## Vérifications systématiques

- **Pas de secret en dur nouveau** : aucune clé introduite, réutilise `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` existants pour le diagnostic en lecture seule.
- **Gestion d'erreurs** : sans objet ici — ce changement n'introduit aucun nouvel appel réseau applicatif (le diagnostic REST fait par le Developer était un test manuel hors code, pas une fonction ajoutée à l'app).
- **Réutilisation vs duplication** : aucune duplication — extension pure de structures existantes (`COLS`, `DATA_HEADER_TO_COLUMN`, `MATCH_DATA_COLUMN_ORDER`, `match_data`).
- **Cache-busting** : les 9 balises bumpées, vérifié par `grep -c`.

## Verdict

**APPROUVÉ** — aucun point bloquant, aucune réserve. Diff minimal, conforme à l'Architecture au caractère près, prérequis bloquant correctement identifié et non contourné.

# QA-20 — Import des colonnes "Articulation défensive" vers Supabase (STORY-33)

**Agent :** QA
**Date :** 2026-09-02

---

## Critères validés

- [x] Migration SQL fournie et **exécutée sur le projet Supabase réel** (`fenix-suivi-cf`, `oamldfduxwsghrxdsaxy`) par Romain — confirmé "Success. No rows returned" dans le SQL Editor
- [x] Réimport d'un fichier Excel contenant les 7 nouvelles colonnes → vérifié en conditions réelles (production) : 166/540 lignes avec `articulation_def` renseigné, valeurs identiques entre le fichier Excel source, le `DATA` client, et une requête REST directe sur `match_data`
- [x] Réimport d'un fichier Excel sans ces colonnes → vérifié par simulation directe du pipeline (Developer, cf. code-review) sur une version tronquée du fichier réel : 540 lignes construites, aucune régression, colonnes absentes proprement (pas d'erreur)
- [x] Lignes avec `ARTICULATION DEF`/`P1`-`P6` vides → aucune erreur observée, valeurs `null` (374 lignes sur 540 non taguées, aucune n'a fait planter l'import)
- [x] Import tenté avant la migration SQL → non re-testé en conditions réelles après coup (migration déjà appliquée, test destructif non pertinent maintenant) ; couvert par la lecture du code (Code Reviewer) : le `catch` existant autour de `replaceTable()` gère déjà ce cas avec un message incluant l'erreur Postgres réelle

## Cas limite rencontré pendant le test (pas un bug de la story)

Le fichier Excel de Romain contient une ligne "legacy" (juste après la ligne d'en-tête réelle) avec des libellés numérotés type `"#1 Club"`, `"#2 Phase att"` — cette ligne n'a que 22 colonnes (s'arrête avant les nouvelles colonnes) et possède une valeur non vide dans la colonne `Rencontre`, donc elle passe le filtre `row[COLS.rencontre]` et se retrouve comptée comme une ligne de données. **Préexistant, indépendant de cette story** (le filtre n'a pas changé), à signaler à Romain pour nettoyage éventuel de son fichier source — pas un défaut du code de STORY-33.

## Incident de test signalé pour information (méthodologie, pas un bug)

Pendant la vérification, un premier test a semblé indiquer que les colonnes n'arrivaient pas du tout (0 ligne taguée). Cause réelle : cache navigateur sur le document HTML principal (chargé une première fois avant le push du code, puis re-testé sans rechargement forcé) — **pas un défaut de l'application**, confirmé en rechargeant avec un paramètre anti-cache. Mentionné ici uniquement pour la traçabilité du test, aucune action corrective nécessaire côté app (le fichier HTML n'a jamais eu de cache-busting sur lui-même, comportement déjà connu et accepté).

## Effet de bord réel — nouvelle donnée en production

Ce test a réellement réimporté le fichier Excel à jour de Romain, qui contenait un 4ᵉ match non encore présent en production (`MATCHS` passé de 3 à 4). Comportement voulu du système (réimport = remplacement complet, déjà documenté), pas un effet du code de cette story — à confirmer avec Romain que c'est bien intentionnel, comme lors d'un précédent audit similaire.

## Régressions détectées

Aucune.

## Verdict

**PASSED** — tous les critères d'acceptation vérifiés, dont un test en conditions réelles complet (Excel → app → Supabase) sur la base de production.

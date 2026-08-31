# Code Review — STORY-21 (Import Excel → Supabase, remplacement complet)

**Agent :** Code Reviewer
**Date :** 2026-08-31
**Diff :** `FENIX-HANDBALL-CF-SUIVI.html` (`processFile()`, ~25 lignes ajoutées/modifiées), `js/supabase-client.js` (+56 lignes : `buildMatchDataRows()`, `_normaliseHeader()`, `DATA_HEADER_TO_COLUMN`)

---

## Conformité à la story

- Lecture par nom de colonne conforme au critère central de la story. `DATA_HEADER_TO_COLUMN` mappe les 21 en-têtes réels de la feuille `DATA` (vérifiés contre le fichier `ESSAI IA STAT.xlsm`, pas supposés) vers les colonnes `match_data` — testé avec des en-têtes accentués réels (`Défense attaquée`, `Période`, `Finalité`) pour confirmer que la normalisation (accents, casse, espaces) fonctionne, pas seulement sur les en-têtes ASCII simples.
- Remplacement complet : réutilise `replaceTable()` (STORY-20) telle quelle plutôt que de dupliquer une logique similaire — bonne discipline, une seule implémentation de la stratégie DELETE/INSERT à maintenir.
- Parsing XLSX inchangé : `jsonData`, `DATA`, `JOUEURS_TERRAIN`, `TEMPS_JEU`, `_rawBilanRows` construits identiquement à avant — vérifié par diff, la synchronisation Supabase est un bloc ajouté en fin de fonction, pas une modification de la logique existante.

## Gestion d'erreur — deux niveaux distincts, bien pensée

Le Developer a choisi de garder l'erreur de synchronisation Supabase **séparée** de l'erreur de parsing local (deux `try/catch` imbriqués plutôt qu'un seul), avec un message différent :
- Erreur de parsing → `"Erreur: ..."` (comportement inchangé)
- Erreur de synchronisation Supabase (après un import local déjà réussi) → message explicite précisant que les données restent visibles localement et qu'un nouvel import resynchronisera

C'est un choix pas explicitement demandé par la story mais cohérent avec son esprit (R3 : "un message d'erreur clair est affiché") et évite un vrai risque UX : sans cette distinction, un Romain qui importe son fichier au gymnase avec un wifi capricieux pourrait croire que **tout** l'import a échoué (y compris localement) alors que ses données sont en fait bien visibles sur son appareil, juste pas encore synchronisées ailleurs.

## Écart mineur découvert, non corrigé (hors scope)

En lisant le bloc de parsing de la feuille `Joueurs`, le Code Reviewer a remarqué que `iNom` (`headers.findIndex(h => h?.includes('nom'))`) matcherait potentiellement l'en-tête "NOM ID" au lieu de "Nom " si l'ordre des colonnes de cette feuille changeait un jour (les deux contiennent la sous-chaîne "nom"). Sur le fichier actuel, "Nom " précède "NOM ID" donc aucun bug observable. Le Developer avait initialement corrigé ce point puis l'a délibérément annulé, en le documentant comme hors scope de cette story (qui ne concerne que la lecture de la feuille `DATA`) plutôt que de l'inclure "tant qu'à faire" — bon réflexe de discipline de scope, à traiter dans une story dédiée si Romain le signale un jour comme un problème réel.

## Test réel plutôt que supposé

Le Developer a testé deux imports consécutifs du fichier réel en conditions de navigateur réelles (pas de simulation), avec vérification des comptages via l'API REST (`Prefer: count=exact`) après chacun — c'est la preuve la plus directe possible que `replaceTable()` fonctionne correctement sur les 4 tables réelles, y compris `joueurs` (le cas le plus délicat, clé naturelle).

## Non-régression

Testé : rendu local du Dashboard identique avant/après (mêmes chiffres 27/48, 30/54 etc.), 0 erreur console sur les deux imports.

## Scope

Conforme — aucune lecture depuis Supabase (hors scope, STORY-22), `localStorage` conservé tel quel (choix laissé au Developer, non touché).

---

## Verdict : ✅ APPROUVÉ

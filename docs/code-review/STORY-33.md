# Code Review — STORY-33 (Import des colonnes "Articulation défensive" vers Supabase)

**Agent :** Code Reviewer
**Date :** 2026-09-02

---

## Diff revu

- `FENIX-HANDBALL-CF-SUIVI.html` : `COLS` +7 clés (`articulation_def: 22` à `p6: 28`), suite logique de `intention_attaque: 21`, style identique au reste de l'objet.
- `js/supabase-client.js` : `DATA_HEADER_TO_COLUMN` +7 entrées, `MATCH_DATA_COLUMN_ORDER` +7 entrées en fin de liste — ordre vérifié correspondant exactement à `COLS` (position par position).
- `supabase/schema.sql` : +7 colonnes `text` nullable sur `match_data`, cohérent avec les colonnes existantes du même type.
- `supabase/migrate-articulation-defensive.sql` (nouveau) : script de migration additif (`add column if not exists`), commenté, rejouable sans risque.
- Version `?v=` incrémentée sur les 9 balises (v256→v257).

## Conformité Architecture

Conforme point par point à `docs/arch/articulation-defensive.md` §1 — aucun écart. Le Developer n'a pas touché à `buildMatchDataRows()`/`rowToPositionalArray()`/`_normaliseHeader()` eux-mêmes (corrigement : ces fonctions sont déjà génériques et n'avaient besoin d'aucune modification, seulement des données de mapping supplémentaires).

## Réutilisation vs duplication

Aucune duplication — extension pure des structures de données existantes (`COLS`, `DATA_HEADER_TO_COLUMN`, `MATCH_DATA_COLUMN_ORDER`), exactement le pattern déjà en place pour `intention_attaque`.

## Scope

Strictement dans le périmètre de la story — aucun fichier touché en dehors de ceux listés dans le contexte technique de STORY-33. Aucun code d'affichage ou d'agrégation ajouté (bien, c'est le rôle de STORY-34/35).

## Gestion d'erreurs

Pas de nouveau code de gestion d'erreur nécessaire — le chemin d'échec (colonnes manquantes côté Supabase si la migration SQL n'a pas encore été appliquée) remonte déjà via le `catch (supabaseError)` existant (`FENIX-HANDBALL-CF-SUIVI.html` ~L1566-1568), qui inclut `supabaseError.message` (l'erreur PostgREST nommera explicitement la colonne manquante) — suffisant, pas de sur-ingénierie nécessaire pour un cas d'erreur qui ne devrait se produire qu'une fois (avant que Romain exécute la migration).

## Sécurité basique

Aucune clé ni secret en dur ajouté. Aucune nouvelle surface de requête non filtrée (le pipeline d'import existant est déjà utilisé tel quel).

## Vérification indépendante (au-delà de la simple lecture)

Le Developer a fourni une simulation Node exécutée directement sur le vrai fichier `ESSAI IA STAT.xlsm` de Romain (540 lignes, 166 taguées) reproduisant exactement `buildMatchDataRows`/`rowToPositionalArray`. J'ai vérifié que cette simulation utilise bien le code réel (mêmes objets `DATA_HEADER_TO_COLUMN`/`MATCH_DATA_COLUMN_ORDER` que ceux commités, pas une version simplifiée) — résultats cohérents avec les critères d'acceptation (0 en-tête non mappé, ancien format toujours fonctionnel, valeurs vides tolérées).

## Note pour STORY-34 (hors scope de cette review, à ne pas corriger ici)

En observant les données réelles pendant la vérification, une ligne taguée `articulation_def` a `possession: null` (une ligne de sous-événement, pas une "vraie fin de possession" selon la convention déjà en place ailleurs dans `computeEncStats`). Cela suggère que le tag `ARTICULATION DEF`/`P1`-`P6` n'est **pas** systématiquement posé sur la ligne de fin de possession comme le suppose `docs/arch/articulation-defensive.md` §2 pour `computeArticulationStats()`. À vérifier avec Romain ou sur un échantillon plus large avant d'implémenter STORY-34 — le filtre de dédoublonnage par possession devra peut-être être adapté (ex: prendre le tag présent n'importe où dans le groupe de lignes de la possession, pas uniquement sur la ligne finale).

## Verdict

**APPROUVÉ** — rien de bloquant, rien à reprendre. Prêt pour le QA.

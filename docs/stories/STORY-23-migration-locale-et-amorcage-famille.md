# STORY-23 — Migration des données locales existantes + amorçage des familles

**En tant que** coach,
**Je veux** que mes notes/comptes/assignations déjà saisis dans l'app soient transférés vers Supabase automatiquement,
**Afin de** ne rien perdre au moment de la bascule.

## ⚠️ Point à clarifier avec Romain avant de commencer (risque R4)
`docs/risks/migration-supabase.md` R4 : si Romain a déjà utilisé l'app sur **plusieurs appareils différents** avec des données locales distinctes (notes coach, comptes joueurs), migrer depuis un deuxième appareil après un premier peut écraser silencieusement des entrées déjà transférées. **Demander explicitement à Romain, avant de développer cette story, sur combien d'appareils il a des données locales existantes, et lesquelles.**

**Réponse de Romain (2026-08-31)** : un seul appareil (le principal). R4 écarté — aucun risque de données divergentes entre appareils à gérer pour cette story.

## Contexte technique
- Zone concernée : nouvelle fonction `checkAndOfferLocalMigration()`, nouvel écran de migration (Design F5), `js/page-analyse.js` (`coachAnalyses`), `js/player-mode.js` (`fenix_player_accounts`), `js/page-analyse.js` (`_ENC_FAMILLE_CUSTOM`)
- Spec exacte : `docs/design/migration-supabase.md` §2, `docs/arch/migration-supabase.md` §2 (mécanismes A et B, bien distincts)
- Deux mécanismes dans cette story :
  - **A. Migration locale de Romain** — déclenchée dans l'app au premier chargement post-bascule si des données `localStorage` non-migrées existent
  - **B. Amorçage initial de `famille_mapping`** — fait une fois par le Developer (SQL Editor ou script), pas par Romain via l'UI : insérer les 18 valeurs de `ENC_FAMILLE_MAP` (hardcodées, `js/page-analyse.js`) puis appliquer par-dessus les entrées de `_ENC_FAMILLE_CUSTOM` de Romain si présentes

## Critères d'acceptation
- [x] Mécanisme A : au chargement, si `fenix_coach_analyses`/`fenix_player_accounts`/`enc_famille_custom` contiennent des données ET qu'aucun flag `fenix_supabase_migrated` n'est posé, un écran de migration s'affiche (Design F5) avec le décompte réel des éléments trouvés. Testé en conditions réelles : 1 note + 1 compte + 1 assignation → décompte exact affiché (`docs/e2e/screenshots/story-23-migration-prompt.png`). Déclenché uniquement pour une session **staff** (jamais joueur, vérifié explicitement — cf. Sécurité).
- [x] Le bouton "Migrer maintenant" pousse chaque entrée de `coach_analyses`/`famille_mapping` en `upsert` (pas `insert` simple) ; **pour les comptes joueurs (`fenix_player_accounts`), appelle l'Edge Function `create-player-account` une fois par compte trouvé** (pas un `upsert` direct de table, cf. Architecture §1.2bis) — puis pose le flag `fenix_supabase_migrated`. Testé : les 3 types de données vérifiés présents dans Supabase via l'API REST après migration (coach_analyses, famille_mapping, player_profiles + auth.users réel créé).
- [x] **Mitigation R10** : le résultat de la migration des comptes joueurs est affiché **par compte** (réussi/échoué), pas un seul message global. Testé explicitement : un second essai sur un compte déjà migré affiche `✗ Compte Test.Migration23 — A user with this email address has already been registered` alors que les notes/familles (upsert idempotent) affichent `✓` — les deux résultats visibles côte à côte, aucun n'est masqué par l'autre.
- [x] Le bouton "Annuler" ferme sans migrer ; le prompt réapparaît au chargement suivant tant que la migration n'est pas faite. Testé : clic Annuler → `fenix_supabase_migrated` reste `null` → rechargement → prompt réaffiché.
- [x] Une entrée "🔄 Migrer mes données locales" reste disponible en permanence dans le menu "⚙ Outils" (`#btn-migrate-local`), pour rattraper une migration annulée ou refaite depuis un autre appareil. Appelle `checkAndOfferLocalMigration(true)` (bypasse le flag et le total à 0 — affiche aussi l'état "Aucune donnée locale à migrer" si tout est déjà fait, testé).
- [x] Mécanisme B : `famille_mapping` contient les 17 correspondances actuellement câblées dans `ENC_FAMILLE_MAP` (`js/page-analyse.js` — la story mentionnait 18, décompte réel vérifié à 17, écart de documentation d'un cycle antérieur, sans impact). Amorcées via l'API REST (upsert, clé publishable, RLS permissive — cf. `supabase/seed-famille-mapping.sql` pour le script SQL équivalent documenté) et **vérifiées ligne par ligne** via une lecture complète de la table (17/17 correspondances exactes, cf. Code Review). Romain n'a pas d'overrides `_ENC_FAMILLE_CUSTOM` connus à ce jour (n'affecte pas ce critère, mécanisme A les appliquerait automatiquement le cas échéant).
- [x] Testé : après migration, les données sont visibles dans Supabase (vérifié via l'API REST, équivalent au Table Editor) et identiques à ce qui existait en local avant la migration.

## Hors scope
- Écran d'édition de `famille_mapping` (STORY-25) — cette story ne fait qu'amorcer les données, pas les rendre éditables
- Rebranchement des écrans existants (comptes joueurs, notes coach) sur Supabase en lecture/écriture live (STORY-24)

## Dépend de
- STORY-20, STORY-22

## Taille
M

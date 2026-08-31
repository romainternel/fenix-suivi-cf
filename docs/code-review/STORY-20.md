# Code Review — STORY-20 (Setup projet Supabase + schéma de base)

**Agent :** Code Reviewer
**Date :** 2026-08-31
**Diff :** `FENIX-HANDBALL-CF-SUIVI.html` (2 lignes, CDN + cache-busting), nouveau `js/supabase-client.js`, nouveau `supabase/schema.sql`, nouveau `supabase/functions/create-player-account/index.ts`, nouveau `.gitignore`. Infrastructure Supabase (tables, RLS, Edge Function) créée directement dans le projet `fenix-suivi-cf`, hors du repo.

---

## Conformité à l'architecture

- Schéma SQL conforme à `docs/arch/migration-supabase.md` §1.3, à une déviation près : **`coach_analyses.analyse` renommée `contenu`** — `analyse`/`analyze` est un mot réservé PostgreSQL (alias de la commande `ANALYZE`), la création de table échouait littéralement avec cette colonne. Trouvé en conditions réelles (le premier essai de Romain dans le SQL Editor a échoué avec `syntax error at or near "analyse"`), corrigé immédiatement dans le schéma et re-synchronisé dans l'architecture (`docs/arch/migration-supabase.md`). Bon réflexe : la doc a été mise à jour pour rester la source de vérité, pas juste le code.
- RLS activée + policies permissives sur les 7 tables, conforme PRD §0 — vérifié par test d'écriture réel (insert + delete sur `famille_mapping` via la clé publishable), pas seulement supposé depuis le SQL exécuté.
- Client CDN en version épinglée exacte (`@2.112.4/dist/umd/supabase.min.js`, résolue via l'API jsDelivr au moment du dev) plutôt que `@2` flottant comme suggéré dans une version antérieure de l'architecture — aligné avec la convention déjà en place pour XLSX/Chart.js/pptxgenjs/html2canvas dans ce même fichier. Bonne cohérence de conventions, pas juste une copie littérale de la spec.

## `replaceTable()` — nuance non anticipée par l'architecture, bien gérée

L'architecture (§1.4) décrivait un remplacement complet générique ("DELETE puis INSERT"), sans distinguer le type de clé primaire. Le Developer a identifié que **`joueurs` a une clé naturelle (`nom`)**, réutilisée à l'identique à chaque import (même joueur, plusieurs saisons) — un `INSERT` avant `DELETE` sur cette table provoquerait un conflit de clé primaire, contrairement aux tables à clé auto-générée (`match_data`/`tableau_match`/`bilan`) où l'ordre insert-puis-delete est sans risque. La fonction distingue les deux cas plutôt que d'appliquer un seul schéma partout. Documenté en commentaire dans le code et repris dans la story — bonne anticipation d'un problème qui n'apparaît qu'à l'usage réel (STORY-21 l'aurait découvert bien plus tard, en pleine implémentation de l'import).

## Sécurité — R2bis mieux résolu que prévu

L'architecture et les risques anticipaient une configuration manuelle du secret `service_role` via `supabase secrets set`. En pratique, `SUPABASE_SERVICE_ROLE_KEY` est **injectée automatiquement** par Supabase dans l'environnement de toute Edge Function déployée — aucune commande de configuration manuelle n'a été nécessaire, donc **la clé n'a jamais transité par un terminal, un fichier ou un message**, ce qui est structurellement plus sûr que le plan initial (pas juste "bien configuré", mais "jamais manipulé du tout"). Vérifié par recherche explicite dans le repo (`grep -rn "service_role"`) : uniquement des mentions documentaires du concept, aucune valeur de clé.

Le jeton d'accès personnel Supabase utilisé pour le déploiement CLI (`sbp_...`) n'apparaît dans aucun fichier du repo — utilisé uniquement comme variable d'environnement shell le temps des commandes, jamais écrit sur disque.

## Test de bout en bout réellement exécuté (pas juste "devrait marcher")

Le Developer a testé le parcours complet en conditions réelles plutôt que de se contenter du déploiement :
1. Appel HTTP direct de l'Edge Function (`nom`/`motDePasse` de test) → `{"ok":true, "userId": "..."}`
2. Vérification de la ligne `player_profiles` créée
3. `POST /auth/v1/token?grant_type=password` avec les identifiants du compte de test → token JWT valide retourné
4. Nettoyage complet (suppression du compte de test et de son profil) après vérification

C'est la preuve la plus forte possible que le flux Auth fonctionne réellement, pas une supposition basée sur l'absence d'erreur au déploiement.

## Non-régression

Testé en navigateur réel : chargement de l'app sans erreur console, `window.supabase`/`supabaseClient`/`fetchAll`/`replaceTable`/`upsertRows` tous correctement définis et fonctionnels (`fetchAll('joueurs')` exécuté depuis la page elle-même, retour `[]` sans erreur), écran d'import affiché normalement (aucune régression visuelle sur l'existant, cohérent avec le "Hors scope : aucun flux applicatif réel côté UI" de la story — ces scripts ne sont pas encore appelés par le reste de l'app).

## Scope

Conforme — aucun flux UI branché (import, lecture au boot, panneau comptes), comme explicitement prévu en hors-scope. Le `.gitignore` ajouté (`supabase/.temp/`) est un sous-produit nécessaire du `supabase link` local, pas un dépassement de scope.

---

## Verdict : ✅ APPROUVÉ

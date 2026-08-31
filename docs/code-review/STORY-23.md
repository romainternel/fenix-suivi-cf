# Code Review — STORY-23 (Migration des données locales existantes + amorçage des familles)

**Agent :** Code Reviewer
**Date :** 2026-08-31
**Diff :** `FENIX-HANDBALL-CF-SUIVI.html` (overlay F5, hooks `checkLogin()`/IIFE de restauration de session, entrée menu Outils), `css/style.css` (styles F5), `js/supabase-client.js` (+`_f5CountLocalData()`, `checkAndOfferLocalMigration()`, `closeF5MigrationPrompt()`, `callCreatePlayerAccount()`, `runLocalMigration()`), nouveau `supabase/seed-famille-mapping.sql`

---

## Gating staff-only — point vérifié en priorité

Rien dans les docs Architecture/Design ne traitait explicitement du cas où `checkAndOfferLocalMigration()` pourrait se déclencher pendant une session **joueur** (les notes de coach et mots de passe joueurs n'ont rien à faire visibles par un joueur). Le Developer a résolu ça en n'appelant la fonction que depuis trois points garantis staff : la branche `role === 'staff'` de l'IIFE de restauration de session, la branche `fenix_auth === '1'` (ancien flag, toujours staff), et la branche `pwd === 'Partage'` de `checkLogin()` — jamais depuis `loadFromSupabase()` (qui tourne avant que le rôle ne soit connu) ni depuis la branche joueur de `checkLogin()`. Testé explicitement en conditions réelles (cf. QA/E2E) : une session joueur, fraîche ou restaurée, ne déclenche jamais l'overlay même avec des données locales non migrées présentes.

## Mécanisme A — conforme à l'Architecture §2

- Décompte réel (pas de texte générique) : `_f5CountLocalData()` lit les 3 clés `localStorage`, chaque `try/catch` isolé (un JSON corrompu sur une clé n'empêche pas de compter les deux autres).
- `runLocalMigration()` traite les 3 types dans l'ordre notes → familles → comptes, avec un `try/catch` **par type** pour notes/familles (échec sur l'un n'empêche pas l'autre) et un `try/catch` **par compte** pour les comptes joueurs (mitigation R10) — cohérent avec la story et testé (cf. QA).
- `localStorage.setItem('fenix_supabase_migrated', '1')` posé inconditionnellement en fin de fonction, même en cas d'échecs partiels — conforme à la formulation exacte du critère d'acceptation ("puis pose le flag"). Le filet de rattrapage permanent (menu Outils, `force=true`) reste disponible si Romain doit recréer un compte resté en échec.

## Réutilisation de l'existant plutôt que duplication

`runLocalMigration()` réutilise `upsertRows()` (STORY-20) pour `coach_analyses`/`famille_mapping` sans réinventer de logique d'upsert — seule nouveauté réelle : `callCreatePlayerAccount()`, un appel `fetch` direct vers l'Edge Function (plutôt que `supabaseClient.functions.invoke()`) pour garder le contrôle total sur la lecture du corps de réponse en cas d'erreur HTTP non-2xx, nécessaire pour afficher un message d'échec précis par compte.

## Mécanisme B — vérifié ligne par ligne, pas supposé

`supabase/seed-famille-mapping.sql` reprend les 17 entrées de `ENC_FAMILLE_MAP` (`js/page-analyse.js:6-16`) — comparaison manuelle faite clé par clé entre le fichier SQL et le littéral JS, 17/17 identiques. Écart mineur découvert : la story parlait de "18 correspondances", `ENC_FAMILLE_MAP` en contient réellement 17 (probable trace d'une version antérieure du mapping, avant la fusion Jeu PVT/Bloc PVT actée le 2026-08-27) — non bloquant, documenté dans la story plutôt que corrigé silencieusement. Amorçage exécuté via l'API REST (upsert, clé publishable) plutôt que le SQL Editor manuel utilisé en STORY-20 — choix pragmatique valide ici car `famille_mapping` a une policy RLS permissive identique à ce que ferait un script SQL, et la vérification post-amorçage (lecture complète de la table, 17/17 lignes exactes) donne la même garantie qu'une vérification en SQL Editor.

## Sécurité — clé publishable seule, jamais de service_role

`callCreatePlayerAccount()` envoie la clé publishable en en-tête `Authorization`/`apikey`, jamais la clé `service_role` (qui reste exclusivement côté Edge Function, inchangé depuis STORY-20). Grep sur le diff : aucune occurrence de `service_role` ni de secret.

## Scope

Conforme — aucune modification de `getEncFamille()` ni des écrans existants (comptes joueurs, notes coach) pour qu'ils lisent/écrivent Supabase en direct : ils continuent de lire/écrire `localStorage` comme avant, seule une copie ponctuelle part vers Supabase. C'est bien le sujet de STORY-24, pas de celle-ci.

## Non-régression

Aucune fonction existante modifiée en dehors des 3 points d'accroche listés plus haut (2 lignes ajoutées chacun) — le reste de l'app (Dashboard, Analyse, Joueurs, Notes) non touché.

---

## Verdict : ✅ APPROUVÉ

# STORY-20 — Setup projet Supabase + schéma de base

**En tant que** développeur de l'app,
**Je veux** un projet Supabase configuré avec le schéma de tables défini par l'Architecture,
**Afin de** disposer d'une destination fonctionnelle avant de brancher le moindre flux de lecture/écriture.

## Contexte technique
- Zone concernée : nouveau fichier `js/supabase-client.js`, `FENIX-HANDBALL-CF-SUIVI.html` (ajout du script CDN), nouvelle Edge Function `supabase/functions/create-player-account/`
- Spec exacte : `docs/arch/migration-supabase.md` §1.1, §1.2bis, §1.3
- **Prérequis externe bloquant** : Romain doit créer le projet Supabase (supabase.com) et fournir l'URL + la clé anonyme avant que cette story puisse commencer. Aucune autre story de ce cycle ne peut démarrer avant celle-ci.
- **Révisé le 2026-08-28** : les comptes joueurs utilisent Supabase Auth (pas de table `player_accounts` en clair) — cette story inclut désormais le déploiement de l'Edge Function `create-player-account` (§1.2bis).

## Critères d'acceptation
- [ ] Les 6 tables de données du schéma existent dans Supabase : `match_data`, `joueurs`, `tableau_match`, `bilan`, `famille_mapping`, `coach_analyses`, plus `player_profiles` (colonnes exactes : `docs/arch/migration-supabase.md` §1.3)
- [ ] Row Level Security activée sur ces 7 tables avec des policies permissives (lecture/écriture ouvertes à la clé anonyme), conformément à la décision PRD §0 (accès staff mono-utilisateur, pas de nouveau modèle de permission) — **`player_profiles` peut rester permissive en lecture/écriture aussi, elle ne contient ni mot de passe ni donnée sensible, juste le lien nom↔compte**
- [ ] `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">` ajouté dans `FENIX-HANDBALL-CF-SUIVI.html`, avant les autres scripts `js/*.js` qui en dépendront
- [ ] `js/supabase-client.js` créé : initialise le client (`window.supabase.createClient(URL, ANON_KEY)`), expose `fetchAll()`, `replaceTable(table, rows)`, `upsertRows(table, rows)` — signatures définies mais implémentation minimale (pas encore appelées par le reste de l'app à ce stade)
- [ ] Un test manuel simple (ex. depuis la console navigateur) confirme que le client peut lire/écrire sur au moins une table
- [ ] Édge Function `create-player-account` écrite et déployée (`supabase functions deploy`) : reçoit `{nom, motDePasse}`, génère l'email interne (ex. `lucas.g@fenix.local`), appelle `admin.createUser()`, crée la ligne `player_profiles`
- [ ] **Mitigation R2bis (P0)** : le secret `service_role` est configuré via `supabase secrets set`, jamais commité dans le repo Git, jamais présent dans un fichier `.js`/`.html` servi statiquement — vérifié explicitement par une recherche dans le repo avant de considérer la story terminée
- [ ] Réglage Supabase Auth vérifié : "Confirm email" désactivé (Authentication → Providers → Email), sinon les comptes créés via l'Edge Function restent bloqués malgré `email_confirm: true`
- [ ] Test manuel : appeler l'Edge Function avec un nom/mot de passe de test, vérifier qu'un compte apparaît dans `auth.users` et une ligne dans `player_profiles`, puis `supabase.auth.signInWithPassword()` réussit avec ces identifiants

## Hors scope
- Aucun flux applicatif réel côté UI (import, lecture au boot, édition famille, panneau Comptes joueurs) — cette story pose uniquement le socle et l'Edge Function, pas leur branchement dans l'app
- Amélioration du modèle de sécurité au-delà de ce qui est déjà décidé (R2bis mis à part, qui est un critère de cette story)

## Dépend de
- Aucune story — mais bloquée par la fourniture des identifiants Supabase par Romain

## Taille
M (révisée de S à M suite à l'ajout de l'Edge Function le 2026-08-28)

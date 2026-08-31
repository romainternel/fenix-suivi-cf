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
- [x] Les 6 tables de données du schéma existent dans Supabase : `match_data`, `joueurs`, `tableau_match`, `bilan`, `famille_mapping`, `coach_analyses`, plus `player_profiles` (colonnes exactes : `docs/arch/migration-supabase.md` §1.3) — **déviation mineure documentée** : `coach_analyses.analyse` renommée en `contenu` (`analyse`/`analyze` est un mot réservé PostgreSQL, bloquait la création de la table)
- [x] Row Level Security activée sur ces 7 tables avec des policies permissives (lecture/écriture ouvertes à la clé publishable), conformément à la décision PRD §0
- [x] `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/dist/umd/supabase.min.js">` ajouté dans `FENIX-HANDBALL-CF-SUIVI.html` — **version épinglée exacte** (2.112.4, résolue via l'API jsDelivr) plutôt que `@2` flottant, cohérent avec la convention déjà en place pour XLSX/Chart.js/pptxgenjs/html2canvas
- [x] `js/supabase-client.js` créé, avec l'URL et la clé réelles du projet `fenix-suivi-cf` — expose `fetchAll()`, `replaceTable(table, rows)`, `upsertRows(table, rows)`. **Précision par rapport à la spec initiale** : `replaceTable()` distingue les tables à clé auto-générée (`match_data`/`tableau_match`/`bilan`, insertion avant suppression, aucun risque de collision) des tables à clé naturelle (`joueurs`, clé `nom` réutilisée à chaque import → suppression avant insertion nécessaire pour éviter un conflit de clé primaire, fenêtre courte acceptée cf. Architecture §1.4)
- [x] Testé en conditions réelles (requêtes REST directes, pas juste console navigateur) : lecture sur `joueurs`/`player_profiles` (vide, sans erreur = RLS OK), écriture testée sur `famille_mapping` (insert + delete réussis)
- [x] Edge Function `create-player-account` écrite et déployée (`supabase functions deploy`, confirmé par le CLI : `"Deployed Functions"`)
- [x] **Mitigation R2bis (P0) — plus simple que prévu** : `SUPABASE_SERVICE_ROLE_KEY` et `SUPABASE_URL` sont **automatiquement injectées par Supabase** dans l'environnement de toute Edge Function (`Deno.env.get(...)`), sans configuration manuelle via `supabase secrets set` — la clé service_role n'a donc **jamais transité** par un fichier, une commande, ou un message, à aucun moment. Recherche explicite dans le repo (`grep -rn "service_role"`) : aucune valeur de clé trouvée, uniquement des mentions documentaires du concept.
- [x] Réglage Supabase Auth : le compte de test créé via l'Edge Function avait `email_confirmed_at` renseigné dès la création (grâce à `email_confirm: true` dans `admin.createUser()`) — la connexion a fonctionné sans blocage, le réglage "Confirm email" n'a donc pas eu besoin d'être touché pour ce flux précis (il reste décoché par précaution côté dashboard)
- [x] Test manuel complet effectué (puis nettoyé) : compte `Test.Audit` créé via l'Edge Function → ligne `player_profiles` confirmée → `POST /auth/v1/token?grant_type=password` a retourné un token JWT valide → compte et profil supprimés après vérification

## Hors scope
- Aucun flux applicatif réel côté UI (import, lecture au boot, édition famille, panneau Comptes joueurs) — cette story pose uniquement le socle et l'Edge Function, pas leur branchement dans l'app
- Amélioration du modèle de sécurité au-delà de ce qui est déjà décidé (R2bis mis à part, qui est un critère de cette story)

## Dépend de
- Aucune story — mais bloquée par la fourniture des identifiants Supabase par Romain

## Taille
M (révisée de S à M suite à l'ajout de l'Edge Function le 2026-08-28)

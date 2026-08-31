# STORY-20 — Setup projet Supabase + schéma de base

**En tant que** développeur de l'app,
**Je veux** un projet Supabase configuré avec le schéma de tables défini par l'Architecture,
**Afin de** disposer d'une destination fonctionnelle avant de brancher le moindre flux de lecture/écriture.

## Contexte technique
- Zone concernée : nouveau fichier `js/supabase-client.js`, `FENIX-HANDBALL-CF-SUIVI.html` (ajout du script CDN)
- Spec exacte : `docs/arch/migration-supabase.md` §1.1, §1.3
- **Prérequis externe bloquant** : Romain doit créer le projet Supabase (supabase.com) et fournir l'URL + la clé anonyme avant que cette story puisse commencer. Aucune autre story de ce cycle ne peut démarrer avant celle-ci.

## Critères d'acceptation
- [ ] Les 7 tables du schéma existent dans Supabase : `match_data`, `joueurs`, `tableau_match`, `bilan`, `famille_mapping`, `coach_analyses`, `player_accounts` (colonnes exactes : `docs/arch/migration-supabase.md` §1.3)
- [ ] Row Level Security activée sur les 7 tables avec des policies permissives (lecture/écriture ouvertes à la clé anonyme), conformément à la décision PRD §0 (accès staff mono-utilisateur, pas de nouveau modèle de permission)
- [ ] `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">` ajouté dans `FENIX-HANDBALL-CF-SUIVI.html`, avant les autres scripts `js/*.js` qui en dépendront
- [ ] `js/supabase-client.js` créé : initialise le client (`window.supabase.createClient(URL, ANON_KEY)`), expose `fetchAll()`, `replaceTable(table, rows)`, `upsertRows(table, rows)` — signatures définies mais implémentation minimale (pas encore appelées par le reste de l'app à ce stade)
- [ ] Un test manuel simple (ex. depuis la console navigateur) confirme que le client peut lire/écrire sur au moins une table

## Hors scope
- Aucun flux applicatif réel (import, lecture au boot, édition famille) — cette story pose uniquement le socle
- Amélioration du modèle de sécurité au-delà des policies permissives déjà décidées (R2, `docs/risks/migration-supabase.md`)

## Dépend de
- Aucune story — mais bloquée par la fourniture des identifiants Supabase par Romain

## Taille
S

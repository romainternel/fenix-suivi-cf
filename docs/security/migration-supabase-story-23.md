# Audit sécurité — STORY-23 (Migration des données locales existantes + amorçage des familles)

**Agent :** Security Access Auditor
**Date :** 2026-08-31
**Déclenché car :** la story écrit dans 2 tables (`coach_analyses`, `famille_mapping`) et appelle l'Edge Function `create-player-account` de façon répétée (une fois par compte local trouvé)

---

## Périmètre

Aucune nouvelle table, aucune nouvelle policy, aucune nouvelle Edge Function. Cette story ajoute un nouveau **client** de l'Edge Function existante (appel multiple côté navigateur, migration locale) et deux nouvelles écritures `upsert` vers des tables déjà auditées en STORY-20.

## Vérifications

- **Exposition de session — le point le plus important de cet audit** : le déclenchement de l'écran de migration est strictement réservé aux sessions staff (cf. Code Review). Vérifié activement : une session joueur (fraîche ou restaurée) ne voit jamais les notes de coach, comptes joueurs en clair, ni les assignations de famille d'un autre joueur — ces données resteraient sinon visibles côté client à un joueur qui n'a aucune raison d'y accéder.
- **Mot de passe joueur en transit** : `callCreatePlayerAccount()` envoie `motDePasse` en clair dans le corps JSON vers l'Edge Function — comportement identique à ce qui existe déjà pour la création manuelle d'un compte (STORY-20, non modifié ici), protégé par HTTPS (TLS) comme tout le reste de l'app. Pas de régression, pas de nouvelle exposition.
- **Clé utilisée** : uniquement la clé publishable (`SUPABASE_PUBLISHABLE_KEY`), jamais `service_role` — vérifié par lecture du diff complet.
- **Répétition d'appels à l'Edge Function** : le finding Majeur déjà connu (R11, `docs/security/migration-supabase-story-20.md`) — absence de vérification d'appelant — s'applique de la même façon ici qu'ailleurs, sans aggravation : cette story ne fait qu'appeler l'Edge Function existante plusieurs fois d'affilée depuis un contexte déjà authentifié comme staff (mot de passe "Partage" saisi), pas une nouvelle surface d'attaque. Reste à trancher avec Romain avant STORY-24 (inchangé).
- **Amorçage de `famille_mapping`** : exécuté via la clé publishable, RLS permissive déjà acceptée (PRD §0) — aucune donnée sensible dans cette table (mapping tactique, pas de PII).

## Verdict

Aucun nouveau finding.

# Audit sécurité — STORY-21 (Import Excel → Supabase)

**Agent :** Security Access Auditor
**Date :** 2026-08-31
**Déclenché car :** la story écrit dans 4 ressources backend (`match_data`, `joueurs`, `tableau_match`, `bilan`)

---

## Périmètre

Cette story ne crée aucune nouvelle table ni nouvelle policy — elle active simplement, pour la première fois, l'écriture réelle dans les 4 tables déjà auditées en STORY-20 (`docs/security/migration-supabase-story-20.md`). Le modèle d'accès (RLS permissive via la clé publishable) est inchangé, déjà accepté par Romain (PRD §0).

## Vérifications

- **Pas de nouvelle exposition** : les 4 tables concernées ne contiennent aucune donnée d'identification/authentification (contrairement à `player_profiles`/`auth.users`, hors scope de cette story). Le pire cas d'un accès non autorisé reste la lecture/écriture de statistiques de match — déjà le modèle accepté.
- **Pas d'injection SQL possible** : les valeurs sont envoyées via le client `supabase-js` (requêtes paramétrées côté PostgREST), jamais concaténées dans une chaîne SQL brute — vérifié dans `buildMatchDataRows()`/`replaceTable()`, aucune construction de requête textuelle.
- **Volumétrie et déni de service** : un import pousse ~364 lignes sur le fichier de test (~3500-5500 lignes attendues en usage réel saison complète, cf. `docs/research/migration-supabase.md` §2) — aucun risque de saturation à cette échelle, conforme à l'analyse déjà faite.
- **Le finding Majeur de STORY-20** (R11, Edge Function sans vérification d'appelant) n'est pas aggravé ni modifié par cette story — sujet distinct (comptes joueurs), toujours à trancher avant STORY-24.

## Verdict

Aucun nouveau finding. Rien à ajouter au registre de risques au-delà de ce qui est déjà documenté.

# Audit sécurité — STORY-26 (Écran d'édition des bilans)

**Agent :** Security Access Auditor
**Date :** 2026-09-01
**Déclenché car :** la story écrit dans une ressource backend (`bilan`) depuis des champs texte libre

---

## Périmètre

Aucune nouvelle table, aucune nouvelle policy. Écriture directe sur `bilan` via `supabaseClient` (upsert / delete), clé publishable, RLS permissive déjà acceptée.

## Vérifications

- **Injection dans le DOM (XSS)** : `saison`/`nom`/`journee_fin` sont tous des champs texte libre. Vérifié que `_renderBilansList()` passe systématiquement par `_escapeHtml()` avant insertion dans `innerHTML` — aucun vecteur d'injection identifié. Le seul attribut non échappé est `data-id="${r.id}"`, mais `id` est un `bigserial` numérique renvoyé par Supabase, jamais une saisie utilisateur — pas de risque.
- **Injection SQL** : aucune, requêtes paramétrées via `supabase-js`.
- **Donnée non sensible** : `bilan` ne contient aucune donnée personnelle — le pire cas d'un abus reste une corruption des bornes de périodes affichées, visible et corrigible immédiatement par Romain.
- **Suppression par `id` non vérifiée côté serveur** : n'importe qui avec la clé publishable pourrait supprimer n'importe quelle ligne `bilan` en devinant un `id` — cohérent avec le modèle RLS permissif déjà accepté pour ce cycle (mono-utilisateur staff, pas de données sensibles en jeu), pas un nouveau finding.

## Verdict

Aucun nouveau finding.

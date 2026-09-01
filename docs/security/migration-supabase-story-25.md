# Audit sécurité — STORY-25 (Écran d'édition des familles tactiques)

**Agent :** Security Access Auditor
**Date :** 2026-09-01
**Déclenché car :** la story écrit dans une ressource backend (`famille_mapping`) depuis un nouveau formulaire à champ texte libre

---

## Périmètre

Aucune nouvelle table, aucune nouvelle policy, aucune Edge Function. Écriture directe sur `famille_mapping` via `supabaseClient` (upsert / delete), clé publishable, RLS permissive déjà acceptée (identique à STORY-23).

## Vérifications

- **Injection dans le DOM (XSS)** : `intention_attaque` est un champ texte libre (contrairement aux autres formulaires du cycle, qui utilisent des listes fermées). Vérifié que le rendu de la liste (`_renderFamillesList()`) passe systématiquement par `_escapeHtml()` avant insertion dans `innerHTML`, y compris pour l'attribut `data-intention` utilisé par le bouton supprimer — aucun vecteur d'injection HTML ou de sortie d'attribut identifié.
- **Injection SQL** : aucune, les valeurs transitent par le client `supabase-js` (requêtes paramétrées PostgREST), jamais de concaténation de chaîne SQL.
- **Donnée non sensible** : `famille_mapping` ne contient aucune donnée personnelle ou d'authentification (mapping tactique) — le pire cas d'un abus reste une corruption de la classification affichée, visible et corrigible immédiatement par Romain lui-même via ce même écran.
- **Champ libre → 9e famille fantôme** : le risque produit (pas sécurité) est mitigé par construction — le sélecteur "Famille" est un `<select>` fermé sur `ENC_FAMILLES_ORDRE` (8 valeurs), aucun moyen d'insérer une famille non gérée par le reste de l'app via ce formulaire.

## Verdict

Aucun nouveau finding.

# E2E-44 — Détail par intention enrichi (but/tir, PB, jet franc)

**Agent :** E2E Tester
**Date :** 2026-09-09
**Environnement :** serveur MCP Playwright, serveur statique local (port 8201), données réelles Supabase.

---

## Parcours testés

Parcours 100% piloté par clics réels (pas d'`evaluate`) : connexion → Analyse → sélection "AMICAL FENIX-BILLERE" → onglet Tactique → clic sur la famille "Faire courir" → clic sur l'intention "FAIRE COURIR".

## Résultat par parcours

✅ Niveau 1 (intentions de la famille) : colonne JF présente et intégrée au tableau existant.
✅ Niveau 2 (`docs/regression/screenshots/story44-e2e-level2.png`) : clic réel sur la ligne d'intention ouvre le détail par enclenchement (8;0 / DANI / Départ;4 / 4 / LIMOGES;Long), table inchangée, pas de colonne JF (hors scope, conforme).
✅ 0 erreur console sur l'ensemble du parcours.

## Écarts avec le verdict QA

Aucun. Confirme par clics réels (le QA avait vérifié les valeurs via `evaluate` pour l'exactitude des chiffres) que le parcours utilisateur complet fonctionne de bout en bout.

## Verdict

**CONFIRMÉ** — le parcours critique de la story fonctionne en conditions réelles, sans écart avec le verdict QA.

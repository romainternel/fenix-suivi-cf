# QA-14 — Migration des données locales existantes + amorçage des familles (STORY-23)

**Agent :** QA
**Date :** 2026-08-31

---

## Critères d'acceptation testés

| # | Critère | Résultat |
|---|---|---|
| 1 | Prompt de migration au chargement, décompte réel | ✅ 1 note/1 compte/1 assignation → texte exact affiché |
| 2 | "Migrer maintenant" upsert notes/familles + appel Edge Function par compte, puis pose le flag | ✅ Vérifié via API REST après migration : les 3 types de données présents en base |
| 3 | Mitigation R10 — statut par compte, pas global | ✅ Testé avec un compte déjà existant : `✓` notes/familles vs `✗ Compte X — already registered`, les deux visibles simultanément |
| 4 | "Annuler" ne migre rien, reprompt au chargement suivant | ✅ Flag reste absent après Annuler, prompt réaffiché au reload |
| 5 | Entrée permanente "🔄 Migrer mes données locales" dans Outils | ✅ Rejoue le prompt via `force=true`, y compris l'état "rien à migrer" |
| 6 | `famille_mapping` amorcée avec les correspondances par défaut | ✅ 17/17 lignes vérifiées par lecture complète de la table (voir remarque nombre) |
| 7 | Données visibles dans Supabase après migration | ✅ Vérifié via l'API REST (`coach_analyses`, `famille_mapping`, `player_profiles`) |

## Scénarios testés en conditions réelles

1. **Migration nominale** (staff, données présentes) : prompt → migration → succès sur les 3 types → confirmation "✅ Migration terminée" → overlay se ferme automatiquement.
2. **Retry sur compte déjà migré** : réactivation manuelle via Outils → notes/familles réussissent à nouveau (upsert idempotent) → compte joueur échoue individuellement avec un message clair, sans bloquer l'affichage des deux autres résultats.
3. **Aucune donnée locale** : déclenchement manuel forcé sans aucune des 3 clés `localStorage` → message "Aucune donnée locale à migrer sur cet appareil.", bouton "Migrer maintenant" masqué, bouton secondaire relabellisé "Fermer".
4. **Annulation** : clic "Annuler" → pas de flag posé → reprompt confirmé au rechargement suivant.
5. **Étanchéité staff/joueur** : session joueur fraîche ET session joueur restaurée (reload) avec des données locales non migrées présentes → overlay jamais affiché dans les deux cas.

## Bugs trouvés

Aucun.

## Remarque non bloquante

Le compte "Écart de 17 vs 18" documenté dans la story (`ENC_FAMILLE_MAP` contient réellement 17 correspondances, pas 18) est un écart de documentation d'un cycle BMAD antérieur, sans impact fonctionnel — les 17 réelles sont toutes amorcées correctement.

---

## Verdict : ✅ PASSED

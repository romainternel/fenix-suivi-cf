# Risques — Page Impact pour un gardien

**Agent :** Risk Analyst
**Date :** 2026-09-01

---

| # | Risque | Probabilité | Impact | Recommandation |
|---|---|---|---|---|
| R1 | Seuils de couleur `ZONE_SEUILS` appliqués à un % d'arrêt de gardien (déjà confirmé dans le code, pas hypothétique) — un gardien à 38% d'arrêts coloré comme "mauvais" avec un seuil pensé pour un ailier | Élevée (se produira systématiquement si non traité) | Moyen (donnée trompeuse, pas de perte de données, mais peut fausser une vraie décision d'entraînement) | **P0** — critère d'acceptation explicite : neutraliser la coloration par seuil pour un gardien (cf. Architecture §6). Bloquant avant livraison. |
| R2 | Régression sur le joueur de champ en fusionnant les 2 branches de `openImpactForSelected()`/`updateImpactPage()` | Moyenne (toute modification d'une fonction déjà utilisée quotidiennement porte ce risque) | Élevé (casserait une fonctionnalité Critique de la checklist, I5) | **P0** — test de non-régression explicite obligatoire : comparer un joueur de champ avant/après sur les mêmes chiffres exacts, pas juste "ça a l'air pareil". |
| R3 | F4 (suppression de `page-gardiens`) exécutée avant que F1 soit vérifiée en conditions réelles | Faible (dépend de l'ordre suivi par le Developer) | Critique le temps où ça dure (aucun écran Impact fonctionnel pour un gardien) | **P0** — dépendance stricte actée dans la story F4 elle-même : ne commence pas avant le feu vert QA/E2E de F1. |
| R4 | Le mode joueur mobile (`renderPlayerZones()`) est présumé déjà correct sur la seule base de la lecture de code, jamais vérifié en conditions réelles pour un vrai gardien connecté | Faible (le code semble déjà correct et cohérent avec le pattern validé) | Moyen (si un écart existe malgré tout, un gardien connecté lui-même le découvrirait en pleine saison) | **P1** — F3 doit être vérifiée par un vrai test E2E (connexion réelle d'un gardien, onglet Impact), pas seulement une relecture de code, même si aucun changement de code n'est prévu. |
| R5 | Un gardien qui n'a jamais encaissé de tir avec coordonnées d'impact renseignées (données manquantes dans l'Excel pour ce cas précis) affiche un écran vide sans explication | Faible (dépend de la qualité de saisie de l'Excel, hors contrôle de cette story) | Faible (état déjà géré ailleurs dans l'app pour un joueur de champ sans données — pas une nouveauté) | **P2** — vérifier que le message d'état vide existant ("aucune donnée") s'affiche correctement pour ce cas, pas de nouveau développement nécessaire si le pattern existant s'applique tel quel. |
| R6 | Libellé du filtre "Résultat" incohérent (`value="Tir raté"` / texte affiché "Tir arrêté", bug préexistant repéré par le Designer) corrigé "au passage" sans vérifier l'impact sur `resultatFilter` côté logique (la valeur réelle envoyée reste `'Tir raté'` même si le libellé change) | Faible | Faible (cosmétique, aucune donnée n'est faussée puisque c'est le `value` qui compte, pas le texte) | **P3** — accepté en l'état si corrigé ; si non corrigé dans ce cycle, ne pas le laisser traîner indéfiniment (à noter en dette technique). |

## Synthèse

2 risques P0 (R1, R2) sont des critères d'acceptation obligatoires de la story F1, pas des options. R3 (P0) devient la clause de dépendance de la story F4. Aucun risque de connectivité, de concurrence multi-utilisateur ou de permission identifié — cette feature est une lecture seule sur des données déjà en base, cohérente avec le reste de l'app (accès mono-utilisateur staff, ou lecture-seule joueur).

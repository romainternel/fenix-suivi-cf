# Risques — Articulation défensive (efficacité par poste occupé)

**Agent :** Risk Analyst
**Date :** 2026-09-02

---

## Tableau des risques

| # | Risque | Probabilité | Impact | Recommandation |
|---|---|---|---|---|
| R1 | **Format des noms `P1`-`P6` non garanti identique à `JOUEURS_TERRAIN`** — Romain tape ces noms directement dans l'Excel ("P1" à "P6"), avec le même risque de variation de format ("Prénom" seul, faute de frappe, casse différente) déjà rencontré et corrigé à répétition cette saison sur ce projet (colonne `Gardien`, notamment) | Élevée (pattern déjà matérialisé plusieurs fois sur des colonnes Excel manuelles similaires) | Moyen (poste affiché avec un nom non reconnu, ou statistiques scindées entre deux variantes du même joueur) | **P0** — toute résolution d'un nom `P1`-`P6` vers un joueur canonique doit passer par `matchPlayerName()` (`js/utils.js`), jamais une égalité stricte. Critère d'acceptation explicite à ajouter à la story |
| R2 | **Réimport avant migration SQL** — si Romain réimporte son Excel avec les nouvelles colonnes avant d'avoir exécuté le `ALTER TABLE` dans Supabase, l'insert échoue | Moyenne (dépend de l'ordre réel des actions de Romain, pas du code) | Faible (déjà catché par le `try/catch` existant autour de `replaceTable`, message d'erreur affiché, aucune corruption) | **P1** — préciser dans la story/le message d'erreur existant (ou un message dédié) qu'un échec sur les colonnes d'articulation suggère une migration SQL manquante, pour que Romain comprenne immédiatement quoi faire |
| R3 | **Combinaisons de charnière centrale basées sur un échantillon trop faible** — en tout début de vie de la feature (tagging manuel progressif), une "meilleure" combinaison pourrait reposer sur 1-2 séquences et induire Romain en erreur sur un choix tactique réel | Élevée au démarrage, décroît avec le temps | Moyen (décision tactique basée sur un signal statistiquement non fiable) | **P0** — le seuil minimum (5 séquences, cf. Architecture) doit être un vrai critère d'acceptation testé, pas une intention non vérifiée. Aucune combinaison sous le seuil ne doit apparaître dans le classement, même partiellement |
| R4 | **Postes partiellement renseignés** — une ligne pourrait avoir `ARTICULATION DEF` rempli mais un ou plusieurs `P1`-`P6` vides (saisie manuelle incomplète) | Moyenne (saisie manuelle par Romain, erreurs humaines possibles) | Faible (poste affiché "?" ou absent plutôt qu'un crash) si géré ; **élevé** si non géré (combo-key avec `undefined`, classement faussé silencieusement) | **P1** — toute ligne utilisée dans le classement de charnière centrale doit avoir les 4 postes P2-P5 non vides ; une ligne incomplète est exclue du calcul de combinaison (mais peut rester comptée pour les postes individuels renseignés) |
| R5 | **Régression sur les modes existants (Vue générale / Matrice 2×2)** en étendant `renderEncFamillesSection()` | Faible (le code existant initialise déjà `window._encGraphMode` à une valeur par défaut sûre, l'ajout d'un 3e mode ne touche pas la logique des deux premiers) | Moyen si ça arrivait (fonctionnalité déjà en production quotidienne) | **P2** — non-régression à vérifier explicitement en QA/E2E sur les 2 modes existants après l'ajout du 3e |
| R6 | **Performance de l'agrégation saison complète** | Faible (volume de données actuel : quelques centaines de lignes par saison) | Faible | Aucune action — non un risque réel à l'échelle actuelle des données du club |

## Synthèse P0/P1 → critères d'acceptation

- **R1 (P0)** : résolution des noms `P1`-`P6` exclusivement via `matchPlayerName()`.
- **R3 (P0)** : seuil de 5 séquences vérifié comme condition d'affichage dans le classement, pas seulement documenté.
- **R2 (P1)** : message d'erreur d'import clarifié si les colonnes d'articulation manquent côté Supabase.
- **R4 (P1)** : lignes avec postes P2-P5 incomplets explicitement exclues du calcul de combinaison.

## Ce qui n'est pas un risque ici

- **Sécurité/accès** : donnée de même nature que le reste de `match_data` (RLS déjà permissive, décision actée), aucune nouvelle surface d'exposition.
- **Connectivité/offline** : aucun changement du modèle de chargement (toujours `loadFromSupabase()` au boot).
- **Concurrence** : import mono-utilisateur, comme tout le reste du pipeline Excel.

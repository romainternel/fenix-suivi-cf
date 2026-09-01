# QA-17 — Écran d'édition des bilans (STORY-26)

**Agent :** QA
**Date :** 2026-09-01

---

## Critères d'acceptation testés

| # | Critère | Résultat |
|---|---|---|
| 1 | Entrée menu "📅 Bilans" | ✅ Positionnée après "Familles tactiques", avant "Migrer mes données locales" |
| 2 | Panneau slide-panel, liste Saison/Nom/Journée fin | ✅ Les 2 bilans réels affichés correctement |
| 3 | Formulaire 3 champs + suppression avec `confirm()` | ✅ Testé via le DOM réel |
| 4 | Écriture immédiate + effet sur le filtre Période | ✅ Testé bout en bout (cf. ci-dessous) |
| 5 | Mitigation R6 — erreur visible | ✅ Testé (échec réseau simulé) |

## Bug trouvé et vérifié corrigé — le point le plus important de cette QA

En testant le critère #4 avec des données réalistes, le bilan ajouté n'apparaissait **pas** dans le filtre "Période" malgré une écriture Supabase réussie. Investigation : `processBilans()` suppose les bilans déjà triés par journée de fin (vrai pour un import Excel, plus vrai pour un ajout via ce nouvel éditeur). Le Developer a corrigé en triant les données avant traitement, sans toucher à `processBilans()` elle-même.

**Re-testé après correction** :
- Bilans réels existants : Bilan 1 (J01-J09), Bilan 2 (J12-J18) [renumérotés pour le test avec un jeu de matchs simulé au format JXX]
- Ajout de "Bilan TEST" (fin J15, donc *avant* la fin de Bilan 2) → apparaît correctement en 2e position, Bilan 2 se recalcule automatiquement (J18→J18, une seule journée restante) — comportement mathématiquement correct, pas un bug résiduel
- Suppression de "Bilan TEST" → les 2 bilans d'origine réapparaissent exactement comme avant

## Cas limites testés

- Formulaire vide (ni nom ni journée) → message d'erreur clair, aucun appel réseau
- Échec réseau simulé → erreur affichée, pas de silence
- Échap → panneau fermé, focus rendu à "⚙ Outils"

## Non-régression sur les données réelles

Vérifié via l'API REST après chaque test : la table `bilan` contient exactement les 2 lignes d'origine (`Bilan 1`/J11, `Bilan 2`/J19) une fois les tests terminés — aucune donnée réelle laissée altérée.

## Bugs trouvés

Un (voir ci-dessus) — confirmé corrigé.

---

## Verdict : ✅ PASSED

# QA-16 — Écran d'édition des familles tactiques (STORY-25)

**Agent :** QA
**Date :** 2026-09-01

---

## Critères d'acceptation testés

| # | Critère | Résultat |
|---|---|---|
| 1 | Entrée menu "🏷️ Familles tactiques" à la bonne position | ✅ Comptes joueurs / Vue joueur / Familles tactiques / Migrer mes données locales |
| 2 | Panneau slide-panel avec overlay/Échap/focus trap | ✅ Échap ferme + rend le focus à "⚙ Outils" |
| 3 | Formulaire : texte + select fermé sur 8 familles | ✅ |
| 4 | Suppression avec `confirm()` | ✅ Testé via le bouton 🗑 réel |
| 5 | Écriture immédiate + `FAMILLE_MAPPING` + effet visible sans reload | ✅ Vérifié numériquement (déplacement de possessions entre cartes en temps réel) |
| 6 | Bandeau "configuration initiale" | ✅ Apparaît/disparaît correctement selon l'état réel de la table |
| 7 | Mitigation R6 — erreur visible | ✅ Testé (échec réseau simulé) |
| 8 | Modification reflétée sur la page Analyse sans réimport | ✅ |

## Scénario de test principal — non-régression fonctionnelle réelle

Plutôt que de tester avec des données factices sans effet visible, le QA a réassigné une **vraie** correspondance ("BLOC", utilisée dans les matchs de test réels) de "Jeu Pivot" vers "Isoler" :
- Avant : Jeu Pivot 9 possessions / Isoler 26 possessions (match "AMICAL FENIX-L'UNION")
- Après réassignation : Jeu Pivot 7 / Isoler 28 — écart exact de 2 possessions, cohérent avec les occurrences de "BLOC" dans ce match
- Après restauration (Jeu Pivot) : valeurs exactement identiques à l'état initial (9/26)
- Vérifié indépendamment via l'API REST après le test : `famille_mapping` contient exactement les 17 correspondances d'origine, y compris `BLOC → Jeu Pivot`

Ce test prouve que le rebranchement fonctionne réellement bout en bout (écriture Supabase → `FAMILLE_MAPPING` en mémoire → `getEncFamille()` → recalcul des stats → re-rendu des cartes), pas seulement que l'écran s'affiche.

## Cas limites testés

- Formulaire vide (aucune intention ni famille) → message d'erreur clair, aucun appel réseau déclenché.
- Échec réseau simulé sur l'ajout → erreur affichée, pas de silence.
- Bandeau "configuration initiale" : disparaît après une modification, réapparaît si l'état revient exactement aux 17 valeurs par défaut (pas un flag figé, réévalué à chaque ouverture).

## Bugs trouvés

Aucun.

---

## Verdict : ✅ PASSED

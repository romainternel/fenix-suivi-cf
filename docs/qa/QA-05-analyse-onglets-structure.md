# QA-05 — STORY-14 : Découpage Analyse en 5 onglets

**Agent :** QA
**Date :** 2026-08-28
**Méthode :** Test en navigateur réel (Playwright), données réelles (`ESSAI IA STAT.xlsm`, 2 matchs)

---

## Critères validés

| Critère | Statut | Preuve |
|---|---|---|
| 5 boutons d'onglet visibles sous le bloc terrain+cartes | ✅ | Capture : Résumé/Timeline/Enclenchements/Gardien/Chat IA, bloc terrain toujours au-dessus |
| Sections déplacées avec IDs intacts, rien perdu/dupliqué | ✅ | 12 IDs critiques vérifiés présents exactement 1 fois (revue Code Reviewer) |
| `updateAnalysePage()` inchangée dans sa logique (6 fonctions appelées à l'identique) | ✅ | Confirmé par lecture du diff — 0 ligne modifiée dans les fonctions de rendu |
| `_analyseTab()` bascule l'affichage, l'état actif, et `sessionStorage` | ✅ | Testé : clic sur chaque onglet → bon panneau affiché, bouton actif mis à jour |
| **R1 Canvas** — Timeline et Enclenchements corrects dès la première ouverture sur un match tout juste sélectionné | ✅ | Timeline : canvas redimensionné à 1105px (largeur réelle du panneau, pas le fallback 600px) dès la 1ère ouverture. Enclenchements : camembert affiché en pleine taille, non tronqué |
| **R3 Vue saison** — pas d'onglet vide affiché | ✅ | Testé la transition Saison complète → re-sélection d'un match : la barre d'onglets réapparaît avec un état valide (dernier onglet mémorisé restauré, jamais un onglet cassé) |
| **R4 Drill-down** — pas de détail obsolète après changement de match | ✅ | Ouvert le détail "Isoler" → changé de match onglet fermé → réouvert l'onglet → `window._encSelectedFamille` bien réinitialisé à `null`, panneau détail fermé |
| **R2 Non-régression globale** | ✅ | Dashboard, Joueurs (clic terrain + fiche gardien), Comptes, Vue joueur tous fonctionnels, 0 erreur JS |
| Mémorisation de l'onglet actif entre visites de la page | ✅ | Onglet "Chat IA" actif → navigation vers Joueurs → retour Analyse → toujours sur "Chat IA" |

**9/9 critères validés.**

## Cas limites testés
- Ouverture directe de l'onglet Timeline sur un match jamais visité auparavant (cas le plus à risque pour R1) : canvas correctement dimensionné dès le premier affichage, pas de redessin manuel nécessaire.
- Changement de match pendant que l'onglet Enclenchements a un drill-down ouvert (famille → niveau détail) : réinitialisation propre sans état résiduel.
- Aller-retour Saison complète ↔ match sélectionné : aucun état intermédiaire cassé.

## Régressions détectées
Aucune.

## Verdict global

**✅ PASSED**

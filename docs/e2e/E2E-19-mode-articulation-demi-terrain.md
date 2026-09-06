# E2E-19 — Mode "Articulation" : demi-terrain interactif par poste (STORY-34)

**Agent :** E2E Tester
**Date :** 2026-09-02
**Outil :** MCP Playwright, contre la production réelle (v258)

---

## Parcours testés

1. Connexion staff → Analyse → sélection d'un match réel (AMICAL FENIX-BILLERE) → onglet "Intention attaque" → mode Défense → mode Articulation
2. Vérification des 6 postes affichés avec noms canoniques résolus et efficacité adverse
3. Bascule 0-6 ↔ 1-5 (layouts différents)
4. Clic sur un poste occupé par plusieurs joueurs → panneau de détail
5. Passage en mode Attaque → bouton Articulation désactivé, retour automatique en Vue générale
6. Retour en Défense → Vue générale / Matrice 2×2 → non-régression confirmée
7. État vide (aucune donnée) testé directement en code
8. Résolution `matchPlayerName()` re-testée en production après correction du bug trouvé pendant le développement

## Résultat par parcours

| # | Parcours | Résultat |
|---|---|---|
| 1-2 | Affichage du demi-terrain avec données réelles | ✅ — capture d'écran conforme à la maquette |
| 3 | Bascule de dispositif | ✅ — layouts 0-6 et 1-5 tous deux corrects |
| 4 | Détail par poste multi-joueurs | ✅ |
| 5 | Désactivation en mode Attaque + reset auto | ✅ |
| 6 | Non-régression Vue générale/Matrice 2×2 | ✅ |
| 7 | État vide | ✅ |
| 8 | Résolution de nom en production | ✅ — `_resolveArticJoueur('Gabin')` → `'Gabin.S'` confirmé en conditions réelles |

0 erreur console dans tous les cas (hors l'erreur Supabase refresh-token déjà connue et documentée, sans lien).

## Écart avec le verdict QA/Code Review

Aucun.

## Verdict

**CONFIRMÉ** — la feature fonctionne de bout en bout en production, y compris après correction du bug de résolution de nom trouvé pendant le développement.

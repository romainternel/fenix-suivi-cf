# E2E-20 — Refonte lisibilité du mode Articulation (STORY-36)

**Agent :** E2E Tester
**Date :** 2026-09-06
**Outil :** MCP Playwright, contre un serveur statique local servant le code non encore déployé (v261) — non testable en production tant que le push n'a pas eu lieu

---

## Parcours testés (clics réels sur les éléments du DOM, pas d'appel direct aux fonctions JS)

1. Connexion staff (remplissage + clic réel sur "ACCÉDER") → Analyse (clic réel) → mode Défense (clic réel) → mode Articulation (clic réel)
2. Clic réel sur le bouton "1-5 (13 séq.)" du bandeau DISPOSITIF
3. Clic réel sur un rond-poste (P1) → apparition du panneau de détail
4. Sélection réelle d'un joueur (`Enzo.D`) dans le `<select>` du panneau de détail
5. Clic réel sur le lien "Réinitialiser" apparu dans le bandeau de contrôles
6. Clic réel sur "⚡ Attaque" → vérification de la désactivation/reset du mode Articulation

## Résultat par parcours

| # | Parcours | Résultat |
|---|---|---|
| 1 | Connexion → navigation → mode Articulation | ✅ — bandeau de contrôles rendu avec de vrais `<button>`, aucune erreur console |
| 2 | Bascule de dispositif par clic réel | ✅ — le terrain se redessine avec le layout 1-5 (P1/P2/P5/P6 sur la courbe 6m, P3/P4 hors ligne), capture conforme à la maquette |
| 3 | Clic réel sur un poste | ✅ — panneau "P1 — détail par joueur" apparaît sous les cartes d'indicateurs ; le poste cliqué affiche simultanément le liseré de couleur (`faible`, rouge) ET le halo de sélection (outline jaune) — confirme en conditions réelles le point d'attention R1 du Risk Analyst |
| 4 | Sélection manuelle réelle (`<select>`) | ✅ — le poste P1 affiche immédiatement "ENZO.D" avec le marqueur `✎`, le bandeau affiche "⚙ 1 poste modifié manuellement · Réinitialiser" |
| 5 | Clic réel sur "Réinitialiser" | ✅ — `window._articManualPoste` revient à `{}`, l'indicateur disparaît, aucune navigation parasite (le `href="#"` ne modifie pas `location.hash`, confirmé) |
| 6 | Bascule Attaque par clic réel | ✅ — `window._encGraphMode` repasse à `'pie'`, le bouton Articulation redevient `.artic-disabled` |

0 erreur console sur l'ensemble des parcours.

## Écart avec le verdict QA

Aucun — tous les parcours testés par clics réels confirment le verdict QA-22 (PASSED), y compris le point le plus délicat de la story (coexistence visuelle du liseré d'efficacité et du halo de sélection), vérifié ici avec un vrai clic utilisateur et non un appel de fonction.

## Verdict

**CONFIRMÉ** — la refonte fonctionne de bout en bout en conditions réelles de clic, sans écart avec ce que le QA avait validé.

# E2E-22 — Simplification du mode Articulation (flux unique) (STORY-38)

**Agent :** E2E Tester
**Date :** 2026-09-08
**Outil :** MCP Playwright, contre un serveur statique local servant le code non encore déployé (v268)

---

## Parcours testés (clics réels)

1. Connexion staff → Analyse → mode Défense (clic réel) → mode Articulation (clic réel)
2. Clic réel sur "À 2 (les deux centraux)" dans le bandeau LARGEUR
3. Clic réel sur une ligne du classement ("Idris.F / Issa.S")
4. Clic réel sur un rond (P1) → encart d'édition → clic réel sur "Roman.L (68)"
5. Clic réel sur "⚡ Attaque" → vérification désactivation

## Résultat par parcours

| # | Parcours | Résultat |
|---|---|---|
| 1 | Connexion → navigation → mode Articulation | ✅ — bandeau DISPOSITIF/LARGEUR avec de vrais boutons, 0 erreur console |
| 2 | Clic réel sur "À 2" | ✅ — classement recalculé, titre "CLASSEMENT — À 2 (LES DEUX CENTRAUX) (P3-P4)" |
| 3 | Clic réel sur une ligne du classement | ✅ — terrain mis à jour (P3=Idris.F, P4=Issa.S), ligne marquée active |
| 4 | Clic réel sur un rond puis sur un joueur de l'encart | ✅ — encart affiché avec fréquences réelles, clic sur "Roman.L (68)" ferme l'encart et place Roman.L sur P1, résumé et classement restent cohérents à l'écran simultanément |
| 5 | Clic réel sur "⚡ Attaque" | ✅ — bouton Articulation désactivé (`.artic-disabled`), mode repassé à `pie` |

0 erreur console sur l'ensemble des parcours.

## Écart avec le verdict QA

Aucun — tous les mécanismes clés (classement cliquable, encart d'édition sur rond, résumé sous le terrain) confirmés par de vrais clics utilisateur, pas seulement des appels de fonction.

## Verdict

**CONFIRMÉ** — la simplification fonctionne de bout en bout en conditions réelles de clic.

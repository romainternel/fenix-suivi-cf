# E2E-21 — Recentrage collectif du mode Articulation (STORY-37)

**Agent :** E2E Tester
**Date :** 2026-09-07
**Outil :** MCP Playwright, contre un serveur statique local servant le code non encore déployé (v263)

---

## Parcours testés (clics réels)

1. Connexion staff → Analyse → mode Défense (clic réel) → mode Articulation (clic réel)
2. Vérification de l'ordre d'affichage : les 4 cartes de charnières apparaissent avant le terrain
3. Clic réel sur "💡 Suggestion" (bouton renommé, ex-"🏆 Top Def")
4. Clic réel sur un rond-poste (P1) → panneau de détail

## Résultat par parcours

| # | Parcours | Résultat |
|---|---|---|
| 1 | Connexion → navigation → mode Articulation | ✅ — bandeau "DISPOSITIF"/"COMPOSITION" avec de vrais boutons, 0 erreur console |
| 2 | Hiérarchie visuelle | ✅ — "🛡️ Charnières défensives" + 4 cartes (Référence 52%, À6/À4 "aucune séquence", À2 63% vert) avant le terrain, conforme à la maquette |
| 3 | Clic réel sur "💡 Suggestion" | ✅ — bouton devient actif, composition du terrain change réellement (Roman.L, Lucas.G, Lukas.J, Marius.C, Julien.L, Antonin.V) |
| 4 | Clic réel sur un poste | ✅ — panneau de détail s'ouvre, halo de sélection jaune visible, AUCUN liseré de couleur sur aucun des 6 ronds (className confirmé `"artic-poste"` strict) |

0 erreur console sur l'ensemble des parcours.

## Écart avec le verdict QA

Aucun — le point le plus sensible de cette story (bascule réelle du sens du %, vérifiable par le calcul BLOC34 37%→63%) est confirmé visuellement par clic réel, pas seulement par un appel de fonction.

## Verdict

**CONFIRMÉ** — la refonte fonctionne de bout en bout en conditions réelles de clic.

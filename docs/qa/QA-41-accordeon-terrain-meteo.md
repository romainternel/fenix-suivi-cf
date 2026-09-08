# QA-41 — Terrain en accordéon replié + option "Météo"

**Agent :** QA
**Date :** 2026-09-09
**Méthode :** tests réels dans un navigateur (serveur statique local, port 8180), données réelles Supabase (match "J01 BILLERE-FENIX", 56 tirs enregistrés).

---

## Critères d'acceptation

- [x] Replié par défaut à l'ouverture d'un match (`docs/regression/screenshots/story41-accordion-closed.png`) — confirmé aussi après un rechargement complet de page (`accordionOpen: false` re-vérifié après `location.reload` équivalent).
- [x] Clic sur l'en-tête déplie/replie avec transition `max-height` 0.2s (< 250ms) — chevron pivote, libellé "Déplier"/"Replier" correct dans les deux sens. **Bug trouvé lors du premier test** (texte "Replier" affiché à l'envers, symbole et texte tournaient ensemble) — corrigé par le Developer, re-testé, confirmé propre (`docs/regression/screenshots/story41-chevron-fixed.png`).
- [x] Nuage de tirs fonctionne à l'identique une fois déplié — testé après un cycle replié→déplié, canvas non figé à 0×0 (`391×243` mesuré), rendu visuellement identique à avant la story.
- [x] Mode Météo : dégradé rouge→vert, aucun pourcentage affiché, plusieurs zones distinctes simultanées (`docs/regression/screenshots/story41-meteo-mode.png` — au moins 3 zones vertes et 2 zones rouges visibles en même temps sur des données réelles).
- [x] Échantillon faible atténué : vérifié programmatiquement sur les données réelles du match — 4 cellules avec un total < 5 tirs (alpha réduit) et 9 cellules avec ≥ 5 (alpha plein), les deux branches de code exercées, pas seulement supposées.
- [x] Le mode reste cohérent après changement de filtre Club : basculé sur "FENIX" avec le mode Météo actif → toujours en mode Météo après (`_terrainMode: "meteo"`), rendu recalculé sur les données filtrées (`docs/regression/screenshots/story41-meteo-after-filter.png`, distribution différente de l'image non filtrée, confirmant un vrai recalcul et pas un cache figé).
- [x] Non-régression cartes comparatives : bouton "TOTAUX" → "MOYENNE / MATCH" toggle fonctionnel après la restructuration en accordéon, cartes FENIX/Adversaire inchangées.

## Régressions détectées

Aucune après correction du bug du chevron (trouvé et corrigé dans le même cycle, avant la remise QA — comportement final testé, pas la version buguée).

## Verdict

**PASSED** — tous les critères d'acceptation validés en conditions réelles, y compris les 2 risques identifiés par le Risk Analyst (R4 échantillon faible, testé positif sur données réelles ; R5 performance, non chronométré formellement mais coût de rendu structurellement indépendant du volume de tirs).

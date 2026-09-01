# Code Review — STORY-29 (Décommissionnement de la page orpheline `page-gardiens`)

**Agent :** Code Reviewer
**Date :** 2026-09-01
**Diff :** `FENIX-HANDBALL-CF-SUIVI.html` — suppression de markup + 4 fonctions + 2 variables globales, nettoyage de 2 tableaux de filtres partagés, correction d'un bug réel du tooltip découvert au passage

---

## Recherche exhaustive plus large que celle de l'Architecture — bon réflexe

La liste de grep du document Architecture (`page-gardiens`, `updateGardiensPage`, `drawGardienCanvas`) était incomplète : elle ne capturait pas `updateGardienZoneUI()` (fonction non nommée d'après un des 3 motifs recherchés), ni les entrées `filter-gardien-match` dans 2 tableaux de rafraîchissement partagés (`matchFilters`/`matchSelects`), ni le bloc de peuplement du select `#filter-gardien`. Le Developer a élargi la recherche avant de conclure au nettoyage complet plutôt que de s'arrêter à la liste fournie — repéré empiriquement par grep répété après chaque passe de suppression, pas par relecture visuelle seule.

## Bug réel trouvé en marge, pas juste du nettoyage cosmétique

En retirant le bloc d'event listeners `goal-canvas-*`, le Developer a remarqué que le tooltip au survol des canvas de `page-impact` (`_showCanvasTooltip`, fonction réutilisée pour les deux cas depuis STORY-27) recevait `isGardien: false` **en dur** à l'appel, jamais recalculé selon le joueur réellement sélectionné. Conséquence concrète : survoler un but encaissé d'un gardien aurait affiché un marqueur vert "●" (positif) au lieu d'un rouge "✕" (négatif) — une inversion silencieuse, sans erreur console, du même genre que les bugs corrigés plus tôt dans la journée (comparaison de nom de gardien).

**Corrigé proprement** : nouvelle variable `_impactIsGB`, mise à jour dans `updateImpactPage()` (source de vérité déjà existante pour `isGB`), lue par le tooltip au lieu d'une constante. Testé explicitement dans les deux sens (survol d'un but encaissé de gardien → "✕" rouge confirmé ; survol d'un but marqué de joueur de champ → "●" vert confirmé, non-régression).

**Ce bug n'avait pas été détecté lors de STORY-27** — le QA/E2E de cette story avait vérifié les points sur le canvas (couleur correcte) mais pas le tooltip au survol, un chemin d'interaction distinct. Bon rappel que "les points s'affichent correctement" et "toutes les interactions sur ces points sont correctes" sont deux vérifications différentes.

## Suppression complète, pas de code mort résiduel

Vérifié par grep final (motif élargi à 13 termes) : seules 2 références survivent, toutes deux des commentaires historiques légitimes expliquant une décision passée — aucun code fonctionnel, aucune variable ou fonction orpheline.

## Non-régression

Testé : navigation entre les 3 pages principales, changement de saison, page Impact pour un joueur de champ et un gardien — 0 erreur console dans tous les cas. Le retrait de `case 'gardiens':` du switch `refreshPage()` ne casse pas les autres cas du même switch (vérifié par la navigation réelle, pas par lecture de code seule).

---

## Verdict : ✅ APPROUVÉ

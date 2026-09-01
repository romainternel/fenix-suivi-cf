# QA-18 — Page Impact pour un gardien (STORY-27 + STORY-28)

**Agent :** QA
**Date :** 2026-09-01

---

## Critères d'acceptation testés

| # | Critère | Résultat |
|---|---|---|
| 1 | Routage vers `page-impact` (plus `page-gardiens`) | ✅ |
| 2 | Source de données correcte (finalite+gardien vs resultat+joueur) | ✅ |
| 3 | 3 vues terrain peuplées pour un gardien | ✅ 6 points verts + 10 croix rouges (Gabin.S) |
| 4 | Libellés adaptatifs (stats + légende) | ✅ |
| 5 | Filtre Résultat fonctionnel pour un gardien | ✅ 6+10=16 exact |
| 6 | Nom + poste affiché | ✅ les 2 cas (joueur de champ, gardien, aucun filtre) |
| 7 | Mitigation R1 — pas de seuil trompeur | ✅ |
| 8 | Mitigation R2 — non-régression joueur de champ | ✅ |
| 9 | Mode mobile (STORY-28) | ✅ aucun écart, déjà correct |

## Scénario principal — cohérence croisée entre 4 sources indépendantes

Plutôt que de valider l'écran Impact isolément, le QA a vérifié la cohérence des chiffres de Gabin Saltel/Gougeon SALTEL sur 4 écrans distincts, tous alimentés par des chemins de code différents :
- Fiche joueur (page Joueurs → Fiche) : 6/16, 38% (référence, code déjà correct avant ce cycle)
- Table GB (page Notes, STORY-26/v246) : 6 arrêts, 15/40 pour les 2 autres gardiens
- Onglet Gardien de la page Analyse (v246) : 42% d'arrêts sur le match testé
- **Nouvel écran Impact (STORY-27)** : 6/16, 38%, badge violet (seuil GB respecté)

Les 4 s'accordent. Une divergence sur l'un d'eux aurait révélé un bug de correspondance de nom résiduel — aucune trouvée.

## Cas limites testés

- "Tous les joueurs" (aucun filtre) → libellé neutre, stats globales des joueurs de champ (comportement hérité, cohérent avec avant la story).
- Filtre Résultat sur un gardien : "Arrêt" seul (6 points) / "But encaissé" seul (10 points) — somme exacte, aucun chevauchement ni trou.
- Mode "🎨 Efficacité" activé pour un gardien : 7 cellules avec % affiché, 0 classe de couleur sémantique — confirmé neutralisé.
- Les 3 gardiens réels testés individuellement (Gabin.S, Noah.O, Enzo.D) — tous cohérents avec leurs fiches respectives.

## Bugs trouvés

Aucun.

---

## Verdict : ✅ PASSED

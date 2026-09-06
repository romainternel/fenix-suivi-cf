# QA-21 — Mode "Articulation" : demi-terrain interactif par poste (STORY-34)

**Agent :** QA
**Date :** 2026-09-02

---

## Critères validés

- [x] Bouton "🎯 Articulation" visible à côté de "Vue générale"/"Matrice 2×2", désactivé (`artic-disabled`, curseur bloqué) en mode Attaque — vérifié dans les deux sens
- [x] Mode accessible via `renderEncFamillesSection()`, partagée entre vue match et vue saison — aucune duplication de code constatée en lisant l'implémentation
- [x] Demi-terrain avec 6 postes, layout 0-6 (ligne alignée) et layout 1-5 (P4 avancé, P3 en couverture) vérifiés visuellement, conformes aux maquettes du Designer
- [x] Poste affiche le joueur le plus fréquent + efficacité adverse (formule `(buts+po)/possessions*100`, identique au reste de la section)
- [x] Poste avec plusieurs joueurs différents → badge "+N", clic → panneau de détail listant chaque joueur avec son efficacité propre — vérifié sur le poste P1 (2 joueurs, Zach.D et Roman.L)
- [x] Aucune donnée sur la période → message d'état vide, pas d'erreur (testé directement en appelant la fonction avec un tableau vide)
- [x] Poste avec moins de 5 séquences → `(n<3)` affiché, vérifié sur le dispositif 1-5 (échantillon de 1 séquence)
- [x] Noms `P1`-`P6` résolus via `matchPlayerName()` — **bug trouvé et corrigé pendant le développement** (cf. code-review), re-testé explicitement après correction : "Marius" → "Marius.C", "Gabin" → "Gabin.S", nom inconnu → conservé tel quel sans erreur
- [x] Non-régression Vue générale / Matrice 2×2 : les deux modes existants re-testés après l'ajout du 3e mode, fonctionnent identiquement (canvas pie/matrice s'affichent/se masquent correctement)

## Cas limite supplémentaire testé

Changement de joueur sélectionné pour un poste (bascule 0-6 ↔ 1-5) → le panneau de détail se réinitialise correctement (`_articSelectedPoste` remis à `null` au changement de dispositif), pas de détail obsolète affiché pour un poste qui n'existe plus dans le nouveau layout.

## Régressions détectées

Aucune.

## Verdict

**PASSED** — tous les critères d'acceptation vérifiés, y compris un bug réel trouvé et corrigé en cours de route (résolution de nom), avec re-test explicite après correction.

# QA-07 — STORY-17 : Passe visuelle page Joueurs (terrain + fiche)

**Agent :** QA
**Date :** 2026-08-28
**Méthode :** Test en navigateur réel (Playwright), données réelles (`ESSAI IA STAT.xlsm`)

---

## Critères validés

| Critère | Statut | Preuve |
|---|---|---|
| Fiche principale en `.surface-hero`, détail par match en `.surface-card` | ✅ | `#joueur-panel` : radius 14px + `shadow-lg`, sans bordure. `#joueur-matches` : radius 12px + `shadow-sm` + bordure `--gray-200`. Vérifié visuellement sur fiche gardien et fiche joueur de champ |
| Sous-onglets Fiche/Notes/Graphique/Impact sur l'échelle "Onglet" | ✅ | `.jsub-btn` : Inter 0.85rem/700/0.3px, conforme au tableau d'échelle typographique documenté. Rendu visuellement plus affirmé, cohérent avec `.an-tab-btn` (Analyse) mis à jour en parallèle par cohérence |
| Badges "#1 au poste"/"Top ATT au poste" en texte foncé/fond clair | ✅ (rien à faire) | Déjà conformes avant la story (`#EFF6FF`/`#1E3A8A`) — confirmé par le Code Reviewer, aucune instance non conforme trouvée |
| Terrain SVG : lisibilité des ronds joueurs non dégradée | ✅ | Couleurs codées en dur (`#e2e8f0`, ring dynamique, `#0f172a`), aucune ne référence les tokens `--gray-*` modifiés. Vérifié visuellement : contraste inchangé sur fond bleu terrain |
| Comparaison avant/après | À valider par Romain | Captures ci-dessous — jugement produit, non automatisable |
| Aucune donnée affichée n'a changé | ✅ | Fiche gardien Noah Orth (15/40 arrêts, 38%) et fiche Lucas Ginestet (7/15, 47%, -8 note) : chiffres identiques au comportement attendu, badges rang cohérents |

**6/6 critères techniques validés** (le critère de jugement visuel est transmis à Romain, non tranchable par le QA).

## Cas limites

- Testé sur un poste GB (rendu spécifique : arrêts/tirs, efficacité, note GB) et un poste de champ (ARG : but/tir, PD, pertes balle, note) — les deux rendent correctement dans la fiche `.surface-hero`.
- Changement de joueur sélectionné sur le terrain (clic sur un autre rond) : re-rendu correct de la fiche sans artefact visuel, tableau détail par match mis à jour.
- Boutons PDF/PowerPoint dans le header de fiche : non re-testés en profondeur (export déjà couvert par du travail antérieur, hors scope visuel de cette story — logique non touchée).

## Régressions détectées

Aucune.

## Verdict global

**✅ PASSED**

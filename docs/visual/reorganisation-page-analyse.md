# Visual — Réorganisation de la page Analyse

**Agent :** Visual Crafter
**Date :** 2026-09-08

---

## 1. Palette de tokens

Réemploi strict de l'existant (`--fenix-blue`, `--fenix-success`, `--fenix-danger`, `--shadow-*`) — ce cycle réorganise, il ne relance pas une identité visuelle.

| Usage | Token / valeur |
|---|---|
| Bloc Essentiel — fond | Dégradé très léger `linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)` — le distingue du fond blanc uni des autres sections sans être criard, signale "ceci est le point d'entrée" |
| Bloc Essentiel — bordure gauche | 4px pleine couleur selon résultat : `var(--fenix-success)` victoire, `var(--fenix-danger)` défaite, `#94A3B8` nul — reprend `.ia-diagnostic.victoire/defaite/nul` déjà en place, appliqué cette fois au conteneur entier pas juste au titre |
| Accordéon terrain — en-tête | `#F1F5F9`, texte `#475569`, chevron qui pivote 180° à l'ouverture |
| Onglets (Vue d'ensemble/Tactique/Notes & Outils) | Mêmes tokens que `.an-tab-btn` existant — pas de nouveau style de tab, seulement 3 au lieu de 5 |

## 2. Typographie

- Résultat dans Essentiel (VICTOIRE/DÉFAITE/NUL + score) : agrandi à `1.3rem` (vs le style actuel dans l'onglet, plus discret) — c'est maintenant le premier élément lu sur la page, il doit peser visuellement en conséquence.
- Les 3 points du résumé (icône + texte) : `0.9rem`, inchangé sinon — pas besoin de les grossir, l'emplacement fait déjà le travail de mise en avant.
- En-tête d'accordéon "🏟️ Terrain & Comparatif" : `0.85rem`, `600`, `#475569` — volontairement discret, cohérent avec son rôle de contenu secondaire replié.

## 3. Ombres & effets

- Bloc Essentiel : `box-shadow: var(--shadow-md)` — légèrement plus prononcée que les cartes standards (`shadow-sm`), pour asseoir son rôle de point d'entrée sans rivaliser avec un vrai modal.
- Accordéon fermé : pas d'ombre (plat, discret) ; au survol du chevron, `background: #E2E8F0` (léger retour visuel que c'est cliquable).
- Accordéon ouvert : `box-shadow: var(--shadow-sm)` sur le contenu déplié, cohérent avec le reste des sections.

## 4. États interactifs

| État | Traitement |
|---|---|
| Chevron accordéon (fermé → ouvert) | `transition: transform 0.2s ease`, rotation 0° → 180° |
| Contenu accordéon (ouverture) | `max-height` animée (0 → auto via une valeur fixe suffisante, pattern déjà utilisable en CSS pur) plutôt qu'un `display:none/block` sec — évite l'apparition brutale d'un bloc aussi visuellement lourd |
| Onglet actif (Vue d'ensemble/Tactique/Notes & Outils) | Inchangé (`.an-tab-btn.active`) |

## 5. Micro-animations

- Ouverture/fermeture de l'accordéon terrain : `0.2s ease` sur `max-height` + rotation du chevron en simultané — perceptible mais rapide, cohérent avec la règle du projet (<250ms).
- Aucune animation sur le bloc Essentiel lui-même (contenu statique au chargement, rien à transitionner).

## 6. Checklist contraste (WCAG AA)

| Paire | Ratio | Verdict |
|---|---|---|
| Texte `#0F172A` sur fond dégradé Essentiel (`#F8FAFC`→`#EFF6FF`) | > 12:1 aux deux extrémités | ✅ |
| En-tête accordéon `#475569` sur `#F1F5F9` | ~5.2:1 | ✅ |
| Bordure gauche résultat (victoire/défaite/nul) | Usage décoratif, pas de texte dessus | N/A |

## 7. Note de cohérence

Aucun nouveau motif visuel introduit — le bloc Essentiel réutilise la palette résultat déjà établie (`.ia-diagnostic`), l'accordéon suit le pattern déjà utilisé ailleurs dans l'app pour du contenu secondaire repliable (ex. panneau de séquences de la Timeline). L'objectif de ce cycle est la clarté de l'organisation, pas un nouveau langage visuel.

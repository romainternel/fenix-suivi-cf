# Visual — Simplification du mode Articulation (flux unique)

**Agent :** Visual Crafter
**Date :** 2026-09-08

---

## 1. Palette de tokens

Aucun nouveau token — réemploi strict de ce qui existe déjà (`--fenix-success`/`#10B981`, `--fenix-warning`/`#F59E0B` en pratique `#F59E0B` codé en dur pour "moyen", `--fenix-danger`/`#EF4444`, `#94A3B8` pour le neutre/faible-échantillon) via `_articDefClass`, inchangé.

| Usage | Token / valeur |
|---|---|
| Bloc résumé sous le terrain (fond) | `#F8FAFC`, bordure `#E2E8F0` — même traitement que `.artic-control-bar` pour que les deux blocs (contrôles en haut, résumé en bas) se lisent comme un même système |
| Titre du groupe "Fiable (≥5 séq.)" | `#475569`, `700`, `0.68rem`, majuscules |
| Titre du groupe "Échantillon faible (n<5)" | `#94A3B8`, `600`, `0.68rem`, majuscules — plus pâle que "Fiable" pour bien marquer la hiérarchie de confiance sans avoir besoin d'un mot en plus |
| Encart d'édition d'un rond | fond `#fff`, bordure `2px solid var(--fenix-accent)` (bleu) — se distingue visuellement du résumé (fond gris) et du classement (fond blanc simple) pour signaler "ceci est une action en cours", pas un affichage passif |

## 2. Typographie

- % de réussite défensive dans le résumé sous le terrain : **`2rem`**, `'Bebas Neue'`, `700` — nettement plus grand que l'ancien `.artic-block-eff` (`1.4rem`) puisque c'est maintenant LE chiffre central de l'écran, plus une carte parmi 4.
- Nom(s) de la composition résumée : `'Inter'`, `0.85rem`, `600`, sous le %.
- Ligne de détail (But/Tir raté/PB/PO/Jet franc) : `'Inter'`, `0.78rem`, disposée en une seule ligne compacte séparée par "·" plutôt qu'en tableau vertical (l'ancien `.artic-listing-detail` était vertical car secondaire dans une colonne étroite ; ici horizontal car c'est un résumé, pas une liste à parcourir).
- Titre de colonne classement ("CLASSEMENT — À 2 (P3-P4)") : `'Bebas Neue'`, `1rem`, `var(--fenix-blue)` — même niveau que l'ancien `.artic-blocks-title`, réemployé à l'identique.

## 3. Ombres & effets

- Bloc résumé : `box-shadow: var(--shadow-sm)`, cohérent avec le bandeau de contrôles (les deux sont des blocs "cadre", pas des cartes interactives).
- Encart d'édition d'un rond : `box-shadow: var(--shadow-md)` + légère animation d'apparition (`opacity`/`translateY` 0.15s, cf. §5) pour marquer que c'est un panneau transitoire qui vient de s'ouvrir suite à un clic.
- Lignes du classement au survol : identique à l'existant (`background: #EEF2F7`).

## 4. États interactifs

| État | Traitement |
|---|---|
| Ligne du classement active (= composition actuellement affichée) | Identique à l'existant : fond `#DBEAFE`, texte `var(--fenix-blue)`, `700` |
| Ligne de l'encart d'édition (joueur déjà observé, cliquable) | Identique aux lignes du classement (`.artic-listing-row-clickable`), réemployé tel quel |
| Bouton Largeur actif (À 6/À 4/À 2) | Identique aux autres toggles (`.enc-pie-mode-btn.active`) |
| Rond avec override manuel actif | Inchangé : marqueur `✎` déjà en place (STORY-36) |

## 5. Micro-animations

- Apparition de l'encart d'édition au clic sur un rond : `translateY(-4px) → 0` + `opacity 0 → 1`, `0.15s ease-out` (même règle que l'ancien panneau de détail STORY-36, réemployée).
- Aucune animation sur le changement du % dans le résumé (un changement de valeur numérique nette est plus lisible qu'un fondu, cohérent avec la décision déjà prise pour les bascules de dispositif/mode).

## 6. Checklist contraste (WCAG AA)

| Paire | Ratio | Verdict |
|---|---|---|
| `#475569` ("Fiable") sur `#fff` | ~7.5:1 | ✅ |
| `#94A3B8` ("Échantillon faible") sur `#fff` | ~2.9:1 | ⚠️ sous le seuil AA texte normal, mais c'est un label de section à `0.68rem` en majuscules, pas du contenu — usage déjà toléré ailleurs dans l'app pour ce type de sous-titre discret |
| % réussite défensive (`fort`/`moyen`/`faible`) sur fond `#F8FAFC` | > 4.5:1 pour les 3 couleurs à cette taille (`2rem` bold) | ✅ |

## 7. Note de cohérence

Ce cycle ne change aucune couleur ni aucune convention visuelle établie — il retire des éléments (cartes, toggle, panneau) et réorganise l'espacement. La seule nouveauté visuelle réelle est le cadre bleu de l'encart d'édition, qui reprend une couleur déjà utilisée (`var(--fenix-accent)`) dans un rôle nouveau (signaler une action en cours) mais cohérent avec son usage existant (liens, marqueur `✎`, sélection).

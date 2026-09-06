# Visual — Refonte lisibilité du mode Articulation

**Agent :** Visual Crafter
**Date :** 2026-09-06

---

## 1. Palette de tokens

Rien de nouveau à créer — réemploi strict des tokens existants (`:root`, `css/style.css:12-25`) pour rester cohérent avec le reste de l'app :

| Usage | Token / valeur |
|---|---|
| Fond du bandeau de contrôles | `#F8FAFC` (déjà utilisé pour `.artic-detail-panel`, `.artic-block-card`) |
| Bordure du bandeau de contrôles | `1px solid #E2E8F0` |
| Liseré "fort" (adversaire inefficace = bonne défense) | `#10B981` (= `--fenix-success`) |
| Liseré "moyen" | `#F59E0B` |
| Liseré "faible" (adversaire efficace) | `#EF4444` (= `--fenix-danger`) |
| Liseré "noref" / pas de donnée | `#CBD5E1` (gris neutre, plus clair que le texte `#94A3B8` déjà utilisé pour ne pas se confondre avec un vrai signal) |
| Fond des ronds-poste | `#fff`, bordure de base `var(--fenix-blue)` — inchangé |
| Bouton "Réinitialiser" | texte `var(--fenix-accent)` (#3B82F6), pas de fond, soulignement au survol |

## 2. Typographie

- Labels du bandeau ("DISPOSITIF", "AFFICHAGE") : `'Inter', sans-serif`, `0.68rem`, `700`, `letter-spacing: 0.5px`, `color: #64748B` — même traitement que `.artic-block-label` déjà en place, pour que le bandeau et les cartes d'indicateurs se lisent comme un seul système.
- Nom de joueur dans le rond : `'Bebas Neue', sans-serif`, passe de `0.62rem` à `0.72rem` puisqu'il n'y a plus de 3e ligne à caser dans les 56px — un nom plus grand devient l'élément dominant du rond, cohérent avec l'objectif "lire le nom d'un coup d'œil".
- Indicateur "N poste(s) modifié(s)" : `'Inter', sans-serif`, `0.72rem`, `500`, couleur `#64748B`, icône `⚙` en `0.8rem`.

## 3. Ombres & effets

- `.artic-control-bar` : `box-shadow: var(--shadow-sm)` (légère, pour la détacher du fond de page sans rivaliser avec `.artic-court` qui garde `var(--shadow-lg)`, plus prononcée puisque c'est l'élément central).
- Liseré des ronds : implémenté en `box-shadow: 0 0 0 3px <couleur>` plutôt qu'un `border` supplémentaire, pour ne pas décaler la taille du cercle (le `border: 3px solid var(--fenix-blue)` existant reste la bordure structurelle, le liseré de couleur vient en halo autour).
- Transition sur le changement de liseré (nouveau joueur affiché après sélection manuelle ou bascule Top Def) : `transition: box-shadow 0.15s ease` — déjà le pattern utilisé sur `.artic-poste:hover`.

## 4. États interactifs

| État | Traitement |
|---|---|
| Toggle dispositif/mode actif | Inchangé (`.enc-pie-mode-btn.active`, déjà premium — fond plein `var(--fenix-blue)` ou couleur d'accent selon le groupe) |
| Hover sur un rond-poste | Inchangé (`scale(1.08)` + `shadow-lg`) |
| Rond avec override manuel actif | Ajout d'un petit indicateur `✎` en haut à gauche du rond (10px, `color: var(--fenix-accent)`), en plus du compteur dans le bandeau — donne un repère visuel direct sur LE poste concerné, pas seulement un total abstrait dans le bandeau |
| Bouton "Réinitialiser" hover | `text-decoration: underline`, `color` inchangé — pas de fond, reste discret car action secondaire |
| Carte d'indicateur (Référence/Bloc) au survol | Léger `translateY(-2px)` + `box-shadow: var(--shadow-md)`, `transition: transform 0.15s ease, box-shadow 0.15s ease` — signale que ce n'est pas qu'un affichage statique sans pour autant être cliquable (cohérence avec le survol déjà présent sur `.surface-card`) |

## 5. Micro-animations

- Apparition du panneau de détail au clic sur un poste : `animation: articSlideIn 0.18s ease-out` (translateY(-4px)→0 + opacity 0→1), pour marquer que c'est une action de l'utilisateur qui vient de produire ce contenu, sans être un gadget (< 250ms, cohérent avec la règle du projet).
- Apparition/disparition de la ligne "⚙ N poste(s) modifié(s)" dans le bandeau : `transition: opacity 0.15s ease` plutôt qu'un `display` binaire brutal, pour éviter un à-coup visuel à chaque clic de sélection manuelle.
- Changement de dispositif ou de mode : pas d'animation de transition entre les deux layouts (0-6 ↔ 1-5 ou Le+utilisé ↔ Top Def) — un fondu ferait perdre en clarté sur "qu'est-ce qui vient de changer", le changement direct reste le plus lisible ici.

## 6. Checklist contraste (WCAG AA)

| Paire | Ratio approx. | Verdict |
|---|---|---|
| `#64748B` (label bandeau) sur `#F8FAFC` | ~4.6:1 | ✅ AA texte normal |
| `#10B981` (liseré fort) sur `#fff` (fond du rond) | usage décoratif (halo), pas de texte dessus | N/A — pas de contrainte de contraste texte |
| `var(--fenix-accent)` (#3B82F6) sur `#fff` (bouton Réinitialiser) | ~3.7:1 | ⚠️ limite pour un texte `0.72rem` — passer le poids à `600` (au lieu de `400/500`) pour compenser, déjà la pratique ailleurs dans l'app pour les liens de cette couleur |
| Nom de joueur (`var(--fenix-dark)`, #0F172A) sur `#fff` | > 15:1 | ✅ largement au-dessus du seuil |

## 7. Note de cohérence

Aucun nouveau motif visuel n'est introduit (pas de glassmorphism, pas de gradient supplémentaire) — l'objectif de ce cycle est la clarté de l'information, pas un nouveau langage visuel. Le seul ajout réellement nouveau est le liseré coloré des ronds (halo `box-shadow`), qui remplace un texte par une couleur porteuse de sens — cohérent avec le principe déjà établi ailleurs dans l'app que la couleur n'est jamais décorative (cf. `_articEffClass`, `getEffColor()`).

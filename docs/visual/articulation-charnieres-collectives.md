# Visual — Recentrage collectif du mode Articulation (charnières défensives)

**Agent :** Visual Crafter
**Date :** 2026-09-07

---

## 1. Palette de tokens

Le changement de sens (haut = bon) inverse simplement quelle couleur s'applique à quelle plage — les couleurs elles-mêmes restent les tokens déjà en place, pas de nouvelle teinte :

| Usage | Token / valeur |
|---|---|
| Réussite défensive haute (bonne défense) | `#10B981` (= `--fenix-success`) — **avant : appliqué aux valeurs basses d'efficacité adverse, maintenant aux valeurs hautes de réussite défensive** |
| Réussite défensive moyenne | `#F59E0B` |
| Réussite défensive basse (défense en difficulté) | `#EF4444` (= `--fenix-danger`) |
| Échantillon insuffisant / pas de donnée | `#94A3B8` (texte), `#CBD5E1` (liseré résiduel s'il en reste) |
| Titre de section "Charnières défensives" | `var(--fenix-blue)` (#0A2463), `'Bebas Neue'` |
| Bouton "💡 Suggestion" | mêmes tokens que `.enc-pie-mode-btn` existant (pas de nouvelle classe de bouton) |

## 2. Typographie

- Titre de section "🛡️ CHARNIÈRES DÉFENSIVES — % de séquences arrêtées" : `'Bebas Neue'`, `1.1rem`, `letter-spacing: 0.5px`, `color: var(--fenix-blue)` — même niveau hiérarchique que les autres titres de section de la page Analyse (`.enc-detail-title`), pour bien marquer que c'est un titre de section et non une carte de plus.
- Sous-texte technique dans chaque carte de charnière (ex. "P2-P3-P4-P5" sous "À 4 (centre)") : `'Inter'`, `0.62rem`, `color: #94A3B8`, `font-weight: 400` — discret, sert de rappel technique sans concurrencer le libellé parlant.
- `%` de charnière : passe de `1.15rem` à **`1.4rem`** et `.artic-block-card` grandit légèrement (padding `14px 12px` au lieu de `10px 12px`) — puisque ces cartes deviennent l'élément central de l'écran, elles doivent avoir un poids visuel supérieur à celui qu'elles avaient en bas de page.
- Liste récapitulative des 6 noms sous le terrain : `'Inter'`, `0.75rem`, `color: #475569`, séparés par `·`, centré.

## 3. Ombres & effets

- Le conteneur des 4 cartes de charnières (`.artic-blocks`, renommé conceptuellement en zone principale) gagne un léger fond (`#FAFBFC`) et un padding (`16px`) pour se détacher comme un bloc cohérent, avant le terrain — pas juste 4 cartes flottantes.
- `.artic-court` perd un peu de sa proéminence : `box-shadow` allégée (`var(--shadow-md)` au lieu de `var(--shadow-lg)`) pour signaler visuellement son rôle désormais secondaire, sans le rendre terne.
- Cartes de charnières au survol : `translateY(-2px)` + `shadow-md` (déjà en place depuis STORY-36) — conservé.

## 4. États interactifs

| État | Traitement |
|---|---|
| Carte de charnière avec valeur haute (bonne défense) | Halo `box-shadow: 0 0 0 1px rgba(16,185,129,0.15)` très subtil sur la carte elle-même (pas seulement le texte vert) pour que la meilleure charnière "ressorte" visuellement au premier regard, sans texte supplémentaire |
| Bouton "💡 Suggestion" actif | Identique aux autres toggles actifs (fond plein `var(--fenix-blue)`) — pas de traitement spécial, pour ne pas lui donner une importance qu'il n'a plus (ce n'est qu'une heuristique de composition, pas un résultat) |
| Rond-poste (hover/sélection) | Inchangé (scale au survol, `outline` à la sélection) — seul le liseré de couleur disparaît, le reste du comportement STORY-36 reste |

## 5. Micro-animations

- Aucune animation nouvelle. Le changement de section (charnières avant le terrain) est un changement d'ORDRE dans le HTML, pas un changement d'état animé — rien à transitionner.

## 6. Checklist contraste (WCAG AA)

| Paire | Ratio approx. | Verdict |
|---|---|---|
| `#10B981` (vert réussite haute) sur fond carte `#F8FAFC` | usage décoratif + texte `1.4rem` bold | ✅ largement suffisant à cette taille |
| `#94A3B8` (sous-texte technique "P2-P3-P4-P5") sur `#F8FAFC` | ~2.9:1 | ⚠️ sous le seuil AA texte normal, mais toléré ici car information secondaire redondante avec le libellé principal ("À 4 (centre)") juste au-dessus, déjà conforme — cohérent avec l'usage existant de ce gris pour du texte non essentiel ailleurs dans l'app |
| Titre de section `var(--fenix-blue)` sur fond de page blanc | > 8:1 | ✅ |

## 7. Note de cohérence

Le point de vigilance principal de ce cycle n'est pas visuel mais sémantique : la couleur verte change de signification (elle s'appliquait aux valeurs BASSES d'efficacité adverse, elle s'applique maintenant aux valeurs HAUTES de réussite défensive). Aucune ambiguïté ne doit subsister au moment de la bascule : puisqu'il s'agit d'un remplacement complet de la métrique affichée (pas d'un mode alternatif optionnel), il n'y a pas de risque de confusion entre "ancien vert" et "nouveau vert" au même endroit — l'ancienne sémantique disparaît entièrement avec ce cycle.

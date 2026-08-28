# Code Review — STORY-17 (Passe visuelle : page Joueurs — terrain + fiche)

**Agent :** Code Reviewer
**Date :** 2026-08-28
**Diff :** `css/style.css` (+8/-4 lignes) + `FENIX-HANDBALL-CF-SUIVI.html` (cache-busting `?v=234→235`, 7 occurrences). Aucun JS touché.

---

## Conformité Design/Visual

- `.joueur-panel` (fiche principale, `#joueur-panel`) passée en élévation "hero" (`border:none; border-radius:14px; box-shadow:var(--shadow-lg)`), conforme à la règle "Niveau 2 : carte proéminente (... fiche joueur)" documentée dans le commentaire d'élévation en tête de `style.css`.
- `#joueur-matches` (détail par match) passé en élévation "card standard" (`border:1px solid var(--gray-200); border-radius:12px; box-shadow:var(--shadow-sm)`), cohérent avec le critère "détail par match en card standard" de la story et avec le traitement déjà appliqué à `#players-section` en STORY-15.
- Comme en STORY-15, le Developer a repris les valeurs de `.surface-card`/`.surface-hero` directement dans les règles existantes plutôt que d'ajouter littéralement la classe dans le HTML — cohérent avec le précédent déjà validé (évite un conflit de spécificité avec les règles bespoke `.joueur-panel`/`#joueur-matches`). Écart mineur mais justifié, même pattern que STORY-15.
- `.jsub-btn` (sous-onglets Fiche/Notes/Graphique/Impact) alignés sur l'échelle typographique "Onglet" documentée (`Inter, 0.85rem, 700, letter-spacing 0.3px`) — était à `0.78rem/600/normal`.

## Point de discipline notable

- **Dépendance croisée avec STORY-16 anticipée correctement.** La story demande "même échelle 'Onglet' que STORY-16", mais STORY-16 n'a pas encore été exécutée dans la séquence (elle dépend de STORY-13+14, contrairement à STORY-17 qui ne dépend que de STORY-13). Plutôt que d'attendre ou d'improviser une valeur arbitraire, le Developer a consommé directement la valeur "Onglet" déjà figée dans le commentaire d'échelle typographique de STORY-13 (`docs/visual/navigation-refonte.md §2`, indépendante de l'ordre d'exécution des stories) et l'a appliquée aux **deux** composants d'onglets de l'appli : `.jsub-btn` (cette story) et `.an-tab-btn` (créé en STORY-14, dont le raffinement visuel est le sujet même de STORY-16 — mis à `0.82rem/600` par intérim). Résultat : cohérence transverse réelle dès maintenant, et STORY-16 trouvera `.an-tab-btn` déjà à sa valeur finale sur ce point (rien à défaire). Décision pragmatique et bien documentée plutôt qu'un blocage inutile.
- Badges "#1 au poste" / "⚡ Top ATT au poste" / etc. (`js/page-joueurs.js` L219-222) : vérifiés — déjà au format texte foncé sur fond clair (`#EFF6FF`/`#1E3A8A`), conforme au pattern WCAG. Rien à corriger, documenté plutôt qu'un correctif inventé (même discipline qu'en STORY-15).
- Terrain SVG (`renderCourtPlayers()`, `js/page-joueurs.js` L46-94) : vérifié — couleurs des ronds joueurs (`#e2e8f0`, `ringClr` dynamique, texte `#0f172a`) toutes en hexadécimal codé en dur, aucune ne référence les nouveaux tokens `--gray-*`. Le nouveau système d'élévation ne touche que des conteneurs (`.joueur-panel`, `#joueur-matches`), pas le SVG. Vérification triviale mais correctement effectuée plutôt que supposée.
- Export PDF/PPT (`buildR()`, badges `pptBadges` L1267-1290) : identifié comme hors scope (document exporté, pas la page HTML elle-même) — non touché, à raison.

## Scope

- Deux fichiers CSS/HTML touchés (dont un seul en cache-busting), aucune donnée ni logique JS modifiée. Conforme au "Hors scope : toute autre page / logique de positionnement".

## Non-régression

- Testé en navigateur réel (import réel `ESSAI IA STAT.xlsm`) : fiche gardien (Noah Orth) et fiche joueur de champ (Lucas Ginestet) toutes deux affichées correctement, badges visibles, tableau détail par match intact, données identiques à avant la story. 0 erreur console.

## Sécurité basique

Non applicable (CSS pur).

---

## Verdict : ✅ APPROUVÉ

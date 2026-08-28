# Code Review — STORY-16 (Passe visuelle : page Analyse — bloc match + 5 onglets)

**Agent :** Code Reviewer
**Date :** 2026-08-28
**Diff :** `css/style.css` uniquement (+~25/-10 lignes). Aucun JS touché.

---

## Conformité Design/Visual

- `#match-block-section` (bloc terrain+cartes FENIX/ADVERSAIRE) : passé en élévation "hero" (`border-radius:14px; box-shadow:var(--shadow-lg)`), ciblé par ID plutôt que via `.section` (partagée par 6+ blocs sur d'autres pages) — même discipline que `#players-section`/`#joueur-matches` en STORY-15/17.
- `.analyse-section` et `.analyse-card` (les 7 cartes des 5 onglets : Résumé/Coach, Indicateurs, Timeline, Moments clés, Bascules, Enclenchements, Gardien, Chat) : recette `.surface-card` appliquée (bordure `--gray-200`, `shadow-sm`, radius 12px). Ces deux classes sont exclusives à `#page-analyse` (vérifié : aucun usage ailleurs dans le HTML, aucune injection dynamique dans `page-analyse.js`), donc zéro risque de fuite vers une autre page.
- `.an-tab-btn:focus-visible` ajouté (`outline 2px var(--fenix-accent)`, offset 2px), conforme à Visual §4 ("Onglet Analyse : focus → outline 2px --fenix-accent"). Absent auparavant.
- Cards familles enclenchement (`.enc-card-mini`) : **consolidation typographique de ~7 tailles distinctes à 3**, conformément au critère "jamais plus de 3 niveaux simultanés" :
  - Valeur clé (`.enc-famille-eff`, 1.55rem Bebas Neue, déjà dans la fourchette documentée 1.3-1.8rem, non touché)
  - Corps (`.enc-stat-main-val` ramené de 1.05rem à 0.82rem pour s'aligner sur `.enc-stat-sec-val` déjà à 0.82rem — hiérarchie visuelle conservée par le poids/la couleur, pas par la taille)
  - Micro (`.enc-famille-sublabel`, `.enc-stat-pair-label`, `.enc-footnote`, `.enc-badge-mini` unifiés à 0.7rem, alignés sur `.enc-famille-name` déjà à 0.7rem plutôt que sur la valeur médiane documentée 0.68rem — réutilise une taille déjà présente dans le même fichier plutôt que d'en introduire une 4e)
  - Un commentaire CSS documente explicitement le mapping pour les prochaines stories.

## Points de discipline notables

- **Vérifié que `.enc-famille-card` (la classe "large", radius 8px/eff 2rem) est du CSS mort** — recherché dans `page-analyse.js`, aucune occurrence dans le HTML généré. Seule `.enc-card-mini` est réellement utilisée dans la grille de cards. Le Developer ne l'a pas touchée (hors scope, pas de risque à la laisser) plutôt que de "nettoyer" du code non lié à la story.
- **Badges "⚡ FAIBLESSE ADV"/"⭐ FORCE" (`.enc-badge-mini`) : déjà conformes au pattern texte foncé/fond clair avant la story** — vérifié en lisant le CSS existant (`#FEF3C7`/`#92400E`, `#D1FAE5`/`#065F46`) puis confirmé visuellement en injectant temporairement les deux badges dans le DOM (aucune occurrence naturelle dans le jeu de données de test) plutôt que de suppose la conformité sans preuve visuelle.
- **A recherché au-delà des deux exemples cités par la story** un éventuel badge rouge/vert plein non conforme ailleurs sur la page (recherche `color:#fff` combinée à des fonds rouge/vert dans `page-analyse.js`) : trouvé un seul cas borderline (tag d'équipe FNX/ADV dans le tableau "Moments clés", `#dc2626`+blanc ≈ 4.5:1, à la limite AA) mais l'a délibérément laissé — ce n'est pas un badge de jugement (succès/échec) mais une étiquette d'identité d'équipe, cohérente avec le pattern navy/rouge déjà établi ailleurs (`.match-team-card`), et le contraste passe. Documenté plutôt que corrigé sans spécification claire — bon appel pour éviter d'inventer une redesign non demandée.
- **Vérification empirique du drill-down après la passe CSS** : a cliqué une vraie card (Rentrée, vue Matrice 2×2) et confirmé que `#enc-detail-wrap` s'ouvre et affiche le tableau détaillé par intention d'attaque sans régression, pas seulement supposé que "pas de JS touché = pas de risque".
- **Non-régression mobile vérifiée activement**, pas seulement invoquée par argument structurel : canvas Impact (zone CENTRAL pleine largeur), header sticky Stats Match après scroll, testés en conditions réelles à 375px via un vrai parcours "Vue joueur" — alors que STORY-16 ne touche que des sélecteurs CSS `#page-analyse`/`.enc-*` sans aucun recoupement avec `.pmf-*`/`.pm-*`. Diligence cohérente avec le fait que ces correctifs mobiles sont explicitement nommés par la story comme sensibles.
- Canvas (timeline, camembert, matrice) : aucune fonction de dessin (`drawTimeline`, `_drawEncPie`, `_drawEncChart`) touchée — confirmé par le diff (`js/page-analyse.js` non modifié) et par test visuel (camembert/matrice rendus identiques).

## Scope

- Un seul fichier touché (CSS), aucune donnée ni logique modifiée. Conforme au "Hors scope : structure des onglets (STORY-14), toute autre page".

## Non-régression

- Testé en conditions réelles (login + import réels) : Résumé, Enclenchements (Vue générale + Matrice 2×2, Attaque + Défense, drill-down), Gardien (état vide), état vide global "Importe un fichier Excel..." (données effacées) — tous conformes, 0 erreur console.

## Sécurité basique

Non applicable (CSS pur).

---

## Verdict : ✅ APPROUVÉ

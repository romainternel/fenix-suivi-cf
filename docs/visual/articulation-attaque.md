# Visual — Articulation offensive (mode "Articulation" côté Attaque)

**Agent :** Visual Crafter
**Date :** 2026-09-15

---

## Constat de départ

Le Design (§1, §8) engage une réutilisation totale des classes CSS existantes (`.artic-control-bar`, `.artic-poste`, `.artic-poste-editor`, `.artic-summary`, `.artic-listing-col`, `.enc-pie-mode-btn`, la palette fort/moyen/faible déjà en place). Il n'y a donc **aucune nouvelle classe visuelle à créer** pour la structure du panneau — le travail de polish porte uniquement sur les deux points que le Design laisse ouverts : la disposition à deux profondeurs des postes, et la distinction de lecture entre les deux panneaux miroirs.

## 1. Disposition à deux profondeurs — le seul vrai geste visuel nouveau

Le fait que PVT/ALG/ALD se regroupent visuellement près du but pendant qu'ARG/DC/ARD s'alignent sur l'arc extérieur des 9m (déjà tracé en pointillés sur le terrain) n'est pas qu'une contrainte de fidélité tactique — c'est ce qui rend le panneau lisible d'un coup d'œil sans légende. Aucun habillage supplémentaire n'est nécessaire pour l'appuyer : l'arc en pointillés existe déjà dans `_articCourtSvg()`, il suffit que les postes ARG/DC/ARD se posent exactement dessus (précision laissée à l'Architecte) pour que l'œil associe naturellement "ces trois-là sont sur la ligne arrière".

## 2. Distinguer les deux panneaux miroirs sans dupliquer la palette

Les deux panneaux (attaque/défense) se ressemblent délibérément — c'est le principe même de la demande de Romain. Le seul risque visuel est qu'il ne sache plus, d'un coup d'œil, lequel il regarde. Deux signaux suffisent, tous deux déjà au vocabulaire de l'app, sans rien inventer :
- Le libellé du résumé (`.artic-summary-eff-label`) : "**de réussite offensive**" vs "**de réussite défensive**" — le mot suffit, pas de changement de couleur de fond ni d'icône supplémentaire.
- L'icône déjà utilisée au-dessus de la section (⚡ Attaque / 🛡 Défense, `.enc-team-toggle`, existant, inchangé) reste le repère visuel principal — il est déjà là et déjà appris par Romain, pas besoin d'en dupliquer un second.

Décision : **ne pas** teinter différemment le panneau attaque (ex. bleu vs rouge) — ce serait une distinction en plus à apprendre pour un gain de lisibilité marginal, alors que le toggle ⚡/🛡 déjà présent au-dessus de la section fait déjà ce travail.

## 3. Palette fort/moyen/faible — sens de lecture, pas nouvelles couleurs

Les trois couleurs (vert/orange/rouge) et leurs classes CSS existent déjà (`.fort`/`.moyen`/`.faible` du composant `.artic-summary-eff`/`.artic-listing-eff`). Côté attaque, elles s'appliquent directement au pourcentage affiché (haut = vert = bon), sans le miroir `100 - x` que la défense doit faire pour que "vert" garde le sens "bonne défense" — l'Architecte doit donc écrire une fonction de classement dédiée (seuils identiques, sens de comparaison direct), jamais réutiliser telle quelle la fonction de classement défensive sur un nombre offensif (elle inverserait le sens des couleurs).

## 4. Ce qui reste strictement inchangé

Typographie, espacements, ombres, tokens de couleur de fond des ronds de poste, style du badge "+N", style de l'icône ✎, style du panneau d'édition, style des lignes de classement cliquables — tout est repris à l'identique de l'existant. Aucune nouvelle variable CSS à introduire dans `css/style.css`.

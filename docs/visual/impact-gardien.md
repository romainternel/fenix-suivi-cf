# Visuel — Page Impact pour un gardien

**Agent :** Visual Crafter
**Date :** 2026-09-01

---

## Principe général

Aucun nouveau token, aucun nouvel effet — cette correction n'introduit qu'un seul élément visuel réellement nouveau (le sous-titre nom du joueur, F2) ; tout le reste (F1) ne change que des libellés texte dans une structure déjà existante. Un correctif de bug avec ajout mineur d'UX ne justifie pas un nouveau vocabulaire visuel.

## 1. Sous-titre nom du joueur (F2) — seul élément réellement nouveau

- Position : directement sous `<h2 class="section-title">🎯 Impact au Shoot</h2>`, avant le bloc filtres/stats — même emplacement que le pattern déjà en place pour le sous-titre de `_subHdr` dans l'export PDF (`js/page-joueurs.js`, "Nom · Période").
- Typographie : `font-family: 'Inter', sans-serif; font-size: 0.85rem; margin-top: 2px; margin-bottom: 0.6rem;`
  - Nom : `font-weight: 700; color: var(--gray-900, #0F172A);`
  - Poste (séparé par ` — `) : `font-weight: 400; color: var(--gray-600, #64748B);`
- État "Tous les joueurs" (aucun filtre) : texte entier en `color: var(--gray-400, #94A3B8); font-weight: 500;` — visuellement plus discret qu'un nom réel, signale "vue d'ensemble" sans avoir besoin d'un mot en plus.
- Pas d'animation d'apparition/disparition nécessaire — le texte change de façon synchrone avec la mise à jour des stats (`updateImpactPage()`), déjà instantanée pour le reste de l'écran.

## 2. Libellés adaptatifs (F1) — aucun changement visuel, seulement textuel

Les 3 cartes de stats (`impact-buts`/`impact-total`/`impact-eff`) et leurs libellés gardent exactement leur CSS actuel (`font-size: 1.5rem; font-weight: 800; color: #1e293b;` pour les valeurs, `font-size: 0.68rem; text-transform: uppercase; font-weight: 600; letter-spacing: .04em; color: #64748b;` pour les labels) — seul le **texte** du libellé change selon `isGB` (`ARRÊTS` au lieu de `BUTS`, `TIRS SUBIS` au lieu de `TIRS`). Zéro nouveau style.

La légende sous les 3 vues terrain (point vert / croix rouge) garde ses couleurs sémantiques actuelles (`#10B981` positif, `#EF4444` négatif) — seul le texte associé change de sens (Arrêt/But encaissé au lieu de But/Tir raté), pas la couleur elle-même (cohérent : vert reste "bon résultat pour FENIX" dans les deux cas, ce qui est déjà le sens réel — un arrêt est un bon résultat comme un but).

## 3. États interactifs

Aucun nouveau composant interactif introduit — les filtres, boutons `.btn-comparer`, cellules `.zr-cell` gardent tous leurs états hover/focus/active déjà définis dans le CSS existant, non modifiés par ce cycle.

## 4. Checklist contraste WCAG

| Élément | Couleurs | Ratio | Statut |
|---|---|---|---|
| Nom du joueur (sous-titre) | `#0F172A` sur blanc | 17.5:1 | ✅ AAA |
| Poste (sous-titre) | `#64748B` sur blanc | 4.6:1 | ✅ AA |
| État "Tous les joueurs" | `#94A3B8` sur blanc | 2.6:1 (texte non porteur d'information critique seul — contexte donné par les stats à 0/vides juste en dessous) | ✅ (décoratif/contextuel, pas un seul point de lecture obligatoire) |

Aucune nouvelle vérification nécessaire pour les libellés de stats/légende — couleurs déjà validées lors des passes visuelles précédentes (STORY-16/17), seul le texte change.

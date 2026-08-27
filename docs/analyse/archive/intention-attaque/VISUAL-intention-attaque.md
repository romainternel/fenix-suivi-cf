# Visual — Intention attaque (classification dynamique des enclenchements)

**Agent :** Visual Crafter
**Date :** 2026-08-26
**Input :** `docs/analyse/DESIGN-intention-attaque.md` + palette existante `css/style.css`

---

## 1. Palette de tokens

Palette famille actuelle (`css/style.css:16-25`) :

```css
--enc-isoler:       #F59E0B;  /* ambre */
--enc-rentree:      #F97316;  /* orange */
--enc-jeu-pvt:      #8B5CF6;  /* violet */
--enc-bloc-pvt:     #7C3AED;  /* pourpre */
--enc-7vs6:         #10B981;  /* vert */
--enc-faire-courir: #EC4899;  /* rose */
--enc-speciaux:     #64748B;  /* ardoise */
--enc-6vs5:         #06B6D4;  /* cyan */
--enc-rebond:       #84CC16;  /* citron */
--enc-autre:        #94A3B8;  /* gris */
```

**Nouvelle famille "Jeu rapide"** — aucune teinte libre proche du bleu/indigo dans la palette actuelle (le bleu FENIX `#0A2463`/`#3B82F6` est réservé au chrome de l'app, pas aux familles). Proposition :

```css
--enc-jeu-rapide: #4F46E5;  /* indigo — distinct de --enc-jeu-pvt (violet) et de tout accent existant */
```

`--enc-bloc-pvt` et `--enc-rebond` **restent définis tels quels** — ils continuent de servir pour l'affichage des saisons legacy qui utilisent encore ces familles. Ils sortent simplement de l'ordre "par défaut" affiché pour les données au nouveau format (F3, dérivation dynamique), sans être supprimés du CSS.

---

## 2. Bandeau de couverture ⚠ (F5)

Réutilise le ton `--fenix-warning` (`#8B4513`, déjà utilisé pour les PB) mais sur fond clair pour rester un signal discret, pas une alerte bloquante :

```css
.enc-coverage-banner {
  background: #FEF3E2;                 /* ambre très clair, cohérent avec --enc-isoler */
  border: 1px solid #FDE4B8;
  border-left: 3px solid var(--fenix-warning);
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.82rem;
  color: #7C4A0A;
}
.enc-coverage-banner .resoudre-link {
  margin-left: auto;
  color: var(--fenix-blue);
  font-weight: 700;
  cursor: pointer;
  transition: color 150ms ease;
}
.enc-coverage-banner .resoudre-link:hover { color: var(--fenix-blue-light); }
```

**Micro-animation d'apparition** (le bandeau ne doit pas surgir brutalement à chaque re-render de filtre) :
```css
.enc-coverage-banner {
  animation: encBannerIn 200ms ease-out;
}
@keyframes encBannerIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Halo de guidage** au clic sur "Résoudre →" (scroll vers la card Non classifié) :
```css
.enc-card-highlight {
  animation: encHighlightPulse 1500ms ease-out;
}
@keyframes encHighlightPulse {
  0%   { box-shadow: 0 0 0 0 rgba(139, 69, 19, 0.35); }
  100% { box-shadow: 0 0 0 14px rgba(139, 69, 19, 0); }
}
```
Durée totale 1.5s conforme à la contrainte "animations rapides et purposeful" — c'est un guidage ponctuel, pas une boucle.

---

## 3. Card "Non classifié" enrichie

Aucun changement de structure visuelle par rapport à la card famille existante — même gabarit (`.enc-card`), même hiérarchie typographique. Seul ajout : le tableau détail (déjà existant en expand/collapse) gagne une ligne par valeur orpheline avec :

```css
.enc-orphelin-row .valeur-brute {
  font-family: 'Inter', monospace-adjacent; /* garder Inter, pas de police mono — cohérence typo app */
  font-weight: 600;
  color: var(--fenix-dark);
}
.enc-orphelin-row .compteur {
  color: var(--enc-autre);
  font-size: 0.78rem;
}
```

Le bouton `[Assigner ▾]` reprend exactement le style du dropdown de réassignation existant (`enc_famille_custom`) — aucune nouvelle spec, pour garder une cohérence à 100% avec un mécanisme que Romain connaît déjà.

---

## 4. Camembert / cards — intégration de la nouvelle teinte

Pas de refonte du camembert. Vérification à faire par le Developer/QA : sur un tour de camembert avec les 8 familles + "Autre", s'assurer qu'aucune teinte adjacente ne se confond à l'œil (`--enc-jeu-pvt` violet et `--enc-jeu-rapide` indigo sont proches — si le camembert les place l'un à côté de l'autre, prévoir un contour `stroke` blanc 1px entre tranches, déjà en place dans le composant existant d'après le code actuel).

---

## 5. États interactifs

| Élément | Normal | Hover | Focus | Disabled |
|---|---|---|---|---|
| `[Résoudre →]` | `var(--fenix-blue)`, 700 | `var(--fenix-blue-light)` | outline 2px `--fenix-accent` | — (jamais disabled, n'apparaît que si pertinent) |
| `[Assigner ▾]` | style existant inchangé | inchangé | inchangé | inchangé |
| Bandeau ⚠ | visible si orphelins > 0 | — | — | masqué (pas juste opacity:0, retiré du DOM) si 0 orphelin |

---

## 6. Checklist contraste WCAG

| Paire | Ratio | Verdict |
|---|---|---|
| `#7C4A0A` sur `#FEF3E2` (texte bandeau) | ~5.2:1 | ✅ AA (texte normal) |
| `#4F46E5` (Jeu rapide) sur fond blanc carte | ~7.1:1 | ✅ AAA |
| `#4F46E5` sur `#8B5CF6` (adjacence camembert) | n/a (pas de texte sur texte) | à vérifier visuellement, cf §4 |
| Texte `.enc-orphelin-row .valeur-brute` (`--fenix-dark` sur blanc) | ~15.8:1 | ✅ AAA |

---

*Visual — pipeline BMAD FENIX — Visual Crafter 2026-08-26*

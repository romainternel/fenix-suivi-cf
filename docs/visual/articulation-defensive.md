# Visual — Articulation défensive (efficacité par poste occupé)

**Agent :** Visual Crafter
**Date :** 2026-09-02

---

## 1. Demi-terrain (nouveau composant `.artic-court`)

```css
.artic-court {
    width: 100%; max-width: 520px; margin: 0 auto;
    aspect-ratio: 1 / 0.62; /* demi-terrain, plus large que haut */
    background: linear-gradient(180deg, #6BAED9 0%, #4A8EC8 100%); /* même dégradé que #hb-court-svg */
    border-radius: 12px; box-shadow: var(--shadow-lg);
    position: relative; overflow: hidden;
}
.artic-goal {
    position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 30%; height: 14%;
    background-image: repeating-linear-gradient(45deg, #CC2222 0 6px, #f0f0f0 6px 12px);
    border: 2px solid #fff; border-top: none; border-radius: 0 0 4px 4px;
}
.artic-poste {
    position: absolute; width: 56px; height: 56px; border-radius: 50%;
    background: #fff; border: 3px solid var(--fenix-blue);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.5px;
    box-shadow: var(--shadow-md);
    cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.artic-poste:hover { transform: scale(1.08); box-shadow: var(--shadow-lg); }
.artic-poste.selected { border-color: #FCD34D; box-shadow: 0 0 0 3px rgba(252,211,77,0.4); }
.artic-poste-label { font-size: 0.6rem; color: #94A3B8; letter-spacing: 1px; } /* "P1" */
.artic-poste-joueur { font-size: 0.72rem; color: var(--fenix-dark); font-weight: 700; line-height: 1; }
.artic-poste-eff { font-size: 0.95rem; font-weight: 700; line-height: 1.1; }
/* Couleur d'efficacité : réutilise exactement la logique déjà en place (getEffColor / seuils),
   mais inversée conceptuellement — une efficacité ADVERSE basse est un bon signal défensif */
.artic-poste-eff.fort   { color: #10B981; } /* adversaire peu efficace ici = bonne défense */
.artic-poste-eff.moyen  { color: #F59E0B; }
.artic-poste-eff.faible { color: #EF4444; } /* adversaire très efficace ici = point faible */
```

**Justification de l'inversion de code couleur** : partout ailleurs dans l'app, vert = FENIX performant. Ici la métrique est l'efficacité de l'**adversaire**, donc vert doit signifier "l'adversaire a été inefficace face à ce poste" (= bonne défense), pas "l'adversaire a bien joué". Documenter ce renversement clairement dans le code (commentaire) pour éviter une confusion future lors d'une maintenance.

## 2. Postes multi-occupants (badge "+N autres")

```css
.artic-poste-badge {
    position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%;
    background: var(--fenix-accent); color: #fff; font-size: 0.55rem; font-weight: 700;
    display: flex; align-items: center; justify-content: center; border: 1.5px solid #fff;
}
```

## 3. Sélecteur de dispositif (0-6 / 1-5)

Même famille que `.enc-pie-mode-btn` déjà existant (pilule active en violet `#7C3AED`, inactive en gris clair) — aucune nouvelle classe nécessaire, réutilisation directe pour la cohérence visuelle avec le reste de la section.

## 4. Bloc "Meilleures charnières centrales"

```css
.artic-hinge-board {
    margin-top: 16px; padding: 12px 16px; background: #FFFBEB; /* même ton que les bandeaux d'info existants */
    border: 1px solid #FDE68A; border-radius: 10px;
}
.artic-hinge-title { font-family:'Bebas Neue',sans-serif; font-size:0.95rem; color:#92400E; letter-spacing:0.5px; margin-bottom:8px; }
.artic-hinge-row {
    display: flex; align-items: center; gap: 8px; padding: 4px 0;
    font-size: 0.8rem; color: #374151;
}
.artic-hinge-rank { font-family:'Bebas Neue',sans-serif; font-size:1.1rem; color:#F59E0B; width:20px; flex-shrink:0; }
.artic-hinge-eff { font-weight: 700; color: #10B981; margin-left: auto; }
```
Ton ambre plutôt que vert franc pour tout le bloc : il s'agit d'une **mise en avant/suggestion**, pas d'un résultat validé au même niveau qu'une stat brute — la nuance visuelle doit refléter "à considérer", pas "fait établi".

## 5. Bouton "Articulation" désactivé (mode Attaque)

```css
.enc-pie-mode-btn.artic-disabled {
    opacity: 0.35; cursor: not-allowed; pointer-events: none;
}
```
Pas de tooltip custom nécessaire — `title` natif suffit (cohérent avec le reste de l'app, cf. `.enc-info-btn`).

## 6. Micro-animations

| Élément | Trigger | Durée | Easing |
|---|---|---|---|
| Poste hover | `:hover` | 150ms | ease |
| Poste sélectionné | clic | instantané (bordure + glow) | — |
| Bascule 0-6 ↔ 1-5 | clic sélecteur dispositif | 200ms (fade + reposition) | ease-out |
| Apparition panneau détail poste | clic poste | 200ms (slide + fade), cohérent avec les panneaux de drill-down existants | ease-out |

## 7. Contraste

Postes : fond blanc, texte `--fenix-dark` (#0F172A) sur fond blanc — largement conforme WCAG AA. Bordure bleu FENIX sur fond dégradé bleu clair/moyen du terrain : vérifier au rendu réel que `#0A2463` reste net sur `#6BAED9`/`#4A8EC8` (déjà validé ailleurs dans l'app pour le même dégradé de terrain, aucun risque attendu).

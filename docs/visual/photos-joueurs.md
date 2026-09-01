# Visual — Photos joueurs (portrait + corps entier)

**Agent :** Visual Crafter
**Date :** 2026-09-01

---

## 1. Avatar portrait (F1)

`.jp-avatar` / `.pmf-avatar` avec photo :
```css
.jp-avatar img, .pmf-avatar img {
    width: 100%; height: 100%;
    border-radius: 50%;
    object-fit: cover;
    object-position: center top; /* privilégie le visage si le cadrage portrait n'est pas parfaitement carré */
}
```
- Le `border: 2px solid rgba(255,255,255,0.5)` et le fond `rgba(255,255,255,0.25)` de `.jp-avatar` restent inchangés — la bordure blanche semi-transparente donne un effet "médaillon" cohérent avec le dégradé de fond du header, qu'il y ait photo ou initiales.
- Léger `box-shadow: 0 2px 6px rgba(0,0,0,0.25)` ajouté uniquement sur la variante photo (pas sur les initiales, où ça n'apporte rien) pour détacher la photo du dégradé de fond derrière elle.
- **Pas d'animation d'apparition** — la photo doit être là dès le rendu de `selectJoueur()`, pas de fade-in qui ralentirait la sensation de réactivité déjà en place sur ce panneau.

## 2. Avatar cliquable (F3) — affordance

- État par défaut (pas de photo corps entier pour ce joueur) : `cursor: default`, aucun changement visuel — l'avatar ne doit pas sembler cliquable s'il ne l'est pas.
- État cliquable (photo corps entier disponible) :
```css
.jp-avatar.jp-avatar-clickable {
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.jp-avatar.jp-avatar-clickable:hover {
    transform: scale(1.06);
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}
.jp-avatar.jp-avatar-clickable:active { transform: scale(0.97); }
```
- Un tout petit badge indicateur (coin bas-droit de l'avatar, 14px, icône silhouette `👤` ou point bleu `--fenix-accent`) signale discrètement "il y a plus à voir ici" sans texte — évite que Romain doive découvrir la fonctionnalité par hasard.

## 3. Bouton "↩ Terrain" (F3)

Même famille que `.jp-print-btn` existant (petit bouton pilule sur fond semi-transparent), mais positionné en overlay haut-gauche de `.court-container` plutôt que dans le header :
```css
.court-back-btn {
    position: absolute; top: 10px; left: 10px; z-index: 5;
    background: rgba(10,36,99,0.85); /* var(--fenix-blue) à 85% */
    color: #fff; border: none; border-radius: 20px;
    padding: 6px 14px; font-size: 0.78rem; font-weight: 600;
    display: flex; align-items: center; gap: 5px;
    box-shadow: var(--shadow-md);
    cursor: pointer; transition: background 0.15s ease;
}
.court-back-btn:hover { background: var(--fenix-blue-light); }
```
`.court-container` passe en `position: relative` pour ancrer ce bouton en overlay.

## 4. Zone photo corps entier (remplace le terrain)

```css
.court-photo-view {
    width: 100%; height: 70vh; /* aligné sur #hb-court-svg */
    border-radius: 12px; box-shadow: var(--shadow-lg);
    background: linear-gradient(180deg, #E8F1FB 0%, #F8FAFC 100%);
    display: flex; align-items: flex-end; justify-content: center;
    overflow: hidden; position: relative;
}
.court-photo-view img {
    max-height: 100%; max-width: 100%;
    object-fit: contain; object-position: bottom center;
    filter: drop-shadow(0 8px 12px rgba(15,23,42,0.18));
}
```
- Fond clair dégradé plutôt que le bleu terrain saturé : la photo (fond transparent, joueur en maillot bleu clair Fenix) se détache mal sur le bleu du terrain existant — un fond clair fait ressortir le maillot et évite un effet "camouflage".
- `drop-shadow` doux sous le joueur pour un ancrage visuel, pas un fond plat.
- Transition d'apparition : `opacity` + léger `translateY` (200ms ease-out) au moment du swap terrain→photo et retour, pour que le changement de contenu de toute la colonne gauche ne soit pas un cut brutal.

## 5. Slide de couverture PDF/PPT (F2)

```css
.pdf-cover-photo {
    position: absolute; bottom: 0; right: 24px;
    height: 55%; max-width: 42%;
    object-fit: contain; object-position: bottom;
    filter: drop-shadow(-6px 0 14px rgba(0,0,0,0.35));
}
```
- `pdf-slide-cover` passe en `position: relative` (ou l'est peut-être déjà, à vérifier au moment du dev) pour ancrer la photo en absolute.
- L'ombre portée orientée vers la gauche (`-6px 0`) détache le joueur du fond bleu uni sans paraître flottant.
- Le bloc de texte existant (nom, poste, période) reste sur son alignement centré actuel — à ce ratio (42% max-width, ancré à droite), il ne devrait pas y avoir de chevauchement pour un texte de longueur normale ; si un nom très long chevauche visuellement en test réel, réduire le texte à `text-align:left` recalé à gauche plutôt que de réduire la photo (la photo est l'élément différenciant de cette version de la fiche).

## 6. Contraste & lisibilité

- Toutes les photos étant sur fond transparent fourni par Romain (déjà détouré), aucun risque de halo blanc résiduel à corriger côté CSS — à vérifier au premier import réel (`object-fit` seul ne corrige pas un mauvais détourage).
- Le badge indicateur (§2) doit respecter un contraste suffisant sur n'importe quelle photo/couleur de maillot en fond — utiliser un cerclage blanc de 1.5px autour du badge plutôt que de dépendre de la couleur de fond.

## 7. Micro-animations — récapitulatif

| Élément | Trigger | Durée | Easing |
|---|---|---|---|
| Avatar cliquable hover | `:hover` | 150ms | ease |
| Avatar cliquable clic | `:active` | instantané (scale) | — |
| Bascule terrain↔photo | clic avatar / bouton retour | 200ms | ease-out |
| Bouton "↩ Terrain" hover | `:hover` | 150ms | ease |

Toutes sous la barre des 250ms fixée par convention — cohérent avec le reste de l'app (`transition 0.15s` déjà largement utilisé dans `style.css`).

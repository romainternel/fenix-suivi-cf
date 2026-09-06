# Architecture — Refonte lisibilité du mode Articulation

**Agent :** Architect
**Date :** 2026-09-06

---

## 1. Décision technique

### 1.1 Positionnement des postes — calculé depuis les paramètres de l'arc, pas des décimales à la main

`ARTIC_LAYOUTS` reste un objet statique (cohérent avec la convention du projet pour les configurations maintenues à la main, cf. CLAUDE.md §4 — `POSTE_POSITIONS`, `GB_ZONE_WEIGHTS`), mais ses valeurs `y` sont dérivées à la définition du fichier par une petite fonction pure, plutôt que recopiées en dur depuis le calcul du Designer. Alternative rejetée : coller directement les décimales calculées (`39.5`, `34.9`…) dans l'objet — plus court à lire, mais si le tracé SVG du 6m (`_articCourtSvg()`) est un jour retouché (rayon, centre), les postes se désynchroniseraient silencieusement de la ligne sans qu'aucune erreur ne le signale. Extraire les paramètres de l'arc en constante partagée élimine ce risque pour un coût de lisibilité négligeable.

```js
// Paramètres de l'ellipse du tracé 6m dans _articCourtSvg() — seule source de vérité pour le
// placement des postes sur la ligne. Si le tracé SVG change, ces 4 nombres doivent changer avec lui.
const ARTIC_6M_ARC = { cx: 50, cy: 10, rx: 37.5, ry: 30 };

function _articArcY(x, arc) {
    const t = (x - arc.cx) / arc.rx;
    return arc.cy + arc.ry * Math.sqrt(Math.max(0, 1 - t * t));
}

const ARTIC_LAYOUTS = {
    '0-6': (() => {
        const xs = { p1: 15, p2: 29, p3: 43, p4: 57, p5: 71, p6: 85 };
        const out = {};
        Object.keys(xs).forEach(k => { out[k] = [xs[k], _articArcY(xs[k], ARTIC_6M_ARC)]; });
        return out;
    })(),
    '1-5': (() => {
        // P1/P2/P5/P6 tiennent la ligne des 6m (même formule) ; P3/P4 sortent délibérément de la
        // ligne (définition du dispositif 1-5) et gardent des coordonnées fixes, calées visuellement
        // entre le 6m et le 9m (cf. docs/design/articulation-lisibilite.md §3).
        const xs = { p1: 15, p2: 32, p5: 68, p6: 85 };
        const out = {};
        Object.keys(xs).forEach(k => { out[k] = [xs[k], _articArcY(xs[k], ARTIC_6M_ARC)]; });
        out.p3 = [50, 46];
        out.p4 = [50, 66];
        return out;
    })(),
};
```

Calculé une seule fois au chargement du script (IIFE immédiatement invoquées), pas à chaque rendu — coût nul en performance, `ARTIC_LAYOUTS` reste un objet figé consultable comme avant.

### 1.2 Retrait du texte d'efficacité dans les ronds — remplacé par une classe d'état sur le rond lui-même

Actuellement chaque poste rend un enfant `<div class="artic-poste-eff {classe}">{texte}</div>`. Ce `div` est supprimé ; la classe d'efficacité (`fort`/`moyen`/`faible`/`noref`, déjà produite par `_articEffClass()`) est appliquée directement sur le conteneur `.artic-poste`, et c'est le CSS qui traduit la classe en liseré (`box-shadow` coloré) plutôt qu'en texte. `_articEffClass()` n'est pas modifiée — seul son usage en aval change (classe sur le parent au lieu de contenu d'un enfant).

**Point d'attention pour le Developer** : `.artic-poste.selected` utilise déjà un `box-shadow` jaune pour signaler la sélection. Pour que le liseré d'efficacité et le surlignage de sélection coexistent sans que l'un écrase l'autre, la sélection doit passer en `outline` (qui se superpose indépendamment d'un `box-shadow`) plutôt qu'en `box-shadow` :

```css
.artic-poste.selected { outline: 2px solid #FCD34D; outline-offset: 2px; }
.artic-poste.fort   { box-shadow: 0 0 0 3px #10B981; }
.artic-poste.moyen  { box-shadow: 0 0 0 3px #F59E0B; }
.artic-poste.faible { box-shadow: 0 0 0 3px #EF4444; }
.artic-poste.noref  { box-shadow: 0 0 0 3px #CBD5E1; }
```

### 1.3 Bandeau de contrôles — nouveau conteneur, pas de nouvel état

`.artic-control-bar` regroupe dans le HTML les deux toggles déjà existants (dispositif, mode) — aucun changement de logique, juste un conteneur visuel commun. La ligne conditionnelle "N poste(s) modifié(s) · Réinitialiser" lit `Object.keys(window._articManualPoste).length` (déjà maintenu par `_setArticManualJoueur`) — aucune nouvelle donnée à tracker, juste un nouveau point de lecture d'un état déjà présent.

Nouvelle fonction `_resetArticManual()` : vide `window._articManualPoste = {}` et redessine — trivial, même forme que `_setArticDispositif`.

### 1.4 Fusion de la référence globale dans le panneau d'indicateurs

`.artic-global-eff` (ligne de texte actuelle) disparaît ; sa valeur (`stats.global[dispositif]`, déjà calculée par `computeArticulationStats`) est rendue comme une carte supplémentaire au même format que `.artic-block-card`, insérée en tête du tableau construit à partir de `ARTIC_BLOCKS` au moment du rendu (pas dans la constante elle-même, puisque cette carte dépend de `g`/`dispositif`, contrairement aux 3 blocs qui ne dépendent que de `lineup`). Aucun changement dans `computeArticulationStats`.

## 2. Impact sur l'existant

| Élément | Changement |
|---|---|
| `ARTIC_LAYOUTS` | Valeurs recalculées (voir §1.1) — tous les dispositifs affectés, positions visuellement différentes |
| `_drawArticulationCourt` | Boucle des postes modifiée (classe sur le parent au lieu d'un enfant texte, ajout de l'indicateur `✎` manuel) ; ajout du rendu du bandeau de contrôles et de la carte Référence fusionnée |
| `css/style.css` (`.artic-*`) | `.artic-poste-eff` supprimée ou vidée de son usage ; nouvelles classes `.artic-control-bar`, `.artic-manual-indicator` ; `.artic-poste.selected` passe de `box-shadow` à `outline` |
| `computeArticulationStats`, `_articBlockEff`, `ARTIC_BLOCKS`, `_articPrimaryEntry` | **Inchangées** — aucune modification de calcul, conformément au PRD |
| `_articCourtSvg()` | **Inchangée** — reste la source de vérité géométrique que `ARTIC_6M_ARC` reflète |

Aucun impact sur `js/supabase-client.js`, le schéma Supabase, ou d'autres pages — le périmètre reste entièrement contenu dans le mode Articulation de `js/page-analyse.js` et ses styles associés.

## 3. Nouvelles structures de données

- `ARTIC_6M_ARC` (constante, 4 nombres) — paramètres de l'ellipse du tracé 6m.
- Pas de nouvel état global : `window._articManualPoste`, `window._articViewMode`, `window._articDispositif`, `window._articSelectedPoste` suffisent tels quels.

## 4. Nouvelles fonctions

| Fonction | Rôle |
|---|---|
| `_articArcY(x, arc)` | Calcule le `y` d'un point d'abscisse `x` sur une ellipse donnée — utilisée pour dériver `ARTIC_LAYOUTS` |
| `_resetArticManual()` | Vide les overrides manuels et redessine |

## 5. Risques

- **Proximité du but pour P1/P6 (0-6)** : à `x=15`/`x=85`, `y≈20.8`. Le rond fait ~56px (~10.7 unités de viewBox), son bord haut atteint donc `y≈15.4`, à distance suffisante du but (`y=0` à `10`) — pas de chevauchement, mais à vérifier visuellement en QA/E2E sur un vrai rendu plutôt que sur le calcul seul.
- **Collision `outline`/`box-shadow`** : documentée en §1.2 pour que le Developer ne recrée pas le bug en réutilisant `box-shadow` pour les deux états. Risque faible si la consigne est suivie, mais à vérifier explicitement en Code Review.
- **Lisibilité du 1-5 avec seulement 4 postes sur la ligne** : l'espacement (`x=15,32,68,85`) est plus large que celui du 0-6 (6 postes sur la même largeur) — cohérent puisqu'il y a moins de postes à répartir, mais à valider visuellement que P1/P2 et P5/P6 ne semblent pas trop écartés l'un de l'autre par rapport à P3/P4 au centre.

## 6. Critère de bascule

Si un troisième type de dispositif défensif venait à être tagué dans l'Excel (au-delà de 0-6/1-5), la logique actuelle (un bloc `IIFE` par dispositif dans `ARTIC_LAYOUTS`, des `x` choisis à la main par poste) resterait suffisante tant que le nombre de dispositifs reste à une poignée — pas de besoin d'un système de formation générique tant qu'on ne dépasse pas 3-4 dispositifs distincts avec une géométrie propre à documenter à la main à chaque fois.

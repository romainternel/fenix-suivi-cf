# Architecture — Intention attaque (classification dynamique des enclenchements)

**Agent :** Architect
**Date :** 2026-08-26
**Inputs :** `docs/analyse/PRD-intention-attaque.md` · `docs/analyse/DESIGN-intention-attaque.md` · code actuel (`FENIX-HANDBALL-CF-SUIVI.html`, `js/page-analyse.js`, v221)

---

## 0. Rappel du contexte technique

- Vanilla JS, un seul fichier HTML + modules `js/*.js` chargés en `<script>` classiques (pas d'`import`/`export`).
- Import Excel : `processFile()` dans `FENIX-HANDBALL-CF-SUIVI.html` (~ligne 1406). Lit `jsonData[0]` comme en-tête ignoré, `DATA` = lignes brutes indexées par position (`COLS`). Les feuilles annexes (`Joueurs`, `Temps de Jeu`, `Bilan`) sont trouvées par **nom de feuille tolérant** (regex insensible à la casse) puis parsées par **en-tête de colonne** (pas par position fixe) — c'est le pattern à suivre.
- Classification actuelle : `ENC_FAMILLE_MAP` (objet figé, `js/page-analyse.js:6`) + `getEncFamille(encStr)` (~ligne 1302) qui découpe `encStr.split(';')` et teste p0/p1/p2 contre la map. Surcouche `_ENC_FAMILLE_CUSTOM` (localStorage `enc_famille_custom`) prioritaire sur la map.
- `ENC_FAMILLES_ORDRE`, `ENC_FAMILLE_COLORS`, `ENC_FAMILLE_IDS` : trois constantes figées (`page-analyse.js:59-70`), consommées à 15+ endroits (cards, camembert, matrice, tableau V/D, saison V/D, chat IA, détection "tactique payante").

---

## 1. Décision technique

### 1.1 — Lecture de la nouvelle feuille catalogue
Ajouter dans `processFile()`, au même niveau que la lecture de `Bilan`, un bloc de lecture tolérant :

```javascript
// Lecture feuille "Enclenchements" / "Intention attaque" (catalogue Intention → Famille)
INTENTION_FAMILLE_MAP = {};
const encSheetName = workbook.SheetNames.find(n => /enclenchement|intention.?attaque/i.test(n));
if (encSheetName) {
    const eRows = XLSX.utils.sheet_to_json(workbook.Sheets[encSheetName], { header: 1, defval: '' });
    const eHeaders = (eRows[0] || []).map(h => h.toString().toLowerCase().trim());
    const iIntent  = eHeaders.findIndex(h => h.includes('intention'));
    const iFamille = eHeaders.findIndex(h => h.includes('famille'));
    if (iIntent >= 0 && iFamille >= 0) {
        eRows.slice(1).forEach(row => {
            const intent  = (row[iIntent]  || '').toString().trim();
            const famille = (row[iFamille] || '').toString().trim();
            if (intent && famille) INTENTION_FAMILLE_MAP[normalizeIntention(intent)] = titleCaseFamille(famille);
        });
    }
}
```
- Nom de feuille toléré : `Enclenchements` OU `Intention attaque` (couvre le renommage annoncé mais reporté par l'utilisateur — F6/Q1 du Brief, résolu sans développement dédié).
- Colonnes trouvées par en-tête (`intention`, `famille`), pas par position — la feuille catalogue peut évoluer en nombre de lignes sans casser l'import (déjà le pattern utilisé pour `Bilan`).
- `normalizeIntention()` : `toUpperCase().trim()` — les valeurs Excel (`ISO 3`, `7vs6`, `JEU RAPIDE`) et celles de `DATA.Intention attaque` doivent être comparées sur une forme normalisée identique, la casse n'étant pas garantie identique entre les deux colonnes.
- `titleCaseFamille()` : normalise `"JEU PIVOT"` → `"Jeu Pivot"` pour rester cohérent avec la casse d'affichage des familles existantes (`Isoler`, `Faire courir`...) plutôt que d'afficher du tout-majuscule brut issu de l'Excel.

### 1.2 — Colonne `Intention attaque` dans `COLS`
```javascript
const COLS = {
    ...,               // 21 colonnes existantes inchangées
    intentionAttaque: 21
};
```
Position fixe à 21 acceptée **avec un garde-fou** : au premier import, vérifier que `jsonData[0][21]` (l'en-tête) vaut bien `"Intention attaque"` (comparaison insensible à la casse) ; si non, chercher son index réel dans la ligne d'en-tête et le mémoriser. Ce garde-fou coûte 3 lignes et évite une régression silencieuse si une future colonne est un jour insérée avant elle dans l'Excel — cohérent avec le principe "simple et solide" plutôt que de parier indéfiniment sur une position fixe.

### 1.3 — Classification hybride
Nouvelle fonction, **remplace les appels directs à `getEncFamille(r[COLS.enclenchement])`** dans tout `page-analyse.js` :

```javascript
function getFamilleForRow(row) {
    const intention = (row[COLS.intentionAttaque] || '').toString().trim();
    if (intention) {
        const custom = _ENC_FAMILLE_CUSTOM[normalizeIntention(intention)];
        if (custom) return custom;
        const famille = INTENTION_FAMILLE_MAP[normalizeIntention(intention)];
        return famille || 'Non classifié';   // orphelin — jamais deviné, jamais fondu dans "Autre" silencieusement
    }
    // repli intégral sur le comportement legacy, inchangé
    return getEncFamille(row[COLS.enclenchement]);
}
```
- `getEncFamille()` (legacy) **n'est pas modifiée** — elle continue de servir exclusivement au texte libre, ce qui garantit la non-régression sur les saisons sans `Intention attaque` (aucune ligne de code partagée à risque de double-effet de bord).
- `_ENC_FAMILLE_CUSTOM` reste l'unique mécanisme de réassignation manuelle, maintenant partagé entre les deux voies (clé = intention normalisée dans un cas, clé = texte libre legacy dans l'autre — pas de collision possible, les formats sont visuellement distincts).
- **"Non classifié" devient une famille de premier ordre**, pas un synonyme silencieux d'"Autre" : c'est ce qui permet à F4 (signalement des orphelins) de fonctionner sans changement d'UI supplémentaire, la card "Non classifié" existant déjà.

### 1.4 — Dérivation dynamique de `ENC_FAMILLES_ORDRE`
```javascript
function getActiveFamilles() {
    const set = new Set();
    Object.values(INTENTION_FAMILLE_MAP).forEach(f => set.add(f));
    DATA.forEach(row => { const f = getFamilleForRow(row); if (f !== 'Non classifié' && f !== 'Autre') set.add(f); });
    return [...set];
}
```
Remplace la constante figée `ENC_FAMILLES_ORDRE` par un **calcul fait une fois par import** (pas par render — coût négligeable sur ~200 à ~4000 lignes, à cacher dans une variable module `let _familles_actives` recalculée uniquement dans `processFile()` et lors d'une réassignation manuelle, pas à chaque `updateAnalysePage()`).

`ENC_FAMILLE_COLORS` et `ENC_FAMILLE_IDS` passent d'objets figés à des **fonctions de résolution avec repli** :
```javascript
const ENC_FAMILLE_COLORS_BASE = { /* les 10 couleurs existantes, dont --enc-jeu-rapide ajoutée (Visual Crafter) */ };
function getFamilleColor(f) { return ENC_FAMILLE_COLORS_BASE[f] || 'var(--enc-autre)'; }
function getFamilleId(f) { return ENC_FAMILLE_IDS_BASE[f] || slugify(f); }
```
Ainsi une famille totalement inédite (ni dans la palette Visual Crafter, ni dans les IDs prévus) ne casse rien — elle obtient une couleur neutre et un ID généré, plutôt qu'un `undefined` qui casserait le rendu CSS.

**Chantier de remplacement** : les ~15 occurrences de `ENC_FAMILLES_ORDRE` / `ENC_FAMILLE_COLORS` / `ENC_FAMILLE_IDS` recensées dans `page-analyse.js` sont remplacées par des appels à `getActiveFamilles()` / `getFamilleColor()` / `getFamilleId()`. C'est une story à part entière (cf. Scrum Master) — pas un simple renommage, chaque site d'appel doit être vérifié individuellement pour ne pas casser un tri ou une clé de cache existante.

---

## 2. Pourquoi (alternatives considérées et rejetées)

| Alternative | Rejetée parce que |
|---|---|
| Étendre `ENC_FAMILLE_MAP` à la main avec les nouvelles clés `Intention attaque` (comme fait 4 fois depuis juin pour le texte libre) | Ne résout pas le problème de fond (Analyst §3) : le catalogue continuerait à nécessiter un redéploiement à chaque évolution côté coach. |
| Remplacer entièrement `ENC_FAMILLE_MAP` et abandonner le legacy | Casse toutes les saisons passées (2025-2026 et antérieures) qui n'ont que le texte libre — inacceptable, violerait le critère de non-régression du PRD. |
| Charger le catalogue Enclenchements à la demande (lazy, au premier accès à la page Analyse) plutôt qu'à l'import | Complexifie inutilement l'état (il faudrait gérer un cas "catalogue pas encore chargé" pendant que `DATA` l'est déjà) pour un fichier qui pèse 16 lignes — aucun bénéfice de performance mesurable. |
| Position fixe de colonne sans garde-fou d'en-tête | Fragile face à une future modification du classeur Excel par l'utilisateur (ajout/suppression de colonne) — le garde-fou coûte 3 lignes, l'absence de garde-fou coûte une régression silencieuse difficile à diagnostiquer. |

---

## 3. Impact sur l'existant

- **`page-analyse.js`** : ~15 sites de remplacement de `ENC_FAMILLES_ORDRE`/`ENC_FAMILLE_COLORS`/`ENC_FAMILLE_IDS`, ajout de `getFamilleForRow`, `getActiveFamilles`, `getFamilleColor`, `getFamilleId`, `normalizeIntention`, `titleCaseFamille`. Aucune fonction existante supprimée.
- **`FENIX-HANDBALL-CF-SUIVI.html`** : bloc de lecture de la feuille catalogue ajouté dans `processFile()` ; `COLS.intentionAttaque` ajouté ; bump `?v=`.
- **`css/style.css`** : ajout `--enc-jeu-rapide` (Visual Crafter). `--enc-bloc-pvt` et `--enc-rebond` conservés tels quels (toujours utilisés par le repli legacy).
- **`enc_famille_custom` (localStorage)** : format inchangé (clé string → famille string) ; simplement alimenté par deux origines désormais (texte libre legacy + intention normalisée), sans changement de schéma.
- **Aucun impact** sur Dashboard, Joueurs, Notes, Impact, Gardiens, Vue Joueur, PDF/PPT — la classification par famille n'est consommée que par le module Analyse.

---

## 4. Nouvelles structures de données

```javascript
let INTENTION_FAMILLE_MAP = {};   // { "ISO 3": "Isoler", "7VS6": "7vs6", ... } — reconstruit à chaque import
let _familles_actives = [];       // cache, recalculé à l'import + à chaque réassignation manuelle
```
Aucune nouvelle persistance requise — tout reste dérivé de `DATA` + du classeur importé, cohérent avec le modèle 100% local actuel (pas d'anticipation du chantier Supabase, volontairement hors scope ici).

---

## 5. Nouvelles fonctions / modules

| Fonction | Responsabilité |
|---|---|
| `getFamilleForRow(row)` | Point d'entrée unique de classification — remplace tous les appels directs à `getEncFamille` dans le rendu |
| `getActiveFamilles()` | Liste dynamique des familles à afficher, triée par usage |
| `getFamilleColor(f)` / `getFamilleId(f)` | Résolution avec repli neutre pour toute famille imprévue |
| `normalizeIntention(str)` | Normalisation casse/espaces pour comparer Excel DATA ↔ Excel catalogue |
| `titleCaseFamille(str)` | Normalisation d'affichage (`"JEU PIVOT"` → `"Jeu Pivot"`) |

`getEncFamille()` (legacy) reste **intacte**, non renommée, non déplacée — c'est une brique de repli, pas du code mort.

---

## 6. Risques (renvoi au Risk Analyst pour le détail)

- Effet de bord si un des ~15 sites de remplacement garde une référence à l'ancienne constante figée par erreur (incohérence entre le camembert et la matrice, par exemple) — traité comme critère d'acceptation explicite par site dans les stories.
- Normalisation de casse insuffisante si l'Excel contient des espaces multiples ou des variantes d'accents (`Rentrée` vs `RENTREE` vs `Rentree`) — `normalizeIntention` doit aussi neutraliser les accents (`normalize('NFD')`), sans quoi certaines correspondances légitimes tomberaient en "Non classifié" à tort.

---

## 7. Critère de bascule

Si un jour le catalogue `Enclenchements`/`Intention attaque` dépasse ~200 lignes ou que plusieurs coachs le modifient en parallèle (scénario multi-utilisateur), la lecture à l'import en mémoire ne suffira plus — ce sera le signal qu'il faut rapprocher ce chantier de la migration Supabase déjà spécifiée (table de config partagée plutôt que ré-import Excel systématique). Pas le cas aujourd'hui (16 lignes, un seul utilisateur) — aucune action requise maintenant.

---

*Architecture — pipeline BMAD FENIX — Architect 2026-08-26*

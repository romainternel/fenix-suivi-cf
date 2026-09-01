# Architecture — Photos joueurs (portrait + corps entier)

**Agent :** Architect
**Date :** 2026-09-01

---

## 1. Décision technique — stockage

**Fichiers statiques bundlés dans le repo** (`assets/photos/`), servis par GitHub Pages comme `ALD.png`, `TERRAIN HANDBALL.png` et les autres images déjà présentes à la racine — **pas** de bucket Supabase Storage.

### Pourquoi
- Le PRD exclut explicitement l'upload depuis l'interface (Romain ajoute les fichiers lui-même) — il n'y a donc aucun besoin d'un backend de stockage dynamique, seulement de fichiers servis.
- Un bucket Supabase Storage impliquerait : policies RLS dédiées, décision URL publique vs signée, gestion d'un nouveau point de défaillance réseau au chargement de chaque fiche. Rien de tout ça n'apporte de valeur ici puisque les fichiers sont fixes et connus au moment du build.
- Cohérent avec la convention déjà en place dans ce projet pour les assets images (statique, versionné dans git).
- Fonctionne offline une fois mis en cache par le navigateur (contrairement à un fetch Supabase Storage) — bénéfice réel vu le contexte gymnase/déplacement de l'app.

### Alternatives rejetées
- **Supabase Storage** : rejeté — complexité (policies, URLs) sans bénéfice puisque aucun upload utilisateur n'est prévu.
- **Stocker la photo en base64 dans une table Supabase** : rejeté — gonflerait `match_data`/`joueurs` sans rapport avec leur rôle actuel, et le payload de boot (`loadFromSupabase()`, déjà 7 tables en parallèle) grossirait inutilement à chaque chargement de l'app pour TOUS les joueurs même non consultés.

## 2. Mapping nom → photo

**Point technique déterminant** (vérifié dans le code) : `JOUEURS_TERRAIN` n'est **pas** une constante statique en usage réel — le tableau littéral visible en dur (`FENIX-HANDBALL-CF-SUIVI.html:2591`) n'est qu'une valeur de démarrage par défaut ; `JOUEURS_TERRAIN` est **entièrement reconstruit** à chaque import/reboot depuis `joueursRows` (`FENIX-HANDBALL-CF-SUIVI.html:1628`, alimenté par la table Supabase `joueurs` / le fichier Excel). Toute donnée qu'on stockerait directement sur les objets `JOUEURS_TERRAIN` serait donc **effacée au prochain réimport Excel** — un comportement que Romain a justement (re)confirmé cette semaine ("réimport complet à chaque fois").

**Décision** : mapping séparé, statique, non touché par l'import — nouveau fichier `js/player-photos.js` :

```js
// js/player-photos.js
const PLAYER_PHOTOS = {
    // clé = nom canonique tel qu'utilisé dans JOUEURS_TERRAIN (ex: "Marius.C")
    'Marius.C': {
        portrait: 'assets/photos/marius-caujolle-portrait.webp',
        corps:    'assets/photos/marius-caujolle-corps.webp'
    },
    // ... un joueur à la fois, ajouté à la main par Romain (ou en session Claude Code) à mesure des photos reçues
};

function getPlayerPhoto(nomJoueur, type /* 'portrait' | 'corps' */) {
    const key = Object.keys(PLAYER_PHOTOS).find(k => matchPlayerName(k, nomJoueur));
    if (!key) return null;
    return PLAYER_PHOTOS[key][type] || null;
}
```

### Pourquoi ce format
- Maintenu à la main, exactement comme `GB_ZONE_WEIGHTS`, `POSTE_POSITIONS` ou `_FAMILLE_DEFAULTS` déjà dans ce projet — cohérent avec les conventions existantes, aucune UI d'admin à construire.
- `getPlayerPhoto()` réutilise `matchPlayerName()` (déjà chargé via `js/utils.js`) pour la résolution du nom — évite de réintroduire le bug de mismatch "Prénom" vs "Prénom.Initiale" rencontré et corrigé à répétition cette saison sur ce projet (onglet Gardien, table GB, graphique, Impact).
- Résolution **synchrone** (pas de `Promise`, pas d'appel réseau) — confirme et simplifie la décision du Designer de ne prévoir aucun état de chargement.

## 3. Impact sur l'existant

| Fichier | Changement |
|---|---|
| `FENIX-HANDBALL-CF-SUIVI.html` | Nouveau tag `<script src="js/player-photos.js?v=NNN"></script>`, positionné **avant** `page-joueurs.js` et `player-mode.js` (qui appellent `getPlayerPhoto`), après `utils.js` (dépendance sur `matchPlayerName`) |
| `js/player-photos.js` (nouveau) | `PLAYER_PHOTOS` + `getPlayerPhoto()` |
| `assets/photos/` (nouveau dossier) | Fichiers image, un portrait + un corps entier par joueur documenté |
| `js/page-joueurs.js` — `selectJoueur()` (~L168-170) | `jpHeader` : `<div class="jp-avatar">` devient conditionnel — `<img>` si `getPlayerPhoto(nom,'portrait')` renvoie une URL, sinon initiales inchangées. `onerror` sur l'`<img>` bascule vers les initiales (fichier référencé mais introuvable) |
| `js/page-joueurs.js` — `printFicheJoueur()` (~L1129-1141) | `pdf-slide-cover` : ajoute conditionnellement `<img class="pdf-cover-photo">` via `getPlayerPhoto(nom,'corps')`, aucune modification si absent |
| `js/page-joueurs.js` — nouveau | `toggleCourtPhoto()` + variable module `let _courtPhotoMode = false;` — bascule le contenu de `.court-container` (SVG terrain ↔ `<img>` corps entier + bouton retour). `selectJoueur()` remet `_courtPhotoMode = false` à chaque changement de joueur (décision Design §2) |
| `js/player-mode.js` (~L300) | Même pattern que `.jp-avatar` pour `.pmf-avatar` |
| `css/style.css` | Classes ajoutées par le Visual Crafter (`.jp-avatar-clickable`, `.court-back-btn`, `.court-photo-view`, `.pdf-cover-photo`) |

Aucun changement sur `js/supabase-client.js`, aucune nouvelle table, aucun impact sur le cycle Excel/import déjà en place — c'est le point clé de cette architecture : la feature est **totalement indépendante** du pipeline de données existant.

## 4. Nouvelles structures de données

Uniquement `PLAYER_PHOTOS` (objet JS statique, décrit ci-dessus). Aucune évolution de schéma Supabase.

## 5. Risques techniques (aperçu — détail Risk Analyst)

- **Poids des fichiers** : les 2 exemples fournis par Romain sont en résolution très haute (le corps entier notamment, plusieurs milliers de pixels de hauteur) — bundlés tels quels, chaque photo pèserait plusieurs Mo. À multiplier par ~20 joueurs × 2 formats = risque réel de ralentir le chargement de l'app et de gonfler le repo. **Contrainte à poser en critère d'acceptation d'une story dédiée** : redimensionner/compresser (ex. WebP, portrait ≤ 300px de large, corps entier ≤ 500px de large) avant de committer — cf. Risk Analyst.
- **Mapping oublié** : si Romain ajoute un fichier photo sans mettre à jour `PLAYER_PHOTOS`, rien ne casse (juste pas de photo affichée) — comportement sûr par construction.

## 6. Critère de bascule

Si un jour Romain veut que les **joueurs eux-mêmes** puissent uploader leur photo (self-service, plus de 30-40 entrées à maintenir à la main, ou photos changeant chaque saison en volume), alors migrer vers Supabase Storage + une colonne `photo_url`/`photo_corps_url` sur `player_profiles` devient justifié. Pas aujourd'hui : le volume et le mode d'ajout (Romain uniquement, manuel) ne le justifient pas.

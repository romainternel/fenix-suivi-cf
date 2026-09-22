# CLAUDE.md — FENIX Stats CF

## 1. Nom et objectif

**FENIX Stats CF** — application web de suivi statistique des joueurs du Centre de Formation Fenix Toulouse (handball, Starligue). Utilisée par le staff technique (Romain, responsable CF) pour analyser les matchs, suivre les joueurs individuellement, et par les joueurs eux-mêmes (mode lecture) pour consulter leurs propres statistiques.

## 2. Stack technique

Vanilla JS, zéro build, zéro framework. Un fichier HTML principal + modules JS chargés en `<script src>` classiques (pas de `type="module"`, tout partage le même scope global).

**Librairies externes (CDN, chargées avant les fichiers du projet) :**
- `xlsx.js` 0.18.5 — parsing des fichiers Excel source
- `Chart.js` 4.4.0 — graphiques (évolution notes)
- `PptxGenJS` 3.12.0 — export PowerPoint
- `html2canvas` 1.4.1 — capture des slides pour l'export PowerPoint
- `@supabase/supabase-js` 2.112.4 — client Supabase (auth, base de données)
- Google Fonts : Bebas Neue (titres), Inter (texte courant)

**Outillage local (`package.json`, devDependencies uniquement, jamais chargé côté app) :**
- `sharp` — redimensionnement/compression d'images (`scripts/process-player-photos.js`)
- `xlsx` — utilisé en scripts Node ponctuels, pas dans l'app elle-même

## 3. Structure des fichiers/dossiers

```
FENIX-HANDBALL-CF-SUIVI.html   Fichier principal (3735 lignes) : HTML de toutes les pages,
                                script inline (COLS, globals, auth, import Excel, boot Supabase,
                                terrain SVG, PDF/PPT export) + les tags <script src> versionnés
index.html                     Redirect immédiat vers FENIX-HANDBALL-CF-SUIVI.html (meta refresh)
favicon.png

css/style.css                  Tous les styles (2862 lignes) — tokens couleur/ombre en :root

js/
  supabase-client.js  (285 l.)  Client Supabase, chargement boot (loadFromSupabase), migration
                                 locale→Supabase (STORY-23), comptes joueurs (Edge Functions)
  utils.js            (244 l.)  matchPlayerName() (résolution floue de nom, cache), getEffColor(),
                                 getTJData()/findTJEntry(), detectIsGB()
  player-photos.js     (44 l.)  PLAYER_PHOTOS (mapping nom→photo) + getPlayerPhoto() + préchargement
  impact-images.js      (4 l.)  Constantes images terrain (ALG/ALD)
  page-joueurs.js    (1793 l.)  Page Joueurs : terrain SVG interactif, fiche joueur, export PDF/PPT
  page-notes-graph.js (794 l.)  Page Notes (table GB) + graphique évolution (Chart.js)
  page-analyse.js    (2817 l.)  Page Analyse : timeline, familles d'enclenchement, onglet Gardien,
                                 éditeurs Familles/Bilans, notes coach
  player-mode.js     (1843 l.)  Mode Lecture Joueur (mobile) : Ma Fiche, Stats Match, Impact

assets/photos/                 Photos joueurs (WebP, portrait + corps entier), ajoutées à la main
                                — voir §5 pour le mapping. Fichiers sources bruts (haute résolution,
                                dossier "PHOTO JOUEURS/" côté Romain) volontairement hors repo (.gitignore)

ALD.png, ALG.png, TERRAIN HB TIR.png
                                Images terrain/zones utilisées par les canvas Impact

supabase/
  schema.sql                   Schéma des 7 tables (voir §5)
  seed-famille-mapping.sql     Seed initial de famille_mapping
  functions/
    create-player-account/     Edge Function Deno — création compte Supabase Auth + player_profiles
    delete-player-account/     Edge Function Deno — suppression symétrique

scripts/process-player-photos.js  Utilitaire Node (sharp) — redimensionne/compresse les photos
                                    brutes vers assets/photos/, pas exécuté par l'app

docs/                           Documentation du workflow BMAD (voir §9) :
  brief.md, prd.md              Derniers Analyst/PM en date (écrasés à chaque nouveau cycle /construire,
                                 anciens cycles archivés dans docs/archive/[feature]/)
  design/, visual/, arch/, risks/[feature].md   Un fichier par feature (jamais écrasés)
  stories/STORY-N-*.md           32 stories numérotées en continu (STORY-01 à STORY-32) + 3 fichiers BACKLOG*.md
  code-review/, qa/, e2e/, security/   Rapports du squad de contrôle, un par story/feature
  regression/checklist.md        Checklist vivante Critique/Important/Secondaire
  regression/audit-complet-*.md  Rapports d'audit complet (Regression Guardian + E2E Tester)
  archive/                       Anciens cycles brief/prd remplacés

package.json, package-lock.json   devDependencies (sharp, xlsx) — jamais chargées par l'app
.gitignore                        node_modules/, supabase/.temp/, PHOTO JOUEURS/
```

## 4. Conventions de code

- **Nommage HTML/CSS** : IDs et classes en kebab-case (`#filter-joueur-match`, `.jp-avatar`). Préfixes courts par module : `jp-*` (Joueurs), `pmf-*`/`pm-*` (Player Mode), `enc-*` (Enclenchements), `court-*` (terrain SVG).
- **Fonctions JS** : camelCase. Fonctions privées à un module préfixées `_` (`_renderCourtPhotoState`, `_getJoueurBilanMatchs`).
- **Cache-busting** : chaque déploiement incrémente `?v=N` sur les **9** balises `<link>`/`<script>` du projet (css/style.css + les 8 fichiers `js/*.js`) — jamais sur les CDN externes. Version actuelle : **v308**.
- **Résolution de nom joueur** : ne jamais comparer deux noms de joueur par égalité stricte. Le format court "Prénom.Initiale" (ex. `Lucas.G`) coexiste avec des colonnes Excel ne contenant que le prénom (ex. colonne `Gardien`) — toujours passer par `matchPlayerName(a, b)` (`js/utils.js`), qui gère ce cas et met en cache le résultat.
- **Constantes de configuration maintenues à la main** : `POSTE_POSITIONS`, `GB_ZONE_WEIGHTS`, `EFF_SEUILS`, `PLAYER_PHOTOS` — objets JS statiques édités directement dans le code (par Romain ou en session), pas de table Supabase ni d'UI d'admin pour ces réglages ponctuels.
- **Import Excel = remplacement complet** : chaque import Excel supprime et réinsère entièrement `match_data`/`joueurs`/`tableau_match`/`bilan` sur Supabase. Ne jamais stocker une donnée éditée en base (famille, note coach, compte joueur) sur une structure qui serait recréée par l'import — toujours une table séparée (`famille_mapping`, `coach_analyses`, `player_profiles`) ou un fichier hors pipeline (`player-photos.js`).

## 5. Stockage des données

### Supabase (Postgres, projet `oamldfduxwsghrxdsaxy`) — source de vérité depuis STORY-20/21 (v240-241)

7 tables, RLS activée avec policies permissives sur toutes (accès mono-utilisateur staff via clé publishable, pas de modèle de permission différencié — voir §6) :

| Table | Rôle | Remplacée à chaque import Excel ? |
|---|---|---|
| `match_data` | Une ligne par action de jeu (36 colonnes, cf. `COLS` dans le HTML — dont `articulation_def`/`p1`-`p6` (défense, ajoutées en v257/STORY-33, exploitées depuis v258/STORY-34) et `articulation_att`/`att_alg`/`att_arg`/`att_dc`/`att_ard`/`att_ald`/`att_pvt` (attaque FENIX, ajoutées en v282/STORY-47) | Oui |
| `joueurs` | `nom` (clé), `poste`, `saison`, `nom_complet` | Oui |
| `tableau_match` | Temps de jeu par match/joueur | Oui |
| `bilan` | Périodes de saison (saison, nom, journée fin) | Oui |
| `famille_mapping` | `intention_attaque` → `famille` (classification tactique) | **Non** — éditée dans l'app |
| `coach_analyses` | Note libre du coach par match (`match_key`, `contenu`) | **Non** |
| `player_profiles` | Lien `auth.users.id` ↔ `nom`/`poste` (pas de mot de passe stocké ici) | **Non** |

Client : `js/supabase-client.js` (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` en clair — clé publishable, RLS permissive, pas un secret). Chargement boot via `loadFromSupabase()` (7 fetch en parallèle) déclenché au `DOMContentLoaded`.

**Colonnes `resultat` (`COLS.resultat = 6`) vs `finalite` (`COLS.finalite = 8`)** — deux classifications distinctes de l'issue d'une action, souvent confondues car proches : `resultat` est la classification "brute" (5 valeurs vues en base : `But`, `Tir raté`, `PB`, `PO`, `Jet franc`), utilisée partout pour les stats FENIX et les stats génériques (dashboard, fiches joueurs). `finalite` est la même classification vue **du point de vue défensif/gardien** — sur les lignes adverses, elle porte les mêmes valeurs que `resultat` (`But`, `PB`, `PO`, `Jet franc`, vérifié par requête directe sur `match_data`) **sauf pour les tirs manqués**, où elle distingue `Tir arrêté` (arrêt gardien), `Tir non cadré`, `Tir contré`, `Poteau` — 4 sous-catégories que `resultat` regroupe toutes sous `Tir raté`. Une variante orthographique `PF` (2 lignes vues) existe pour `PB` côté `finalite` — à regrouper avec `PB`, pas une vraie 6e catégorie. Le mode Articulation (`_articBlockDetail`, `js/page-analyse.js`) et les stats gardien lisent `finalite` sur les lignes adverses précisément pour cette granularité ; le reste de l'app (stats FENIX, dashboard) lit `resultat`.

**Colonne `intention_attaque`** (`COLS.intention_attaque = 21`) est la source de classification tactique principale — remplace l'ancienne colonne `enclenchement` (texte libre, `COLS.enclenchement = 9`) pour ce rôle. `getEncFamille()` (`js/page-analyse.js`) résout une valeur `intention_attaque` en famille via `famille_mapping`, avec un filet de sécurité `_ENC_FAMILLE_CUSTOM` (localStorage) pour les valeurs non encore classifiées. **`enclenchement` reste activement utilisée ailleurs** (vérifié dans le code, 3 usages) : réponses du Chat IA rule-based, tableau de détail niveau 2 (répartition brute *dans* une intention_attaque sélectionnée, `_buildEncIntentionDetailTable`), et colonne "avancée" du tableau détaillé des actions — à ne pas supprimer du schéma.

### Variables globales en mémoire (déclarées dans le HTML, partagées par tous les fichiers `js/*.js`)

`DATA`, `MATCHS`, `SAISONS`, `JOUEURS_TERRAIN` (reconstruit à chaque chargement depuis `joueurs`, positions assignées par pool `POSTE_POSITIONS`), `GARDIENS_FENIX` (dérivé), `TEMPS_JEU`, `BILANS`, `PLAYER_PROFILES`, `FAMILLE_MAPPING`, `coachAnalyses`, `currentSelectedJoueur`, `PLAYER_SESSION`.

### Photos joueurs (`js/player-photos.js`, hors Supabase — voir §4)

`PLAYER_PHOTOS` : objet statique `{ nomCanonique: { portrait, corps } }`, maintenu à la main, **volontairement séparé de `JOUEURS_TERRAIN`** (qui est recréé à chaque import). 18 des 21 joueurs actuels ont une photo (Roman.L, Yoran.C, Zacharie.D n'en ont pas encore — repli initiales). Fichiers en `assets/photos/`, WebP, préchargés au boot du script.

### localStorage / sessionStorage résiduels

| Clé | Usage |
|---|---|
| `sessionStorage.fenix_session` | Session courante (`{role: 'staff'\|'joueur', nom}`) |
| `localStorage.fenix_data_date`, `fenix_data_filename` | **Actifs** — alimentent le badge "source" affiché dans l'en-tête et le menu mobile joueur (Supabase ne trace pas qui/quand a fait le dernier import ; repli sur la dernière valeur connue localement sur cet appareil, sinon libellé générique "Supabase") |
| `localStorage.fenix_data`, `fenix_temps_jeu`, `fenix_bilan_rows`, `fenix_joueurs_terrain` | **Vestiges morts** — encore écrits par `processFile()` à chaque import mais jamais relus nulle part (aucun `getItem` dans tout le code). `fenix_data` sérialise le dataset `DATA` complet en JSON à chaque import pour rien — candidat évident à un nettoyage |
| `localStorage.fenix_coach_analyses`, `fenix_player_accounts`, `enc_famille_custom` | Données locales pré-migration (STORY-23) — lues uniquement par le flux de migration one-shot vers Supabase |
| `localStorage.fenix_supabase_migrated` | Flag : migration locale déjà proposée/faite |
| `sessionStorage.an_active_tab`, `pm_active_tab` | Onglet actif mémorisé (page Analyse / mode joueur) |

## 6. Authentification et rôles

Deux rôles, un seul écran de connexion (`checkLogin()`, async) :

- **Staff** : mot de passe unique `"Partage"` (en dur dans le code) → `PLAYER_SESSION = {role: 'staff'}`. Accès à toutes les pages, aux éditeurs (Familles/Bilans/Comptes), à l'import Excel.
- **Joueur** : sélection du nom dans un menu déroulant (peuplé depuis `JOUEURS_TERRAIN`) + mot de passe → `supabaseClient.auth.signInWithPassword()` sur un compte Supabase Auth interne (email synthétique `{nom-normalisé}@fenix.local`, jamais un vrai email). Comptes créés/supprimés via les Edge Functions `create-player-account`/`delete-player-account` (clé `service_role`, jamais exposée côté client). Bascule automatique en Mode Lecture Joueur.

**RLS** : activée sur les 7 tables mais avec policies `for all using (true)` — aucune séparation de droits au niveau base, tout accès applicatif passe par la clé publishable. Le mode joueur ne restreint l'accès qu'au niveau UI (pages/actions masquées), pas au niveau base de données. *(Décision actée consciemment, cf. §10 — pas une lacune.)*

## 7. Hébergement et déploiement

- **Prod** : https://romainternel.github.io/fenix-suivi-cf/FENIX-HANDBALL-CF-SUIVI.html — GitHub Pages, mise à jour automatique après un `git push` sur `master` (délai ~1-2 min)
- **Repo** : https://github.com/romainternel/fenix-suivi-cf
- **Backend** : Supabase (projet `oamldfduxwsghrxdsaxy`), console web pour les migrations SQL/Edge Functions — pas de CLI Supabase configurée en permanence (PAT généré ponctuellement pour un déploiement d'Edge Function, jamais stocké)
- Pas de CI/CD — déploiement = push direct

## 8. Contraintes spécifiques

- **Appareil cible** : staff sur desktop/iPad (terrain interactif, éditeurs), joueurs sur mobile (Mode Lecture Joueur, testé à 375px)
- **Poids des assets** : les photos joueurs brutes fournies par Romain sont en très haute résolution (jusqu'à 67 Mpx) — toujours passer par `scripts/process-player-photos.js` avant d'ajouter une nouvelle photo à `assets/photos/` (cible : portrait natif ≤ 512px, corps entier ≤ 2000px de haut, WebP)
- **Casse des noms de fichiers** : développement sous Windows (insensible à la casse) mais hébergement GitHub Pages sur Linux (sensible à la casse) — toujours vérifier un asset ajouté directement sur la prod déployée, pas seulement en local
- **Export PDF** : `window.print()` — non pilotable par Playwright (bloque sur une boîte de dialogue native), à valider manuellement. L'export PowerPoint (`exportJoueurPPT()`, html2canvas) est lui automatisable et n'a pas cette limite
- **Offline** : pas de service worker/PWA — nécessite une connexion pour charger les données Supabase au boot

## 9. État d'avancement

**Fonctionnel et en production (v281) :**
- [x] Import Excel → Supabase (remplacement complet des 4 tables de données)
- [x] Dashboard, page Analyse (5 onglets internes : Résumé/Timeline/Intention attaque/Gardien/Chat IA)
- [x] Page Joueurs : terrain interactif (photos ou initiales), fiche staff, sous-onglets Fiche/Notes/Graphique/Impact
- [x] Page Impact : zones de tir joueur de champ et gardien, mode comparaison
- [x] Mode Lecture Joueur mobile (Ma Fiche/Stats Match/Impact), authentification Supabase Auth. **v306** : carte "NOTE GB" retirée de "Ma Fiche" pour un gardien (retour Romain : score pas assez représentatif pour être montré tel quel au joueur) — reste affichée côté staff (fiche Joueurs, page Notes). **v307** : badges de classement ("#N au poste"/"#N TJ au poste", fiche staff `js/page-joueurs.js` et "Ma Fiche" `js/player-mode.js`) — l'emoji médaille + texte "#N" séparé remplacé par une pastille ronde colorée or/argent/bronze avec le chiffre dedans (`_rankMedalHTML(rank)`, `js/utils.js`, classes `.rank-medal`/`.rank-medal-{gold,silver,bronze}`), plus lisible en petite taille. Uniquement les badges **affichés à l'écran** — les mêmes badges dans l'export PowerPoint (`pptBadges`, texte brut dans un slide PptxGenJS, pas de HTML/CSS possible) restent au format emoji+"#N". **v308** : correctif d'alignement — la pastille `.rank-medal` (v307) était `inline-flex` mais son parent (`.pmf-badge` en CSS, span inline côté staff) était `inline-block`, avec un hack `vertical-align:-3px` sur la pastille qui ne recentrait pas correctement sur toutes les tailles de police ; passage du badge parent lui-même en `inline-flex; align-items:center` (`.pmf-badge` dans `css/style.css`, span inline dans `js/page-joueurs.js`) pour que pastille et texte se centrent sur le même axe, `vertical-align` retiré de `.rank-medal` (sans effet dans un parent flex)
- [x] Classification tactique par `intention_attaque` + éditeur de familles en app (`famille_mapping`)
- [x] Éditeur de bilans en app
- [x] Notes coach par match (Supabase, multi-appareil)
- [x] Comptes joueurs (création/suppression via Edge Functions)
- [x] Export PDF (impression) et PowerPoint de la fiche joueur
- [x] Photos joueurs : avatar portrait (fiche + mode joueur), terrain avec photos, bascule directe vers la photo corps entier, couverture d'export avec photo corps entier (18/21 joueurs couverts)
- [x] Migration locale → Supabase (one-shot, pour les données antérieures à la migration)
- [x] Articulation défensive : import des colonnes Excel (`articulation_def`/`p1`-`p6`) + mode "Articulation" (demi-terrain par poste, dispositifs 0-6/1-5) dans la section Intention attaque, vue match et saison
- [x] Thème sombre (v287-292, migration page par page en cours) : bascule manuelle (bouton dans le header, `toggleAppTheme()`, persistée `localStorage.fenix-theme`). Fond de page (`body`) global dès qu'active ; composants adaptés page par page pour l'instant : **Dashboard** (v287-289 puis re-coloré v292 : cartes équipe, barre matchs, tableau joueurs — en-tête collant + chiffres tabulaires en prime, les 2 thèmes) et **Joueurs** (v290 puis re-coloré v292 : fiche joueur `.joueur-panel`/`.jp-*`, tableau détail par match `#joueur-matches`/`.jm-*`). Palette dark **alignée sur le code couleur exact d'une app de référence** (demande explicite de Romain, "même code couleur") via des tokens `--dk-*` définis dans `[data-theme="dark"]` : `--dk-bg:#071322 --dk-panel:#0D1F33 --dk-panel2:#14304C --dk-line:#21456B --dk-line2:#2E5A85 --dk-text:#E9F2FA --dk-mut:#8CA6C2 --dk-accent:#31CBE8 --dk-red:#F0685F` — remplace l'accent bleu-marque FENIX utilisé un temps en v287-291. Pages non encore migrées (Analyse, Notes, Impact) : contenu inchangé même bascule activée, seul le fond de page devient sombre derrière (état transitoire assumé). Chaque sélecteur est vérifié un par un (grep) avant ajout pour éviter qu'une classe partagée entre pages ne déborde (incident réel corrigé en v289, cf. historique git). **Bandeau/nav restructuré en v291** (2 lignes : logo+actions puis onglets soulignés `role="tablist"`) pour se rapprocher de l'architecture à onglets de l'app de référence — le soulignement de l'onglet actif utilise directement `#31CBE8` (toujours visible, hors scope `[data-theme="dark"]`). **Fond du bandeau recoloré en v294** (retour utilisateur : "le fond bleu est différent" / "bleu sur bleu on voit rien" — le dégradé `--fenix-blue`→`--fenix-blue-light` manquait de contraste avec le texte clair semi-transparent) : `.header` utilise directement `linear-gradient(135deg, #071322 0%, #0D1F33 100%)`, toujours visible comme le soulignement cyan, pas seulement en `[data-theme="dark"]` — c'est désormais l'identité permanente du bandeau, plus une couleur de marque FENIX distincte du reste de l'app. **v295** : 2 titres oubliés lors du recoloriage Dashboard (v287-289/v292) restaient en `var(--fenix-blue)` (bleu marque, texte) sur fond `--dk-panel` (bleu nuit, fond) — même défaut que le bandeau, repéré par Romain sur capture ("bleu sur bleu on voit rien") : `.matchs-bar-title` ("MATCHS ANALYSÉS") et `.team-card.fenix .team-card-header h3` ("FENIX TOULOUSE") passent en blanc (`--dk-text`) en dark mode. **Sous-navigation Joueurs aplatie en v293** (demande Romain, "Toute la structure, pas juste le style") : Fiche/Notes/Graphique/Impact sont maintenant 4 vrais onglets pairs (`.jsub-btn`, même style souligné cyan que le bandeau principal, `role="tablist"`), remplaçant l'ancien mélange de 2 onglets + 2 boutons d'action contextuels qui ouvraient `page-notegraph` en modal plein écran (`position:fixed`, fond assombri, fermeture au clic extérieur via `ngGoBack()`). `page-notegraph` est désormais une page normale comme les autres (`display:none/block`, plus de position fixe) ; la logique de pré-remplissage (joueur/gardien sélectionné → filtre du graphique ou de l'impact) est conservée, déplacée dans `switchJoueursTab()`. Le raccourci « rouvrir le détail Notes en revenant du graphique » (`_ngFromDetail`) est conservé mais se déclenche désormais au clic sur l'onglet Notes plutôt que via un bouton "← Retour" dédié, supprimé avec `ngGoBack()`. **Page Analyse traitée en v296** : contrairement à Joueurs, ses sous-onglets (`.an-tabs`/`.an-tab-btn`, "Vue d'ensemble/Tactique/Notes & Outils" en vue match, "Tactique/Tendances" en vue saison) avaient déjà une vraie architecture d'onglets (`role="tablist"`, `_analyseTab()` gère `.active`/`aria-selected`/affichage panel proprement) — uniquement un restyling CSS était nécessaire (pastille pleine bleu marine → soulignement cyan, même motif que le bandeau et la sous-nav Joueurs), aucun changement JS/HTML. **Thème sombre étendu à la page Notes en v297** (3e page traitée après Dashboard/Joueurs) : `#page-notes` (+ `#section-notes-gb`, imbriquée dedans) et sa modale de détail `#notes-detail-modal` (hors de `#page-notes` dans le DOM, scopée par son propre ID) — tables génériques (`table`/`th`/`td`) et `.section` systématiquement scopées par `#page-notes` pour éviter une fuite vers d'autres pages (cf. incident v289). Un `<div>` de séparation de période avait son style codé en dur inline (`style="color:#1E3A8A..."`, généré par `updateNotesPage()`) — extrait en classe `.notes-period-label` pour permettre l'override dark. **Graphique et Impact traités en v298** (5e/6e pages) : `#page-notegraph` (carte + bordures) et `#page-impact` (`.section`/`.pmz-filter-item`, scopés par ID). Chart.js fige ses couleurs à la création — contrairement au reste de l'app (CSS pur), la bascule de thème ne recolore pas un graphique déjà affiché : `_chartDarkColors()` (`js/page-notes-graph.js`) calcule une petite palette (texte/grille/tick neutre) réutilisée dans `updateNoteGraph()`/`updateGbGraph()`, et `toggleAppTheme()` réinvoque ces fonctions si la page Graphique est ouverte au moment du clic. Le calque photo d'Impact (court + points de tir colorés) est théme-agnostique, aucun changement nécessaire. Deux bugs de contraste corrigés au passage (texte codé en dur, invisibles indépendamment du thème sombre) : `#ng-empty-state` (blanc à 50% sur fond blanc) et `#impact-eff`/`#impact-buts`/`#impact-total` (quasi-noir, cas où aucune donnée). **Incident v303 → corrigé en v304** : un commentaire CSS contenant littéralement `*/` au milieu du texte (`.enc-*/.artic-*`) a fermé le commentaire en plein milieu — le texte français restant (avec apostrophes) s'est retrouvé interprété comme du CSS, ouvrant une chaîne de caractères jamais refermée qui a avalé ~700 règles du fichier (dont `#login-screen.hidden`, cassant la fermeture de l'écran de connexion). Leçon : **ne jamais écrire `*/` (astérisque suivi d'un slash) à l'intérieur du texte d'un commentaire CSS**, même involontairement via une notation type `.classe-*/.autre-*` — vérifier après coup que `(css.match(/\/\*/g)||[]).length === (css.match(/\*\//g)||[]).length`.

**Page Analyse — traitée en v301-303** (7e page, la plus grosse — plusieurs passes) : bandeau sticky, bloc "Terrain & Comparatif" (v301), onglets "Vue d'ensemble"/"Notes & Outils" (v301), fond blanc résiduel du conteneur `.section` partagé corrigé via un ID dédié `#analyse-tabs-section` (v302), et l'onglet "Tactique" — cartes familles d'enclenchement, articulation attaque/défense, section Gardien (`.enc-*`/`.artic-*`, v303). **Canvas recolorés en v305** (`js/page-analyse.js`, helper `_encCanvasIsDark()` — même principe que `_chartDarkColors()` en v298) : camembert (`_drawEncPie()`, labels périphériques), matrice 2×2 (`_drawEncMatrix()`, fonds d'étiquettes + légendes d'axes + libellés de zone), mini heatmap gardien (`_drawMiniZoneCanvas()`). `toggleAppTheme()` réinvoque `_drawEncChart()` si la page Analyse est active au moment du clic. Le terrain d'articulation (SVG, `_articCourtSvg()`) et le nuage de tirs `#terrain-canvas`/`drawTerrainDots()` n'ont pas besoin de traitement : fond coloré fixe ou photo, points colorés, aucun texte dessiné dessus qui dépendrait du thème — déjà théme-agnostiques. Timeline `#timeline-canvas` déjà lisible tel quel (vérifié v301). Thème sombre de l'appli considéré complet à ce stade
- [x] Articulation offensive (STORY-47/48, v284 ; règle de comptage `_articAttCounts` affinée en v285) : mode "Articulation" cliquable aussi côté ⚡ Attaque — demi-terrain 6 postes (ALG/ARG/DC/ARD/ALD/PVT), formule directe (pas d'inversion), groupements "6 complet"/"Base arrière", classement des compositions observées. État (`_articAtt*`) séparé de l'état défense (`_artic*`), jamais partagé. **Règle de comptage** : un tir (But/Tir raté) compte toujours quel que soit le tag `Possession` (sans objet pour un % de réussite au tir) ; un sous-événement (PB/PO/Jet franc/2' obt/Pen) reste filtré par ce tag (dédoublonnage de séquence)

**En attente / non couvert :**
- [ ] Classement automatique des meilleures charnières centrales P2-P5 (STORY-35, à venir)
- [ ] Photos pour 3 joueurs (Roman.L, Yoran.C, Zacharie.D) — dépend de Romain
- [ ] Chat IA de la page Analyse encore *rule-based* (pas connecté à l'API Claude — backlog historique, jamais priorisé)

## 10. Décisions techniques actées / roadmap

- **RLS permissive assumée** (§6) : pas de séparation de droits base par rôle, mono-utilisateur staff via clé publishable. Décision actée dès STORY-20, pas un TODO.
- **Pas de Supabase Storage pour les photos joueurs** : fichiers statiques bundlés dans le repo plutôt qu'un bucket, faute de besoin d'upload utilisateur (Romain ajoute les fichiers lui-même). Réévaluer seulement si les joueurs devaient un jour uploader leur propre photo (cf. `docs/arch/photos-joueurs.md` §6, critère de bascule explicite).
- **`enclenchement` (colonne Excel legacy, `COLS` index 9)** : ne sert plus à la classification tactique principale (rôle repris par `intention_attaque`), mais reste activement lue à 3 endroits (Chat IA, drill-down niveau 2, colonne avancée) — ne pas retirer du schéma ni traiter comme morte.
- **localStorage `fenix_data`/`fenix_temps_jeu`/`fenix_bilan_rows`/`fenix_joueurs_terrain`** (§5) : confirmé mortes (écrites à chaque import, jamais relues). Nettoyage possible (retirer les `setItem` correspondants dans `processFile()`) mais sans urgence — aucun impact fonctionnel observé, juste du localStorage gaspillé. `fenix_data_date`/`fenix_data_filename` restent nécessaires (badge source), à ne pas toucher.
- **Export PDF non testable en automatisé** (§8) : limitation connue et acceptée, pas de plan de contournement (changer `window.print()` pour un autre mécanisme casserait l'UX d'impression native).

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
- **Cache-busting** : chaque déploiement incrémente `?v=N` sur les **8** balises `<link>`/`<script>` du projet (css/style.css + les 7 fichiers `js/*.js`) — jamais sur les CDN externes. Version actuelle : **v258**.
- **Résolution de nom joueur** : ne jamais comparer deux noms de joueur par égalité stricte. Le format court "Prénom.Initiale" (ex. `Lucas.G`) coexiste avec des colonnes Excel ne contenant que le prénom (ex. colonne `Gardien`) — toujours passer par `matchPlayerName(a, b)` (`js/utils.js`), qui gère ce cas et met en cache le résultat.
- **Constantes de configuration maintenues à la main** : `POSTE_POSITIONS`, `GB_ZONE_WEIGHTS`, `EFF_SEUILS`, `PLAYER_PHOTOS` — objets JS statiques édités directement dans le code (par Romain ou en session), pas de table Supabase ni d'UI d'admin pour ces réglages ponctuels.
- **Import Excel = remplacement complet** : chaque import Excel supprime et réinsère entièrement `match_data`/`joueurs`/`tableau_match`/`bilan` sur Supabase. Ne jamais stocker une donnée éditée en base (famille, note coach, compte joueur) sur une structure qui serait recréée par l'import — toujours une table séparée (`famille_mapping`, `coach_analyses`, `player_profiles`) ou un fichier hors pipeline (`player-photos.js`).

## 5. Stockage des données

### Supabase (Postgres, projet `oamldfduxwsghrxdsaxy`) — source de vérité depuis STORY-20/21 (v240-241)

7 tables, RLS activée avec policies permissives sur toutes (accès mono-utilisateur staff via clé publishable, pas de modèle de permission différencié — voir §6) :

| Table | Rôle | Remplacée à chaque import Excel ? |
|---|---|---|
| `match_data` | Une ligne par action de jeu (29 colonnes, cf. `COLS` dans le HTML — dont `articulation_def`/`p1`-`p6`, ajoutées en v257/STORY-33, exploitées par le mode "Articulation" de la page Analyse depuis v258/STORY-34) | Oui |
| `joueurs` | `nom` (clé), `poste`, `saison`, `nom_complet` | Oui |
| `tableau_match` | Temps de jeu par match/joueur | Oui |
| `bilan` | Périodes de saison (saison, nom, journée fin) | Oui |
| `famille_mapping` | `intention_attaque` → `famille` (classification tactique) | **Non** — éditée dans l'app |
| `coach_analyses` | Note libre du coach par match (`match_key`, `contenu`) | **Non** |
| `player_profiles` | Lien `auth.users.id` ↔ `nom`/`poste` (pas de mot de passe stocké ici) | **Non** |

Client : `js/supabase-client.js` (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` en clair — clé publishable, RLS permissive, pas un secret). Chargement boot via `loadFromSupabase()` (7 fetch en parallèle) déclenché au `DOMContentLoaded`.

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

**Fonctionnel et en production (v258) :**
- [x] Import Excel → Supabase (remplacement complet des 4 tables de données)
- [x] Dashboard, page Analyse (5 onglets internes : Résumé/Timeline/Intention attaque/Gardien/Chat IA)
- [x] Page Joueurs : terrain interactif (photos ou initiales), fiche staff, sous-onglets Fiche/Notes/Graphique/Impact
- [x] Page Impact : zones de tir joueur de champ et gardien, mode comparaison
- [x] Mode Lecture Joueur mobile (Ma Fiche/Stats Match/Impact), authentification Supabase Auth
- [x] Classification tactique par `intention_attaque` + éditeur de familles en app (`famille_mapping`)
- [x] Éditeur de bilans en app
- [x] Notes coach par match (Supabase, multi-appareil)
- [x] Comptes joueurs (création/suppression via Edge Functions)
- [x] Export PDF (impression) et PowerPoint de la fiche joueur
- [x] Photos joueurs : avatar portrait (fiche + mode joueur), terrain avec photos, bascule directe vers la photo corps entier, couverture d'export avec photo corps entier (18/21 joueurs couverts)
- [x] Migration locale → Supabase (one-shot, pour les données antérieures à la migration)
- [x] Articulation défensive : import des colonnes Excel (`articulation_def`/`p1`-`p6`) + mode "Articulation" (demi-terrain par poste, dispositifs 0-6/1-5) dans la section Intention attaque, vue match et saison

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

# Architecture — Migration Supabase

**Agent :** Architect
**Date :** 2026-08-28

---

## 1. Décision technique

### 1.1 Intégration du client Supabase
Aucun build, aucun bundler dans ce projet (fichier HTML unique + fichiers `js/*.js` chargés en `<script>` classiques) — on ne change pas ça. Le client `@supabase/supabase-js` v2 s'ajoute en CDN, exactement comme `XLSX` et `Chart.js` le sont déjà aujourd'hui — **version épinglée exacte**, cohérent avec la convention déjà en place pour les autres CDN de ce projet (pas de `@2` flottant) :
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/dist/umd/supabase.min.js"></script>
```
Nouveau fichier `js/supabase-client.js` (chargé après ce script, avant les autres `js/*.js` qui en dépendent) : initialise `const supabase = window.supabase.createClient(URL, ANON_KEY)` et expose un petit nombre de fonctions utilitaires (`fetchAll()`, `replaceTable(nom, lignes)`, `upsertRows(table, lignes)`) — pas de couche d'abstraction générique, juste ce dont ce projet a besoin.

**URL et clé anonyme embarquées en clair dans le HTML statique** — c'est la seule option possible sans backend/serveur (GitHub Pages), et c'est le fonctionnement prévu par Supabase pour la clé anonyme (elle est faite pour être publique ; la vraie protection est la Row Level Security côté base, pas le secret de la clé). À ne surtout pas confondre avec la `service_role` key, qui elle ne doit **jamais** apparaître côté client — cette dernière n'est utilisée nulle part dans ce projet.

### 1.2 Modèle d'accès et sécurité (RLS)
Décision actée (PRD §0) : pas de nouveau modèle de permissions côté **staff**, accès mono-utilisateur multi-appareils, niveau de sécurité de l'authentification staff volontairement inchangé. Traduction technique : les policies RLS Supabase sur `match_data`/`joueurs`/`tableau_match`/`bilan`/`famille_mapping`/`coach_analyses` sont **permissives** (lecture/écriture ouvertes à quiconque possède la clé anonyme) — le mot de passe partagé "Partage" reste la seule porte d'entrée côté staff, gérée entièrement côté app, pas au niveau de la base.

**Ce que ça change réellement par rapport à aujourd'hui** : avant cette migration, il n'existait tout simplement aucun backend partagé — impossible d'accéder aux données de Romain sans son navigateur. Après, quiconque trouve la clé anonyme (visible dans le code source de la page, publique par nature) peut lire/écrire directement dans ces tables, en contournant totalement le mot de passe applicatif staff. Ce n'est pas une régression du niveau de protection déjà existant côté staff (déjà contournable, aucune vraie sécurité serveur avant), mais c'est une **exposition nouvelle** pour ces données précises (une base de données réelle et partagée, désormais atteignable). Accepté pour ce cycle côté staff (scope confirmé par Romain) — **mais pas pour les comptes joueurs, révisé en 1.2bis suite à sa demande du 2026-08-28.**

### 1.2bis Authentification joueurs — révisé : Supabase Auth plutôt qu'une table en clair
**Changement de décision** (demande explicite de Romain après lecture du risque R2) : les comptes joueurs n'utilisent plus une table `player_accounts` avec mot de passe en clair, mais le système d'authentification natif de Supabase (`auth.users`), qui ne stocke jamais de mot de passe en clair et n'est pas lisible via la clé anonyme.

**Contrainte technique à gérer** : Supabase Auth identifie chaque compte par un email, pas par un simple nom. Les joueurs n'ont pas d'email dans ce contexte (ils se connectent aujourd'hui avec juste "nom + mot de passe") — on génère un **email interne fictif** à la création (ex. `lucas.g@fenix.local`, dérivé du `nom` de la feuille `Joueurs`), totalement invisible pour le joueur : il continue de saisir uniquement son nom, l'app reconstruit l'email correspondant en interne avant d'appeler Supabase.

**Contrainte technique plus importante : la création d'un compte ne peut pas se faire directement depuis le navigateur de Romain.** Deux raisons :
1. `supabase.auth.signUp()` appelé depuis le client **connecterait automatiquement le navigateur de Romain en tant que ce nouveau joueur**, remplaçant sa propre session dans le client Supabase.
2. Créer un compte "au nom de quelqu'un d'autre" sans passer par le flux d'inscription normal nécessite l'API d'administration Supabase (`admin.createUser()`), qui exige la clé `service_role` — **cette clé ne doit jamais apparaître côté client**, donc jamais dans ce fichier HTML statique.

**Solution retenue : une Supabase Edge Function.** Une petite fonction serveur (hébergée par Supabase lui-même, pas un serveur à gérer côté projet) reçoit `{nom, motDePasse}` depuis l'app (appelée avec la clé anonyme, comme n'importe quelle requête), et c'est **elle seule** qui détient la clé `service_role` (stockée comme secret d'environnement Supabase, jamais exposée) pour appeler `admin.createUser()` côté serveur. C'est la seule pièce de ce projet qui n'est pas un fichier statique servi par GitHub Pages — elle est déployée et hébergée entièrement par Supabase (`supabase functions deploy`), pas de serveur supplémentaire à maintenir.

```
Navigateur (Romain, clé anonyme)
   │  POST { nom: "Lucas.G", motDePasse: "..." }
   ▼
Edge Function "create-player-account" (Supabase, clé service_role en secret serveur)
   │  admin.createUser({ email: "lucas.g@fenix.local", password, email_confirm: true })
   ▼
auth.users (Supabase) — mot de passe jamais en clair, jamais lisible via la clé anonyme
```

**Connexion joueur** (`checkLogin()` côté joueur) : devient `supabase.auth.signInWithPassword({ email: emailGénéré(nom), password })` — appel direct depuis le client avec la clé anonyme, c'est le fonctionnement normal et prévu de Supabase Auth, aucun problème de sécurité ici (contrairement à la création de compte).

**Réglage de projet requis** : désactiver l'exigence de confirmation par email dans les paramètres Supabase Auth (Authentication → Providers → Email → "Confirm email" décoché), sinon un compte créé via `email_confirm: true` dans l'Edge Function reste malgré tout bloqué selon la configuration — à vérifier en pratique lors de STORY-20.

**Suppression d'un compte** : même contrainte que la création — `admin.deleteUser()` nécessite aussi la clé `service_role`, donc ne peut pas non plus être appelé directement depuis le client. Deux options pour le Developer : une seconde action sur la même Edge Function (`{action: 'create'|'delete', ...}`) ou une fonction dédiée `delete-player-account` — détail d'implémentation, pas une décision d'architecture qui change la structure.

**Table `player_profiles` conservée** (voir schéma §1.3) — pas pour le mot de passe (géré par `auth.users`), mais pour relier un compte Auth (UUID) au joueur FENIX correspondant (nom, poste) : Supabase Auth ne connaît que l'email/UUID, pas "c'est Lucas, Arrière Gauche".

### 1.3 Schéma de données — colonnes nommées, pas de blob JSONB
Une ébauche antérieure envisageait une table unique stockant chaque feuille Excel sous forme de JSONB brut (tableau de tableaux, tel que `XLSX.utils.sheet_to_json` le produit). **Rejetée** — elle ne résout pas le risque déjà identifié par le PM (mapping positionnel fragile aux réordonnancements de colonnes dans l'Excel) : un blob JSONB conserve la même dépendance à l'ordre des colonnes, juste déplacée de `COLS` (JS) vers le code de parsing JSONB, et elle interdit toute requête/filtrage côté base (il faudrait de toute façon tout re-télécharger et refiltrer côté client, comme aujourd'hui — aucun gain).

**Retenu** : chaque feuille devient une vraie table Postgres à colonnes nommées, et l'import lit les colonnes **par nom d'en-tête** plutôt que par position. Ce n'est pas une nouveauté à inventer : c'est exactement le pattern déjà utilisé aujourd'hui pour les feuilles `Joueurs`, `Tableau_MATCH` et `Bilan` (`headers.findIndex(h => h.includes('nom'))` etc., déjà dans `processFile()`), simplement étendu à la feuille `DATA` qui est aujourd'hui la seule à encore utiliser `COLS` (mapping positionnel). Si Romain réordonne un jour ses colonnes Excel, l'import continue de fonctionner correctement (recherche par nom) au lieu de désaligner silencieusement toutes les données.

```sql
-- Schéma simplifié (types exacts à affiner par le Developer selon les valeurs réelles)
CREATE TABLE match_data (
  id                 BIGSERIAL PRIMARY KEY,
  position           TEXT,
  rencontre          TEXT NOT NULL,
  club               TEXT,
  phase_att          TEXT,
  ge                 TEXT,
  defense_attaquee   TEXT,
  resultat           TEXT,
  joueur             TEXT,
  finalite           TEXT,
  enclenchement      TEXT,
  gardien            TEXT,
  position_tir       TEXT,
  field_position     TEXT,
  periode            TEXT,
  possession         TEXT,
  position_terrain   TEXT,
  action_joueur      TEXT,
  action_att         TEXT,
  action_def         TEXT,
  impact             TEXT,
  saison             TEXT,
  intention_attaque  TEXT
);

CREATE TABLE joueurs (
  nom         TEXT PRIMARY KEY,
  poste       TEXT NOT NULL,
  saison      TEXT,
  nom_complet TEXT
);

CREATE TABLE tableau_match (
  id     BIGSERIAL PRIMARY KEY,
  match  TEXT NOT NULL,
  min    INTEGER,
  nom    TEXT NOT NULL
);

CREATE TABLE bilan (
  id           BIGSERIAL PRIMARY KEY,
  saison       TEXT,
  nom          TEXT NOT NULL,
  journee_fin  TEXT NOT NULL
);

-- Remplace ENC_FAMILLE_MAP (hardcodé) + enc_famille_custom (localStorage) : une seule source désormais
CREATE TABLE famille_mapping (
  intention_attaque  TEXT PRIMARY KEY,
  famille            TEXT NOT NULL
);

-- Les 2 autres données déjà générées dans l'app
CREATE TABLE coach_analyses (
  match_key TEXT PRIMARY KEY,
  contenu   TEXT NOT NULL,  -- "analyse"/"analyze" est un mot réservé PostgreSQL, colonne renommée (découvert lors de STORY-20)
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RÉVISÉ (1.2bis) : plus de mot de passe ici, géré par auth.users (Supabase Auth).
-- Cette table relie juste un compte Auth au joueur FENIX correspondant.
CREATE TABLE player_profiles (
  user_id  UUID PRIMARY KEY REFERENCES auth.users(id),
  nom      TEXT NOT NULL UNIQUE,  -- correspond à Joueurs.nom ("Lucas.G")
  poste    TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
La feuille `Temps de Jeu` (pivot Excel, confirmée inutile) n'a pas de table — rien à migrer.

### 1.4 Stratégie d'import — remplacement complet
Décision actée (PRD §0) : Romain réimporte toujours le fichier complet de la saison, pas d'incrémental. Implémentation la plus simple retenue : à chaque import, pour `match_data`/`joueurs`/`tableau_match`/`bilan` → `DELETE` de toutes les lignes existantes puis `INSERT` du contenu du fichier fraîchement parsé. Pas de transaction/fonction RPC dédiée pour rendre l'opération atomique : le gain (éviter une fenêtre de quelques centaines de ms où la table est vide pendant l'import) ne justifie pas la complexité ajoutée, compte tenu de l'accès mono-utilisateur (Romain ne consulte pas l'app pendant qu'il importe lui-même un fichier). **Critère de bascule** : si l'app devient multi-utilisateurs actifs simultanément (cf. §7), revoir pour une fonction Postgres transactionnelle.

`famille_mapping`, `coach_analyses`, `player_profiles`/`auth.users` ne sont **jamais** touchées par l'import Excel (ce sont des données éditées dans l'app, pas dans le fichier) — seul un `upsert` explicite depuis leurs propres écrans (F6, notes coach, comptes joueurs) les modifie.

### 1.5 Séquence de démarrage de l'app
Aujourd'hui : `DOMContentLoaded` → `loadFromLocalStorage()` (synchrone, instantané) → variables globales peuplées (`DATA`, `JOUEURS_TERRAIN`, `TEMPS_JEU`, `_rawBilanRows`) → `extractUniqueValues()` → `processBilans()` → `populateFilters()` → `updateDashboard()`.

Demain : `DOMContentLoaded` → affichage état de chargement (Design F3) → requêtes Supabase en parallèle (`match_data`, `joueurs`, `tableau_match`, `bilan`, `famille_mapping`, `coach_analyses`, `player_profiles`) → **mêmes variables globales peuplées, sous la même forme qu'aujourd'hui** (ex : `TEMPS_JEU` reste un objet `{nom: {match: minutes}}` construit côté client à partir des lignes `tableau_match` reçues, exactement comme le code actuel le fait depuis les lignes Excel — seule la source change, pas la forme) → **les mêmes fonctions existantes sont appelées ensuite sans modification** (`extractUniqueValues()`, `processBilans()`, etc.).

**Pourquoi c'est important** : la quasi-totalité du code de rendu de l'app (Dashboard, Analyse, Joueurs, Notes, Impact, mode joueur — plusieurs milliers de lignes) lit ces variables globales sans savoir d'où elles viennent. En gardant la même forme de données en mémoire, l'impact réel de cette migration reste confiné aux fonctions de chargement/import (`processFile()`, `loadFromLocalStorage()` et leurs futures équivalentes Supabase) — pas de récriture en profondeur du reste de l'app.

### 1.6 `getEncFamille()` simplifiée
Conséquence directe de F6 : `getEncFamille()` (`js/page-analyse.js`) vérifie aujourd'hui `_ENC_FAMILLE_CUSTOM` (override localStorage) puis retombe sur `ENC_FAMILLE_MAP` (hardcodé JS) — deux sources à consulter dans un ordre précis. Avec `famille_mapping` comme source unique en base, cette fonction se simplifie en une seule consultation d'une table chargée en mémoire au démarrage (`FAMILLE_MAPPING[intention]`). Bénéfice de simplification, pas juste un coût de migration.

## 2. Migration unique des données existantes (F5)

Deux mécanismes bien distincts, à ne pas confondre :

**A. Migration des données locales de Romain** (déclenchée dans l'app, cf. Design F5) : au premier chargement post-bascule, si `localStorage['fenix_coach_analyses']`, `localStorage['fenix_player_accounts']` ou `localStorage['enc_famille_custom']` contiennent des données ET qu'aucun flag `localStorage['fenix_supabase_migrated']` n'est présent → proposer la migration → au clic, `upsert` (pas `insert` simple, au cas où le prompt serait redéclenché) de chaque entrée vers `coach_analyses`/`player_accounts`/`famille_mapping` respectivement → poser le flag.

**B. Amorçage initial de `famille_mapping`** (fait une seule fois par le Developer au moment où F6 est livrée, pas par Romain via l'UI) : peupler la table avec les 18 correspondances actuellement câblées en dur dans `ENC_FAMILLE_MAP`, **puis** appliquer par-dessus les entrées de `_ENC_FAMILLE_CUSTOM` de Romain si elles existent au moment du déploiement (mêmes clés → les overrides de Romain gagnent). Fait via le SQL Editor Supabase ou un script ponctuel, pas un écran dans l'app — c'est un amorçage technique, pas un geste utilisateur récurrent.

## 3. Nouvelles structures de données

Voir schéma SQL §1.3. Récapitulatif des globales JS conservées à l'identique (aucune renommée) : `DATA`, `JOUEURS_TERRAIN`, `TEMPS_JEU`, `_rawBilanRows`, `MATCHS`, `SAISONS`, `JOUEURS_FENIX`, `BILANS`. Nouvelle globale : `FAMILLE_MAPPING` (objet `{intention: famille}`, remplace `ENC_FAMILLE_MAP` + `_ENC_FAMILLE_CUSTOM`). Nouvelle brique non-JS : une Edge Function Supabase (`create-player-account`, §1.2bis/§4) — première pièce de ce projet qui n'est pas un fichier statique.

## 4. Nouvelles fonctions/modules

- `js/supabase-client.js` (nouveau) : init du client, `fetchAllFromSupabase()`, `replaceTable(table, rows)`, `upsertRows(table, rows)`.
- **`supabase/functions/create-player-account/` (nouveau, Edge Function)** : reçoit `{nom, motDePasse}`, génère l'email interne, appelle `admin.createUser()` avec la clé `service_role` (secret serveur Supabase, jamais côté client), crée la ligne `player_profiles` correspondante. Déployée via `supabase functions deploy create-player-account` (nécessite le CLI Supabase, à installer une fois lors de STORY-20).
- `processFile()` (existant, modifié) : après le parsing XLSX habituel, appelle `replaceTable()` pour chaque feuille Excel au lieu de `localStorage.setItem`.
- `loadFromLocalStorage()` → renommée/remplacée par une fonction équivalente asynchrone (`loadFromSupabase()`) appelée au boot.
- `getEncFamille()` (existant, simplifié) : lookup unique sur `FAMILLE_MAPPING`.
- Nouvelles fonctions pour F6 : `openFamilleEditor()`, `saveFamilleMapping()`, `deleteFamilleMapping()` (`js/page-analyse.js`, à côté des fonctions Enclenchement existantes) — même schéma que `openPlayerAccountsModal()`/`savePlayerAccount()`/`deletePlayerAccount()` (`js/player-mode.js`), à réutiliser comme modèle direct.
- `savePlayerAccount()` (existant, révisé) : appelle désormais l'Edge Function `create-player-account` au lieu d'écrire dans `localStorage`.
- `checkLogin()` côté joueur (existant, révisé) : appelle `supabase.auth.signInWithPassword()` avec l'email interne généré à partir du nom saisi, au lieu de comparer contre une table en clair.
- Nouvelle fonction de migration : `checkAndOfferLocalMigration()` (F5-A), appelée après le chargement initial réussi — **pour les comptes joueurs existants de Romain, migre en appelant l'Edge Function pour chaque compte trouvé dans `localStorage['fenix_player_accounts']`**, pas un simple `upsert` de table (différent des deux autres types de données F5-A).

## 5. Impact sur l'existant

- **Import Excel** (`processFile()`) : impacté, mais le parsing XLSX lui-même ne change pas — seule la destination change (Supabase au lieu de `localStorage`).
- **Boot de l'app** : impacté (synchrone → asynchrone), nécessite les états de chargement/erreur (Design F3) qui n'existaient pas avant.
- **Tout le reste du code de rendu** (Dashboard, Analyse, Joueurs, Notes, Impact, mode joueur) : **non impacté** — lit les mêmes globales sous la même forme (§1.5).
- **`getEncFamille()`** : simplifiée (§1.6).
- **`js/page-joueurs.js`, `js/page-notes-graph.js`, `js/utils.js`** : aucun changement attendu — ils ne touchent ni à l'import ni au chargement.
- Suppression progressive des clés `localStorage` `fenix_data`/`fenix_temps_jeu`/`fenix_bilan_rows`/`fenix_joueurs_terrain` (plus de raison de les garder une fois Supabase branché) — `fenix_coach_analyses`/`fenix_player_accounts`/`enc_famille_custom` restent lus une dernière fois pour F5 puis peuvent être nettoyés après migration réussie (à discuter avec le Developer : les garder un temps comme filet de sécurité, ou les effacer immédiatement — pas bloquant pour ce cycle).

## 6. Risques (remontés au Risk Analyst pour formalisation)

- Exposition de la clé anonyme Supabase → accès direct à `match_data`/`joueurs`/`tableau_match`/`bilan`/`famille_mapping`/`coach_analyses` en contournant le mot de passe applicatif staff (§1.2) — accepté pour ce cycle, à surveiller. **Ne concerne plus les mots de passe joueurs** depuis la révision §1.2bis (Supabase Auth).
- **Nouveau risque introduit par la révision 1.2bis** : le secret `service_role` doit être configuré correctement comme variable d'environnement de l'Edge Function (jamais commité dans le repo, jamais loggé) — une erreur de configuration à ce niveau serait plus grave que l'ancien risque qu'elle remplace (accès total à toute la base, pas juste à une table). À vérifier explicitement lors du déploiement (STORY-20).
- Absence de transaction sur le remplacement complet (§1.4) — fenêtre courte de données vides pendant un import, risque jugé faible en mono-utilisateur.
- Perte de données lors de la bascule si F5-A échoue ou est ignorée (déjà identifié par le PM comme risque Must Have).
- Dépendance réseau totale et nouvelle — plus aucun mode dégradé si Supabase est injoignable (décision assumée §0 du PRD, mais à formaliser comme risque accepté explicite).
- Migration des comptes joueurs existants (F5-A révisé) : nécessite un appel Edge Function par compte trouvé en local, donc dépendante du réseau et de la fonction déployée — si l'un des appels échoue en cours de route, certains joueurs migrent et d'autres non, sans état intermédiaire clair pour Romain si l'échec n'est pas signalé compte par compte.

## 7. Critère de bascule (quand revoir cette architecture)

- Si un jour plusieurs personnes modifient les données **simultanément** (pas juste en lecture multi-appareils) : le modèle Supabase Auth déjà en place pour les joueurs (§1.2bis) peut s'étendre au staff (plusieurs coachs, chacun avec un vrai compte) plutôt que de garder le mot de passe partagé "Partage" — et revoir §1.4 (remplacement transactionnel).
- Si le volume de données dépasse largement les ~5 000 lignes/saison actuelles (ex. multi-saisons cumulées sans purge, plusieurs équipes) : revoir la stratégie de remplacement complet pour de l'incrémental.
- Si Romain a besoin d'un accès hors-ligne (le gymnase change de contexte réseau) : revoir toute la couche de chargement pour un cache local + synchronisation, actuellement explicitement écarté.

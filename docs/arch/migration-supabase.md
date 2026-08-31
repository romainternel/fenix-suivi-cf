# Architecture — Migration Supabase

**Agent :** Architect
**Date :** 2026-08-28

---

## 1. Décision technique

### 1.1 Intégration du client Supabase
Aucun build, aucun bundler dans ce projet (fichier HTML unique + fichiers `js/*.js` chargés en `<script>` classiques) — on ne change pas ça. Le client `@supabase/supabase-js` v2 s'ajoute en CDN, exactement comme `XLSX` et `Chart.js` le sont déjà aujourd'hui :
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```
Nouveau fichier `js/supabase-client.js` (chargé après ce script, avant les autres `js/*.js` qui en dépendent) : initialise `const supabase = window.supabase.createClient(URL, ANON_KEY)` et expose un petit nombre de fonctions utilitaires (`fetchAll()`, `replaceTable(nom, lignes)`, `upsertRows(table, lignes)`) — pas de couche d'abstraction générique, juste ce dont ce projet a besoin.

**URL et clé anonyme embarquées en clair dans le HTML statique** — c'est la seule option possible sans backend/serveur (GitHub Pages), et c'est le fonctionnement prévu par Supabase pour la clé anonyme (elle est faite pour être publique ; la vraie protection est la Row Level Security côté base, pas le secret de la clé). À ne surtout pas confondre avec la `service_role` key, qui elle ne doit **jamais** apparaître côté client — cette dernière n'est utilisée nulle part dans ce projet.

### 1.2 Modèle d'accès et sécurité (RLS)
Décision actée (PRD §0) : pas de nouveau modèle de permissions, accès staff mono-utilisateur multi-appareils, niveau de sécurité de l'authentification volontairement inchangé. Traduction technique : les policies RLS Supabase sont **permissives** (lecture/écriture ouvertes à quiconque possède la clé anonyme), sans système d'identité Supabase réel — le mot de passe partagé "Partage" reste la seule porte d'entrée, gérée entièrement côté app comme aujourd'hui, pas au niveau de la base.

**Ce que ça change réellement par rapport à aujourd'hui** : avant cette migration, il n'existait tout simplement aucun backend partagé — impossible d'accéder aux données de Romain sans son navigateur. Après, quiconque trouve la clé anonyme (visible dans le code source de la page, publique par nature) peut lire/écrire directement dans Supabase, en contournant totalement le mot de passe applicatif. Ce n'est pas une régression du niveau de protection déjà existant (qui était déjà contournable, aucune vraie sécurité serveur avant), mais c'est une **exposition nouvelle** (une base de données réelle et partagée, désormais atteignable, alors qu'avant il n'y avait rien à atteindre à distance). Point explicitement remonté au Risk Analyst — non bloquant pour ce cycle (scope confirmé par Romain) mais à ne pas perdre de vue.

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
  analyse   TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE player_accounts (
  nom      TEXT PRIMARY KEY,
  password TEXT NOT NULL,  -- en clair, cohérent avec le niveau de sécurité actuel (décision PRD §0)
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
La feuille `Temps de Jeu` (pivot Excel, confirmée inutile) n'a pas de table — rien à migrer.

### 1.4 Stratégie d'import — remplacement complet
Décision actée (PRD §0) : Romain réimporte toujours le fichier complet de la saison, pas d'incrémental. Implémentation la plus simple retenue : à chaque import, pour `match_data`/`joueurs`/`tableau_match`/`bilan` → `DELETE` de toutes les lignes existantes puis `INSERT` du contenu du fichier fraîchement parsé. Pas de transaction/fonction RPC dédiée pour rendre l'opération atomique : le gain (éviter une fenêtre de quelques centaines de ms où la table est vide pendant l'import) ne justifie pas la complexité ajoutée, compte tenu de l'accès mono-utilisateur (Romain ne consulte pas l'app pendant qu'il importe lui-même un fichier). **Critère de bascule** : si l'app devient multi-utilisateurs actifs simultanément (cf. §7), revoir pour une fonction Postgres transactionnelle.

`famille_mapping`, `coach_analyses`, `player_accounts` ne sont **jamais** touchées par l'import Excel (ce sont des données éditées dans l'app, pas dans le fichier) — seul un `upsert` explicite depuis leurs propres écrans (F6, notes coach, comptes joueurs) les modifie.

### 1.5 Séquence de démarrage de l'app
Aujourd'hui : `DOMContentLoaded` → `loadFromLocalStorage()` (synchrone, instantané) → variables globales peuplées (`DATA`, `JOUEURS_TERRAIN`, `TEMPS_JEU`, `_rawBilanRows`) → `extractUniqueValues()` → `processBilans()` → `populateFilters()` → `updateDashboard()`.

Demain : `DOMContentLoaded` → affichage état de chargement (Design F3) → requêtes Supabase en parallèle (`match_data`, `joueurs`, `tableau_match`, `bilan`, `famille_mapping`, `coach_analyses`, `player_accounts`) → **mêmes variables globales peuplées, sous la même forme qu'aujourd'hui** (ex : `TEMPS_JEU` reste un objet `{nom: {match: minutes}}` construit côté client à partir des lignes `tableau_match` reçues, exactement comme le code actuel le fait depuis les lignes Excel — seule la source change, pas la forme) → **les mêmes fonctions existantes sont appelées ensuite sans modification** (`extractUniqueValues()`, `processBilans()`, etc.).

**Pourquoi c'est important** : la quasi-totalité du code de rendu de l'app (Dashboard, Analyse, Joueurs, Notes, Impact, mode joueur — plusieurs milliers de lignes) lit ces variables globales sans savoir d'où elles viennent. En gardant la même forme de données en mémoire, l'impact réel de cette migration reste confiné aux fonctions de chargement/import (`processFile()`, `loadFromLocalStorage()` et leurs futures équivalentes Supabase) — pas de récriture en profondeur du reste de l'app.

### 1.6 `getEncFamille()` simplifiée
Conséquence directe de F6 : `getEncFamille()` (`js/page-analyse.js`) vérifie aujourd'hui `_ENC_FAMILLE_CUSTOM` (override localStorage) puis retombe sur `ENC_FAMILLE_MAP` (hardcodé JS) — deux sources à consulter dans un ordre précis. Avec `famille_mapping` comme source unique en base, cette fonction se simplifie en une seule consultation d'une table chargée en mémoire au démarrage (`FAMILLE_MAPPING[intention]`). Bénéfice de simplification, pas juste un coût de migration.

## 2. Migration unique des données existantes (F5)

Deux mécanismes bien distincts, à ne pas confondre :

**A. Migration des données locales de Romain** (déclenchée dans l'app, cf. Design F5) : au premier chargement post-bascule, si `localStorage['fenix_coach_analyses']`, `localStorage['fenix_player_accounts']` ou `localStorage['enc_famille_custom']` contiennent des données ET qu'aucun flag `localStorage['fenix_supabase_migrated']` n'est présent → proposer la migration → au clic, `upsert` (pas `insert` simple, au cas où le prompt serait redéclenché) de chaque entrée vers `coach_analyses`/`player_accounts`/`famille_mapping` respectivement → poser le flag.

**B. Amorçage initial de `famille_mapping`** (fait une seule fois par le Developer au moment où F6 est livrée, pas par Romain via l'UI) : peupler la table avec les 18 correspondances actuellement câblées en dur dans `ENC_FAMILLE_MAP`, **puis** appliquer par-dessus les entrées de `_ENC_FAMILLE_CUSTOM` de Romain si elles existent au moment du déploiement (mêmes clés → les overrides de Romain gagnent). Fait via le SQL Editor Supabase ou un script ponctuel, pas un écran dans l'app — c'est un amorçage technique, pas un geste utilisateur récurrent.

## 3. Nouvelles structures de données

Voir schéma SQL §1.3. Récapitulatif des globales JS conservées à l'identique (aucune renommée) : `DATA`, `JOUEURS_TERRAIN`, `TEMPS_JEU`, `_rawBilanRows`, `MATCHS`, `SAISONS`, `JOUEURS_FENIX`, `BILANS`. Nouvelle globale : `FAMILLE_MAPPING` (objet `{intention: famille}`, remplace `ENC_FAMILLE_MAP` + `_ENC_FAMILLE_CUSTOM`).

## 4. Nouvelles fonctions/modules

- `js/supabase-client.js` (nouveau) : init du client, `fetchAllFromSupabase()`, `replaceTable(table, rows)`, `upsertRows(table, rows)`.
- `processFile()` (existant, modifié) : après le parsing XLSX habituel, appelle `replaceTable()` pour chaque feuille Excel au lieu de `localStorage.setItem`.
- `loadFromLocalStorage()` → renommée/remplacée par une fonction équivalente asynchrone (`loadFromSupabase()`) appelée au boot.
- `getEncFamille()` (existant, simplifié) : lookup unique sur `FAMILLE_MAPPING`.
- Nouvelles fonctions pour F6 : `openFamilleEditor()`, `saveFamilleMapping()`, `deleteFamilleMapping()` (`js/page-analyse.js`, à côté des fonctions Enclenchement existantes) — même schéma que `openPlayerAccountsModal()`/`savePlayerAccount()`/`deletePlayerAccount()` (`js/player-mode.js`), à réutiliser comme modèle direct.
- Nouvelle fonction de migration : `checkAndOfferLocalMigration()` (F5-A), appelée après le chargement initial réussi.

## 5. Impact sur l'existant

- **Import Excel** (`processFile()`) : impacté, mais le parsing XLSX lui-même ne change pas — seule la destination change (Supabase au lieu de `localStorage`).
- **Boot de l'app** : impacté (synchrone → asynchrone), nécessite les états de chargement/erreur (Design F3) qui n'existaient pas avant.
- **Tout le reste du code de rendu** (Dashboard, Analyse, Joueurs, Notes, Impact, mode joueur) : **non impacté** — lit les mêmes globales sous la même forme (§1.5).
- **`getEncFamille()`** : simplifiée (§1.6).
- **`js/page-joueurs.js`, `js/page-notes-graph.js`, `js/utils.js`** : aucun changement attendu — ils ne touchent ni à l'import ni au chargement.
- Suppression progressive des clés `localStorage` `fenix_data`/`fenix_temps_jeu`/`fenix_bilan_rows`/`fenix_joueurs_terrain` (plus de raison de les garder une fois Supabase branché) — `fenix_coach_analyses`/`fenix_player_accounts`/`enc_famille_custom` restent lus une dernière fois pour F5 puis peuvent être nettoyés après migration réussie (à discuter avec le Developer : les garder un temps comme filet de sécurité, ou les effacer immédiatement — pas bloquant pour ce cycle).

## 6. Risques (remontés au Risk Analyst pour formalisation)

- Exposition de la clé anonyme Supabase → accès direct à la base en contournant le mot de passe applicatif (§1.2) — accepté pour ce cycle, à surveiller.
- Absence de transaction sur le remplacement complet (§1.4) — fenêtre courte de données vides pendant un import, risque jugé faible en mono-utilisateur.
- Perte de données lors de la bascule si F5-A échoue ou est ignorée (déjà identifié par le PM comme risque Must Have).
- Dépendance réseau totale et nouvelle — plus aucun mode dégradé si Supabase est injoignable (décision assumée §0 du PRD, mais à formaliser comme risque accepté explicite).

## 7. Critère de bascule (quand revoir cette architecture)

- Si un jour plusieurs personnes modifient les données **simultanément** (pas juste en lecture multi-appareils) : revoir §1.2 (vrai modèle d'identité Supabase Auth par utilisateur) et §1.4 (remplacement transactionnel).
- Si le volume de données dépasse largement les ~5 000 lignes/saison actuelles (ex. multi-saisons cumulées sans purge, plusieurs équipes) : revoir la stratégie de remplacement complet pour de l'incrémental.
- Si Romain a besoin d'un accès hors-ligne (le gymnase change de contexte réseau) : revoir toute la couche de chargement pour un cache local + synchronisation, actuellement explicitement écarté.

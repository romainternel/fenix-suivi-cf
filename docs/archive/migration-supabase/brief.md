# Brief — Migration du stockage vers Supabase

**Agent :** Analyst
**Date :** 2026-08-28

---

## 1. Contexte

FENIX Stats CF est une app mono-fichier HTML/JS/CSS sans backend. Toutes les données vivent dans le `localStorage` du navigateur qui a fait le dernier import Excel. Le 2026-08-28, un audit de régression complet a mis en évidence, sur un vrai cas d'usage, la conséquence directe de cette architecture : un joueur retiré de l'effectif l'an dernier ("Jules F") apparaissait encore sur le terrain de l'app avec des stats à zéro, simplement parce que le navigateur testé n'avait pas reçu le dernier import Excel. Ce n'est pas un bug de code — c'est la limite structurelle de "une seule source de vérité par appareil, synchronisée uniquement par ré-import manuel".

Le sujet "migration Supabase" figure dans la roadmap du projet depuis plusieurs semaines (priorité haute), mais n'avait encore jamais été cadré précisément — ce cycle sert à ça.

## 2. Problème

Aujourd'hui, Romain ne peut pas :
- Consulter les stats à jour depuis un autre appareil que celui qui a fait le dernier import (téléphone au gymnase, tablette d'un autre membre du staff, PC de la maison) sans réimporter le fichier partout.
- Faire un petit ajustement ponctuel (rattacher une nouvelle valeur d'"Intention attaque" à une famille tactique) sans modifier du code JS et redéployer.
- Garantir que les données affichées à un instant T sont bien les dernières, sur n'importe quel appareil — le risque de données périmées silencieuses (comme "Jules F") est permanent.

Trois types de données déjà générées **dans l'app elle-même** (pas dans l'Excel) sont en plus exposées à une perte pure et simple si le navigateur est vidé ou changé : les notes libres du coach par match, les comptes joueurs, et les assignations manuelles de famille tactique.

## 3. Utilisateurs

- **Romain (coach principal)** : utilisateur quasi-exclusif aujourd'hui. Saisit les données de match dans Excel après analyse vidéo (geste déjà installé, pas remis en cause par ce projet — voir `docs/research/migration-supabase.md`), consulte l'app sur plusieurs appareils (PC principal, potentiellement téléphone/tablette au gymnase).
- **Le reste du staff / autres coachs** : consultation probable, contribution non confirmée — à clarifier (voir Questions en suspens).
- **Les joueurs** : consultent leur fiche en lecture seule via un compte dédié (mode déjà existant) — pas d'impact direct de cette migration sur leur usage, si ce n'est une fiabilité accrue des données qu'ils voient.

## 4. Vision

*Romain importe son Excel une fois, sur n'importe quel appareil, et les données à jour sont immédiatement visibles partout — sans jamais avoir à se demander si ce qu'il regarde est le dernier import ou un précédent oublié sur un autre poste.*

## 5. Scope

**Dedans :**
- Les données de match issues de l'Excel (`DATA`, `Joueurs`, `Tableau_MATCH`, `Bilan`) migrent vers Supabase, remplacées intégralement à chaque import (voir recommandation Research Analyst §4.1 — pas d'incrémental).
- Les 3 données déjà générées dans l'app (notes coach, comptes joueurs, assignations famille manuelles) migrent en priorité vers Supabase — elles sont perdues aujourd'hui au changement d'appareil, indépendamment de tout Excel.
- La feuille `Famille` devient éditable directement dans l'app (petit écran de configuration), sans passer par une modification de code.
- L'app continue de fonctionner à l'identique pour tout ce qui ne change pas de source (aucune régression fonctionnelle sur les pages Dashboard/Analyse/Joueurs/Notes/Impact/mode joueur).

**Dehors (explicitement, pour ce cycle) :**
- Aucune saisie native de données de match (`DATA`) dans l'app — Excel reste l'outil de saisie pour cette donnée dense (justifié en détail dans la recherche).
- Aucun import incrémental match par match — l'Excel réimporté contient toujours tout l'historique de la saison, comme aujourd'hui.
- La feuille `Temps de Jeu` (tableau croisé dynamique Excel, déjà confirmée inutilisée par le code) n'est pas migrée.
- Amélioration du niveau de sécurité de l'authentification (mot de passe staff partagé, mots de passe joueurs en clair) — sujet distinct, à traiter séparément si souhaité (question ouverte pour le PM).

## 6. Critères de succès

- Romain importe l'Excel sur un appareil A, ouvre l'app sur un appareil B (jamais utilisé pour l'import) sans réimporter, et voit les données à jour.
- Une note coach, un compte joueur ou une assignation de famille créés sur un appareil sont visibles sur un autre sans réimport ni action supplémentaire.
- Une modification de la feuille `Famille` se fait dans l'app, sans toucher au code.
- Aucune régression sur les fonctionnalités existantes (à vérifier via le squad de contrôle habituel, `/verifie`, une fois les stories développées).
- Le scénario "Jules F" (joueur périmé visible sur un appareil non réimporté) ne peut plus se reproduire.

## 7. Questions en suspens

Reprises de la recherche, à trancher avec le PM avant l'écriture du PRD :
1. Romain a-t-il déjà eu besoin d'importer un match isolé sans le fichier complet de saison sous la main ? (conditionne si l'import incrémental doit être reconsidéré)
2. Qui d'autre que Romain doit avoir accès en lecture/écriture aux données une fois sur Supabase ?
3. Le niveau de sécurité actuel de l'authentification (mot de passe staff partagé "Partage", mots de passe joueurs en clair) doit-il être amélioré à l'occasion de cette migration, ou volontairement laissé identique pour ne pas alourdir le projet ?
4. Contrainte de connexion : l'app doit-elle continuer à fonctionner (au moins en lecture) sans connexion internet (ex. gymnase sans wifi), ou une dépendance réseau permanente à Supabase est-elle acceptable ?

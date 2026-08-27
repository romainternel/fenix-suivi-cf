# Analyst — Intention attaque (refonte classification enclenchements)

**Agent :** Analyst
**Date :** 2026-08-26
**Input :** Échange avec Romain Ternel + inspection directe de `ESSAI IA STAT.xlsm` + `js/page-analyse.js` (code en production, v221)
**Suite de :** `docs/analyse/ANALYST-analyse-module.md` (2026-06-17, à l'origine du module Analyse actuel — A-00 à A-08, livré v109, puis fortement retouché jusqu'à v221)

---

## 1. Contexte

Le module Analyse classe chaque tir en une **famille tactique** (Isoler, Jeu PVT, 7vs6, Faire courir, Bloc PVT, Rentrée, Spéciaux, 6vs5, Rebond) pour nourrir les cards, le camembert, la matrice 2×2, le tableau d'efficacité V/D et la détection de "tactique payante". Cette classification repose aujourd'hui entièrement sur une table codée en dur (`ENC_FAMILLE_MAP`, ~90 entrées, validée coach le 2026-06-25) qui parse le texte libre de la colonne Excel `Enclenchement` (ex. `"8;0;Bloc 4"`).

Romain a modifié le classeur Excel `ESSAI IA STAT.xlsm` :
- La feuille **DATA** gagne une 22ᵉ colonne, **`Intention attaque`**, ajoutée en dernière position.
- La feuille **Enclenchements** est réduite de ~90 lignes de catalogue à une **table de correspondance propre à 2 colonnes** : `Intention attaque → Famille` (16 lignes actuellement).

C'est un changement de fond, pas un ajustement : la donnée source de la classification change de nature (d'un texte libre parsé par heuristique à une valeur catalogée officiellement), et le catalogue de familles lui-même évolue.

---

## 2. Ce qui a été vérifié directement dans le fichier

*(fait à la place d'une simple description utilisateur, pour cadrer sur des faits plutôt que des impressions)*

- **`Intention attaque` n'est lue nulle part dans le code actuel.** L'import Excel (`FENIX-HANDBALL-CF-SUIVI.html`) ne reconnaît que les feuilles `Joueurs`, `Temps de Jeu` et `Bilan` par nom — la feuille `Enclenchements` n'est jamais chargée.
- **Nouveau catalogue (`Enclenchements`, 16 lignes) :**
  `ISO 2/3/4/5 → ISOLER` · `7vs6 → 7VS6` · `1&2…5&6, GLISSE → JEU PIVOT` · `FAIRE COURIR → FAIRE COURIR` · `RENTREE → RENTREE` · `SPECIAUX → SPECIAUX` · `6vs5 → 6vs5` · `JEU RAPIDE → JEU RAPIDE`.
  → **8 familles**, contre 9 aujourd'hui. Disparues : *Bloc PVT*, *Rebond*. Nouvelle : *Jeu rapide*. Romain l'a confirmé : certaines intentions portent volontairement le même nom que leur famille (familles "atomiques" à un seul système), d'autres regroupent plusieurs intentions sous une même famille — **ce n'est pas une incohérence, c'est voulu.**
- **Écart de données déjà présent** dans le seul match actuellement chargé dans le fichier (`AMICAL FENIX-L'UNION`, saison 2026-2027, 187 lignes) : la valeur `BLOC` est utilisée 4 fois dans `Intention attaque` mais **n'existe pas** dans le nouveau catalogue de 16 lignes. Avec une simple table de correspondance, ces 4 actions tomberaient silencieusement en "Autre" sans que personne ne le remarque.
- **Coexistence, pas bascule nette** : sur ce même match, l'ancienne colonne `Enclenchement` (texte libre) est encore renseignée sur 12 lignes (valeurs comme `Départ;4`, `1;GLISSE`, `ECARTEMENT;Bloc ext`), dont 3 lignes **n'ont pas** de valeur en `Intention attaque`. 142 lignes ont `Intention attaque` seule. La transition se fait donc **ligne par ligne**, pas proprement match par match.
- Le fichier de travail actuel ne contient **que** ce nouveau match — la saison 2025-2026 (19 matchs) auditée le 2026-08-26 n'y est plus. Elle reste très probablement en usage ailleurs (ou réimportée séparément) au format historique (`Enclenchement` texte libre uniquement, pas d'`Intention attaque`).

---

## 3. Problème

Aujourd'hui, chaque fois que le catalogue d'enclenchements du coach évolue (nouveau système, renommage, changement de famille), **il faut modifier le code JS** (`ENC_FAMILLE_MAP`) et redéployer. C'est déjà arrivé plusieurs fois depuis juin (v157, v170, v171, v209 rien que pour des ajustements de familles). Avec la nouvelle feuille `Enclenchements` propre et structurée dans l'Excel, cette source de vérité existe déjà **côté coach** — mais l'app ne la lit pas.

Le vrai besoin n'est donc pas seulement "gérer la nouvelle colonne Intention attaque" : c'est **arrêter de coder en dur une classification que le coach maintient déjà lui-même dans son Excel**, tout en ne cassant rien sur les saisons passées qui n'ont que l'ancien format.

---

## 4. Utilisateurs

- **Romain (coach / responsable CF)** — seul utilisateur du bloc Analyse. Usage : après chaque match ou en fin de bilan, sur PC/iPad, pour comprendre quels systèmes fonctionnent. C'est aussi lui qui maintient le catalogue Excel — il doit pouvoir ajouter un système sans dépendre d'un futur passage en code.
- **Max (adjoint)** — même usage, consultation.
- Aucun usage joueur concerné (le mode joueur n'affiche pas les familles d'enclenchement).

---

## 5. Vision

**Le catalogue Excel `Enclenchements` devient la seule source de vérité pour la classification des nouvelles données ; l'app ne doit plus jamais avoir besoin d'un déploiement de code pour suivre un changement de système tactique du coach.**

Les saisons passées (texte libre uniquement) continuent de fonctionner exactement comme aujourd'hui, sans régression.

---

## 6. Scope

**Dans le scope :**
- Lecture de la feuille `Enclenchements` (colonnes `Intention attaque` / `Famille`) à l'import, construction d'une table de correspondance dynamique.
- Classification hybride par ligne : `Intention attaque` (nouveau) prioritaire si renseignée, sinon repli sur l'ancien parseur `Enclenchement` texte libre (inchangé) — pour ne pas casser l'historique.
- Mise à jour de tous les endroits qui listent les familles en dur (cards, camembert, matrice 2×2, tableau efficacité V/D, saison V/D, détection "tactique payante", liste déroulante du chat IA) pour refléter le nouveau jeu de familles — **dynamiquement**, pas en recodant la liste une deuxième fois.
- Traitement des intentions orphelines (présentes dans `Intention attaque` mais absentes du catalogue, ex. `BLOC`) : réutiliser le mécanisme déjà existant de familles "non classifiées" + réassignation manuelle (`enc_famille_custom`), pour que ça ne disparaisse jamais silencieusement.
- Renommage de la feuille Excel `Enclenchements` → `Intention attaque` **mentionné mais explicitement reporté** par Romain (pour ne pas complexifier l'échange) — l'implémentation doit donc chercher la feuille par un nom tolérant (`Enclenchements` OU `Intention attaque`) plutôt que de dépendre du nom actuel.

**Hors scope (confirmé avec l'utilisateur) :**
- La refonte design/UX globale de l'appli (chantier séparé, à traiter après celui-ci).
- Le passage à Supabase (chantier séparé, déjà spécifié par ailleurs).
- Le retraitement rétroactif des 19 matchs de la saison 2025-2026 pour leur ajouter une `Intention attaque` (aucune demande en ce sens).

---

## 7. Critères de succès

- Le match `AMICAL FENIX-L'UNION` (187 lignes, format mixte réel) se classe correctement sans intervention manuelle, hors le cas `BLOC` qui doit être signalé (pas silencieusement ignoré).
- Une saison 2025-2026 (ancien format pur) rouverte dans l'app produit **exactement** les mêmes chiffres qu'avant ce chantier (non-régression stricte).
- Ajouter un nouveau système dans la feuille Excel `Enclenchements` (nouvelle ligne Intention→Famille) et réimporter suffit à le faire apparaître dans le camembert/matrice — **sans toucher au code**.
- Le décompte des 8 familles (dont "Jeu rapide", sans "Bloc PVT" ni "Rebond") est correct dans tous les écrans qui listaient les 9 anciennes familles.

---

## 8. Questions en suspens

1. **Nom de la feuille** : rester tolérant aux deux noms (`Enclenchements` / `Intention attaque`) résout le report du renommage — à confirmer que c'est suffisant, ou si Romain préfère renommer maintenant pour éviter la double détection.
2. **`BLOC`** : famille à créer (`Bloc PVT` ressuscité ?), ou faute de frappe pour une des 16 intentions existantes, ou vraie intention manquante à ajouter au catalogue Excel ? Romain doit trancher — proposition : le signaler comme "non classifié" dans l'app (mécanisme déjà existant) plutôt que de deviner.
3. **Historique 2025-2026** : restera-t-il indéfiniment sur l'ancien format, ou une ré-annotation partielle est-elle envisagée un jour ? Impacte uniquement la durée de vie du code de repli — pas bloquant pour cette version.
4. **Feuille `Enclenchements` absente** (classeur Excel antérieur, sans cette feuille) : l'app doit-elle simplement retomber à 100% sur l'ancien comportement (recommandé), ou avertir que le fichier est "ancien format" ?

---

*Brief — pipeline BMAD FENIX — Analyst 2026-08-26*

# STORY-21 — Import Excel → Supabase (remplacement complet)

**En tant que** coach,
**Je veux** que l'import de mon fichier Excel pousse les données vers Supabase,
**Afin de** que mes données de match soient visibles depuis n'importe quel appareil après un seul import.

## Contexte technique
- Zone concernée : `processFile()` (`FENIX-HANDBALL-CF-SUIVI.html`)
- Spec exacte : `docs/arch/migration-supabase.md` §1.3, §1.4
- **Changement clé** : la feuille `DATA` doit désormais être lue par **nom d'en-tête** (comme `Joueurs`/`Tableau_MATCH`/`Bilan` le sont déjà) plutôt que par position (`COLS`) — c'est ce qui alimente `match_data` en colonnes nommées et corrige la fragilité identifiée par le PM. `COLS` continue d'exister pour le reste de l'app tant que STORY-22 n'est pas livrée (voir cette story pour la reconstruction du tableau positionnel côté lecture).

## Critères d'acceptation
- [x] À l'import, chaque feuille (`DATA`→`match_data`, `Joueurs`→`joueurs`, `Tableau_MATCH`→`tableau_match`, `Bilan`→`bilan`) est lue par nom de colonne, pas par position — `buildMatchDataRows()` (`js/supabase-client.js`) normalise les en-têtes (accents/casse/espaces) et les fait correspondre aux colonnes de `match_data` via `DATA_HEADER_TO_COLUMN`
- [x] Remplacement complet de chaque table à chaque import (`replaceTable()`, déjà construite en STORY-20) — testé deux imports consécutifs du même fichier, comptages identiques (364/21/28/2 lignes), aucune duplication
- [x] **Mitigation R3** : héritée de `replaceTable()` (STORY-20) — insertion avant suppression pour les tables à clé auto-générée (`match_data`/`tableau_match`/`bilan`), le seul cas où R3 importe vraiment vu le volume (~3500+ lignes pour `match_data`) ; `joueurs` (clé naturelle) reste en suppression-puis-insertion, fenêtre courte déjà actée en STORY-20/Architecture §1.4 vu son volume négligeable (~20 lignes, quasi instantané)
- [x] Le parsing XLSX existant n'est pas modifié — `jsonData`/`DATA`/`JOUEURS_TERRAIN`/`TEMPS_JEU`/`_rawBilanRows` construits exactement comme avant, la synchronisation Supabase est un ajout en fin de fonction, pas une réécriture
- [x] Testé avec `ESSAI IA STAT.xlsm` en conditions réelles (navigateur + import réel) : les 4 tables vérifiées via l'API REST après import, contenu exact conforme au fichier (ex. première ligne `match_data` : `rencontre: "AMICAL FENIX-L'UNION"`, `intention_attaque: "ISO 3"` — identique au fichier source)
- [x] Testé avec un deuxième import du même fichier : comptages strictement identiques après le second import (364/21/28/2), confirmé par requêtes `count=exact`, pas de duplication

## Hors scope
- Lecture des données depuis Supabase au démarrage de l'app (STORY-22)
- Persistance `localStorage` des données Excel : peut être conservée en parallèle transitoirement ou supprimée — au choix du Developer, pas un critère bloquant pour cette story

## Dépend de
- STORY-20

## Taille
M

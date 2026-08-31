# STORY-21 — Import Excel → Supabase (remplacement complet)

**En tant que** coach,
**Je veux** que l'import de mon fichier Excel pousse les données vers Supabase,
**Afin de** que mes données de match soient visibles depuis n'importe quel appareil après un seul import.

## Contexte technique
- Zone concernée : `processFile()` (`FENIX-HANDBALL-CF-SUIVI.html`)
- Spec exacte : `docs/arch/migration-supabase.md` §1.3, §1.4
- **Changement clé** : la feuille `DATA` doit désormais être lue par **nom d'en-tête** (comme `Joueurs`/`Tableau_MATCH`/`Bilan` le sont déjà) plutôt que par position (`COLS`) — c'est ce qui alimente `match_data` en colonnes nommées et corrige la fragilité identifiée par le PM. `COLS` continue d'exister pour le reste de l'app tant que STORY-22 n'est pas livrée (voir cette story pour la reconstruction du tableau positionnel côté lecture).

## Critères d'acceptation
- [ ] À l'import, chaque feuille (`DATA`→`match_data`, `Joueurs`→`joueurs`, `Tableau_MATCH`→`tableau_match`, `Bilan`→`bilan`) est lue par nom de colonne, pas par position
- [ ] Remplacement complet de chaque table à chaque import (vider puis insérer le contenu du fichier fraîchement parsé) — pas d'ajout incrémental
- [ ] **Mitigation R3** : l'ancien contenu d'une table n'est supprimé qu'après confirmation que la nouvelle insertion a réussi intégralement (ex. insérer d'abord, vérifier le nombre de lignes attendu, puis seulement supprimer l'ancien contenu — pas l'inverse) ; en cas d'échec à toute étape, un message d'erreur clair est affiché et l'ancien contenu Supabase n'est pas perdu
- [ ] Le parsing XLSX existant (lecture du fichier, structure `jsonData`) n'est pas modifié — seule la destination des données change
- [ ] Testé avec le fichier `ESSAI IA STAT.xlsm` : les données apparaissent correctement dans les tables Supabase après import (vérifiable depuis le Table Editor Supabase)
- [ ] Testé avec un deuxième import (même fichier ou fichier modifié) : l'ancien contenu est bien remplacé, pas dupliqué

## Hors scope
- Lecture des données depuis Supabase au démarrage de l'app (STORY-22)
- Persistance `localStorage` des données Excel : peut être conservée en parallèle transitoirement ou supprimée — au choix du Developer, pas un critère bloquant pour cette story

## Dépend de
- STORY-20

## Taille
M

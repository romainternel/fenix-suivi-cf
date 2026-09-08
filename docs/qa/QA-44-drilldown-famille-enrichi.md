# QA-44 — Détail par intention enrichi (but/tir, PB, jet franc)

**Agent :** QA
**Date :** 2026-09-09
**Méthode :** tests réels dans un navigateur (serveur statique local, port 8200), données réelles Supabase (2 matchs).

---

## Critères d'acceptation

- [x] Cliquer une famille ("Isoler") affiche la liste de ses intentions, chacune avec Buts/PO/Ratés/PB/**JF**/Poss./Eff. sur une seule ligne de tableau (`docs/regression/screenshots/story44-detail-table.png`, `story44-jf-nonzero.png`).
- [x] Chiffres vérifiés exactement par comptage manuel sur les données réelles : sur "J01 BILLERE-FENIX", ISO 3 → Buts 1/Ratés 2/PB 2/JF 0/Poss 5, confirmé via filtrage direct de `DATA`. Sur "AMICAL FENIX-BILLERE" (match avec de vrais jets francs), ISO 4 → JF 7, ISO 3 → JF 3, ISO 2 → JF 3, tous confirmés par comptage manuel indépendant sur `DATA`.
- [x] **Bug trouvé lors de cette vérification** : la 1ère implémentation affichait 0 JF partout (les lignes "Jet franc" n'ont pas de valeur "possession", donc exclues du filtre principal). Remonté au Developer, corrigé (2e passe dédiée sans le filtre possession), re-vérifié avec les valeurs non nulles ci-dessus.
- [x] Cliquer une intention (ISO 4) ouvre le détail par enclenchement (niveau 2) sans changement — table "Enclenchement" affichée, pas de colonne JF (hors scope, conforme).
- [x] Non-régression : sélectionner une famille différente ("6vs5") après avoir ouvert une intention réinitialise bien `_encSelectedIntention` à `null` et réaffiche la liste des intentions de la nouvelle famille, pas le détail niveau 2 précédent.
- [x] Non-régression côté Adversaire (`isAdv=true`, colonne `finalite`) : table générée sans erreur sur la famille "Faire courir" côté adverse.

## Régressions détectées

Aucune.

## Verdict

**PASSED** — tous les critères d'acceptation validés en conditions réelles, avec un bug trouvé et corrigé pendant le cycle QA/Developer sur des données réelles plutôt qu'une hypothèse de code jamais testée sur un cas non nul.

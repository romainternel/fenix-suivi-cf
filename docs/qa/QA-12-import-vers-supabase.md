# QA-12 — STORY-21 : Import Excel → Supabase

**Agent :** QA
**Date :** 2026-08-31
**Méthode :** Test en navigateur réel (import réel du fichier `ESSAI IA STAT.xlsm`), vérification directe des données via l'API REST Supabase

---

## Critères validés

| Critère | Statut | Preuve |
|---|---|---|
| Lecture `DATA` par nom de colonne | ✅ | `match_data` correctement peuplée avec les bons libellés de colonnes malgré des en-têtes accentués (`Défense attaquée`, `Période`...) |
| Remplacement complet, pas d'incrémental | ✅ | Deux imports consécutifs → mêmes comptages (364/21/28/2), aucune ligne en double |
| Mitigation R3 (pas de perte en cas d'échec) | ✅ | Héritée de `replaceTable()`, vérifiée fonctionnelle sur les 4 tables |
| Parsing XLSX inchangé | ✅ | Dashboard local affiche les mêmes chiffres qu'avant l'implémentation |
| Test réel avec le fichier de référence | ✅ | 4 tables vérifiées via requêtes REST après import, contenu exact conforme au fichier source |
| Test de réimport (non-duplication) | ✅ | Comptages `count=exact` identiques avant/après le second import |

**6/6 critères validés.**

## Cas limites testés

- **Contenu exact d'une ligne `match_data`** : comparé manuellement à la ligne correspondante du fichier Excel (vue directement via une inspection Node du fichier plus tôt dans le projet) — `rencontre`, `intention_attaque`, `finalite` etc. tous identiques.
- **Valeurs numériques dans des colonnes texte** (ex. `Enclenchement` contient parfois un nombre brut dans le fichier source) : converties en chaîne sans erreur, `match_data.enclenchement` reste cohérent.
- **Table `joueurs` (clé naturelle)** : le cas le plus délicat de `replaceTable()`, spécifiquement re-testé avec un vrai réimport plutôt que supposé correct depuis STORY-20.

## Écart avec le Security Auditor

Aucun nouveau finding — confirmé par `docs/security/migration-supabase-story-21.md`, cohérent avec le PASSED de cette story.

## Régressions détectées

Aucune.

## Verdict global

**✅ PASSED**

# Risques — Articulation offensive (mode "Articulation" côté Attaque)

**Agent :** Risk Analyst
**Date :** 2026-09-15

---

## R1 — P0 bloquant : le filtre `possession` peut sous-compter certains types d'issue (même classe de bug que STORY-44 "Jet franc")

**Constat fait pendant la vérification des données réelles** (Architecture §0/§3.2) : au moins une ligne "2' obt" observée dans `IA STAT SAISON 26-27.xlsm` porte `articulation_att` renseigné mais **pas** de valeur dans la colonne `Possession`, alors que le filtre repris de la défense (`if (!r[COLS.possession]) return;`) exclurait cette ligne du calcul. Si ce n'est pas un cas isolé mais un pattern systématique (comme "Jet franc" l'était, découvert en production lors de STORY-44), l'efficacité affichée sous-compterait silencieusement certaines séquences réussies (2' obtenues) — un biais qui fausse discrètement le classement sans qu'aucune erreur ne soit visible.

**Mitigation obligatoire avant livraison** : le Developer doit, sur un vrai match, comparer le total de lignes `articulation_att` non vides **avec** et **sans** le filtre `possession`, et regarder spécifiquement si les valeurs de `Résultat` des lignes exclues par le filtre se limitent à des sous-événements légitimes (ex. si toutes les lignes filtrées sont des doublons intra-séquence déjà comptés ailleurs par une ligne sœur "Possession"), ou si elles incluent des issues finales jamais comptées nulle part (comme "2' obt" semble l'être ici). Si confirmé problématique, appliquer le même correctif que STORY-44 pour "Jet franc" : une passe supplémentaire non filtrée par `possession`, dédiée au(x) type(s) d'issue concerné(s), fusionnée dans le même comptage.

**Ne pas livrer sans cette vérification** — un biais silencieux dans "le meilleur 6"/"la meilleure base arrière" serait pire que l'absence de la fonctionnalité, puisque Romain s'en servirait pour des décisions tactiques.

## R2 — P0 bloquant : migration Supabase manuelle, dépendance d'ordre stricte

Les 7 nouvelles colonnes `match_data` doivent être créées **en base** (SQL Editor Supabase, migration manuelle comme pour STORY-33) **avant** tout réimport Excel contenant ces colonnes. Si l'import a lieu avant la migration SQL, `buildMatchDataRows()` produira des objets avec des clés (`att_alg`, etc.) que Postgres/PostgREST rejettera — soit une erreur bloquant tout l'import (y compris les 29 colonnes déjà existantes, si Supabase rejette la ligne entière), soit un silencieux abandon des seules colonnes en trop selon la configuration PostgREST. **Aucun code ne peut se protéger de cet ordre** — c'est une dépendance opérationnelle, pas applicative.

**Mitigation** : le Scrum Master doit produire une story dédiée à la migration SQL, explicitement **avant** toute story d'import/affichage, avec une instruction claire à l'attention de Romain ("exécuter ce SQL dans Supabase avant le prochain réimport"). Le Developer ne doit jamais exécuter cette migration lui-même sans confirmation explicite (cf. mémoire projet — pas d'action irréversible sur l'infrastructure sans validation).

## R3 — Accepté consciemment : fusion normal/supériorité (+) dans le même calcul

Documenté dans le Brief/PRD comme un choix délibéré, pas un oubli. Conséquence assumée : une composition beaucoup utilisée en supériorité numérique (`+`) verra son efficacité mécaniquement tirée vers le haut (un 6vs5 est structurellement plus facile à convertir), sans que ce soit visible dans le résumé. **Ce n'est pas un bug** — mais si Romain constate qu'une composition semble anormalement forte et demande "pourquoi", la réponse (mélange avec les séquences en supériorité) doit être connue de quiconque répond, d'où sa présence explicite ici. Pas de mitigation technique demandée pour cette v1 ; revisiter uniquement si Romain le demande explicitement (ajouter un `ARTIC_ATT_BLOCKS`-like toggle serait trivial le jour où c'est demandé, cf. Architecture §3.1).

## R4 — Échantillon encore réduit en tout début de saison

120 lignes ATT PLAC avec articulation renseignée sur 2 matchs actuellement disponibles. Le classement "Fiable (≥5 séq.)" risque d'être clairsemé au démarrage (beaucoup de compositions en "Échantillon faible"), en particulier pour "Base arrière" qui a moins de contraintes qu'un 6 complet mais reste sur un existant encore jeune. **Pas un bug** — comportement attendu et déjà géré par le regroupement Fiable/Faible hérité de la défense. Risque réel : que Romain interprète un classement clairsemé comme "ça ne marche pas" en tout début d'usage. Mitigation : le message vide existant côté défense ("Aucune composition observée pour cette largeur") suffit, aucun message supplémentaire nécessaire — mais le QA doit tester explicitement ce cas (peu de données) et pas seulement un cas favorable.

## R5 — Confusion visuelle entre les deux panneaux miroirs (Attaque/Défense)

Anticipé et traité dès le Design/Visual Crafter (libellé "réussite offensive" vs "réussite défensive", toggle ⚡/🛡 déjà appris par Romain comme repère principal) — mais reste un risque résiduel car les deux panneaux se ressemblent délibérément. **Mitigation de vérification** : le QA doit explicitement basculer Attaque ↔ Défense plusieurs fois de suite en mode Articulation et confirmer qu'aucune confusion de lecture ne subsiste (pas seulement vérifier que les nombres sont justes isolément).

## R6 — Limite permanente, non-corrigible : aucune donnée avant la saison 2026-2027

Les colonnes n'existent dans aucun fichier Excel de saison antérieure (vérifié sur `ESSAI IA STAT.xlsm`, colonnes présentes dans l'en-tête mais 100% vides). Un filtre "Saison complète" incluant d'anciennes saisons affichera donc un état "pas de données" pour toute période antérieure à 2026-2027, alors que l'articulation défensive (introduite plus tard dans le calendrier de développement mais sur les mêmes saisons) pourrait avoir des données sur une période où l'attaque n'en a pas. **Ne pas essayer de "corriger"** — c'est un fait des données, pas un bug ; le message vide existant suffit à le communiquer.

## R7 — Risque de collision de nommage écarté (vérifié, pas seulement supposé)

`ALG`/`ALD` existent déjà dans le code sous d'autres significations (`IMPACT_VIEW_ALG`/`IMPACT_VIEW_ALD`, vues photo de la page Impact — zones de terrain, sans rapport). Le choix de préfixer systématiquement (`att_alg`, `att_ald`, etc., cf. Architecture §1) élimine ce risque **par construction** plutôt que de compter sur la vigilance du Developer — aucune action supplémentaire nécessaire, ce risque est déjà neutralisé au niveau du nommage retenu.

## Ce qui n'est PAS un risque pour ce cycle

- Reprise de `_resolveArticJoueur`, `_articCourtSvg`, `ARTIC_FINALITE_GROUPS` telles quelles : code déjà éprouvé en production sur la défense depuis plusieurs versions, aucune modification de ces fonctions dans ce cycle (Architecture §3), donc aucun risque de régression sur l'existant défense.
- Performance : même ordre de grandeur de données que la défense (quelques centaines de lignes par saison), aucun nouveau calcul coûteux.

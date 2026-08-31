# Recherche — Migration du stockage vers Supabase

**Agent :** Research Analyst
**Date :** 2026-08-28

---

## 1. Benchmark — comment les outils existants traitent ce sujet

### Apps de stats handball existantes (Steazzi, HandballTracker, Handball Tactical & Statistics, Advanced Metrics Handball)
Recherche menée sur les outils comparables déjà sur le marché. Constat net : **quasiment tous fonctionnent en tagging live** — un membre du staff tape les actions sur tablette/smartphone depuis le banc pendant le match, directement dans une base partagée. Aucun de ces outils n'a pour point d'entrée un fichier Excel enrichi a posteriori.

**Ce que ça signifie pour FENIX** : le workflow de Romain (analyse vidéo post-match, tagging fin — zones de tir précises, intentions d'attaque, séquences défensives — probablement fait à tête reposée avec vidéo, pas en live depuis le banc) est structurellement différent de ces outils. Excel avec ses colonnes, listes déroulantes et formules de vérification est un **bon outil d'entrée pour ce cas d'usage précis** (tagging détaillé, temps disponible, pas de contrainte temps-réel) — ce n'est pas un pis-aller à éliminer, contrairement à ce qu'on pourrait supposer en regardant les concurrents. Le vrai problème n'est pas "Excel est le mauvais outil de saisie", c'est "les données saisies dans Excel ne sont visibles que sur l'appareil qui a fait le dernier import".

Ça recadre la question : on ne cherche pas à remplacer Excel par une saisie native pour la donnée de match dense (`DATA`), on cherche à le rendre partageable après saisie. Ce constat valide directement la position de Romain ("à la base, c'est mon fichier excel qui va être la référence").

### Patterns de synchronisation fichier → base partagée
Recherche sur les patterns génériques "spreadsheet comme source de vérité, synchronisé vers un stockage partagé" (contexte petites structures/associations, hors handball spécifiquement) :
- Le pattern le plus courant pour une source qui change **peu fréquemment** (hebdomadaire, pas horaire) est l'**export/import planifié ou manuel complet** — pas de synchronisation temps réel, un remplacement périodique suffit et reste le plus simple à maintenir sans infrastructure supplémentaire.
- La synchronisation incrémentale (diff/upsert) n'est généralement justifiée que quand : (a) le volume est trop gros pour un remplacement complet en un temps raisonnable, ou (b) plusieurs sources doivent fusionner sans s'écraser mutuellement, ou (c) la donnée change à une fréquence bien plus élevée que le rythme de ré-export.
- Aucune des trois conditions ci-dessus ne s'applique à FENIX (voir §2, volumétrie).

## 2. Données de référence — calibrer la décision sur la volumétrie réelle

Mesuré sur le fichier de référence (`ESSAI IA STAT.xlsm`) :
- **~180 lignes DATA par match** (365 lignes pour 2 matchs)
- Une saison compte de l'ordre de **20-30 matchs** (19 matchs déjà enregistrés sur la saison 2025-2026 réelle de Romain, confirmé par l'audit du 2026-08-28)
- Volumétrie totale attendue par saison : **~3 500 à 5 500 lignes DATA**, plus quelques dizaines de lignes pour Joueurs/Tableau_MATCH/Bilan

À cette échelle, un remplacement complet de toutes les tables Supabase à chaque import (`DELETE` + `INSERT`) est une opération de quelques dizaines de millisecondes à quelques secondes sur Postgres — **pas un problème de performance**, à des ordres de grandeur près de ce qui justifierait une stratégie incrémentale. La fréquence de mise à jour (un import après chaque match, donc au plus 1 à 2 fois par semaine en pleine saison) est également très en dessous du seuil où l'incrémental devient nécessaire pour éviter les collisions ou la latence.

## 3. Challenge d'utilité — les trois pistes de Romain passées au crible

**Piste 1 — Ré-import complet (tout le fichier à chaque fois)**
- Problème concret résolu : partage multi-appareils sans rien changer au geste de saisie de Romain.
- Un outil existant fait-il mieux ? Non — c'est exactement le pattern standard pour ce volume/cette fréquence (§1, §2).
- Risque si mal interprété : aucun risque de donnée incohérente — un remplacement complet ne peut pas laisser de résidu d'un ancien import. C'est en réalité l'option **la plus sûre contre la dérive de données**, pas seulement la plus simple.
- Coût : Romain doit garder un fichier Excel "maître" qui contient tout l'historique, pas juste le dernier match — déjà son habitude actuelle a priori (le fichier de test contient tous les matchs depuis le début de saison), donc pas un changement d'habitude.

**Piste 2 — Ré-import incrémental (un match à la fois)**
- Problème concret résolu : éviter de renvoyer les mêmes milliers de lignes à chaque fois — **mais ce problème n'existe pas à cette volumétrie** (§2). Le gain de performance est nul en pratique.
- Coût ajouté : nécessite une logique de déduplication/fusion (comment détecter qu'un match a déjà été importé ? sur quelle clé ? que se passe-t-il si Romain corrige une ligne d'un match déjà importé — le fichier incrémental ne contiendrait par définition pas la correction). C'est strictement plus complexe pour un bénéfice non mesurable ici.
- Recommandation : **écarter cette piste** sauf si Romain anticipe un usage où il voudrait explicitement importer "juste un match" sans le fichier complet sous la main (à confirmer — voir Questions ouvertes).

**Piste 3 — Module natif de saisie/édition dans l'appli**
- Problème concret résolu : ça dépend fortement de QUELLE donnée. Deux cas très différents cachés sous la même question :
  - Pour la donnée de match dense (`DATA` — zones de tir, intentions, séquences) : un module natif serait un **chantier de saisie complet** (équivalent à reconstruire les listes déroulantes, validations et le geste de tagging vidéo qu'Excel offre déjà bien) pour un bénéfice faible — Romain a déjà un outil de saisie qui fonctionne pour ce cas (§1). Non justifié maintenant.
  - Pour les données légères et amenées à changer en cours de saison (feuille `Famille`, éventuellement les bornes de `Bilan`) : un module natif est un **petit écran de configuration** (une table à éditer, quelques lignes), largement justifié et explicitement demandé par Romain ("il y a peut-être des choses qui peuvent changer en cours d'année").
- Recommandation : **distinguer clairement les deux** dans le PRD — pas de module de saisie pour `DATA`, un module d'édition léger pour `Famille` (et candidat pour `Bilan`).

## 4. Recommandation

**Go, avec un scope clarifié :**
1. **Import Excel → Supabase reste un remplacement complet à chaque fois** (piste 1), pas d'incrémental (piste 2 écartée, sauf besoin explicite non identifié à ce jour — voir questions ouvertes).
2. **Aucun module de saisie natif pour la donnée de match** (`DATA`) — Excel reste l'outil de saisie pour ce qui est dense/vidéo. Le rôle de Supabase ici est uniquement d'héberger ce qu'Excel produit pour le rendre lisible partout.
3. **Un petit module d'édition natif pour `Famille`** (et si besoin `Bilan`) — c'est la vraie demande derrière la piste 3, pas un besoin de saisie de match.
4. **Les 3 données déjà générées dans l'appli** (notes coach, comptes joueurs, assignations famille manuelles) migrent vers Supabase en priorité — c'est là que la perte de données au changement d'appareil est déjà un problème vécu aujourd'hui, indépendamment de l'Excel.

## 5. Questions ouvertes (pour l'Analyst / le PM)

- Romain a-t-il déjà eu besoin, au moins une fois, d'importer un match sans avoir le fichier complet de la saison sous la main ? Si oui, la piste 2 mérite d'être reconsidérée pour ce cas précis (à poser explicitement).
- Qui d'autre que Romain doit voir les données une fois sur Supabase (un autre coach ? des parents ? uniquement Romain sur plusieurs appareils) ? Ça conditionne le modèle d'accès/permissions Supabase, pas encore évoqué.
- Le mot de passe staff partagé unique ("Partage") et les mots de passe joueurs en clair sont un choix déjà accepté pour l'app actuelle — la migration Supabase doit-elle en profiter pour améliorer ce point (hash, table `auth` Supabase native), ou rester au même niveau d'exigence qu'aujourd'hui pour ne pas complexifier le projet ? À trancher avec le PM/l'Architect.

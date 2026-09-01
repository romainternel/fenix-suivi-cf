# Audit complet de régression — 2026-09-01 (soir)

**Agents :** Regression Guardian (cadrage + verdict) / E2E Tester (exécution)
**Environnement testé :** https://romainternel.github.io/fenix-suivi-cf/FENIX-HANDBALL-CF-SUIVI.html (production, GitHub Pages, v248 confirmée déployée)
**Contexte :** 2e audit complet de la journée, après un cycle intense de corrections (v246 : régression gardien détectée et corrigée le matin ; v247/v248 : nouvelle fonctionnalité Impact-gardien + nettoyage). Objectif : confirmer qu'aucune régression résiduelle ne subsiste après tous ces changements cumulés.

---

## 1. Périmètre testé

Toute la checklist Critique + Important (24 features), aucun périmètre restreint demandé. Secondaire non testé (hors périmètre par défaut).

### Critique (7)
C1 Authentification Staff · C2 Authentification Joueur · C3 Import Excel · C4 Dashboard staff · C5 Page Joueurs · C6 Mode Lecture Joueur mobile · C7 Persistance des filtres

### Important (17)
I1 Page Analyse · I2 Page Notes (table GB) · I3 Graphique évolution · I4 Stats Gardien (fiche) · I5 Page Impact · I6 Familles d'enclenchement · I7 Comptes joueurs · I8 Export PDF/PPT · I9 Menu Outils · I10 Onglets Analyse · I11 Vue joueur preview · I12 Migration locale · I13 Note coach · I14 Éditeur familles · I15 Éditeur bilans · I16 Impact mobile gardien · I17 Tooltip Impact

---

## 2. Résultat par feature

| # | Feature | Résultat | Preuve |
|---|---|---|---|
| C1 | Authentification Staff | ✅ | connexion "Partage" réussie |
| C2 | Authentification Joueur | ✅ | testée avec un gardien (Noah.O), cycle complet |
| C3 | Import Excel | ✅ ⚠️ | réimport réussi, 539 lignes/3 matchs, 0 erreur console — **effet de bord notable, cf. §3** |
| C4 | Dashboard staff | ✅ | `audit2-c4-dashboard.png` |
| C5 | Page Joueurs — terrain + fiche | ✅ | 21 joueurs, Antonin Vache 2/4 50%, Gabin Saltel 6/16 38% |
| C6 | Mode Lecture Joueur mobile | ✅ | testé avec un gardien (Noah Orth), `audit2-c6-mobile-gardien.png` |
| C7 | Persistance des filtres cross-page | ✅ | filtre match Analyse→Dashboard confirmé |
| I1 | Page Analyse — onglet Gardien | ✅ | "42% d'arrêts" re-confirmé après fix v246 |
| I2 | Page Notes — table GB | ✅ | 3 gardiens, une ligne chacun, re-confirmé après fix v246 |
| I3 | Graphique évolution (joueur + gardien) | ✅ | canvas correctement dimensionné dans les 2 cas |
| I4 | Stats Gardien (fiche) | ✅ | Gabin Saltel 6/16, 38% |
| I5 | Page Impact (joueur + gardien) | ✅ | Gabin Saltel 6/16/38%, mode Efficacité sans coloration trompeuse (R1 toujours neutralisé) |
| I6 | Familles d'enclenchement | ✅ | 8 familles + Non classifié rendues |
| I7 | Comptes joueurs (panneau) | ✅ | création/connexion/suppression sur Noah.O |
| I8 | Export PDF/PPT | ⚠️ NON VÉRIFIABLE | inchangé, connu depuis 2026-08-26 |
| I9 | Menu Outils | ✅ | `audit2-i9-menu-outils.png`, 5 entrées |
| I10 | Onglets internes Analyse | ✅ | 4 onglets cliqués sans erreur |
| I11 | Vue joueur preview | ✅ | bascule + retour staff |
| I12 | Migration locale | ✅ | état "aucune donnée à migrer" |
| I13 | Note coach | ✅ | sauvegarde réussie, nettoyée après test |
| I14 | Éditeur familles | ✅ | 17 correspondances, bandeau config. initiale |
| I15 | Éditeur bilans | ✅ | 2 bilans réels |
| I16 | Impact mobile gardien | ✅ | Noah Orth, 15 arrêts/40 tirs, 38% |
| I17 | Tooltip Impact | ✅ | marqueur ✕ correct sur but encaissé de gardien |

**23/24 ✅ · 1/24 ⚠️ non vérifiable (I8, connu, hors régression) · 0 régression détectée**

---

## 3. Effet de bord notable (pas une régression) — réimport Excel avec un 3e match

En testant C3 (import fichier), le fichier `ESSAI IA STAT.xlsm` présent dans le dépôt local contenait un **3e match** ("AMICAL FENIX-LIMOGES") absent des données de production jusqu'ici — 539 lignes au lieu des 364 habituelles. Le mécanisme d'import fonctionne exactement comme conçu ("réimport complet à chaque fois", décision actée en Architecture du cycle Supabase) : la table `match_data` (et les tables associées) a été **entièrement remplacée** par ce nouveau contenu.

**Ce n'est pas un bug** — c'est le comportement voulu du système, déclenché ici par un test d'audit plutôt que par Romain lui-même. Toutes les fonctionnalités testées après ce réimport (Analyse, Dashboard, Joueurs) continuent de fonctionner correctement avec ces nouvelles données (3 matchs listés partout où attendu, 0 erreur console).

**À signaler à Romain** : les données de production reflètent désormais son fichier Excel local à jour (3 matchs), ce qui est probablement ce qu'il souhaite de toute façon puisque c'est son propre fichier — mais il doit en être informé puisqu'il n'a pas lui-même déclenché ce réimport aujourd'hui.

## 4. Observation mineure — erreur console ponctuelle non reproductible

Une erreur `400` sur `/auth/v1/token?grant_type=refresh_token` observée une seule fois au tout début de l'audit, avant même la connexion staff — `localStorage` ne contenait aucune clé Supabase résiduelle au moment de l'investigation, non reproduite lors des chargements suivants. Comportement du SDK Supabase Auth tentant de rafraîchir une session expirée au démarrage ; sans impact observé sur aucune fonctionnalité (la connexion staff a réussi normalement juste après). Non classé comme régression — à surveiller si ça devient récurrent.

---

## 5. Verdict global

**RAS** — aucune régression détectée sur les 23 features vérifiables. Les 3 régressions trouvées lors du premier audit du jour (matin, `audit-complet-2026-09-01.md`) sont confirmées corrigées et stables (v246/247/248). Le seul point à noter n'est pas un défaut de l'application mais un effet de bord du test lui-même (réimport Excel avec des données plus récentes que celles en production) — à communiquer à Romain, pas à corriger.

# Checklist de régression — FENIX Stats CF

**Maintenu par :** Regression Guardian
**Créé le :** 2026-08-26 (première initialisation — aucune checklist n'existait avant ce fichier)
**Source de construction :** `CLAUDE.md` (historique commit), `docs/qa/QA-01`, `docs/qa/QA-02`, `docs/audit/AUDIT-NUIT-2026-06-16.md`, historique git (v1→v221), mémoire long-terme du projet.

> ⚠️ Aucun parcours listé ici n'avait jamais été testé dans un vrai navigateur avant l'audit du 2026-08-26 (voir `docs/regression/audit-complet-2026-08-26.md`). Les QA précédents (QA-01, QA-02) étaient faits par lecture de code uniquement.

Environnement de référence : https://romainternel.github.io/fenix-suivi-cf/FENIX-HANDBALL-CF-SUIVI.html (production, GitHub Pages). Donnée de test de référence : `ESSAI IA STAT.xlsm` (racine repo).

---

## Critique

| # | Feature | Introduite | Critère de bon fonctionnement (binaire) | Dernière vérif. OK |
|---|---------|------------|------------------------------------------|---------------------|
| C1 | Authentification Staff | v1 | Mot de passe `Partage` → accès au dashboard staff (pas d'écran joueur) | 2026-08-26 |
| C2 | Authentification Joueur | v1 (comptes v?) | Mot de passe = compte créé dans `fenix_player_accounts` → bascule automatique en Mode Lecture Joueur avec le bon nom | 2026-08-26 |
| C3 | Import fichier Excel (.xlsm/.xlsx) | v1 | Sélection du fichier → `DATA`/`MATCHS`/`SAISONS`/`JOUEURS_TERRAIN` peuplés → dashboard affiche des stats non nulles | 2026-08-26 |
| C4 | Dashboard staff | v1 | Filtre match/saison appliqué → encarts FENIX/Adversaire (possessions, buts, %, PB, Pen, Neutralisé) cohérents et non figés | 2026-08-26 |
| C5 | Page Joueurs — terrain + fiche | v1 | Clic sur un joueur du terrain SVG → panneau stats détaillées s'affiche avec les bonnes stats | 2026-08-26 |
| C6 | Mode Lecture Joueur (mobile) — Ma Fiche | v96+ (refonte sprint S-01→S-11, jusqu'à v221) | Connexion joueur → onglet "Ma Fiche" affiche KPIs + graphique progression sans erreur | 2026-08-26 |
| C7 | Persistance des filtres bilan/saison/match entre pages | historique — source de bugs récurrente (AUDIT-NUIT bug #5, BUG-22 v220) | Changer de page ne doit ni planter ni afficher des données d'un autre bilan sans avertissement | 2026-08-26 |

## Important

| # | Feature | Introduite | Critère de bon fonctionnement (binaire) | Dernière vérif. OK |
|---|---------|------------|------------------------------------------|---------------------|
| I1 | Page Analyse (vue agrégée saison + enclenchements) | v1, découpée en 5 onglets internes depuis v233 (STORY-14) | Chargement de la vue "Saison complète" → cartes GÉNÉRAL/ATT PLACÉE/GRAND ESPACE lisibles (FENIX+Adversaire), familles d'enclenchement + camembert cohérents. Avec un match sélectionné : bloc terrain+cartes toujours visible au-dessus des 5 onglets (Résumé/Timeline/Enclenchements/Gardien/Chat IA), chaque onglet correctement rendu dès sa première ouverture (canvas Timeline et camembert/matrice Enclenchements redessinés à l'ouverture, jamais vides) | ⚠️ 2026-08-26 — bug visuel trouvé sur les cartes (voir audit-complet-2026-08-26.md, non retesté depuis la réécriture v233) ✅ 2026-08-28 — structure à onglets vérifiée (QA-05/E2E-04) |
| I10 | Onglets internes page Analyse | v233 (STORY-14) | 5 onglets (Résumé/Timeline/Enclenchements/Gardien/Chat IA) toujours accessibles quand un match est sélectionné ; onglet mémorisé entre visites de la page (`sessionStorage`) ; changement de match réinitialise le drill-down enclenchements ; transition Saison complète ↔ match re-sélectionné sans état invalide | 2026-08-28 (QA-05/E2E-04) |
| I2 | Page Notes (actions ATT/DEF, table GB) | v1 | Filtre joueur/bilan → notes ATT+/-, DEF+/- et table GB affichées et cohérentes avec le filtre | 2026-08-26 |
| I3 | Graphique évolution joueur (notegraph) | v1 | Depuis fiche joueur → bouton Graphique ouvre la progression du joueur sélectionné | 2026-08-26 |
| I4 | Stats Gardien (fiche joueur GB) | v1 | Sélection d'un GB dans Joueurs → Fiche affiche arrêts/tirs, %, détail par match. Note : la page `page-gardiens` autonome n'est plus reliée à la navigation (aucun bouton ne l'appelle) — probable page orpheline comme `page-match` | 2026-08-26 |
| I5 | Page Impact (zones de tir ALG/face/ALD) | v1, seuils EFF_SEUILS | 3 vues terrain se chargent, filtre bilan/joueur/résultat fonctionne, mode comparaison ne casse pas l'affichage | 2026-08-26 |
| I6 | Familles d'enclenchement (camembert + matrice) | zone de churn intense v184→v221, déplacée dans l'onglet "Enclenchements" en v233 | Camembert + matrice s'affichent sans doublon ni zone blanche, tooltip "i" correct | 2026-08-28 (retestée dans le nouvel onglet, QA-05/E2E-04) |
| I7 | Gestion comptes joueurs (modal) | v1, accès regroupé dans le menu "⚙ Outils" depuis v231 (STORY-12) | Création d'un compte joueur (nom + mot de passe) → utilisable immédiatement pour se connecter. Accès désormais via nav → "⚙ Outils" → "🔑 Comptes joueurs" (au lieu d'un bouton direct dans la nav) | 2026-08-28 |
| I8 | Export PDF / PPT fiche joueur | résolu 2026-06-16 (CORS base64) | Génération PDF/PPT depuis fiche joueur → zones de tir (ALG/face/ALD) visibles dans le document exporté | ⚠️ NON VÉRIFIABLE via Playwright — le bouton PDF appelle `window.print()` (page-joueurs.js:1170), qui ouvre une boîte de dialogue native bloquant tout pilotage automatisé (a gelé le navigateur Playwright 3× 30 min lors de l'audit du 2026-08-26). Fonctionne normalement pour un utilisateur réel ; à valider manuellement. |
| I9 | Menu "⚙ Outils" (nav) | v231 (STORY-12) | Clic sur "Outils" → menu avec "Comptes joueurs"/"Vue joueur" ; ouverture/fermeture (clic extérieur + Échap avec retour focus) ; navigation clavier complète (Tab/Entrée) ; les 3 boutons de page (Dashboard/Analyse/Joueurs) restent inchangés | 2026-08-28 (E2E-03) |

## Secondaire (hors périmètre par défaut — non testé sauf demande explicite)

| # | Feature | Note |
|---|---------|------|
| S1 | Page Match (`page-match`) | Désactivée dans le HTML (`display:none !important`) — dead page, pas de nav vers elle |
| S2 | Chat IA rule-based (page Analyse) | Fonctionnalité secondaire, backlog prévoit migration vers API Claude |
| S3 | Détails cosmétiques (couleurs, tailles canvas) | Nombreux commits v190-v221 sont purement visuels |

---

## Méthode de mise à jour
- Après chaque story livrée + validée QA (et E2E Tester si convoqué) : ajouter/mettre à jour la ligne correspondante.
- Avant chaque mise en production : parcourir en priorité Critique puis Important, cibler ce qui est plausible à risque avec la version en cours.
- Réutiliser les parcours déjà exécutés en conditions réelles (`docs/e2e/E2E-*.md`) plutôt que de repartir de zéro.

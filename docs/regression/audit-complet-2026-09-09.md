# Audit complet — 2026-09-09

**Agents :** Regression Guardian + E2E Tester
**Version testée :** v277 (dernière story livrée : STORY-46, "Chat IA — questions types suggérées")
**Méthode :** Playwright, navigateur réel, serveur statique local (port 8240), données réelles Supabase (projet `oamldfduxwsghrxdsaxy`). Authentification staff réelle (mot de passe `Partage`).
**Périmètre :** intégralité de la checklist Critique + Important (`docs/regression/checklist.md`), aucun périmètre restreint demandé.

---

## 1. Périmètre testé

### Critique (7)
C1 Authentification Staff · C2 Authentification Joueur · C3 Import Excel · C4 Dashboard staff · C5 Page Joueurs (terrain + fiche) · C6 Mode Lecture Joueur mobile · C7 Persistance des filtres entre pages

### Important (25)
I1 Page Analyse · I2 Page Notes · I3 Graphique évolution · I4 Stats Gardien (fiche) · I5 Page Impact · I6 Familles d'enclenchement · I7 Comptes joueurs · I8 Export PDF/PPT · I9 Menu Outils · I10 Onglets internes Analyse · I11 Vue joueur (preview) · I12 Migration locale · I13 Note coach · I14 Éditeur familles tactiques · I15 Éditeur bilans · I16 Impact mobile GB · I17 Tooltip Impact · I18 Photos avatar · I19 Photos terrain · I20 Photo couverture export · I21 Import Articulation défensive · I22 Mode Articulation · I23 Indicateurs clés (Rythme/Supériorités) · I24 Bloc Essentiel · I25 Terrain accordéon/Météo · I26 Timeline · I27 Matrice 2×2 · I28 Chat IA chips

**Secondaire** : non inclus (aucune demande explicite).

### Précaution appliquée (conforme à la mémoire projet "pas de backend de test")
Le serveur local pointe vers la vraie base Supabase de production — aucune action d'écriture destructive ou irréversible n'a été redéclenchée cette session : pas de réimport Excel (C3, I21), pas de nouvelle création/suppression de compte joueur (I7), pas de nouvel ajout/suppression de bilan (I15) ou de famille tactique (I14), pas de nouvelle sauvegarde de note coach (I13), pas de nouvel export PDF/PPT cliqué (I8, I20). Ces features ont été vérifiées par lecture d'écran (l'UI s'ouvre et affiche les données existantes correctement, sans erreur) et leur dernière vérification en écriture réelle, non périmée par un changement de code, a été conservée telle quelle dans la checklist.

---

## 2. Résultat par feature

| # | Feature | Résultat |
|---|---------|----------|
| C1 | Authentification Staff | ✅ |
| C2 | Authentification Joueur | ⚠️ non re-testé en conditions réelles (aucun compte joueur actif sur le projet) — vérifié indirectement via impersonation (I11) |
| C3 | Import Excel | ⚠️ non re-testé (action destructive évitée) — dashboard vérifié sain |
| C4 | Dashboard staff | ✅ |
| C5 | Page Joueurs (terrain + fiche) | ✅ (joueur de champ + gardien) |
| C6 | Mode Lecture Joueur mobile | ✅ (via impersonation, gardien réel Enzo Ditta) |
| C7 | Persistance des filtres | ✅ |
| I1 | Page Analyse | ✅ |
| I2 | Page Notes | ✅ (joueur de champ + gardien) |
| I3 | Graphique évolution | ✅ |
| I4 | Stats Gardien (fiche) | ✅ |
| I5 | Page Impact | ✅ (joueur de champ + gardien) |
| I6 | Familles d'enclenchement | ✅ |
| I7 | Comptes joueurs | ⚠️ panneau vérifié, cycle écriture non redéclenché |
| I8 | Export PDF/PPT | ⚠️ bouton présent, non re-cliqué |
| I9 | Menu Outils | ✅ |
| I10 | Onglets internes Analyse | ✅ |
| I11 | Vue joueur (preview) | ✅ |
| I12 | Migration locale | ✅ |
| I13 | Note coach | ✅ (lecture), sauvegarde non redéclenchée |
| I14 | Éditeur familles tactiques | ⚠️ panneau vérifié, écriture non redéclenchée |
| I15 | Éditeur bilans | ⚠️ panneau vérifié, écriture non redéclenchée |
| I16 | Impact mobile GB | ✅ |
| I17 | Tooltip Impact | ✅ |
| I18 | Photos avatar | ✅ |
| I19 | Photos terrain + bascule | ✅ |
| I20 | Photo couverture export | ⚠️ non re-déclenché (cf. I8) |
| I21 | Import Articulation défensive | ⚠️ non re-testé (cf. C3) |
| I22 | Mode Articulation | ✅ |
| I23 | Indicateurs clés (Rythme/Supériorités) | ✅ |
| I24 | Bloc Essentiel | ✅ |
| I25 | Terrain accordéon/Météo | ✅ |
| I26 | Timeline | ✅ |
| I27 | Matrice 2×2 | ✅ |
| I28 | Chat IA chips | ✅ |

Captures d'écran : `docs/regression/screenshots/audit-2026-09-09-*.png` (31 captures, une par étape clé du parcours).

## 3. Point d'attention méthodologique (non une régression applicative)

En testant le tooltip de la Timeline (I26), une première tentative de simulation de survol via `MouseEvent` synthétique a échoué à cause d'un arrondi sub-pixel des coordonnées `clientX`/`clientY` (le navigateur tronque les décimales), manquant la zone de détection de moins d'un pixel. Root-cause confirmée par instrumentation directe (`window._timelineHitAreas`, comparaison des coordonnées attendues vs reçues) : ce n'est pas un bug de l'application — un vrai survol de souris ne rencontre jamais cette imprécision — mais un artefact de la méthode de simulation. Corrigé en ciblant le centre de la zone de détection plutôt que son bord ; le tooltip et le clic fonctionnent normalement.

Un second point, déjà documenté dans la checklist (I28) : une capture plein-page Playwright déclenche un redimensionnement de viewport qui réinitialise le chat de la page Analyse (comportement du `window.resize` global, indépendant des chips). Reconfirmé cette session comme pré-existant et hors scope.

## 4. Régressions détectées

**Aucune.** Tous les parcours testés en conditions réelles se comportent conformément à leur critère de bon fonctionnement documenté dans la checklist.

## 5. Verdict global

**RAS** — aucune régression détectée sur l'intégralité du périmètre Critique + Important testable sans action d'écriture destructive. Les 8 items marqués ⚠️ ne signalent pas un doute sur leur fonctionnement mais l'application délibérée de la règle de prudence "pas de backend de test" : leur code n'a pas changé depuis leur dernière vérification en écriture réelle (toutes antérieures à cette session, aucune plus vieille que le 2026-09-02), et leur partie lecture/affichage a été re-confirmée saine cette session.

Application v277 **prête pour un usage en production** sans réserve sur le périmètre testé.

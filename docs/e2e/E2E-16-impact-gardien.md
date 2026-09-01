# E2E-16 — Page Impact pour un gardien (STORY-27 + STORY-28)

**Agent :** E2E Tester
**Date :** 2026-09-01
**Outil :** MCP Playwright, serveur statique local (port 8981), API REST Supabase pour vérification indépendante

---

## Parcours testés (STORY-27, vue staff)

### 1. Routage et rendu pour un gardien
1. Sélection de Gabin SALTEL (GS) sur le terrain SVG → clic "🎯 Impact"
2. Page active : `page-impact` (plus `page-gardiens`)
3. Rendu : "Gabin SALTEL — Gardien de But", 6/16, 38% (badge violet), 3 vues terrain peuplées de points verts (arrêt) et croix rouges (but encaissé)
4. Capture : `docs/e2e/screenshots/story-27-impact-gardien.png`

### 2. Non-régression — joueur de champ
1. Sélection d'Antonin Vache (AV) → "🎯 Impact"
2. Rendu identique à toutes les vérifications précédentes de cette session : "Antonin VACHE — Demi-Centre", 2/4, 50% (rouge), 2 points verts (Central) + 2 croix rouges (Ext Droit), légende "But marqué"/"Tir raté"
3. Capture : `docs/e2e/screenshots/story-27-impact-joueur-champ-nonregression.png`

### 3. Les 3 gardiens réels
- Gabin.S : 6/16, 38%
- Noah.O : 15/40, 38%
- Enzo.D : 15/40, 38%
- Cohérents avec la table GB (page Notes, STORY-26/v246)

### 4. Filtre Résultat pour un gardien
1. "Arrêt" seul → 6 points (`IMPACT_DOTS` toutes vues confondues)
2. "But encaissé" seul → 10 points
3. Somme = 16 = total sans filtre

### 5. Mitigation R1 — grille Efficacité par zone
1. Mode "🎨 Efficacité" activé, gardien sélectionné
2. 7 cellules avec zone de données affichent un %, aucune classe `zr-eff-vert/orange/rouge` appliquée (vérifié via `classList`)

### 6. Filtre "Joueur" — les 3 gardiens désormais sélectionnables
1. `#filter-impact-joueur` : `Enzo.D`, `Gabin.S`, `Noah.O` tous présents, aucun doublon (contrairement au filtre équivalent de la page Notes observé lors de STORY-26, corrigé par le même fix)

## Parcours testés (STORY-28, mode mobile)

1. Compte de test créé pour Gabin.S via le panneau Comptes joueurs réel
2. Connexion réelle avec ce compte, onglet "Zones" (375px)
3. Rendu : "ARRÊTS ET BUTS CONCÉDÉS", 6 arrêts/16 tirs, 38%, 3 vues terrain, grille de zones avec %, légende "Arrêté"/"Encaissé"
4. Capture : `docs/e2e/screenshots/story-28-mobile-gardien-zones.png`
5. Aucun écart avec l'attendu de l'Architecture (`renderPlayerZones()` déjà correct) — confirmé, pas supposé

## Nettoyage effectué

Compte de test (Gabin.S) supprimé via l'Edge Function réelle, vérifié vide via l'API REST (`player_profiles`).

## Résultat

Tous les parcours passent en conditions réelles. Cohérence croisée vérifiée entre 4 écrans indépendants (fiche joueur, table GB, onglet Gardien Analyse, nouvel écran Impact) — aucune divergence.

---

## Verdict : ✅ PASSED

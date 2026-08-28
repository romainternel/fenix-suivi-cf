# QA-03 — STORY-12 : Menu "Outils"

**Agent :** QA
**Date :** 2026-08-28
**Méthode :** Test en navigateur réel (Playwright), local, code au commit en cours (post-implémentation Developer)

---

## Critères validés

| Critère | Statut | Preuve |
|---|---|---|
| Bouton "⚙ Outils ▾" distinct des 3 pages (contour vs fond plein) | ✅ | Capture desktop 1280px |
| Menu déroulant avec "🔑 Comptes joueurs" et "👤 Vue joueur" | ✅ | Capture |
| Clic sur une entrée = comportement identique à avant (`openPlayerAccountsModal`/`openPreviewModal`) | ✅ | `#pa-modal` et `#preview-modal` passent bien à `display:flex` |
| Fermeture au clic extérieur | ✅ | `#nav-tools-menu` repasse à `display:none` |
| Fermeture à Échap + focus rendu au bouton "Outils" | ✅ | `document.activeElement.id === 'nav-tools-btn'` après Échap |
| Navigation clavier complète (Tab → Outils → Entrée → menu ouvert → Tab → item → Entrée → modale ouverte) | ✅ | Testé au clavier réel (pas de simulation de clic) : 3 Tab pour atteindre "Outils" depuis le body, Entrée ouvre le menu, Tab entre dans le menu, Entrée sur "Comptes joueurs" ouvre bien `#pa-modal` |
| Dashboard / Analyse / Joueurs non affectés | ✅ | Les 3 boutons changent bien `.page.active` comme avant |
| Testé desktop (1280px) | ✅ | |
| Testé mobile (375px) | ✅ | Bouton "Outils" et menu restent dans le viewport, pas de débordement horizontal |

**9/9 critères validés.**

## Cas limites testés
- Clic rapide successif sur "Outils" (ouvre/ferme) : pas de comportement erratique, pas d'erreur console.
- Ouverture du menu puis clic direct sur un item (sans passer par un mouvement de souris entre les deux) : fonctionne, le menu se ferme et la modale s'ouvre dans la foulée.

## Régressions détectées
Aucune. Les 3 pages principales et les 2 actions (Comptes, Vue joueur) se comportent exactement comme avant l'implémentation, seul l'habillage change.

## Verdict global

**✅ PASSED**

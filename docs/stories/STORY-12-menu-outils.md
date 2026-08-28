# STORY-12 — Regrouper Comptes et Vue joueur dans un menu "Outils"

**En tant que** membre du staff,
**Je veux** distinguer visuellement les vraies pages (Dashboard, Analyse, Joueurs) des actions ponctuelles (Comptes, Vue joueur),
**Afin de** comprendre en un coup d'œil ce qui est une destination et ce qui est un raccourci d'action.

## Contexte technique
- Zone concernée : `FENIX-HANDBALL-CF-SUIVI.html` (barre de nav, ~ligne 85-90), `css/style.css`
- Les boutons `#btn-player-accounts` (`onclick="openPlayerAccountsModal()"`) et `#btn-preview-mode` (`onclick="openPreviewModal()"`) existent déjà et **ne font pas partie** du système `.nav-btn` / `setupNavigation()` — ils sont déjà techniquement autonomes, seul leur habillage visuel change dans cette story.
- Réutiliser le pattern dropdown déjà présent dans le code pour le filtre RÉSULTAT de la barre sticky Analyse (`.multi-select-dropdown` / `.multi-select-btn`) plutôt qu'en écrire un nouveau.
- Design de référence : `docs/design/navigation-refonte.md` §1.

## Critères d'acceptation
- [ ] Un bouton "⚙ Outils ▾" apparaît à droite de la barre de nav, visuellement distinct des 3 boutons de page (contour plutôt que fond plein, cf. Visual)
- [ ] Au clic, un menu déroulant s'ouvre avec 2 entrées : "🔑 Comptes joueurs" et "👤 Vue joueur"
- [ ] Cliquer sur une entrée déclenche exactement le même comportement qu'aujourd'hui (`openPlayerAccountsModal()` / `openPreviewModal()`) — aucune régression fonctionnelle
- [ ] Le menu se ferme au clic en dehors, et via la touche Échap (le focus clavier revient sur le bouton "Outils")
- [ ] Navigation clavier : le bouton "Outils" et ses 2 entrées sont atteignables au Tab, activables au clavier (Entrée/Espace)
- [ ] Les boutons Dashboard / Analyse / Joueurs ne sont pas touchés — même comportement, même position relative
- [ ] Testé sur desktop (1280px) et mobile (375px, si la barre de nav staff y est visible)

## Hors scope
- Le contenu des modales Comptes/Vue joueur (formulaire, sélecteur) — inchangé dans cette story, traité en STORY-19.
- La transformation de la modale en panneau latéral — STORY-19 également.

## Dépend de
- Aucune

## Taille
S

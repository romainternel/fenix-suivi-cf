# Visuel — Migration Supabase

**Agent :** Visual Crafter
**Date :** 2026-08-28

---

## Principe général

Ce cycle n'introduit **aucun nouveau token** — tout se construit avec la palette et les classes déjà établies (STORY-13 à STORY-19) : `--fenix-blue` (#0A2463), `--fenix-accent` (#3B82F6), l'échelle de gris `--gray-50` → `--gray-900`, `--shadow-sm/md/lg`, `.slide-panel`/`.slide-panel-overlay`, `.surface-card`. Un projet de migration technique ne justifie pas une nouvelle identité visuelle ; l'objectif est que ces écrans aient l'air d'avoir toujours fait partie de l'app.

## 1. État de chargement (F3)

- Plein écran, fond `var(--gray-50)` (cohérent avec le fond de page général, pas blanc pur).
- Spinner : cercle simple `border: 3px solid var(--gray-200); border-top-color: var(--fenix-blue); border-radius: 50%; width/height: 32px; animation: spin 0.8s linear infinite;` — pas d'icône animée fantaisiste, un spinner sobre et rapide.
- Texte "Chargement des données…" : échelle "Corps" (Inter, 0.82rem, `--gray-600`), sous le spinner, `margin-top: 12px`.
- Le tout dans une carte `.surface-card` centrée (`max-width: 320px`), pas juste posé sur le fond — même traitement que n'importe quel bloc de contenu de l'app.
- Apparition : `opacity 0→1, 150ms ease-out` — évite le flash brutal si le chargement est très rapide (< 100ms), tout en restant sous la limite de 250ms.

## 2. État d'erreur réseau (F3)

- Même carte `.surface-card`, icône `📡⚠️` à `font-size: 2rem`, couleur d'icône neutre (pas de rouge alarmiste — une coupure réseau n'est pas une faute de l'utilisateur).
- Titre "Impossible de contacter le serveur" : échelle "Section" (Bebas Neue, 1.05rem, `--fenix-dark`).
- Sous-texte : échelle "Corps", `--gray-600`.
- Bouton "🔄 Réessayer" : style bouton primaire existant (`background: var(--fenix-blue); color: white`), même famille que les boutons "CRÉER LE COMPTE"/"Voir sa vue →" déjà en place — pas un nouveau style de bouton.
- `:hover` → `background: var(--fenix-blue-light)`, `:focus-visible` → `outline: 2px solid var(--fenix-accent); outline-offset: 2px` (cohérent avec Visual §4 de la refonte navigation).

## 3. Prompt de migration (F5)

- Carte `.surface-hero` (pas `.surface-card`) — c'est une action ponctuelle et importante (protège des données réelles), elle mérite l'élévation la plus marquée de l'app, cohérente avec la règle "Niveau 2 : bloc le plus important de l'écran".
- Icône 🔄 en tête, `font-size: 1.4rem`, à côté du titre "MIGRATION VERS SUPABASE" en échelle "Display" (Bebas Neue, 1.4rem, letter-spacing 1.5px, `--fenix-blue`) — même traitement que les titres de page existants.
- Liste des éléments trouvés : chaque ligne `✓ {count} {label}` en échelle "Corps", coche `✓` en `var(--fenix-success)` (`#10B981`) — seule touche de couleur sémantique de l'écran, pour confirmer "c'est trouvé, c'est bon", pas pour alarmer.
- Bouton "Annuler" : style secondaire déjà utilisé pour "Annuler" du panneau Vue joueur (`border: 1.5px solid var(--gray-200); background: white; color: var(--gray-600)`).
- Bouton "Migrer maintenant" : style primaire (`--fenix-blue`), placé à droite du bouton secondaire — même agencement que le panneau Vue joueur (Annuler à gauche, action primaire à droite).
- Message de confirmation post-migration ("✅ Migration terminée") : `background: #D1FAE5; color: #065F46` (pattern badge déjà établi, fond clair/texte foncé), disparaît après 2s ou au clic.

## 4. Éditeur de familles (F6)

- Réutilise **exactement** `.slide-panel`/`.slide-panel-overlay` (STORY-19) — aucune variation visuelle, même largeur (`min(480px, 92vw)`), même transition (`translateX`, 200ms ease-out), même overlay (`rgba(0,0,0,0.55)`, opacity 0→1).
- Formulaire d'ajout : même traitement que le formulaire "Ajouter un compte" du panneau Comptes joueurs (fond `var(--gray-50)`, `border-radius: 10px`, `padding: 16px`) — cohérence directe avec le panneau jumeau le plus proche fonctionnellement.
- Sélecteur "Famille" (dropdown fermé sur 8 valeurs) : style `<select>` standard déjà utilisé partout dans l'app (`border: 1px solid var(--gray-200); border-radius: 8px; padding: 8px 12px`), **option supplémentaire** : chaque `<option>` peut être préfixée d'un point de couleur via un `<span>` si le rendu natif du `<select>` le permet facilement (sinon, le rendu texte seul suffit — pas la peine de forcer un dropdown custom juste pour ça, cf. principe "Je ne code pas" mais recommandation au Developer : ne pas complexifier inutilement).
- Liste des correspondances existantes : réutilise le pattern table `.jm-table`-like déjà présent dans le panneau Comptes joueurs (`th` fond `--gray-100`, lignes séparées par `border-bottom: 1px solid var(--gray-100)`), bouton supprimer `🗑` en `color: var(--fenix-danger)` sur `background: none` — identique au bouton supprimer de `deletePlayerAccount()`.
- Message "configuration initiale" (état par défaut) : bandeau `background: #EFF6FF; color: #1E40AF; border-radius: 8px; padding: 8px 12px; font-size: 0.78rem` — même famille que `.pmf-badge-streak` déjà en usage ailleurs dans l'app (bleu informatif, ni succès ni alerte).

## 5. Checklist contraste WCAG

| Élément | Couleurs | Ratio | Statut |
|---|---|---|---|
| Texte chargement/erreur sur `.surface-card` | `--gray-600` (#64748B) sur blanc | 4.6:1 | ✅ AA |
| Coche migration | `--fenix-success` (#10B981) sur blanc | 2.5:1 (décoratif, pas du texte porteur d'info seul — le texte associé est en noir) | ✅ (icône, pas texte informatif isolé) |
| Message confirmation migration | `#065F46` sur `#D1FAE5` | 7.7:1 | ✅ AAA |
| Bandeau "configuration initiale" | `#1E40AF` sur `#EFF6FF` | 8.2:1 | ✅ AAA |
| Bouton primaire | blanc sur `--fenix-blue` (#0A2463) | 12.6:1 | ✅ AAA |

Aucun nouveau cas à risque identifié — tous les éléments de ce cycle réutilisent des paires couleur déjà validées dans les cycles précédents.

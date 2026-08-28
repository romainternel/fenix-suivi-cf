# STORY-13 — Tokens visuels de base (couleurs, ombres, typographie, radius)

**En tant que** développeur (moi-même dans les stories suivantes),
**Je veux** disposer des nouveaux tokens CSS définis par le Visual Crafter,
**Afin de** pouvoir habiller chaque écran ensuite sans redéfinir la palette à chaque fois.

## Contexte technique
- Zone concernée : `css/style.css`, bloc `:root` (~lignes 1-28)
- Spec exacte : `docs/visual/navigation-refonte.md` §1 (palette), §2 (typographie), §3 (ombres/élévation)
- Pure addition de tokens et de classes utilitaires — **aucune** modification de composant existant dans cette story (c'est la fondation, pas l'application).

## Critères d'acceptation
- [ ] Tokens `--gray-50` à `--gray-900` ajoutés dans `:root`, avec les valeurs exactes de `docs/visual/navigation-refonte.md` §1.2
- [ ] Tokens `--surface-raised` et `--surface-raised-border` ajoutés (§1.3)
- [ ] Classes utilitaires `.surface-flat`, `.surface-card`, `.surface-hero` créées selon §3 (bordure, ombre, radius, transition + état hover pour `.surface-card`)
- [ ] Échelle typographique de `docs/visual/navigation-refonte.md` §2 documentée en commentaire CSS au-dessus du bloc `:root` (référence pour les stories suivantes — pas de nouvelle classe générique imposée, chaque écran applique la bonne taille dans sa propre story)
- [ ] Aucun composant existant ne change de rendu suite à cette story (tokens ajoutés, rien retiré ni réassigné) — vérifié par un tour rapide des 3 pages principales avant de committer
- [ ] Les 6 paires de contraste de `docs/visual/navigation-refonte.md` §6 sont vérifiées telles quelles (aucune n'a changé de valeur depuis la spec)

## Hors scope
- Application de ces tokens à un écran précis — chaque écran a sa propre story (STORY-15 à STORY-18)
- Le remplacement des badges pleins rouge/vert par le pattern "texte foncé sur fond clair" (§6 de la spec Visual) — c'est un changement de composant existant, pas une addition de token ; traité dans la story de l'écran où le badge apparaît

## Dépend de
- Aucune

## Taille
S

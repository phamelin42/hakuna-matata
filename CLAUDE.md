# Hakuna Matata

Règles communes à tous les projets de Phil (copie de `phamelin42/claude-context`, ne pas la modifier ici ; ce fichier l'emporte en cas de désaccord) : @.claude/CLAUDE.commun.md

## Le projet

Site du podcast **Hakuna Matata**, « un podcast par Soraya » (émission Spotify : `podcast.json`, `spotifyShowUrl`). Visiteurs : des auditeurs qui veulent **lire** (écouter), **filtrer** et **trier** les épisodes. Domaine : hakuna-matata.phamelin.fr. FR seulement, pré-rendu, sans back-end.

Pages : `/` (accueil, derniers épisodes), `/a-propos`, `/episodes` (recherche, année, durée, tri), `/episodes/:id` (lecteur audio natif, lien Spotify, épisodes voisins). L'en-tête place le **logo (la pochette) au milieu**, lien vers l'accueil, entre « À propos » et « Épisodes » ; la pochette est aussi l'icône d'onglet.

## Commandes

| Commande                             | Rôle                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `npm start`                          | Serveur de développement                                                                          |
| `npm test` / `npm run test:tools`    | Tests unitaires (Vitest via `ng test`) / tests de `tools/` (node) : flux RSS, contrastes du thème |
| `npm run lint` / `npm run typecheck` | ESLint (angular-eslint) / tsc sur l'appli et les specs                                            |
| `npm run build`                      | Build + pré-rendu (`dist/hakuna-matata/browser`), puis `tools/seo.mjs`                            |
| `npm run e2e`                        | Playwright sur ce build (`E2E_PORT` règle le port, 4300 par défaut)                               |
| `npm run sync:episodes <url RSS>`    | Réécrit `src/app/data/episodes.json` depuis le flux du podcast                                    |

## Structure

- `src/app/data/` : `episodes.json` (écrit par `sync:episodes`, ne pas éditer à la main sauf pour un épisode que le flux n'a pas) et `podcast.json`. Embarqués au build : **aucun appel réseau à l'exécution**.
- `src/app/episodes/` : modèle, `Catalog`, filtres et tris purs (`episode-query.ts`), formats, carte d'épisode.
- `src/app/pages/`, `src/app/layout/`, `src/app/seo/` : pages, en-tête et pied de page, titre/description/canonique de chaque page.
- `src/theme.scss` : la surcouche de palette (valeurs des jetons de Fuda).
- `tools/` : `sync-episodes.mjs` (flux RSS → JSON, borné, texte brut), `seo.mjs` (sitemap, robots, `404.html`), `theme.test.mjs` (contrastes).
- `docs/adr-001-*.md` : pourquoi des données au build, pourquoi le pré-rendu et le lecteur natif.

## Règles à ne pas casser

- Le texte des épisodes vient d'un tiers : **jamais du HTML**, ni `innerHTML` ni `bypassSecurityTrust*` ; `sync-episodes` réduit tout à du texte brut.
- Aucun contenu inventé : pas de description du podcast, de thème d'épisode ou de biographie qui ne vienne pas de Soraya ou du flux. `podcast.description` vide = la page « À propos » reste factuelle.
- Pas d'iframe ni de SDK Spotify (cookies tiers) : lecteur `<audio>` natif quand le flux donne un fichier, lien « Écouter sur Spotify » sinon.
- Durées : courts < 15 min, moyens de 15 à 30 min, longs 30 min et plus. Dates à l'heure de Paris (pré-rendu et navigateur doivent dire la même chose).
- Les couleurs viennent de `src/theme.scss` seulement ; `tools/theme.test.mjs` en vérifie les contrastes (Jour et Nuit). Changer une valeur = relancer `npm run test:tools`.
- Une page de plus s'ajoute à `e2e/pages.ts` (axe Jour/Nuit et reflow la prennent alors toute seule) et à `tools/seo.mjs` si elle est indexable.

## Écarts au contexte commun

- **Palette de la pochette en surcouche** (`src/theme.scss`, chargé après `fuda.css`) : sable, crème, lagon turquoise, menthe, ambre, encre presque noir ; Nuit en lagon de nuit. Elle redéfinit les valeurs des jetons de Fuda avec les mêmes sélecteurs et les mêmes noms (`sakura` est ici le turquoise). Fuda reste en `^0.1.0` et **sa direction artistique ne change pas** (décision de Phil : un thème propre à un site se fait dans le site). Succès, info et erreur gardent la teinte de Fuda.
- Pas de CSP : le script de thème en ligne et les styles critiques d'Angular l'exigeraient avec empreintes ; à faire si Phil le demande.

## Pièges déjà rencontrés

- `<base href="/">` casse `href="#contenu"` (retour à l'accueil) : le lien d'évitement déplace le focus lui-même.
- La case d'un `fd-switch` est masquée sous la piste : Playwright clique le libellé (`getByText`), pas le `switch`.
- Un `import.meta.url` dans `e2e/` casse Playwright (paquet non ESM) : `process.cwd()`.
- Sur Vercel, le projet créé par `infra` ajoute un repli vers `index.html` (statut 200 pour toute adresse inconnue), que `http-server` ne reproduit pas : `vercel.json` utilise `routes` (système de fichiers, puis `404.html` en 404). Vérifier un 404 sur le site déployé, pas seulement en e2e.
- Angular 22 ne produit pas `404.html` tout seul : la route `404` est pré-rendue puis déplacée par `tools/seo.mjs`.

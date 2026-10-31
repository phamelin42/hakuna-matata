# hakuna-matata

Site du podcast **Hakuna Matata**, un podcast par Soraya : lire, filtrer et trier les épisodes.
Angular 22 et [Fuda](https://github.com/phamelin42/design-system-fuda), pré-rendu statique, déployé
sur hakuna-matata.phamelin.fr.

```bash
npm ci
npm start                       # développement
npm run sync:episodes <url RSS> # met à jour src/app/data/episodes.json
npm run build && npm run e2e    # build pré-rendu puis Playwright
```

Voir `CLAUDE.md` pour la structure et les règles du projet, `docs/` pour les décisions.

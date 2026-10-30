import { inject } from '@angular/core';
import { RenderMode, ServerRoute } from '@angular/ssr';
import { Catalog } from './episodes/catalog';

/** Tout est pré-rendu au build : une page par épisode, et la page 404 pour le reste. */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'episodes/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => inject(Catalog).episodes.map((episode) => ({ id: episode.id })),
  },
  { path: '404', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Prerender },
];

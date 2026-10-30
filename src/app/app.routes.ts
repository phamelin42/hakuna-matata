import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then((m) => m.HomePage) },
  { path: 'a-propos', loadComponent: () => import('./pages/about/about').then((m) => m.AboutPage) },
  {
    path: 'episodes',
    loadComponent: () => import('./pages/episodes/episodes').then((m) => m.EpisodesPage),
  },
  {
    path: 'episodes/:id',
    loadComponent: () => import('./pages/episode/episode').then((m) => m.EpisodePage),
  },
  // Pré-rendue pour devenir `404.html` (voir tools/seo.mjs) : l'hébergeur y renvoie toute adresse inconnue, avec le statut 404.
  {
    path: '404',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage),
  },
];

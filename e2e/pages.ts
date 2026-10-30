import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const episodes: { id: string; title: string; publishedAt: string; durationSeconds: number }[] =
  JSON.parse(readFileSync(join(process.cwd(), 'src/app/data/episodes.json'), 'utf8'));

export const EPISODES = episodes;

/** Toutes les pages du site, pour que l'audit axe et le reflow n'en oublient aucune. */
export const PAGES = [
  { name: 'accueil', path: '/' },
  { name: 'à propos', path: '/a-propos' },
  { name: 'épisodes', path: '/episodes' },
  ...episodes.map((episode) => ({
    name: `épisode ${episode.id}`,
    path: `/episodes/${episode.id}`,
  })),
  { name: 'page introuvable', path: '/une-page-qui-nexiste-pas' },
];

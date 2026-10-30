import { Episode, Podcast } from '../episodes/episode';

export const PODCAST: Podcast = {
  title: 'Hakuna Matata',
  author: 'Soraya',
  description: null,
  siteUrl: 'https://hakuna-matata.test',
  spotifyShowUrl: 'https://open.spotify.com/show/test',
};

export function makeEpisode(overrides: Partial<Episode> = {}): Episode {
  return {
    id: 'episode',
    title: 'Un épisode',
    description: 'Une description.',
    publishedAt: '2026-01-09T18:29:00Z',
    durationSeconds: 1200,
    ...overrides,
  };
}

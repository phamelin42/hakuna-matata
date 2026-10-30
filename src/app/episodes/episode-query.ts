import { Episode } from './episode';

export type EpisodeLength = 'all' | 'short' | 'medium' | 'long';
export type EpisodeSort = 'newest' | 'oldest' | 'shortest' | 'longest' | 'title';

export interface EpisodeFilters {
  readonly text: string;
  /** Année sur quatre chiffres, ou `all`. */
  readonly year: string;
  readonly length: EpisodeLength;
}

export const NO_FILTERS: EpisodeFilters = { text: '', year: 'all', length: 'all' };

/** Les épisodes courts durent moins de 15 min, les longs 30 min et plus. */
export const SHORT_BELOW_SECONDS = 15 * 60;
export const LONG_FROM_SECONDS = 30 * 60;

/** Minuscules sans accents : « Épisode » se trouve en tapant « episode ». */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();
}

export function yearOf(episode: Episode): number {
  return new Date(episode.publishedAt).getUTCFullYear();
}

function lengthOf(episode: Episode): Exclude<EpisodeLength, 'all'> {
  if (episode.durationSeconds < SHORT_BELOW_SECONDS) return 'short';
  return episode.durationSeconds >= LONG_FROM_SECONDS ? 'long' : 'medium';
}

export function isFiltered(filters: EpisodeFilters): boolean {
  return normalize(filters.text) !== '' || filters.year !== 'all' || filters.length !== 'all';
}

export function filterEpisodes(
  episodes: readonly Episode[],
  filters: EpisodeFilters,
): readonly Episode[] {
  const words = normalize(filters.text).split(/\s+/).filter(Boolean);
  return episodes.filter((episode) => {
    if (filters.year !== 'all' && String(yearOf(episode)) !== filters.year) return false;
    if (filters.length !== 'all' && lengthOf(episode) !== filters.length) return false;
    const haystack = normalize(`${episode.title} ${episode.description}`);
    return words.every((word) => haystack.includes(word));
  });
}

const BY_NEWEST = (a: Episode, b: Episode) =>
  Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.id.localeCompare(b.id);

const COMPARATORS: Record<EpisodeSort, (a: Episode, b: Episode) => number> = {
  newest: BY_NEWEST,
  oldest: (a, b) => -BY_NEWEST(a, b),
  shortest: (a, b) => a.durationSeconds - b.durationSeconds || BY_NEWEST(a, b),
  longest: (a, b) => b.durationSeconds - a.durationSeconds || BY_NEWEST(a, b),
  title: (a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }) || BY_NEWEST(a, b),
};

export function sortEpisodes(episodes: readonly Episode[], sort: EpisodeSort): readonly Episode[] {
  return [...episodes].sort(COMPARATORS[sort]);
}

/** Années présentes dans le catalogue, de la plus récente à la plus ancienne. */
export function yearsOf(episodes: readonly Episode[]): readonly number[] {
  return [...new Set(episodes.map(yearOf))].sort((a, b) => b - a);
}

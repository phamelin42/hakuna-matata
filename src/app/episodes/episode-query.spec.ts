import { makeEpisode } from '../testing/episodes';
import {
  filterEpisodes,
  isFiltered,
  LONG_FROM_SECONDS,
  NO_FILTERS,
  SHORT_BELOW_SECONDS,
  sortEpisodes,
  yearsOf,
} from './episode-query';

const episodes = [
  makeEpisode({
    id: 'a',
    title: 'Été à la plage',
    publishedAt: '2024-07-01T10:00:00Z',
    durationSeconds: 600,
  }),
  makeEpisode({
    id: 'b',
    title: 'Le sommeil',
    description: 'Dormir, enfin.',
    publishedAt: '2025-03-10T10:00:00Z',
    durationSeconds: 1500,
  }),
  makeEpisode({
    id: 'c',
    title: 'Ça va ?',
    publishedAt: '2025-11-20T10:00:00Z',
    durationSeconds: 2400,
  }),
];

const ids = (list: readonly { id: string }[]) => list.map((episode) => episode.id);

describe('filterEpisodes', () => {
  it('garde tout sans filtre', () => {
    expect(ids(filterEpisodes(episodes, NO_FILTERS))).toEqual(['a', 'b', 'c']);
  });

  it('cherche sans tenir compte des accents ni de la casse', () => {
    expect(ids(filterEpisodes(episodes, { ...NO_FILTERS, text: 'ETE' }))).toEqual(['a']);
    expect(ids(filterEpisodes(episodes, { ...NO_FILTERS, text: 'ca va' }))).toEqual(['c']);
  });

  it('cherche aussi dans la description, et exige tous les mots', () => {
    expect(ids(filterEpisodes(episodes, { ...NO_FILTERS, text: 'dormir' }))).toEqual(['b']);
    expect(ids(filterEpisodes(episodes, { ...NO_FILTERS, text: 'sommeil dormir' }))).toEqual(['b']);
    expect(ids(filterEpisodes(episodes, { ...NO_FILTERS, text: 'sommeil plage' }))).toEqual([]);
  });

  it('traite les caractères spéciaux comme du texte', () => {
    expect(filterEpisodes(episodes, { ...NO_FILTERS, text: '[nano]' })).toEqual([]);
    expect(filterEpisodes(episodes, { ...NO_FILTERS, text: '*' })).toEqual([]);
  });

  it('filtre par année', () => {
    expect(ids(filterEpisodes(episodes, { ...NO_FILTERS, year: '2025' }))).toEqual(['b', 'c']);
    expect(filterEpisodes(episodes, { ...NO_FILTERS, year: '1999' })).toEqual([]);
  });

  it('filtre par durée, aux bornes exactes', () => {
    const at = (durationSeconds: number) => [makeEpisode({ id: 'x', durationSeconds })];
    expect(
      filterEpisodes(at(SHORT_BELOW_SECONDS - 1), { ...NO_FILTERS, length: 'short' }),
    ).toHaveLength(1);
    expect(
      filterEpisodes(at(SHORT_BELOW_SECONDS), { ...NO_FILTERS, length: 'short' }),
    ).toHaveLength(0);
    expect(
      filterEpisodes(at(SHORT_BELOW_SECONDS), { ...NO_FILTERS, length: 'medium' }),
    ).toHaveLength(1);
    expect(
      filterEpisodes(at(LONG_FROM_SECONDS - 1), { ...NO_FILTERS, length: 'medium' }),
    ).toHaveLength(1);
    expect(filterEpisodes(at(LONG_FROM_SECONDS), { ...NO_FILTERS, length: 'medium' })).toHaveLength(
      0,
    );
    expect(filterEpisodes(at(LONG_FROM_SECONDS), { ...NO_FILTERS, length: 'long' })).toHaveLength(
      1,
    );
  });

  it('combine les filtres', () => {
    expect(ids(filterEpisodes(episodes, { text: 'le', year: '2025', length: 'medium' }))).toEqual([
      'b',
    ]);
  });
});

describe('sortEpisodes', () => {
  it.each([
    ['newest', ['c', 'b', 'a']],
    ['oldest', ['a', 'b', 'c']],
    ['shortest', ['a', 'b', 'c']],
    ['longest', ['c', 'b', 'a']],
    ['title', ['c', 'a', 'b']], // « Ça va ? », « Été à la plage », « Le sommeil » : A à Z sans tenir compte des accents
  ] as const)('trie par %s', (sort, expected) => {
    expect(ids(sortEpisodes(episodes, sort))).toEqual(expected);
  });

  it("ne modifie pas la liste d'origine", () => {
    sortEpisodes(episodes, 'oldest');
    expect(ids(episodes)).toEqual(['a', 'b', 'c']);
  });

  it('départage les égalités du plus récent au plus ancien', () => {
    const tied = [
      makeEpisode({ id: 'old', durationSeconds: 60, publishedAt: '2024-01-01T00:00:00Z' }),
      makeEpisode({ id: 'new', durationSeconds: 60, publishedAt: '2025-01-01T00:00:00Z' }),
    ];
    expect(ids(sortEpisodes(tied, 'shortest'))).toEqual(['new', 'old']);
    expect(ids(sortEpisodes(tied, 'longest'))).toEqual(['new', 'old']);
  });
});

describe('yearsOf et isFiltered', () => {
  it('liste les années du plus récent au plus ancien, sans doublon', () => {
    expect(yearsOf(episodes)).toEqual([2025, 2024]);
  });

  it('sait si un filtre est actif', () => {
    expect(isFiltered(NO_FILTERS)).toBe(false);
    expect(isFiltered({ ...NO_FILTERS, text: '   ' })).toBe(false);
    expect(isFiltered({ ...NO_FILTERS, text: 'a' })).toBe(true);
    expect(isFiltered({ ...NO_FILTERS, year: '2025' })).toBe(true);
    expect(isFiltered({ ...NO_FILTERS, length: 'long' })).toBe(true);
  });
});

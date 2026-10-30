import { Episode } from '../episodes/episode';
import episodes from './episodes.json';
import podcast from './podcast.json';

const list = episodes as Episode[];

describe('data/episodes.json', () => {
  it('a des identifiants uniques, utilisables dans une URL', () => {
    const ids = list.map((episode) => episode.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it.each(list.map((episode) => [episode.id, episode] as const))(
    '« %s » est complet et sûr',
    (_id, episode) => {
      expect(episode.title.trim()).not.toBe('');
      expect(Number.isNaN(Date.parse(episode.publishedAt))).toBe(false);
      expect(episode.publishedAt).toMatch(/Z$/);
      expect(episode.durationSeconds).toBeGreaterThan(0);
      expect(episode.description).not.toMatch(/<[a-z/]/i);
      if (episode.spotifyId) expect(episode.spotifyId).toMatch(/^[A-Za-z0-9]{22}$/);
      if (episode.audioUrl) expect(episode.audioUrl).toMatch(/^https:\/\//);
    },
  );
});

describe('data/podcast.json', () => {
  it('pointe vers Spotify et vers le site, en https', () => {
    expect(podcast.spotifyShowUrl).toMatch(/^https:\/\/open\.spotify\.com\/show\/[A-Za-z0-9]+$/);
    expect(podcast.siteUrl).toMatch(/^https:\/\/[^/]+$/);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Catalog } from '../../episodes/catalog';
import { Episode } from '../../episodes/episode';
import { makeEpisode, PODCAST } from '../../testing/episodes';
import { EpisodePage } from './episode';

describe('EpisodePage', () => {
  const newest = makeEpisode({
    id: 'recent',
    title: 'Récent',
    publishedAt: '2026-02-01T10:00:00Z',
  });
  const middle = makeEpisode({
    id: 'milieu',
    title: 'Au milieu',
    description: 'Premier paragraphe.\n\nSecond paragraphe.',
    publishedAt: '2026-01-09T18:29:00Z',
    durationSeconds: 1418,
    audioUrl: 'https://cdn.test/milieu.mp3',
    spotifyId: '2Q64Lqako1wt5JPb9Sv3eQ',
  });
  const oldest = makeEpisode({
    id: 'ancien',
    title: 'Ancien',
    publishedAt: '2025-12-01T10:00:00Z',
  });
  const all: Episode[] = [newest, middle, oldest];

  async function render(id: string): Promise<HTMLElement> {
    const catalog: Partial<Catalog> = {
      podcast: PODCAST,
      episodes: all,
      find: (wanted) => all.find((episode) => episode.id === wanted),
      neighbours: (episode) => ({
        newer: all[all.indexOf(episode) - 1],
        older: all[all.indexOf(episode) + 1],
      }),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: Catalog, useValue: catalog }],
    });
    const fixture: ComponentFixture<EpisodePage> = TestBed.createComponent(EpisodePage);
    fixture.componentRef.setInput('id', id);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('présente titre, date, durée et description paragraphe par paragraphe', async () => {
    const page = await render('milieu');
    expect(page.querySelector('h1')?.textContent).toBe('Au milieu');
    expect(page.querySelector('time')?.getAttribute('datetime')).toBe('2026-01-09T18:29:00Z');
    expect(page.querySelector('.app-episode__meta')?.textContent).toContain('9 janvier 2026');
    expect(page.querySelector('.app-episode__meta')?.textContent).toContain('24 min');
    expect(
      Array.from(page.querySelectorAll('.app-episode__description p')).map((p) => p.textContent),
    ).toEqual(['Premier paragraphe.', 'Second paragraphe.']);
  });

  it("lit l'épisode avec le lecteur natif et propose Spotify dans un nouvel onglet sûr", async () => {
    const page = await render('milieu');
    const audio = page.querySelector('audio')!;
    expect(audio.getAttribute('src')).toBe('https://cdn.test/milieu.mp3');
    expect(audio.hasAttribute('controls')).toBe(true);
    expect(audio.getAttribute('preload')).toBe('none');
    expect(audio.getAttribute('aria-label')).toBe('Écouter : Au milieu');
    const spotify = page.querySelector<HTMLAnchorElement>(
      'a[href^="https://open.spotify.com/episode/"]',
    )!;
    expect(spotify.getAttribute('href')).toBe(
      'https://open.spotify.com/episode/2Q64Lqako1wt5JPb9Sv3eQ',
    );
    expect(spotify.getAttribute('target')).toBe('_blank');
    expect(spotify.getAttribute('rel')).toBe('noopener noreferrer');
    expect(spotify.textContent).toContain('(nouvel onglet)');
  });

  it("n'affiche ni lecteur ni lien Spotify quand l'épisode n'en a pas", async () => {
    const page = await render('recent');
    expect(page.querySelector('audio')).toBeNull();
    expect(page.querySelector('a[href^="https://open.spotify.com"]')).toBeNull();
  });

  it('renvoie aux épisodes voisins', async () => {
    const page = await render('milieu');
    const links = Array.from(page.querySelectorAll('nav[aria-label="Autres épisodes"] a'));
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/episodes/recent',
      '/episodes/ancien',
    ]);
    expect(links[0].textContent).toContain('Épisode suivant');
    expect(links[1].textContent).toContain('Épisode précédent');
  });

  it('ne met aucun lien « suivant » sur le plus récent', async () => {
    const page = await render('recent');
    expect(page.textContent).not.toContain('Épisode suivant');
    expect(page.textContent).toContain('Épisode précédent');
  });

  it('affiche une page introuvable pour un identifiant inconnu', async () => {
    const page = await render('nimporte-quoi');
    expect(page.querySelector('app-not-found')).not.toBeNull();
    expect(page.querySelector('audio')).toBeNull();
  });
});

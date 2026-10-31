import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { makeEpisode } from '../../testing/episodes';
import { EpisodeCard } from './episode-card';

describe('EpisodeCard', () => {
  async function render(overrides = {}): Promise<HTMLElement> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(EpisodeCard);
    fixture.componentRef.setInput(
      'episode',
      makeEpisode({
        id: 'sommeil',
        title: 'Le sommeil',
        description: 'Dormir, enfin.',
        publishedAt: '2026-01-09T18:29:00Z',
        durationSeconds: 1418,
        ...overrides,
      }),
    );
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('montre la pochette du podcast, le titre, la date, la durée et la description', async () => {
    const card = await render();
    const image = card.querySelector('img')!;
    expect(image.getAttribute('src')).toBe('logo-160.webp');
    expect(image.getAttribute('srcset')).toContain('logo-320.webp 2x');
    expect(image.getAttribute('width')).toBe('96');
    expect(card.querySelector('.fd-card__title')?.textContent).toBe('Le sommeil');
    expect(card.querySelector('.fd-card__meta')?.textContent).toContain('9 janvier 2026');
    expect(card.querySelector('.fd-card__meta')?.textContent).toContain('Durée : 24 min');
    expect(card.querySelector('.app-episode-card__text')?.textContent).toBe('Dormir, enfin.');
  });

  it("traite la pochette comme décorative : le titre nomme déjà l'épisode", async () => {
    expect((await render()).querySelector('img')!.getAttribute('alt')).toBe('');
  });

  it("est un seul lien vers la page de l'épisode", async () => {
    const links = (await render()).querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('/episodes/sommeil');
  });

  it("n'affiche pas de bloc de description vide", async () => {
    expect((await render({ description: '' })).querySelector('.app-episode-card__text')).toBeNull();
  });
});

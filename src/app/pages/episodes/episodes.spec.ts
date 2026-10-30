import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Catalog } from '../../episodes/catalog';
import { Episode } from '../../episodes/episode';
import { sortEpisodes } from '../../episodes/episode-query';
import { makeEpisode, PODCAST } from '../../testing/episodes';
import { EpisodesPage } from './episodes';

function catalogOf(episodes: Episode[]): Partial<Catalog> {
  return { podcast: PODCAST, episodes: sortEpisodes(episodes, 'newest') };
}

describe('EpisodesPage', () => {
  async function render(episodes: Episode[]): Promise<ComponentFixture<EpisodesPage>> {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: Catalog, useValue: catalogOf(episodes) }],
    });
    const fixture = TestBed.createComponent(EpisodesPage);
    await fixture.whenStable();
    return fixture;
  }

  const root = (fixture: ComponentFixture<EpisodesPage>): HTMLElement => fixture.nativeElement;
  const titles = (fixture: ComponentFixture<EpisodesPage>) =>
    Array.from(root(fixture).querySelectorAll('.fd-card__title')).map((title) =>
      title.textContent?.trim(),
    );
  const status = (fixture: ComponentFixture<EpisodesPage>) =>
    root(fixture).querySelector('[role=status]')!.textContent?.trim();

  async function type(fixture: ComponentFixture<EpisodesPage>, text: string): Promise<void> {
    const input = root(fixture).querySelector<HTMLInputElement>('input[type=search]')!;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function choose(
    fixture: ComponentFixture<EpisodesPage>,
    label: string,
    value: string,
  ): Promise<void> {
    const select = Array.from(root(fixture).querySelectorAll('fd-select'))
      .find((element) => element.textContent?.includes(label))!
      .querySelector('select')!;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }

  const catalog = [
    makeEpisode({
      id: 'sommeil',
      title: 'Le sommeil',
      publishedAt: '2025-03-10T10:00:00Z',
      durationSeconds: 1500,
    }),
    makeEpisode({
      id: 'plage',
      title: 'Été à la plage',
      publishedAt: '2024-07-01T10:00:00Z',
      durationSeconds: 600,
    }),
    makeEpisode({
      id: 'peur',
      title: 'Parler de la peur',
      publishedAt: '2025-11-20T10:00:00Z',
      durationSeconds: 2400,
    }),
  ];

  it('affiche tous les épisodes, du plus récent au plus ancien', async () => {
    const fixture = await render(catalog);
    expect(titles(fixture)).toEqual(['Parler de la peur', 'Le sommeil', 'Été à la plage']);
    expect(status(fixture)).toBe('3 épisodes');
  });

  it('filtre par texte et annonce le nombre de résultats', async () => {
    const fixture = await render(catalog);
    await type(fixture, 'ete');
    expect(titles(fixture)).toEqual(['Été à la plage']);
    expect(status(fixture)).toBe('1 épisode sur 3');
  });

  it('filtre par année et par durée', async () => {
    const fixture = await render(catalog);
    await choose(fixture, 'Année', '2025');
    expect(titles(fixture)).toEqual(['Parler de la peur', 'Le sommeil']);
    await choose(fixture, 'Durée', 'long');
    expect(titles(fixture)).toEqual(['Parler de la peur']);
  });

  it('trie par titre, par durée et du plus ancien au plus récent', async () => {
    const fixture = await render(catalog);
    await choose(fixture, 'Trier par', 'title');
    expect(titles(fixture)).toEqual(['Été à la plage', 'Le sommeil', 'Parler de la peur']);
    await choose(fixture, 'Trier par', 'shortest');
    expect(titles(fixture)).toEqual(['Été à la plage', 'Le sommeil', 'Parler de la peur']);
    await choose(fixture, 'Trier par', 'oldest');
    expect(titles(fixture)).toEqual(['Été à la plage', 'Le sommeil', 'Parler de la peur']);
    await choose(fixture, 'Trier par', 'longest');
    expect(titles(fixture)).toEqual(['Parler de la peur', 'Le sommeil', 'Été à la plage']);
  });

  it("explique l'absence de résultat et permet de réinitialiser", async () => {
    const fixture = await render(catalog);
    await type(fixture, 'zzz');
    expect(root(fixture).querySelector('fd-empty-state')?.textContent).toContain(
      'Aucun épisode ne correspond',
    );
    expect(status(fixture)).toBe('0 épisode sur 3');
    root(fixture).querySelector<HTMLButtonElement>('fd-empty-state button')!.click();
    await fixture.whenStable();
    expect(titles(fixture)).toHaveLength(3);
  });

  it('désactive « Réinitialiser » sans filtre actif, au sens de aria-disabled', async () => {
    const fixture = await render(catalog);
    const reset = root(fixture).querySelector('.app-filters__reset')!;
    expect(reset.getAttribute('aria-disabled')).toBe('true');
    await type(fixture, 'a');
    expect(reset.getAttribute('aria-disabled')).toBeNull();
  });

  it('affiche les épisodes par pages et revient à la première quand les résultats changent', async () => {
    const many = Array.from({ length: 30 }, (_, index) =>
      makeEpisode({
        id: `e${index}`,
        title: `Épisode ${index}`,
        publishedAt: `2025-01-${String(index + 1).padStart(2, '0')}T10:00:00Z`,
      }),
    );
    const fixture = await render(many);
    expect(titles(fixture)).toHaveLength(12);
    root(fixture).querySelector<HTMLButtonElement>('.app-episodes__more')!.click();
    await fixture.whenStable();
    expect(titles(fixture)).toHaveLength(24);
    await type(fixture, 'épisode 1');
    expect(titles(fixture).length).toBeLessThanOrEqual(12);
    await type(fixture, '');
    expect(titles(fixture)).toHaveLength(12);
  });
});

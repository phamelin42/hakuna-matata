import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  inject,
  Injector,
  linkedSignal,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { FdButton, FdEmptyState, FdSelect, FdSelectOption, FdTextField } from '@phamelin/fuda';
import { Catalog } from '../../episodes/catalog';
import { EpisodeCard } from '../../episodes/card/episode-card';
import {
  EpisodeFilters,
  EpisodeLength,
  EpisodeSort,
  filterEpisodes,
  isFiltered,
  NO_FILTERS,
  sortEpisodes,
  yearsOf,
} from '../../episodes/episode-query';
import { Seo } from '../../seo/seo';

/** Nombre d'épisodes affichés d'un coup, pour garder une page légère quand le catalogue grossit. */
const PAGE_SIZE = 12;

const LENGTH_OPTIONS: readonly FdSelectOption[] = [
  { value: 'all', label: 'Toutes les durées' },
  { value: 'short', label: 'Courts (moins de 15 min)' },
  { value: 'medium', label: 'Moyens (15 à 30 min)' },
  { value: 'long', label: 'Longs (30 min et plus)' },
];

const SORT_OPTIONS: readonly FdSelectOption[] = [
  { value: 'newest', label: 'Plus récents' },
  { value: 'oldest', label: 'Plus anciens' },
  { value: 'shortest', label: 'Plus courts' },
  { value: 'longest', label: 'Plus longs' },
  { value: 'title', label: 'Titre (A à Z)' },
];

@Component({
  selector: 'app-episodes',
  imports: [FdButton, FdEmptyState, FdSelect, FdTextField, EpisodeCard],
  templateUrl: './episodes.html',
  styleUrl: './episodes.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-episodes' },
})
export class EpisodesPage {
  private readonly catalog = inject(Catalog);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  protected readonly text = signal(NO_FILTERS.text);
  protected readonly year = signal(NO_FILTERS.year);
  protected readonly length = signal<string>(NO_FILTERS.length);
  protected readonly sort = signal<string>('newest');

  protected readonly lengthOptions = LENGTH_OPTIONS;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly yearOptions: readonly FdSelectOption[] = [
    { value: 'all', label: 'Toutes les années' },
    ...yearsOf(this.catalog.episodes).map((year) => ({ value: String(year), label: String(year) })),
  ];

  private readonly filters = computed<EpisodeFilters>(() => ({
    text: this.text(),
    year: this.year(),
    length: this.length() as EpisodeLength,
  }));
  protected readonly isFiltered = computed(() => isFiltered(this.filters()));

  protected readonly results = computed(() =>
    sortEpisodes(filterEpisodes(this.catalog.episodes, this.filters()), this.sort() as EpisodeSort),
  );
  /** Revient à la première page dès que les résultats changent. */
  private readonly visible = linkedSignal({ source: this.results, computation: () => PAGE_SIZE });
  protected readonly shown = computed(() => this.results().slice(0, this.visible()));
  protected readonly hasMore = computed(() => this.results().length > this.visible());

  protected readonly summary = computed(() => {
    const count = this.results().length;
    const total = this.catalog.episodes.length;
    const noun = count > 1 ? 'épisodes' : 'épisode';
    return this.isFiltered() ? `${count} ${noun} sur ${total}` : `${count} ${noun}`;
  });

  constructor() {
    const { podcast } = this.catalog;
    inject(Seo).set({
      title: `Épisodes · ${podcast.title}`,
      description: `Tous les épisodes de ${podcast.title}, à rechercher, filtrer par année ou par durée et à trier.`,
      path: '/episodes',
    });
  }

  protected reset(): void {
    this.text.set(NO_FILTERS.text);
    this.year.set(NO_FILTERS.year);
    this.length.set(NO_FILTERS.length);
  }

  protected showMore(): void {
    const firstNew = this.visible();
    this.visible.update((count) => count + PAGE_SIZE);
    // Le bouton disparaît quand tout est affiché : le focus passe au premier épisode ajouté.
    afterNextRender(
      () => this.document.querySelectorAll<HTMLElement>('.app-episodes__list a')[firstNew]?.focus(),
      { injector: this.injector },
    );
  }
}

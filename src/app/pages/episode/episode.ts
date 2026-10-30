import { Component, computed, effect, inject, input, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FdButton } from '@phamelin/fuda';
import { Catalog } from '../../episodes/catalog';
import { formatDate, formatDuration } from '../../episodes/format';
import { Seo } from '../../seo/seo';
import { NotFoundPage } from '../not-found/not-found';

const DESCRIPTION_LENGTH = 160;

@Component({
  selector: 'app-episode',
  imports: [FdButton, RouterLink, NotFoundPage],
  templateUrl: './episode.html',
  styleUrl: './episode.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-episode' },
})
export class EpisodePage {
  private readonly catalog = inject(Catalog);
  private readonly seo = inject(Seo);

  /** Paramètre de route `:id`. */
  readonly id = input<string>();

  protected readonly episode = computed(() => this.catalog.find(this.id()));
  protected readonly neighbours = computed(() => {
    const episode = this.episode();
    return episode ? this.catalog.neighbours(episode) : {};
  });
  protected readonly date = computed(() => formatDate(this.episode()?.publishedAt ?? ''));
  protected readonly duration = computed(() =>
    formatDuration(this.episode()?.durationSeconds ?? 0),
  );
  /** La description est en texte brut ; un saut de ligne vide sépare deux paragraphes. */
  protected readonly paragraphs = computed(() =>
    (this.episode()?.description ?? '')
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
  );

  constructor() {
    effect(() => {
      const episode = this.episode();
      if (!episode) return;
      const summary = episode.description.replace(/\s+/g, ' ').trim();
      this.seo.set({
        title: `${episode.title} · ${this.catalog.podcast.title}`,
        description:
          summary.length > DESCRIPTION_LENGTH
            ? `${summary.slice(0, DESCRIPTION_LENGTH - 1).trimEnd()}…`
            : summary ||
              `Épisode de ${this.catalog.podcast.title}, publié le ${this.date()} (${this.duration()}).`,
        path: `/episodes/${episode.id}`,
      });
    });
  }
}

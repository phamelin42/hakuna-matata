import { Component, computed, input, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FdBadge, FdCard } from '@phamelin/fuda';
import { Episode } from '../episode';
import { formatDate, formatDuration } from '../format';

@Component({
  selector: 'app-episode-card',
  imports: [FdCard, FdBadge, RouterLink],
  templateUrl: './episode-card.html',
  styleUrl: './episode-card.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-episode-card' },
})
export class EpisodeCard {
  readonly episode = input.required<Episode>();

  protected readonly date = computed(() => formatDate(this.episode().publishedAt));
  protected readonly duration = computed(() => formatDuration(this.episode().durationSeconds));
}

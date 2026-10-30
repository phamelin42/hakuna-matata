import { Component, inject, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FdButton } from '@phamelin/fuda';
import { Catalog } from '../../episodes/catalog';
import { EpisodeCard } from '../../episodes/card/episode-card';
import { Seo } from '../../seo/seo';

const LATEST_COUNT = 3;

@Component({
  selector: 'app-home',
  imports: [FdButton, RouterLink, EpisodeCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-home' },
})
export class HomePage {
  private readonly catalog = inject(Catalog);

  protected readonly podcast = this.catalog.podcast;
  protected readonly latest = this.catalog.episodes.slice(0, LATEST_COUNT);

  constructor() {
    inject(Seo).set({
      title: `${this.podcast.title}, un podcast par ${this.podcast.author}`,
      description: `${this.podcast.title}, un podcast par ${this.podcast.author} : tous les épisodes, à écouter, filtrer et trier.`,
      path: '/',
    });
  }
}

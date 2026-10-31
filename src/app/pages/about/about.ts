import { Component, inject, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FdButton } from '@phamelin/fuda';
import { Catalog } from '../../episodes/catalog';
import { Seo } from '../../seo/seo';

@Component({
  selector: 'app-about',
  imports: [FdButton, RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-about' },
})
export class AboutPage {
  protected readonly podcast = inject(Catalog).podcast;
  /** La description du flux est en texte brut ; un saut de ligne vide sépare deux paragraphes. */
  protected readonly paragraphs = (this.podcast.description ?? '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  constructor() {
    inject(Seo).set({
      title: `À propos · ${this.podcast.title}`,
      description: `${this.podcast.title} est un podcast de ${this.podcast.author}, à écouter sur Spotify.`,
      path: '/a-propos',
    });
  }
}

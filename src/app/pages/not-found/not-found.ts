import { Component, inject, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FdButton, FdEmptyState } from '@phamelin/fuda';
import { Seo } from '../../seo/seo';

@Component({
  selector: 'app-not-found',
  imports: [FdButton, FdEmptyState, RouterLink],
  templateUrl: './not-found.html',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-not-found' },
})
export class NotFoundPage {
  constructor() {
    inject(Seo).set({
      title: 'Page introuvable · Hakuna Matata',
      description: "Cette page n'existe pas.",
      path: '/404',
      noindex: true,
    });
  }
}

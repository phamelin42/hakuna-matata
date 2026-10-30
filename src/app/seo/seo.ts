import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Catalog } from '../episodes/catalog';

export interface PageMeta {
  readonly title: string;
  readonly description: string;
  /** Chemin de la page, avec le `/` initial (`/episodes`). */
  readonly path: string;
  readonly noindex?: boolean;
}

/** Titre, description, URL canonique et aperçu de partage de chaque page. */
@Service()
export class Seo {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly siteUrl = inject(Catalog).podcast.siteUrl;

  set(page: PageMeta): void {
    const url = `${this.siteUrl}${page.path === '/' ? '/' : page.path}`;
    this.titleService.setTitle(page.title);
    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({ property: 'og:title', content: page.title });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: `${this.siteUrl}/logo-og.jpg` });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    if (page.noindex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
    } else {
      this.meta.removeTag('name="robots"');
    }
    this.setCanonical(page.noindex ? undefined : url);
  }

  private setCanonical(url: string | undefined): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!url) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}

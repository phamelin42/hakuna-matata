import { DOCUMENT } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Footer } from './layout/footer/footer';
import { Header } from './layout/header/header';

@Component({
  selector: 'app-root',
  imports: [Header, Footer, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app' },
})
export class App {
  private readonly document = inject(DOCUMENT);
  private hasNavigated = false;

  constructor() {
    // Une navigation ne recharge pas la page : le focus passe au contenu, sinon un lecteur
    // d'écran ou le clavier restent sur le lien de la page précédente.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        const main = this.document.getElementById('contenu');
        if (this.hasNavigated) main?.focus({ preventScroll: true });
        this.hasNavigated = true;
      });
  }

  /** Avec `<base href="/">`, un lien `#contenu` renverrait à l'accueil : on déplace le focus nous-mêmes. */
  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.document.getElementById('contenu')?.focus();
  }
}

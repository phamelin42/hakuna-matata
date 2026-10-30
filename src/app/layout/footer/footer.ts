import { Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { FdSwitch, FdThemeService } from '@phamelin/fuda';
import { Catalog } from '../../episodes/catalog';

@Component({
  selector: 'app-footer',
  imports: [FdSwitch],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-footer' },
})
export class Footer {
  private readonly themeService = inject(FdThemeService);

  protected readonly podcast = inject(Catalog).podcast;
  protected readonly isDark = computed(() => this.themeService.theme() === 'dark');

  protected setDark(dark: boolean): void {
    this.themeService.set(dark ? 'dark' : 'light');
  }
}

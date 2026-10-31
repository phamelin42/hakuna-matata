import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Header } from './header';

describe('Header', () => {
  async function render(): Promise<HTMLElement> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('place le logo, lien vers l’accueil, entre « À propos » et « Épisodes »', async () => {
    const links = Array.from((await render()).querySelectorAll('a'));
    expect(
      links.map((link) => link.getAttribute('aria-label') ?? link.textContent?.trim()),
    ).toEqual(['À propos', 'Hakuna Matata, accueil', 'Épisodes']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/a-propos', '/', '/episodes']);
  });

  it("donne au logo un nom sans le répéter : l'image est décorative", async () => {
    const image = (await render()).querySelector('img')!;
    expect(image.getAttribute('alt')).toBe('');
    expect(image.getAttribute('width')).toBe('64');
  });
});

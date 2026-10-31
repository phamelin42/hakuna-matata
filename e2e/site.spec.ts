import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';
import { EPISODES, PAGES } from './pages';

async function openInTheme(page: Page, path: string, theme: 'light' | 'dark'): Promise<void> {
  if (theme === 'dark') {
    await page.addInitScript(() => localStorage.setItem('fuda-theme', 'dark'));
  }
  await page.goto(path);
  await expect(page.locator('h1').first()).toBeVisible();
}

test.describe('en-tête', () => {
  test('place le logo au milieu, entre « À propos » et « Épisodes »', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Principal' });
    const links = nav.getByRole('link');
    await expect(links).toHaveText(['À propos', '', 'Épisodes']);
    const logo = nav.getByRole('link', { name: 'Hakuna Matata, accueil' });
    const [before, after, middle] = await Promise.all([
      links.nth(0).boundingBox(),
      links.nth(2).boundingBox(),
      logo.boundingBox(),
    ]);
    expect(before!.x + before!.width).toBeLessThanOrEqual(middle!.x);
    expect(middle!.x + middle!.width).toBeLessThanOrEqual(after!.x);
    const pageCenter = 1200 / 2;
    expect(Math.abs(middle!.x + middle!.width / 2 - pageCenter)).toBeLessThan(2);
  });

  test("le logo ramène à l'accueil, les sections ouvrent leur page", async ({ page }) => {
    await page.goto('/episodes');
    await page.getByRole('link', { name: 'À propos', exact: true }).click();
    await expect(page).toHaveURL(/\/a-propos$/);
    await expect(page.getByRole('heading', { level: 1, name: 'À propos' })).toBeVisible();
    await page.getByRole('link', { name: 'Hakuna Matata, accueil' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Épisodes', exact: true })
      .click();
    await expect(page.getByRole('heading', { level: 1, name: 'Épisodes' })).toBeVisible();
  });

  test('marque la page courante', async ({ page }) => {
    await page.goto('/episodes');
    await expect(page.locator('nav [aria-current="page"]')).toHaveText('Épisodes');
  });

  test('a des cibles d’au moins 44 px', async ({ page }) => {
    await page.goto('/');
    const links = page.getByRole('navigation', { name: 'Principal' }).getByRole('link');
    for (const box of await Promise.all([0, 1, 2].map((index) => links.nth(index).boundingBox()))) {
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('icône d’onglet et référencement', () => {
  test('les icônes répondent et sont déclarées dans la page', async ({ page, request }) => {
    await page.goto('/');
    const declared = await page
      .locator('link[rel~="icon"], link[rel="apple-touch-icon"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    expect(declared).toEqual(['favicon.svg', 'favicon.ico', 'apple-touch-icon.png']);
    for (const file of declared) {
      const response = await request.get(file!);
      expect(response.ok(), file!).toBe(true);
    }
  });

  for (const { name, path } of PAGES.filter((page) => !page.name.includes('introuvable'))) {
    test(`${name} : titre, description, canonique et contenu sans JavaScript`, async ({
      request,
    }) => {
      const html = await (await request.get(path)).text();
      expect(html).toMatch(/<title>[^<]{5,}<\/title>/);
      expect(html).toMatch(/<meta name="description" content="[^"]{20,}"/);
      expect(html).toContain('<link rel="canonical" href="https://hakuna-matata.phamelin.fr');
      expect(html).toMatch(/<h1[^>]*>[^<]+/);
    });
  }

  test('chaque page a son propre titre', async ({ request }) => {
    const indexable = PAGES.filter((page) => !page.name.includes('introuvable'));
    const titles = await Promise.all(
      indexable.map(
        async ({ path }) =>
          (await (await request.get(path)).text()).match(/<title>([^<]*)<\/title>/)![1],
      ),
    );
    expect(new Set(titles).size).toBe(titles.length);
  });

  test("l'adresse inconnue répond 404 et la page n'est pas indexable", async ({ request }) => {
    const response = await request.get('/une-page-qui-nexiste-pas');
    expect(response.status()).toBe(404);
    const html = await response.text();
    expect(html).toContain('Page introuvable');
    expect(html).toContain('<meta name="robots" content="noindex">');
  });

  test('robots.txt et sitemap.xml listent les pages indexables', async ({ request }) => {
    expect(await (await request.get('/robots.txt')).text()).toContain(
      'Sitemap: https://hakuna-matata.phamelin.fr/sitemap.xml',
    );
    const sitemap = await (await request.get('/sitemap.xml')).text();
    for (const path of [
      '/',
      '/a-propos',
      '/episodes',
      ...EPISODES.map((episode) => `/episodes/${episode.id}`),
    ]) {
      expect(sitemap).toContain(`<loc>https://hakuna-matata.phamelin.fr${path}</loc>`);
    }
    expect(sitemap).not.toContain('404');
  });
});

test.describe('épisodes', () => {
  test('aligne les quatre champs : mêmes libellés en haut, mêmes contrôles en dessous', async ({
    page,
  }) => {
    await page.goto('/episodes');
    const fields = [
      {
        name: 'Rechercher',
        control: page.getByRole('searchbox', { name: 'Rechercher', exact: true }),
      },
      { name: 'Année', control: page.getByRole('combobox', { name: 'Année', exact: true }) },
      { name: 'Durée', control: page.getByRole('combobox', { name: 'Durée', exact: true }) },
      {
        name: 'Trier par',
        control: page.getByRole('combobox', { name: 'Trier par', exact: true }),
      },
    ];
    const boxes = await Promise.all(
      fields.map(async ({ name, control }) => ({
        label: await page.locator('.fd-field__label', { hasText: name }).first().boundingBox(),
        control: await control.boundingBox(),
      })),
    );
    for (const { label, control } of boxes) {
      expect(label!.y).toBeCloseTo(boxes[0].label!.y, 0);
      expect(control!.y).toBeCloseTo(boxes[0].control!.y, 0);
      expect(control!.height).toBeCloseTo(boxes[0].control!.height, 0);
    }
  });

  test('chaque carte montre la pochette, le titre et la durée', async ({ page }) => {
    await page.goto('/episodes');
    const card = page.getByRole('link', { name: new RegExp(EPISODES[0].title.slice(0, 20)) });
    const cover = card.locator('img');
    await expect(cover).toBeVisible();
    await expect(cover).toHaveAttribute('alt', '');
    const [image, title] = await Promise.all([
      cover.boundingBox(),
      card.locator('.fd-card__title').boundingBox(),
    ]);
    expect(image!.x + image!.width).toBeLessThanOrEqual(title!.x);
    expect(await cover.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  });

  test('recherche, vide, puis réinitialise', async ({ page }) => {
    await page.goto('/episodes');
    const status = page.getByRole('status');
    await expect(status).toHaveText(
      `${EPISODES.length} ${EPISODES.length > 1 ? 'épisodes' : 'épisode'}`,
    );
    await page.getByRole('searchbox', { name: 'Rechercher' }).fill('zzzz introuvable');
    await expect(page.getByRole('heading', { name: 'Aucun épisode ne correspond' })).toBeVisible();
    await expect(status).toContainText(`0 épisode sur ${EPISODES.length}`);
    await page.getByRole('button', { name: 'Réinitialiser les filtres' }).last().click();
    await expect(
      page.getByRole('link', { name: new RegExp(EPISODES[0].title.slice(0, 20)) }),
    ).toBeVisible();
  });

  test('filtre par année et par durée, trie', async ({ page }) => {
    await page.goto('/episodes');
    await page
      .getByLabel('Année')
      .selectOption({ label: String(new Date(EPISODES[0].publishedAt).getUTCFullYear()) });
    await expect(
      page.getByRole('link', { name: new RegExp(EPISODES[0].title.slice(0, 20)) }),
    ).toBeVisible();
    await page.getByLabel('Durée').selectOption('short');
    await expect(page.getByRole('heading', { name: 'Aucun épisode ne correspond' })).toBeVisible();
    await page.getByLabel('Durée').selectOption('all');
    await page.getByLabel('Trier par').selectOption('title');
    await expect(page.getByLabel('Trier par')).toHaveValue('title');
    await expect(
      page.getByRole('link', { name: new RegExp(EPISODES[0].title.slice(0, 20)) }),
    ).toBeVisible();
  });

  test('ouvre un épisode depuis la liste, avec son lien Spotify', async ({ page }) => {
    await page.goto('/episodes');
    await page.getByRole('link', { name: new RegExp(EPISODES[0].title.slice(0, 20)) }).click();
    await expect(page.getByRole('heading', { level: 1, name: EPISODES[0].title })).toBeVisible();
    const spotify = page.locator('#contenu').getByRole('link', { name: /Écouter sur Spotify/ });
    await expect(spotify).toHaveAttribute(
      'href',
      /^https:\/\/open\.spotify\.com\/episode\/[A-Za-z0-9]{22}$/,
    );
    await expect(spotify).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

test.describe('clavier', () => {
  test('le lien d’évitement déplace le focus sur le contenu sans changer de page', async ({
    page,
  }) => {
    await page.goto('/a-propos');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Aller au contenu' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/a-propos$/);
    await expect(page.locator('#contenu')).toBeFocused();
  });

  test('après une navigation, le focus passe au contenu', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Épisodes', exact: true })
      .click();
    await expect(page.locator('#contenu')).toBeFocused();
  });

  test('le focus des liens est visible', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const shadow = await page
      .getByRole('link', { name: 'À propos', exact: true })
      .evaluate((element) => getComputedStyle(element).boxShadow);
    expect(shadow).not.toBe('none');
  });
});

test.describe('thème', () => {
  test('le choix Nuit est appliqué avant le premier rendu et retenu', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
    // La case est masquée sous la piste : on clique le libellé, comme le ferait un utilisateur.
    await page.getByText('Thème nuit').click();
    await expect(page.getByRole('switch', { name: 'Thème nuit' })).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('reflow à 320 px', () => {
  test.use({ viewport: { width: 320, height: 640 } });
  for (const { name, path } of PAGES) {
    test(`${name} : pas de défilement horizontal`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('h1').first()).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

for (const theme of ['light', 'dark'] as const) {
  test.describe(`axe (WCAG 2.2 AA), thème ${theme}`, () => {
    for (const { name, path } of PAGES) {
      test(name, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await openInTheme(page, path, theme);
        const { violations } = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag22aa', 'best-practice'])
          .analyze();
        expect(violations).toEqual([]);
      });
    }
  });
}

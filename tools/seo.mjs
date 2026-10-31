// Écrit sitemap.xml et robots.txt dans le build, à partir des routes et des épisodes.
// Lancé après `ng build` (voir le script `build`). Une page `noindex` n'y entre pas.
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const OUTPUT = new URL('../dist/hakuna-matata/browser/', import.meta.url);
const episodes = JSON.parse(
  readFileSync(new URL('../src/app/data/episodes.json', import.meta.url), 'utf8'),
);
const { siteUrl } = JSON.parse(
  readFileSync(new URL('../src/app/data/podcast.json', import.meta.url), 'utf8'),
);

const day = (iso) => iso.slice(0, 10);
const latest = episodes
  .map((episode) => episode.publishedAt)
  .sort()
  .at(-1);

const pages = [
  { path: '/', lastmod: latest },
  { path: '/a-propos' },
  { path: '/episodes', lastmod: latest },
  ...episodes.map((episode) => ({ path: `/episodes/${episode.id}`, lastmod: episode.publishedAt })),
];

const urls = pages
  .map(
    ({ path, lastmod }) =>
      `  <url><loc>${siteUrl}${path}</loc>${lastmod ? `<lastmod>${day(lastmod)}</lastmod>` : ''}</url>`,
  )
  .join('\n');

writeFileSync(
  new URL('sitemap.xml', OUTPUT),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
);
writeFileSync(
  new URL('robots.txt', OUTPUT),
  `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
);
console.log(`sitemap.xml : ${pages.length} pages.`);

// L'hébergeur sert `404.html` (avec le statut 404) pour toute adresse inconnue : on y déplace
// la page 404 pré-rendue, qui n'a pas à répondre sous `/404`.
cpSync(new URL('404/index.html', OUTPUT), new URL('404.html', OUTPUT));
rmSync(new URL('404/', OUTPUT), { recursive: true });

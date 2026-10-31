// Récupère le flux RSS du podcast et écrit src/app/data/episodes.json (et la description du
// podcast dans podcast.json). Le site n'appelle jamais le flux à l'exécution : tout est
// embarqué au build.
//
//   node tools/sync-episodes.mjs <url du flux RSS>
//
// Le flux est une entrée d'un tiers : taille et nombre d'épisodes bornés, descriptions
// réduites à du texte brut (jamais du HTML), audio en https seulement.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_ITEMS = 2000;
const EPISODES_FILE = new URL('../src/app/data/episodes.json', import.meta.url);
const PODCAST_FILE = new URL('../src/app/data/podcast.json', import.meta.url);

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const code =
        entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : +entity.slice(1);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/** Contenu d'une balise sans CDATA ni entités ; `undefined` si la balise est absente. */
function tag(block, name) {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  if (!match) return undefined;
  const raw = match[1].trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1] : decodeEntities(raw);
}

function attribute(block, name, attributeName) {
  const match = block.match(new RegExp(`<${name}\\s[^>]*?${attributeName}="([^"]*)"`, 'i'));
  return match ? decodeEntities(match[1]) : undefined;
}

/** Du HTML éventuel au texte brut : paragraphes séparés par une ligne vide, aucune balise. */
export function toPlainText(html) {
  const text = decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h[1-6])>/gi, '\n\n')
      .replace(/<[^>]*>/g, ''),
  );
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

/** `1:02:03`, `23:37` ou `1417` (secondes) donnent des secondes ; `undefined` sinon. */
export function parseDuration(value) {
  if (!value || !/^\d+(:\d{1,2}){0,2}$/.test(value.trim())) return undefined;
  const seconds = value
    .trim()
    .split(':')
    .reduce((total, part) => total * 60 + Number(part), 0);
  return seconds > 0 ? seconds : undefined;
}

export function slugify(title) {
  return title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

function spotifyIdOf(...candidates) {
  for (const candidate of candidates) {
    const match = candidate?.match(/open\.spotify\.com\/episode\/([A-Za-z0-9]{22})/);
    if (match) return match[1];
  }
  return undefined;
}

/** Analyse un flux RSS : `{ description, episodes }`, du plus récent au plus ancien. */
export function parseFeed(xml) {
  const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0, MAX_ITEMS);
  const channel = xml.slice(
    0,
    xml.search(/<item[\s>]/i) === -1 ? undefined : xml.search(/<item[\s>]/i),
  );
  const channelDescription = tag(channel, 'description') ?? tag(channel, 'itunes:summary');

  const used = new Set();
  const episodes = items.map(([, block], index) => {
    const title = toPlainText(tag(block, 'title') ?? '');
    const publishedAt = Date.parse(tag(block, 'pubDate') ?? '');
    const durationSeconds = parseDuration(tag(block, 'itunes:duration'));
    if (!title) throw new Error(`Épisode ${index + 1} : titre absent`);
    if (Number.isNaN(publishedAt)) throw new Error(`« ${title} » : date de publication invalide`);
    if (!durationSeconds) throw new Error(`« ${title} » : durée absente ou invalide`);

    let id = slugify(title) || `episode-${index + 1}`;
    for (let suffix = 2; used.has(id); suffix += 1) id = `${slugify(title) || 'episode'}-${suffix}`;
    used.add(id);

    const audio = attribute(block, 'enclosure', 'url');
    const number = Number(tag(block, 'itunes:episode'));
    const description = toPlainText(
      tag(block, 'content:encoded') ??
        tag(block, 'description') ??
        tag(block, 'itunes:summary') ??
        '',
    );
    return {
      id,
      title,
      description,
      publishedAt: new Date(publishedAt).toISOString().replace('.000Z', 'Z'),
      durationSeconds,
      ...(Number.isInteger(number) && number > 0 ? { episodeNumber: number } : {}),
      ...(spotifyIdOf(tag(block, 'link'), tag(block, 'guid'))
        ? { spotifyId: spotifyIdOf(tag(block, 'link'), tag(block, 'guid')) }
        : {}),
      ...(audio?.startsWith('https://') ? { audioUrl: audio } : {}),
    };
  });

  episodes.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  return {
    description: channelDescription ? toPlainText(channelDescription) || null : null,
    episodes,
  };
}

/** Garde l'identifiant Spotify déjà connu quand le flux ne le donne pas (même titre). */
export function mergeKnown(fresh, known) {
  const byTitle = new Map(known.map((episode) => [episode.title, episode]));
  return fresh.map((episode) => {
    const previous = byTitle.get(episode.title);
    return episode.spotifyId || !previous?.spotifyId
      ? episode
      : { ...episode, spotifyId: previous.spotifyId };
  });
}

async function main(url) {
  if (!url?.startsWith('https://'))
    throw new Error('Usage : node tools/sync-episodes.mjs <url https du flux RSS>');
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Flux illisible : HTTP ${response.status}`);
  const xml = await response.text();
  if (xml.length > MAX_BYTES) throw new Error('Flux trop gros : synchronisation refusée');

  const { description, episodes } = parseFeed(xml);
  if (episodes.length === 0) throw new Error('Aucun épisode dans le flux : fichiers inchangés');

  const known = JSON.parse(readFileSync(EPISODES_FILE, 'utf8'));
  writeFileSync(EPISODES_FILE, `${JSON.stringify(mergeKnown(episodes, known), null, 2)}\n`);

  const podcast = JSON.parse(readFileSync(PODCAST_FILE, 'utf8'));
  writeFileSync(PODCAST_FILE, `${JSON.stringify({ ...podcast, description }, null, 2)}\n`);
  console.log(`${episodes.length} épisodes écrits.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv[2]).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

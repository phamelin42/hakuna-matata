import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mergeKnown, parseDuration, parseFeed, slugify, toPlainText } from './sync-episodes.mjs';

const item = (fields) => `<item>${fields}</item>`;
const feed = (...items) =>
  `<rss><channel><title>Hakuna Matata</title><description><![CDATA[<p>Un podcast &amp; des histoires.</p>]]></description>${items.join('')}</channel></rss>`;

const base = `<title>Épisode un</title><pubDate>Fri, 09 Jan 2026 18:29:00 GMT</pubDate><itunes:duration>23:37</itunes:duration>`;

test('lit titre, date, durée, description et audio', () => {
  const { episodes, description } = parseFeed(
    feed(
      item(
        `${base}<description><![CDATA[<p>Bonjour</p><p>le monde</p>]]></description><enclosure url="https://cdn.example/a.mp3" type="audio/mpeg"/><itunes:episode>3</itunes:episode>`,
      ),
    ),
  );
  assert.deepEqual(episodes, [
    {
      id: 'episode-un',
      title: 'Épisode un',
      description: 'Bonjour\n\nle monde',
      publishedAt: '2026-01-09T18:29:00Z',
      durationSeconds: 1417,
      episodeNumber: 3,
      audioUrl: 'https://cdn.example/a.mp3',
    },
  ]);
  assert.equal(description, 'Un podcast & des histoires.');
});

test('trie du plus récent au plus ancien', () => {
  const older = item(
    `<title>Ancien</title><pubDate>Mon, 01 Dec 2025 10:00:00 GMT</pubDate><itunes:duration>600</itunes:duration>`,
  );
  const { episodes } = parseFeed(feed(older, item(base)));
  assert.deepEqual(
    episodes.map((episode) => episode.id),
    ['episode-un', 'ancien'],
  );
});

test('accepte toutes les écritures de la durée', () => {
  assert.equal(parseDuration('1417'), 1417);
  assert.equal(parseDuration('23:37'), 1417);
  assert.equal(parseDuration('1:02:03'), 3723);
  for (const invalid of ['', 'abc', '0', '1:2:3:4', '-5', undefined]) {
    assert.equal(parseDuration(invalid), undefined, String(invalid));
  }
});

test('réduit toute description à du texte brut, jamais du HTML', () => {
  const text = toPlainText(
    '<p>Un <b>mot</b> &lt;script&gt;</p><script>alert(1)</script><p>Deux<br>lignes</p>',
  );
  assert.ok(!/<[a-z/]/i.test(text.replace('<script>', '')), text);
  assert.equal(toPlainText('<img src=x onerror=alert(1)>Texte'), 'Texte');
  assert.equal(toPlainText('Café &amp; thé &#233; &#x41;'), 'Café & thé é A');
});

test("n'accepte l'audio qu'en https", () => {
  for (const url of ['http://cdn.example/a.mp3', 'javascript:alert(1)', 'ftp://x/a.mp3']) {
    const { episodes } = parseFeed(feed(item(`${base}<enclosure url="${url}"/>`)));
    assert.equal(episodes[0].audioUrl, undefined, url);
  }
});

test("rend des identifiants d'URL stables et uniques, accents et ponctuation compris", () => {
  assert.equal(
    slugify('Le vrai pourquoi de mon absence: peur, procrastination...'),
    'le-vrai-pourquoi-de-mon-absence-peur-procrastination',
  );
  assert.equal(slugify('Été * [nano] ça va ?'), 'ete-nano-ca-va');
  const { episodes } = parseFeed(feed(item(base), item(base.replace('09 Jan', '08 Jan'))));
  assert.equal(new Set(episodes.map((episode) => episode.id)).size, 2);
});

test('reconnaît l’identifiant Spotify dans le lien ou le guid', () => {
  const id = '2Q64Lqako1wt5JPb9Sv3eQ';
  const { episodes } = parseFeed(
    feed(item(`${base}<link>https://open.spotify.com/episode/${id}?si=x</link>`)),
  );
  assert.equal(episodes[0].spotifyId, id);
});

test('refuse un épisode sans titre, sans date valide ou sans durée', () => {
  assert.throws(() => parseFeed(feed(item('<title></title>'))), /titre absent/);
  assert.throws(
    () =>
      parseFeed(
        feed(item(base.replace(/<pubDate>.*<\/pubDate>/, '<pubDate>pas une date</pubDate>'))),
      ),
    /date/,
  );
  assert.throws(
    () => parseFeed(feed(item(base.replace(/<itunes:duration>.*<\/itunes:duration>/, '')))),
    /durée/,
  );
});

test('un flux sans épisode donne une liste vide, pas une exception', () => {
  assert.deepEqual(parseFeed(feed()).episodes, []);
});

test("garde l'identifiant Spotify déjà connu quand le flux n'en donne pas", () => {
  const known = [{ title: 'A', spotifyId: 'x'.repeat(22) }];
  assert.equal(mergeKnown([{ title: 'A' }], known)[0].spotifyId, 'x'.repeat(22));
  assert.equal(
    mergeKnown([{ title: 'A', spotifyId: 'y'.repeat(22) }], known)[0].spotifyId,
    'y'.repeat(22),
  );
  assert.equal(mergeKnown([{ title: 'B' }], known)[0].spotifyId, undefined);
});

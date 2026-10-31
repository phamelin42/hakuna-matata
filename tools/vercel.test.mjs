// vercel.json : une adresse inconnue répond 404 avec la page `404.html`. Vercel ajoute sinon un
// repli vers `index.html` en statut 200, que le serveur des e2e (http-server) ne reproduit pas.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));

test('les fichiers du build passent avant la page 404', () => {
  const filesystem = config.routes.findIndex((route) => route.handle === 'filesystem');
  assert.ok(filesystem >= 0, 'route { handle: "filesystem" } absente');
  const last = config.routes.at(-1);
  assert.equal(last.status, 404);
  assert.equal(last.dest, '/404.html');
  assert.ok(config.routes.indexOf(last) > filesystem);
});

test('les en-têtes de sécurité sont posés par une route (« headers » ne se mêle pas à « routes »)', () => {
  assert.equal(config.headers, undefined);
  const headers = config.routes.find((route) => route.headers?.['X-Content-Type-Options']);
  assert.equal(headers.headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers.continue, true);
});

test('seuls les fichiers à empreinte sont immuables', () => {
  const immutable = config.routes.filter((route) =>
    route.headers?.['Cache-Control']?.includes('immutable'),
  );
  assert.equal(immutable.length, 1);
  const pattern = new RegExp(`^${immutable[0].src}$`);
  assert.ok(pattern.test('/main-ABC123.js'));
  assert.ok(!pattern.test('/index.html'));
  assert.ok(!pattern.test('/404.html'));
});

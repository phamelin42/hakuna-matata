// Les couleurs de la surcouche (src/theme.scss) tiennent leurs contrastes dans les deux thèmes.
// Les paires sont celles que Fuda note sur chaque jeton (« sur `surface` »…) pour les valeurs
// redéfinies ici ; les autres jetons (succès, info, erreur) sont ceux de Fuda.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const scss = readFileSync(new URL('../src/theme.scss', import.meta.url), 'utf8');

/** `{ light: { surface: '#FAF4E6', … }, dark: { … } }`, lu dans les deux blocs du fichier. */
function readThemes() {
  const themes = {};
  for (const [, selector, body] of scss.matchAll(/^([^{/]+)\{([^}]*)\}/gm)) {
    const theme = selector.includes('dark') ? 'dark' : 'light';
    themes[theme] = Object.fromEntries(
      [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
    );
  }
  return themes;
}

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

const TEXT = [
  ['ink', ['surface', 'surface-raised', 'surface-sunken', 'sakura-soft', 'yamabuki-soft']],
  ['ink-muted', ['surface', 'surface-raised', 'surface-sunken']],
  ['sakura-deep', ['surface', 'surface-raised', 'surface-sunken', 'sakura-soft']],
  ['on-sakura', ['sakura', 'sakura-press']],
  ['on-yamabuki', ['yamabuki']],
  ['on-ink', ['ink']],
  ['on-tokiwa', []],
];
const NON_TEXT = [['line-strong', ['surface', 'surface-raised']]];

const themes = readThemes();

test('le fichier définit les thèmes Jour et Nuit', () => {
  assert.deepEqual(Object.keys(themes).sort(), ['dark', 'light']);
  for (const theme of Object.values(themes)) assert.ok(Object.keys(theme).length > 25);
});

for (const [theme, colors] of Object.entries(themes)) {
  for (const [list, minimum] of [
    [TEXT, 4.5],
    [NON_TEXT, 3],
  ]) {
    for (const [token, backgrounds] of list) {
      for (const background of backgrounds) {
        test(`${token} sur ${background} (${theme}) : ${minimum}:1`, () => {
          assert.ok(
            colors[token] && colors[background],
            `jeton absent : ${token} ou ${background}`,
          );
          const ratio = contrast(colors[token], colors[background]);
          assert.ok(ratio >= minimum, `${ratio.toFixed(2)}:1`);
        });
      }
    }
  }
}

test('une valeur sous le seuil est bien refusée', () => {
  assert.ok(contrast('#EFDDC5', '#FAF4E6') < 4.5);
});

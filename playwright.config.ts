import { defineConfig } from '@playwright/test';

// Le port se règle (E2E_PORT) et le serveur n'est jamais réutilisé : la machine héberge d'autres
// projets, et un serveur étranger sur le même port ferait tester le mauvais site.
const port = process.env['E2E_PORT'] ?? '4300';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    viewport: { width: 1200, height: 900 },
    // Pour utiliser un Chromium déjà installé : PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/chemin/vers/chrome
    launchOptions: {
      executablePath: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'],
    },
  },
  // Le test s'exécute sur le build de production : `npm run build` d'abord.
  webServer: {
    command: `npx http-server dist/hakuna-matata/browser -p ${port} -s`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
  },
});

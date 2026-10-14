import { defineConfig } from '@playwright/test';

// Osobny port, aby nie trafić na inny serwer deweloperski działający na domyślnym 5173.
const PORT = 5317;

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: `http://localhost:${PORT}/garden-planner/`, viewport: { width: 1440, height: 1000 }, browserName: 'chromium' },
  webServer: { command: `npm run build && npm run preview -- --port ${PORT} --strictPort`, url: `http://localhost:${PORT}/garden-planner/`, reuseExistingServer: false },
});

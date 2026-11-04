import { defineConfig, devices } from "@playwright/test";

const PORT = 5199;
// Par défaut : Chromium (ordinateur + mobile). NAVIGATEURS=tous ajoute Firefox et WebKit (Safari) :
// la CI le fait sur les pull requests et une fois par semaine.
const ci = !!process.env.CI;
const tous = process.env.NAVIGATEURS === "tous";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  // En CI, un processus par cœur (par défaut, la moitié : un seul sur la machine de GitHub).
  workers: ci ? "100%" : undefined,
  // La machine de CI est plus lente (WebKit surtout) : délai doublé pour les longs parcours.
  timeout: ci ? 60_000 : 30_000,
  reporter: ci ? "github" : "list",
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "retain-on-failure" },
  // On teste le site construit, servi avec les vrais en-têtes de sécurité (public/_headers).
  webServer: { command: `npm run build && npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`, port: PORT, reuseExistingServer: !ci },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    ...(tous ? [
      { name: "firefox", use: { ...devices["Desktop Firefox"] } },
      { name: "webkit", use: { ...devices["iPhone 14"] } },
    ] : []),
  ],
});

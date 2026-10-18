import { defineConfig, devices } from "@playwright/test";

const PORT = 5199;
// En local : Chromium (ordinateur + mobile). En CI, on ajoute Firefox et WebKit (Safari).
const ci = !!process.env.CI;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: ci ? "github" : "list",
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "retain-on-failure" },
  // On teste le site construit, servi avec les vrais en-têtes de sécurité (public/_headers).
  webServer: { command: `npm run build && npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`, port: PORT, reuseExistingServer: !ci },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    ...(ci ? [
      { name: "firefox", use: { ...devices["Desktop Firefox"] } },
      { name: "webkit", use: { ...devices["iPhone 14"] } },
    ] : []),
  ],
});

import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

/** En-têtes de public/_headers (format Cloudflare Pages), réutilisés par `vite preview` pour tester la vraie CSP. */
function entetes(): Record<string, string> {
  const lignes = readFileSync(new URL("./public/_headers", import.meta.url), "utf8").split("\n");
  return Object.fromEntries(lignes.filter(l => /^\s+\S+:/.test(l)).map(l => {
    const i = l.indexOf(":");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  }));
}

export default defineConfig({
  plugins: [svelte()],
  build: { target: "es2022", sourcemap: false },
  // HSTS et upgrade-insecure-requests n'ont pas de sens en local (http) : on les retire en prévisualisation.
  preview: {
    headers: Object.fromEntries(Object.entries(entetes())
      .filter(([k]) => k !== "Strict-Transport-Security")
      .map(([k, v]) => [k, v.replace("; upgrade-insecure-requests", "")])),
  },
  test: { include: ["src/**/*.test.ts"] },
});

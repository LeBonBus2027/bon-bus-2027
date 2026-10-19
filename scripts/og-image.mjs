#!/usr/bin/env node
/**
 * Image d'aperçu des liens partagés (Open Graph, 1200 × 630) : générique, sans aucun résultat personnel.
 * Style « Signalétique transport », bus de maquette/directions.html, photographiée par Chromium (Playwright).
 *   node scripts/og-image.mjs   →  public/og.png
 */
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";

const maquette = new URL("../maquette/directions.html", import.meta.url).href;
const sortie = fileURLToPath(new URL("../public/og.png", import.meta.url));

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(maquette);
await page.evaluate(() => {
  const svg = k => `<svg viewBox="-20 -6 230 110" width="300" height="143">${window.busMetro(k)}</svg>`;
  document.body.innerHTML = `
    <div style="width:1200px;height:630px;box-sizing:border-box;background:#fff;font-family:system-ui,sans-serif;color:#0b1f3a;display:flex;flex-direction:column">
      <div style="background:#0b1f3a;color:#fff;border-bottom:10px solid #ffcd00;padding:36px 64px 34px">
        <div style="display:flex;align-items:center;gap:14px;font-weight:800;letter-spacing:.08em;font-size:22px;color:#ffcd00">
          <span style="width:40px;height:40px;border-radius:50%;background:#ffcd00;color:#0b1f3a;display:grid;place-items:center;font-weight:900">B</span>LIGNE 2027</div>
        <div style="font-size:74px;font-weight:900;line-height:1.05;margin-top:14px">Quel bus te ramène chez toi&nbsp;?</div>
      </div>
      <div style="display:flex;justify-content:space-around;align-items:flex-end;padding:34px 40px 0">${svg("adore")}${svg("bof")}${svg("jamais")}</div>
      <div style="margin:22px 64px 0;font-size:30px;font-weight:800">
        <span style="background:linear-gradient(transparent 58%,#ffcd00 58%)">Aucun bus ne te dépose pile devant ta porte. Lequel te rapproche le plus&nbsp;?</span>
      </div>
    </div>`;
});
await page.screenshot({ path: sortie });
await navigateur.close();
console.log(`Image écrite : ${sortie}`);

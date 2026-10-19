#!/usr/bin/env node
/**
 * Allège les portraits : 320 px au plus grand côté, JPEG qualité 82 (affichés au plus en 112 px, ×2 pour les écrans denses).
 * Redimensionnement fait par Chromium (Playwright), aucun outil d'image à installer.
 *   node scripts/photos-optimiser.mjs   (après scripts/photos-commons.mjs)
 */
import { chromium } from "@playwright/test";
import { readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const racine = new URL("..", import.meta.url);
const fichierJson = fileURLToPath(new URL("data/photos.json", racine));
const photos = JSON.parse(readFileSync(fichierJson, "utf8"));
const COTE = 320, QUALITE = 0.82;

const navigateur = await chromium.launch();
const page = await navigateur.newPage();
let avant = 0, apres = 0;
for (const [id, p] of Object.entries(photos)) {
  const source = fileURLToPath(new URL(`public/${p.local}`, racine));
  avant += statSync(source).size;
  await page.goto(pathToFileURL(source).href);
  const donnees = await page.evaluate(([cote, qualite]) => {
    const img = document.images[0];
    const k = Math.min(1, cote / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);   // fond blanc pour les PNG transparents
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", qualite).split(",")[1];
  }, [COTE, QUALITE]);
  const cible = `photos/${id}.jpg`;
  if (p.local !== cible) rmSync(source);
  writeFileSync(fileURLToPath(new URL(`public/${cible}`, racine)), Buffer.from(donnees, "base64"));
  apres += statSync(fileURLToPath(new URL(`public/${cible}`, racine))).size;
  p.local = cible;
}
await navigateur.close();
writeFileSync(fichierJson, JSON.stringify(photos, null, 2) + "\n");
console.log(`Photos : ${Math.round(avant / 1024)} Ko → ${Math.round(apres / 1024)} Ko`);

#!/usr/bin/env node
/**
 * Convertit les textes « Pour aller plus loin » (un fichier Markdown par question, branche « redaction »)
 * en data/explications.json, affiché sous chaque question.
 *
 * Usage : node scripts/explications.mjs <dossier contenant q01.md … q100.md>
 *
 * Chaque texte suit la même structure : un premier bloc de contexte (« Les faits », « Les chiffres »…),
 * ce que disent les preuves (un ou plusieurs intertitres), « Ce qu'il faut savoir aussi », « Ce qui reste un choix »,
 * puis « ## Sources ». La partie « ## À vérifier » est une note de travail : elle n'est jamais publiée.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const racine = fileURLToPath(new URL("..", import.meta.url));
const dossier = process.argv[2];
if (!dossier) { console.error("Usage : node scripts/explications.mjs <dossier>"); process.exit(1); }

const { questions } = JSON.parse(readFileSync(join(racine, "data/questions.json"), "utf8"));
const parId = new Map(questions.map(q => [q.id, q]));

/** Typographie française : espace insécable fine avant « ; ! ? », insécable avant « : » et dans les guillemets. */
const typo = s => s
  .replace(/[   ]+([;!?])/g, " $1")
  .replace(/[   ]+(:|»)/g, " $1")
  .replace(/«[   ]+/g, "« ");

const AUSSI = /^Ce qu'il faut savoir aussi$/i, CHOIX = /^Ce qui reste un choix$/i;
const problemes = [], sortie = {};

for (const nom of readdirSync(dossier).filter(n => /^q\d+\.md$/.test(n)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))) {
  const id = `q${parseInt(nom.slice(1))}`;
  const q = parId.get(id);
  if (!q) { problemes.push(`${nom} : aucune question ${id}`); continue; }
  const lignes = readFileSync(join(dossier, nom), "utf8").replace(/\r/g, "").split("\n");

  // Découpage : intertitres en gras seuls sur leur ligne, puis « ## Sources » et « ## À vérifier ».
  const blocs = []; let courant = null, zone = "texte"; const sources = [];
  for (const brut of lignes) {
    const l = brut.trim();
    if (/^#\s/.test(l)) continue;
    if (/^##\s+Sources/i.test(l)) { zone = "sources"; continue; }
    if (/^##\s/.test(l)) { zone = "interne"; continue; }
    if (zone === "interne" || !l) continue;
    if (zone === "sources") {
      const m = l.match(/^-\s*(.+?)\s*:\s*(https?:\/\/\S+)\s*$/);
      if (m) sources.push({ titre: typo(m[1]), url: m[2] }); else problemes.push(`${nom} : source illisible « ${l} »`);
      continue;
    }
    const titre = l.match(/^\*\*([^*]+)\*\*$/);
    if (titre) { courant = { titre: typo(titre[1].trim()), elements: [] }; blocs.push(courant); continue; }
    if (!courant) { problemes.push(`${nom} : texte avant le premier intertitre`); continue; }
    const puce = l.match(/^[-*]\s+(.*)$/);
    // Un élément = une chaîne ; « - » en tête pour une puce. Seul le gras (**…**) est interprété à l'affichage, en texte (jamais en HTML).
    courant.elements.push(puce ? `- ${typo(puce[1])}` : typo(l));
  }

  // Quatre volets : contexte (1er bloc, sauf s'il parle déjà des preuves), preuves (jusqu'à « Ce qu'il faut savoir aussi »),
  // à savoir aussi, le choix.
  const iAussi = blocs.findIndex(b => AUSSI.test(b.titre)), iChoix = blocs.findIndex(b => CHOIX.test(b.titre));
  if (iAussi < 1 || iChoix !== blocs.length - 1 || iAussi !== iChoix - 1) { problemes.push(`${nom} : structure inattendue (${blocs.map(b => b.titre).join(" / ")})`); continue; }
  if (!sources.length) problemes.push(`${nom} : aucune source`);
  const avecContexte = !/^Ce que (mesurent|disent)/i.test(blocs[0].titre);
  sortie[id] = {
    contexte: avecContexte ? blocs[0] : null,
    preuves: blocs.slice(avecContexte ? 1 : 0, iAussi),
    aussi: blocs[iAussi].elements,
    choix: blocs[iChoix].elements,
    sources,
  };
}

for (const q of questions) if (!sortie[q.id]) problemes.push(`${q.id} : pas de texte`);
writeFileSync(join(racine, "data/explications.json"), JSON.stringify(sortie) + "\n");
console.log(`${Object.keys(sortie).length} textes écrits dans data/explications.json`);
if (problemes.length) { console.error(problemes.join("\n")); process.exit(1); }

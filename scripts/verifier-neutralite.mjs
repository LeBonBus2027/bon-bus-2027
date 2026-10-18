#!/usr/bin/env node
/**
 * Contrôles de neutralité et de sécurité du code source (cahier des charges, sections 4, 6 et 7).
 * Échoue si :
 *  - un nom de candidat, un identifiant de candidat ou un nom de parti apparaît dans le code (aucun traitement particulier possible) ;
 *  - du HTML brut est injecté ({@html}, innerHTML, insertAdjacentHTML) ;
 *  - un vocabulaire réservé aux sondages est employé ;
 *  - une ressource externe est chargée depuis le code (script, police, image).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const racine = fileURLToPath(new URL("..", import.meta.url));
const donnees = JSON.parse(readFileSync(join(racine, "data/monvote.json"), "utf8"));

function fichiers(dossier) {
  return readdirSync(dossier).flatMap(n => {
    const p = join(dossier, n);
    return statSync(p).isDirectory() ? fichiers(p) : /\.(ts|svelte|css|html)$/.test(n) ? [p] : [];
  });
}

const echapper = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const interdits = [
  ...donnees.candidats.flatMap(c => [
    { motif: new RegExp(`\\b${echapper(c.nom.split(" ").at(-1))}\\b`), raison: `nom de candidat (${c.nom})` },
    { motif: new RegExp(`["'\`]${echapper(c.id)}["'\`]`), raison: `identifiant de candidat (${c.id})` },
  ]),
  ...[...new Set(donnees.candidats.map(c => c.parti))].map(p => ({ motif: new RegExp(echapper(p)), raison: `nom de parti (${p})` })),
  { motif: /\{@html/, raison: "injection de HTML brut ({@html})" },
  { motif: /\.innerHTML\s*=|insertAdjacentHTML|outerHTML\s*=/, raison: "injection de HTML brut" },
  // Citer la moyenne des sondages publiés (sélection des candidats) est permis ; présenter l'outil comme un sondage, non.
  { motif: /\b(notre|ce|cet|un|mon|ton) sondage|intentions? de vote|r[ée]sultats? du sondage/i, raison: "l'outil ne doit pas se présenter comme un sondage" },
  { motif: /(src|href)=["']https?:\/\/(?!monvote2027\.fr|www\.service-public\.fr|www\.tiktok\.com)/, raison: "ressource ou lien externe non prévu" },
  { motif: /@import\s+url\(|fonts\.googleapis/, raison: "police ou feuille de style externe" },
];

const problemes = [];
for (const f of [...fichiers(join(racine, "src")), join(racine, "index.html")]) {
  if (f.endsWith(".test.ts")) continue;
  readFileSync(f, "utf8").split("\n").forEach((ligne, i) => {
    for (const { motif, raison } of interdits) if (motif.test(ligne)) problemes.push(`${relative(racine, f)}:${i + 1} — ${raison}`);
  });
}

if (problemes.length) {
  console.error(`Contrôle de neutralité : ${problemes.length} problème(s)\n${problemes.join("\n")}`);
  process.exit(1);
}
console.log("Contrôle de neutralité : aucun problème.");

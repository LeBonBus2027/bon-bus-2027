#!/usr/bin/env node
/**
 * Importe l'export public des affaires de Poligraph (https://poligraph.fr/api/export/affaires) pour « Ce que dit la justice » :
 * les 21 candidats et les personnes dont le parti actuel est celui d'un candidat. Écrit data/justice-poligraph.json.
 *
 *   npm run import:poligraph -- --fichier chemin/vers/affaires.csv
 *
 * Mêmes règles que data/justice.json (vérifiée à la main, qui reste prioritaire pour les candidats qu'elle couvre) :
 *   - seulement des décisions de justice visant la personne elle-même (mise en cause) : condamnations, relaxes, non-lieux ;
 *     jamais une plainte, une enquête, une mise en examen, un renvoi ou un classement sans suite ;
 *   - publiée seulement si Poligraph cite au moins deux sources ; sinon « a_verifier », non affichée.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const i = process.argv.indexOf("--fichier");
const fichier = i > 0 ? process.argv[i + 1] : null;
if (!fichier || !existsSync(fichier)) { console.error("Indique l'export CSV de Poligraph : npm run import:poligraph -- --fichier affaires.csv"); process.exit(1); }
const chemin = nom => fileURLToPath(new URL(`../${nom}`, import.meta.url));

// --- CSV (champs entre guillemets, virgules et retours à la ligne dans les champs) -----------------------
function lireCsv(texte) {
  const lignes = []; let champ = "", ligne = [], guillemets = false;
  for (let k = 0; k < texte.length; k++) {
    const c = texte[k];
    if (guillemets) {
      if (c === '"' && texte[k + 1] === '"') { champ += '"'; k++; }
      else if (c === '"') guillemets = false;
      else champ += c;
    } else if (c === '"') guillemets = true;
    else if (c === ",") { ligne.push(champ); champ = ""; }
    else if (c === "\n") { ligne.push(champ.replace(/\r$/, "")); lignes.push(ligne); ligne = []; champ = ""; }
    else champ += c;
  }
  if (champ || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  const [entete, ...corps] = lignes;
  return corps.filter(l => l.length === entete.length).map(l => Object.fromEntries(entete.map((h, j) => [h.replace(/^﻿/, ""), l[j]])));
}
const lignes = lireCsv(readFileSync(fichier, "utf8"));
if (!lignes.length || !("Statut" in lignes[0]) || !("Politique" in lignes[0])) { console.error("Export Poligraph illisible (colonnes attendues absentes)."); process.exit(1); }

// --- Candidats et partis -------------------------------------------------------------------------------
const { candidats } = JSON.parse(readFileSync(chemin("data/candidats.json"), "utf8"));
// Parti du candidat (data/candidats.json) → sigle du « Parti actuel » dans Poligraph. Absent = aucun élu suivi par Poligraph.
const SIGLES = {
  "Rassemblement National": "RN", "La France Insoumise": "LFI", "Renaissance": "RE", "Horizons": "HOR",
  "Les Républicains": "LR", "Reconquête": "REC", "Parti Communiste Français": "PCF", "Europe Écologie Les Verts": "EELV",
  "Place Publique": "PP", "Union Populaire Républicaine": "UPR", "La France Humaniste": "LFH",
};

// --- Statuts : seules les décisions de justice sont gardées -------------------------------------------
const STATUTS = {
  "Condamnation définitive": { issue: "condamnation", statut: "définitive", definitive: true },
  "Condamnation (1ère instance)": { issue: "condamnation", statut: "première instance", definitive: null },
  "Appel en cours": { issue: "condamnation", statut: "appel en cours", definitive: false },
  "Condamnation non définitive, pourvoi en cassation en cours": { issue: "condamnation", statut: "pourvoi en cassation en cours", definitive: false },
  "Relaxe": { issue: "relaxe", statut: "relaxe", definitive: null },
  "Non-lieu": { issue: "non-lieu", statut: "non-lieu", definitive: null },
};
const mois = m => (m % 12 === 0 && m >= 12 ? `${m / 12} an${m >= 24 ? "s" : ""}` : `${m} mois`);
function peine(l) {
  if (l["Peine (texte libre)"]?.trim()) return l["Peine (texte libre)"].trim();
  const p = [], n = k => Number(l[k] || 0);
  if (n("Prison (mois)")) p.push(`${mois(n("Prison (mois)"))} d'emprisonnement${n("Prison, part non assortie du sursis (mois)") ? ` dont ${mois(n("Prison, part non assortie du sursis (mois)"))} ferme` : " avec sursis"}`);
  if (n("Amende (EUR)")) p.push(`${n("Amende (EUR)").toLocaleString("fr-FR")} € d'amende`);
  if (n("Inéligibilité (mois)")) p.push(`${mois(n("Inéligibilité (mois)"))} d'inéligibilité`);
  if (n("TIG (heures)")) p.push(`${n("TIG (heures)")} heures de travail d'intérêt général`);
  return p.join(", ");
}
function affaire(l) {
  const s = STATUTS[l["Statut"]];
  const sources = [
    l["Première source (URL)"]?.startsWith("https://") ? { titre: l["Première source (titre)"] || "Première source", url: l["Première source (URL)"] } : null,
    l["Page Poligraph"]?.startsWith("https://") ? { titre: "Fiche Poligraph (toutes les sources)", url: l["Page Poligraph"] } : null,
  ].filter(Boolean);
  return {
    personne: l["Politique"],
    affaire: l["Titre"].trim(),
    infraction: l["Catégorie"] && l["Catégorie"] !== "Autre" ? l["Catégorie"] : "Autre infraction",
    decisions: [{ date: (l["Date du verdict"] || "").slice(0, 10), juridiction: l["Juridiction"] || "juridiction non précisée", issue: s.issue, peine: s.issue === "condamnation" ? peine(l) : "" }],
    statut: s.statut,
    definitive: s.definitive,
    verification: Number(l["Nombre de sources"] || 0) >= 2 && sources.length ? "verifie" : "a_verifier",
    sources,
  };
}
const decisions = lignes.filter(l => STATUTS[l["Statut"]] && l["Implication"] === "Mis en cause" && l["Titre"]?.trim());
const parDate = (a, b) => (b.decisions[0].date || "").localeCompare(a.decisions[0].date || "");

const noms = new Map(candidats.map(c => [c.nom, c.id]));
const sortie = {
  meta: {
    source: "Poligraph, export public des affaires", url: "https://poligraph.fr/api/export/affaires",
    date_export: new Date().toISOString().slice(0, 10),
    regles: "Décisions de justice visant la personne elle-même, publiées si Poligraph cite au moins deux sources.",
  },
  candidats: Object.fromEntries(candidats.map(c => [c.id, decisions.filter(l => l["Politique"] === c.nom).map(affaire).sort(parDate)])),
  partis: {},
};
for (const c of candidats) {
  const sigle = SIGLES[c.parti];
  if (!sigle || sortie.partis[sigle]) { if (sigle) sortie.partis[sigle].candidats.push(c.id); continue; }
  const membres = decisions.filter(l => l["Parti actuel (abrégé)"] === sigle && !noms.has(l["Politique"]));
  sortie.partis[sigle] = { nom: membres[0]?.["Parti actuel"] || c.parti, candidats: [c.id], affaires: membres.map(affaire).sort(parDate) };
}
writeFileSync(chemin("data/justice-poligraph.json"), JSON.stringify(sortie, null, 2) + "\n");

const pub = l => l.filter(a => a.verification === "verifie").length;
console.log(`Poligraph : ${lignes.length} affaires lues, ${decisions.length} décisions de justice retenues.`);
console.log(`Candidats : ${Object.values(sortie.candidats).reduce((n, l) => n + pub(l), 0)} décisions publiables pour ${Object.values(sortie.candidats).filter(l => pub(l)).length} candidats.`);
for (const [s, p] of Object.entries(sortie.partis)) console.log(`  ${s} (${p.nom}) : ${pub(p.affaires)} publiables sur ${p.affaires.length}, ${new Set(p.affaires.map(a => a.personne)).size} personnes`);

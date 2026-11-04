#!/usr/bin/env node
/**
 * Import de la moyenne des sondages publiée par Pouls (https://pouls.app), qui choisit les candidats proposés d'office.
 *
 *   npm run import:pouls                      télécharge la page
 *   npm run import:pouls -- --fichier x.html  lit une copie locale
 *
 * Le script refuse d'écrire si la structure attendue n'est pas trouvée (date de mise à jour, au moins 5 candidats
 * reconnus parmi ceux de MonVote2027). Il affiche chaque moyenne modifiée et, surtout, tout candidat qui franchit
 * le seuil dans un sens ou dans l'autre, pour relecture avant publication.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const URL_POULS = "https://pouls.app/";
const SORTIE = fileURLToPath(new URL("../data/selection.json", import.meta.url));
const CANDIDATS = fileURLToPath(new URL("../data/candidats.json", import.meta.url));
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const i = process.argv.indexOf("--fichier");
const html = i > 0
  ? readFileSync(process.argv[i + 1], "utf8")
  : await fetch(URL_POULS, { headers: { "User-Agent": "LeBonBus2027 (import hebdomadaire de la moyenne des sondages)" } })
      .then(r => { if (!r.ok) throw new Error(`Pouls a répondu ${r.status}`); return r.text(); });

// Date de mise à jour : « Mis à jour le 4 novembre 2026 ».
const d = html.match(/Mis à jour le (\d{1,2}) ([a-zéû]+) (\d{4})/);
if (!d || !MOIS.includes(d[2])) throw new Error("Date de mise à jour introuvable : la page de Pouls a peut-être changé de forme. Rien n'est écrit.");
const date = `${d[3]}-${String(MOIS.indexOf(d[2]) + 1).padStart(2, "0")}-${d[1].padStart(2, "0")}`;

// Classement complet : une ligne par candidat, nom puis pourcentage (« 34,8 % »).
const debut = html.indexOf("le classement complet");
if (debut < 0) throw new Error("Classement complet introuvable sur la page de Pouls. Rien n'est écrit.");
const bloc = html.slice(debut, html.indexOf("</ul>", debut));
const lignes = [...bloc.matchAll(/class="bar-n"[^>]*>([^<]+)<\/a>[\s\S]*?class="bar-s">\s*([\d,]+)/g)]
  .map(m => ({ nom: m[1].trim(), moyenne: Number(m[2].replace(",", ".")) }));

// Rapprochement avec les candidats de MonVote2027, par le nom (sans accents ni casse).
const simple = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
const { candidats } = JSON.parse(readFileSync(CANDIDATS, "utf8"));
const parNom = new Map(candidats.map(c => [simple(c.nom), c.id]));
const moyennes = {};
const inconnus = [];
for (const l of lignes) {
  const id = parNom.get(simple(l.nom));
  if (id) moyennes[id] = l.moyenne; else inconnus.push(`${l.nom} (${l.moyenne} %)`);
}
if (Object.keys(moyennes).length < 5) throw new Error(`Seulement ${Object.keys(moyennes).length} candidats reconnus : la page a peut-être changé de forme. Rien n'est écrit.`);

const avant = JSON.parse(readFileSync(SORTIE, "utf8"));
const seuil = avant.seuil;
const changements = [];
for (const c of candidats) {
  const a = avant.moyennes[c.id], b = moyennes[c.id];
  if (a === b) continue;
  const franchit = (a ?? 0) >= seuil !== (b ?? 0) >= seuil;
  changements.push(`  ${franchit ? "⚠ " : ""}${c.nom} : ${a ?? "absent"} → ${b ?? "absent"}${franchit ? ` (franchit le seuil de ${seuil} % : proposé d'office ${(b ?? 0) >= seuil ? "désormais" : "plus maintenant"})` : ""}`);
}

if (!changements.length && avant.date === date) {
  console.log(`Pouls : aucun changement depuis la moyenne du ${date}.`);
} else {
  writeFileSync(SORTIE, JSON.stringify({ ...avant, date, moyennes }, null, 2) + "\n");
  console.log(`Pouls : moyenne du ${date}, ${Object.keys(moyennes).length} candidats reconnus.`);
  if (changements.length) console.log(`${changements.length} moyenne(s) modifiée(s) :\n${changements.join("\n")}`);
}
if (inconnus.length) console.log(`Hors MonVote2027, ignorés : ${inconnus.join(", ")}`);

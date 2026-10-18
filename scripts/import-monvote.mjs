#!/usr/bin/env node
/**
 * Import des questions et positions publiées par monvote2027.fr/donnees (cahier des charges, section 3).
 *
 *   npm run import:monvote                      télécharge la page
 *   npm run import:monvote -- --fichier x.html  lit une copie locale
 *
 * Le script refuse d'écrire si la structure attendue n'est pas trouvée (21 candidats × 100 questions,
 * chaque candidat placé une seule fois par question) et affiche chaque position modifiée par rapport
 * à l'import précédent, pour relecture avant publication.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const URL_DONNEES = "https://monvote2027.fr/donnees";
const SORTIE = fileURLToPath(new URL("../data/monvote.json", import.meta.url));
const ATTENDU = { candidats: 21, questions: 100, rapides: 20 };
const NIVEAUX = {
  "Tout à fait pour": 2,
  "Plutôt pour": 1,
  "Neutre / partagé": 0,
  "Plutôt contre": -1,
  "Tout à fait contre": -2,
};

const decode = s => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
  .replace(/\s+/g, " ").trim();

const un = (re, texte, quoi) => {
  const m = re.exec(texte);
  if (!m) throw new Error(`Structure inattendue : ${quoi} introuvable`);
  return decode(m[1]);
};

function analyser(html) {
  const blocs = html.split('class="donnees-question ').slice(1);
  const candidats = new Map();
  const questions = [];
  const positions = {};

  for (const bloc of blocs) {
    const id = un(/data-qid="([^"]+)"/, bloc, "data-qid");
    const themes = un(/data-tags="([^"]*)"/, bloc, `thèmes de ${id}`).split(/[\s,]+/).filter(Boolean);
    const numero = Number(un(/class="donnees-q-num">Q(\d+)</, bloc, `numéro de ${id}`));
    const texte = un(/class="donnees-q-text">([\s\S]*?)<\/span>/, bloc, `texte de ${id}`);
    const aide = /class="q-info-tooltip">([\s\S]*?)<\/span>/.exec(bloc);
    questions.push({ id, numero, texte, aide: aide ? decode(aide[1]) : null, themes, quiz_rapide: bloc.includes("q-tag-rapide") });

    const vus = new Set();
    for (const col of bloc.split('class="pos-col"').slice(1)) {
      const libelle = un(/class="pos-col-label">([^<]+)</, col, `libellé de colonne (${id})`);
      if (!(libelle in NIVEAUX)) throw new Error(`Niveau inconnu « ${libelle} » (${id})`);
      for (const b of col.matchAll(/<button class="pos-cand-bubble"([^>]*)>/g)) {
        const attr = nom => un(new RegExp(`data-${nom}="([^"]*)"`), b[1], `data-${nom}`);
        const cid = attr("cid");
        if (vus.has(cid)) throw new Error(`${cid} placé deux fois sur ${id}`);
        vus.add(cid);
        if (!candidats.has(cid)) candidats.set(cid, { id: cid, nom: attr("name"), parti: attr("party"), url_source: `https://monvote2027.fr/candidat/${cid}` });
        (positions[cid] ??= {})[id] = NIVEAUX[libelle];
      }
    }
    if (vus.size !== ATTENDU.candidats) throw new Error(`${id} : ${vus.size} candidats placés au lieu de ${ATTENDU.candidats}`);
  }

  if (questions.length !== ATTENDU.questions) throw new Error(`${questions.length} questions au lieu de ${ATTENDU.questions}`);
  if (candidats.size !== ATTENDU.candidats) throw new Error(`${candidats.size} candidats au lieu de ${ATTENDU.candidats}`);
  const rapides = questions.filter(q => q.quiz_rapide).length;
  if (rapides !== ATTENDU.rapides) throw new Error(`${rapides} questions du quiz rapide au lieu de ${ATTENDU.rapides}`);

  questions.sort((a, b) => a.numero - b.numero);
  return { candidats: [...candidats.values()].sort((a, b) => a.id.localeCompare(b.id)), questions, positions };
}

function differences(avant, apres) {
  const lignes = [];
  for (const c of apres.candidats) for (const q of apres.questions) {
    const a = avant.positions?.[c.id]?.[q.id], b = apres.positions[c.id][q.id];
    if (a !== undefined && a !== b) lignes.push(`  ${c.nom} · Q${q.numero} : ${a} → ${b}`);
  }
  const ids = l => new Set((l ?? []).map(x => x.id));
  for (const id of ids(apres.candidats)) if (!ids(avant.candidats).has(id)) lignes.push(`  + candidat ${id}`);
  for (const id of ids(avant.candidats)) if (!ids(apres.candidats).has(id)) lignes.push(`  − candidat ${id}`);
  for (const q of apres.questions) {
    const old = avant.questions?.find(x => x.id === q.id);
    if (old && old.texte !== q.texte) lignes.push(`  texte Q${q.numero} modifié`);
  }
  return lignes;
}

const i = process.argv.indexOf("--fichier");
const html = i > 0
  ? readFileSync(process.argv[i + 1], "utf8")
  : await (await fetch(URL_DONNEES, { headers: { "User-Agent": "bon-bus-2027 (import hebdomadaire, projet citoyen bénévole)" } })).text();

const contenu = analyser(html);
const empreinte = createHash("sha256").update(JSON.stringify(contenu)).digest("hex");
const avant = existsSync(SORTIE) ? JSON.parse(readFileSync(SORTIE, "utf8")) : null;

if (avant?.meta?.empreinte === empreinte) {
  console.log("Aucun changement depuis l'import du", avant.meta.date_import);
  process.exit(0);
}

const sortie = {
  meta: {
    source: "MonVote2027",
    url: URL_DONNEES,
    licence: "Licence ouverte (nom exact à confirmer auprès de l'éditeur)",
    attribution: "Questions et positionnements : MonVote2027 (monvote2027.fr)",
    date_import: new Date().toISOString().slice(0, 10),
    empreinte,
  },
  ...contenu,
};
writeFileSync(SORTIE, JSON.stringify(sortie, null, 2) + "\n");

console.log(`Import écrit : ${contenu.candidats.length} candidats, ${contenu.questions.length} questions.`);
console.log(`Empreinte : ${empreinte}`);
if (avant) {
  const d = differences(avant, contenu);
  console.log(d.length ? `${d.length} différence(s) à relire :\n${d.join("\n")}` : "Aucune position modifiée.");
}

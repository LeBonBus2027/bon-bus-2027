#!/usr/bin/env node
/**
 * Portraits des candidats depuis Wikimedia Commons, via l'image principale (P18) de leur fiche Wikidata.
 * Ne garde que les licences libres réutilisables (CC0, domaine public, CC BY, CC BY-SA).
 * Écrit data/photos.json (fichier, licence, auteur, lien) et télécharge des vignettes de 400 px dans public/photos/.
 *
 *   node scripts/photos-commons.mjs            recherche + téléchargement
 *   node scripts/photos-commons.mjs --liste    recherche seule (pour relecture)
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const racine = new URL("..", import.meta.url);
const UA = { "User-Agent": "bon-bus-2027/0.1 (projet citoyen bénévole ; import ponctuel de portraits)" };
const donnees = JSON.parse(readFileSync(new URL("data/monvote.json", racine), "utf8"));
const listeSeule = process.argv.includes("--liste");

// Choix faits à la main (fiche Wikidata ou fichier Commons imposés), avec leur raison.
const CHOIX = JSON.parse(readFileSync(new URL("data/photos-choix.json", racine), "utf8"));

const pause = ms => new Promise(r => setTimeout(r, ms));
// Wikimedia limite le débit : une requête à la fois, une pause entre chaque, et on réessaie si on est freiné.
async function json(url) {
  for (let essai = 1; ; essai++) {
    await pause(1200);
    const r = await fetch(url, { headers: UA });
    const texte = await r.text();
    try { return JSON.parse(texte); } catch { if (essai >= 5) throw new Error(`Réponse invalide : ${texte.slice(0, 80)}`); await pause(5000 * essai); }
  }
}
const licenceLibre = l => /^(cc0|cc[ -]by([ -]sa)?[ -]\d|public domain|pd)/i.test((l ?? "").trim());
const sansHtml = s => (s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function fiche(nom) {
  const r = await json(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(nom)}&language=fr&type=item&limit=5&format=json`);
  return r.search?.find(x => /politi|homme|femme|député|ministre|avocat|journal|écrivain|militant/i.test(x.description ?? "")) ?? r.search?.[0];
}

const sortie = {};
for (const c of donnees.candidats) {
  const qid = CHOIX[c.id]?.wikidata ?? (await fiche(c.nom))?.id;
  if (!qid) { console.log(`✗ ${c.nom} : pas de fiche Wikidata`); continue; }
  const ent = (await json(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`)).entities[qid];
  const fichier = CHOIX[c.id]?.fichier ?? ent?.claims?.P18?.at(-1)?.mainsnak?.datavalue?.value;
  if (!fichier) { console.log(`✗ ${c.nom} (${qid}) : pas de photo P18`); continue; }
  const info = await json(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent("File:" + fichier)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=400&format=json`);
  const ii = Object.values(info.query.pages)[0].imageinfo?.[0];
  const m = ii?.extmetadata ?? {};
  const licence = m.LicenseShortName?.value ?? "";
  const entree = {
    wikidata: qid, fichier, licence, auteur: sansHtml(m.Artist?.value), date: sansHtml(m.DateTimeOriginal?.value).slice(0, 10),
    page: ii?.descriptionurl, vignette: ii?.thumburl,
    ...(CHOIX[c.id]?.cadrage ? { cadrage: CHOIX[c.id].cadrage } : {}),
  };
  console.log(`${licenceLibre(licence) ? "✓" : "✗"} ${c.nom} (${qid}) · ${fichier} · ${licence} · ${entree.auteur} · ${entree.date}`);
  if (licenceLibre(licence)) sortie[c.id] = entree;
}

if (!listeSeule) {
  const dossier = new URL("public/photos/", racine);
  mkdirSync(dossier, { recursive: true });
  for (const [id, p] of Object.entries(sortie)) {
    await pause(1500);
    const r = await fetch(p.vignette, { headers: UA });
    if (!r.ok || !r.headers.get("content-type")?.startsWith("image/")) throw new Error(`Téléchargement refusé pour ${id}`);
    const ext = r.headers.get("content-type") === "image/png" ? "png" : "jpg";
    writeFileSync(new URL(`${id}.${ext}`, dossier), Buffer.from(await r.arrayBuffer()));
    p.local = `photos/${id}.${ext}`;
    delete p.vignette;
  }
  writeFileSync(fileURLToPath(new URL("data/photos.json", racine)), JSON.stringify(sortie, null, 2) + "\n");
  console.log(`${Object.keys(sortie).length} photos enregistrées.`);
}

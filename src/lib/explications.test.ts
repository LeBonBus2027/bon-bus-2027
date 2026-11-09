import { describe, expect, it } from "vitest";
import brut from "../../data/explications.json";
import monvote from "../../data/monvote.json";
import { questions } from "./donnees";
import type { Explication } from "./PlusLoin.svelte";

/** « Pour aller plus loin » : un texte par question, le même pour tout le monde, sans nom de candidat ni de parti. */
const TEXTES = brut as Record<string, Explication>;
const tout = (e: Explication) => [
  ...(e.contexte ? [e.contexte.titre, ...e.contexte.elements] : []),
  ...e.preuves.flatMap(b => [b.titre, ...b.elements]),
  ...e.aussi, ...e.choix,
].join("\n");

describe("textes « Pour aller plus loin »", () => {
  it("existent pour chaque question, et pour aucune autre", () => {
    expect(Object.keys(TEXTES).sort()).toEqual(questions.map(q => q.id).sort());
  });

  it("ont les quatre volets remplis et au moins une source en https", () => {
    for (const [id, e] of Object.entries(TEXTES)) {
      expect(e.contexte || e.preuves.length, id).toBeTruthy();
      expect(e.aussi.length, id).toBeGreaterThan(0);
      expect(e.choix.length, id).toBeGreaterThan(0);
      expect(e.sources.length, id).toBeGreaterThan(0);
      for (const s of e.sources) expect(s.url, id).toMatch(/^https:\/\/[^\s]+$/);
    }
  });

  it("ne nomment aucun candidat ni aucun parti", () => {
    // « La Convention » est aussi un nom commun ici (Convention européenne des droits de l'homme, Convention citoyenne pour le climat) :
    // ce nom de parti est contrôlé à part, seulement quand il n'est suivi d'aucun de ces compléments.
    const GENERIQUES = new Set(["La Convention"]);
    const noms = [...new Set(monvote.candidats.flatMap(c => [c.nom.split(" ").at(-1)!, c.parti]))].filter(n => n && !GENERIQUES.has(n)); // parti vide : candidat sans étiquette
    for (const [id, e] of Object.entries(TEXTES)) {
      const t = tout(e).replace(/(la|La) Convention (européenne|citoyenne|protège|permet)/g, "");
      expect(t, `${id} : « La Convention »`).not.toMatch(/\bLa Convention\b/);
    }
    // Homonymes sans lien avec un candidat, cités avec leur prénom (q4 : l'économiste Michaël Zemmour).
    const HOMONYMES = /Michaël Zemmour/g;
    for (const [id, e] of Object.entries(TEXTES)) {
      const t = tout(e).replace(HOMONYMES, "");
      for (const n of noms) expect(t, `${id} : « ${n} »`).not.toMatch(new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`));
    }
  });

  it("ne contiennent ni note de travail ni HTML, et suivent la typographie française", () => {
    for (const [id, e] of Object.entries(TEXTES)) {
      const t = tout(e);
      expect(t, id).not.toMatch(/À vérifier|TODO|<[a-z/]/i);
      expect(t, id).not.toMatch(/ [:;?!»]|« /);
    }
  });
});

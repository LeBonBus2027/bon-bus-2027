import { describe, expect, it } from "vitest";
import brut from "../../data/justice.json";
import { candidats } from "./candidats";
import pgBrut from "../../data/justice-poligraph.json";
import { affairesPubliees, dateJustice, resume, type Affaire } from "./justice";

const j = brut as unknown as { meta: unknown; candidats: Record<string, Affaire[]> };
const pg = pgBrut as unknown as { candidats: Record<string, Affaire[]>; partis: Record<string, { candidats: string[]; affaires: Affaire[] }> };
const ids = new Set(candidats.map(c => c.id));
const toutes = Object.entries(j.candidats).flatMap(([id, liste]) => liste.map(a => ({ id, a })));

describe("données « Ce que dit la justice »", () => {
  it("ne concernent que des candidats connus", () => {
    for (const id of Object.keys(j.candidats)) expect(ids.has(id), id).toBe(true);
  });

  it("chaque affaire a des décisions datées, une issue, un statut et des sources en https", () => {
    for (const { id, a } of toutes) {
      expect(a.decisions.length, `${id} ${a.affaire}`).toBeGreaterThan(0);
      for (const d of a.decisions) {
        expect(d.date, `${id} ${a.affaire}`).toMatch(/^$|^\d{4}(-\d{2}(-\d{2})?)?$/);
        expect(d.issue.trim(), `${id} ${a.affaire}`).not.toBe("");
        expect(d.juridiction.trim(), `${id} ${a.affaire}`).not.toBe("");
      }
      expect(a.statut.trim()).not.toBe("");
      expect(["verifie", "a_verifier"]).toContain(a.verification);
      expect(a.sources.length, `${id} ${a.affaire}`).toBeGreaterThan(0);
      for (const s of a.sources) expect(s.url).toMatch(/^https:\/\//);
    }
  });

  it("une affaire publiée est confirmée par au moins deux sources", () => {
    for (const { id, a } of toutes.filter(x => x.a.verification === "verifie")) expect(a.sources.length, `${id} ${a.affaire}`).toBeGreaterThanOrEqual(2);
  });

  it("ne publie jamais une affaire à vérifier, et distingue « pas recherché » de « rien trouvé »", () => {
    const fusion = { date: "", candidats: j.candidats, partis: {} };
    for (const id of Object.keys(j.candidats)) for (const a of affairesPubliees(fusion, id)!) expect(a.verification).toBe("verifie");
    expect(affairesPubliees(fusion, "inconnu")).toBeNull();
  });

  it("le fichier Poligraph couvre les 21 candidats, et ses affaires publiées ont des sources", () => {
    expect(Object.keys(pg.candidats).sort()).toEqual([...ids].sort());
    const toutesPg = [...Object.values(pg.candidats).flat(), ...Object.values(pg.partis).flatMap(p => p.affaires)];
    for (const a of toutesPg.filter(x => x.verification === "verifie")) {
      expect(a.sources.length, a.affaire).toBeGreaterThan(0);
      for (const s of a.sources) expect(s.url).toMatch(/^https:\/\//);
      expect(["condamnation", "relaxe", "non-lieu"]).toContain(a.decisions[0]!.issue);
    }
    for (const p of Object.values(pg.partis)) for (const id of p.candidats) expect(ids.has(id)).toBe(true);
  });

  it("résume une affaire en une ligne, sans répéter l'issue dans le statut", () => {
    const a = { affaire: "x", infraction: "Diffamation", decisions: [{ date: "2025-12-16", juridiction: "Cour de cassation", issue: "condamnation", peine: "" }], statut: "définitive", definitive: true, verification: "verifie" as const, sources: [] };
    expect(resume(a).replace(/ /g, " ")).toBe("Diffamation : condamnation le 16 décembre 2025 · définitive");
    expect(resume({ ...a, decisions: [{ ...a.decisions[0]!, issue: "relaxe" }], statut: "relaxe" }).replace(/ /g, " ")).toBe("Diffamation : relaxe le 16 décembre 2025");
  });

  it("écrit les dates en toutes lettres", () => {
    expect(dateJustice("2026-07-07")).toBe("7 juillet 2026");
    expect(dateJustice("2025-12-01")).toBe("1er décembre 2025");
    expect(dateJustice("2014-04")).toBe("avril 2014");
    expect(dateJustice("")).toBe("date non précisée");
  });
});

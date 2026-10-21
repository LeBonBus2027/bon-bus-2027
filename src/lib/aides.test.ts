import { describe, expect, it } from "vitest";
import simples from "../../data/aides-simples.json";
import { questions } from "./donnees";

/** « De quoi parle-t-on ? » en mots simples : même couverture et mêmes faits que les textes de MonVote2027. */
const SIMPLES = simples as Record<string, string>;
/**
 * Chiffres ajoutés volontairement, après relecture, parce que la question restait obscure sans eux (retours de test).
 * Faits établis, sans opinion : chacun est listé ici pour qu'aucun chiffre n'entre par accident.
 */
const AJOUTS_VERIFIES: Record<string, string[]> = {
  q9: ["1"],              // revalorisation automatique du SMIC chaque 1er janvier (code du travail)
  q43: ["1968"],          // traité de non-prolifération, ouvert à la signature en 1968
  q71: ["1960", "2013"],  // indépendances des années 1960 ; opération Serval lancée en 2013 (Barkhane jusqu'en 2022)
};
const nombres = (s: string) => (s.replace(/[  ]/g, " ").match(/\d[\d .,]*\d|\d/g) ?? []).map(x => x.replace(/[ .,]/g, ""));

describe("textes simplifiés", () => {
  it("existent pour chaque question qui a une aide, et pour aucune autre", () => {
    const attendus = questions.filter(q => q.aide).map(q => q.id).sort();
    expect(Object.keys(SIMPLES).sort()).toEqual(attendus);
  });

  it("n'ajoutent aucun chiffre absent du texte d'origine ou de la question, sauf ajout vérifié et listé", () => {
    for (const q of questions) {
      const t = SIMPLES[q.id];
      if (!t) continue;
      const connus = new Set([...nombres(q.aide ?? ""), ...nombres(q.texte), ...(AJOUTS_VERIFIES[q.id] ?? [])]);
      for (const n of nombres(t)) expect(connus.has(n), `${q.id} : « ${n} »`).toBe(true);
    }
  });

  it("restent courts et suivent la typographie française", () => {
    for (const [id, t] of Object.entries(SIMPLES)) {
      expect(t.split(/\s+/).length, id).toBeLessThanOrEqual(110);
      expect(t, id).not.toMatch(/ [:;?!»]|« /);
    }
  });
});

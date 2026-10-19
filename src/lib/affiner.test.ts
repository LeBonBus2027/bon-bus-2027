import { describe, expect, it } from "vitest";
import { questionsPourAffiner } from "./affiner";
import type { Position } from "./calcul";
import { positions, questions, type Question } from "./donnees";
import { tirerQuestions } from "./tirage";

const q = (id: string): Question => ({ id, numero: 0, texte: id, aide: null, themes: ["sante"], quiz_rapide: false });

describe("questionsPourAffiner", () => {
  const pos: Record<string, Record<string, Position>> = {
    a: { q1: 2, q2: 1, q3: 2, q4: 0 },
    b: { q1: -2, q2: 1, q3: 1, q4: 0 },
  };

  it("choisit d'abord les questions où les bus proches s'opposent le plus", () => {
    const r = questionsPourAffiner([], ["a", "b"], pos, ["q1", "q2", "q3", "q4"].map(q), 2);
    expect(r).toEqual(["q1", "q3"]);
  });

  it("ne repose jamais une question déjà posée", () => {
    const r = questionsPourAffiner(["q1"], ["a", "b"], pos, ["q1", "q2", "q3", "q4"].map(q), 3);
    expect(r).not.toContain("q1");
    expect(r).toHaveLength(3);
  });

  it("sur les vraies données : 10 nouvelles questions après une version rapide", () => {
    const deja = tirerQuestions(questions, 20);
    const r = questionsPourAffiner(deja, ["le_pen", "melenchon", "philippe"], positions, questions);
    expect(r).toHaveLength(10);
    expect(new Set(r).size).toBe(10);
    for (const id of r) expect(deja).not.toContain(id);
  });
});

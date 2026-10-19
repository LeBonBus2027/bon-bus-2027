import { describe, expect, it } from "vitest";
import complet from "../../data/monvote.json";
import leger from "../../data/candidats.json";
import lourd from "../../data/questions.json";

describe("données découpées pour le chargement en deux temps", () => {
  it("correspondent exactement à monvote.json", () => {
    expect(leger.meta).toEqual(complet.meta);
    expect(leger.candidats).toEqual(complet.candidats);
    expect(lourd.questions).toEqual(complet.questions);
    expect(lourd.positions).toEqual(complet.positions);
  });
});

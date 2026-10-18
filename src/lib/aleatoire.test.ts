import { describe, expect, it } from "vitest";
import { melanger, tirageCrypto } from "./aleatoire";

describe("melanger", () => {
  it("place chaque candidat à chaque rang avec la même fréquence (à ±1 point)", () => {
    const n = 21, tours = 42_000;
    const compte = Array.from({ length: n }, () => new Array<number>(n).fill(0));
    const liste = Array.from({ length: n }, (_, i) => i);
    for (let t = 0; t < tours; t++) melanger(liste, tirageCrypto).forEach((c, rang) => compte[c]![rang]!++);
    for (const ligne of compte) for (const k of ligne) expect(Math.abs(k / tours - 1 / n)).toBeLessThan(0.01);
  });

  it("ne modifie pas la liste d'origine", () => {
    const l = [1, 2, 3];
    melanger(l);
    expect(l).toEqual([1, 2, 3]);
  });
});

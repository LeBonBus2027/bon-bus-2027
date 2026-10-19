import { describe, expect, it } from "vitest";
import { R0, trajet, type Position, type Reponse } from "./calcul";
import { distanceA, mouvements } from "./retroviseur";

const qs = ["q1", "q2", "q3", "q4"];
const map = <T>(v: T[]) => Object.fromEntries(qs.map((q, i) => [q, v[i]!]));
const reponses = map<Reponse>([2, 2, -2, 1]);
const passages = qs.map((_, i) => ({ index: i, libelle: `Question ${i + 1}` }));
const trajets = new Map([
  ["a", trajet(qs, reponses, map<Position>([2, 2, -2, 1]))],   // toujours d'accord
  ["b", trajet(qs, reponses, map<Position>([-2, -2, 2, -1]))], // toujours opposé
  ["c", trajet(qs, reponses, map<Position>([0, 0, 0, 0]))],    // toujours neutre
]);

describe("rétroviseur", () => {
  it("part de la gare et finit à la position finale", () => {
    for (const t of trajets.values()) {
      expect(distanceA(t, passages, 0)).toBe(R0);
      expect(distanceA(t, passages, passages.length)).toBe(t.distance);
    }
  });

  it("dit qui avance et qui recule à chaque étape, en pas", () => {
    const m = mouvements(trajets, passages, 1);
    expect(m[0]).toEqual({ id: "a", pas: 2 });
    expect(m.at(-1)).toEqual({ id: "b", pas: -2 });
    expect(m.find(x => x.id === "c")?.pas).toBe(0);
  });

  it("la somme des pas de toutes les étapes redonne la position finale", () => {
    for (const [id, t] of trajets) {
      const total = passages.reduce((s, _, k) => s + mouvements(trajets, passages, k + 1).find(m => m.id === id)!.pas, 0);
      expect(R0 * (1 - total / (2 * qs.length))).toBeCloseTo(t.distance);
    }
  });
});

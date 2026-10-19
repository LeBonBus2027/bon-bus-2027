import { describe, expect, it } from "vitest";
import type { Position, Reponse } from "./calcul";
import { comparer, type Partie } from "./duo";

const qs = ["q1", "q2", "q3", "q4"];
const partie = (r: Reponse[]): Partie => ({ bacs: {}, ordre: qs, reponses: Object.fromEntries(qs.map((q, i) => [q, r[i]!])) });
const pos = (p: Position[]) => Object.fromEntries(qs.map((q, i) => [q, p[i]!]));

describe("comparer", () => {
  const positions = { x: pos([2, 2, 2, 2]), y: pos([-2, -2, -2, -2]), z: pos([0, 0, 0, 0]) };

  it("met les maisons au même endroit quand les réponses sont identiques", () => {
    const c = comparer(partie([2, 1, -1, -2]), partie([2, 1, -1, -2]), ["x"], positions);
    expect(c.maisons).toBe(0);
    expect(c.accord).toBe(4);
  });

  it("éloigne au maximum deux personnes opposées sur tout", () => {
    expect(comparer(partie([2, 2, 2, 2]), partie([-2, -2, -2, -2]), ["x"], positions).maisons).toBe(20);
  });

  it("choisit comme bus commun celui qui laisse le plus loin des deux le moins loin possible", () => {
    const c = comparer(partie([2, 2, 2, 2]), partie([-2, -2, -2, -2]), ["x", "y", "z"], positions);
    // x : 0 et 20 ; y : 20 et 0 ; z : 10 et 10 → z est le compromis.
    expect(c.commun.id).toBe("z");
    expect(c.lignes.map(l => l.id)).toEqual(["z", "x", "y"]);
  });

  it("ignore les questions passées par l'un des deux", () => {
    const c = comparer(partie([2, null, 2, 2]), partie([2, 2, null, 2]), ["x"], positions);
    expect(c.communes).toBe(2);
  });
});

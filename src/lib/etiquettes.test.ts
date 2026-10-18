import { describe, expect, it } from "vitest";
import { placer, recouvrement, rectPastille } from "./etiquettes";

describe("placer", () => {
  it("évite que deux pastilles se recouvrent, même pour des bus collés", () => {
    const cibles = Array.from({ length: 5 }, (_, i) => ({ id: `c${i}`, x: 500 + i * 6, y: 400 + (i % 2) * 8, largeur: 220 }));
    const places = placer(cibles);
    for (let i = 0; i < places.length; i++) for (let j = i + 1; j < places.length; j++) {
      const a = places[i]!, b = places[j]!;
      expect(recouvrement(rectPastille(a.x, a.y, a.largeur), rectPastille(b.x, b.y, b.largeur))).toBe(0);
    }
  });

  it("garde chaque pastille près de son bus", () => {
    const places = placer([{ id: "a", x: 300, y: 300, largeur: 200 }]);
    expect(Math.abs(places[0]!.y - 300)).toBeLessThanOrEqual(42);
  });
});

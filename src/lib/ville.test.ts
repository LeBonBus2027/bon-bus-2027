import { describe, expect, it } from "vitest";
import { candidats } from "./donnees";
import { GARE, LONGUEUR_LIGNE, MAISON, TERMINUS, lignes, rue, surLigne } from "./ville";

const ids = candidats.map(c => c.id);

describe("lignes", () => {
  const l = lignes(ids);

  it("donne une ligne de 20 arrêts à chaque candidat", () => {
    expect(Object.keys(l).sort()).toEqual([...ids].sort());
    for (const ligne of Object.values(l)) expect(ligne).toHaveLength(LONGUEUR_LIGNE + 1);
  });

  it("passe par la maison, la gare et le terminus", () => {
    for (const ligne of Object.values(l)) {
      expect(ligne[0]).toEqual(MAISON);
      expect(ligne[10]).toEqual(GARE);
      expect(ligne[20]).toEqual(TERMINUS);
    }
  });

  it("n'emprunte que des rues ouvertes", () => {
    for (const ligne of Object.values(l)) for (let k = 0; k < ligne.length - 1; k++) expect(rue(ligne[k]!, ligne[k + 1]!)).toBe(true);
  });

  it("a des itinéraires tous différents côté maison", () => {
    const allers = Object.values(l).map(x => JSON.stringify(x.slice(0, 11)));
    expect(new Set(allers).size).toBe(ids.length);
  });

  it("est identique pour tout le monde", () => {
    expect(lignes(ids)).toEqual(l);
  });
});

describe("surLigne", () => {
  it("place le bus à la gare à 10 arrêts et devant la porte à 0", () => {
    const ligne = lignes(ids)[ids[0]!]!;
    expect(surLigne(ligne, 0)).toMatchObject({ k: 0, f: 0 });
    expect(surLigne(ligne, 10)).toMatchObject({ k: 10, f: 0 });
  });
});

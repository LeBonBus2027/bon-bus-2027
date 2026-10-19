import { describe, expect, it } from "vitest";
import { classer, pas, R0, trajet, type Position, type Reponse, type Valeur } from "./calcul";

const NIVEAUX: Valeur[] = [-2, -1, 0, 1, 2];

describe("pas", () => {
  // Tableau du cahier des charges (section 3) : lignes = utilisateur, colonnes = candidat, de −2 à +2.
  const ATTENDU: Valeur[][] = [
    [2, 1, 0, -1, -2],
    [1, 2, 0, -1, -1],
    [0, 0, 0, 0, 0],
    [-1, -1, 0, 2, 1],
    [-2, -1, 0, 1, 2],
  ];

  it.each(NIVEAUX.flatMap((u, i) => NIVEAUX.map((p, j) => [u, p, ATTENDU[i]![j]!] as const)))(
    "réponse %i face à position %i → pas %i",
    (u, p, attendu) => expect(pas(u, p)).toBe(attendu),
  );

  it("est symétrique", () => {
    for (const u of NIVEAUX) for (const p of NIVEAUX) expect(pas(u, p)).toBe(pas(p, u));
  });

  it("ne bouge pas pour une question passée ou sans position", () => {
    for (const v of NIVEAUX) {
      expect(pas(null, v)).toBe(0);
      expect(pas(v, null)).toBe(0);
    }
  });
});

describe("trajet", () => {
  const qs = Array.from({ length: 20 }, (_, i) => `q${i + 1}`);
  const tout = <T>(v: T) => Object.fromEntries(qs.map(q => [q, v])) as Record<string, T>;

  it("part de la gare et arrive devant la porte en accord parfait", () => {
    const t = trajet(qs, tout<Reponse>(2), tout<Position>(2));
    expect(t.distance).toBe(0);
    expect(t.etapes).toHaveLength(20);
    expect(t.etapes[0]).toBeCloseTo(R0 - R0 / 20);
  });

  it("finit au terminus en opposition totale", () => {
    expect(trajet(qs, tout<Reponse>(2), tout<Position>(-2)).distance).toBe(2 * R0);
  });

  it("calcule la distance finale à partir de la somme des pas", () => {
    const reponses = tout<Reponse>(1);
    const positions = Object.fromEntries(qs.map((q, i) => [q, i % 2 ? 1 : -1])) as Record<string, Position>;
    const t = trajet(qs, reponses, positions);
    expect(t.distance).toBeCloseTo(R0 * (1 - (10 * 2 + 10 * -1) / 40));
  });

  it("ignore les questions passées dans n", () => {
    const reponses = { ...tout<Reponse>(null), q1: 2 as Reponse, q2: 2 as Reponse };
    const t = trajet(qs, reponses, tout<Position>(2));
    expect(t.etapes).toHaveLength(2);
    expect(t.distance).toBe(0);
  });

  it("donne la même position finale quel que soit l'ordre de rejeu", () => {
    const reponses = Object.fromEntries(qs.map((q, i) => [q, NIVEAUX[i % 5]!])) as Record<string, Reponse>;
    const positions = Object.fromEntries(qs.map((q, i) => [q, NIVEAUX[(i * 3) % 5]!])) as Record<string, Position>;
    const a = trajet(qs, reponses, positions);
    const b = trajet([...qs].reverse(), reponses, positions);
    expect(b.distance).toBe(a.distance);
    expect(a.etapes.at(-1)).toBe(a.distance);
  });

  it("reste toujours entre la porte et le terminus", () => {
    for (let essai = 0; essai < 500; essai++) {
      const r = Object.fromEntries(qs.map(q => [q, NIVEAUX[Math.floor(Math.random() * 5)]!])) as Record<string, Reponse>;
      const p = Object.fromEntries(qs.map(q => [q, NIVEAUX[Math.floor(Math.random() * 5)]!])) as Record<string, Position>;
      for (const d of trajet(qs, r, p).etapes) {
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThanOrEqual(2 * R0);
      }
    }
  });

  it("marque une position incomplète sous 60 % de couverture", () => {
    const positions = { ...tout<Position>(null), q1: 1 as Position, q2: 1 as Position };
    expect(trajet(qs, tout<Reponse>(1), positions).incomplet).toBe(true);
    expect(trajet(qs, tout<Reponse>(1), tout<Position>(1)).incomplet).toBe(false);
  });
});

describe("classer", () => {
  it("trie du plus proche au plus éloigné", () => {
    const res = classer([3, 1, 2], d => ({ etapes: [], distance: d, arrets: d, couverture: 1, incomplet: false }), Math.random);
    expect(res.map(r => r.candidat)).toEqual([1, 2, 3]);
  });

  it("départage les ex-aequo sans favoriser personne", () => {
    const premiers = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 6000; i++) {
      const res = classer(["a", "b", "c"] as const, () => ({ etapes: [], distance: 5, arrets: 5, couverture: 1, incomplet: false }), Math.random);
      premiers[res[0]!.candidat]++;
    }
    for (const n of Object.values(premiers)) expect(n / 6000).toBeGreaterThan(0.3);
  });
});

describe("trajet pondéré (« Ce qui compte pour toi »)", () => {
  const qs = ["q1", "q2"];
  const reponses = { q1: 2, q2: 2 } as Record<string, Reponse>;
  const positions = { q1: 2, q2: -2 } as Record<string, Position>;

  it("sans pondération, redonne exactement la règle de base", () => {
    expect(trajet(qs, reponses, positions, () => 1).distance).toBe(trajet(qs, reponses, positions).distance);
    expect(trajet(qs, reponses, positions).distance).toBe(R0);   // +2 puis −2 : retour à la gare
  });

  it("une question qui compte double tire le bus de son côté", () => {
    const plusProche = trajet(qs, reponses, positions, q => (q === "q1" ? 2 : 1));
    const plusLoin = trajet(qs, reponses, positions, q => (q === "q2" ? 2 : 1));
    expect(plusProche.distance).toBeLessThan(R0);
    expect(plusLoin.distance).toBeGreaterThan(R0);
    expect(plusProche.distance + plusLoin.distance).toBeCloseTo(2 * R0);
  });

  it("reste entre la porte et le terminus", () => {
    const t = trajet(qs, { q1: 2, q2: 2 }, { q1: 2, q2: 2 }, () => 3);
    expect(t.distance).toBe(0);
  });

  it("un thème prioritaire où tu es d'accord fait avancer le bus, même si tu l'es moins qu'ailleurs", () => {
    // Très d'accord en général (q1, q2), un peu moins sur le thème prioritaire (q3).
    const ids = ["q1", "q2", "q3"];
    const r = { q1: 2, q2: 2, q3: 1 } as Record<string, Reponse>;
    const p = { q1: 2, q2: 2, q3: 2 } as Record<string, Position>;
    const sans = trajet(ids, r, p).distance;
    const avec = trajet(ids, r, p, q => (q === "q3" ? 2 : 1)).distance;
    expect(avec).toBeLessThan(sans);
  });

  it("un thème prioritaire où tu n'es pas d'accord fait reculer le bus, même s'il était déjà loin", () => {
    const ids = ["q1", "q2", "q3"];
    const r = { q1: 2, q2: 2, q3: 1 } as Record<string, Reponse>;
    const p = { q1: -2, q2: -2, q3: -1 } as Record<string, Position>;
    const sans = trajet(ids, r, p).distance;
    const avec = trajet(ids, r, p, q => (q === "q3" ? 2 : 1)).distance;
    expect(avec).toBeGreaterThan(sans);
  });
});

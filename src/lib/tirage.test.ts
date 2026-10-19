import { describe, expect, it } from "vitest";
import { graine } from "./aleatoire";
import { grandTheme, questions } from "./donnees";
import { tirerQuestions } from "./tirage";

const parId = new Map(questions.map(q => [q.id, q]));
const themes = new Set(questions.map(grandTheme));

describe("version rapide : 20 questions tirées parmi les 100", () => {
  it("donne toujours 20 questions différentes, 2 par grand thème", () => {
    for (let i = 0; i < 500; i++) {
      const t = tirerQuestions(questions, 20);
      expect(t).toHaveLength(20);
      expect(new Set(t).size).toBe(20);
      const compte = new Map<string, number>();
      for (const id of t) compte.set(grandTheme(parId.get(id)!), (compte.get(grandTheme(parId.get(id)!)) ?? 0) + 1);
      expect(compte.size).toBe(themes.size);
      for (const n of compte.values()) expect(n).toBe(2);
    }
  });

  it("change à chaque fois : 2 000 parcours, 2 000 sélections et ordres différents", () => {
    const selections = new Set<string>(), ordres = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const t = tirerQuestions(questions, 20);
      selections.add([...t].sort().join(","));
      ordres.add(t.join(","));
    }
    expect(selections.size).toBe(2000);
    expect(ordres.size).toBe(2000);
  }, 60_000);

  it("finit par proposer chacune des 100 questions, avec la fréquence attendue pour son thème", () => {
    // Générateur rapide à graine fixe : on vérifie ici l'algorithme de tirage, pas la source d'aléa.
    const tirage = graine(2027), tours = 20_000, vues = new Map<string, number>();
    for (let i = 0; i < tours; i++) for (const id of tirerQuestions(questions, 20, tirage)) vues.set(id, (vues.get(id) ?? 0) + 1);
    expect(vues.size).toBe(100);
    const tailleTheme = (id: string) => questions.filter(q => grandTheme(q) === grandTheme(parId.get(id)!)).length;
    for (const [id, n] of vues) expect(Math.abs(n / tours - 2 / tailleTheme(id))).toBeLessThan(0.02);
  }, 60_000);
});

describe("version complète : les 100 questions", () => {
  it("contient toujours les 100 questions, dans un ordre différent à chaque fois", () => {
    const ordres = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const t = tirerQuestions(questions, 100);
      expect(new Set(t).size).toBe(100);
      ordres.add(t.join(","));
    }
    expect(ordres.size).toBe(2000);
  });

  it("ne favorise aucune question en tête de liste", () => {
    const tirage = graine(2027), tours = 50_000, premieres = new Map<string, number>();
    for (let i = 0; i < tours; i++) {
      const p = tirerQuestions(questions, 100, tirage)[0]!;
      premieres.set(p, (premieres.get(p) ?? 0) + 1);
    }
    expect(premieres.size).toBe(100);
    for (const n of premieres.values()) expect(Math.abs(n / tours - 1 / 100)).toBeLessThan(0.004);
  }, 60_000);
});

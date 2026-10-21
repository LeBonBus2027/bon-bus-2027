import { describe, expect, it } from "vitest";
import type { Classe } from "./calcul";
import { questions, type Candidat } from "./donnees";
import type { Niveau } from "./niveaux";
import { niveauReel, reveler, rejeu } from "./revelation";

/** Les textes utilisent des espaces insécables (typographie française) : on compare sans en tenir compte. */
const norm = (s: string) => s.replace(/ /g, " ");

const cand = (id: string, d: number): Classe<Candidat> => ({
  candidat: { id, nom: id.toUpperCase(), parti: "", url_source: "" },
  trajet: { etapes: [], distance: d, arrets: Math.round(d), couverture: 1, incomplet: false },
});

describe("reveler", () => {
  const classement = [cand("a", 2), cand("b", 4), cand("c", 6), cand("d", 9), cand("e", 13)];

  it("salue l'intuition quand le favori est le plus proche", () => {
    const r = reveler(classement, { a: "adore", b: "bof", c: "bof", d: "pas", e: "jamais" } satisfies Record<string, Niveau>);
    expect(r.intuition).toBe(true);
    expect(norm(r.message)).toContain("Ton intuition était la bonne");
  });

  it("compare le plus beau bus au plus proche sinon, et signale le demi-tour", () => {
    const r = reveler(classement, { a: "jamais", b: "bof", c: "bof", d: "pas", e: "adore" });
    expect(r.beau?.candidat.id).toBe("e");
    expect(r.epave?.candidat.id).toBe("a");
    expect(norm(r.message)).toContain("Ton plus beau bus, E, te laisse à 13 arrêts");
    expect(norm(r.message)).toContain("reparti dans l'autre sens");
    expect(norm(r.message)).toContain("bac « Jamais »");
  });

  it("prend le favori le plus éloigné quand il y en a plusieurs", () => {
    const r = reveler(classement, { a: "bof", b: "adore", c: "pas", d: "adore", e: "jamais" });
    expect(r.beau?.candidat.id).toBe("d");
  });

  it("« Pour rappel » reprend tous les bus du plus beau bac, pas seulement le plus éloigné", () => {
    const r = reveler(classement, { a: "bof", b: "bof", c: "pas", d: "adore", e: "adore" });
    expect(r.focus.map(c => c.candidat.id)).not.toContain("d");
    expect(r.haut).toBe("adore");
    expect(r.rappel.map(c => c.candidat.id)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("met en avant 5 bus au plus, sans doublon", () => {
    const r = reveler(classement, { a: "jamais", b: "adore", c: "bof", d: "pas", e: "bof" });
    expect(r.focus.length).toBeLessThanOrEqual(5);
    expect(new Set(r.focus).size).toBe(r.focus.length);
  });

  it("reste correct si tout le monde est inconnu", () => {
    const tous = Object.fromEntries(classement.map(c => [c.candidat.id, "inconnu" as Niveau]));
    const r = reveler(classement, tous);
    expect(r.beau).toBeUndefined();
    expect(norm(r.message)).toContain("Le bus qui te rapproche le plus, c'est A");
  });
});

describe("rejeu", () => {
  const parId = new Map(questions.map(q => [q.id, q]));

  it("rejoue question par question en version rapide", () => {
    const ordre = questions.filter(q => q.quiz_rapide).map(q => q.id);
    const reponses = Object.fromEntries(ordre.map(id => [id, 1 as const]));
    const r = rejeu(ordre, reponses, parId);
    expect(r.passages).toHaveLength(20);
  });

  it("rejoue thème par thème en version complète, en gardant toutes les questions", () => {
    const ordre = questions.map(q => q.id);
    const reponses = Object.fromEntries(ordre.map(id => [id, 1 as const]));
    const r = rejeu(ordre, reponses, parId);
    expect(r.passages.length).toBeLessThanOrEqual(10);
    expect(r.ordre).toHaveLength(100);
    expect(r.passages.at(-1)?.index).toBe(99);
  });
});

describe("metaphore", () => {
  const classement = [cand("a", 2), cand("b", 4), cand("c", 6), cand("d", 9), cand("e", 13)];
  const tirages = [() => 0, () => 0.99];

  it("part de la perception et décrit la direction, sans jugement sur le candidat", () => {
    const interdits = /fiable|panne|nul|mauvais|incompétent|menteur|dangereu/i;
    const cas: Record<string, Niveau>[] = [
      { a: "adore", b: "bof", c: "bof", d: "pas", e: "jamais" },
      { a: "jamais", b: "bof", c: "bof", d: "pas", e: "adore" },
      { a: "inconnu", b: "bien", c: "bof", d: "pas", e: "adore" },
      { a: "bien", b: "bof", c: "pas", d: "jamais", e: "adore" },
      { a: "jamais", b: "jamais", c: "jamais", d: "jamais", e: "jamais" },
    ];
    for (const bacs of cas) for (const t of tirages) {
      const m = reveler(classement, bacs, t).metaphore;
      expect(m.length).toBeGreaterThan(20);
      expect(m).not.toMatch(interdits);
      expect(m).not.toMatch(/undefined|Quant à un|Quant à une/);
    }
  });

  it("signale le demi-tour du plus beau bus", () => {
    const m = reveler(classement, { a: "jamais", b: "bof", c: "bof", d: "pas", e: "adore" }, () => 0).metaphore;
    expect(norm(m)).toContain("Tu le voyais comme une épave");
    expect(norm(m)).toContain("Et le car de luxe ? Tu pensais que c'était le bon bus : il est parti dans l'autre sens.");
  });
});

describe("niveauReel", () => {
  it("dégrade le bus avec la distance, avec les mêmes seuils pour tous", () => {
    expect([0, 2, 3, 5, 6, 8, 9, 11, 12, 20].map(niveauReel)).toEqual(
      ["adore", "adore", "bien", "bien", "bof", "bof", "pas", "pas", "jamais", "jamais"]);
  });
});

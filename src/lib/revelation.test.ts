import { describe, expect, it } from "vitest";
import type { Classe } from "./calcul";
import { questions, type Candidat } from "./donnees";
import type { Niveau } from "./niveaux";
import { effet, peintures, reveler, rejeu } from "./revelation";

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
    expect(r.haut).toBe("adore");
    expect(r.rappel.map(c => c.candidat.id)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("gratte tous les bus : grands écarts d'abord (le plus grand en premier), puis réussites, puis le reste", () => {
    // Peintures : a luxe, b neuf, c correct, d cabossé, e épave.
    const r = reveler(classement, { a: "bof", b: "bof", c: "bof", d: "adore", e: "adore" });
    expect(r.focus.map(c => c.candidat.id)).toEqual(["e", "d", "a", "b", "c"]);
    const r2 = reveler(classement, { a: "adore", b: "bof", c: "bof", d: "bof", e: "jamais" });
    expect(r2.focus.map(c => c.candidat.id)).toEqual(["a", "e", "b", "c", "d"]);
    expect(new Set(r2.focus).size).toBe(classement.length);
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

describe("peintures", () => {
  it("donne l'autocar de luxe au plus proche, l'épave au plus loin, et répartit les autres", () => {
    const sept = [1, 3, 4, 6, 8, 9, 14].map((d, i) => cand(`c${i}`, d));
    expect(Object.values(peintures(sept))).toEqual(["adore", "bien", "bien", "bof", "pas", "pas", "jamais"]);
  });
  it("même peinture pour des bus au même nombre d'arrêts ; un seul bus est l'autocar de luxe", () => {
    expect(peintures([cand("a", 2), cand("b", 2), cand("c", 5)])).toEqual({ a: "adore", b: "adore", c: "jamais" });
    // Ex-aequo en queue : tous épaves ; ex-aequo au milieu : rang du milieu de leur groupe.
    expect(Object.values(peintures([2, 6, 11, 11, 11, 11, 11].map((d, i) => cand(`c${i}`, d))))).toEqual(["adore", "bien", "jamais", "jamais", "jamais", "jamais", "jamais"]);
    expect(Object.values(peintures([1, 4, 4, 4, 8, 9, 14].map((d, i) => cand(`c${i}`, d))))).toEqual(["adore", "bien", "bien", "bien", "pas", "pas", "jamais"]);
    expect(peintures([cand("a", 12)])).toEqual({ a: "adore" });
  });
});

describe("effet", () => {
  it("fait briller le favori arrivé premier et tomber en panne le favori arrivé dernier", () => {
    expect(effet("adore", "adore")).toBe("brille");
    expect(effet("adore", "jamais")).toBe("panne");
    expect(effet("bien", "pas")).toBe("cale");
    expect(effet("jamais", "bien")).toBe("envol");
    expect(effet("bof", "bien")).toBe("monte");
    expect(effet("bof", "bof")).toBeNull();
    expect(effet("jamais", "jamais")).toBe("juste");
    expect(effet("inconnu", "adore")).toBe("envol");
    expect(effet("inconnu", "pas")).toBeNull();
  });
});

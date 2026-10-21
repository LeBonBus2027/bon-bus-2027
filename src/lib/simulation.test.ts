/**
 * Simulations : des milliers de parcours tirés au hasard (graine fixe) sur les vraies données MonVote2027,
 * pour vérifier que le calcul suit la règle publiée dans « Comment ça marche » et que tout ce qui en découle
 * (classement, peinture grattée, animations, bus mis en avant, « Pour rappel ») reste cohérent.
 */
import { describe, expect, it } from "vitest";
import { classer, pas, R0, trajet, type Classe, type Reponse, type Valeur } from "./calcul";
import { candidats, positions, questions, type Candidat } from "./donnees";
import { ORDRE_BEAUTE, type Niveau } from "./niveaux";
import { effet, peintures, reveler, type Peinture } from "./revelation";

/** Générateur pseudo-aléatoire à graine (mulberry32) : les simulations sont rejouables. */
function graine(n: number) {
  return () => {
    n = (n + 0x6d2b79f5) | 0;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NIVEAUX: Niveau[] = ["adore", "bien", "bof", "pas", "jamais", "inconnu"];
const VALEURS: Reponse[] = [-2, -1, 0, 1, 2, null];
const rang = (n: Niveau) => ORDRE_BEAUTE.indexOf(n);

interface Parcours { classement: Classe<Candidat>[]; bacs: Record<string, Niveau>; ordre: string[]; reponses: Record<string, Reponse> }

function parcours(alea: () => number, profil: "hasard" | "tout-adore" | "tout-neutre" | "unanime"): Parcours {
  const un = <T,>(l: readonly T[]) => l[Math.floor(alea() * l.length)]!;
  const melange = [...candidats].sort(() => alea() - 0.5);
  const gare = melange.slice(0, 2 + Math.floor(alea() * (candidats.length - 1)));
  const bacs = Object.fromEntries(gare.map(c => [c.id, profil === "tout-adore" ? "adore" : un(NIVEAUX)])) as Record<string, Niveau>;
  const ordre = [...questions].sort(() => alea() - 0.5).slice(0, 10 + Math.floor(alea() * (questions.length - 9))).map(q => q.id);
  const reponses = Object.fromEntries(ordre.map(q => [q, profil === "tout-neutre" ? 0 : profil === "unanime" ? 2 : un(VALEURS)])) as Record<string, Reponse>;
  const classement = classer(gare, c => trajet(ordre, reponses, positions[c.id] ?? {}), alea);
  return { classement, bacs, ordre, reponses };
}

/** La règle publiée, réécrite indépendamment : distance = R0 × (1 − Σpas ÷ 2n), n = questions répondues. */
function distancePubliee(ordre: string[], reponses: Record<string, Reponse>, pos: Record<string, Valeur | null>): number {
  const repondues = ordre.filter(q => reponses[q] !== null);
  const somme = repondues.reduce((s, q) => s + pas(reponses[q]!, pos[q] ?? null), 0);
  return repondues.length ? R0 * (1 - somme / (2 * repondues.length)) : R0;
}

const PROFILS = ["hasard", "hasard", "hasard", "tout-adore", "tout-neutre", "unanime"] as const;
const N = 3000;
const simulations = Array.from({ length: N }, (_, i) => ({ i, p: parcours(graine(i + 1), PROFILS[i % PROFILS.length]!) }));

describe(`simulations (${N} parcours)`, () => {
  it("le calcul suit la règle publiée, à l'arrêt près, et le classement va du plus proche au plus loin", () => {
    for (const { i, p } of simulations) {
      for (const c of p.classement) {
        const d = distancePubliee(p.ordre, p.reponses, positions[c.candidat.id] ?? {});
        expect(c.trajet.distance, `parcours ${i}, ${c.candidat.id}`).toBeCloseTo(d, 9);
        expect(c.trajet.arrets).toBe(Math.round(d));
        expect(c.trajet.distance).toBeGreaterThanOrEqual(0);
        expect(c.trajet.distance).toBeLessThanOrEqual(2 * R0);
      }
      for (let k = 1; k < p.classement.length; k++) expect(p.classement[k]!.trajet.distance).toBeGreaterThanOrEqual(p.classement[k - 1]!.trajet.distance);
    }
  });

  it("peinture grattée : luxe en tête, épave en queue, jamais plus belle plus loin, même peinture à arrêts égaux", () => {
    for (const { i, p } of simulations) {
      const pe = peintures(p.classement);
      const l = p.classement.map(c => ({ a: c.trajet.arrets, n: pe[c.candidat.id]! }));
      const ctx = `parcours ${i} : ${JSON.stringify(l)}`;
      expect(l[0]!.n, ctx).toBe("adore");
      if (l.at(-1)!.a !== l[0]!.a) expect(l.at(-1)!.n, ctx).toBe("jamais");
      for (let k = 1; k < l.length; k++) {
        expect(rang(l[k]!.n), ctx).toBeGreaterThanOrEqual(rang(l[k - 1]!.n));
        if (l[k]!.a === l[k - 1]!.a) expect(l[k]!.n, ctx).toBe(l[k - 1]!.n);
      }
    }
  });

  it("animations : le favori arrivé premier brille, le favori arrivé dernier tombe en panne, et chaque effet suit l'écart de niveaux", () => {
    let brille = 0, panne = 0;
    for (const { i, p } of simulations) {
      const pe = peintures(p.classement);
      for (const c of p.classement) {
        const avant = p.bacs[c.candidat.id]!, apres: Peinture = pe[c.candidat.id]!, e = effet(avant, apres);
        const ctx = `parcours ${i}, ${c.candidat.id} : ${avant} → ${apres}`;
        if (avant === "adore" && apres === "adore") { expect(e, ctx).toBe("brille"); brille++; }
        if (avant === "adore" && apres === "jamais") { expect(e, ctx).toBe("panne"); panne++; }
        if (e === "panne") expect(rang(apres) - rang(avant), ctx).toBeGreaterThanOrEqual(3);
        if (e === "brille") expect([avant, apres], ctx).toEqual(["adore", "adore"]);
        if (avant !== "inconnu" && avant === apres && avant !== "adore") expect(e, ctx).toBeNull();
      }
    }
    expect(brille).toBeGreaterThan(100);
    expect(panne).toBeGreaterThan(100);
  });

  it("révélation : le meilleur est en tête, le plus beau bus est le plus éloigné de ton plus beau bac, « Pour rappel » couvre ce bac et les 3 plus proches", () => {
    for (const { i, p } of simulations) {
      const r = reveler(p.classement, p.bacs, () => 0.5);
      const ctx = `parcours ${i}`;
      expect(r.meilleur, ctx).toBe(p.classement[0]);
      expect(new Set(r.focus).size, ctx).toBe(r.focus.length);
      const epave = p.classement.find(c => p.bacs[c.candidat.id] === ORDRE_BEAUTE.findLast(n => p.classement.some(x => p.bacs[x.candidat.id] === n)));
      const vus = new Set([...p.classement.slice(0, 3), ...p.classement.filter(c => !!r.haut && p.bacs[c.candidat.id] === r.haut)]);
      if (r.epave) vus.add(r.epave);
      expect(new Set(r.focus), ctx).toEqual(vus);
      if (r.epave) expect(r.epave, ctx).toBe(epave);
      const haut = ORDRE_BEAUTE.find(n => p.classement.some(c => p.bacs[c.candidat.id] === n));
      expect(r.haut, ctx).toBe(haut);
      if (r.beau) {
        expect(p.bacs[r.beau.candidat.id], ctx).toBe(haut);
        const memeBac = p.classement.filter(c => p.bacs[c.candidat.id] === haut);
        expect(r.beau, ctx).toBe(memeBac.at(-1));
      }
      expect(r.intuition, ctx).toBe(!!haut && p.bacs[r.meilleur.candidat.id] === haut);
      expect(r.decu, ctx).toBe(r.beau && r.beau.trajet.arrets > r.meilleur.trajet.arrets ? r.beau : undefined);
      const attendu = p.classement.filter((c, k) => k < 3 || (!!haut && p.bacs[c.candidat.id] === haut));
      expect(r.rappel, ctx).toEqual(attendu);
      expect(r.peinture, ctx).toEqual(peintures(p.classement));
    }
  });
});

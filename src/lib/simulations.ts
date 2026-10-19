/**
 * Simulations de cohérence : des électeurs fictifs dont on connaît la réponse attendue.
 * Pour chaque candidat : un « clone » qui reprend toutes ses positions, un clone modéré, un clone distrait
 * (une partie des réponses au hasard) et un « anti-clone » qui prend le contre-pied de tout.
 * Et pour l'ensemble : des électeurs qui répondent au hasard, pour vérifier qu'aucun bus n'est favorisé par construction.
 */
import { graine } from "./aleatoire";
import { R0, trajet, type Reponse, type Valeur } from "./calcul";
import { candidats, positions, questions } from "./donnees";
import { tirerQuestions } from "./tirage";

const TOUTES = questions.map(q => q.id);
type Electeur = (q: string) => Reponse;

/** Distances de tous les candidats pour un électeur, sur une liste de questions. */
export function distances(ids: readonly string[], electeur: Electeur): Map<string, number> {
  const reponses = Object.fromEntries(ids.map(q => [q, electeur(q)]));
  return new Map(candidats.map(c => [c.id, trajet(ids, reponses, positions[c.id] ?? {}).distance]));
}

/** Rang d'un candidat (1 = le plus proche ; les ex-aequo partagent le meilleur rang). */
export function rang(d: Map<string, number>, id: string): number {
  const lui = d.get(id)!;
  return 1 + [...d.values()].filter(x => x < lui - 1e-9).length;
}
/** Rang en partant de la fin (1 = le plus loin). */
const rangDernier = (d: Map<string, number>, id: string) => 1 + [...d.values()].filter(x => x > d.get(id)! + 1e-9).length;

const pos = (id: string) => (q: string): Reponse => positions[id]?.[q] ?? null;
const clone = (id: string): Electeur => pos(id);
const modere = (id: string): Electeur => q => { const p = pos(id)(q); return p === null ? null : (Math.sign(p) as Valeur); };
const anti = (id: string): Electeur => q => { const p = pos(id)(q); return p === null ? null : (-p as Valeur); };
const VALEURS: Valeur[] = [-2, -1, 0, 1, 2];
const distrait = (id: string, part: number, t: () => number): Electeur =>
  q => (t() < part ? VALEURS[Math.floor(t() * 5)]! : pos(id)(q));

export interface LigneCandidat {
  id: string;
  nom: string;
  positions: number;
  neutres: number;
  /** Clone sur les 100 questions. */
  clone: { arrets: number; distance: number; rang: number; exAequo: number; voisin: string; voisinArrets: number };
  /** Clone sur des tirages de 20 questions : part des tirages où il arrive premier (ex-aequo compris). */
  rapide: { premier: number; arretsMoyens: number };
  modere: { rang: number; arrets: number };
  /** Clone qui répond au hasard à un quart des questions. */
  distrait: { premier: number; top3: number };
  anti: { arrets: number; rangDernier: number };
}

const arrondi = (x: number) => Math.round(x);
const nomDe = (id: string) => candidats.find(c => c.id === id)!.nom;

export function simulerCandidat(id: string, tirages = 200): LigneCandidat {
  const p = Object.values(positions[id] ?? {}).filter(v => v !== null);

  const d = distances(TOUTES, clone(id));
  const autres = [...d].filter(([k]) => k !== id).sort((a, b) => a[1] - b[1]);
  const exAequo = autres.filter(([, x]) => Math.abs(x - d.get(id)!) < 1e-9).length;

  let premierRapide = 0, somme = 0;
  for (let i = 0; i < tirages; i++) {
    const ids = tirerQuestions(questions, 20, graine(1000 + i));
    const dr = distances(ids, clone(id));
    if (rang(dr, id) === 1) premierRapide++;
    somme += dr.get(id)!;
  }

  const dm = distances(TOUTES, modere(id));

  let premierDistrait = 0, top3 = 0;
  for (let i = 0; i < tirages; i++) {
    const dd = distances(TOUTES, distrait(id, 0.25, graine(5000 + i)));
    const r = rang(dd, id);
    if (r === 1) premierDistrait++;
    if (r <= 3) top3++;
  }

  const da = distances(TOUTES, anti(id));

  return {
    id, nom: nomDe(id), positions: p.length, neutres: p.filter(v => v === 0).length,
    clone: { arrets: arrondi(d.get(id)!), distance: d.get(id)!, rang: rang(d, id), exAequo, voisin: nomDe(autres[0]![0]), voisinArrets: arrondi(autres[0]![1]) },
    rapide: { premier: premierRapide / tirages, arretsMoyens: somme / tirages },
    modere: { rang: rang(dm, id), arrets: arrondi(dm.get(id)!) },
    distrait: { premier: premierDistrait / tirages, top3: top3 / tirages },
    anti: { arrets: arrondi(da.get(id)!), rangDernier: rangDernier(da, id) },
  };
}

/** Électeurs au hasard : combien de fois chaque candidat arrive premier (ex-aequo partagés). */
export function electeursAuHasard(n = 2000, nbQuestions = 100): Map<string, number> {
  const compte = new Map(candidats.map(c => [c.id, 0]));
  const t = graine(9000 + nbQuestions);
  for (let i = 0; i < n; i++) {
    const ids = nbQuestions >= TOUTES.length ? TOUTES : tirerQuestions(questions, nbQuestions, t);
    const d = distances(ids, () => VALEURS[Math.floor(t() * 5)]!);
    const min = Math.min(...d.values());
    const premiers = [...d].filter(([, x]) => Math.abs(x - min) < 1e-9);
    for (const [k] of premiers) compte.set(k, compte.get(k)! + 1 / premiers.length);
  }
  return new Map([...compte].map(([k, v]) => [k, v / n]));
}

/** Électeur 100 % neutre : tous les bus doivent rester à la gare. */
export const neutre = () => distances(TOUTES, () => 0);

const pc = (x: number) => `${Math.round(x * 100)} %`;

export function rapport(lignes: LigneCandidat[], hasard100: Map<string, number>, hasard20: Map<string, number>): string {
  const t = [
    "# Simulations de cohérence",
    "",
    `Données MonVote2027, ${questions.length} questions, ${candidats.length} candidats. Distance en arrêts : 0 = devant ta porte, ${R0} = la gare, ${2 * R0} = le terminus opposé.`,
    "",
    "## 1. Un électeur qui pense exactement comme le candidat",
    "",
    "- **Clone** : reprend toutes ses positions (100 questions). Il doit arriver premier, le plus près possible de la maison.",
    "- **Rapide** : le même clone, sur 200 tirages de 20 questions.",
    "- **Modéré** : mêmes camps, mais « plutôt » au lieu de « tout à fait ».",
    "- **Distrait** : répond au hasard à un quart des questions (200 essais).",
    "- **Anti** : prend le contre-pied de chaque position. Le bus doit partir vers le terminus opposé.",
    "",
    "| Candidat | Positions (dont neutres) | Clone : arrêts, rang | Plus proche voisin | Rapide : 1er | Modéré : rang | Distrait : 1er / top 3 | Anti : arrêts, rang depuis la fin |",
    "|---|---|---|---|---|---|---|---|",
    ...lignes.map(l => `| ${l.nom} | ${l.positions} (${l.neutres}) | ${l.clone.arrets}, ${l.clone.rang}${l.clone.exAequo ? ` (ex-aequo ×${l.clone.exAequo})` : ""} | ${l.clone.voisin} (${l.clone.voisinArrets}) | ${pc(l.rapide.premier)} | ${l.modere.rang} (${l.modere.arrets} arrêts) | ${pc(l.distrait.premier)} / ${pc(l.distrait.top3)} | ${l.anti.arrets}, ${l.anti.rangDernier} |`),
    "",
    "## 2. Électeurs qui répondent au hasard",
    "",
    "Part des électeurs pour qui chaque candidat arrive premier (2 000 électeurs). Aucun candidat ne devrait dominer.",
    "",
    "| Candidat | 100 questions | 20 questions |",
    "|---|---|---|",
    ...[...hasard100].sort((a, b) => b[1] - a[1]).map(([id, v]) => `| ${nomDe(id)} | ${pc(v)} | ${pc(hasard20.get(id)!)} |`),
    "",
  ];
  return t.join("\n");
}

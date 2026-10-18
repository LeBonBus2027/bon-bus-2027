/**
 * Carte de ville et lignes de bus (cahier des charges, section 3, validé sur la maquette n°2).
 * Un pâté de maisons = un arrêt. Chaque ligne : porte → gare (10 arrêts) → terminus opposé (10 arrêts).
 * Les lignes sont tirées une fois pour toutes avec une graine fixe : tout le monde voit la même ville.
 */
import { graine, melanger } from "./aleatoire";
import { R0 } from "./calcul";

export type Noeud = readonly [number, number];

export const COLS = 14, ROWS = 10, BLOC = 80, MARGE = 60;
export const MAISON: Noeud = [12, 1];
export const GARE: Noeud = [6, 5];
export const TERMINUS: Noeud = [0, 9];
export const CANAL = 7;
export const PONTS = [1, 3, 5, 9, 12];
export const PARC = { i: 8, j: 2, w: 2, h: 2 } as const;
export const LARGEUR = MARGE * 2 + (COLS - 1) * BLOC;
export const HAUTEUR = MARGE * 2 + (ROWS - 1) * BLOC;

export const px = ([i, j]: Noeud): [number, number] => [MARGE + i * BLOC, MARGE + j * BLOC];
const nk = ([i, j]: Noeud) => `${i},${j}`;
const ek = (a: Noeud, b: Noeud) => [nk(a), nk(b)].sort().join("|");

const FERMEES = new Set<string>();
for (let i = 0; i < COLS; i++) if (!PONTS.includes(i)) FERMEES.add(ek([i, CANAL], [i, CANAL + 1]));
for (const n of [[8, 3], [10, 3], [9, 2], [9, 4]] as Noeud[]) FERMEES.add(ek([9, 3], n));
for (const [a, b] of [[[3, 2], [4, 2]], [[11, 6], [12, 6]], [[2, 4], [2, 5]], [[10, 8], [11, 8]]] as [Noeud, Noeud][]) FERMEES.add(ek(a, b));

const dansGrille = ([i, j]: Noeud) => i >= 0 && j >= 0 && i < COLS && j < ROWS;
export const rue = (a: Noeud, b: Noeud) => dansGrille(a) && dansGrille(b) && !FERMEES.has(ek(a, b));
export const avenue = (a: Noeud, b: Noeud) =>
  (a[1] === b[1] && a[1] === 5) || (a[0] === b[0] && a[0] === 6) || (a[1] === b[1] && a[1] === 1 && a[0] >= 6);

/** Toutes les rues ouvertes de la grille. */
export const RUES: readonly [Noeud, Noeud][] = (() => {
  const r: [Noeud, Noeud][] = [];
  for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) {
    for (const n of [[i + 1, j], [i, j + 1]] as Noeud[]) if (rue([i, j], n)) r.push([[i, j], n]);
  }
  return r;
})();

/** Chemin qui se rapproche de sa cible à chaque carrefour, en respectant canal, parc et impasses. */
function escalier(a: Noeud, b: Noeud, tirage: () => number): Noeud[] {
  for (let essai = 0; essai < 500; essai++) {
    let cur = a;
    const chemin: Noeud[] = [a];
    while (cur[0] !== b[0] || cur[1] !== b[1]) {
      const dx = Math.sign(b[0] - cur[0]), dy = Math.sign(b[1] - cur[1]);
      const options = ([dx ? [cur[0] + dx, cur[1]] : null, dy ? [cur[0], cur[1] + dy] : null] as (Noeud | null)[])
        .filter((n): n is Noeud => n !== null && rue(cur, n));
      if (!options.length) break;
      cur = options[Math.floor(tirage() * options.length)]!;
      chemin.push(cur);
    }
    if (cur[0] === b[0] && cur[1] === b[1]) return chemin;
  }
  throw new Error("Aucun chemin trouvé");
}

/** Une ligne par candidat, côté maison toutes différentes, attribuées au hasard (graine fixe). */
export function lignes(ids: readonly string[], seed = 2027): Record<string, Noeud[]> {
  const tirage = graine(seed);
  const vues = new Set<string>();
  const routes: Noeud[][] = [];
  for (let essai = 0; routes.length < ids.length && essai < 5000; essai++) {
    const aller = escalier(MAISON, GARE, tirage);
    const cle = aller.map(nk).join(";");
    if (vues.has(cle)) continue;
    vues.add(cle);
    routes.push(aller.concat(escalier(GARE, TERMINUS, tirage).slice(1)));
  }
  if (routes.length < ids.length) throw new Error("Pas assez d'itinéraires distincts");
  const ordre = melanger([...ids].sort(), tirage);
  return Object.fromEntries(ordre.map((id, i) => [id, routes[i]!]));
}

export interface Point { x: number; y: number; angle: number; k: number; f: number }

/** Point d'une ligne à d arrêts de la porte ; angle = direction vers la maison. */
export function surLigne(ligne: readonly Noeud[], d: number): Point {
  const dd = Math.max(0, Math.min(ligne.length - 1, d));
  const k = Math.min(Math.floor(dd), ligne.length - 2), f = dd - k;
  const [ax, ay] = px(ligne[k]!), [bx, by] = px(ligne[k + 1]!);
  return { x: ax + (bx - ax) * f, y: ay + (by - ay) * f, angle: Math.atan2(ay - by, ax - bx), k, f };
}

/** Position affichée d'un bus : décalé sur sa voie, toujours tourné vers la maison, jamais la tête en bas. */
export function positionBus(ligne: readonly Noeud[], d: number, voie: number) {
  const p = surLigne(ligne, d);
  return {
    x: p.x - Math.sin(p.angle) * voie,
    y: p.y + Math.cos(p.angle) * voie,
    angle: (p.angle * 180) / Math.PI,
    retourne: Math.cos(p.angle) < -0.01,
  };
}

/** Trajet à pied, de l'arrêt du bus jusqu'à la porte. */
export function aPied(ligne: readonly Noeud[], d: number): [number, number][] {
  const p = surLigne(ligne, d);
  const pts: [number, number][] = [[p.x, p.y]];
  for (let k = p.f > 0 ? p.k : p.k - 1; k >= 0; k--) pts.push(px(ligne[k]!));
  return pts;
}

export const LONGUEUR_LIGNE = 2 * R0;

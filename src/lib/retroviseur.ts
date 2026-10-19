/**
 * Rétroviseur : rejouer le trajet étape par étape après l'arrivée.
 * Étape 0 = départ (tous à la gare) ; étape k = après le k-ième point de passage de l'animation.
 */
import { R0, type Reponse, type Trajet } from "./calcul";
import type { Passage } from "./revelation";

export const REPONSE: Record<number, string> = {
  2: "tout à fait d'accord", 1: "plutôt d'accord", 0: "neutre", [-1]: "plutôt pas d'accord", [-2]: "pas du tout d'accord",
};

/** Distance d'un bus à l'étape k. */
export function distanceA(t: Trajet, passages: readonly Passage[], k: number): number {
  if (k <= 0) return R0;
  if (k >= passages.length) return t.distance;
  return t.etapes[passages[k - 1]!.index] ?? R0;
}

export interface Mouvement { id: string; pas: number }

/**
 * Pas faits par chaque bus entre l'étape k − 1 et l'étape k (positif = il avance vers chez toi).
 * Triés du plus grand bond en avant au plus grand recul.
 */
export function mouvements(trajets: ReadonlyMap<string, Trajet>, passages: readonly Passage[], k: number): Mouvement[] {
  return [...trajets.entries()]
    .map(([id, t]) => {
      const n = t.etapes.length || 1;
      const ecart = distanceA(t, passages, k - 1) - distanceA(t, passages, k);
      return { id, pas: Math.round((ecart * 2 * n) / R0) };
    })
    .sort((a, b) => b.pas - a.pas || a.id.localeCompare(b.id));
}

export const libelleReponse = (r: Reponse | undefined) => (r === null || r === undefined ? "passée" : REPONSE[r]!);

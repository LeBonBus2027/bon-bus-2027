/**
 * Mode duo : comparaison de deux trajets faits sur le même téléphone.
 * Mêmes règles que pour un candidat : on mesure aussi la distance entre les deux « maisons »,
 * en traitant les réponses de l'un comme les positions de l'autre.
 */
import { pas, R0, trajet, type Position, type Reponse } from "./calcul";
import type { Niveau } from "./niveaux";

export interface Partie {
  bacs: Record<string, Niveau>;
  reponses: Record<string, Reponse>;
  ordre: string[];
}

export interface LigneDuo { id: string; a: number; b: number }

export interface Comparaison {
  /** Distance entre les deux maisons, en arrêts (0 = mêmes idées, 20 = opposées sur tout). */
  maisons: number;
  communes: number;
  accord: number;
  desaccord: number;
  /** Candidats triés du plus « commun » (le plus proche du plus éloigné des deux) au moins commun. */
  lignes: LigneDuo[];
  commun: LigneDuo;
}

export function comparer(a: Partie, b: Partie, ids: readonly string[], positions: Readonly<Record<string, Readonly<Record<string, Position>>>>): Comparaison {
  const communesIds = a.ordre.filter(q => (a.reponses[q] ?? null) !== null && (b.reponses[q] ?? null) !== null);
  const pasMaisons = communesIds.map(q => pas(a.reponses[q] ?? null, b.reponses[q] ?? null));
  const somme = pasMaisons.reduce<number>((s, p) => s + p, 0);
  const maisons = communesIds.length ? Math.round(R0 * (1 - somme / (2 * communesIds.length))) : R0;

  const lignes = ids
    .map(id => ({
      id,
      a: trajet(a.ordre, a.reponses, positions[id] ?? {}).arrets,
      b: trajet(b.ordre, b.reponses, positions[id] ?? {}).arrets,
    }))
    .sort((x, y) => Math.max(x.a, x.b) - Math.max(y.a, y.b) || x.a + x.b - (y.a + y.b) || x.id.localeCompare(y.id));

  return {
    maisons,
    communes: communesIds.length,
    accord: pasMaisons.filter(p => p > 0).length,
    desaccord: pasMaisons.filter(p => p < 0).length,
    lignes,
    commun: lignes[0]!,
  };
}

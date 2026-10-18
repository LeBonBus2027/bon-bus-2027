/**
 * Déplacement des bus (cahier des charges, section 3).
 *
 * Pour chaque question, on compare la réponse de l'utilisateur à la position du candidat
 * (tableau de concordance qualitative de monvote2027) et le bus avance ou recule d'un pas de −2 à +2.
 * La distance d est comptée en arrêts depuis la porte : départ à la gare (d = R0),
 * porte à d = 0, terminus opposé à d = 2·R0.
 */

/** Échelle à 5 niveaux : −2 tout à fait contre … +2 tout à fait pour. */
export type Valeur = -2 | -1 | 0 | 1 | 2;
/** Réponse de l'utilisateur ; null = question passée. */
export type Reponse = Valeur | null;
/** Position d'un candidat ; null = pas de position connue. */
export type Position = Valeur | null;

/** Arrêts entre la gare et la porte. */
export const R0 = 10;
/** Nombre minimal de réponses pour lancer l'animation. */
export const MIN_REPONSES = 10;
/** En dessous de cette part de questions couvertes, le résultat est marqué « position incomplète ». */
export const COUVERTURE_MIN = 0.6;

/** +2 même camp et même intensité, +1 même camp, 0 si l'un est neutre, −1 camps opposés, −2 extrêmes opposés. */
export function pas(reponse: Reponse, position: Position): Valeur {
  if (reponse === null || position === null || reponse === 0 || position === 0) return 0;
  if (Math.sign(reponse) === Math.sign(position)) return reponse === position ? 2 : 1;
  return Math.abs(reponse) === 2 && Math.abs(position) === 2 ? -2 : -1;
}

export interface Trajet {
  /** Distance après chaque question répondue, dans l'ordre donné (pour l'animation). */
  etapes: number[];
  /** Distance finale exacte, en arrêts depuis la porte (0 à 2·R0). */
  distance: number;
  /** Distance affichée, arrondie à l'arrêt. */
  arrets: number;
  /** Part des questions répondues sur lesquelles le candidat a une position. */
  couverture: number;
  incomplet: boolean;
}

/**
 * Trajet d'un bus.
 * @param ordre identifiants des questions dans l'ordre de rejeu
 * @param reponses réponses de l'utilisateur par question
 * @param positions positions du candidat par question
 */
export function trajet(
  ordre: readonly string[],
  reponses: Readonly<Record<string, Reponse>>,
  positions: Readonly<Record<string, Position>>,
): Trajet {
  const repondues = ordre.filter(q => (reponses[q] ?? null) !== null);
  const n = repondues.length;
  if (n === 0) return { etapes: [], distance: R0, arrets: R0, couverture: 0, incomplet: true };

  let somme = 0;
  let couvertes = 0;
  const etapes = repondues.map(q => {
    const p = positions[q] ?? null;
    if (p !== null) couvertes++;
    somme += pas(reponses[q] ?? null, p);
    return distanceDepuisSomme(somme, n);
  });
  const distance = distanceDepuisSomme(somme, n);
  const couverture = couvertes / n;
  return { etapes, distance, arrets: Math.round(distance), couverture, incomplet: couverture < COUVERTURE_MIN };
}

/** r = R0 × (1 − Σpas ÷ 2n), calculé en une fois pour éviter toute dérive d'arrondi. */
function distanceDepuisSomme(somme: number, n: number): number {
  return R0 * (1 - somme / (2 * n));
}

export interface Classe<T> {
  candidat: T;
  trajet: Trajet;
}

/**
 * Classe les candidats du plus proche au plus éloigné.
 * Les ex-aequo sont départagés par `tirage`, qui doit renvoyer un nombre dans [0, 1) (crypto en production).
 */
export function classer<T>(
  candidats: readonly T[],
  calcul: (c: T) => Trajet,
  tirage: () => number,
): Classe<T>[] {
  return candidats
    .map(candidat => ({ candidat, trajet: calcul(candidat), cle: tirage() }))
    .sort((a, b) => a.trajet.distance - b.trajet.distance || a.cle - b.cle)
    .map(({ candidat, trajet }) => ({ candidat, trajet }));
}

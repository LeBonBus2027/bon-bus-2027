/**
 * « Affine ton résultat » : après la version rapide, 10 questions de plus, choisies parmi celles
 * qui départagent le mieux les bus les plus proches (là où leurs positions divergent le plus).
 * Le choix ne dépend que des données : aucune préférence pour un candidat.
 */
import { tirageCrypto } from "./aleatoire";
import type { Position } from "./calcul";
import type { Question } from "./donnees";

export function questionsPourAffiner(
  dejaPosees: readonly string[],
  proches: readonly string[],
  positions: Readonly<Record<string, Readonly<Record<string, Position>>>>,
  toutes: readonly Question[],
  combien = 10,
  tirage: () => number = tirageCrypto,
): string[] {
  const posees = new Set(dejaPosees);
  return toutes
    .filter(q => !posees.has(q.id))
    .map(q => {
      const valeurs = proches.map(id => positions[id]?.[q.id]).filter((v): v is Exclude<Position, null> => v !== null && v !== undefined);
      // Écart entre le plus « pour » et le plus « contre » des bus proches (0 à 4), puis nombre de positions différentes.
      const ecart = valeurs.length > 1 ? Math.max(...valeurs) - Math.min(...valeurs) : 0;
      return { id: q.id, ecart, diversite: new Set(valeurs).size, hasard: tirage() };
    })
    .sort((a, b) => b.ecart - a.ecart || b.diversite - a.diversite || a.hasard - b.hasard)
    .slice(0, combien)
    .map(x => x.id);
}

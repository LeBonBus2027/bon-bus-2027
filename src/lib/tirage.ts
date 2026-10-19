/**
 * Tirage des questions à chaque nouveau parcours.
 * - Version complète : les 100 questions, dans un ordre tiré au hasard.
 * - Version rapide : 20 questions tirées au hasard parmi les 100, de façon équilibrée
 *   (le même nombre dans chaque grand thème, pour qu'aucun sujet ne soit oublié), puis mélangées.
 */
import { melanger, tirageCrypto } from "./aleatoire";
import { grandTheme, type Question } from "./donnees";

export function tirerQuestions(toutes: readonly Question[], combien: number, tirage: () => number = tirageCrypto): string[] {
  if (combien >= toutes.length) return melanger(toutes.map(q => q.id), tirage);

  const parTheme = new Map<string, string[]>();
  for (const q of toutes) parTheme.set(grandTheme(q), [...(parTheme.get(grandTheme(q)) ?? []), q.id]);
  const parThemeTire = [...parTheme.values()].map(ids => melanger(ids, tirage));

  // Autant dans chaque thème…
  const part = Math.floor(combien / parThemeTire.length);
  const choisies = parThemeTire.flatMap(ids => ids.slice(0, part));
  // … et s'il en manque (nombre de thèmes qui ne divise pas « combien »), on complète au hasard parmi le reste.
  const reste = melanger(parThemeTire.flatMap(ids => ids.slice(part)), tirage);
  choisies.push(...reste.slice(0, combien - choisies.length));
  return melanger(choisies, tirage);
}

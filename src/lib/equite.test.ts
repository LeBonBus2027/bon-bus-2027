/**
 * Test d'équité : aucun candidat ne doit être structurellement désavantagé par les questions, les données ou le calcul.
 * Pour chaque candidat, un électeur qui pense exactement comme lui doit le voir arriver premier (ex-aequo compris),
 * en version rapide comme en version complète.
 */
import { describe, expect, it } from "vitest";
import { trajet, type Reponse } from "./calcul";
import { candidats, positions, questions } from "./donnees";
import { graine } from "./aleatoire";
import { tirerQuestions } from "./tirage";

function classementPour(modele: string, ids: string[]) {
  const reponses = Object.fromEntries(ids.map(q => [q, (positions[modele]?.[q] ?? null) as Reponse]));
  return candidats
    .map(c => ({ id: c.id, d: trajet(ids, reponses, positions[c.id] ?? {}).distance }))
    .sort((a, b) => a.d - b.d);
}

const CAS: [string, string[]][] = [
  // Version rapide : plusieurs tirages au hasard de 20 questions (graine fixe pour un test reproductible).
  ...Array.from({ length: 5 }, (_, i): [string, string[]] => [`version rapide, tirage n°${i + 1}`, tirerQuestions(questions, 20, graine(100 + i))]),
  ["version complète (100 questions)", questions.map(q => q.id)],
];

describe.each(CAS)("équité, %s", (_, ids) => {
  it.each(candidats.map(c => [c.nom, c.id]))("un électeur qui pense comme %s le voit arriver premier", (_, id) => {
    const res = classementPour(id, ids);
    const lui = res.find(r => r.id === id)!;
    expect(lui.d).toBe(res[0]!.d);
  });
});

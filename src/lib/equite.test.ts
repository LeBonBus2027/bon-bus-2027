/**
 * Test d'équité : aucun candidat ne doit être structurellement désavantagé par les questions, les données ou le calcul.
 * Pour chaque candidat, un électeur qui pense exactement comme lui doit le voir arriver premier (ex-aequo compris),
 * en version rapide comme en version complète.
 */
import { describe, expect, it } from "vitest";
import { trajet, type Reponse } from "./calcul";
import { candidats, positions, questions } from "./donnees";

function classementPour(modele: string, ids: string[]) {
  const reponses = Object.fromEntries(ids.map(q => [q, (positions[modele]?.[q] ?? null) as Reponse]));
  return candidats
    .map(c => ({ id: c.id, d: trajet(ids, reponses, positions[c.id] ?? {}).distance }))
    .sort((a, b) => a.d - b.d);
}

describe.each([
  ["version rapide (20 questions)", questions.filter(q => q.quiz_rapide).map(q => q.id)],
  ["version complète (100 questions)", questions.map(q => q.id)],
])("équité, %s", (_, ids) => {
  it.each(candidats.map(c => [c.nom, c.id]))("un électeur qui pense comme %s le voit arriver premier", (_, id) => {
    const res = classementPour(id, ids);
    const lui = res.find(r => r.id === id)!;
    expect(lui.d).toBe(res[0]!.d);
  });
});

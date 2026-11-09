/**
 * Simulations de cohérence (voir simulations.ts). `npm run simulations` écrit aussi le rapport complet
 * dans rapports/simulations.md.
 */
import { describe, expect, it } from "vitest";
import { COUVERTURE_MIN, R0 } from "./calcul";
import { candidats, questions } from "./donnees";
import { electeursAuHasard, neutre, rapport, simulerCandidat, simulerPriorites, type LigneCandidat } from "./simulations";

const toutes: LigneCandidat[] = candidats.map(c => simulerCandidat(c.id));
// Un candidat qui vient d'entrer chez MonVote2027 peut n'avoir encore que quelques positions sourcées (voire aucune) :
// son clone n'a alors presque rien à dire, et les contrôles ci-dessous n'ont pas de sens. On ne les applique qu'aux
// candidats dont la position est connue sur au moins 60 % des questions (le seuil de « position incomplète »).
const lignes = toutes.filter(l => l.positions >= COUVERTURE_MIN * questions.length);
const prio = simulerPriorites();

describe("simulations de cohérence", () => {
  it("un électeur 100 % neutre laisse tous les bus à la gare", () => {
    for (const d of neutre().values()) expect(d).toBe(R0);
  });

  it.each(lignes.map(l => [l.nom, l] as const))("%s : son clone le voit arriver premier", (_, l) => {
    expect(l.clone.rang).toBe(1);
    // Un clone « modéré » peut se retrouver plus près d'un candidat aux positions moins tranchées
    // (la règle donne +2 seulement à intensité égale) : on exige qu'il reste sur le podium.
    expect(l.modere.rang).toBeLessThanOrEqual(3);
  });

  it.each(lignes.map(l => [l.nom, l] as const))("%s : son anti-clone le voit partir vers le terminus opposé", (_, l) => {
    expect(l.anti.arrets).toBeGreaterThan(R0);
  });

  it.each(lignes.map(l => [l.nom, l] as const))("%s : un clone distrait le garde dans son top 3", (_, l) => {
    expect(l.distrait.top3).toBeGreaterThanOrEqual(0.9);
  });

  it("« Ce qui compte pour toi » ne déplace jamais un bus pour rien", () => {
    expect(prio.contreSens).toBe(0);
    expect(prio.perdSansRaison).toBe(0);
    expect(prio.clonePerd).toBe(0);
  });

  it("écrit le rapport (npm run simulations)", { timeout: 120_000 }, async () => {
    if (import.meta.env.MODE !== "rapport") return;
    await expect(rapport(toutes, electeursAuHasard(2000, 100), electeursAuHasard(2000, 20), prio)).toMatchFileSnapshot("../../rapports/simulations.md");
  });
}, 120_000);

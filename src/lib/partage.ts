/**
 * Ce que l'on partage : le texte (réseaux) et les lignes du ticket (image). Sans nom de candidat par défaut
 * (cahier des charges, section 2). Mêmes mots que le diaporama : « coup de cœur » = ton plus beau bus quand il te laisse
 * plus loin que celui qui te rapproche le plus.
 */
import { BAC, type Niveau } from "./niveaux";
import { effet, type Revelation } from "./revelation";
import type { LigneTicket } from "./ticket";

const n = (k: number) => `${k} arrêt${k > 1 ? "s" : ""}`;

export function lignesPartage(revelation: Revelation, bacs: Readonly<Record<string, Niveau>>, avecNoms: boolean): string[] {
  // Mêmes mots que le ticket et le diaporama : « coup de cœur » = ton plus beau bus, quand il te laisse plus loin.
  const { meilleur, decu, intuition } = revelation;
  const nomM = avecNoms ? ` (${meilleur.candidat.nom})` : "";
  const lui = intuition
    ? `Mon bus préféré${nomM} est bien celui qui me rapproche le plus de chez moi : ${n(meilleur.trajet.arrets)}.`
    : `Le bus qui me rapproche le plus${nomM} s'arrête à ${n(meilleur.trajet.arrets)} de chez moi.`;
  if (!decu) return [lui];
  const nomD = avecNoms ? ` (${decu.candidat.nom})` : "";
  const bac = bacs[meilleur.candidat.id];
  return [
    `Mon coup de cœur${nomD} s'arrête à ${n(decu.trajet.arrets)} de chez moi.`,
    intuition
      ? `Un autre de mes bus préférés${nomM}, lui, me rapproche le plus : ${n(meilleur.trajet.arrets)}.`
      : bac === "inconnu"
        ? `Celui qui me ramène le plus près${nomM}, je ne le connaissais même pas.`
        : `Celui qui me ramène le plus près${nomM}, je l'avais mis dans le bac « ${BAC[bac ?? "inconnu"]} ».`,
  ];
}

/** Lignes du ticket : bus imaginé → bus réel, avec l'effet de la peinture grattée. */
export function lignesTicket(revelation: Revelation, bacs: Readonly<Record<string, Niveau>>, avecNoms: boolean): LigneTicket[] {
  const { meilleur, decu, intuition } = revelation;
  const ligne = (titre: string, c: typeof meilleur): LigneTicket => ({
    titre, nom: avecNoms ? c.candidat.nom : undefined,
    avant: bacs[c.candidat.id] ?? "inconnu", apres: revelation.peinture[c.candidat.id] ?? "bof", arrets: c.trajet.arrets,
    effet: effet(bacs[c.candidat.id] ?? "inconnu", revelation.peinture[c.candidat.id] ?? "bof"),
  });
  const lui = ligne(intuition ? "MON BUS PRÉFÉRÉ ME RAMÈNE BIEN" : "CELUI QUI ME RAMÈNE", meilleur);
  return decu ? [ligne("MON COUP DE CŒUR", decu), lui] : [lui];
}

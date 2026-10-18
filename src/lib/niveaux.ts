/** Les 5 bacs du classement + « je ne le connais pas » : 6 niveaux de bus (cahier des charges, section 2). */
export type Niveau = "adore" | "bien" | "bof" | "pas" | "jamais" | "inconnu";

export const NIVEAUX: readonly { cle: Niveau; bac: string; bus: string }[] = [
  { cle: "adore", bac: "J'adore", bus: "Autocar de luxe" },
  { cle: "bien", bac: "Plutôt bien", bus: "Bus neuf" },
  { cle: "bof", bac: "Bof", bus: "Bus correct" },
  { cle: "pas", bac: "Plutôt pas", bus: "Bus cabossé" },
  { cle: "jamais", bac: "Jamais", bus: "Épave" },
  { cle: "inconnu", bac: "Je ne le connais pas", bus: "Bus gris" },
];

export const BAC: Record<Niveau, string> = Object.fromEntries(NIVEAUX.map(n => [n.cle, n.bac])) as Record<Niveau, string>;

/** Ordre du plus beau au moins beau, sans le bus gris. */
export const ORDRE_BEAUTE: readonly Niveau[] = ["adore", "bien", "bof", "pas", "jamais"];

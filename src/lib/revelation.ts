import { tirageCrypto } from "./aleatoire";
import { R0, type Classe, type Reponse } from "./calcul";
import { grandTheme, type Candidat, type Question } from "./donnees";
import { BAC, ORDRE_BEAUTE, type Niveau } from "./niveaux";

export interface Passage { index: number; libelle: string }

/**
 * Ordre de rejeu et points d'arrêt de l'animation.
 * Version rapide : une étape par question répondue. Version complète : une étape par grand thème.
 */
export function rejeu(ordre: readonly string[], reponses: Readonly<Record<string, Reponse>>, parId: ReadonlyMap<string, Question>) {
  const repondues = ordre.filter(id => (reponses[id] ?? null) !== null);
  if (repondues.length <= 20) {
    return { ordre: repondues, passages: repondues.map((_, i) => ({ index: i, libelle: `Question ${i + 1} sur ${repondues.length}` })) };
  }
  const themes: string[] = [];
  for (const id of repondues) {
    const t = grandTheme(parId.get(id)!);
    if (!themes.includes(t)) themes.push(t);
  }
  const trie = themes.flatMap(t => repondues.filter(id => grandTheme(parId.get(id)!) === t));
  const passages: Passage[] = themes.map(t => ({ index: trie.findLastIndex(id => grandTheme(parId.get(id)!) === t), libelle: t }));
  return { ordre: trie, passages };
}

export interface Revelation {
  meilleur: Classe<Candidat>;
  beau?: Classe<Candidat>;
  epave?: Classe<Candidat>;
  focus: Classe<Candidat>[];
  message: string;
  /** Petite morale imagée : ce que tu voyais du bus, puis où il va vraiment. */
  metaphore: string;
  intuition: boolean;
}

/** Ce que l'utilisateur voyait, selon le bac où il a rangé le candidat (sa perception, pas un jugement). */
export const VU: Record<Niveau, string> = {
  adore: "un car de luxe", bien: "un bus flambant neuf", bof: "un bus banal",
  pas: "un bus cabossé", jamais: "une épave", inconnu: "un bus anonyme",
};
const LE: Partial<Record<Niveau, string>> = { adore: "le car de luxe", bien: "le bus flambant neuf", bof: "le bus banal", pas: "le bus cabossé" };
const AU: Partial<Record<Niveau, string>> = { adore: "au car de luxe", bien: "au bus flambant neuf", bof: "au bus banal", pas: "au bus cabossé" };

/**
 * Métaphore de fin. Règles : partir de la perception (« tu le voyais comme… »), puis du seul fait mesuré,
 * la direction du bus. Jamais de jugement sur le candidat (fiabilité, qualité…), jamais d'accord au genre de l'utilisateur.
 */
export function metaphore(meilleur: Niveau, haut: Niveau | undefined, beau: Classe<Candidat> | undefined, intuition: boolean, tirage: () => number): string {
  const un = (l: string[]) => l[Math.floor(tirage() * l.length)]!;
  const vu = VU[meilleur];
  const debut = intuition
    ? un([
        `Tu le voyais comme ${vu}, et pour une fois l'apparence ne trompait pas : c'est bien lui qui va dans ta direction.`,
        `Ton intuition était la bonne : ce bus-là roule bien vers chez toi.`,
      ])
    : meilleur === "inconnu"
      ? un([
          `Tu ne connaissais même pas ce bus. C'est pourtant lui qui passe le plus près de chez toi.`,
          `Un bus que tu n'avais jamais remarqué… et c'est celui qui va dans ta direction.`,
        ])
      : meilleur === "pas" || meilleur === "jamais"
        ? un([
            `Tu le voyais comme ${vu}. Pourtant, c'est lui qui passe le plus près de chez toi.`,
            `Ce bus-là, tu l'aurais laissé passer sans un regard. C'est pourtant lui qui va dans ta direction.`,
          ])
        : un([
            `Tu le voyais comme ${vu}, pas comme le meilleur. C'est pourtant lui qui te rapproche le plus.`,
            `Il ne t'avait pas tapé dans l'œil, ce bus. C'est pourtant lui qui roule vers chez toi.`,
          ]);
  // Pas de seconde phrase si le plus beau bus était déjà une épave (cas où tout a été rangé en « Jamais »).
  if (intuition || !beau || !haut || !LE[haut]) return debut;
  const fin = beau.trajet.arrets > R0
    ? un([
        `Et ${LE[haut]} ? Tu pensais que c'était le bon bus : il est parti dans l'autre sens.`,
        `Quant ${AU[haut]} que tu voyais, il file vers l'autre bout de la ville.`,
      ])
    : un([
        `Et ${LE[haut]} ? Tu pensais que c'était le bon bus, mais il ne va pas vraiment vers chez toi.`,
        `Quant ${AU[haut]} que tu voyais, il prend une autre route que la tienne.`,
      ]);
  return `${debut} ${fin}`;
}

export const arrets = (n: number) => (n === 0 ? "pile devant ta porte" : `${n} arrêt${n > 1 ? "s" : ""}`);

function rangement(niveau: Niveau | undefined) {
  return niveau === "inconnu" ? "que tu ne connaissais pas" : `que tu avais mis dans le bac « ${BAC[niveau ?? "inconnu"]} »`;
}

/**
 * Bus mis en avant : les 3 plus proches, ton plus beau bus (le plus éloigné s'il y en a plusieurs)
 * et ton épave (la plus proche s'il y en a plusieurs).
 */
export function reveler(classement: readonly Classe<Candidat>[], bacs: Readonly<Record<string, Niveau>>, tirage: () => number = tirageCrypto): Revelation {
  const meilleur = classement[0]!;
  const presents = ORDRE_BEAUTE.filter(n => classement.some(c => bacs[c.candidat.id] === n));
  const haut = presents[0], bas = presents.length > 1 ? presents.at(-1) : undefined;
  const beau = haut ? classement.filter(c => bacs[c.candidat.id] === haut).at(-1) : undefined;
  const epave = bas ? classement.find(c => bacs[c.candidat.id] === bas) : undefined;
  const focus = [...new Set([...classement.slice(0, 3), beau, epave].filter((c): c is Classe<Candidat> => !!c))];

  const n = meilleur.candidat.nom, nm = meilleur.trajet.arrets;
  const intuition = !!haut && bacs[meilleur.candidat.id] === haut;
  let message: string;
  if (!beau) {
    message = `Le bus qui te rapproche le plus, c'est ${n} : ${arrets(nm)}.`;
  } else if (intuition) {
    message = `Ton intuition était la bonne : ${n}, ${rangement(haut)}, est le bus qui te rapproche le plus (${arrets(nm)}).`;
  } else {
    const nb = beau.trajet.arrets;
    const loin = nb > R0 ? " Il est même reparti dans l'autre sens, vers le terminus." : "";
    message = `Ton plus beau bus, ${beau.candidat.nom}, te laisse à ${arrets(nb)} de chez toi.${loin} Celui qui te rapproche le plus, c'est ${n} (${arrets(nm)}), ${rangement(bacs[meilleur.candidat.id])}.`;
  }
  const mot = metaphore(bacs[meilleur.candidat.id] ?? "inconnu", haut, beau, intuition, tirage);
  return { meilleur, beau, epave, focus, message, metaphore: mot, intuition };
}

/**
 * Ce que vaut vraiment un bus POUR TOI, d'après sa distance finale (seuils fixes, identiques pour tous) :
 * c'est la « peinture grattée » montrée à l'arrivée, à comparer avec le bac choisi au départ.
 */
export function niveauReel(arrets: number): Exclude<Niveau, "inconnu"> {
  if (arrets <= 2) return "adore";
  if (arrets <= 5) return "bien";
  if (arrets <= 8) return "bof";
  if (arrets <= 11) return "pas";
  return "jamais";
}

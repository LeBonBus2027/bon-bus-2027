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
  /** Ton coup de cœur qui t'éloigne : le plus beau bus, s'il s'arrête plus loin que celui qui te rapproche le plus. */
  decu?: Classe<Candidat>;
  focus: Classe<Candidat>[];
  /** « Pour rappel » (justice) : tous les bus de ton plus beau bac, plus les 3 plus proches, dans l'ordre du classement. */
  rappel: Classe<Candidat>[];
  /** Ton plus beau bac occupé (« J'adore » s'il n'est pas vide, etc.). */
  haut?: Niveau;
  /** Peinture grattée de chaque bus de la gare, d'après son rang (voir peintures). */
  peinture: Record<string, Peinture>;
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
  const rappel = classement.filter((c, i) => i < 3 || (!!haut && bacs[c.candidat.id] === haut));

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
  const decu = beau && beau.trajet.arrets > meilleur.trajet.arrets ? beau : undefined;
  return { meilleur, beau, epave, decu, focus, rappel, haut, peinture: peintures(classement), message, metaphore: mot, intuition };
}

export type Peinture = Exclude<Niveau, "inconnu">;

/**
 * Peinture grattée : ce que vaut vraiment chaque bus POUR TOI, d'après son rang parmi tes bus (pas sa distance).
 * Le plus proche devient l'autocar de luxe, le plus éloigné l'épave ; les rangs intermédiaires se répartissent
 * régulièrement sur les 5 niveaux. Des bus au même nombre d'arrêts ont la même peinture : tous de luxe s'ils sont en tête, tous épaves s'ils sont en queue, sinon celle du milieu de leur groupe. Même règle pour tous.
 */
export function peintures(classement: readonly Classe<Candidat>[]): Record<string, Peinture> {
  const n = classement.length;
  return Object.fromEntries(classement.map((c): [string, Peinture] => {
    // Ex-aequo (même nombre d'arrêts) : en tête, tous autocars de luxe ; en queue, tous épaves ; entre les deux, le rang du milieu du groupe.
    const egal = (x: Classe<Candidat>) => x.trajet.arrets === c.trajet.arrets;
    const premier = classement.findIndex(egal), dernier = classement.findLastIndex(egal);
    const rang = premier === 0 ? 0 : dernier === n - 1 ? n - 1 : (premier + dernier) / 2;
    return [c.candidat.id, n < 2 ? "adore" : ORDRE_BEAUTE[Math.round((rang * (ORDRE_BEAUTE.length - 1)) / (n - 1))] as Peinture];
  }));
}

/**
 * Animation de la peinture grattée, selon l'écart entre le bac de départ et la peinture :
 * brille (« J'adore » et vraiment le plus beau), panne (chute de 3 niveaux ou plus), cale (chute de 1 ou 2),
 * envol (montée de 2 niveaux ou plus, ou bus inconnu devenu autocar de luxe), monte (montée de 1).
 */
export type Effet = "brille" | "panne" | "cale" | "envol" | "monte";
export function effet(avant: Niveau, apres: Peinture): Effet | null {
  const a = ORDRE_BEAUTE.indexOf(apres);
  if (avant === "adore" && apres === "adore") return "brille";
  if (avant === "inconnu") return a === 0 ? "envol" : null;
  const ecart = a - ORDRE_BEAUTE.indexOf(avant);
  return ecart >= 3 ? "panne" : ecart >= 1 ? "cale" : ecart <= -2 ? "envol" : ecart === -1 ? "monte" : null;
}

/** Ce que dit l'animation, pour les lecteurs d'écran et quand les animations sont coupées. */
export const EFFET: Record<Effet, string> = { brille: "Il brille", panne: "En panne", cale: "Il cale", envol: "Belle surprise", monte: "Il monte en gamme" };

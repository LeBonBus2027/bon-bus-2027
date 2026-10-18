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
  intuition: boolean;
}

export const arrets = (n: number) => (n === 0 ? "pile devant ta porte" : `${n} arrêt${n > 1 ? "s" : ""}`);

function rangement(niveau: Niveau | undefined) {
  return niveau === "inconnu" ? "que tu ne connaissais pas" : `que tu avais mis dans le bac « ${BAC[niveau ?? "inconnu"]} »`;
}

/**
 * Bus mis en avant : les 3 plus proches, ton plus beau bus (le plus éloigné s'il y en a plusieurs)
 * et ton épave (la plus proche s'il y en a plusieurs).
 */
export function reveler(classement: readonly Classe<Candidat>[], bacs: Readonly<Record<string, Niveau>>): Revelation {
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
    message = `Le bus qui te rapproche le plus, c'est ${n} : ${arrets(nm)}.`;
  } else if (intuition) {
    message = `Ton intuition était la bonne : ${n}, ${rangement(haut)}, est le bus qui te rapproche le plus (${arrets(nm)}).`;
  } else {
    const nb = beau.trajet.arrets;
    const loin = nb > R0 ? " Il est même reparti dans l'autre sens, vers le terminus." : "";
    message = `Ton plus beau bus, ${beau.candidat.nom}, te laisse à ${arrets(nb)} de chez toi.${loin} Celui qui te rapproche le plus, c'est ${n} (${arrets(nm)}), ${rangement(bacs[meilleur.candidat.id])}.`;
  }
  return { meilleur, beau, epave, focus, message, intuition };
}

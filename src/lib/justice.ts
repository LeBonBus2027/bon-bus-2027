/**
 * « Ce que dit la justice » : décisions de justice rendues contre les candidats eux-mêmes, et contre des membres de leur parti.
 * Deux sources : data/justice.json, vérifiée à la main (prioritaire pour les candidats qu'elle couvre), et
 * data/justice-poligraph.json, importée de Poligraph (scripts/importer-poligraph.mjs). Seules les décisions vérifiées
 * sont publiées. Fichiers chargés à la demande, hors de l'accueil.
 */
export interface Decision { date: string; juridiction: string; issue: string; peine: string }
export interface Affaire {
  affaire: string;
  infraction: string;
  decisions: Decision[];
  statut: string;
  definitive: boolean | null;
  verification: "verifie" | "a_verifier";
  sources: { titre: string; url: string }[];
  note?: string;
  /** Personne visée (membres d'un parti). */
  personne?: string;
}
export interface Parti { sigle: string; nom: string; affaires: Affaire[] }
export interface Justice {
  date: string;
  candidats: Record<string, Affaire[]>;
  /** Parti de chaque candidat suivi par Poligraph. */
  partis: Record<string, Parti>;
}
interface Main { meta: { date_recherche: string }; candidats: Record<string, Affaire[]> }
interface Poligraph { meta: { date_export: string }; candidats: Record<string, Affaire[]>; partis: Record<string, { nom: string; candidats: string[]; affaires: Affaire[] }> }

let chargement: Promise<Justice> | null = null;
export const chargerJustice = () => (chargement ??= Promise.all([
  import("../../data/justice.json").then(m => m.default as unknown as Main),
  import("../../data/justice-poligraph.json").then(m => m.default as unknown as Poligraph),
]).then(([main, pg]) => ({
  date: [main.meta.date_recherche, pg.meta.date_export].sort().at(-1)!,
  candidats: { ...pg.candidats, ...main.candidats },
  partis: Object.fromEntries(Object.entries(pg.partis).flatMap(([sigle, p]) => p.candidats.map(id => [id, { sigle, nom: p.nom, affaires: p.affaires }]))),
})));

const derniere = (a: Affaire) => a.decisions.map(d => d.date).filter(Boolean).sort().at(-1) ?? "";
const publiees = (l: Affaire[]) => l.filter(a => a.verification === "verifie").sort((a, b) => derniere(b).localeCompare(derniere(a)));

/** Affaires publiables d'un candidat, la plus récente d'abord ; null s'il n'a pas encore été recherché. */
export function affairesPubliees(j: Justice, id: string): Affaire[] | null {
  const liste = j.candidats[id];
  return liste ? publiees(liste) : null;
}

/** Décisions visant des membres du parti du candidat ; null si son parti n'est pas suivi par Poligraph. */
export function partiDe(j: Justice, id: string): Parti | null {
  const p = j.partis[id];
  return p ? { ...p, affaires: publiees(p.affaires) } : null;
}

/** La procédure a abouti, au moins une fois, à une condamnation (pénale ou, en appel, au civil). */
export const condamnation = (a: Affaire) => a.decisions.some(d => /condamnation|diffamatoires/i.test(d.issue));

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
export function dateJustice(d: string): string {
  const [a, m, j] = d.split("-");
  if (!a) return "date non précisée";
  if (!m) return a;
  if (!j) return `${MOIS[Number(m) - 1]} ${a}`;
  return `${Number(j) === 1 ? "1er" : Number(j)} ${MOIS[Number(m) - 1]} ${a}`;
}

const FOND = /condamnation|relaxe|non-lieu|diffamatoires/i;
/**
 * Une ligne lisible : l'issue sur le fond (la dernière condamnation ou relaxe, pas une étape comme « pourvoi rejeté »),
 * la date de la dernière décision, puis le statut s'il apporte quelque chose. Sans le détail de la peine.
 */
export function resume(a: Affaire): string {
  const fond = [...a.decisions].reverse().find(d => FOND.test(d.issue)) ?? a.decisions.at(-1)!;
  const date = [...a.decisions].reverse().find(d => d.date)?.date ?? "";
  const quand = date ? (date.length === 10 ? `le ${dateJustice(date)}` : `en ${dateJustice(date)}`) : "";
  const issue = fond.issue.replace(/ confirmée$/, "");
  const statut = a.statut && !a.statut.toLowerCase().startsWith(issue.toLowerCase()) ? ` · ${a.statut}` : "";
  return `${a.infraction} : ${issue} ${quand}`.trim() + statut;
}

export type Issue = "condamnation" | "relaxe" | "civil";
export const ISSUE: Record<Issue, string> = { condamnation: "Condamnation", relaxe: "Relaxe", civil: "Décision civile" };
/** Les mêmes éléments que resume(), séparés pour un affichage en étiquettes. */
export function fiche(a: Affaire): { issue: Issue; infraction: string; quand: string; statut: string; definitive: boolean } {
  const fond = [...a.decisions].reverse().find(d => FOND.test(d.issue)) ?? a.decisions.at(-1)!;
  const date = [...a.decisions].reverse().find(d => d.date)?.date ?? "";
  const issue: Issue = /diffamatoires/i.test(fond.issue) ? "civil" : /relaxe|non-lieu/i.test(fond.issue) ? "relaxe" : "condamnation";
  // « relaxe en première instance » → « en première instance » ; « relaxe » seul n'apporte rien de plus que l'étiquette.
  const tete = [issue, ISSUE[issue].toLowerCase()].find(t => a.statut.toLowerCase().startsWith(t));
  const reste = tete ? a.statut.slice(tete.length).trim() : a.statut;
  return { issue, infraction: a.infraction, quand: date ? dateJustice(date) : "", statut: reste ? reste[0]!.toUpperCase() + reste.slice(1) : "", definitive: estDefinitive(a) };
}

/** Décision définitive : marquée comme telle, ou dont le statut le dit (« définitive », « relaxe définitive »…). */
export const estDefinitive = (a: Affaire) => a.definitive === true || /^(relaxe )?définitive/i.test(a.statut);

/**
 * Précision à côté d'une décision non définitive, même règle pour tous : « présomption d'innocence » pour une
 * condamnation pénale (notion pénale), « décision non définitive » pour une décision civile ; rien pour une relaxe
 * ou une décision définitive.
 */
export function precision(a: Affaire): string {
  if (estDefinitive(a) || !condamnation(a)) return "";
  return fiche(a).issue === "civil" ? "décision non définitive" : "présomption d'innocence";
}

/** « 1 décision », « 3 décisions ». */
export const nombre = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

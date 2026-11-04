/**
 * Données légères, nécessaires dès l'accueil et le classement : candidats, version des données, sélection par les sondages.
 * Les questions et les positions (plus lourdes) sont dans donnees.ts, chargé seulement à partir du questionnaire.
 * Fichiers écrits par scripts/import-monvote.mjs à partir de monvote.json (référence complète).
 */
import { candidats as bruts, meta as metaBrut } from "../../data/candidats.json";
import sondages from "../../data/selection.json";

export interface Candidat {
  id: string;
  nom: string;
  parti: string;
  url_source: string;
}

export const meta = metaBrut;
export const candidats: readonly Candidat[] = bruts;

/**
 * Candidats proposés d'office : moyenne des sondages au-dessus du seuil (data/selection.json).
 * Critère unique, affiché sur la page Méthode ; les autres restent ajoutables à la main.
 */
export const selection = sondages;

/** Explications « De quoi parle-t-on ? » : auteur et date de la dernière vérification (data/redaction.json). */
export { default as redaction } from "../../data/redaction.json";
/** Date en toutes lettres : « 4 novembre 2026 ». */
export const dateLongue = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
/**
 * Silence des sondages (loi n° 77-808 du 19 juillet 1977, article 11) : aucun sondage publié ni commenté
 * la veille et le jour de chaque tour. Par prudence, du vendredi 0 h au lundi 0 h, heure de Paris,
 * car certains territoires d'outre-mer votent le samedi. Tours retenus en Conseil des ministres le 1er juillet 2026 :
 * 18 avril et 2 mai 2027 (à revérifier avec le décret de convocation, attendu avant le 7 février 2027).
 * Le site tourne dans le navigateur : le masquage se fait à l'heure dite, sans nouvelle mise en ligne.
 */
export const SILENCE_SONDAGES = [
  { debut: "2027-04-16T00:00:00+02:00", fin: "2027-04-19T00:00:00+02:00" },
  { debut: "2027-04-30T00:00:00+02:00", fin: "2027-05-03T00:00:00+02:00" },
] as const;
export const silenceSondages = (maintenant: number = Date.now()) =>
  SILENCE_SONDAGES.some(p => maintenant >= Date.parse(p.debut) && maintenant < Date.parse(p.fin));
/** Évalué à l'ouverture de la page. Pendant le silence : aucune mention des sondages, et tous les candidats proposés. */
export const enSilence = silenceSondages();

const moyennes = sondages.moyennes as Record<string, number>;
/** Candidats proposés d'office ; pendant le silence des sondages, tous (la présélection dévoilerait qui dépasse le seuil). */
export const retenusParDefaut: readonly string[] = enSilence
  ? candidats.map(c => c.id)
  : candidats.filter(c => (moyennes[c.id] ?? 0) >= sondages.seuil).map(c => c.id);
export const moyenne = (id: string): number | null => moyennes[id] ?? null;

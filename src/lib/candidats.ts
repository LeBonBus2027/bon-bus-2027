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
const moyennes = sondages.moyennes as Record<string, number>;
export const retenusParDefaut: readonly string[] = candidats.filter(c => (moyennes[c.id] ?? 0) >= sondages.seuil).map(c => c.id);
export const moyenne = (id: string): number | null => moyennes[id] ?? null;

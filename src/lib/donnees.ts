/**
 * Questions et positions des candidats (MonVote2027) : la partie lourde des données,
 * importée seulement par les écrans chargés à partir du questionnaire.
 */
import { positions as positionsBrutes, questions as questionsBrutes } from "../../data/questions.json";
import type { Position } from "./calcul";

// Ce qui est léger (candidats, sélection) vit dans candidats.ts ; on le réexporte pour garder un seul point d'entrée.
export { candidats, dateLongue, enSilence, meta, moyenne, redaction, retenusParDefaut, selection, type Candidat } from "./candidats";

export interface Question {
  id: string;
  numero: number;
  texte: string;
  aide: string | null;
  themes: string[];
  quiz_rapide: boolean;
}

export const questions: readonly Question[] = questionsBrutes;
export const positions = positionsBrutes as Readonly<Record<string, Readonly<Record<string, Position>>>>;

/** Les 10 grands thèmes affichés par monvote2027 ; une question est rangée selon sa première étiquette. */
const GRANDS_THEMES: Record<string, string> = {
  immigration: "Immigration & laïcité", laicite: "Immigration & laïcité",
  securite: "Sécurité & justice", justice: "Sécurité & justice",
  economie: "Économie & fiscalité", fiscal: "Économie & fiscalité", consommation: "Économie & fiscalité",
  social: "Social & logement", logement: "Social & logement", outremer: "Social & logement",
  travail: "Travail & jeunesse", jeunesse: "Travail & jeunesse",
  environnement: "Environnement & énergie", energie: "Environnement & énergie",
  transport: "Environnement & énergie", agriculture: "Environnement & énergie",
  europe: "Europe & défense", defense: "Europe & défense", international: "Europe & défense", diplomatie: "Europe & défense",
  democratie: "Démocratie & numérique", institutions: "Démocratie & numérique",
  numerique: "Démocratie & numérique", medias: "Démocratie & numérique",
  education: "Éducation, culture & société", culture: "Éducation, culture & société", societe: "Éducation, culture & société",
  sante: "Santé",
};

export function grandTheme(q: Question): string {
  return GRANDS_THEMES[q.themes[0] ?? ""] ?? "Autres sujets";
}

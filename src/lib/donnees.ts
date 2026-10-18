import brut from "../../data/monvote.json";
import type { Position } from "./calcul";

export interface Candidat {
  id: string;
  nom: string;
  parti: string;
  url_source: string;
}

export interface Question {
  id: string;
  numero: number;
  texte: string;
  aide: string | null;
  themes: string[];
  quiz_rapide: boolean;
}

export const meta = brut.meta;
export const candidats: readonly Candidat[] = brut.candidats;
export const questions: readonly Question[] = brut.questions;
export const positions = brut.positions as Readonly<Record<string, Readonly<Record<string, Position>>>>;

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

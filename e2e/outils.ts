import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

/**
 * Nombres tirés des données, pour que les tests suivent les changements de la liste des candidats (retraits, ajouts)
 * et de la moyenne des sondages (candidats qui franchissent le seuil), au lieu de les figer.
 */
const lire = (f: string) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const { candidats: LISTE } = lire("candidats.json") as { candidats: { id: string }[] };
const SONDAGES = lire("selection.json") as { seuil: number; moyennes: Record<string, number> };
export const NB_CANDIDATS = LISTE.length;
export const NB_RETENUS = LISTE.filter(c => (SONDAGES.moyennes[c.id] ?? 0) >= SONDAGES.seuil).length;
export const NB_AUTRES = NB_CANDIDATS - NB_RETENUS;


/** Surveille la page : erreurs JS, violations de la politique de sécurité, requêtes vers un autre site. */
export function surveiller(page: Page) {
  const problemes: string[] = [];
  page.on("pageerror", e => problemes.push(`Erreur JS : ${e.message}`));
  page.on("console", m => { if (m.type() === "error") problemes.push(`Console : ${m.text()}`); });
  page.on("request", r => {
    const url = new URL(r.url());
    if (!["127.0.0.1", "localhost"].includes(url.hostname) && !url.protocol.startsWith("data") && !url.protocol.startsWith("blob")) {
      problemes.push(`Requête vers un tiers : ${r.url()}`);
    }
  });
  return problemes;
}

/** Audit d'accessibilité WCAG 2.2 niveau AA sur l'écran courant. */
export async function auditAccessibilite(page: Page, ecran: string) {
  // Attendre la fin des animations courtes (fondus d'apparition) : en plein fondu, un texte semi-transparent fausse le calcul du contraste.
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter(a => Number.isFinite(a.effect?.getComputedTiming().endTime ?? Infinity))
    .map(a => a.finished.catch(() => undefined))));
  const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(res.violations.map(v => `${ecran} : ${v.id} (${v.nodes.length}) ${v.help}`)).toEqual([]);
}

/** Range tous les candidats en tournant sur les bacs, pour un parcours reproductible. */
export async function classerTout(page: Page) {
  const bacs = ["J'adore", "Plutôt bien", "Bof", "Plutôt pas", "Jamais", "Je ne le connais pas"];
  const groupe = page.getByRole("group", { name: /Ton ressenti/ });
  for (let i = 0; await groupe.isVisible(); i++) {
    await groupe.getByRole("button", { name: bacs[i % bacs.length] }).click();
  }
  await expect(page.getByRole("heading", { name: "Ta gare routière" })).toBeVisible();
}

/** Répond à toutes les questions affichées en tournant sur les réponses. */
export async function repondreTout(page: Page, nb: number) {
  const reponses = ["Tout à fait d'accord", "Plutôt d'accord", "Neutre", "Plutôt pas d'accord", "Pas du tout d'accord"];
  for (let i = 0; i < nb; i++) {
    await page.getByRole("group", { name: "Ta réponse" }).getByRole("button", { name: reponses[(i * 3) % 5], exact: true }).click();
  }
}

/** Saute le diaporama de fin pour arriver directement sur la page récap. */
export async function allerAuRecap(page: Page) {
  await page.getByRole("button", { name: "Passer au récap" }).click();
  await expect(page.getByRole("heading", { name: "Ton récap" })).toBeVisible();
}

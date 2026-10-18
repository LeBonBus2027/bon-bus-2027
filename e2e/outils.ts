import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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
  const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(res.violations.map(v => `${ecran} : ${v.id} (${v.nodes.length}) ${v.help}`)).toEqual([]);
}

/** Range tous les candidats en tournant sur les bacs, pour un parcours reproductible. */
export async function classerTout(page: Page) {
  const bacs = ["J'adore", "Plutôt bien", "Bof", "Plutôt pas", "Jamais", "Je ne le connais pas"];
  for (let i = 0; i < 21; i++) {
    await page.getByRole("group", { name: /Ton ressenti/ }).getByRole("button", { name: bacs[i % bacs.length] }).click();
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

import { expect, test } from "@playwright/test";
import { auditAccessibilite, classerTout, repondreTout, surveiller } from "./outils";

test.describe("parcours complet", () => {
  test("version rapide, de l'accueil au message final", async ({ page }) => {
    const problemes = surveiller(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Quel bus te ramène chez toi ?" })).toBeVisible();
    await auditAccessibilite(page, "accueil");
    await page.getByRole("button", { name: "C'est parti" }).click();

    await expect(page.getByText("Candidat 1 sur 21")).toBeVisible();
    await auditAccessibilite(page, "classement");
    await classerTout(page);
    await auditAccessibilite(page, "gare routière");
    await page.getByRole("button", { name: /place aux questions/ }).click();

    await page.getByRole("button", { name: /Version rapide/ }).click();
    await expect(page.getByText(/Question 1 sur 20/)).toBeVisible();
    await auditAccessibilite(page, "question");
    await repondreTout(page, 20);
    await expect(page.getByText("20 réponses sur 20")).toBeVisible();
    await page.getByRole("button", { name: "Faire partir les bus" }).click();

    await expect(page.getByRole("heading", { name: "Terminus !" })).toBeVisible();
    await expect(page.locator(".message")).not.toBeEmpty();
    await expect(page.getByText("Aucun bus ne te dépose pile devant chez toi.")).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(21);
    await expect(page.getByRole("link", { name: "Vérifier mon inscription" })).toHaveAttribute("href", /service-public\.fr/);
    await auditAccessibilite(page, "résultats");

    // L'adresse ne contient jamais de réponse ni de résultat.
    expect(new URL(page.url()).search).toBe("");
    expect(problemes).toEqual([]);
  });

  test("recommencer efface tout", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("button", { name: "C'est parti" }).click();
    await classerTout(page);
    await page.getByRole("button", { name: /place aux questions/ }).click();
    await page.getByRole("button", { name: /Version rapide/ }).click();
    await repondreTout(page, 20);
    await page.getByRole("button", { name: "Faire partir les bus" }).click();
    await page.getByRole("button", { name: "Recommencer" }).click();
    await expect(page.getByRole("heading", { name: "Quel bus te ramène chez toi ?" })).toBeVisible();
    await page.getByRole("button", { name: "C'est parti" }).click();
    await expect(page.getByText("Candidat 1 sur 21")).toBeVisible();
  });
});

test("un candidat se modifie depuis la gare routière", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "C'est parti" }).click();
  await classerTout(page);
  const premier = page.locator(".gare button").first();
  const nom = (await premier.locator("span").first().textContent())!;
  await premier.click();
  await expect(page.getByRole("heading", { name: nom })).toBeVisible();
  await page.getByRole("button", { name: "Jamais" }).click();
  await expect(page.getByRole("heading", { name: "Ta gare routière" })).toBeVisible();
  await expect(page.getByRole("button", { name: new RegExp(`^${nom}\\s*, bac Jamais : modifier$`) })).toBeVisible();
});

test("il faut au moins 10 réponses", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "C'est parti" }).click();
  await classerTout(page);
  await page.getByRole("button", { name: /place aux questions/ }).click();
  await page.getByRole("button", { name: /Version rapide/ }).click();
  for (let i = 0; i < 20; i++) await page.getByRole("button", { name: "Passer" }).click();
  await expect(page.getByText(/Il en faut au moins 10/)).toBeVisible();
  await page.getByRole("button", { name: "Revoir les questions passées" }).click();
  await expect(page.getByText(/Question 1 sur 20/)).toBeVisible();
});

test("le classement se fait entièrement au clavier", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "C'est parti" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Candidat 1 sur 21")).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Candidat 2 sur 21")).toBeVisible();
});

test("les pages annexes s'ouvrent et rendent la main au parcours", async ({ page }) => {
  const problemes = surveiller(page);
  await page.goto("/");
  await page.getByRole("button", { name: "C'est parti" }).click();
  await page.getByRole("button", { name: "Bof" }).click();
  for (const [lien, titre] of [["Comment ça marche", "Comment ça marche"], ["Confidentialité", "Confidentialité"], ["Mentions légales", "Mentions légales"], ["À propos", "À propos"]]) {
    await page.getByRole("link", { name: lien, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: titre })).toBeVisible();
    await auditAccessibilite(page, titre);
    await page.getByRole("link", { name: "← Revenir au site" }).click();
    await expect(page.getByText("Candidat 2 sur 21")).toBeVisible();
  }
  expect(problemes).toEqual([]);
});

test("les en-têtes de sécurité sont servis", async ({ request }) => {
  const r = await request.get("/");
  const h = r.headers();
  expect(h["content-security-policy"]).toContain("default-src 'none'");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["content-security-policy"]).toContain("require-trusted-types-for 'script'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("no-referrer");
  expect(h["cross-origin-opener-policy"]).toBe("same-origin");
});

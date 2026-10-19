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

    await expect(page.getByText("Candidat 1 sur 7")).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "On a gratté la peinture" })).toBeVisible();
    await expect(page.locator(".message")).not.toBeEmpty();
    await expect(page.getByText("Aucun bus ne te dépose pile devant chez toi.")).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(7);
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
    await expect(page.getByText("Candidat 1 sur 7")).toBeVisible();
  });
});

test("un candidat se modifie depuis la gare routière", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "C'est parti" }).click();
  await classerTout(page);
  const premier = page.locator(".gare button").first();
  const nom = (await premier.locator("span:not(.photo):not(.visually-hidden)").first().textContent())!;
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
  await expect(page.getByText("Candidat 1 sur 7")).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Candidat 2 sur 7")).toBeVisible();
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
    await expect(page.getByText("Candidat 2 sur 7")).toBeVisible();
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

test("on peut ajouter un candidat non retenu au départ", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "C'est parti" }).click();
  await classerTout(page);
  await page.getByText(/Ajouter un candidat \(14 autres\)/).click();
  const bouton = page.locator(".ajout button").first();
  const nom = ((await bouton.textContent()) ?? "").replace("+", "").split("·")[0]!.trim();
  await bouton.click();
  await expect(page.getByRole("heading", { name: nom })).toBeVisible();
  await expect(page.getByText("Candidat 8 sur 8")).toBeVisible();
  await page.getByRole("button", { name: "Bof" }).click();
  await expect(page.getByText(/Ajouter un candidat \(13 autres\)/)).toBeVisible();
});

test("chaque bus explique sa position, depuis le tableau ou la carte", async ({ page }) => {
  const problemes = surveiller(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "C'est parti" }).click();
  await classerTout(page);
  await page.getByRole("button", { name: /place aux questions/ }).click();
  await page.getByRole("button", { name: /Version rapide/ }).click();
  await repondreTout(page, 20);
  await page.getByRole("button", { name: "Faire partir les bus" }).click();
  await expect(page.getByRole("heading", { name: "Terminus !" })).toBeVisible();

  // Depuis le tableau.
  await page.getByRole("button", { name: /^Pourquoi \?/ }).first().click();
  await expect(page.getByRole("heading", { name: /^Pourquoi .+ s'arrête/ })).toBeVisible();
  await expect(page.getByText(/Sur tes 20 réponses/)).toBeVisible();
  await auditAccessibilite(page, "explication");
  await page.getByRole("button", { name: "Fermer l'explication" }).click();
  await expect(page.getByRole("heading", { name: /^Pourquoi .+ s'arrête/ })).toHaveCount(0);

  // Depuis la carte : toucher une étiquette.
  await page.locator(".etiquette").first().click();
  await expect(page.getByRole("heading", { name: /^Pourquoi .+ s'arrête/ })).toBeVisible();

  // Zoom et recentrage ne cassent rien.
  await page.getByRole("button", { name: "Zoomer", exact: true }).click();
  await page.getByRole("button", { name: "Recentrer sur chez toi" }).click();
  expect(problemes).toEqual([]);
});

test("le mode sombre reste lisible (contrastes WCAG AA)", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(14, 23, 38)");
  await auditAccessibilite(page, "accueil sombre");
  await page.getByRole("button", { name: "C'est parti" }).click();
  await auditAccessibilite(page, "classement sombre");
  await classerTout(page);
  await auditAccessibilite(page, "gare sombre");
  await page.getByRole("button", { name: /place aux questions/ }).click();
  await page.getByRole("button", { name: /Version rapide/ }).click();
  await auditAccessibilite(page, "question sombre");
  await repondreTout(page, 20);
  await page.getByRole("button", { name: "Faire partir les bus" }).click();
  await expect(page.getByRole("heading", { name: "Terminus !" })).toBeVisible();
  await auditAccessibilite(page, "résultats sombres");
});

test("le ticket de bus à partager s'affiche en aperçu, avec ou sans noms", async ({ page }) => {
  const problemes = surveiller(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "C'est parti" }).click();
  await classerTout(page);
  await page.getByRole("button", { name: /place aux questions/ }).click();
  await page.getByRole("button", { name: /Version rapide/ }).click();
  await repondreTout(page, 20);
  await page.getByRole("button", { name: "Faire partir les bus" }).click();
  const apercu = page.getByRole("img", { name: /Aperçu de ton ticket/ });
  await expect(apercu).toBeVisible();
  const taille = await apercu.evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]);
  expect(taille).toEqual([1080, 1350]);
  const avant = await apercu.getAttribute("src");
  await page.getByLabel("Afficher les noms des candidats").check();
  await expect(apercu).not.toHaveAttribute("src", avant!);
  expect(problemes).toEqual([]);
});

test("mode duo : deux trajets sur le même téléphone, puis « Ensemble »", async ({ page }) => {
  const problemes = surveiller(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "À deux" }).click();
  await page.getByLabel("Premier prénom").fill("Léa");
  await page.getByLabel("Second prénom").fill("Papa");
  await page.getByRole("button", { name: "Commencer à deux" }).click();

  await expect(page.getByText("Au tour de Léa")).toBeVisible();
  await classerTout(page);
  await page.getByRole("button", { name: /place aux questions/ }).click();
  await page.getByRole("button", { name: /Version rapide/ }).click();
  await repondreTout(page, 20);
  await page.getByRole("button", { name: "Faire partir les bus" }).click();

  await expect(page.getByRole("heading", { name: "Passe le téléphone à Papa" })).toBeVisible();
  await auditAccessibilite(page, "relais");
  await page.getByRole("button", { name: "C'est moi, j'y vais" }).click();
  await expect(page.getByText("Au tour de Papa")).toBeVisible();
  await expect(page.getByText("Candidat 1 sur 7")).toBeVisible();   // le classement de Léa n'est pas montré
  await classerTout(page);
  await page.getByRole("button", { name: /place aux questions/ }).click();
  // Même format que Léa : directement aux questions.
  const reponses = ["Pas du tout d'accord", "Plutôt pas d'accord", "Neutre"];
  for (let i = 0; i < 20; i++) await page.getByRole("group", { name: "Ta réponse" }).getByRole("button", { name: reponses[i % 3], exact: true }).click();
  await page.getByRole("button", { name: "Faire partir les bus" }).click();

  await expect(page.getByRole("heading", { name: "Léa et Papa" })).toBeVisible();
  await expect(page.getByText("Entre vos deux maisons")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Le bus qui vous rapproche tous les deux" })).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(7);
  await auditAccessibilite(page, "ensemble");

  await page.getByRole("tab", { name: "Trajet de Papa" }).click();
  await expect(page.getByRole("heading", { name: "Terminus !" })).toBeVisible();
  await page.getByRole("tab", { name: "Ensemble" }).click();
  await page.getByRole("button", { name: "Recommencer" }).click();
  await expect(page.getByRole("heading", { name: "Quel bus te ramène chez toi ?" })).toBeVisible();
  expect(problemes).toEqual([]);
});

test("le rétroviseur rejoue le trajet étape par étape", async ({ page }) => {
  const problemes = surveiller(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "C'est parti" }).click();
  await classerTout(page);
  await page.getByRole("button", { name: /place aux questions/ }).click();
  await page.getByRole("button", { name: /Version rapide/ }).click();
  await repondreTout(page, 20);
  await page.getByRole("button", { name: "Faire partir les bus" }).click();
  const curseur = page.getByLabel("Rétroviseur : rejoue le trajet");
  await expect(curseur).toHaveValue("20");
  await curseur.fill("0");
  await expect(page.getByText("Départ : tous les bus attendent à la gare.")).toBeVisible();
  await expect(page.locator(".etiquette")).toHaveCount(0);           // pas d'étiquettes pendant le rejeu
  await page.getByRole("button", { name: "Étape suivante" }).click();
  await expect(page.getByText(/^Étape 1 sur 20/)).toBeVisible();
  await expect(page.getByText(/Ta réponse/)).toBeVisible();
  await curseur.fill("20");
  await expect(page.locator(".etiquette").first()).toBeVisible();     // retour à l'arrivée
  await auditAccessibilite(page, "rétroviseur");
  expect(problemes).toEqual([]);
});

test("« Ce qui compte pour toi » : jusqu'à 3 thèmes qui comptent double", async ({ page }) => {
  const problemes = surveiller(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "C'est parti" }).click();
  await classerTout(page);
  await page.getByRole("button", { name: /place aux questions/ }).click();
  await page.getByRole("button", { name: /Version rapide/ }).click();
  await repondreTout(page, 20);
  await page.getByRole("button", { name: "Faire partir les bus" }).click();
  const groupe = page.getByRole("group", { name: "Ce qui compte pour toi" });
  const themes = groupe.getByRole("button");
  await expect(themes.first()).toBeVisible();
  expect(await themes.count()).toBeGreaterThan(3);
  for (let i = 0; i < 3; i++) await themes.nth(i).click();
  for (let i = 0; i < 3; i++) await expect(themes.nth(i)).toHaveAttribute("aria-pressed", "true");
  await expect(themes.nth(3)).toBeDisabled();
  await expect(page.getByText(/Ces sujets comptent double/)).toBeVisible();
  await auditAccessibilite(page, "priorités");
  await page.getByRole("button", { name: "Tout remettre à égalité" }).click();
  await expect(groupe.locator("[aria-pressed=true]")).toHaveCount(0);
  expect(problemes).toEqual([]);
});

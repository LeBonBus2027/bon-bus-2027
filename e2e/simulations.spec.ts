import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * Simulations de bout en bout : des parcours tirés au hasard (graine fixe), et pour chacun on vérifie que tout ce qui
 * s'affiche se tient : classement, peinture grattée (d'après le rang), animations, « Pour rappel », tickets de la morale.
 * Gare au hasard (les candidats proposés d'office, plus 0 à 14 candidats ajoutés), version rapide ou complète, quelques
 * questions passées. Chaque réponse est notée, et les distances des 21 candidats sont recalculées ici, indépendamment du
 * site, avec la règle publiée : d = 10 × (1 − Σpas ÷ 2n). Le calcul seul est aussi vérifié sur des milliers de parcours
 * dans src/lib/simulation.test.ts.
 */

const lire = (f: string) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const DONNEES = lire("questions.json") as { questions: { id: string; texte: string }[]; positions: Record<string, Record<string, number | null>> };
const brut = lire("candidats.json");
const CANDIDATS = (brut.candidats ?? brut) as { id: string; nom: string }[];

const BACS = ["J'adore", "Plutôt bien", "Bof", "Plutôt pas", "Jamais", "Je ne le connais pas"] as const;
const CLE: Record<string, string> = { "J'adore": "adore", "Plutôt bien": "bien", "Bof": "bof", "Plutôt pas": "pas", "Jamais": "jamais", "Je ne le connais pas": "inconnu" };
const BUS: Record<string, string> = { adore: "Autocar de luxe", bien: "Bus neuf", bof: "Bus correct", pas: "Bus cabossé", jamais: "Épave", inconnu: "Bus gris" };
const BEAUTE = ["adore", "bien", "bof", "pas", "jamais"];
const EFFET: Record<string, string> = { brille: "Il brille", panne: "En panne", cale: "Il cale", envol: "Belle surprise", monte: "Il monte en gamme" };
const VALEUR: Record<string, number> = { "Tout à fait d'accord": 2, "Plutôt d'accord": 1, "Neutre": 0, "Plutôt pas d'accord": -1, "Pas du tout d'accord": -2 };
const REPONSES = Object.keys(VALEUR);
const ns = (s: string) => s.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();

function graine(n: number) {
  return () => {
    n = (n + 0x6d2b79f5) | 0;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Règles attendues, réécrites ici à partir de « Comment ça marche ». */
const pas = (u: number, p: number | null) =>
  p === null || u === 0 || p === 0 ? 0 : Math.sign(u) === Math.sign(p) ? (u === p ? 2 : 1) : Math.abs(u) === 2 && Math.abs(p) === 2 ? -2 : -1;
/** Les 10 grands thèmes de MonVote2027 : une question est rangée selon sa première étiquette (recopié, pour rester indépendant). */
const GRANDS_THEMES: Record<string, string> = {
  immigration: "Immigration & laïcité", laicite: "Immigration & laïcité", securite: "Sécurité & justice", justice: "Sécurité & justice",
  economie: "Économie & fiscalité", fiscal: "Économie & fiscalité", consommation: "Économie & fiscalité",
  social: "Social & logement", logement: "Social & logement", outremer: "Social & logement", travail: "Travail & jeunesse", jeunesse: "Travail & jeunesse",
  environnement: "Environnement & énergie", energie: "Environnement & énergie", transport: "Environnement & énergie", agriculture: "Environnement & énergie",
  europe: "Europe & défense", defense: "Europe & défense", international: "Europe & défense", diplomatie: "Europe & défense",
  democratie: "Démocratie & numérique", institutions: "Démocratie & numérique", numerique: "Démocratie & numérique", medias: "Démocratie & numérique",
  education: "Éducation, culture & société", culture: "Éducation, culture & société", societe: "Éducation, culture & société", sante: "Santé",
};
const THEME = new Map((DONNEES.questions as { id: string; themes: string[] }[]).map(q => [q.id, GRANDS_THEMES[q.themes[0] ?? ""] ?? "Autres sujets"]));

/**
 * Distances selon « Comment ça marche » : d = 10 × (1 − s), s = Σpas ÷ 2n. Avec des thèmes qui comptent double,
 * poussée b = Σ(pas × (poids − 1)) ÷ 2(n + Σ(poids − 1)), qui rapproche s de 1 si elle est positive, de −1 sinon.
 */
function distances(reponses: Map<string, number>, prioritaires: readonly string[] = []) {
  return Object.fromEntries(CANDIDATS.map(c => {
    const pos = DONNEES.positions[c.id] ?? {};
    let somme = 0, couvertes = 0, bonus = 0, nBonus = 0;
    for (const [q, u] of reponses) {
      const p = pos[q] ?? null, k = pas(u, p), extra = prioritaires.includes(THEME.get(q)!) ? 1 : 0;
      if (p !== null) couvertes++;
      somme += k; bonus += k * extra; nBonus += extra;
    }
    const n = reponses.size, s = somme / (2 * n), b = nBonus ? bonus / (2 * (n + nBonus)) : 0;
    const s2 = b >= 0 ? s + b * (1 - s) : s + b * (1 + s);
    return [ns(c.nom), { d: 10 * (1 - s2), couverture: couvertes / n }];
  }));
}
function peinturesAttendues(arrets: number[]): string[] {
  const n = arrets.length;
  return arrets.map(a => {
    const premier = arrets.indexOf(a), dernier = arrets.lastIndexOf(a);
    const rang = premier === 0 ? 0 : dernier === n - 1 ? n - 1 : (premier + dernier) / 2;
    return n < 2 ? "adore" : BEAUTE[Math.round((rang * 4) / (n - 1))]!;
  });
}
function effetAttendu(avant: string, apres: string): string | null {
  const a = BEAUTE.indexOf(apres);
  if (avant === "adore" && apres === "adore") return "brille";
  if (avant === "inconnu") return a === 0 ? "envol" : null;
  const e = a - BEAUTE.indexOf(avant);
  return e >= 3 ? "panne" : e >= 1 ? "cale" : e <= -2 ? "envol" : e === -1 ? "monte" : null;
}

const NB = 24;
for (let s = 1; s <= NB; s++) {
  test(`simulation ${s}`, async ({ page }, info) => {
    test.skip(info.project.name !== "chromium", "simulations sur un seul navigateur");
    test.setTimeout(120_000);
    const alea = graine(s * 7919);
    const un = <T,>(l: readonly T[]) => l[Math.floor(alea() * l.length)]!;
    const textes = async (sel: string) => (await page.locator(sel).allInnerTexts()).map(ns);
    // Profils variés : au hasard, beaucoup de « J'adore », tout en « J'adore » ; une fois sur deux la version complète.
    const profil = s % 3;
    const complete = s % 2 === 0;
    const choisirBac = () => (profil === 2 ? "J'adore" : profil === 1 && alea() < 0.5 ? "J'adore" : un(BACS));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("button", { name: "C'est parti" }).click();

    const bacs: Record<string, string> = {};
    const groupe = page.getByRole("group", { name: /Ton ressenti sur/ });
    const classerCeuxAffiches = async () => {
      while (await groupe.isVisible()) {
        const nom = ns((await groupe.getAttribute("aria-label"))!.replace(/^Ton ressenti sur /, ""));
        const bac = choisirBac();
        bacs[nom] = CLE[bac]!;
        await groupe.getByRole("button", { name: bac, exact: true }).click();
      }
    };
    await classerCeuxAffiches();
    // De 0 à 14 candidats ajoutés depuis « Ajouter des candidats », cochés en une ou deux fois.
    const ajouts = s % 4 === 1 ? 0 : s % 4 === 0 ? 14 : 1 + Math.floor(alea() * 13);
    for (const lot of ajouts > 1 && alea() < 0.5 ? [Math.ceil(ajouts / 2), Math.floor(ajouts / 2)] : [ajouts]) {
      if (!lot) continue;
      await page.getByText(/^Ajouter des candidats/).click();
      const cases = [...(await page.locator(".ajout input[type=checkbox]").all())].sort(() => alea() - 0.5).slice(0, lot);
      for (const c of cases) await c.check();
      await page.locator(".ajouter .principal").click();
      await classerCeuxAffiches();
    }
    await expect(page.getByRole("heading", { name: "Ta gare routière" })).toBeVisible();
    await page.getByRole("button", { name: /place aux questions/ }).click();
    await page.getByRole("button", { name: complete ? /Version complète/ : /Version rapide/ }).click();

    // Les réponses, notées question par question (texte → identifiant MonVote2027) ; environ 1 sur 10 passée.
    const parTexte = new Map(DONNEES.questions.map(q => [ns(q.texte), q.id]));
    const total = complete ? 100 : 20;
    const reponses = new Map<string, number>();
    for (let i = 0; i < total; i++) {
      const id = parTexte.get(ns(await page.locator("h1.question").innerText()));
      expect(id, "question introuvable dans les données").toBeTruthy();
      if (alea() < 0.1 && total - i - 1 + reponses.size >= 10) { await page.getByRole("button", { name: "Passer", exact: true }).click(); continue; }
      const r = un(REPONSES);
      reponses.set(id!, VALEUR[r]!);
      await page.getByRole("button", { name: r, exact: true }).click();
    }
    await expect(page.getByText(`${reponses.size} réponses sur ${total}`)).toBeVisible();
    await page.getByRole("button", { name: "Faire partir les bus" }).click();

    // Diaporama, étape par étape.
    await page.getByRole("button", { name: "Gratter la peinture" }).click();
    await expect(page.getByRole("heading", { name: "On a gratté la peinture" })).toBeFocused();
    const noms2 = await textes(".diapo .carte-bus .qui strong");
    const resumes2 = await textes(".diapo .carte-bus > .visually-hidden");
    const classes2 = await page.locator(".diapo .avant-apres li").evaluateAll(l => l.map(x => (x.classList.contains("ecart") ? 0 : x.classList.contains("reussite") ? 1 : 2)));
    await page.getByRole("button", { name: "Suivant", exact: true }).click();
    await expect(page.locator(".diapo").getByText("Chargement…")).toHaveCount(0);
    const fiches = await textes(".diapo .fiche .qui strong");
    const chapeaux = await page.locator(".diapo .fiche").evaluateAll(l => l.map(f => !!f.querySelector(".chapeau")));
    const aucune = await textes(".diapo .aucune li");
    await page.getByRole("button", { name: "Suivant", exact: true }).click();
    const tickets = await page.locator(".diapo .bilan .ticket").evaluateAll(l => l.map(t => ({
      titre: t.querySelector(".titre")!.textContent!, nom: t.querySelector(".qui strong")!.textContent!,
    })));
    await page.getByRole("button", { name: "Suivant", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Partage ton trajet" })).toBeFocused();
    await page.getByRole("button", { name: "Voir mon récap" }).click();
    await expect(page.getByRole("heading", { name: "Ton récap" })).toBeVisible();


    // Le récap : la référence.
    const lireTableau = async () => {
      const lignes = await page.locator(".tes-bus > li").evaluateAll(lis => lis.map(li => ({
        nom: li.querySelector(".nom")!.textContent!, bus: li.querySelector(".bus-apres")!.textContent!,
        arrets: li.querySelector(".distance")!.firstChild!.textContent!, incomplet: li.textContent!.includes("position incomplète"),
      })));
      const tab = lignes.map(l => ({ ...l, nom: ns(l.nom), bus: ns(l.bus), a: /pile/.test(l.arrets) ? 0 : Number(l.arrets.match(/\d+/)![0]) }));
      return tab;
    };
    const tab = await lireTableau();
    const ctx = JSON.stringify({ s, complete, bacs, tab: tab.map(t => [t.nom, t.a, t.bus]) });

    // 0. Le tableau contient exactement ta gare, aux distances recalculées ici ; « position incomplète » sous 60 % de couverture.
    expect(tab.map(t => t.nom).sort(), ctx).toEqual(Object.keys(bacs).sort());
    const calc = distances(reponses);
    for (const t of tab) {
      expect(t.a, `${ctx} · ${t.nom} : ${calc[t.nom]!.d}`).toBe(Math.round(calc[t.nom]!.d));
      expect(t.incomplet, `${ctx} · ${t.nom}`).toBe(calc[t.nom]!.couverture < 0.6);
    }
    // Le bus le plus proche hors de ta gare est signalé s'il s'arrête strictement plus près que ton meilleur bus.
    const dehors = Object.entries(calc).filter(([nom]) => !(nom in bacs)).sort((a, b) => a[1].d - b[1].d);
    const signal = page.getByText(/que tu n'avais pas ajouté à ta gare/);
    const dMeilleur = Math.min(...tab.map(t => calc[t.nom]!.d));
    if (dehors.length && dehors[0]![1].d < dMeilleur - 1e-9) {
      const texte = ns(await signal.innerText());
      const nom = texte.match(/Le bus de (.+?), que tu/)![1]!;
      expect(calc[nom]!.d, `${ctx} · ${texte}`).toBeCloseTo(dehors[0]![1].d, 9);
    } else expect(await signal.count(), ctx).toBe(0);

    // 1. Classement du plus proche au plus loin ; peinture selon le rang.
    for (let k = 1; k < tab.length; k++) expect(tab[k]!.a, ctx).toBeGreaterThanOrEqual(tab[k - 1]!.a);
    const peint = peinturesAttendues(tab.map(t => t.a));
    tab.forEach((t, k) => expect(t.bus, ctx).toBe(BUS[peint[k]!]));
    const peinture = Object.fromEntries(tab.map((t, k) => [t.nom, peint[k]!]));

    // 2. « On a gratté la peinture » : tous tes bus ; grands écarts d'abord (cartes larges), puis réussites (« = »), puis le reste.
    expect([...noms2].sort(), ctx).toEqual(Object.keys(bacs).sort());
    const famille = (nom: string) => { const e = effetAttendu(bacs[nom]!, peinture[nom]!); return e === "panne" ? 0 : e === "brille" ? 1 : 2; };
    for (let k = 1; k < noms2.length; k++) expect(famille(noms2[k]!), ctx).toBeGreaterThanOrEqual(famille(noms2[k - 1]!));
    expect(classes2, ctx).toEqual(noms2.map(famille));
    noms2.forEach((nom, k) => {
      const r = resumes2[k]!;
      expect(nom in bacs, ctx).toBe(true);
      expect(r, ctx).toContain(`Tu voyais : ${BUS[bacs[nom]!]}.`);
      expect(r, ctx).toContain(`Pour toi : ${BUS[peinture[nom]!]}, `);
      const e = effetAttendu(bacs[nom]!, peinture[nom]!);
      if (e) expect(r, ctx).toContain(EFFET[e]); else for (const x of Object.values(EFFET)) expect(r, ctx).not.toContain(x);
    });

    // 3. « Pour rappel » : ton plus beau bac et les 3 plus proches ; le coup de cœur qui t'éloigne en tête, avec son chapeau.
    const haut = BEAUTE.find(n => tab.some(t => bacs[t.nom] === n));
    const attendus = tab.filter((t, k) => k < 3 || bacs[t.nom] === haut).map(t => t.nom);
    expect([...fiches, ...aucune].sort(), ctx).toEqual([...attendus].sort());
    const beau = haut ? tab.filter(t => bacs[t.nom] === haut).at(-1) : undefined;
    const decu = beau && beau.a > tab[0]!.a ? beau.nom : undefined;
    if (decu && fiches.includes(decu)) expect(fiches[0], ctx).toBe(decu);
    fiches.forEach((nom, k) => expect(chapeaux[k], ctx).toBe(nom === decu));
    const ordre = (l: string[]) => l.filter(n => n !== decu).map(n => tab.findIndex(t => t.nom === n));
    expect(ordre(fiches), ctx).toEqual([...ordre(fiches)].sort((a, b) => a - b));
    expect(ordre(aucune), ctx).toEqual([...ordre(aucune)].sort((a, b) => a - b));

    // 4. Tickets de la morale : le coup de cœur qui t'éloigne (s'il y en a un), puis celui qui te rapproche le plus.
    const intuition = !!haut && bacs[tab[0]!.nom] === haut;
    const meilleur = { titre: intuition ? "Ton intuition" : decu ? "La surprise" : "Ton bus", nom: tab[0]!.nom };
    const attenduTickets = decu ? [{ titre: "Ton coup de cœur", nom: decu }, meilleur] : [meilleur];
    expect(tickets.map(t => ({ titre: ns(t.titre), nom: ns(t.nom) })), ctx).toEqual(attenduTickets);
    // Une fois sur trois : 1 à 3 thèmes qui comptent double (« Ce qui compte pour toi »), choisis au hasard.
    const prioritaires: string[] = [];
    if (s % 3 === 0) {
      await page.getByText("Certains sujets comptent plus pour toi ?").click();
      const boutons = [...(await page.locator(".priorites .themes button").all())].sort(() => alea() - 0.5).slice(0, 1 + Math.floor(alea() * 3));
      for (const b of boutons) { prioritaires.push(ns(await b.innerText())); await b.click(); }
      await expect(page.locator(".priorites .themes button[aria-pressed=true]")).toHaveCount(prioritaires.length);
      await page.waitForTimeout(300);
    }
    if (prioritaires.length) {
      // 5. Thèmes qui comptent double : le récap se recalcule avec la règle publiée, et la peinture suit le nouveau rang.
      const tab2 = await lireTableau();
      const calc2 = distances(reponses, prioritaires);
      const ctx2 = JSON.stringify({ s, prioritaires, tab2: tab2.map(t => [t.nom, t.a, t.bus]) });
      expect(tab2.map(t => t.nom).sort(), ctx2).toEqual(Object.keys(bacs).sort());
      for (const t of tab2) expect(t.a, `${ctx2} · ${t.nom} : ${calc2[t.nom]!.d}`).toBe(Math.round(calc2[t.nom]!.d));
      for (let k = 1; k < tab2.length; k++) expect(tab2[k]!.a, ctx2).toBeGreaterThanOrEqual(tab2[k - 1]!.a);
      const peint2 = peinturesAttendues(tab2.map(t => t.a));
      tab2.forEach((t, k) => expect(t.bus, ctx2).toBe(BUS[peint2[k]!]));
    }
  });
}

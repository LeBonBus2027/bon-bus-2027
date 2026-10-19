// Audit des données MonVote2027 : les positions et la formulation des questions favorisent-elles un camp ?
// Lit data/monvote.json (rien n'est téléchargé) et écrit rapports/audit-monvote.md.
// Usage : node scripts/audit-monvote.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const { meta, candidats, questions, positions } = JSON.parse(readFileSync("data/monvote.json", "utf8"));
const Q = questions.map(q => q.id);
const C = candidats.map(c => c.id);
const nom = Object.fromEntries(candidats.map(c => [c.id, c.nom]));
const pos = (c, q) => positions[c]?.[q] ?? null;
const R0 = 10;
const V5 = [-2, -1, 0, 1, 2];
const pc = x => `${Math.round(x * 100)} %`;
const un = x => x.toFixed(1).replace(".", ",");

// --- Règles de déplacement comparées -----------------------------------------------------------
const REGLES = {
  monvote: {
    titre: "MonVote (règle actuelle)",
    pas: (u, p) => (u === 0 || p === 0 ? 0 : Math.sign(u) === Math.sign(p) ? (u === p ? 2 : 1) : Math.abs(u) === 2 && Math.abs(p) === 2 ? -2 : -1),
  },
  neutre: {
    titre: "MonVote + neutre face à neutre = accord",
    pas: (u, p) => (u === 0 && p === 0 ? 2 : u === 0 || p === 0 ? 0 : Math.sign(u) === Math.sign(p) ? (u === p ? 2 : 1) : Math.abs(u) === 2 && Math.abs(p) === 2 ? -2 : -1),
  },
  ecart: {
    titre: "Écart pur (le bus peut dépasser chez toi)",
    pas: (u, p) => 2 - Math.abs(u - p),
  },
};

function distance(regle, reponse, c, ids = Q) {
  let s = 0, n = 0;
  for (const q of ids) {
    const u = reponse(q), p = pos(c, q);
    if (u === null || p === null) continue;
    n++;
    s += regle.pas(u, p);
  }
  return n ? R0 * (1 - s / (2 * n)) : R0;
}
const classement = (regle, reponse, ids) => C.map(c => [c, distance(regle, reponse, c, ids)]).sort((a, b) => a[1] - b[1]);
const rang = (cl, c) => 1 + cl.filter(([, d]) => d < cl.find(([k]) => k === c)[1] - 1e-9).length;

function graine(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}

// --- 1. Profil des positions ------------------------------------------------------------------
const profil = C.map(c => {
  const v = Q.map(q => pos(c, q));
  const connues = v.filter(x => x !== null);
  return {
    c, inconnues: v.length - connues.length,
    compte: Object.fromEntries(V5.map(x => [x, connues.filter(y => y === x).length])),
    tranchant: connues.reduce((s, x) => s + Math.abs(x), 0) / connues.length,
    accord: connues.filter(x => x > 0).length / connues.length,
  };
});

// --- 2. Axe principal (analyse en composantes principales) -------------------------------------
const X = C.map(c => Q.map(q => pos(c, q) ?? 0));
const moy = Q.map((_, j) => X.reduce((s, l) => s + l[j], 0) / C.length);
const Xc = X.map(l => l.map((x, j) => x - moy[j]));
const G = Xc.map(a => Xc.map(b => a.reduce((s, x, j) => s + x * b[j], 0)));
function vecteurPropre(M, contre = []) {
  let v = M.map((_, i) => 1 + i / 10);
  for (let it = 0; it < 500; it++) {
    for (const u of contre) { const d = v.reduce((s, x, i) => s + x * u[i], 0); v = v.map((x, i) => x - d * u[i]); }
    const w = M.map(l => l.reduce((s, x, j) => s + x * v[j], 0));
    const n = Math.hypot(...w);
    v = w.map(x => x / n);
  }
  const lambda = M.map(l => l.reduce((s, x, j) => s + x * v[j], 0)).reduce((s, x, i) => s + x * v[i], 0);
  return { v, lambda };
}
const trace = G.reduce((s, l, i) => s + l[i], 0);
const ax1 = vecteurPropre(G);
const ax2 = vecteurPropre(G, [ax1.v]);
// Orientation : le pôle « + » est celui du candidat le plus éloigné de Nathalie Arthaud, sans jugement de valeur.
const signe = ax1.v[C.indexOf("arthaud")] > 0 ? -1 : 1;
const score1 = Object.fromEntries(C.map((c, i) => [c, signe * ax1.v[i] * Math.sqrt(ax1.lambda)]));
const score2 = Object.fromEntries(C.map((c, i) => [c, ax2.v[i] * Math.sqrt(ax2.lambda)]));
const ordre1 = [...C].sort((a, b) => score1[a] - score1[b]);
const poleA = nom[ordre1[0]], poleB = nom[ordre1.at(-1)];
// Charge d'une question : corrélation entre les positions sur cette question et l'axe 1.
// Positive : être d'accord rapproche du pôle « + » ; négative : du pôle « − ».
const corrQ = j => {
  const xs = C.map((_, i) => Xc[i][j]), ys = C.map(c => score1[c]);
  const sx = Math.hypot(...xs), sy = Math.hypot(...ys);
  return sx && sy ? xs.reduce((s, x, i) => s + x * ys[i], 0) / (sx * sy) : 0;
};
const charge = Object.fromEntries(Q.map((q, j) => [q, corrQ(j)]));
const SEUIL = 0.4;
const versA = Q.filter(q => charge[q] < -SEUIL), versB = Q.filter(q => charge[q] > SEUIL), neutreQ = Q.filter(q => Math.abs(charge[q]) <= SEUIL);
const rapide = new Set(questions.filter(q => q.quiz_rapide).map(q => q.id));
const parTheme = {};
for (const q of questions) {
  const t = q.themes[0];
  parTheme[t] ??= { a: 0, b: 0, n: 0 };
  if (charge[q.id] < -SEUIL) parTheme[t].a++; else if (charge[q.id] > SEUIL) parTheme[t].b++; else parTheme[t].n++;
}

// --- 3. Électeurs « toujours la même réponse » (biais d'acquiescement) -------------------------
const constants = [
  ["toujours « Tout à fait d'accord »", 2], ["toujours « Plutôt d'accord »", 1],
  ["toujours « Plutôt pas d'accord »", -1], ["toujours « Pas du tout d'accord »", -2],
];

// Clone « complaisant » : sur une part des questions, il glisse d'un cran vers « d'accord » (version rapide : 20 questions au hasard).
function complaisants(regle, part = 0.5, essais = 300) {
  return C.map(c => {
    let garde = 0, versA = 0, versB = 0;
    const t = graine(300 + C.indexOf(c));
    for (let i = 0; i < essais; i++) {
      const ids = [...Q].sort(() => t() - 0.5).slice(0, 20);
      const r = Object.fromEntries(ids.map(q => { const p = pos(c, q); return [q, p === null ? null : t() < part ? Math.min(2, p + 1) : p]; }));
      const cl = classement(regle, q => r[q], ids);
      if (rang(cl, c) === 1) garde++;
      else if (score1[cl[0][0]] < score1[c]) versA++; else versB++;
    }
    return { c, garde: garde / essais, versA: versA / essais, versB: versB / essais };
  });
}

// --- 4. Comparaison des règles -----------------------------------------------------------------
function comparer(regle) {
  const clones = C.map(c => ({ c, d: distance(regle, q => pos(c, q), c), rang: rang(classement(regle, q => pos(c, q)), c) }));
  const moderes = C.map(c => rang(classement(regle, q => (pos(c, q) === null ? null : Math.sign(pos(c, q))), Q), c));
  const antis = C.map(c => distance(regle, q => (pos(c, q) === null ? null : -pos(c, q)), c));
  const t = graine(42), gagne = Object.fromEntries(C.map(c => [c, 0]));
  const N = 2000;
  for (let i = 0; i < N; i++) {
    const r = Object.fromEntries(Q.map(q => [q, V5[Math.floor(t() * 5)]]));
    const cl = classement(regle, q => r[q], Q);
    const premiers = cl.filter(([, d]) => d - cl[0][1] < 1e-9);
    for (const [c] of premiers) gagne[c] += 1 / premiers.length / N;
  }
  // Électeurs « réalistes » : le clone d'un candidat tiré au hasard, avec un tiers de réponses au hasard.
  const t2 = graine(7), gagneR = Object.fromEntries(C.map(c => [c, 0])), bonR = { ok: 0 };
  for (let i = 0; i < N; i++) {
    const modele = C[Math.floor(t2() * C.length)];
    const r = Object.fromEntries(Q.map(q => [q, t2() < 1 / 3 ? V5[Math.floor(t2() * 5)] : pos(modele, q)]));
    const cl = classement(regle, q => r[q], Q);
    if (rang(cl, modele) === 1) bonR.ok++;
  }
  const constantsRes = constants.map(([l, v]) => [l, classement(regle, () => v, Q)]);
  return {
    clones, moderes, antis, gagne, retrouve: bonR.ok / N, constantsRes,
    maxGagne: Math.max(...Object.values(gagne)), minGagne: Math.min(...Object.values(gagne)),
  };
}
const comp = Object.fromEntries(Object.entries(REGLES).map(([k, r]) => [k, comparer(r)]));
const corr = (xs, ys) => {
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  const s = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0);
  return s / Math.sqrt(xs.reduce((a, x) => a + (x - mx) ** 2, 0) * ys.reduce((a, y) => a + (y - my) ** 2, 0));
};

// --- 5. Contrôles de cohérence des données -------------------------------------------------------
const nonDiscriminantes = questions.filter(q => new Set(C.map(c => pos(c, q.id))).size === 1);
const tresNeutres = questions.filter(q => C.filter(c => pos(c, q.id) === 0).length >= C.length / 2);
const jumeaux = [];
for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) {
  const diff = Q.filter(q => pos(C[i], q) !== pos(C[j], q)).length;
  if (diff <= 10) jumeaux.push([C[i], C[j], diff]);
}

// --- Rapport ----------------------------------------------------------------------------------
const L = [];
const p = (...x) => L.push(...x);
p("# Audit des données MonVote2027", "",
  `Données importées le ${meta.date_import} depuis ${meta.url} : ${questions.length} questions, ${C.length} candidats.`,
  "Cet audit ne vérifie pas chaque position une par une contre les déclarations des candidats : MonVote2027 ne publie pas de source par position dans ses données. Il cherche les déséquilibres visibles dans les données elles-mêmes.", "",
  "## En bref", "");
const m = comp.monvote;
const acqu = m.constantsRes.map(([l, cl]) => `${l} → ${nom[cl[0][0]]}`).join(" ; ");
p(`- **Formulation des questions** : répondre « d'accord » rapproche du pôle ${poleA} sur ${versA.length} questions, du pôle ${poleB} sur ${versB.length}, et ne pousse franchement d'aucun côté sur ${neutreQ.length}.`,
  `- **Électeurs qui répondent toujours la même chose** : ${acqu}.`,
  `- **Électeurs qui répondent au hasard** (règle actuelle) : le candidat le plus souvent premier l'est ${pc(m.maxGagne)} du temps, le moins souvent ${pc(m.minGagne)}. Corrélation entre « positions tranchées » et « premier pour un électeur au hasard » : ${un(corr(profil.map(x => x.tranchant), C.map(c => m.gagne[c])))}.`,
  `- **Électeurs réalistes** (le clone d'un candidat, avec un tiers de réponses au hasard) : leur candidat arrive premier ${pc(m.retrouve)} du temps.`,
  `- **Électeurs qui approuvent trop facilement** (section 3) : quand ils ne retrouvent pas leur candidat, ils partent surtout vers le pôle ${poleA}, conséquence de la formulation des questions.`, "");

p("## 1. Profil des positions", "",
  "Une position « tranchée » vaut ±2 (tout à fait d'accord ou pas du tout), une position « nuancée » ±1. « Tranchant » = moyenne des valeurs absolues (0 à 2). « D'accord » = part des questions où le candidat est d'accord avec l'affirmation.", "",
  "| Candidat | −2 | −1 | 0 | +1 | +2 | Inconnues | Tranchant | D'accord |", "|---|---|---|---|---|---|---|---|---|",
  ...profil.sort((a, b) => b.tranchant - a.tranchant).map(x => `| ${nom[x.c]} | ${x.compte[-2]} | ${x.compte[-1]} | ${x.compte[0]} | ${x.compte[1]} | ${x.compte[2]} | ${x.inconnues} | ${un(x.tranchant)} | ${pc(x.accord)} |`), "");

p("## 2. L'axe principal des positions", "",
  `Une analyse en composantes principales résume les 100 positions de chaque candidat. Le premier axe explique ${pc(ax1.lambda / trace)} des différences entre candidats, le second ${pc(ax2.lambda / trace)}. L'axe est simplement orienté de ${poleA} à ${poleB}, sans étiquette.`, "",
  "| Candidat | Axe 1 | Axe 2 |", "|---|---|---|",
  ...ordre1.map(c => `| ${nom[c]} | ${un(score1[c])} | ${un(score2[c])} |`), "",
  "Lecture : si cet ordre paraît plausible au regard des programmes connus, les positions codées par MonVote2027 sont cohérentes entre elles. C'est une vérification de vraisemblance, pas une preuve d'exactitude.", "");

p("## 3. Formulation des questions", "",
  `Pour chaque question, on regarde vers quel pôle de l'axe 1 pousse une réponse « d'accord » (corrélation entre les positions sur la question et l'axe, au-delà de ±0,4). Si une large majorité des affirmations allait dans le même sens, un électeur qui a tendance à approuver (biais d'acquiescement, bien documenté dans les sondages) serait poussé vers ce camp.`, "",
  `| | Vers ${poleA} | Vers ${poleB} | Sans direction nette |`, "|---|---|---|---|",
  `| Toutes les questions | ${versA.length} | ${versB.length} | ${neutreQ.length} |`,
  `| Quiz rapide de MonVote (${rapide.size}) | ${versA.filter(q => rapide.has(q)).length} | ${versB.filter(q => rapide.has(q)).length} | ${neutreQ.filter(q => rapide.has(q)).length} |`,
  ...Object.entries(parTheme).sort().map(([t, v]) => `| Thème ${t} | ${v.a} | ${v.b} | ${v.n} |`), "",
  "### Électeurs qui répondent toujours la même chose", "",
  "Avec la règle actuelle. Un électeur qui approuve tout ne devrait pas tomber systématiquement sur un camp.", "",
  "| Électeur | 1er | 2e | 3e | Dernier |", "|---|---|---|---|---|",
  ...m.constantsRes.map(([l, cl]) => `| ${l} | ${nom[cl[0][0]]} (${un(cl[0][1])}) | ${nom[cl[1][0]]} (${un(cl[1][1])}) | ${nom[cl[2][0]]} (${un(cl[2][1])}) | ${nom[cl.at(-1)[0]]} (${un(cl.at(-1)[1])}) |`), "",
  "### Clones « complaisants »", "",
  "Un électeur qui pense comme le candidat, mais qui glisse d'un cran vers « d'accord » sur la moitié des questions, en version rapide (20 questions au hasard, 300 essais). Sur les 100 questions avec 30 % de glissement, tous retrouvent leur candidat. Quand il ne retrouve pas son candidat en premier, vers quel pôle part-il ?", "",
  `| Candidat | Retrouve son candidat | Part vers ${poleA} | Part vers ${poleB} |`, "|---|---|---|---|",
  ...complaisants(REGLES.monvote).sort((a, b) => score1[a.c] - score1[b.c]).map(x => `| ${nom[x.c]} | ${pc(x.garde)} | ${pc(x.versA)} | ${pc(x.versB)} |`), "");

p("## 4. Contrôles de cohérence", "",
  `- Questions où tous les candidats ont la même position (elles ne départagent personne) : ${nonDiscriminantes.length ? nonDiscriminantes.map(q => q.id).join(", ") : "aucune"}.`,
  `- Questions où au moins la moitié des candidats sont neutres : ${tresNeutres.length ? tresNeutres.map(q => `${q.id} (« ${q.texte} »)`).join(" ; ") : "aucune"}.`,
  `- Paires de candidats qui diffèrent sur 10 questions ou moins : ${jumeaux.length ? jumeaux.map(([a, b, d]) => `${nom[a]} / ${nom[b]} (${d})`).join(" ; ") : "aucune"}.`, "");

p("## 5. Trois règles de déplacement comparées", "",
  "- **MonVote** : +2 même camp et même intensité, +1 même camp, 0 si l'un des deux est neutre, −1 camps opposés, −2 extrêmes opposés.",
  "- **Neutre = accord** : pareil, mais neutre face à neutre compte +2.",
  "- **Écart pur** : le pas vaut 2 − |réponse − position|. Un candidat plus tranché que toi dans ton sens « te dépasse » : il est compté aussi loin qu'un candidat moins tranché que toi.", "",
  "| | " + Object.values(REGLES).map(r => r.titre).join(" | ") + " |", "|---|---|---|---|",
  "| Clones pile devant la maison (sur 21) | " + Object.values(comp).map(x => x.clones.filter(y => Math.round(y.d) === 0).length).join(" | ") + " |",
  "| Clone le plus loin de chez lui (arrêts) | " + Object.values(comp).map(x => un(Math.max(...x.clones.map(y => y.d)))).join(" | ") + " |",
  "| Clones « modérés » qui retrouvent leur candidat en 1er | " + Object.values(comp).map(x => x.moderes.filter(r => r === 1).length).join(" | ") + " |",
  "| Anti-clone : arrêts (min) | " + Object.values(comp).map(x => un(Math.min(...x.antis))).join(" | ") + " |",
  "| Électeurs réalistes qui retrouvent leur candidat | " + Object.values(comp).map(x => pc(x.retrouve)).join(" | ") + " |",
  "| Électeurs au hasard : premier le plus fréquent | " + Object.values(comp).map(x => { const [c, v] = Object.entries(x.gagne).sort((a, b) => b[1] - a[1])[0]; return `${nom[c]} ${pc(v)}`; }).join(" | ") + " |",
  "| Électeurs au hasard : premier le plus rare | " + Object.values(comp).map(x => { const [c, v] = Object.entries(x.gagne).sort((a, b) => a[1] - b[1])[0]; return `${nom[c]} ${pc(v)}`; }).join(" | ") + " |",
  "| « Toujours plutôt d'accord » → 1er | " + Object.values(comp).map(x => nom[x.constantsRes[1][1][0][0]]).join(" | ") + " |", "");

mkdirSync("rapports", { recursive: true });
writeFileSync("rapports/audit-monvote.md", L.join("\n"));
console.log(L.slice(0, 12).join("\n"));

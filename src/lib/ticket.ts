/**
 * Ticket de bus à partager (1080 × 1350, format portrait des réseaux), dessiné dans le navigateur.
 * Rien n'est envoyé : l'image n'existe que sur l'appareil, jusqu'à ce que la personne choisisse de la partager.
 */
import type { Niveau } from "./niveaux";
import type { Effet } from "./revelation";

export interface LigneTicket {
  titre: string;        // ex. « MON PLUS BEAU BUS »
  nom?: string;         // nom du candidat, seulement si la personne l'a choisi
  avant: Niveau;        // le bus imaginé (bac choisi au départ)
  apres: Niveau;        // ce qu'il vaut vraiment pour elle
  arrets: number;
  /** Effet de la peinture grattée, figé dans l'image : halo et étoiles, ou bus affaissé qui fume. */
  effet?: Effet | null;
}

const NUIT = "#0b1f3a", JAUNE = "#ffcd00", GRIS = "#4a5b72", SOL = "#dfe5ec", ROUGE = "#c62828";
const W = 1080, H = 1350;

type Ctx = CanvasRenderingContext2D & { letterSpacing?: string };

function police(ctx: Ctx, poids: number, taille: number, espacement = "0px") {
  ctx.font = `${poids} ${taille}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = espacement;
}

function couper(ctx: Ctx, t: string, largeur: number): string[] {
  const sortie: string[] = [];
  let ligne = "";
  for (const mot of t.split(" ")) {
    const essai = ligne ? `${ligne} ${mot}` : mot;
    if (ctx.measureText(essai).width > largeur && ligne) { sortie.push(ligne); ligne = mot; } else ligne = essai;
  }
  if (ligne) sortie.push(ligne);
  return sortie;
}

/** Étoile à quatre branches (l'éclat des bus qui brillent). */
function etoile(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 - Math.PI / 2, d = k % 2 ? r * 0.28 : r;
    ctx.lineTo(x + d * Math.cos(a), y + d * Math.sin(a));
  }
  ctx.closePath(); ctx.fill();
}

/** Bus « en vrai », avec son effet : il brille (halo doré, étoiles), il s'envole (étoiles), il cale ou tombe en panne (fumée, bus affaissé et terni). */
function dessinerApres(ctx: Ctx, img: CanvasImageSource, x: number, y: number, l: number, h: number, effet: Effet | null | undefined) {
  const cx = x + l / 2, cy = y + h / 2;
  if (effet === "brille") {
    // Halo ovale qui s'éteint avant les bords, puis rayons fins dans la moitié haute (le texte est dessous).
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.62);
    const halo = ctx.createRadialGradient(0, 0, 10, 0, 0, l * 0.62);
    halo.addColorStop(0, "rgba(255, 205, 0, 0.6)"); halo.addColorStop(0.6, "rgba(255, 205, 0, 0.25)"); halo.addColorStop(1, "rgba(255, 205, 0, 0)");
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, l * 0.62, 0, 2 * Math.PI); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = "rgba(255, 205, 0, 0.75)"; ctx.lineWidth = 5; ctx.lineCap = "round";
    for (let k = 0; k <= 8; k++) { const a = Math.PI + (k * Math.PI) / 8; ctx.beginPath(); ctx.moveTo(Math.cos(a) * l * 0.42, Math.sin(a) * h * 0.46); ctx.lineTo(Math.cos(a) * l * 0.53, Math.sin(a) * h * 0.64); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.shadowColor = JAUNE; ctx.shadowBlur = 36; ctx.drawImage(img, x, y, l, h); ctx.restore();
  } else if (effet === "panne") {
    ctx.save(); ctx.translate(cx, y + h * 0.9); ctx.rotate(0.09);
    if ("filter" in ctx) ctx.filter = "grayscale(0.7) brightness(0.85)";
    ctx.drawImage(img, -l / 2, -h * 0.9 + 10, l, h);
    ctx.restore();
  } else {
    ctx.drawImage(img, x, y, l, h);
  }
  if (effet === "brille" || effet === "envol") {
    ctx.fillStyle = JAUNE; ctx.strokeStyle = NUIT;
    const etoiles: [number, number, number][] = effet === "brille"
      ? [[x + 22, y + 18, 26], [x + l - 16, y + 20, 34], [x + l * 0.62, y + 2, 18], [x - 6, y + h * 0.45, 20], [x + l + 6, y + h * 0.4, 18]]
      : [[x + 24, y + 2, 20], [x + l - 20, y - 8, 24], [x + l * 0.5, y - 26, 14]];
    for (const [ex, ey, er] of etoiles) etoile(ctx, ex, ey, er);
  }
  if (effet === "panne" || effet === "cale") {
    const bouffees: [number, number, number, number][] = effet === "panne"
      ? [[x + 6, y + h * 0.62, 18, 0.75], [x - 14, y + h * 0.4, 26, 0.6], [x - 30, y + h * 0.12, 34, 0.45], [x - 40, y - h * 0.18, 40, 0.3]]
      : [[x + 6, y + h * 0.66, 14, 0.6], [x - 8, y + h * 0.48, 20, 0.4]];
    for (const [bx, by, br, a] of bouffees) { ctx.fillStyle = `rgba(93, 102, 115, ${a})`; ctx.beginPath(); ctx.arc(bx, by, br, 0, 2 * Math.PI); ctx.fill(); }
  }
}

const arretsTexte = (n: number) => (n === 0 ? "devant chez moi" : `${n} arrêt${n > 1 ? "s" : ""}`);

export async function dessinerTicket(
  lignes: LigneTicket[],
  imageBus: (n: Niveau) => Promise<CanvasImageSource | null>,
  hote: string,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d") as Ctx;

  // Fond : un bout de plan de ville.
  ctx.fillStyle = SOL; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 18;
  for (let x = 60; x < W; x += 160) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 40; y < H; y += 160) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Le ticket, avec son ombre.
  const x0 = 80, y0 = 64, w = 920, h = 1150, r = 30, yPerfo = y0 + 250;
  const contour = () => { ctx.beginPath(); ctx.roundRect(x0, y0, w, h, r); };
  ctx.save();
  ctx.shadowColor = "rgba(11, 31, 58, 0.28)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
  contour(); ctx.fillStyle = "#ffffff"; ctx.fill();
  ctx.restore();

  // En-tête bleu nuit, découpé à la forme du ticket.
  ctx.save(); contour(); ctx.clip();
  ctx.fillStyle = NUIT; ctx.fillRect(x0, y0, w, 230);
  ctx.fillStyle = JAUNE; ctx.fillRect(x0, y0 + 230, w, 10);
  ctx.restore();
  ctx.textAlign = "left";
  ctx.fillStyle = JAUNE; police(ctx, 800, 22, "3px"); ctx.fillText("TITRE DE TRANSPORT", x0 + 50, y0 + 54);
  // Le nom : « LeBonBus » en blanc, « 2027 » en jaune.
  police(ctx, 900, 36); ctx.fillStyle = "#ffffff"; ctx.fillText("LeBonBus", x0 + 50, y0 + 94);
  ctx.fillStyle = JAUNE; ctx.fillText("2027", x0 + 50 + ctx.measureText("LeBonBus").width, y0 + 94);
  ctx.textAlign = "right"; ctx.fillStyle = JAUNE; police(ctx, 800, 22, "3px"); ctx.fillText("1 VOYAGE", x0 + w - 50, y0 + 54);
  ctx.textAlign = "left"; ctx.fillStyle = "#ffffff"; police(ctx, 900, 54);
  couper(ctx, "Quel bus te ramène chez toi ?", w - 110).forEach((l, i) => ctx.fillText(l, x0 + 50, y0 + 172 + i * 60));

  // Perforation : encoches et pointillés.
  ctx.fillStyle = SOL;
  for (const cx of [x0, x0 + w]) { ctx.beginPath(); ctx.arc(cx, yPerfo, 28, 0, 2 * Math.PI); ctx.fill(); }
  ctx.strokeStyle = "#c9d2de"; ctx.lineWidth = 4; ctx.setLineDash([16, 12]);
  ctx.beginPath(); ctx.moveTo(x0 + 44, yPerfo); ctx.lineTo(x0 + w - 44, yPerfo); ctx.stroke(); ctx.setLineDash([]);

  // Les trajets : bus imaginé → bus réel.
  const hauteurLigne = lignes.length > 1 ? 330 : 400;
  let y = yPerfo + 56;
  for (const [i, l] of lignes.entries()) {
    if (i > 0) { ctx.fillStyle = "#e6e9ee"; ctx.fillRect(x0 + 50, y - 26, w - 100, 3); }
    ctx.fillStyle = GRIS; police(ctx, 800, 24, "3px"); ctx.fillText(l.titre, x0 + 56, y + 8);
    let yBus = y + 30;
    if (l.nom) { ctx.fillStyle = NUIT; police(ctx, 900, 36); ctx.fillText(l.nom, x0 + 56, y + 54); yBus += 40; }
    const lb = 330, hb = 154;
    const [imgAvant, imgApres] = await Promise.all([imageBus(l.avant), imageBus(l.apres)]);
    if (imgAvant) ctx.drawImage(imgAvant, x0 + 40, yBus, lb, hb);
    if (imgApres) dessinerApres(ctx, imgApres, x0 + w - 40 - lb, yBus, lb, hb, l.effet);
    ctx.fillStyle = NUIT; police(ctx, 900, 70); ctx.textAlign = "center"; ctx.fillText("→", x0 + w / 2, yBus + hb / 2 + 24);
    police(ctx, 800, 22, "2px"); ctx.fillStyle = GRIS;
    ctx.fillText("J'IMAGINAIS", x0 + 40 + lb / 2, yBus + hb + 30);
    ctx.fillStyle = NUIT; ctx.fillText(`EN VRAI · ${arretsTexte(l.arrets).toUpperCase()}`, x0 + w - 40 - lb / 2, yBus + hb + 30);
    ctx.textAlign = "left";
    y += hauteurLigne;
  }

  // Faux code-barres et adresse.
  const yBas = y0 + h - 150;
  ctx.fillStyle = NUIT;
  const motif = [3, 1, 2, 1, 4, 2, 1, 3, 1, 1, 2, 4, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 4, 1, 2, 2, 1, 3];
  let xb = x0 + 56;
  for (const [i, m] of motif.entries()) { if (i % 2 === 0) ctx.fillRect(xb, yBas, m * 4, 80); xb += m * 4 + 4; }
  ctx.fillStyle = GRIS; police(ctx, 600, 24);
  ctx.fillText("Selon mon ressenti et mes réponses", x0 + 56, yBas + 112);

  // Tampon « composté ».
  ctx.save();
  ctx.translate(x0 + w - 230, yBas + 30); ctx.rotate(-0.17); ctx.globalAlpha = 0.88;
  ctx.strokeStyle = ROUGE; ctx.lineWidth = 7; ctx.beginPath(); ctx.roundRect(-180, -70, 360, 140, 14); ctx.stroke();
  ctx.fillStyle = ROUGE; ctx.textAlign = "center";
  police(ctx, 900, 52, "4px"); ctx.fillText("COMPOSTÉ", 0, 6);
  police(ctx, 800, 22, "3px"); ctx.fillText("PRÉSIDENTIELLE 2027", 0, 44);
  ctx.restore();

  // Appel sous le ticket (la question est déjà en tête) : l'adresse et le hashtag, pour suivre ce qui s'en dit sur les réseaux.
  ctx.textAlign = "center";
  police(ctx, 900, 38);
  const appel = `Et toi ? · ${hote} · #LeBonBus2027`;
  const largeur = ctx.measureText(appel).width;
  ctx.fillStyle = JAUNE; ctx.fillRect((W - largeur) / 2 - 16, H - 76, largeur + 32, 22);
  ctx.fillStyle = NUIT; ctx.fillText(appel, W / 2, H - 58);
  ctx.textAlign = "left";

  const blob = await new Promise<Blob | null>(ok => canvas.toBlob(ok, "image/png"));
  if (!blob) throw new Error("Ticket non généré");
  return blob;
}

/**
 * Placement des pastilles des bus mis en avant : pour chaque bus, on essaie plusieurs emplacements
 * autour de lui et on garde celui qui recouvre le moins les autres pastilles, les bus et la maison.
 */

export interface Cible { id: string; x: number; y: number; largeur: number }
export interface Place { id: string; x: number; y: number; largeur: number }

const HAUTEUR = 30;
const BUS = { l: 64, h: 34 };       // encombrement d'un bus à l'échelle de la carte
const MARGE = 6;

interface Rect { x1: number; y1: number; x2: number; y2: number }
const rectPastille = (x: number, y: number, l: number): Rect => ({ x1: x - l / 2 - MARGE, y1: y - HAUTEUR / 2 - MARGE, x2: x + l / 2 + MARGE, y2: y + HAUTEUR / 2 + MARGE });
const rectBus = (x: number, y: number): Rect => ({ x1: x - BUS.l / 2, y1: y - BUS.h / 2, x2: x + BUS.l / 2, y2: y + BUS.h / 2 });
const recouvrement = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));

/**
 * @param cibles bus mis en avant (position et largeur de leur pastille)
 * @param obstacles autres zones à éviter (maison, gare…)
 */
export function placer(cibles: readonly Cible[], obstacles: readonly Rect[] = []): Place[] {
  const occupe: Rect[] = [...obstacles, ...cibles.map(c => rectBus(c.x, c.y))];
  const places: Place[] = [];
  // Les bus les plus entourés d'abord : ce sont eux qui ont le moins de choix.
  const ordre = [...cibles].sort((a, b) => voisins(b, cibles) - voisins(a, cibles));
  for (const c of ordre) {
    const d = c.largeur / 2 + BUS.l / 2 + 8;
    const essais: [number, number][] = [
      [0, -42], [0, 42], [d, 0], [-d, 0], [d - 20, -40], [-d + 20, -40], [d - 20, 40], [-d + 20, 40],
      [0, -80], [0, 80], [d, -80], [-d, -80], [d, 80], [-d, 80], [0, -120], [0, 120],
    ];
    let meilleur = { x: c.x, y: c.y - 42, cout: Infinity };
    essais.forEach(([dx, dy], rang) => {
      const r = rectPastille(c.x + dx, c.y + dy, c.largeur);
      const cout = occupe.reduce((s, o) => s + recouvrement(r, o), 0) + rang * 2;   // à égalité, le plus proche
      if (cout < meilleur.cout) meilleur = { x: c.x + dx, y: c.y + dy, cout };
    });
    occupe.push(rectPastille(meilleur.x, meilleur.y, c.largeur));
    places.push({ id: c.id, x: meilleur.x, y: meilleur.y, largeur: c.largeur });
  }
  return cibles.map(c => places.find(p => p.id === c.id)!);
}

function voisins(c: Cible, toutes: readonly Cible[]) {
  return toutes.filter(o => o !== c && Math.hypot(o.x - c.x, o.y - c.y) < 160).length;
}

export { rectPastille, recouvrement };

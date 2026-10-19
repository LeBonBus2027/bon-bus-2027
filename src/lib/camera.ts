/** Cadrage de la carte : un cadre = [x, y, largeur, hauteur] dans le repère de la ville. */
export type Vue = [number, number, number, number];

export const LARGEUR_ZOOM_MIN = 240, LARGEUR_ZOOM_MAX = 2400;

/** Plus petit cadre aux proportions `ratio` qui contient ces points, avec une marge et une largeur minimale. */
export function cadrer(xs: number[], ys: number[], marge: number, largeurMin: number, ratio: number): Vue {
  let w = Math.max(...xs) - Math.min(...xs) + 2 * marge, h = Math.max(...ys) - Math.min(...ys) + 2 * marge;
  if (w / h < ratio) w = h * ratio; else h = w / ratio;
  if (w < largeurMin) { w = largeurMin; h = w / ratio; }
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  return [cx - w / 2, cy - h / 2, w, h];
}

/** Zoom de facteur f autour du centre du cadre (f < 1 : on se rapproche). */
export function zoomer(vue: Vue, f: number, ratio: number): Vue {
  const [x, y, w, h] = vue;
  const nw = Math.min(LARGEUR_ZOOM_MAX, Math.max(LARGEUR_ZOOM_MIN, w * f)), nh = nw / ratio;
  return [x + (w - nw) / 2, y + (h - nh) / 2, nw, nh];
}

/** Interpolation entre deux cadres (t de 0 à 1). */
export const entre = (de: Vue, vers: Vue, t: number): Vue => de.map((v, i) => v + (vers[i]! - v) * t) as Vue;

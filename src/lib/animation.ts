/** Petites animations au rythme de l'écran, qui respectent le réglage « réduire les animations ». */

export const mouvementReduit = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const doux = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * Appelle `pas(t)` à chaque image, t allant de 0 à 1 en `ms` millisecondes (accélération douce).
 * Saute directement à la fin si l'animation est réduite ou si `arreter()` devient vrai.
 */
export function animer(ms: number, pas: (t: number) => void, arreter: () => boolean = () => false): Promise<void> {
  return new Promise(fin => {
    if (arreter() || mouvementReduit()) { pas(1); fin(); return; }
    const t0 = performance.now();
    const image = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      pas(doux(t));
      if (t < 1 && !arreter()) requestAnimationFrame(image); else { pas(1); fin(); }
    };
    requestAnimationFrame(image);
  });
}

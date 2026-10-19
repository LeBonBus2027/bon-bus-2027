/**
 * Mode clair ou sombre choisi à la main. Rien n'est stocké : le choix vit dans la page (attribut
 * data-theme de <html>) et disparaît à la fermeture, comme tout le reste. Sans choix, on suit le système.
 */
export type Theme = "clair" | "sombre";

export function themeActuel(): Theme {
  const force = document.documentElement.dataset.theme;
  if (force === "dark") return "sombre";
  if (force === "light") return "clair";
  return matchMedia("(prefers-color-scheme: dark)").matches ? "sombre" : "clair";
}

export function choisirTheme(t: Theme) {
  document.documentElement.dataset.theme = t === "sombre" ? "dark" : "light";
}

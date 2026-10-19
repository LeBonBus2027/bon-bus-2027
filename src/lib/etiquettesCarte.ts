/** Étiquettes des bus mis en avant sur la carte d'arrivée : texte, taille, et place sans chevauchement. */
import type { Classe } from "./calcul";
import type { Etiquette } from "./Carte.svelte";
import type { Candidat } from "./donnees";
import { placer } from "./etiquettes";
import { urlPhoto } from "./Photo.svelte";
import { arrets } from "./revelation";
import { GARE, MAISON, positionBus, px, type Noeud } from "./ville";

export function etiquettesPour(
  liste: readonly Classe<Candidat>[],
  ligneDe: (id: string) => readonly Noeud[],
  voie: (id: string) => number,
  meilleurId: string,
): Etiquette[] {
  const infos = liste.map(f => {
    const p = positionBus(ligneDe(f.candidat.id), f.trajet.distance, voie(f.candidat.id));
    // Nom de famille seulement : pastilles plus courtes, donc zoom plus serré (le tableau garde les noms complets).
    const nom = f.candidat.nom.slice(f.candidat.nom.indexOf(" ") + 1);
    const texte = `${nom} · ${arrets(f.trajet.arrets)}`;
    return { id: f.candidat.id, x: p.x, y: p.y, largeur: texte.length * 10.4 + 26 + (urlPhoto(f.candidat.id) ? 32 : 0), texte };
  });
  const [mx, my] = px(MAISON), [gx, gy] = px(GARE);
  // Zones à ne pas recouvrir : la maison et la gare.
  const places = placer(infos, [
    { x1: mx - 60, y1: my - 60, x2: mx + 60, y2: my + 34 },
    { x1: gx - 20, y1: gy - 40, x2: gx + 140, y2: gy + 20 },
  ]);
  return infos.map((info, i) => ({
    id: info.id, x: places[i]!.x, y: places[i]!.y, largeur: info.largeur, texte: info.texte,
    cible: { x: info.x, y: info.y }, accent: info.id === meilleurId,
  }));
}

<script lang="ts">
  import { onMount, untrack } from "svelte";
  import Carte, { type Etiquette, type Pieton } from "../lib/Carte.svelte";
  import { tirageCrypto } from "../lib/aleatoire";
  import { classer, R0, trajet, type Reponse } from "../lib/calcul";
  import { candidats, positions, questions } from "../lib/donnees";
  import type { Niveau } from "../lib/niveaux";
  import { arrets, rejeu, reveler } from "../lib/revelation";
  import { placer } from "../lib/etiquettes";
  import { aPied, GARE, HAUTEUR, LARGEUR, lignes, MAISON, positionBus, px } from "../lib/ville";
  import Resultats from "./Resultats.svelte";

  let { bacs, reponses, ordre, onRecommencer }: {
    bacs: Record<string, Niveau>;
    reponses: Record<string, Reponse>;
    ordre: string[];
    onRecommencer: () => void;
  } = $props();

  type Vue = [number, number, number, number];
  // Sur mobile, cadre en portrait qui suit les bus ; sur grand écran, toute la ville d'un coup d'œil.
  const PORTRAIT = matchMedia("(max-width: 600px)").matches;
  const RATIO = PORTRAIT ? 0.8 : LARGEUR / HAUTEUR;
  const MIN_ZOOM = PORTRAIT ? 400 : 600;
  const MIN_SUIVI = PORTRAIT ? 440 : 560;
  const LIGNES = lignes(candidats.map(c => c.id));
  const parId = new Map(questions.map(q => [q.id, q]));

  // Tout est calculé une fois au départ (les réponses ne changent plus) : l'animation ne fait que rejouer ce résultat.
  const { r, classement, revelation } = untrack(() => {
    const r = rejeu(ordre, reponses, parId);
    const classement = classer(candidats, c => trajet(r.ordre, reponses, positions[c.id] ?? {}), tirageCrypto);
    return { r, classement, revelation: reveler(classement, bacs) };
  });
  const trajets = new Map(classement.map(c => [c.candidat.id, c.trajet]));
  const enAvant = new Set(revelation.focus.map(f => f.candidat.id));
  const voies = new Map(candidats.map((c, i) => [c.id, ((i % 5) - 2) * 3]));
  const ligneDe = (id: string) => LIGNES[id]!;

  let distances = $state<Record<string, number>>(Object.fromEntries(candidats.map(c => [c.id, R0])));
  let vue = $state<Vue>(PORTRAIT ? cadrer([px(MAISON)[0], px(GARE)[0]], [px(MAISON)[1], px(GARE)[1]], 70, MIN_SUIVI) : [0, 0, LARGEUR, HAUTEUR]);
  let phase = $state<"pret" | "route" | "fin">("pret");
  let statut = $state("Tous les bus attendent à la gare.");
  let etiquettes = $state<Etiquette[]>([]);
  let pietons = $state<Pieton[]>([]);
  let passer = false;

  const bus = $derived(candidats.map(c => ({
    id: c.id, niveau: bacs[c.id] ?? "inconnu", ligne: ligneDe(c.id), d: distances[c.id]!,
    voie: voies.get(c.id)!, attenue: phase === "fin" && !enAvant.has(c.id),
  })));

  const reduit = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doux = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  function animer(ms: number, pas: (t: number) => void): Promise<void> {
    return new Promise(fin => {
      if (passer || reduit()) { pas(1); fin(); return; }
      const t0 = performance.now();
      const image = (now: number) => {
        const t = Math.min(1, (now - t0) / ms);
        pas(doux(t));
        if (t < 1 && !passer) requestAnimationFrame(image); else { pas(1); fin(); }
      };
      requestAnimationFrame(image);
    });
  }

  async function partir() {
    phase = "route";
    const duree = r.passages.length > 20 ? 1100 : 380;
    for (const p of r.passages) {
      if (passer) break;
      statut = p.libelle;
      const depart = { ...distances };
      await animer(duree, t => {
        for (const c of candidats) {
          const but = trajets.get(c.id)!.etapes[p.index] ?? R0;
          distances[c.id] = depart[c.id]! + (but - depart[c.id]!) * t;
        }
        if (PORTRAIT) suivre();
      });
    }
    for (const c of candidats) distances[c.id] = trajets.get(c.id)!.distance;
    statut = "Terminus, tout le monde descend.";
    passer = false;
    reveler_carte();
    phase = "fin";
    await zoomer();
  }

  function reveler_carte() {
    const meilleur = revelation.meilleur.candidat.id;
    pietons = revelation.focus.map(f => ({ id: f.candidat.id, points: aPied(ligneDe(f.candidat.id), f.trajet.distance), accent: f.candidat.id === meilleur }));

    // Pastilles placées autour des bus, sans se recouvrir ni cacher un bus, la maison ou la gare.
    const infos = revelation.focus.map(f => {
      const p = positionBus(ligneDe(f.candidat.id), f.trajet.distance, voies.get(f.candidat.id)!);
      // Nom de famille seulement : pastilles plus courtes, donc zoom plus serré (le tableau garde les noms complets).
      const nom = f.candidat.nom.slice(f.candidat.nom.indexOf(" ") + 1);
      const texte = `${nom} · ${arrets(f.trajet.arrets)}`;
      return { id: f.candidat.id, x: p.x, y: p.y, largeur: texte.length * 9.4 + 24, texte };
    });
    const [mx, my] = px(MAISON), [gx, gy] = px(GARE);
    const places = placer(infos, [
      { x1: mx - 60, y1: my - 60, x2: mx + 60, y2: my + 34 },
      { x1: gx - 20, y1: gy - 40, x2: gx + 140, y2: gy + 20 },
    ]);
    etiquettes = infos.map((info, i) => ({
      id: info.id, x: places[i]!.x, y: places[i]!.y, largeur: info.largeur, texte: info.texte,
      cible: { x: info.x, y: info.y }, accent: info.id === meilleur,
    }));
  }

  /** Caméra : cadre la maison, la gare et tous les bus, en suivant doucement leur progression. */
  function suivre(lissage = 0.12) {
    const pts = [px(MAISON), px(GARE), ...candidats.map(c => {
      const p = positionBus(ligneDe(c.id), distances[c.id]!, 0);
      return [p.x, p.y] as [number, number];
    })];
    const cible = cadrer(pts.map(p => p[0]), pts.map(p => p[1]), 70, MIN_SUIVI);
    vue = vue.map((v, i) => v + (cible[i]! - v) * lissage) as Vue;
  }

  /** Plus petit cadre aux proportions de la carte qui contient ces points. */
  function cadrer(xs: number[], ys: number[], marge: number, largeurMin: number): Vue {
    const ratio = RATIO;
    let w = Math.max(...xs) - Math.min(...xs) + 2 * marge, h = Math.max(...ys) - Math.min(...ys) + 2 * marge;
    if (w / h < ratio) w = h * ratio; else h = w / ratio;
    if (w < largeurMin) { w = largeurMin; h = w / ratio; }
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    return [cx - w / 2, cy - h / 2, w, h];
  }

  async function zoomer() {
    const [mx, my] = px(MAISON);
    const xs = [mx - 70, mx + 70, ...etiquettes.flatMap(e => [e.x - e.largeur / 2, e.x + e.largeur / 2, e.cible.x - 34, e.cible.x + 34])];
    const ys = [my - 70, my + 40, ...etiquettes.flatMap(e => [e.y - 20, e.y + 20, e.cible.y - 24, e.cible.y + 24])];
    const de = [...vue] as Vue, vers = cadrer(xs, ys, 30, MIN_ZOOM);
    await animer(1200, t => { vue = de.map((v, i) => v + (vers[i]! - v) * t) as Vue; });
  }

  onMount(() => {
    const minuteur = setTimeout(partir, 600);
    return () => { passer = true; clearTimeout(minuteur); };
  });
</script>

<h1 tabindex="-1">{phase === "fin" ? "Terminus !" : "Le grand départ"}</h1>
<div class="boite carte">
  <Carte {bus} {vue} ratio={RATIO} {pietons} {etiquettes} />
</div>
<p class="rangee statut">
  <span aria-live="polite">{statut}</span>
  {#if phase === "route"}<button class="discret" onclick={() => (passer = true)}>Passer l'animation</button>{/if}
</p>

{#if phase === "fin"}
  <Resultats {revelation} {classement} {bacs} {onRecommencer} />
{/if}

<style>
  .carte { padding: 0; overflow: hidden; }
  .statut { justify-content: space-between; color: var(--discret); margin-top: 8px; min-height: 48px; }
</style>

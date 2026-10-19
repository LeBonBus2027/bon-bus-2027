<script lang="ts">
  import { onMount, tick, untrack } from "svelte";
  import Carte, { type Etiquette, type Pieton } from "../lib/Carte.svelte";
  import { tirageCrypto } from "../lib/aleatoire";
  import { classer, R0, trajet, type Reponse } from "../lib/calcul";
  import { candidats, positions, questions } from "../lib/donnees";
  import type { Niveau } from "../lib/niveaux";
  import { arrets, niveauReel, rejeu, reveler } from "../lib/revelation";
  import { placer } from "../lib/etiquettes";
  import { aPied, GARE, HAUTEUR, LARGEUR, lignes, MAISON, positionBus, px } from "../lib/ville";
  import Explication from "./Explication.svelte";
  import { distanceA, libelleReponse, mouvements } from "../lib/retroviseur";
  import { urlPhoto } from "../lib/Photo.svelte";
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
  const MIN_ZOOM = PORTRAIT ? 380 : 600;
  const MIN_SUIVI = PORTRAIT ? 440 : 560;
  const LIGNES = lignes(candidats.map(c => c.id));   // toujours les 21 : chaque candidat garde sa ligne
  const parId = new Map(questions.map(q => [q.id, q]));

  // Tout est calculé une fois au départ (les réponses ne changent plus) : l'animation ne fait que rejouer ce résultat.
  // Le calcul porte sur tous les candidats, pour signaler un candidat non ajouté qui t'aurait déposé plus près.
  const { r, classement, revelation, horsSelection } = untrack(() => {
    const r = rejeu(ordre, reponses, parId);
    const tous = classer(candidats, c => trajet(r.ordre, reponses, positions[c.id] ?? {}), tirageCrypto);
    const classement = tous.filter(c => c.candidat.id in bacs);
    const autre = tous.find(c => !(c.candidat.id in bacs));
    const horsSelection = autre && autre.trajet.distance < classement[0]!.trajet.distance ? autre : undefined;
    return { r, classement, revelation: reveler(classement, bacs), horsSelection };
  });
  const mesBus = classement.map(c => c.candidat);
  const trajets = new Map(classement.map(c => [c.candidat.id, c.trajet]));
  const enAvant = new Set(revelation.focus.map(f => f.candidat.id));
  const voies = new Map(mesBus.map((c, i) => [c.id, ((i % 5) - 2) * 3]));
  const ligneDe = (id: string) => LIGNES[id]!;

  let distances = $state<Record<string, number>>(Object.fromEntries(mesBus.map(c => [c.id, R0])));
  let vue = $state<Vue>(PORTRAIT ? cadrer([px(MAISON)[0], px(GARE)[0]], [px(MAISON)[1], px(GARE)[1]], 70, MIN_SUIVI) : [0, 0, LARGEUR, HAUTEUR]);
  let phase = $state<"pret" | "route" | "fin">("pret");
  let statut = $state("Tous les bus attendent à la gare.");
  let selectionne = $state<string | null>(null);
  // Après l'arrivée, la peinture est grattée : chaque bus prend l'apparence de ce qu'il vaut vraiment pour toi.
  let gratte = $state(false);
  let passer = false;
  // Rétroviseur : null = position finale ; k = rejouer l'état après la k-ième étape (0 = départ).
  let curseur = $state<number | null>(null);
  const NB_ETAPES = r.passages.length;

  const bus = $derived(mesBus.map(c => ({
    id: c.id, niveau: gratte ? niveauReel(trajets.get(c.id)!.arrets) : bacs[c.id] ?? "inconnu", ligne: ligneDe(c.id), d: distances[c.id]!,
    voie: voies.get(c.id)!, attenue: phase === "fin" && !enAvant.has(c.id),
  })));

  // À l'arrivée : étiquettes et trajet à pied pour les bus mis en avant, plus celui que tu as touché.
  const montres = $derived(phase !== "fin" || (curseur !== null && curseur < NB_ETAPES) ? [] : classement.filter(c => enAvant.has(c.candidat.id) || c.candidat.id === selectionne));
  const pietons = $derived<Pieton[]>(montres.map(c => ({
    id: c.candidat.id, points: aPied(ligneDe(c.candidat.id), c.trajet.distance), accent: c === revelation.meilleur,
  })));
  const etiquettes = $derived<Etiquette[]>(placerEtiquettes(montres));

  function placerEtiquettes(liste: typeof classement): Etiquette[] {
    const infos = liste.map(f => {
      const p = positionBus(ligneDe(f.candidat.id), f.trajet.distance, voies.get(f.candidat.id)!);
      // Nom de famille seulement : pastilles plus courtes, donc zoom plus serré (le tableau garde les noms complets).
      const nom = f.candidat.nom.slice(f.candidat.nom.indexOf(" ") + 1);
      const texte = `${nom} · ${arrets(f.trajet.arrets)}`;
      return { id: f.candidat.id, x: p.x, y: p.y, largeur: texte.length * 10.4 + 26 + (urlPhoto(f.candidat.id) ? 32 : 0), texte };
    });
    const [mx, my] = px(MAISON), [gx, gy] = px(GARE);
    const places = placer(infos, [
      { x1: mx - 60, y1: my - 60, x2: mx + 60, y2: my + 34 },
      { x1: gx - 20, y1: gy - 40, x2: gx + 140, y2: gy + 20 },
    ]);
    return infos.map((info, i) => ({
      id: info.id, x: places[i]!.x, y: places[i]!.y, largeur: info.largeur, texte: info.texte,
      cible: { x: info.x, y: info.y }, accent: info.id === revelation.meilleur.candidat.id,
    }));
  }

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
        for (const c of mesBus) {
          const but = trajets.get(c.id)!.etapes[p.index] ?? R0;
          distances[c.id] = depart[c.id]! + (but - depart[c.id]!) * t;
        }
        if (PORTRAIT) suivre();
      });
    }
    for (const c of mesBus) distances[c.id] = trajets.get(c.id)!.distance;
    statut = matchMedia("(pointer: coarse)").matches
      ? "Terminus, tout le monde descend. Deux doigts pour déplacer la carte, touche un bus pour savoir pourquoi il s'arrête là."
      : "Terminus, tout le monde descend. Fais glisser la carte et clique sur un bus pour savoir pourquoi il s'arrête là.";
    passer = false;
    phase = "fin";
    await tick();
    await recentrer();
    // Un temps pour voir les bus tels que tu les imaginais… puis on gratte la peinture.
    await new Promise(r => setTimeout(r, reduit() ? 0 : 900));
    gratte = true;
    statut = `On a gratté la peinture : chaque bus montre maintenant ce qu'il vaut vraiment pour toi, selon l'endroit où il s'arrête. ${statut.slice(statut.indexOf(".") + 2)}`;
  }

  /** Caméra : cadre la maison, la gare et tous les bus, en suivant doucement leur progression. */
  function suivre(lissage = 0.12) {
    const pts = [px(MAISON), px(GARE), ...mesBus.map(c => {
      const p = positionBus(ligneDe(c.id), distances[c.id]!, 0);
      return [p.x, p.y] as [number, number];
    })];
    const cible = cadrer(pts.map(p => p[0]), pts.map(p => p[1]), 70, MIN_SUIVI);
    vue = vue.map((v, i) => v + (cible[i]! - v) * lissage) as Vue;
  }

  /** Plus petit cadre aux proportions de la carte qui contient ces points. */
  function cadrer(xs: number[], ys: number[], marge: number, largeurMin: number): Vue {
    let w = Math.max(...xs) - Math.min(...xs) + 2 * marge, h = Math.max(...ys) - Math.min(...ys) + 2 * marge;
    if (w / h < RATIO) w = h * RATIO; else h = w / RATIO;
    if (w < largeurMin) { w = largeurMin; h = w / RATIO; }
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    return [cx - w / 2, cy - h / 2, w, h];
  }

  /** Recadre sur ta maison et les bus étiquetés. */
  async function recentrer() {
    const [mx, my] = px(MAISON);
    const xs = [mx - 70, mx + 70, ...etiquettes.flatMap(e => [e.x - e.largeur / 2, e.x + e.largeur / 2, e.cible.x - 34, e.cible.x + 34])];
    const ys = [my - 70, my + 40, ...etiquettes.flatMap(e => [e.y - 20, e.y + 20, e.cible.y - 24, e.cible.y + 24])];
    const de = [...vue] as Vue, vers = cadrer(xs, ys, 30, MIN_ZOOM);
    await animer(900, t => { vue = de.map((v, i) => v + (vers[i]! - v) * t) as Vue; });
  }

  function zoom(f: number) {
    const [x, y, w, h] = vue;
    const nw = Math.min(2400, Math.max(240, w * f)), nh = nw / RATIO;
    vue = [x + (w - nw) / 2, y + (h - nh) / 2, nw, nh];
  }

  function rejouer(k: number) {
    curseur = Math.max(0, Math.min(NB_ETAPES, k));
    for (const c of mesBus) distances[c.id] = distanceA(trajets.get(c.id)!, r.passages, curseur);
  }

  const nomCourt = (id: string) => { const n = mesBus.find(c => c.id === id)?.nom ?? id; return n.slice(n.indexOf(" ") + 1); };
  const pasTexte = (p: number) => `${Math.abs(p)} pas`;
  /** Ce qui s'est passé à l'étape affichée par le rétroviseur. */
  const etapeTexte = $derived.by(() => {
    const k = curseur ?? NB_ETAPES;
    if (k === 0) return "Départ : tous les bus attendent à la gare.";
    const p = r.passages[k - 1]!;
    const q = NB_ETAPES === r.ordre.length ? parId.get(r.ordre[p.index]!) : undefined;
    const quoi = q ? `« ${q.texte} » Ta réponse : ${libelleReponse(reponses[q.id])}.` : `${p.libelle}.`;
    const m = mouvements(trajets, r.passages, k);
    const avance = m[0], recule = m.at(-1);
    const bouge = [
      avance && avance.pas > 0 ? `Le bus de ${nomCourt(avance.id)} avance le plus (${pasTexte(avance.pas)}).` : "",
      recule && recule.pas < 0 ? `Celui de ${nomCourt(recule.id)} recule le plus (${pasTexte(recule.pas)}).` : "",
    ].filter(Boolean).join(" ") || "Aucun bus ne bouge.";
    return `Étape ${k} sur ${NB_ETAPES} : ${quoi} ${bouge}`;
  });

  /** Touché sur la carte ou « Pourquoi ? » dans le tableau. */
  async function choisir(id: string) {
    selectionne = id;
    await tick();
    document.getElementById("titre-explication")?.scrollIntoView({ behavior: reduit() ? "auto" : "smooth", block: "nearest" });
  }

  const choisi = $derived(selectionne ? classement.find(c => c.candidat.id === selectionne) : undefined);

  onMount(() => {
    const minuteur = setTimeout(partir, 600);
    return () => { passer = true; clearTimeout(minuteur); };
  });
</script>

<h1 tabindex="-1">{phase === "fin" ? "Terminus !" : "Le grand départ"}</h1>
<div class="boite carte">
  <Carte {bus} bind:vue ratio={RATIO} {pietons} {etiquettes} interactive={phase === "fin"} {selectionne} onChoisir={choisir} />
  {#if phase === "fin"}
    <div class="commandes">
      <button onclick={() => zoom(0.7)} aria-label="Zoomer">+</button>
      <button onclick={() => zoom(1.4)} aria-label="Dézoomer">−</button>
      <button onclick={recentrer} aria-label="Recentrer sur chez toi">⌂</button>
    </div>
  {/if}
</div>
<p class="rangee statut">
  <span aria-live="polite">{statut}</span>
  {#if phase === "route"}<button class="discret" onclick={() => (passer = true)}>Passer l'animation</button>{/if}
</p>

{#if phase === "fin"}
  <div class="retroviseur boite">
    <label for="retroviseur" class="etiquette-signal">Rétroviseur : rejoue le trajet</label>
    <div class="curseur">
      <button onclick={() => rejouer((curseur ?? NB_ETAPES) - 1)} aria-label="Étape précédente" disabled={curseur === 0}>◀</button>
      <input id="retroviseur" type="range" min="0" max={NB_ETAPES} step="1" value={curseur ?? NB_ETAPES}
        oninput={e => rejouer(Number(e.currentTarget.value))} aria-valuetext={`Étape ${curseur ?? NB_ETAPES} sur ${NB_ETAPES}`} />
      <button onclick={() => rejouer((curseur ?? NB_ETAPES) + 1)} aria-label="Étape suivante" disabled={curseur === null || curseur === NB_ETAPES}>▶</button>
    </div>
    <p aria-live="polite">{etapeTexte}</p>
  </div>
{/if}

{#if choisi}
  <Explication candidat={choisi.candidat} trajet={choisi.trajet} bac={bacs[choisi.candidat.id] ?? "inconnu"}
    ordre={r.ordre} {reponses} positions={positions[choisi.candidat.id] ?? {}} onFermer={() => (selectionne = null)} />
{/if}

{#if phase === "fin"}
  <Resultats {revelation} {classement} {bacs} {horsSelection} onPourquoi={choisir} {onRecommencer} />
{/if}

<style>
  .carte { padding: 0; overflow: hidden; position: relative; }
  .commandes { position: absolute; right: 8px; top: 8px; display: flex; flex-direction: column; gap: 6px; }
  .commandes button { width: 48px; min-height: 48px; padding: 0; font-size: 22px; line-height: 1; box-shadow: 0 1px 4px rgb(0 0 0 / 0.15); }
  .retroviseur { margin: 4px 0 14px; }
  .retroviseur p { margin: 8px 0 0; }
  .curseur { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
  .curseur input { flex: 1; min-width: 0; height: 44px; accent-color: var(--jaune); }
  .curseur button { width: 48px; padding: 0; flex: none; }
  .statut { justify-content: space-between; color: var(--discret); margin-top: 8px; min-height: 48px; }
</style>

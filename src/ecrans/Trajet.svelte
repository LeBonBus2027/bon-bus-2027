<script lang="ts">
  import { onMount, tick, untrack } from "svelte";
  import Carte, { type Pieton } from "../lib/Carte.svelte";
  import { tirageCrypto } from "../lib/aleatoire";
  import { animer, mouvementReduit } from "../lib/animation";
  import { classer, R0, trajet, type Reponse } from "../lib/calcul";
  import { cadrer, entre, zoomer, type Vue } from "../lib/camera";
  import { candidats, grandTheme, positions, questions } from "../lib/donnees";
  import { etiquettesPour } from "../lib/etiquettesCarte";
  import type { Niveau } from "../lib/niveaux";
  import { distanceA } from "../lib/retroviseur";
  import { questionsPourAffiner } from "../lib/affiner";
  import { melanger } from "../lib/aleatoire";
  import { rejeu, reveler } from "../lib/revelation";
  import { aPied, GARE, HAUTEUR, LARGEUR, lignes, MAISON, positionBus, px } from "../lib/ville";
  import Diaporama from "./Diaporama.svelte";
  import Explication from "./Explication.svelte";
  import Priorites from "./Priorites.svelte";
  import Resultats from "./Resultats.svelte";
  import Retroviseur from "./Retroviseur.svelte";

  let { bacs, reponses, ordre, onRecommencer, onAffiner }: {
    bacs: Record<string, Niveau>;
    reponses: Record<string, Reponse>;
    ordre: string[];
    onRecommencer: () => void;
    /** Reçoit les 10 questions choisies pour départager les bus les plus proches. */
    onAffiner?: (ids: string[]) => void;
  } = $props();

  // Sur mobile, cadre en portrait qui suit les bus ; sur grand écran, toute la ville d'un coup d'œil.
  const PORTRAIT = matchMedia("(max-width: 600px)").matches;
  const RATIO = PORTRAIT ? 0.8 : LARGEUR / HAUTEUR;
  const MIN_ZOOM = PORTRAIT ? 380 : 600;
  const MIN_SUIVI = PORTRAIT ? 440 : 560;
  const LIGNES = lignes(candidats.map(c => c.id));   // toujours les 21 : chaque candidat garde sa ligne
  const parId = new Map(questions.map(q => [q.id, q]));

  const r = untrack(() => rejeu(ordre, reponses, parId));
  const mesBus = untrack(() => candidats.filter(c => c.id in bacs));
  // Tirés une fois pour toutes : ni le départage des ex-aequo ni la métaphore ne changent quand on modifie ses priorités.
  const CLES = new Map(candidats.map(c => [c.id, tirageCrypto()]));
  const GRAINE_METAPHORE = tirageCrypto();

  // « Ce qui compte pour toi » : jusqu'à 3 grands thèmes dont les questions comptent double.
  const THEMES = [...new Set(r.ordre.map(q => grandTheme(parId.get(q)!)))];
  const MAX_PRIORITES = 3;
  let prioritaires = $state<string[]>([]);

  const calcul = $derived.by(() => {
    const poids = (q: string) => (prioritaires.includes(grandTheme(parId.get(q)!)) ? 2 : 1);
    let i = 0;
    const tous = classer(candidats, c => trajet(r.ordre, reponses, positions[c.id] ?? {}, poids), () => CLES.get(candidats[i++]!.id)!);
    const classement = tous.filter(c => c.candidat.id in bacs);
    const autre = tous.find(c => !(c.candidat.id in bacs));
    const horsSelection = autre && autre.trajet.distance < classement[0]!.trajet.distance ? autre : undefined;
    return { classement, revelation: reveler(classement, bacs, () => GRAINE_METAPHORE), horsSelection };
  });
  const classement = $derived(calcul.classement);
  const revelation = $derived(calcul.revelation);
  const horsSelection = $derived(calcul.horsSelection);
  const trajets = $derived(new Map(classement.map(c => [c.candidat.id, c.trajet])));
  const enAvant = $derived(new Set(revelation.focus.map(f => f.candidat.id)));
  const voies = new Map(mesBus.map((c, i) => [c.id, ((i % 5) - 2) * 3]));
  const ligneDe = (id: string) => LIGNES[id]!;
  const voie = (id: string) => voies.get(id)!;

  let distances = $state<Record<string, number>>(Object.fromEntries(mesBus.map(c => [c.id, R0])));
  let vue = $state<Vue>(PORTRAIT ? cadrer([px(MAISON)[0], px(GARE)[0]], [px(MAISON)[1], px(GARE)[1]], 70, MIN_SUIVI, RATIO) : [0, 0, LARGEUR, HAUTEUR]);
  // diapo : révélation pas à pas dans la fenêtre de la carte ; fin : carte libre et page récap.
  let phase = $state<"pret" | "route" | "diapo" | "fin">("pret");
  const arrive = $derived(phase === "diapo" || phase === "fin");
  let statut = $state("Tous les bus attendent à la gare.");
  let selectionne = $state<string | null>(null);
  // Après l'arrivée, la peinture est grattée : chaque bus prend l'apparence de ce qu'il vaut vraiment pour toi.
  let gratte = $state(false);
  let passer = false;
  // Rétroviseur : null = position finale ; k = rejouer l'état après la k-ième étape (0 = départ).
  let curseur = $state<number | null>(null);
  let enMouvement = $state(false);
  const NB_ETAPES = r.passages.length;
  const arreter = () => passer;

  const bus = $derived(mesBus.map(c => ({
    id: c.id, niveau: gratte ? revelation.peinture[c.id] ?? "bof" : bacs[c.id] ?? "inconnu", ligne: ligneDe(c.id), d: distances[c.id]!,
    voie: voie(c.id), attenue: arrive && !enAvant.has(c.id),
  })));

  // À l'arrivée : étiquettes et trajet à pied pour les bus mis en avant, plus celui que tu as touché.
  const montres = $derived(!arrive || enMouvement || (curseur !== null && curseur < NB_ETAPES) ? [] : classement.filter(c => enAvant.has(c.candidat.id) || c.candidat.id === selectionne));
  const pietons = $derived<Pieton[]>(montres.map(c => ({
    id: c.candidat.id, points: aPied(ligneDe(c.candidat.id), c.trajet.distance), accent: c === revelation.meilleur,
  })));
  const etiquettes = $derived(etiquettesPour(montres, ligneDe, voie, revelation.meilleur.candidat.id));

  /** Déplace tous les bus vers des distances cibles, en douceur. */
  async function deplacer(cible: (id: string) => number, ms: number, chaqueImage?: () => void) {
    const depart = { ...distances };
    await animer(ms, t => {
      for (const c of mesBus) distances[c.id] = depart[c.id]! + (cible(c.id) - depart[c.id]!) * t;
      chaqueImage?.();
    }, arreter);
  }

  async function partir() {
    phase = "route";
    const duree = r.passages.length > 20 ? 1100 : 380;
    for (const p of r.passages) {
      if (passer) break;
      statut = p.libelle;
      await deplacer(id => trajets.get(id)!.etapes[p.index] ?? R0, duree, PORTRAIT ? () => suivre() : undefined);
    }
    for (const c of mesBus) distances[c.id] = trajets.get(c.id)!.distance;
    passer = false;
    statut = "";
    phase = "diapo";
    await tick();
    // Le diaporama s'ouvre sous la ville : on remonte le cadre en haut de l'écran pour voir les deux.
    document.querySelector(".carte")?.scrollIntoView({ behavior: mouvementReduit() ? "auto" : "smooth", block: "start" });
    await recentrer();
  }

  /** Diaporama : on gratte la peinture, et on laisse le temps de voir les bus changer sur la carte. */
  async function gratter() {
    gratte = true;
    await new Promise(fin => setTimeout(fin, mouvementReduit() ? 0 : 1400));
  }

  /** Fin du diaporama : la carte devient libre et la page récap s'affiche. */
  async function terminer() {
    gratte = true;
    phase = "fin";
    statut = matchMedia("(pointer: coarse)").matches
      ? "Chaque bus montre ce qu'il vaut vraiment pour toi. Deux doigts pour déplacer la carte, touche un bus pour savoir pourquoi il s'arrête là."
      : "Chaque bus montre ce qu'il vaut vraiment pour toi. Fais glisser la carte et clique sur un bus pour savoir pourquoi il s'arrête là.";
    await tick();
    const recap = document.getElementById("titre-recap");
    recap?.focus({ preventScroll: true });
    recap?.scrollIntoView({ behavior: mouvementReduit() ? "auto" : "smooth", block: "start" });
    await recentrer();
  }

  /** Caméra : cadre la maison, la gare et tous les bus, en suivant doucement leur progression. */
  function suivre(lissage = 0.12) {
    const pts = [px(MAISON), px(GARE), ...mesBus.map(c => {
      const p = positionBus(ligneDe(c.id), distances[c.id]!, 0);
      return [p.x, p.y] as [number, number];
    })];
    vue = entre(vue, cadrer(pts.map(p => p[0]), pts.map(p => p[1]), 70, MIN_SUIVI, RATIO), lissage);
  }

  /** Recadre sur ta maison et les bus étiquetés. */
  async function recentrer() {
    const [mx, my] = px(MAISON);
    const xs = [mx - 70, mx + 70, ...etiquettes.flatMap(e => [e.x - e.largeur / 2, e.x + e.largeur / 2, e.cible.x - 34, e.cible.x + 34])];
    const ys = [my - 70, my + 40, ...etiquettes.flatMap(e => [e.y - 20, e.y + 20, e.cible.y - 24, e.cible.y + 24])];
    const de = [...vue] as Vue, vers = cadrer(xs, ys, 30, MIN_ZOOM, RATIO);
    await animer(900, t => { vue = entre(de, vers, t); }, arreter);
  }

  /** Après un changement de priorités : les bus glissent vers leurs nouvelles positions. */
  let carteMontree = false;
  async function glisser() {
    // Au premier changement, on remonte à la carte pour voir les bus bouger (une seule fois, pour ne pas gêner ensuite).
    if (!carteMontree) {
      carteMontree = true;
      document.querySelector(".carte")?.scrollIntoView({ behavior: mouvementReduit() ? "auto" : "smooth", block: "start" });
    }
    curseur = null;
    enMouvement = true;
    await deplacer(id => trajets.get(id)!.distance, 700);
    enMouvement = false;
  }

  function rejouer(k: number) {
    curseur = Math.max(0, Math.min(NB_ETAPES, k));
    for (const c of mesBus) distances[c.id] = distanceA(trajets.get(c.id)!, r.passages, curseur);
  }

  // Questions pas encore posées (ni répondues ni passées).
  const restantes = untrack(() => questions.filter(q => !ordre.includes(q.id)).map(q => q.id));

  /** 10 questions là où les 3 bus les plus proches divergent le plus, ou toutes les restantes (mélangées). */
  function affiner(mode: "cible" | "tout") {
    onAffiner?.(mode === "tout"
      ? melanger(restantes)
      : questionsPourAffiner(ordre, classement.slice(0, 3).map(c => c.candidat.id), positions, questions));
  }

  /** Touché sur la carte ou « Pourquoi ? » dans le tableau. */
  async function choisir(id: string) {
    selectionne = id;
    await tick();
    document.getElementById("titre-explication")?.scrollIntoView({ behavior: mouvementReduit() ? "auto" : "smooth", block: "nearest" });
  }

  const choisi = $derived(selectionne ? classement.find(c => c.candidat.id === selectionne) : undefined);

  onMount(() => {
    const minuteur = setTimeout(partir, 600);
    return () => { passer = true; clearTimeout(minuteur); };
  });
</script>

<h1 tabindex="-1">{arrive ? "Terminus !" : "Le grand départ"}</h1>
<div class="boite carte">
  <Carte {bus} bind:vue ratio={RATIO} {pietons} {etiquettes} interactive={phase === "fin"} {selectionne} onChoisir={choisir} />
  {#if phase === "fin"}
    <div class="commandes">
      <button onclick={() => (vue = zoomer(vue, 0.7, RATIO))} aria-label="Zoomer">+</button>
      <button onclick={() => (vue = zoomer(vue, 1.4, RATIO))} aria-label="Dézoomer">−</button>
      <button onclick={recentrer} aria-label="Recentrer sur chez toi">⌂</button>
    </div>
  {/if}
  {#if phase === "diapo"}
    <Diaporama {revelation} {bacs} {gratte} onGratter={gratter} onFin={terminer} />
  {/if}
</div>
<p class="rangee statut">
  <span aria-live="polite">{statut}</span>
  {#if phase === "route"}<button class="discret" onclick={() => (passer = true)}>Passer l'animation</button>{/if}
</p>



{#if choisi}
  <Explication candidat={choisi.candidat} trajet={choisi.trajet} bac={bacs[choisi.candidat.id] ?? "inconnu"} apres={revelation.peinture[choisi.candidat.id] ?? "bof"}
    ordre={r.ordre} {reponses} positions={positions[choisi.candidat.id] ?? {}} onFermer={() => (selectionne = null)} />
{/if}

{#if phase === "fin"}
  <Resultats {revelation} {classement} {bacs} {horsSelection} onPourquoi={choisir} {onRecommencer}
    onAffiner={onAffiner ? affiner : undefined} restantes={restantes.length}>
    {#snippet outils()}
    <details class="outil">
      <summary>Certains sujets comptent plus pour toi ?</summary>
      <Priorites themes={THEMES} bind:prioritaires max={MAX_PRIORITES} onChange={glisser} />
    </details>
    <details class="outil">
      <summary>Revoir le trajet question par question</summary>
      <Retroviseur bind:curseur passages={r.passages} ordre={r.ordre} {reponses} {trajets} bus={mesBus} {parId} onRejouer={rejouer} />
    </details>
    {/snippet}
  </Resultats>
{/if}

<style>
  .carte { padding: 0; overflow: hidden; position: relative; }
  .commandes { position: absolute; right: 8px; top: 8px; display: flex; flex-direction: column; gap: 6px; }
  .commandes button { width: 48px; min-height: 48px; padding: 0; font-size: 22px; line-height: 1; box-shadow: 0 1px 4px rgb(0 0 0 / 0.15); }
  .statut { justify-content: space-between; color: var(--discret); margin-top: 8px; min-height: 48px; }
  /* Outils repliés de la page récap : ils ne s'ouvrent que si on en a envie. */
  .outil { border: 2px solid var(--trait); border-radius: var(--rayon); margin: 0 0 10px; background: var(--carte); }
  .outil summary { min-height: 48px; padding: 12px 14px; font-weight: 700; }
  .outil :global(.boite) { margin: 0; padding-top: 4px; }
</style>

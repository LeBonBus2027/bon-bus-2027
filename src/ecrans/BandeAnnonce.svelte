<script lang="ts">
  import Bus from "../lib/Bus.svelte";
  import BusAnime from "../lib/BusAnime.svelte";
  import Carte, { type BusSurCarte } from "../lib/Carte.svelte";
  import Maison from "../lib/Maison.svelte";
  import { mouvementReduit } from "../lib/animation";
  import { BAC, NIVEAUX, type Niveau } from "../lib/niveaux";
  import { GARE, lignes, MAISON, positionBus, px } from "../lib/ville";

  /**
   * Bande-annonce de l'accueil : 45 secondes, sans son, pour comprendre le jeu avant de commencer.
   * Bus anonymes (aucun candidat, aucune couleur de parti). Le décor est caché aux lecteurs d'écran,
   * qui lisent à la place la liste des étapes. Pause possible à tout moment (WCAG 2.2.2), jouée une seule fois.
   * Si l'utilisateur a demandé moins d'animations : les étapes en vignettes fixes, rien ne bouge.
   */
  let { onPasser }: { onPasser: () => void } = $props();

  interface Scene { duree: number; legende: string; lecture: string }
  const SCENES: Scene[] = [
    { duree: 5000, legende: "Quel bus te ramène chez toi ?", lecture: "LeBonBus2027 : quel bus te ramène chez toi ?" },
    { duree: 8000, legende: "Range-les selon ton ressenti",
      lecture: "Cinq bus anonymes attendent à la gare. Range les candidats selon ton ressenti : chaque bac habille son bus, de l'autocar de luxe à l'épave." },
    { duree: 8000, legende: "Réponds aux questions : ta maison se construit", lecture: "Réponds aux questions : à chaque réponse, ta maison se construit." },
    { duree: 9000, legende: "Chaque réponse fait avancer ou reculer les bus",
      lecture: "Les bus partent de la gare. Chaque réponse les fait avancer vers chez toi ou reculer, selon qu'ils sont d'accord avec toi ou non." },
    { duree: 9000, legende: "On gratte la peinture : le plus proche devient le plus beau",
      lecture: "On gratte la peinture : chaque bus prend l'apparence de ce qu'il vaut vraiment. L'autocar de luxe, arrivé loin de chez toi, tombe en panne et fume. Un bus « bof », arrivé tout près, devient un autocar de luxe et brille." },
    { duree: 6000, legende: "À toi de jouer !", lecture: "Aucun bus ne te dépose pile devant chez toi. Prends celui qui te rapproche le plus." },
  ];
  const DEBUTS = SCENES.map((_, i) => SCENES.slice(0, i).reduce((s, sc) => s + sc.duree, 0));
  const DUREE = DEBUTS.at(-1)! + SCENES.at(-1)!.duree;
  /** Temps local d'une scène figée sur sa fin (vignettes, ou après « Passer »). */
  const FIN = Infinity;

  // Cinq bus anonymes : leur bac, ce qu'ils valent vraiment une fois arrivés, et leurs pas (− = vers chez toi) à chaque réponse.
  interface BusDemo { id: string; bac: Niveau; vrai: Niveau; pas: number[] }
  const BUS: BusDemo[] = [
    { id: "b1", bac: "adore", vrai: "jamais", pas: [1, -1, 2, 1, 0] },
    { id: "b2", bac: "bien", vrai: "bien", pas: [-1, -1, 1, -2, -2] },
    { id: "b3", bac: "bof", vrai: "adore", pas: [-2, -1, -2, -1, -2] },
    { id: "b4", bac: "pas", vrai: "bof", pas: [1, -2, -1, 1, -2] },
    { id: "b5", bac: "jamais", vrai: "pas", pas: [-1, 1, 1, -1, -1] },
  ];
  const NOM_BUS = Object.fromEntries(NIVEAUX.map(n => [n.cle, n.bus])) as Record<Niveau, string>;
  const LIGNES = lignes(BUS.map(b => b.id));
  const GARE_D = 10;   // la gare est à 10 arrêts de la maison
  // Bus plus gros que sur le vrai plan (lisibles sur téléphone) : on les décale un peu pour qu'ils ne s'empilent pas à la gare.
  const depart = (i: number) => GARE_D + (i - 2) * 0.3;
  const VOIE = (i: number) => (i - 2) * 8;
  const ECHELLE = 0.42;
  const RATIO = 3 / 2;

  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
  const doux = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
  const arrivee = (b: BusDemo) => depart(BUS.indexOf(b)) + b.pas.reduce((s, p) => s + p, 0);
  /** Une réponse toutes les 1,5 s ; chaque bus fait son pas en 0,8 s. */
  const distance = (b: BusDemo, t: number) =>
    b.pas.reduce((d, p, k) => d + p * doux(clamp01((t - 600 - k * 1500) / 800)), depart(BUS.indexOf(b)));

  // Cadre de la carte : la maison, la gare et tous les bus, au format de l'écran.
  const VUE = ((): [number, number, number, number] => {
    const pts: [number, number][] = [px(MAISON), px(GARE), [px(GARE)[0] + 170, px(GARE)[1] - 34], [px(MAISON)[0], px(MAISON)[1] + 46]];
    BUS.forEach((b, i) => {
      for (const d of [arrivee(b), depart(i) + 1]) { const p = positionBus(LIGNES[b.id]!, d, VOIE(i)); pts.push([p.x, p.y]); }
    });
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    let x = Math.min(...xs) - 50, y = Math.min(...ys) - 50, w = Math.max(...xs) + 50 - x, h = Math.max(...ys) + 50 - y;
    if (w / h < RATIO) { x -= (h * RATIO - w) / 2; w = h * RATIO; } else { y -= (w / RATIO - h) / 2; h = w / RATIO; }
    return [x, y, w, h];
  })();

  function busCarte(t: number, gratte: boolean, caches: string[] = []): BusSurCarte[] {
    return BUS.map((b, i) => ({
      id: b.id, niveau: gratte ? b.vrai : b.bac, ligne: LIGNES[b.id]!, voie: VOIE(i),
      d: Number.isFinite(t) ? distance(b, t) : arrivee(b), attenue: caches.includes(b.id),
    }));
  }
  /** Où poser un bus animé pour qu'il recouvre exactement le bus du plan (en % du cadre), et où mettre sa bulle. */
  function surEcran(b: BusDemo) {
    const p = positionBus(LIGNES[b.id]!, arrivee(b), VOIE(BUS.indexOf(b)));
    const x = ((p.x - VUE[0]) / VUE[2]) * 100, y = ((p.y - VUE[1]) / VUE[3]) * 100;
    return {
      x, y, largeur: ((240 * ECHELLE) / VUE[2]) * 100,
      // Repère des bus : 240 × 112 depuis (−34, −8), centre du bus en (100, 55).
      transformation: `translate(-55.8%, -56.25%) rotate(${p.angle.toFixed(1)}deg) scaleY(${p.retourne ? -1 : 1})`,
      bulle: { x: Math.max(20, Math.min(80, x)), y: y < 50 ? y + 11 : y - 11 },
    };
  }
  const LUXE = BUS[0]!, SURPRISE = BUS[2]!;

  // --- Lecture.
  let reduit = $state(mouvementReduit());
  $effect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const suivre = () => { reduit = m.matches; };
    m.addEventListener("change", suivre);
    return () => m.removeEventListener("change", suivre);
  });

  let temps = $state(0);
  let lecture = $state(true);
  let visible = $state(true);
  let tour = $state(0);
  let ecran: HTMLDivElement | undefined = $state();
  const fini = $derived(temps >= DUREE);
  const scene = $derived(Math.max(0, DEBUTS.findLastIndex(d => temps >= d)));
  const t = $derived(fini ? FIN : temps - DEBUTS[scene]!);
  // En pause (ou hors de l'écran), tout se fige, y compris les animations CSS des bus.
  const arret = $derived(!fini && (!lecture || !visible));

  $effect(() => {
    if (reduit || !lecture || !visible || fini) return;
    let avant = performance.now();
    let id = requestAnimationFrame(function image(now) {
      temps = Math.min(DUREE, temps + Math.min(100, now - avant));
      avant = now;
      if (temps < DUREE) id = requestAnimationFrame(image);
    });
    return () => cancelAnimationFrame(id);
  });

  // On n'avance que si la bande-annonce est à l'écran : personne ne rate le début en faisant défiler.
  $effect(() => {
    if (!ecran) return;
    const obs = new IntersectionObserver(([e]) => { visible = e!.isIntersecting; }, { threshold: 0.3 });
    obs.observe(ecran);
    return () => obs.disconnect();
  });

  function basculer() {
    if (fini) { temps = 0; tour += 1; lecture = true; }
    else lecture = !lecture;
  }
  function passer() {
    temps = DUREE;
    lecture = false;
    onPasser();
  }
</script>

{#snippet logo()}
  <div class="s-logo">
    <p class="logo">LeBonBus<span>2027</span></p>
    <span class="route"></span>
    <svg class="roule" viewBox="-34 -8 240 112"><Bus niveau="inconnu" /></svg>
  </div>
{/snippet}

{#snippet ranger(t: number)}
  {@const courant = Number.isFinite(t) ? Math.min(BUS.length - 1, Math.floor((t - 800) / 1300)) : -1}
  <div class="s-ranger">
    <p class="pancarte">Gare routière</p>
    <p class="bac">
      {#if courant >= 0}
        {#key courant}<span class="pastille">{BAC[BUS[courant]!.bac]}</span><span class="nom-bus">{NOM_BUS[BUS[courant]!.bac]}</span>{/key}
      {/if}
    </p>
    <ul class="garage">
      {#each BUS as b, i (b.id)}
        <li class:actif={i === courant}>
          <svg viewBox="-34 -8 240 112">
            {#if !Number.isFinite(t) || t >= 800 + i * 1300}<g class="mue"><Bus niveau={b.bac} /></g>{:else}<Bus niveau="inconnu" />{/if}
          </svg>
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

{#snippet maison(t: number)}
  {@const p = Number.isFinite(t) ? clamp01((t - 400) / 6800) : 1}
  {@const appui = Number.isFinite(t) && p < 1 && t % 700 < 350 ? Math.floor(t / 700) % 3 : -1}
  <div class="s-maison">
    <div class="fiche">
      <span class="num">Question {1 + Math.min(19, Math.floor(p * 20))} sur 20</span>
      <span class="ligne"></span><span class="ligne courte"></span>
      <span class="rep" class:appuye={appui === 0 || appui === 2}>D'accord</span>
      <span class="rep" class:appuye={appui === 1}>Pas d'accord</span>
      <span class="barre"><i style:transform="scaleX({p})"></i></span>
    </div>
    <svg viewBox="0 0 60 56"><Maison progression={p} anime /></svg>
  </div>
{/snippet}

{#snippet avancer(t: number)}
  {@const reponse = Number.isFinite(t) ? Math.min(5, Math.max(0, Math.floor((t - 600) / 1500) + 1)) : 5}
  <div class="s-carte">
    <Carte bus={busCarte(t, false)} vue={VUE} ratio={RATIO} tailleBus={ECHELLE} />
    {#if reponse > 0}{#key reponse}<span class="compteur">Réponse {reponse}</span>{/key}{/if}
  </div>
{/snippet}

{#snippet gratter(t: number)}
  {@const gratte = !Number.isFinite(t) || t > 700}
  {@const effets = !Number.isFinite(t) || t > 1500}
  <div class="s-carte">
    <Carte bus={busCarte(FIN, gratte, effets ? [LUXE.id, SURPRISE.id] : [])} vue={VUE} ratio={RATIO} tailleBus={ECHELLE} />
    {#if Number.isFinite(t)}<span class="grattoir"></span>{/if}
    {#if effets}
      {@const loin = surEcran(LUXE)}
      {@const pres = surEcran(SURPRISE)}
      {#each [{ ou: loin, b: LUXE, effet: "panne" as const, texte: "J'adore → en panne" }, { ou: pres, b: SURPRISE, effet: "brille" as const, texte: "Bof → il brille" }] as e (e.effet)}
        <span class="effet" style:left="{e.ou.x}%" style:top="{e.ou.y}%" style:width="{e.ou.largeur}%" style:transform={e.ou.transformation}>
          <BusAnime niveau={e.b.vrai} effet={e.effet} retard={e.effet === "panne" ? 0.2 : 0.6} />
        </span>
        <span class="bulle {e.effet}" style:left="{e.ou.bulle.x}%" style:top="{e.ou.bulle.y}%">{e.texte}</span>
      {/each}
    {/if}
  </div>
{/snippet}

{#snippet morale(texte: boolean)}
  <div class="s-morale">
    <svg class="rue" viewBox="0 0 300 70" aria-hidden="true">
      <rect width="300" height="70" fill="#dfe5ec" />
      <rect y="52" width="300" height="14" fill="#ffffff" />
      <g transform="translate(236 0)"><Maison progression={1} /></g>
      <polyline class="pied" points="108,60 250,60 264,50" fill="none" stroke="#0b1f3a" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="0 8" />
      <g class="arrivee"><svg x="16" y="14" width="110" height="51" viewBox="-34 -8 240 112"><Bus niveau="adore" /></svg></g>
    </svg>
    {#if texte}
      <p class="message"><span>Aucun bus ne te dépose pile devant chez toi.</span> <span class="fort">Prends celui qui te rapproche le plus.</span></p>
    {/if}
  </div>
{/snippet}

<section class="bande" aria-labelledby="bande-titre">
  <h2 id="bande-titre" class="etiquette-signal">Comment ça marche{reduit ? "" : " · 45 secondes"}</h2>

  {#if reduit}
    <ol class="vignettes fixe">
      <li><div class="scene" aria-hidden="true">{@render ranger(FIN)}</div><p>{SCENES[1]!.legende}</p></li>
      <li><div class="scene" aria-hidden="true">{@render maison(FIN)}</div><p>{SCENES[2]!.legende}</p></li>
      <li><div class="scene" aria-hidden="true">{@render avancer(FIN)}</div><p>{SCENES[3]!.legende}</p></li>
      <li><div class="scene" aria-hidden="true">{@render gratter(FIN)}</div><p>{SCENES[4]!.legende}</p></li>
      <li><div class="scene nuit">{@render morale(true)}</div><p>{SCENES[5]!.legende}</p></li>
    </ol>
  {:else}
    <div class="ecran" class:arret bind:this={ecran} data-scene={scene} data-temps={Math.floor(temps / 100)}>
      <div class="scene" class:nuit={scene === 0 || scene === 5} aria-hidden="true">
        {#key tour}
          {#if scene === 0}{@render logo()}
          {:else if scene === 1}{@render ranger(t)}
          {:else if scene === 2}{@render maison(t)}
          {:else if scene === 3}{@render avancer(t)}
          {:else if scene === 4}{@render gratter(t)}
          {:else}{@render morale(true)}
          {/if}
        {/key}
      </div>
      <p class="legende" aria-hidden="true">{#key scene}<span>{SCENES[scene]!.legende}</span>{/key}</p>
    </div>
    <ol class="visually-hidden">
      {#each SCENES as s (s.legende)}<li>{s.lecture}</li>{/each}
    </ol>
    <div class="commandes">
      <button onclick={basculer}>
        <span aria-hidden="true">{fini ? "↻" : lecture ? "❚❚" : "▶"}</span> {fini ? "Rejouer" : lecture ? "Pause" : "Reprendre"}
      </button>
      <span class="frise" aria-hidden="true">
        {#each SCENES as s, i (s.legende)}<span><i style:transform="scaleX({clamp01((temps - DEBUTS[i]!) / s.duree)})"></i></span>{/each}
      </span>
      {#if !fini}<button class="discret" onclick={passer}>Passer</button>{/if}
    </div>
  {/if}
</section>

<style>
  .bande { max-width: 560px; margin: 4px auto 18px; }
  h2 { margin: 0 0 6px; color: var(--discret); }

  /* L'écran : une scène au format 3:2 (toujours sur fond clair, comme les cartes à bus) et sa girouette. */
  .ecran { border-radius: var(--rayon); overflow: hidden; background: var(--marque); box-shadow: 0 0 0 3px #13294a; }
  .scene { position: relative; aspect-ratio: 3 / 2; overflow: hidden; background: #ffffff; color: var(--marque); container-type: inline-size; }
  .scene.nuit { background: var(--marque); color: #ffffff; }
  .legende {
    margin: 0; min-height: 80px; display: flex; align-items: center; padding: 10px 14px;
    border-top: 4px solid var(--jaune); color: var(--jaune); font-size: 20px; font-weight: 800; line-height: 1.25;
  }
  .legende span { animation: entre 0.5s ease-out both; }
  @keyframes entre { from { opacity: 0; transform: translateY(8px); } }
  .arret :global(*), .arret :global(*::before), .arret :global(*::after) { animation-play-state: paused !important; }

  .commandes { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
  .commandes button { min-height: 44px; padding: 6px 14px; }
  .frise { flex: 1; display: flex; gap: 4px; }
  .frise span { flex: 1; height: 6px; border-radius: 3px; background: var(--trait); overflow: hidden; }
  .frise i { display: block; height: 100%; background: var(--encre); transform-origin: left; }

  /* 1. Le logo, et un bus anonyme qui arrive. */
  .s-logo { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
  .logo { margin: 0 0 14cqw; font-size: 11cqw; font-weight: 900; letter-spacing: -0.02em; line-height: 1; color: #ffffff; animation: tampon 0.8s cubic-bezier(.3, 1.5, .5, 1) both; }
  .logo span { color: var(--jaune); }
  @keyframes tampon { from { opacity: 0; transform: scale(0.6); } }
  .route { position: absolute; left: 0; right: 0; bottom: 9%; height: 3px; background: repeating-linear-gradient(90deg, var(--jaune) 0 18px, transparent 18px 32px); opacity: 0.7; }
  .roule { position: absolute; bottom: 9.5%; left: 50%; width: 30%; transform: translateX(-50%); animation: roule 2.2s cubic-bezier(.2, .8, .3, 1) 0.5s both; }
  @keyframes roule { from { transform: translateX(-260%); } }

  /* 2. La gare : les bus anonymes prennent leur peinture, bac après bac. */
  .s-ranger { position: absolute; inset: 0; display: grid; grid-template-rows: auto auto 1fr; justify-items: center; padding: 3cqw 3cqw 1cqw; background: linear-gradient(#ffffff 0 68%, #dfe5ec 68%); }
  .pancarte { margin: 0; font-size: 3.4cqw; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; background: var(--marque); color: #ffffff; padding: 0.2em 0.7em; border-radius: 4px; }
  .bac { margin: 2cqw 0 0; min-height: 15cqw; display: flex; flex-direction: column; align-items: center; }
  .pastille { font-size: 6.6cqw; font-weight: 900; line-height: 1.2; background: var(--jaune); color: var(--marque); padding: 0.05em 0.55em; border-radius: 999px; animation: tombe 0.45s cubic-bezier(.3, 1.5, .5, 1) both; }
  @keyframes tombe { from { opacity: 0; transform: translateY(-40%) scale(0.7); } }
  .nom-bus { font-size: 4.2cqw; font-weight: 800; animation: entre 0.4s ease-out 0.15s both; }
  .garage { list-style: none; margin: 0; padding: 0; width: 100%; display: flex; flex-wrap: wrap; justify-content: center; align-content: end; gap: 0 2cqw; }
  .garage li { width: 30%; border-bottom: 1cqw solid transparent; }
  .garage li.actif { border-bottom-color: var(--jaune); }
  .garage svg { display: block; width: 100%; height: auto; }
  .mue { transform-box: fill-box; transform-origin: center; animation: mue 0.7s ease-out; }
  @keyframes mue { 0% { transform: scale(0.4) rotate(-8deg); opacity: 0; } 60% { transform: scale(1.15) rotate(3deg); opacity: 1; } 100% { transform: none; } }

  /* 3. Les questions, et la maison qui se construit. */
  .s-maison { position: absolute; inset: 0; display: grid; grid-template-columns: 1.3fr 1fr; align-items: center; gap: 5cqw; padding: 5cqw; }
  .fiche { display: grid; gap: 2cqw; padding: 3.4cqw; border-radius: 8px; background: #f2f4f7; box-shadow: inset 0 0 0 2px #c9d2de; }
  .num { font-size: 3.5cqw; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #4a5b72; }
  .ligne { height: 2.4cqw; border-radius: 2px; background: #c9d2de; }
  .ligne.courte { width: 70%; }
  .rep { font-size: 4cqw; font-weight: 800; padding: 0.3em 0.6em; border: 2px solid var(--marque); border-radius: 6px; background: #ffffff; }
  .rep.appuye { background: var(--marque); color: #ffffff; }
  .barre { height: 1.8cqw; border-radius: 2px; background: #c9d2de; overflow: hidden; }
  .barre i { display: block; height: 100%; background: var(--marque); transform-origin: left; }
  .s-maison svg { width: 100%; height: auto; color: var(--marque); }

  /* 4 et 5. Le plan : les bus avancent ou reculent, puis on gratte la peinture. */
  .s-carte { position: absolute; inset: 0; }
  .compteur { position: absolute; top: 3cqw; left: 3cqw; font-size: 4.2cqw; font-weight: 900; background: var(--marque); color: var(--jaune); padding: 0.15em 0.6em; border-radius: 6px; animation: tombe 0.4s ease-out both; }
  .grattoir {
    position: absolute; inset: 0; pointer-events: none; transform: translateX(110%);
    background: linear-gradient(100deg, transparent 30%, rgb(255 205 0 / 0.6) 44%, rgb(255 255 255 / 0.9) 50%, rgb(255 205 0 / 0.6) 56%, transparent 70%);
    animation: gratte 1s ease-in-out 0.1s both;
  }
  @keyframes gratte { from { transform: translateX(-110%); } }
  .effet { position: absolute; display: block; transform-origin: 55.8% 56.25%; }
  .bulle {
    position: absolute; transform: translate(-50%, -50%); font-size: 3.8cqw; font-weight: 900; white-space: nowrap; padding: 0.15em 0.6em;
    border-radius: 999px; background: var(--marque); color: var(--jaune); box-shadow: 0 0 0 2px #ffffff; animation: bulle 0.5s cubic-bezier(.3, 1.5, .5, 1) 0.3s both;
  }
  @keyframes bulle { from { opacity: 0; transform: translate(-50%, -50%) scale(0.4); } }
  .bulle.panne { background: #c62828; color: #ffffff; }

  /* 6. La morale, en girouette. */
  .s-morale { position: absolute; inset: 0; display: grid; grid-template-rows: auto 1fr; }
  .rue { display: block; width: 100%; height: auto; color: var(--marque); }
  .arrivee { animation: arrive 1.6s cubic-bezier(.2, .8, .3, 1) both; }
  @keyframes arrive { from { transform: translateX(-140px); } }
  .pied { animation: entre 0.6s ease-out 1.6s both; }
  .message {
    margin: 0; align-self: center; padding: 2cqw 4cqw; color: var(--jaune);
    font-family: ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace; font-weight: 700; font-size: 4.6cqw; line-height: 1.35;
  }
  .message span { display: block; animation: entre 0.6s ease-out 0.3s both; }
  .message .fort { display: inline-block; margin-top: 1.5cqw; padding: 0 0.25em; background: var(--jaune); color: var(--marque); animation-delay: 1.8s; }

  /* Mouvement réduit : les étapes en vignettes fixes. */
  .vignettes { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 14px 10px; counter-reset: etape; }
  .vignettes > li:last-child { grid-column: 1 / -1; }
  .vignettes .scene { border-radius: var(--rayon); box-shadow: 0 0 0 2px var(--trait); }
  .vignettes > li > p { margin: 6px 0 0; font-size: 15.5px; font-weight: 800; line-height: 1.3; }
  .vignettes > li > p::before {
    counter-increment: etape; content: counter(etape); display: inline-grid; place-items: center; width: 1.5em; height: 1.5em; margin-right: 6px;
    border-radius: 50%; background: var(--jaune); color: var(--marque); font-weight: 900;
  }
  .fixe :global(*), .fixe :global(*::before), .fixe :global(*::after) { animation: none !important; }
</style>

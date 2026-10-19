<script lang="ts" module>
  import type { Niveau } from "./niveaux";
  import type { Noeud } from "./ville";

  export interface BusSurCarte { id: string; niveau: Niveau; ligne: readonly Noeud[]; d: number; voie: number; attenue: boolean }
  export interface Etiquette { id: string; x: number; y: number; largeur: number; texte: string; cible: { x: number; y: number }; accent: boolean }
  export interface Pieton { id: string; points: [number, number][]; accent: boolean }
</script>

<script lang="ts">
  import Bus from "./Bus.svelte";
  import { PHOTOS, urlPhoto } from "./Photo.svelte";
  import { avenue, BLOC, CANAL, COLS, dansGrille, GARE, HAUTEUR, LARGEUR, MAISON, PARC, positionBus, px, ROWS, RUES, TERMINUS } from "./ville";

  type Vue = [number, number, number, number];
  let { bus, vue = $bindable(), ratio, pietons = [], etiquettes = [], interactive = false, selectionne = null, onChoisir }: {
    bus: BusSurCarte[];
    vue: Vue;
    /** Largeur ÷ hauteur du cadre affiché (portrait sur mobile). */
    ratio: number;
    pietons?: Pieton[];
    etiquettes?: Etiquette[];
    /** Carte finale : on peut la déplacer, zoomer et toucher un bus. */
    interactive?: boolean;
    selectionne?: string | null;
    onChoisir?: (id: string) => void;
  } = $props();

  // --- Navigation. Souris : glisser pour déplacer, molette pour zoomer. Tactile : un doigt fait défiler la PAGE
  // (on ne reste jamais coincé sur la carte), deux doigts déplacent et zooment la carte. Toucher = choisir un bus.
  let svg: SVGSVGElement | undefined = $state();
  const doigts = new Map<number, { x: number; y: number }>();
  let depart: { x: number; y: number; cible: string | null } | null = null;
  let bouge = false;
  const LARGEUR_MIN = 240, LARGEUR_MAX = 2400;

  function echelle() { return vue[2] / (svg?.getBoundingClientRect().width || 1); }

  /** Zoom de facteur f autour d'un point de l'écran (coordonnées client). */
  function zoomer(f: number, cx: number, cy: number) {
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const w = Math.min(LARGEUR_MAX, Math.max(LARGEUR_MIN, vue[2] * f)), h = w / ratio;
    const ux = (cx - r.left) / r.width, uy = (cy - r.top) / r.height;
    vue = [vue[0] + (vue[2] - w) * ux, vue[1] + (vue[3] - h) * uy, w, h];
  }

  function appui(e: PointerEvent) {
    if (!interactive) return;
    svg!.setPointerCapture(e.pointerId);
    doigts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (doigts.size === 1) {
      depart = { x: e.clientX, y: e.clientY, cible: (e.target as Element).closest("[data-id]")?.getAttribute("data-id") ?? null };
      bouge = false;
    }
  }

  function deplacement(e: PointerEvent) {
    const avant = doigts.get(e.pointerId);
    if (!interactive || !avant) return;
    if (doigts.size === 1) {
      if (e.pointerType === "touch") window.scrollBy(0, avant.y - e.clientY);
      else {
        const k = echelle();
        vue = [vue[0] - (e.clientX - avant.x) * k, vue[1] - (e.clientY - avant.y) * k, vue[2], vue[3]];
      }
      if (depart && Math.hypot(e.clientX - depart.x, e.clientY - depart.y) > 6) bouge = true;
    } else if (doigts.size === 2) {
      const [a, b] = [...doigts.values()];
      const autre = a === avant ? b! : a!;
      // Déplacement du milieu des deux doigts, puis zoom selon l'écart entre eux.
      const k = echelle();
      vue = [vue[0] - ((e.clientX - avant.x) / 2) * k, vue[1] - ((e.clientY - avant.y) / 2) * k, vue[2], vue[3]];
      const d0 = Math.hypot(avant.x - autre.x, avant.y - autre.y), d1 = Math.hypot(e.clientX - autre.x, e.clientY - autre.y);
      if (d0 > 0 && d1 > 0) zoomer(d0 / d1, (e.clientX + autre.x) / 2, (e.clientY + autre.y) / 2);
      bouge = true;
    }
    doigts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  function relache(e: PointerEvent) {
    if (!interactive) return;
    doigts.delete(e.pointerId);
    if (doigts.size === 0 && depart && !bouge && depart.cible) onChoisir?.(depart.cible);
    if (doigts.size === 0) depart = null;
  }

  // La molette doit pouvoir empêcher le défilement de la page : écouteur non passif.
  $effect(() => {
    if (!svg || !interactive) return;
    const roulette = (e: WheelEvent) => { e.preventDefault(); zoomer(Math.exp(e.deltaY * 0.0015), e.clientX, e.clientY); };
    svg.addEventListener("wheel", roulette, { passive: false });
    return () => svg?.removeEventListener("wheel", roulette);
  });

  const ECHELLE = 0.28;
  // Palette « plan de transport » : rues blanches, grands axes en jaune signal, repères bleu nuit.
  const C = { sol: "#dfe5ec", pate: "#f7f9fb", parc: "#d7ebd2", arbre: "#b4d9a8", eau: "#b9d6ec",
              rue: "#ffffff", bordure: "#c9d2de", avenue: "#ffcd00", bordureAvenue: "#e0b400", nom: "#4a5b72",
              nuit: "#0b1f3a", gris: "#6b7f99" };

  // Décor fixe, calculé une seule fois. La ville se prolonge au-delà des rues utilisées par les bus.
  const EXT = { i0: -5, i1: COLS + 4, j0: -7, j1: ROWS + 6 };
  const pates: [number, number][] = [];
  for (let i = EXT.i0; i < EXT.i1; i++) for (let j = EXT.j0; j < EXT.j1; j++) {
    if (j === CANAL || (i >= PARC.i && i < PARC.i + PARC.w && j >= PARC.j && j < PARC.j + PARC.h)) continue;
    pates.push(px([i, j]));
  }
  const [parcG, parcH] = px([PARC.i, PARC.j]), [parcD, parcB] = px([PARC.i + PARC.w, PARC.j + PARC.h]);
  const arbres = [[0.22, 0.25], [0.7, 0.2], [0.35, 0.72], [0.78, 0.7], [0.5, 0.45]].map(([u, v]) => [parcG + u! * (parcD - parcG), parcH + v! * (parcB - parcH)]);
  const canalY = px([0, CANAL])[1];
  const amorces: [Noeud, Noeud][] = [];
  for (let i = EXT.i0; i <= EXT.i1; i++) for (let j = EXT.j0; j <= EXT.j1; j++) {
    for (const n of [[i + 1, j], [i, j + 1]] as Noeud[]) {
      if (dansGrille([i, j]) && dansGrille(n)) continue;          // rues de la grille : gérées par RUES
      if (n[0] > EXT.i1 || n[1] > EXT.j1) continue;
      if (j === CANAL && n[1] === CANAL + 1 && i % 3 !== 0) continue; // quelques ponts seulement, comme en ville
      amorces.push([[i, j], n]);
    }
  }
  const troncons = [...amorces, ...RUES].map(([a, b]) => ({ a: px(a), b: px(b), grande: avenue(a, b) }));

  // Performance : tout le décor tient en quelques tracés (au lieu de ~2 700 éléments redessinés à chaque image).
  const segments = (grande: boolean) => troncons.filter(t => t.grande === grande).map(t => `M${t.a[0]} ${t.a[1]}L${t.b[0]} ${t.b[1]}`).join("");
  const RUES_D = segments(false), AVENUES_D = segments(true);
  const COTE = BLOC - 24, R = 6;
  const PATES_D = pates.map(([x, y]) =>
    `M${x + 12 + R} ${y + 12}h${COTE - 2 * R}a${R} ${R} 0 0 1 ${R} ${R}v${COTE - 2 * R}a${R} ${R} 0 0 1 ${-R} ${R}h${2 * R - COTE}a${R} ${R} 0 0 1 ${-R} ${-R}v${2 * R - COTE}a${R} ${R} 0 0 1 ${R} ${-R}z`).join("");
  const [tx, ty] = px(TERMINUS), [gx, gy] = px(GARE), [mx, my] = px(MAISON);

  const places = $derived(bus.map(b => ({ ...b, p: positionBus(b.ligne, b.d, b.voie) })));
</script>

<svg bind:this={svg} viewBox={vue.map(n => n.toFixed(1)).join(" ")} style:aspect-ratio={ratio} class:interactive role="img" onpointerdown={appui} onpointermove={deplacement} onpointerup={relache} onpointercancel={relache} aria-label="Plan de ville : la gare au centre, ta maison en haut à droite, le terminus en bas à gauche">
  <rect x="-1000" y="-1000" width={LARGEUR + 2000} height={HAUTEUR + 2000} fill={C.sol} />
  <path d={PATES_D} fill={C.pate} />
  <rect x={parcG + 12} y={parcH + 12} width={parcD - parcG - 24} height={parcB - parcH - 24} rx="10" fill={C.parc} />
  {#each arbres as [cx, cy] (`${cx}`)}<circle {cx} {cy} r="9" fill={C.arbre} />{/each}
  <rect x="-1000" y={canalY + 16} width={LARGEUR + 2000} height={BLOC - 32} fill={C.eau} />

  <g fill="none" stroke-linecap="round">
    <path d={RUES_D} stroke={C.bordure} stroke-width="21" />
    <path d={AVENUES_D} stroke={C.bordureAvenue} stroke-width="26" />
    <path d={RUES_D} stroke={C.rue} stroke-width="17" />
    <path d={AVENUES_D} stroke={C.avenue} stroke-width="22" />
  </g>

  <g font-size="11" fill={C.nom} text-anchor="middle" aria-hidden="true">
    <text x={px([9, 5])[0]} y={px([9, 5])[1] + 4}>Avenue des Platanes</text>
    <text x={px([6, 3])[0] + 4} y={px([6, 3])[1]} transform="rotate(-90 {px([6, 3])[0] + 4} {px([6, 3])[1]})">Boulevard du Marché</text>
    <text x={px([2, 3])[0]} y={px([2, 3])[1] + 4}>Rue des Lilas</text>
    <text x={px([10, 6])[0] + 4} y={px([10, 6])[1] + 40} transform="rotate(-90 {px([10, 6])[0] + 4} {px([10, 6])[1] + 40})">Rue des Écoles</text>
    <text x={px([3, 1])[0] + 40} y={px([3, 1])[1] + 4}>Rue du Moulin</text>
    <text x={LARGEUR / 2 + 60} y={canalY + BLOC / 2 + 4} font-style="italic" fill="#2f5f86">Canal Saint-Pierre</text>
    <text x={(parcG + parcD) / 2} y={(parcH + parcB) / 2 + 4} fill="#2f6b2a" font-weight="700">Parc des Tilleuls</text>
  </g>

  {#each pietons as p (p.id)}
    <polyline points={p.points.map(q => q.join(",")).join(" ")} fill="none" stroke={p.accent ? C.nuit : C.gris} stroke-width="7" stroke-linecap="round" stroke-dasharray="0 13" opacity=".9" />
  {/each}

  {#each etiquettes as e (e.id)}
    <line x1={e.cible.x} y1={e.cible.y} x2={e.x} y2={e.y} stroke={C.nuit} stroke-width="2" />
  {/each}

  {#each places as b (b.id)}
    <g class="bus" class:attenue={b.attenue && b.id !== selectionne} data-id={b.id}
       transform="translate({b.p.x.toFixed(1)} {b.p.y.toFixed(1)}) rotate({b.p.angle.toFixed(1)}) scale({ECHELLE} {ECHELLE * (b.p.retourne ? -1 : 1)}) translate(-100 -55)">
      {#if interactive}<rect x="-30" y="-30" width="260" height="160" fill="transparent" />{/if}
      {#key b.niveau}<g class="mue"><Bus niveau={b.niveau} /></g>{/key}
    </g>
  {/each}

  <g transform="translate({tx} {ty})" font-family="system-ui, sans-serif">
    <circle r="15" fill={C.gris} stroke="#fff" stroke-width="3" />
    <text y="6" font-size="16" font-weight="900" fill="#fff" text-anchor="middle">T</text>
    <text x="20" y="-20" font-size="14" font-weight="900" letter-spacing="1" fill={C.nuit} paint-order="stroke" stroke="#fff" stroke-width="4">TERMINUS</text>
  </g>
  <g transform="translate({gx} {gy})" font-family="system-ui, sans-serif">
    <rect x="-18" y="-18" width="36" height="36" rx="7" fill="#fff" stroke={C.nuit} stroke-width="4" />
    <rect x="-10" y="-9" width="20" height="13" rx="2" fill={C.nuit} /><rect x="-7" y="-6" width="14" height="4" fill="#fff" />
    <circle cx="-5" cy="7" r="2.6" fill={C.nuit} /><circle cx="5" cy="7" r="2.6" fill={C.nuit} />
    <text x="24" y="-22" font-size="14" font-weight="900" letter-spacing="1" fill={C.nuit} paint-order="stroke" stroke="#fff" stroke-width="4">GARE ROUTIÈRE</text>
  </g>
  <g transform="translate({mx} {my})" font-family="system-ui, sans-serif">
    <circle r="21" fill={C.nuit} stroke="#ffcd00" stroke-width="4" />
    <path d="M-10 2 L0 -9 L10 2 V11 H-10z" fill="#ffcd00" />
    <text y="40" font-size="16" font-weight="900" letter-spacing="1" fill={C.nuit} text-anchor="middle" paint-order="stroke" stroke="#fff" stroke-width="5">CHEZ TOI</text>
  </g>

  {#each etiquettes as e (e.id)}
    {@const url = urlPhoto(e.id)}
    {@const cad = PHOTOS[e.id]?.cadrage ?? { zoom: 1, x: 50, y: 25 }}
    {@const px0 = e.x - e.largeur / 2 + 18}
    <g class="etiquette" data-id={e.id}>
      <rect x={e.x - e.largeur / 2} y={e.y - 17} width={e.largeur} height="34" rx="17" fill={e.accent ? C.nuit : "#fff"} stroke={e.id === selectionne ? "#ffcd00" : C.nuit} stroke-width={e.id === selectionne ? 4 : 2} />
      {#if url}
        <clipPath id="photo-{e.id}"><circle cx={px0} cy={e.y} r="14" /></clipPath>
        <image href={url} x={px0 - 14 * cad.zoom} y={e.y - 14 - 28 * (cad.zoom - 1) * (cad.y / 100)} width={28 * cad.zoom} height={28 * cad.zoom}
          preserveAspectRatio="xMidYMin slice" clip-path="url(#photo-{e.id})" />
      {/if}
      <text x={e.x + (url ? 16 : 0)} y={e.y + 7} font-size="19" font-weight="800" text-anchor="middle" font-family="system-ui, sans-serif" fill={e.accent ? "#ffcd00" : C.nuit}>{e.texte}</text>
    </g>
  {/each}
</svg>

<style>
  svg { width: 100%; height: auto; display: block; background: #dfe5ec; }
  .bus { transition: opacity 0.6s; }
  .interactive { touch-action: none; cursor: grab; }
  .interactive .bus, .interactive .etiquette { cursor: pointer; }
  .bus.attenue { opacity: 0.18; }
  /* Changement d'apparence d'un bus (peinture grattée) : petit « pouf » de transformation. */
  .mue { transform-box: fill-box; transform-origin: center; animation: mue 0.7s ease-out; }
  @keyframes mue { 0% { transform: scale(0.4) rotate(-8deg); opacity: 0; } 60% { transform: scale(1.15) rotate(3deg); opacity: 1; } 100% { transform: none; } }
  @media (prefers-reduced-motion: reduce) { .mue { animation: none; } }
</style>

<script lang="ts" module>
  import type { Niveau } from "./niveaux";
  import type { Noeud } from "./ville";

  export interface BusSurCarte { id: string; niveau: Niveau; ligne: readonly Noeud[]; d: number; voie: number; attenue: boolean }
  export interface Etiquette { id: string; x: number; y: number; largeur: number; texte: string; cible: { x: number; y: number }; accent: boolean }
  export interface Pieton { id: string; points: [number, number][]; accent: boolean }
</script>

<script lang="ts">
  import Bus from "./Bus.svelte";
  import { avenue, BLOC, CANAL, COLS, dansGrille, GARE, HAUTEUR, LARGEUR, MAISON, PARC, positionBus, px, ROWS, RUES, TERMINUS } from "./ville";

  let { bus, vue, ratio, pietons = [], etiquettes = [] }: {
    bus: BusSurCarte[];
    vue: [number, number, number, number];
    /** Largeur ÷ hauteur du cadre affiché (portrait sur mobile). */
    ratio: number;
    pietons?: Pieton[];
    etiquettes?: Etiquette[];
  } = $props();

  const ECHELLE = 0.28;
  const C = { sol: "#f3f1ec", pate: "#e6e3db", parc: "#c9e7bd", arbre: "#a9d69a", eau: "#a8d3e6",
              rue: "#ffffff", bordure: "#d8d3c8", avenue: "#fde9a8", bordureAvenue: "#eec56a", nom: "#6f6a60" };

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
  const [tx, ty] = px(TERMINUS), [gx, gy] = px(GARE), [mx, my] = px(MAISON);

  const places = $derived(bus.map(b => ({ ...b, p: positionBus(b.ligne, b.d, b.voie) })));
</script>

<svg viewBox={vue.map(n => n.toFixed(1)).join(" ")} style:aspect-ratio={ratio} role="img" aria-label="Plan de ville : la gare au centre, ta maison en haut à droite, le terminus en bas à gauche">
  <rect x="-1000" y="-1000" width={LARGEUR + 2000} height={HAUTEUR + 2000} fill={C.sol} />
  {#each pates as [x, y] (`${x},${y}`)}
    <rect x={x + 12} y={y + 12} width={BLOC - 24} height={BLOC - 24} rx="6" fill={C.pate} />
  {/each}
  <rect x={parcG + 12} y={parcH + 12} width={parcD - parcG - 24} height={parcB - parcH - 24} rx="10" fill={C.parc} />
  {#each arbres as [cx, cy] (`${cx}`)}<circle {cx} {cy} r="9" fill={C.arbre} />{/each}
  <rect x="-1000" y={canalY + 16} width={LARGEUR + 2000} height={BLOC - 32} fill={C.eau} />

  {#each troncons as t, i (i)}
    <line x1={t.a[0]} y1={t.a[1]} x2={t.b[0]} y2={t.b[1]} stroke={t.grande ? C.bordureAvenue : C.bordure} stroke-width={t.grande ? 26 : 21} stroke-linecap="round" />
  {/each}
  {#each troncons as t, i (i)}
    <line x1={t.a[0]} y1={t.a[1]} x2={t.b[0]} y2={t.b[1]} stroke={t.grande ? C.avenue : C.rue} stroke-width={t.grande ? 22 : 17} stroke-linecap="round" />
  {/each}

  <g font-size="11" fill={C.nom} text-anchor="middle" aria-hidden="true">
    <text x={px([9, 5])[0]} y={px([9, 5])[1] + 4}>Avenue des Platanes</text>
    <text x={px([6, 3])[0] + 4} y={px([6, 3])[1]} transform="rotate(-90 {px([6, 3])[0] + 4} {px([6, 3])[1]})">Boulevard du Marché</text>
    <text x={px([2, 3])[0]} y={px([2, 3])[1] + 4}>Rue des Lilas</text>
    <text x={px([10, 6])[0] + 4} y={px([10, 6])[1] + 40} transform="rotate(-90 {px([10, 6])[0] + 4} {px([10, 6])[1] + 40})">Rue des Écoles</text>
    <text x={px([3, 1])[0] + 40} y={px([3, 1])[1] + 4}>Rue du Moulin</text>
    <text x={LARGEUR / 2 + 60} y={canalY + BLOC / 2 + 4} font-style="italic" fill="#4f86a6">Canal Saint-Pierre</text>
    <text x={(parcG + parcD) / 2} y={(parcH + parcB) / 2 + 4} fill="#3f7a35" font-weight="600">Parc des Tilleuls</text>
  </g>

  {#each pietons as p (p.id)}
    <polyline points={p.points.map(q => q.join(",")).join(" ")} fill="none" stroke={p.accent ? "#1a73e8" : "#80868b"} stroke-width="7" stroke-linecap="round" stroke-dasharray="0 13" opacity=".9" />
  {/each}

  {#each etiquettes as e (e.id)}
    <line x1={e.cible.x} y1={e.cible.y} x2={e.x} y2={e.y} stroke="#3c4043" stroke-width="1.5" />
  {/each}

  {#each places as b (b.id)}
    <g class="bus" class:attenue={b.attenue}
       transform="translate({b.p.x.toFixed(1)} {b.p.y.toFixed(1)}) rotate({b.p.angle.toFixed(1)}) scale({ECHELLE} {ECHELLE * (b.p.retourne ? -1 : 1)}) translate(-100 -55)">
      <Bus niveau={b.niveau} />
    </g>
  {/each}

  <g transform="translate({tx} {ty})">
    <rect x="-14" y="-14" width="28" height="28" rx="6" fill="#80868b" />
    <text y="6" font-size="17" font-weight="700" fill="#fff" text-anchor="middle">T</text>
    <text x="20" y="-20" font-size="15" font-weight="600" fill="#5f6368">Terminus</text>
  </g>
  <g transform="translate({gx} {gy})">
    <rect x="-17" y="-17" width="34" height="34" rx="8" fill="#1a73e8" />
    <rect x="-10" y="-9" width="20" height="14" rx="3" fill="#fff" /><rect x="-7" y="-6" width="14" height="5" fill="#1a73e8" />
    <circle cx="-5" cy="7" r="2.6" fill="#fff" /><circle cx="5" cy="7" r="2.6" fill="#fff" />
    <text x="24" y="-22" font-size="15" font-weight="600" fill="#1a73e8">Gare routière</text>
  </g>
  <g transform="translate({mx} {my})">
    <path d="M0 0 C-5 -12 -19 -19 -19 -33 A19 19 0 1 1 19 -33 C19 -19 5 -12 0 0z" fill="#ea4335" stroke="#b3261e" stroke-width="1.5" />
    <path d="M-9 -31 L0 -40 L9 -31 V-24 H-9z" fill="#fff" />
    <text y="24" font-size="17" font-weight="700" fill="#c5221f" text-anchor="middle" paint-order="stroke" stroke={C.sol} stroke-width="5">Chez toi</text>
  </g>

  {#each etiquettes as e (e.id)}
    <rect x={e.x - e.largeur / 2} y={e.y - 15} width={e.largeur} height="30" rx="15" fill={e.accent ? "#1a73e8" : "#fff"} stroke="#3c4043" stroke-width="1.2" />
    <text x={e.x} y={e.y + 6} font-size="17" font-weight="600" text-anchor="middle" fill={e.accent ? "#fff" : "#202124"}>{e.texte}</text>
  {/each}
</svg>

<style>
  svg { width: 100%; height: auto; display: block; background: #f3f1ec; }
  .bus { transition: opacity 0.6s; }
  .bus.attenue { opacity: 0.18; }
</style>

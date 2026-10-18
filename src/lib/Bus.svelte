<svelte:options namespace="svg" />

<script lang="ts">
  import type { Niveau } from "./niveaux";

  /** Un bus dessiné dans un repère 200 × 100 (roues en bas à y ≈ 95). À placer dans un <svg>. */
  let { niveau }: { niveau: Niveau } = $props();

  interface Style {
    carrosserie: string; vitres: string; cadre?: string; porte: string; jantes: string;
    bande?: string; pareChocs: string | null; phare: string; inclinaison?: string;
    fissures?: number[]; eclats?: boolean; rouePlate?: boolean;
  }
  const STYLES: Record<Niveau, Style> = {
    adore: { carrosserie: "#1d2b4f", bande: "#d4af37", vitres: "#132039", cadre: "#d9d9d9", porte: "#16223f", jantes: "#f4f4f4", pareChocs: "#cfcfcf", phare: "#fff6c8" },
    bien: { carrosserie: "#2f7de1", bande: "#ffffff", vitres: "#bfe3ff", porte: "#a6d2f4", jantes: "#e2e2e2", pareChocs: "#2b2b2b", phare: "#ffe08a" },
    bof: { carrosserie: "#e3ad35", vitres: "#d2e1e7", porte: "#c3d4db", jantes: "#9a9a9a", pareChocs: "#4a4a4a", phare: "#ffe08a" },
    pas: { carrosserie: "#a8956a", vitres: "#c4ccc4", porte: "#b3bcb4", jantes: "#727272", pareChocs: "#5a5a5a", phare: "#d9c98a", fissures: [1] },
    jamais: { carrosserie: "#7b5e45", vitres: "#2a2a2a", porte: "#151515", jantes: "#4f4f4f", pareChocs: null, phare: "#3e3e3e", inclinaison: "rotate(3 100 85)", fissures: [0, 2, 4], eclats: true, rouePlate: true },
    inconnu: { carrosserie: "#9aa3ad", vitres: "#d9dee3", porte: "#c4cbd2", jantes: "#bdbdbd", pareChocs: "#6b7179", phare: "#ffe08a" },
  };
  const FENETRES = [18, 48, 78, 108];
  const s = $derived(STYLES[niveau]);
</script>

{#snippet fissure(x: number)}
  <path d="M{x + 5} 30 l7 8 l-3 5 l9 5 M{x + 12} 38 l9 -6" stroke="#fff" stroke-width="1.2" fill="none" opacity=".85" />
{/snippet}
{#snippet roue(cx: number, plate: boolean)}
  {#if plate}
    <ellipse {cx} cy="87" rx="15" ry="8" fill="#1d1d1d" /><circle {cx} cy="86" r="4" fill={s.jantes} />
  {:else}
    <circle {cx} cy="82" r="13" fill="#1d1d1d" /><circle {cx} cy="82" r="6" fill={s.jantes} />
  {/if}
{/snippet}
{#snippet fumee(sombre: boolean, n: number)}
  {#each Array.from({ length: n }, (_, i) => i) as i (i)}
    <circle class="bouffee" class:sombre cx="2" cy="74" r={sombre ? 7 : 5} style:animation-delay="{(i * 1.8) / n}s" />
  {/each}
{/snippet}

<ellipse cx="100" cy="97" rx="92" ry="4" fill="#000" opacity=".12" />
<g transform={s.inclinaison ?? ""}>
  <rect x="8" y="16" width="184" height="64" rx="12" fill={s.carrosserie} />

  {#if niveau === "adore"}
    <rect x="8" y="16" width="184" height="4" rx="2" fill="#d4af37" />
    <path d="M8 40 L192 22 V30 L8 48z" fill="#fff" opacity=".07" />
  {:else if niveau === "jamais"}
    <rect x="28" y="52" width="36" height="20" fill="#6f7f62" transform="rotate(-5 46 62)" />
    <rect x="96" y="54" width="28" height="20" fill="#a06a3a" />
    {#each [[99, 57], [121, 57], [99, 71], [121, 71]] as [cx, cy] (`${cx}-${cy}`)}<circle {cx} {cy} r="1.2" fill="#333" />{/each}
    {#each [[20, 24, 4], [70, 20, 3], [176, 70, 4], [132, 22, 3.5]] as [cx, cy, r] (`${cx}-${cy}`)}<circle {cx} {cy} {r} fill="#5c3317" />{/each}
  {/if}

  {#if s.bande}<rect x="8" y="58" width="184" height="7" fill={s.bande} />{/if}

  {#each FENETRES as x, i (x)}
    <rect {x} y="28" width="26" height="22" rx="3" fill={s.vitres} stroke={s.cadre ?? "none"} stroke-width="1.5" />
    {#if s.eclats}<path d="M{x} 28 l6 8 l5 -8 l5 11 l6 -11 h4 v22 h-26z" fill="#dfe7ea" opacity=".35" />{/if}
    {#if s.fissures?.includes(i)}{@render fissure(x)}{/if}
  {/each}
  <rect x="140" y="28" width="18" height="48" rx="2" fill={s.porte} />
  <rect x="164" y="26" width="24" height="28" rx="4" fill={s.vitres} stroke={s.cadre ?? "none"} stroke-width="1.5" />
  {#if s.fissures?.includes(4)}{@render fissure(166)}{/if}
  <rect x="184" y="64" width="8" height="6" rx="2" fill={s.phare} />
  {#if s.pareChocs}<rect x="6" y="74" width="188" height="6" rx="3" fill={s.pareChocs} />{/if}

  {#if niveau === "adore"}
    {#each FENETRES as x (x)}<path d="M{x + 3} 48 l11 -18 h5 l-11 18z" fill="#fff" opacity=".18" />{/each}
    <text x="74" y="72.5" font-size="6.5" font-weight="700" letter-spacing="1.5" fill="#d4af37" text-anchor="middle">GRAND TOURISME</text>
  {:else if niveau === "bien"}
    {#each FENETRES as x (x)}<path d="M{x + 4} 47 l9 -16 h4 l-9 16z" fill="#fff" opacity=".45" />{/each}
  {:else if niveau === "bof"}
    <rect x="20" y="60" width="40" height="8" rx="2" fill="#fff" opacity=".7" />
    <text x="40" y="66.3" font-size="6" text-anchor="middle" fill="#555">LIGNE 27</text>
  {:else if niveau === "pas"}
    <path d="M58 66 q11 7 24 0" stroke="#7b6a45" stroke-width="2.5" fill="none" />
    <circle cx="120" cy="66" r="3" fill="#8a4b20" /><circle cx="126" cy="70" r="2" fill="#8a4b20" /><circle cx="30" cy="22" r="2.5" fill="#8a4b20" />
    <path d="M84 30 l20 18 M104 30 l-20 18" stroke="#c9b98a" stroke-width="4" opacity=".9" />
    <ellipse cx="28" cy="77" rx="16" ry="4" fill="#6b5a3a" opacity=".55" /><ellipse cx="128" cy="78" rx="12" ry="3" fill="#6b5a3a" opacity=".55" />
  {:else if niveau === "jamais"}
    <rect x="80" y="31" width="22" height="12" fill="#f2f2f2" />
    <text x="91" y="40.5" font-size="8" text-anchor="middle" font-weight="700" fill="#c0392b">HS</text>
    <path d="M22 70 c6 -8 10 6 16 -2 s8 6 14 -3" stroke="#d1335b" stroke-width="2" fill="none" />
    <rect x="6" y="74" width="80" height="6" rx="3" fill="#4a4a4a" />
    <rect x="120" y="74" width="72" height="6" rx="3" fill="#4a4a4a" transform="rotate(9 120 77)" />
  {:else if niveau === "inconnu"}
    <text x="62" y="73" font-size="16" font-weight="700" text-anchor="middle" fill="#fff" opacity=".9">?</text>
  {/if}

  {@render roue(46, s.rouePlate ?? false)}{@render roue(154, false)}
</g>

{#if niveau === "adore"}
  <path class="etincelle" d="M14 6 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z" fill="#d4af37" />
  <path class="etincelle" style:animation-delay=".5s" d="M186 4 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5z" fill="#d4af37" />
  <path class="etincelle" style:animation-delay="1s" d="M104 0 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5z" fill="#d4af37" />
{:else if niveau === "pas"}
  {@render fumee(false, 2)}
{:else if niveau === "jamais"}
  {@render fumee(true, 4)}
  <circle class="mouche" cx="150" cy="8" r="1.6" fill="#222" />
  <circle class="mouche" style:animation-delay=".4s" cx="160" cy="14" r="1.6" fill="#222" />
{/if}

<style>
  .bouffee { fill: #8a8a8a; opacity: 0; transform-box: fill-box; transform-origin: center; animation: bouffee 1.8s ease-out infinite; }
  .bouffee.sombre { fill: #4d4d4d; }
  @keyframes bouffee { 0% { transform: translate(0, 0) scale(0.4); opacity: 0.75; } 100% { transform: translate(-28px, -18px) scale(1.8); opacity: 0; } }
  .etincelle { transform-box: fill-box; transform-origin: center; animation: scintille 1.6s ease-in-out infinite; }
  @keyframes scintille { 0%, 100% { opacity: 0.15; transform: scale(0.6); } 50% { opacity: 1; transform: scale(1.1); } }
  .mouche { animation: bourdonne 1.2s linear infinite; }
  @keyframes bourdonne { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(6px, -4px); } 50% { transform: translate(0, -8px); } 75% { transform: translate(-6px, -4px); } }
  @media (prefers-reduced-motion: reduce) {
    .bouffee, .etincelle, .mouche { animation: none; }
  }
</style>

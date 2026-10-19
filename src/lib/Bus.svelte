<svelte:options namespace="svg" />

<script lang="ts">
  import type { Niveau } from "./niveaux";

  /**
   * Bus en pictogramme plat (direction « Signalétique transport »), repère 200 × 100, roues en bas (y ≈ 91).
   * Six niveaux bien distincts ; à placer dans un <svg>.
   */
  let { niveau }: { niveau: Niveau } = $props();

  interface Style { caisse: string; bande: string; vitre: string; porte: string; inclinaison?: string }
  const STYLES: Record<Niveau, Style> = {
    adore: { caisse: "#0b1f3a", bande: "#ffcd00", vitre: "#e9f1fb", porte: "#ffcd00" },
    bien: { caisse: "#1565c0", bande: "#ffffff", vitre: "#e9f1fb", porte: "#dfeaf7" },
    bof: { caisse: "#6b7f99", bande: "#dfe5ec", vitre: "#e9f1fb", porte: "#dfe5ec" },
    pas: { caisse: "#a99a7a", bande: "#e8e0cc", vitre: "#e4e8e2", porte: "#d8cfb8" },
    jamais: { caisse: "#4a4038", bande: "#8a7d6e", vitre: "#2a2522", porte: "#1c1916", inclinaison: "rotate(4 100 80)" },
    inconnu: { caisse: "#b5bcc6", bande: "#e6e9ee", vitre: "#f2f4f7", porte: "#e6e9ee" },
  };
  const FENETRES = [22, 52, 82, 112];
  const s = $derived(STYLES[niveau]);
  const casse = $derived(niveau === "jamais");
</script>

{#snippet roue(cx: number, plate: boolean)}
  {#if plate}
    <ellipse {cx} cy="86" rx="14" ry="7" fill="#0b1f3a" /><circle {cx} cy="85" r="3" fill="#8a7d6e" />
  {:else}
    <circle {cx} cy="80" r="11" fill="#0b1f3a" /><circle {cx} cy="80" r="4" fill="#ffffff" />
  {/if}
{/snippet}
{#snippet fumee(n: number, sombre: boolean)}
  {#each Array.from({ length: n }, (_, i) => i) as i (i)}
    <circle class="bouffee" class:sombre cx="4" cy="70" r={sombre ? 7 : 5} style:animation-delay="{(i * 1.8) / n}s" />
  {/each}
{/snippet}

<ellipse cx="100" cy="94" rx="90" ry="3.5" fill="#0b1f3a" opacity=".12" />
<g transform={s.inclinaison ?? ""}>
  <rect x="10" y="22" width="180" height="56" rx="8" fill={s.caisse} />
  <rect x="10" y="62" width="180" height="6" fill={s.bande} />

  {#each FENETRES as x, i (x)}
    <rect {x} y="32" width="24" height="20" rx="2" fill={casse && i % 2 === 0 ? "#2a2522" : s.vitre}
      stroke={niveau === "adore" ? "#ffcd00" : "none"} stroke-width="1.5" />
    {#if niveau === "adore" || niveau === "bien"}<path d="M{x + 4} 50 l10 -16 h4 l-10 16z" fill="#fff" opacity=".55" />{/if}
    {#if casse && i % 2 === 0}<path d="M{x} 32 l6 7 l5 -7 l5 9 l8 -9 v20 h-24z" fill="#ffffff" opacity=".18" />{/if}
  {/each}
  <rect x="142" y="32" width="16" height="40" rx="1" fill={s.porte} />
  <rect x="164" y="30" width="20" height="24" rx="3" fill={casse ? "#2a2522" : s.vitre} />
  <rect x="184" y="56" width="6" height="6" rx="1.5" fill={casse ? "#5a5048" : "#ffcd00"} />

  {#if niveau === "adore"}
    <text x="76" y="76" font-size="7" font-weight="900" letter-spacing="2" fill="#ffcd00" text-anchor="middle" font-family="system-ui, sans-serif">EXPRESS</text>
  {:else if niveau === "bof"}
    <rect x="22" y="70" width="36" height="7" rx="1" fill="#ffffff" opacity=".85" />
    <text x="40" y="75.6" font-size="5.5" font-weight="800" fill="#0b1f3a" text-anchor="middle" font-family="system-ui, sans-serif">LIGNE 27</text>
  {:else if niveau === "pas"}
    <path d="M58 36 l8 8 -3 4 7 6" stroke="#ffffff" stroke-width="2" fill="none" />
    <path d="M86 72 q10 5 22 0" stroke="#7d6e4f" stroke-width="2.5" fill="none" />
    <circle cx="130" cy="28" r="2.5" fill="#7a4e2d" /><circle cx="28" cy="58" r="3" fill="#7a4e2d" />
  {:else if casse}
    <circle cx="30" cy="28" r="3.5" fill="#6b3f22" /><circle cx="128" cy="72" r="4" fill="#6b3f22" /><circle cx="176" cy="66" r="3" fill="#6b3f22" />
    <rect x="66" y="6" width="68" height="13" rx="2" fill="#c62828" />
    <text x="100" y="15.6" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui, sans-serif">HORS SERVICE</text>
  {:else if niveau === "inconnu"}
    <text x="100" y="58" font-size="18" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui, sans-serif">?</text>
  {/if}

  {@render roue(48, casse)}{@render roue(156, false)}
</g>

{#if niveau === "adore"}
  <path class="etincelle" d="M100 2 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="#ffcd00" stroke="#0b1f3a" stroke-width="1" />
{:else if niveau === "pas"}
  {@render fumee(2, false)}
{:else if casse}
  {@render fumee(4, true)}
  <circle class="mouche" cx="150" cy="10" r="1.6" fill="#0b1f3a" />
  <circle class="mouche" style:animation-delay=".4s" cx="160" cy="16" r="1.6" fill="#0b1f3a" />
{/if}

<style>
  .bouffee { fill: #9aa3ad; opacity: 0; transform-box: fill-box; transform-origin: center; animation: bouffee 1.8s ease-out infinite; }
  .bouffee.sombre { fill: #5a5048; }
  @keyframes bouffee { 0% { transform: translate(0, 0) scale(0.4); opacity: 0.75; } 100% { transform: translate(-26px, -16px) scale(1.8); opacity: 0; } }
  .etincelle { transform-box: fill-box; transform-origin: center; animation: scintille 1.8s ease-in-out infinite; }
  @keyframes scintille { 0%, 100% { transform: scale(0.85); } 50% { transform: scale(1.1); } }
  .mouche { animation: bourdonne 1.2s linear infinite; }
  @keyframes bourdonne { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(6px, -4px); } 50% { transform: translate(0, -8px); } 75% { transform: translate(-6px, -4px); } }
  @media (prefers-reduced-motion: reduce) {
    .bouffee, .etincelle, .mouche { animation: none; }
  }
</style>

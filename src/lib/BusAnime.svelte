<script lang="ts">
  import Bus from "./Bus.svelte";
  import type { Niveau } from "./niveaux";
  import type { Effet } from "./revelation";

  /**
   * Bus de la peinture grattée, avec l'animation de son effet : il brille, il tombe en panne, il cale, il s'envole, il monte en gamme.
   * Décoratif (le texte autour dit tout) ; sans animation si l'utilisateur les a coupées, mais l'état final reste visible.
   */
  let { niveau, effet = null, retard = 0 }: { niveau: Niveau; effet?: Effet | null; retard?: number } = $props();
</script>

<span class="anime {effet ?? ''}" style:--retard="{retard}s" aria-hidden="true">
  <svg viewBox="-34 -8 240 112"><Bus {niveau} /></svg>
  {#if effet === "brille" || effet === "envol"}
    <span class="eclat e1">✦</span><span class="eclat e2">✦</span><span class="eclat e3">✦</span>
  {/if}
  {#if effet === "panne" || effet === "cale"}
    <span class="fumee f1"></span><span class="fumee f2"></span>{#if effet === "panne"}<span class="fumee f3"></span>{/if}
  {/if}
</span>

<style>
  .anime { position: relative; display: inline-grid; place-items: center; width: 100%; }
  svg { width: 100%; height: auto; transform-origin: 50% 85%; }

  /* Il brille : halo doré qui pulse, reflet qui traverse, étoiles qui scintillent. */
  .brille svg { animation: halo 1.6s ease-in-out var(--retard) 3, halo-fixe 0s linear calc(var(--retard) + 4.8s) forwards; }
  @keyframes halo { 0%, 100% { filter: drop-shadow(0 0 2px #ffcd00); } 50% { filter: drop-shadow(0 0 10px #ffcd00) brightness(1.12); } }
  @keyframes halo-fixe { to { filter: drop-shadow(0 0 5px #ffcd00); } }
  .brille::after {
    content: ""; position: absolute; inset: 10% 0 22%; pointer-events: none;
    background: linear-gradient(105deg, transparent 35%, rgb(255 255 255 / 0.85) 50%, transparent 65%) no-repeat;
    background-size: 250% 100%; background-position: 150% 0; mix-blend-mode: soft-light;
    animation: reflet 1.4s ease-in-out calc(var(--retard) + 0.3s) 2;
  }
  @keyframes reflet { to { background-position: -50% 0; } }

  .eclat { position: absolute; color: #ffcd00; font-size: 14px; line-height: 1; text-shadow: 0 0 4px rgb(11 31 58 / 0.6); opacity: 0; animation: scintille 1.2s ease-in-out infinite; }
  .e1 { top: -4%; left: 12%; animation-delay: calc(var(--retard) + 0.1s); }
  .e2 { top: 8%; right: 6%; font-size: 18px; animation-delay: calc(var(--retard) + 0.5s); }
  .e3 { bottom: 22%; left: 2%; font-size: 11px; animation-delay: calc(var(--retard) + 0.9s); }
  @keyframes scintille { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0); } 50% { opacity: 1; transform: scale(1.1) rotate(25deg); } }

  /* Belle surprise : le bus fait un bond, puis scintille un peu. */
  .envol svg { animation: bond 0.9s cubic-bezier(.3, 1.6, .5, 1) var(--retard) both; }
  .envol .eclat { animation-iteration-count: 3; }
  @keyframes bond { 0% { transform: translateY(14px) scale(0.85); } 60% { transform: translateY(-10px) scale(1.06); } 100% { transform: none; } }
  .monte svg { animation: rebond 0.7s ease-out var(--retard) both; }
  @keyframes rebond { 0% { transform: translateY(6px); } 50% { transform: translateY(-5px); } 100% { transform: none; } }

  /* En panne : il tousse, tremble, puis s'affaisse de travers, ternit et fume. */
  .panne svg { animation: tousse 0.9s linear var(--retard), affaisse 0.6s ease-in calc(var(--retard) + 0.9s) forwards; }
  @keyframes tousse { 0%, 100% { transform: none; } 10%, 30%, 50%, 70%, 90% { transform: translateX(-3px) rotate(-1deg); } 20%, 40%, 60%, 80% { transform: translateX(3px) rotate(1deg); } }
  @keyframes affaisse { to { transform: translateY(5px) rotate(5deg); filter: grayscale(0.7) brightness(0.85); } }
  /* Il cale : un hoquet, une bouffée. */
  .cale svg { animation: hoquet 0.5s linear var(--retard) 2; }
  @keyframes hoquet { 0%, 100% { transform: none; } 25% { transform: translateX(-2px); } 75% { transform: translateX(2px); } }

  .fumee { position: absolute; left: 4%; bottom: 30%; width: 14px; height: 14px; border-radius: 50%; background: #8a94a3; opacity: 0; animation: fume 1.8s ease-out infinite; }
  .cale .fumee { animation-name: bouffee; animation-iteration-count: 2; }
  @keyframes bouffee { 0% { opacity: 0.7; transform: scale(0.4); } 100% { opacity: 0; transform: translate(-8px, -12px) scale(1.2); } }
  .f1 { animation-delay: calc(var(--retard) + 0.2s); }
  .f2 { animation-delay: calc(var(--retard) + 0.8s); width: 18px; height: 18px; }
  .f3 { animation-delay: calc(var(--retard) + 1.4s); width: 22px; height: 22px; background: #5d6673; }
  @keyframes fume { 0% { opacity: 0.85; transform: translate(0, 0) scale(0.4); } 100% { opacity: 0; transform: translate(-12px, -26px) scale(1.5); } }

  @media (prefers-reduced-motion: reduce) {
    .anime svg, .anime::after, .eclat, .fumee { animation: none; }
    .brille svg { filter: drop-shadow(0 0 5px #ffcd00); }
    .brille .eclat { opacity: 1; }
    .panne svg { transform: translateY(5px) rotate(5deg); filter: grayscale(0.7) brightness(0.85); }
    .panne .fumee { opacity: 0.6; transform: translate(-4px, -4px); }
  }
</style>

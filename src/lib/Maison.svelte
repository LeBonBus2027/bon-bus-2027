<svelte:options namespace="svg" />

<script lang="ts">
  /**
   * La maison qui se construit au fil des réponses (repère 60 × 56) ; à placer dans un <svg>, dessinée en currentColor.
   * `anime` : chaque élément apparaît avec un petit rebond (bande-annonce de l'accueil).
   */
  let { progression, anime = false }: { progression: number; anime?: boolean } = $props();
</script>

<rect x="6" y="50" width="48" height="4" rx="1" fill="currentColor" />
{#if progression > 0.1}<rect class:pose={anime} x="10" y="26" width="40" height="24" fill="#dfe5ec" />{/if}
{#if progression > 0.3}<rect class:pose={anime} x="25" y="36" width="10" height="14" rx="1" fill="currentColor" />{/if}
{#if progression > 0.5}<rect class:pose={anime} x="14" y="31" width="8" height="7" fill="#a8d3e6" /><rect class:pose={anime} x="38" y="31" width="8" height="7" fill="#a8d3e6" />{/if}
{#if progression > 0.7}<path class:pose={anime} d="M4 28 L30 6 L56 28z" fill="#ffcd00" stroke="currentColor" stroke-width="2" />{/if}
{#if progression > 0.85}<rect class:pose={anime} x="40" y="8" width="6" height="12" fill="currentColor" />{/if}

<style>
  .pose { transform-box: fill-box; transform-origin: 50% 100%; animation: pose 0.45s cubic-bezier(.3, 1.6, .5, 1) both; }
  @keyframes pose { from { transform: scale(0.2); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .pose { animation: none; } }
</style>

<script lang="ts">
  import Bus from "../lib/Bus.svelte";

  /** Entre les deux tours du mode duo : on passe le téléphone sans rien dévoiler du premier tour. */
  let { nom, onPret }: { nom: string; onPret: () => void } = $props();
</script>

<div class="relais">
  <svg viewBox="-34 -8 240 112" aria-hidden="true"><Bus niveau="bien" /></svg>
  <h1 tabindex="-1">Passe le téléphone à {nom}</h1>
  <p>Le premier trajet est gardé de côté, sans être affiché. À toi de jouer, {nom} : range les candidats selon ton ressenti, puis réponds aux mêmes questions.</p>
  <p><button class="principal" onclick={onPret}>C'est moi, j'y vais</button></p>
</div>

<style>
  .relais { text-align: center; padding-top: 24px; }
  svg { width: 60%; max-width: 240px; height: auto; background: var(--panneau); border-radius: var(--rayon); }
</style>

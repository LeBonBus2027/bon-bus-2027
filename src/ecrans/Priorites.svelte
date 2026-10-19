<script lang="ts">
  /** « Ce qui compte pour toi » : jusqu'à `max` grands thèmes dont les questions comptent double. */
  let { themes, prioritaires = $bindable(), max, onChange }: {
    themes: readonly string[];
    prioritaires: string[];
    max: number;
    onChange: () => void;
  } = $props();

  function basculer(theme: string) {
    prioritaires = prioritaires.includes(theme) ? prioritaires.filter(t => t !== theme) : [...prioritaires, theme].slice(0, max);
    onChange();
  }
</script>

<div class="priorites boite">
  <h2 class="etiquette-signal" id="titre-priorites">Ce qui compte pour toi</h2>
  <p>Choisis jusqu'à {max} sujets qui comptent double. Les bus bougent en direct.</p>
  <div class="themes" role="group" aria-labelledby="titre-priorites">
    {#each themes as t (t)}
      {@const actif = prioritaires.includes(t)}
      <button class:actif aria-pressed={actif} disabled={!actif && prioritaires.length >= max} onclick={() => basculer(t)}>{t}</button>
    {/each}
  </div>
  {#if prioritaires.length}
    <p class="discret petit">Ces sujets comptent double : {prioritaires.join(", ")}. <button class="lien" onclick={() => { prioritaires = []; onChange(); }}>Tout remettre à égalité</button></p>
  {/if}
</div>

<style>
  .priorites { margin: 4px 0 12px; }
  h2 { margin: 0 0 4px; }
  p { margin: 0 0 8px; }
  .themes { display: flex; flex-wrap: wrap; gap: 6px; }
  .themes button { min-height: 44px; padding: 6px 12px; font-size: 15px; border-radius: 999px; }
  .themes button.actif { background: var(--jaune); border-color: var(--jaune); color: var(--marque); }
  .lien { min-height: 32px; padding: 0; border: none; background: none; color: var(--lien); text-decoration: underline; font-weight: 600; font-size: inherit; }
</style>

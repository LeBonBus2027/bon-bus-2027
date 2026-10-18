<script lang="ts">
  import { untrack } from "svelte";
  import Bus from "../lib/Bus.svelte";
  import type { Candidat } from "../lib/donnees";
  import { NIVEAUX, BAC, type Niveau } from "../lib/niveaux";

  let { ordre, bacs = $bindable(), onFini }: {
    ordre: readonly Candidat[];
    bacs: Record<string, Niveau>;
    onFini: () => void;
  } = $props();

  // Si tout est déjà rangé (retour en arrière), on rouvre directement le récapitulatif.
  let index = $state(untrack(() => (Object.keys(bacs).length >= ordre.length ? ordre.length : 0)));
  const courant = $derived(ordre[index]);
  let titre: HTMLHeadingElement | undefined = $state();

  function choisir(niveau: Niveau) {
    if (!courant) return;
    bacs[courant.id] = niveau;
    // Après une modification depuis le récapitulatif, on y retourne directement.
    const suivant = ordre.findIndex((c, i) => i > index && !(c.id in bacs));
    index = suivant === -1 ? ordre.length : suivant;
    titre?.focus();
  }
</script>

{#if courant}
  <p class="discret petit" aria-live="polite">Candidat {index + 1} sur {ordre.length}</p>
  <h1 tabindex="-1" bind:this={titre}>{courant.nom}</h1>
  <p class="discret">{courant.parti}</p>

  <p>Spontanément, sans réfléchir, il te fait quel effet ?</p>
  <div class="bacs" role="group" aria-label="Ton ressenti sur {courant.nom}">
    {#each NIVEAUX as n (n.cle)}
      <button class:actif={bacs[courant.id] === n.cle} aria-pressed={bacs[courant.id] === n.cle} onclick={() => choisir(n.cle)}>
        <svg viewBox="-34 -8 240 112" aria-hidden="true"><Bus niveau={n.cle} /></svg>
        <span>{n.bac}</span>
      </button>
    {/each}
  </div>
  {#if index > 0}
    <p><button class="discret" onclick={() => (index -= 1)}>Revenir au précédent</button></p>
  {/if}
{:else}
  <h1 tabindex="-1" bind:this={titre}>Ta gare routière</h1>
  <p>Voilà tes bus, rangés selon ton ressenti. Touche un candidat pour le changer de bac.</p>
  {#each NIVEAUX as n (n.cle)}
    {@const dedans = ordre.filter(c => bacs[c.id] === n.cle)}
    {#if dedans.length}
      <h2>{n.bac} <span class="discret petit">· {n.bus}</span></h2>
      <ul class="gare">
        {#each dedans as c (c.id)}
          <li>
            <button onclick={() => (index = ordre.indexOf(c))} aria-label="{c.nom}, bac {BAC[n.cle]} : modifier">
              <svg viewBox="-34 -8 240 112" aria-hidden="true"><Bus niveau={n.cle} /></svg>
              <span>{c.nom}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {/each}
  <p class="suite"><button class="principal" onclick={onFini}>Les bus sont prêts, place aux questions</button></p>
{/if}

<style>
  .bacs { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; margin: 12px 0; }
  .bacs button, .gare button {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    border-radius: var(--rayon); border-color: var(--trait); padding: 10px;
  }
  .bacs button.actif { border-color: var(--encre); border-width: 2.5px; }
  .bacs svg { width: 100%; max-width: 140px; height: auto; }
  .gare { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; }
  .gare svg { width: 100%; max-width: 110px; height: auto; }
  .gare span { font-size: 14px; text-align: center; }
  .suite { margin-top: 24px; }
</style>

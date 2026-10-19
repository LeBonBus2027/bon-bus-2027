<script lang="ts">
  import { tick } from "svelte";
  import type { Niveau } from "../lib/niveaux";
  import type { Revelation } from "../lib/revelation";
  import AvantApres from "./AvantApres.svelte";

  /**
   * Révélation pas à pas, dans le cadre de la carte (juste sous la ville), avant la page récap :
   * 1. où s'arrêtent les bus, 2. la peinture grattée, 3. la girouette et la morale.
   * L'ordre suit la priorité du message : le verdict, puis l'écart entre ressenti et réalité, puis la leçon.
   */
  let { revelation, bacs, gratte, onGratter, onFin }: {
    revelation: Revelation;
    bacs: Record<string, Niveau>;
    gratte: boolean;
    /** Gratte la peinture des bus sur la carte ; rend la main quand l'effet est passé. */
    onGratter: () => Promise<void>;
    onFin: () => void;
  } = $props();

  const NB = 3;
  let etape = $state(0);
  let occupe = $state(false);
  let titre = $state<HTMLElement>();

  async function aller(k: number) {
    etape = k;
    await tick();
    titre?.focus();
  }

  async function suivant() {
    if (etape === 0 && !gratte) {
      occupe = true;
      await onGratter();
      occupe = false;
    }
    if (etape === NB - 1) onFin();
    else await aller(etape + 1);
  }

  const TITRES = ["Tout le monde descend", "On a gratté la peinture", "Morale de l'histoire"];
  const BOUTONS = $derived([gratte ? "Suivant" : "Gratter la peinture", "Suivant", "Voir mon récap"]);
</script>

<section class="diapo" class:occupe aria-labelledby="titre-diapo">
  <div class="tete">
    <p class="etiquette-signal compteur">{etape + 1}<span class="visually-hidden"> sur </span><span aria-hidden="true"> / </span>{NB}</p>
    <button class="discret passer" onclick={onFin}>Passer au récap</button>
  </div>
  <h2 id="titre-diapo" tabindex="-1" bind:this={titre}>{TITRES[etape]}</h2>

  <div class="contenu">
    {#if etape === 0}
      <p class="message">{revelation.message}</p>
      {#if !gratte}<p class="discret petit">Pour l'instant, tes bus ont encore la peinture que tu leur as donnée. Dessous, il y a ce qu'ils valent vraiment pour toi.</p>{/if}
    {:else if etape === 1}
      <AvantApres focus={revelation.focus} {bacs} compact titre={false} />
    {:else}
      <blockquote class="girouette">{revelation.metaphore}</blockquote>
      <p class="morale"><span>Aucun bus ne te dépose pile devant chez toi. Prends celui qui te rapproche le plus.</span></p>
    {/if}
  </div>

  <p class="rangee nav">
    {#if etape > 0}<button class="discret" onclick={() => aller(etape - 1)}>Précédent</button>{/if}
    <button class="principal" onclick={suivant} disabled={occupe}>{BOUTONS[etape]}</button>
  </p>
</section>

<style>
  .diapo { padding: 10px 14px 14px; background: var(--fond); color: var(--encre); border-top: 6px solid var(--jaune); }
  .contenu, .nav { transition: opacity 0.4s; }
  /* Pendant qu'on gratte la peinture, le texte s'estompe pour laisser l'œil sur les bus qui changent. */
  .occupe .contenu, .occupe .nav { opacity: 0.25; }
  .tete { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .compteur { margin: 0; color: var(--discret); }
  .passer { min-height: 40px; padding: 4px 12px; font-size: 15px; }
  h2 { margin: 4px 0 10px; font-size: 21px; }
  h2:focus { outline: none; }
  .message { font-size: 18px; font-weight: 600; }
  .contenu > :last-child { margin-bottom: 0; }
  .nav { justify-content: flex-end; flex-wrap: nowrap; margin: 12px 0 0; }
  .nav button { padding-inline: 14px; }
  @media (prefers-reduced-motion: reduce) { .contenu, .nav { transition: none; } }
</style>

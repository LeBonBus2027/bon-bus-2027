<script lang="ts">
  import Bus from "../lib/Bus.svelte";
  import BusAnime from "../lib/BusAnime.svelte";
  import Photo from "../lib/Photo.svelte";
  import type { Classe } from "../lib/calcul";
  import type { Candidat } from "../lib/donnees";
  import { NIVEAUX, type Niveau } from "../lib/niveaux";
  import { arrets, effet, EFFET, type Peinture } from "../lib/revelation";

  /**
   * « Gratter la peinture » : pour chaque bus, le bus imaginé au départ puis ce qu'il vaut vraiment pour toi.
   * Les grands écarts (bus beau devenu cabossé ou épave) prennent toute la largeur, avec un bandeau de chantier ;
   * la réussite (« J'adore » et vraiment l'autocar de luxe) a un cadre doré et « = » au lieu de la flèche.
   * Sans onPourquoi (diaporama), les cartes ne sont pas cliquables ; compact les range sur deux colonnes.
   */
  let { focus, bacs, peinture, onPourquoi, compact = false, titre = true }: {
    focus: readonly Classe<Candidat>[];
    bacs: Record<string, Niveau>;
    /** Peinture grattée de chaque bus (d'après son rang). */
    peinture: Record<string, Peinture>;
    onPourquoi?: (id: string) => void;
    compact?: boolean;
    /** false quand le titre est déjà donné autour (diaporama). */
    titre?: boolean;
  } = $props();

  const nomBus = (n: Niveau) => NIVEAUX.find(x => x.cle === n)?.bus ?? "";
</script>

<section class="avant-apres" class:compact aria-labelledby={titre ? "titre-avant-apres" : undefined}>
  {#if titre}<h2 id="titre-avant-apres">On a gratté la peinture</h2>{/if}
  {#if compact}<p class="legende etiquette-signal" aria-hidden="true">Tu voyais → pour toi</p>{/if}
  <ul>
    {#each focus as f, i (f.candidat.id)}
      {@const avant = bacs[f.candidat.id] ?? "inconnu"}
      {@const apres = peinture[f.candidat.id] ?? "bof"}
      {@const e = effet(avant, apres)}
      {@const resume = `Tu voyais : ${nomBus(avant)}. Pour toi : ${nomBus(apres)}, ${arrets(f.trajet.arrets)}.${e ? ` ${EFFET[e]}.` : ""}`}
      {@const juste = e === "brille"}
      <li style:--retard="{i * 0.15}s" class:ecart={e === "panne"} class:reussite={juste}>
        {#snippet contenu()}
          <span class="qui"><Photo id={f.candidat.id} taille={compact ? 32 : 40} /><strong>{f.candidat.nom}</strong></span>
          <span class="bus" aria-hidden="true">
            <span class="etat">
              <svg viewBox="-34 -8 240 112" aria-hidden="true"><Bus niveau={avant} /></svg>
              {#if !compact}<span class="etiquette-signal">Tu voyais</span>{/if}
            </span>
            <span class="fleche" aria-hidden="true">{juste ? "=" : "→"}</span>
            <span class="etat apres">
              <BusAnime niveau={apres} effet={e} retard={i * 0.15 + 0.3} />
              <span class="etiquette-signal">{compact ? arrets(f.trajet.arrets) : `Pour toi · ${arrets(f.trajet.arrets)}`}</span>
            </span>
          </span>
        {/snippet}
        {#if onPourquoi}
          <button class="carte-bus" onclick={() => onPourquoi(f.candidat.id)}>
            {@render contenu()}
            <span class="visually-hidden">{resume} Voir pourquoi.</span>
          </button>
        {:else}
          <div class="carte-bus">
            {@render contenu()}
            <span class="visually-hidden">{resume}</span>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  .avant-apres h2 { margin-top: 20px; }
  ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
  li { animation: entree 0.5s ease-out both; animation-delay: var(--retard); }
  @keyframes entree { from { opacity: 0; transform: translateY(8px); } }
  .carte-bus { width: 100%; display: grid; gap: 6px; text-align: left; background: var(--panneau); color: var(--marque); border: 2px solid var(--contour); border-radius: var(--rayon); padding: 10px 12px; }
  .qui { display: flex; align-items: center; gap: 10px; }
  .bus { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 6px; }
  .etat { display: grid; justify-items: center; gap: 2px; }
  .etat svg { width: 100%; max-width: 130px; height: auto; }
  .etat .etiquette-signal { font-size: 11.5px; color: #4a5b72; text-align: center; }
  .fleche { font-size: 26px; font-weight: 900; }
  .apres :global(.anime) { max-width: 130px; }
  /* Diaporama : deux cartes par ligne pour tenir dans la fenêtre de la carte. */
  .compact ul { grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 8px; }
  .compact .carte-bus { padding: 6px 8px; gap: 2px; border-color: var(--trait); }
  .compact .qui { gap: 6px; font-size: 15px; line-height: 1.2; }
  .compact .fleche { font-size: 18px; }
  /* Compact : petit bus de départ, grand bus d'arrivée pour que l'effet se voie. */
  .compact .bus { grid-template-columns: 40px auto 1fr; }
  .compact .etat svg { max-width: 40px; }
  .compact .apres :global(.anime) { max-width: 92px; }
  .legende { margin: 0 0 6px; color: var(--discret); }

  /* Grand écart : toute la largeur, bus en grand, bandeau de chantier, et la carte encaisse le choc. */
  .ecart { grid-column: 1 / -1; }
  .ecart .carte-bus, .compact .ecart .carte-bus { position: relative; overflow: hidden; border: 3px solid var(--contour); padding-top: 20px; }
  .ecart .carte-bus::before { content: ""; position: absolute; inset: 0 0 auto; height: 10px; background: repeating-linear-gradient(-45deg, var(--jaune) 0 12px, var(--marque) 12px 24px); }
  .ecart .qui, .compact .ecart .qui { font-size: 18px; }
  .compact .ecart .bus { grid-template-columns: minmax(0, 1fr) auto minmax(0, 1.5fr); }
  .compact .ecart .etat svg { max-width: 110px; }
  .compact .ecart .apres :global(.anime) { max-width: 180px; }
  .ecart .etiquette-signal { font-size: 13px; }
  li.ecart { animation: entree 0.5s ease-out both, choc 0.45s ease-in-out calc(var(--retard) + 1.4s); }
  @keyframes choc { 0%, 100% { transform: none; } 20%, 60% { transform: translateX(-5px) rotate(-0.6deg); } 40%, 80% { transform: translateX(5px) rotate(0.6deg); } }

  /* Réussite : tu l'avais bien vu. */
  .reussite .carte-bus, .compact .reussite .carte-bus { border: 3px solid var(--jaune); box-shadow: 0 0 14px rgb(255 205 0 / 0.55); }
  .reussite .fleche { display: grid; place-items: center; width: 1.5em; height: 1.5em; border-radius: 50%; background: var(--jaune); color: var(--marque); line-height: 1; }
  @media (prefers-reduced-motion: reduce) { li { animation: none; } }
</style>

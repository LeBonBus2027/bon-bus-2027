<script lang="ts">
  import Bus from "../lib/Bus.svelte";
  import Photo from "../lib/Photo.svelte";
  import type { Classe } from "../lib/calcul";
  import type { Candidat } from "../lib/donnees";
  import { NIVEAUX, type Niveau } from "../lib/niveaux";
  import { arrets, niveauReel } from "../lib/revelation";

  /** « Gratter la peinture » : pour chaque bus mis en avant, le bus imaginé au départ puis ce qu'il vaut vraiment pour toi. */
  let { focus, bacs, onPourquoi }: {
    focus: readonly Classe<Candidat>[];
    bacs: Record<string, Niveau>;
    onPourquoi: (id: string) => void;
  } = $props();

  const nomBus = (n: Niveau) => NIVEAUX.find(x => x.cle === n)?.bus ?? "";
</script>

<section class="avant-apres" aria-labelledby="titre-avant-apres">
  <h2 id="titre-avant-apres">On a gratté la peinture</h2>
  <ul>
    {#each focus as f, i (f.candidat.id)}
      {@const avant = bacs[f.candidat.id] ?? "inconnu"}
      {@const apres = niveauReel(f.trajet.arrets)}
      <li style:--retard="{i * 0.15}s">
        <button class="carte-bus" onclick={() => onPourquoi(f.candidat.id)}>
          <span class="qui"><Photo id={f.candidat.id} taille={40} /><strong>{f.candidat.nom}</strong></span>
          <span class="bus" aria-hidden="true">
            <span class="etat">
              <svg viewBox="-34 -8 240 112" aria-hidden="true"><Bus niveau={avant} /></svg>
              <span class="etiquette-signal">Tu voyais</span>
            </span>
            <span class="fleche" aria-hidden="true">→</span>
            <span class="etat apres">
              <svg viewBox="-34 -8 240 112" aria-hidden="true"><Bus niveau={apres} /></svg>
              <span class="etiquette-signal">Pour toi · {arrets(f.trajet.arrets)}</span>
            </span>
          </span>
          <span class="visually-hidden">Tu voyais : {nomBus(avant)}. Pour toi : {nomBus(apres)}, {arrets(f.trajet.arrets)}. Voir pourquoi.</span>
        </button>
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
  .apres svg { animation: mue 0.8s ease-out both; animation-delay: calc(var(--retard) + 0.4s); transform-origin: center; }
  @keyframes mue { 0% { transform: scale(0.5) rotate(-8deg); opacity: 0; } 60% { transform: scale(1.12) rotate(3deg); opacity: 1; } 100% { transform: none; } }
  @media (prefers-reduced-motion: reduce) { li, .apres svg { animation: none; } }
</style>

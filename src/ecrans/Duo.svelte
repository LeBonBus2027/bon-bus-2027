<script lang="ts">
  import { tick } from "svelte";
  import Photo from "../lib/Photo.svelte";
  import { candidats, positions } from "../lib/donnees";
  import { comparer, type Partie } from "../lib/duo";
  import { arrets } from "../lib/revelation";
  import Trajet from "./Trajet.svelte";

  let { noms, parties, onRecommencer }: {
    noms: [string, string];
    parties: [Partie, Partie];
    onRecommencer: () => void;
  } = $props();

  // Les candidats vus par l'un ou l'autre.
  const ids = $derived(candidats.filter(c => c.id in parties[0].bacs || c.id in parties[1].bacs).map(c => c.id));
  const comp = $derived(comparer(parties[0], parties[1], ids, positions));
  const parId = new Map(candidats.map(c => [c.id, c]));
  const commun = $derived(parId.get(comp.commun.id)!);

  let onglet = $state<0 | 1 | 2>(2);
  // Onglets courts à l'écran (prénoms), complets pour les lecteurs d'écran (« Trajet de … »).
  const ONGLETS = $derived([[ "Trajet de ", noms[0]], ["Trajet de ", noms[1]], ["", "Ensemble"]] as const);

  async function choisir(i: 0 | 1 | 2) {
    onglet = i;
    await tick();
    document.getElementById(`panneau-${i}`)?.querySelector<HTMLElement>("h1, h2")?.focus();
  }

  function clavier(e: KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    choisir(((onglet + (e.key === "ArrowRight" ? 1 : 2)) % 3) as 0 | 1 | 2);
    document.getElementById(`onglet-${onglet}`)?.focus();
  }

  const proximite = (n: number) =>
    n <= 3 ? "Vos idées sont très proches." : n <= 7 ? "Vous êtes plutôt d'accord." : n <= 12 ? "Vous êtes partagés." : "Vous partez dans des directions opposées.";
</script>

<div class="onglets" role="tablist" aria-label="Résultats du duo" tabindex="-1" onkeydown={clavier}>
  {#each ONGLETS as titre, i (i)}
    <button role="tab" id="onglet-{i}" aria-selected={onglet === i} aria-controls="panneau-{i}" tabindex={onglet === i ? 0 : -1} class:actif={onglet === i} onclick={() => choisir(i as 0 | 1 | 2)}><span class="visually-hidden">{titre[0]}</span>{titre[1]}</button>
  {/each}
</div>

{#if onglet === 2}
  <div id="panneau-2" role="tabpanel" aria-labelledby="onglet-2">
    <h1 tabindex="-1">{noms[0]} et {noms[1]}</h1>
    <div class="maisons boite">
      <p class="etiquette-signal">Entre vos deux maisons</p>
      <p class="chiffre">{comp.maisons} arrêt{comp.maisons > 1 ? "s" : ""}</p>
      <p>{proximite(comp.maisons)} Sur les {comp.communes} questions auxquelles vous avez répondu tous les deux, vous étiez du même côté sur <strong>{comp.accord}</strong> et de côtés opposés sur <strong>{comp.desaccord}</strong>.</p>
    </div>

    <h2>Le bus qui vous rapproche tous les deux</h2>
    <div class="commun">
      <Photo id={commun.id} taille={64} />
      <div>
        <strong>{commun.nom}</strong>
        <p class="discret">{noms[0]} : {arrets(comp.commun.a)} · {noms[1]} : {arrets(comp.commun.b)}</p>
      </div>
    </div>
    <p class="discret petit">C'est le compromis : le bus qui laisse la personne la plus éloignée de vous deux le moins loin possible de chez elle. Aucun bus ne dépose deux personnes pile devant chez elles.</p>

    <h2>Tous les bus, pour vous deux</h2>
    <div class="tableau">
      <table>
        <thead><tr><th scope="col">Candidat</th><th scope="col">{noms[0]}</th><th scope="col">{noms[1]}</th></tr></thead>
        <tbody>
          {#each comp.lignes as l (l.id)}
            <tr>
              <td class="qui"><Photo id={l.id} taille={36} /> {parId.get(l.id)?.nom}</td>
              <td>{arrets(l.a)}</td>
              <td>{arrets(l.b)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="rangee fin">
      <button onclick={() => choisir(0)}>Voir le trajet de {noms[0]}</button>
      <button onclick={() => choisir(1)}>Voir le trajet de {noms[1]}</button>
      <button class="discret" onclick={onRecommencer}>Recommencer</button>
    </p>
  </div>
{:else}
  {#key onglet}
    {@const p = parties[onglet]}
    <div id="panneau-{onglet}" role="tabpanel" aria-labelledby="onglet-{onglet}">
      <Trajet bacs={p.bacs} reponses={p.reponses} ordre={p.ordre} {onRecommencer} />
    </div>
  {/key}
{/if}

<style>
  .onglets { display: flex; gap: 6px; margin-bottom: 14px; overflow-x: auto; }
  .onglets button { flex: 1 1 0; min-width: 0; border-radius: 6px; font-size: 15px; padding: 8px 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .onglets button.actif { background: var(--jaune); border-color: var(--jaune); color: var(--marque); font-weight: 900; }
  .maisons p { margin: 0 0 6px; }
  .chiffre { font-size: 44px; font-weight: 900; line-height: 1.1; }
  .commun { display: flex; align-items: center; gap: 14px; }
  .commun strong { font-size: 22px; }
  .commun p { margin: 2px 0 0; }
  .tableau { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 16.5px; }
  th { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; }
  th, td { padding: 8px 10px; border-bottom: 1px solid var(--trait); }
  td.qui { display: flex; align-items: center; gap: 10px; }
  .fin { margin-top: 20px; }
</style>

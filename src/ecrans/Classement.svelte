<script lang="ts">
  import { untrack } from "svelte";
  import Bus from "../lib/Bus.svelte";
  import Photo from "../lib/Photo.svelte";
  import { candidats, enSilence, selection, type Candidat } from "../lib/candidats";
  import { NIVEAUX, BAC, type Niveau } from "../lib/niveaux";

  let { ordre = $bindable(), bacs = $bindable(), onFini }: {
    /** Candidats retenus (sondages ≥ seuil), puis ceux ajoutés à la main. */
    ordre: Candidat[];
    bacs: Record<string, Niveau>;
    onFini: () => void;
  } = $props();

  // Si tout est déjà rangé (retour en arrière), on rouvre directement le récapitulatif.
  let index = $state(untrack(() => (Object.keys(bacs).length >= ordre.length ? ordre.length : 0)));
  const courant = $derived(ordre[index]);
  // Comparaison par identifiant : les objets de `ordre` sont des proxys réactifs, pas les objets d'origine.
  const presents = $derived(new Set(ordre.map(c => c.id)));
  const autres = $derived(candidats.filter(c => !presents.has(c.id)).sort((a, b) => a.nom.localeCompare(b.nom, "fr")));
  let titre: HTMLHeadingElement | undefined = $state();

  function choisir(niveau: Niveau) {
    if (!courant) return;
    bacs[courant.id] = niveau;
    // Après une modification depuis le récapitulatif, on y retourne directement.
    const suivant = ordre.findIndex((c, i) => i > index && !(c.id in bacs));
    index = suivant === -1 ? ordre.length : suivant;
    titre?.focus();
  }

  // « Ajouter des candidats » : on coche ceux qu'on veut, puis on les ajoute d'un coup ; ils passent ensuite un par un dans les bacs.
  let coches = $state<string[]>([]);
  function ajouter() {
    const nouveaux = autres.filter(c => coches.includes(c.id));
    if (!nouveaux.length) return;
    index = ordre.length;
    ordre.push(...nouveaux);
    coches = [];
    titre?.focus();
  }
</script>

{#if courant}
  <p class="etiquette-signal discret" aria-live="polite">Candidat {index + 1} sur {ordre.length}</p>
  <div class="identite">
    <Photo id={courant.id} taille={112} />
    <div>
      <h1 tabindex="-1" bind:this={titre}>{courant.nom}</h1>
      <p class="discret">{courant.parti}</p>
    </div>
  </div>

  <p>Spontanément, sans réfléchir, il te fait quel effet ?</p>
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
  {#if index === 0 && Object.keys(bacs).length === 0}
    {#if enSilence}
      <p class="discret petit">On te propose les {ordre.length} candidats recensés par MonVote2027.</p>
    {:else}
      <p class="discret petit">On te propose les {ordre.length} candidats à {selection.seuil} % ou plus dans la moyenne des sondages. Tu pourras en ajouter d'autres juste après.</p>
    {/if}
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
            <button onclick={() => (index = ordre.indexOf(c))}>
              <Photo id={c.id} taille={56} />
              <svg viewBox="-34 -8 240 112" aria-hidden="true"><Bus niveau={n.cle} /></svg>
              <span>{c.nom}</span><span class="visually-hidden">, bac {BAC[n.cle]} : modifier</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {/each}

  {#if autres.length}
    <details class="boite ajout">
      <summary>Ajouter des candidats ({autres.length} autres)</summary>
      <p class="discret petit">{#if !enSilence}Ces candidats sont sous {selection.seuil} % dans la moyenne des sondages, ou n'y figurent pas. {/if}Coche ceux que tu veux voir partir de la gare, puis ajoute-les.</p>
      <ul>
        {#each autres as c (c.id)}
          <li>
            <label class:coche={coches.includes(c.id)}>
              <input type="checkbox" value={c.id} bind:group={coches} />
              <Photo id={c.id} taille={40} /> <span class="nom">{c.nom}<span class="parti">{c.parti}</span></span>
            </label>
          </li>
        {/each}
      </ul>
      <p class="ajouter">
        <button class="principal" onclick={ajouter} disabled={!coches.length}>
          {coches.length ? `Ajouter ${coches.length === 1 ? "ce candidat" : `ces ${coches.length} candidats`}` : "Coche au moins un candidat"}
        </button>
        {#if coches.length}<button class="discret" onclick={() => (coches = [])}>Tout décocher</button>{/if}
      </p>
    </details>
  {/if}

  <p class="suite"><button class="principal" onclick={onFini}>Les bus sont prêts, place aux questions</button></p>
{/if}

<style>
  .identite { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
  .identite h1 { margin: 0 0 4px; }
  .identite p { margin: 0; }
  .bacs { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; margin: 12px 0; }
  .bacs button, .gare button {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    border-radius: var(--rayon); border-color: var(--trait); padding: 10px; background: var(--panneau); color: var(--marque);
  }
  .bacs button { background: var(--panneau); color: var(--marque); border: 2px solid var(--contour); font-weight: 800; text-transform: uppercase; font-size: 15px; letter-spacing: 0.03em; }
  .bacs button.actif { background: var(--jaune); }
  .bacs svg { width: 100%; max-width: 140px; height: auto; }
  .gare { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
  .gare svg { width: 100%; max-width: 110px; height: auto; }
  .gare span { font-size: 16px; text-align: center; }
  .ajout { margin-top: 24px; }
  .ajout summary { cursor: pointer; font-weight: 600; min-height: 32px; }
  .ajout ul { list-style: none; padding: 0; margin: 8px 0 0; display: grid; gap: 6px; }
  .ajout label { display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 4px 10px; border: 2px solid var(--trait); border-radius: var(--rayon); cursor: pointer; }
  .ajout label.coche { border-color: var(--contour); background: var(--fond); box-shadow: inset 5px 0 0 var(--jaune); }
  .ajout .nom { display: grid; font-weight: 600; line-height: 1.25; }
  .ajout .parti { color: var(--discret); font-size: 14.5px; font-weight: 400; }
  .ajout input { width: 24px; height: 24px; margin: 0; flex: none; accent-color: var(--marque); }
  .ajouter { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 0; }
  .suite { margin-top: 24px; }
</style>

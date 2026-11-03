<script lang="ts">
  import { untrack } from "svelte";
  import { tirerQuestions } from "../lib/tirage";
  import { MIN_REPONSES, type Reponse } from "../lib/calcul";
  import { grandTheme, questions } from "../lib/donnees";
  import Maison from "../lib/Maison.svelte";
  import PlusLoin, { type Explication } from "../lib/PlusLoin.svelte";

  let { reponses = $bindable(), ordre = $bindable(), format = $bindable(), debut = 0, onFini }: {
    reponses: Record<string, Reponse>;
    ordre: string[];
    format: 20 | 100 | null;
    /** Question où reprendre (après « Affine ton résultat », on reprend après les questions déjà posées). */
    debut?: number;
    onFini: () => void;
  } = $props();

  const CHOIX: { valeur: Reponse; libelle: string }[] = [
    { valeur: 2, libelle: "Tout à fait d'accord" },
    { valeur: 1, libelle: "Plutôt d'accord" },
    { valeur: 0, libelle: "Neutre" },
    { valeur: -1, libelle: "Plutôt pas d'accord" },
    { valeur: -2, libelle: "Pas du tout d'accord" },
  ];

  let index = $state(untrack(() => debut));
  let titre: HTMLHeadingElement | undefined = $state();
  const parId = new Map(questions.map(q => [q.id, q]));
  const courante = $derived(parId.get(ordre[index] ?? ""));
  const nbReponses = $derived(ordre.filter(id => (reponses[id] ?? null) !== null).length);
  const progression = $derived(ordre.length ? index / ordre.length : 0);

  // « De quoi parle-t-on ? » : 100 textes (≈ 100 ko compressés), chargés à part pour ne pas alourdir l'accueil.
  let explications: Record<string, Explication> | null = $state(null);
  // « De quoi parle-t-on ? » replié au départ ; si tu le déplies, il reste déplié aux questions suivantes.
  let explicationOuverte = $state(false);
  $effect(() => { if (format && !explications) import("../../data/explications.json").then(m => (explications = m.default as Record<string, Explication>)); });

  function lancer(f: 20 | 100) {
    format = f;
    // Nouveau tirage à chaque parcours : 20 questions au hasard (2 par grand thème) ou les 100, toujours dans un ordre différent.
    ordre = tirerQuestions(questions, f);
    index = 0;
  }

  function repondre(valeur: Reponse) {
    if (!courante) return;
    reponses[courante.id] = valeur;
    index += 1;
    titre?.focus();
  }

  function revoirPassees() {
    const i = ordre.findIndex(id => (reponses[id] ?? null) === null);
    index = i === -1 ? 0 : i;
  }
</script>

{#if !format}
  <h1 tabindex="-1">Maintenant, tes idées</h1>
  <p>On va construire ta maison : chaque réponse en pose une brique. Ensuite, on verra quel bus s'arrête le plus près.</p>
  <div class="formats">
    <button class="boite" onclick={() => lancer(20)}><strong>Version rapide</strong><span>20 questions tirées au hasard parmi 100 · 2 à 3 minutes</span></button>
    <button class="boite" onclick={() => lancer(100)}><strong>Version complète</strong><span>100 questions · 10 minutes, plus précis</span></button>
  </div>
  <p class="discret petit">Les questions et les positions des candidats viennent de <a href="https://monvote2027.fr/donnees" target="_blank" rel="noopener noreferrer">MonVote2027</a>.</p>
{:else if courante}
  <div class="entete">
    <p class="etiquette-signal discret" aria-live="polite">Question {index + 1} sur {ordre.length} · {grandTheme(courante)}</p>
    <svg class="maison" viewBox="0 0 60 56" aria-hidden="true" fill="currentColor"><Maison {progression} /></svg>
  </div>
  <div class="barre" aria-hidden="true"><div style:transform="scaleX({progression})"></div></div>

  <h1 tabindex="-1" bind:this={titre} class="question">{courante.texte}</h1>
  {#if explications?.[courante.id]}
    <PlusLoin id={courante.id} texte={explications[courante.id]!} bind:ouvert={explicationOuverte} />
  {:else if !explications}
    <div class="attente" aria-hidden="true"></div>
  {/if}

  <div class="choix" role="group" aria-label="Ta réponse">
    {#each CHOIX as c (c.valeur)}
      <button class:actif={reponses[courante.id] === c.valeur} aria-pressed={reponses[courante.id] === c.valeur} onclick={() => repondre(c.valeur)}>{c.libelle}</button>
    {/each}
  </div>
  <p class="rangee">
    <button class="discret" onclick={() => repondre(null)}>Passer</button>
    {#if index > 0}<button class="discret" onclick={() => (index -= 1)}>Précédente</button>{/if}
  </p>
{:else}
  <h1 tabindex="-1">Ta maison est construite</h1>
  {#if nbReponses < MIN_REPONSES}
    <p>Tu as répondu à {nbReponses} question{nbReponses > 1 ? "s" : ""}. Il en faut au moins {MIN_REPONSES} pour que les bus sachent où aller.</p>
    <p><button class="principal" onclick={revoirPassees}>Revoir les questions passées</button></p>
  {:else}
    <p>{nbReponses} réponses sur {ordre.length}. Tous les bus attendent à la gare. On regarde lequel te rapproche le plus de chez toi ?</p>
    <p class="rangee">
      <button class="principal" onclick={onFini}>Faire partir les bus</button>
      <button class="discret" onclick={() => (index = ordre.length - 1)}>Revenir aux questions</button>
    </p>
  {/if}
{/if}

<style>
  .formats { display: grid; gap: 10px; margin: 16px 0; }
  .formats button { display: flex; flex-direction: column; align-items: flex-start; text-align: left; border-radius: var(--rayon); gap: 2px; }
  .formats span { color: var(--discret); font-size: 16px; }
  .entete { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; }
  .maison { width: 60px; height: 56px; flex: none; }
  .barre { height: 6px; background: var(--trait); border-radius: 3px; overflow: hidden; margin: 6px 0 4px; }
  .barre div { height: 100%; background: var(--accent); transform-origin: left; transition: transform 0.3s; }
  /* La question reste visible en haut de l'écran pendant qu'on lit « De quoi parle-t-on ? » et les réponses. */
  .question { font-size: clamp(22px, 5vw, 28px); position: sticky; top: 0; z-index: 2; margin-inline: -16px; padding: 10px 16px; background: var(--fond); box-shadow: 0 8px 8px -8px rgb(11 31 58 / 0.25); }
  .attente { height: 64px; margin: 6px 0 14px; border-radius: calc(var(--rayon) * 1.5); background: var(--carte); }
  .choix { display: grid; gap: 8px; margin: 16px 0 12px; }
  .choix button { border-radius: var(--rayon); text-align: left; }
  .choix button.actif { background: var(--encre); color: var(--fond); }
  .formats button { border: 2px solid var(--contour); }
</style>

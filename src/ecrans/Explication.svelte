<script lang="ts">
  import { pas, type Position, type Reponse, type Trajet } from "../lib/calcul";
  import { questions, type Candidat } from "../lib/donnees";
  import { BAC, type Niveau } from "../lib/niveaux";
  import { arrets, niveauReel, VU } from "../lib/revelation";
  import Photo from "../lib/Photo.svelte";

  let { candidat, trajet, bac, ordre, reponses, positions, onFermer }: {
    candidat: Candidat;
    trajet: Trajet;
    bac: Niveau;
    /** Questions répondues, dans l'ordre de rejeu. */
    ordre: readonly string[];
    reponses: Readonly<Record<string, Reponse>>;
    positions: Readonly<Record<string, Position>>;
    onFermer: () => void;
  } = $props();

  const TOI: Record<number, string> = { 2: "Tout à fait d'accord", 1: "Plutôt d'accord", 0: "Neutre", [-1]: "Plutôt pas d'accord", [-2]: "Pas du tout d'accord" };
  const LUI: Record<number, string> = { 2: "Tout à fait pour", 1: "Plutôt pour", 0: "Neutre ou partagé", [-1]: "Plutôt contre", [-2]: "Tout à fait contre" };
  const parId = new Map(questions.map(q => [q.id, q]));

  const lignes = $derived(ordre.map(id => {
    const u = reponses[id] ?? null, p = positions[id] ?? null;
    return { id, texte: parId.get(id)?.texte ?? id, u, p, pas: pas(u, p) };
  }));
  const pour = $derived(lignes.filter(l => l.pas > 0).sort((a, b) => b.pas - a.pas));
  const contre = $derived(lignes.filter(l => l.pas < 0).sort((a, b) => a.pas - b.pas));
  const neutres = $derived(lignes.length - pour.length - contre.length);
  const lieu = $derived(trajet.arrets > 10 ? "Son bus est reparti dans l'autre sens, vers le terminus." : trajet.arrets === 10 ? "Son bus n'a pas bougé de la gare." : "");

  let titre: HTMLHeadingElement | undefined = $state();
  $effect(() => { void candidat.id; titre?.focus(); });
</script>

{#snippet ligne(l: (typeof lignes)[number])}
  <li>
    <span class="q">{l.texte}</span>
    <span class="detail">Toi : {TOI[l.u ?? 0]} · Candidat : {l.p === null ? "pas de position" : LUI[l.p]} → {l.pas > 0 ? `avance de ${l.pas}` : l.pas < 0 ? `recule de ${-l.pas}` : "ne bouge pas"}</span>
  </li>
{/snippet}

<section class="boite explication" aria-labelledby="titre-explication">
  <div class="tete">
    <Photo id={candidat.id} taille={56} />
    <h2 id="titre-explication" tabindex="-1" bind:this={titre}>Pourquoi {candidat.nom} s'arrête à {arrets(trajet.arrets)}</h2>
    <button class="discret fermer" onclick={onFermer} aria-label="Fermer l'explication">✕</button>
  </div>
  <p>Tu avais mis ce bus dans le bac « {BAC[bac]} ». Peinture grattée, pour toi c'est en réalité <strong>{VU[niveauReel(trajet.arrets)]}</strong>. {lieu}</p>
  <p>Sur tes {lignes.length} réponses, son bus a avancé sur <strong>{pour.length}</strong>, reculé sur <strong>{contre.length}</strong> et n'a pas bougé sur {neutres}.</p>

  {#if pour.length}
    <h3>Ce qui a rapproché son bus de chez toi</h3>
    <ul>{#each pour.slice(0, 3) as l (l.id)}{@render ligne(l)}{/each}</ul>
  {/if}
  {#if contre.length}
    <h3>Ce qui a éloigné son bus</h3>
    <ul>{#each contre.slice(0, 3) as l (l.id)}{@render ligne(l)}{/each}</ul>
  {/if}

  <details>
    <summary>Voir les {lignes.length} questions</summary>
    <ul>{#each lignes as l (l.id)}{@render ligne(l)}{/each}</ul>
  </details>
  <p class="petit"><a href={candidat.url_source} target="_blank" rel="noopener noreferrer">Ses positions sourcées sur MonVote2027</a></p>
</section>

<style>
  .explication { margin: 12px 0; }
  .tete { display: flex; align-items: flex-start; gap: 12px; }
  .tete h2 { flex: 1; }
  h2 { margin: 0 0 8px; font-size: 20px; }
  h3 { font-size: 17px; margin: 16px 0 6px; }
  .fermer { min-width: 48px; padding: 0; flex: none; }
  ul { padding-left: 18px; margin: 0; }
  li { margin-bottom: 10px; }
  .q { display: block; }
  .detail { display: block; color: var(--discret); font-size: 15px; }
  details { margin-top: 14px; }
  .petit a { display: inline-block; min-height: 32px; padding: 4px 0; }
  summary { cursor: pointer; font-weight: 600; min-height: 32px; }
</style>

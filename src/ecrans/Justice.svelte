<script lang="ts">
  import { affairesPubliees, chargerJustice, condamnation, dateJustice, nombre, partiDe, precision, resume, type Affaire, type Justice } from "../lib/justice";

  /**
   * « Ce que dit la justice » pour un candidat : ses décisions de justice vérifiées, telles quelles, avec leur statut,
   * puis celles qui visent des membres de son parti (repliées). Même présentation pour tous ; aucun commentaire.
   * detail = version complète avec peines et sources (explication du trajet) ; sinon une ligne par affaire (récap).
   */
  let { id, detail = true }: { id: string; detail?: boolean } = $props();

  let justice = $state<Justice | null>(null);
  $effect(() => { chargerJustice().then(j => { justice = j; }); });
  const affaires = $derived<Affaire[] | null | undefined>(justice ? affairesPubliees(justice, id) : undefined);
  const parti = $derived(justice ? partiDe(justice, id) : undefined);
  const personnes = $derived(parti ? new Set(parti.affaires.map(a => a.personne)).size : 0);
</script>

{#snippet sources(a: Affaire)}
  <p class="discret petit sources">Sources :
    {#each a.sources as s, i (i)}{#if i}, {/if}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.titre}</a>{/each}{a.note ? `. ${a.note}` : ""}
  </p>
{/snippet}

{#if affaires === undefined}
  <p class="discret petit">Chargement…</p>
{:else if affaires === null}
  <p class="discret petit">Pas encore vérifié pour ce candidat.</p>
{:else if !affaires.length}
  <p class="discret petit">Aucune décision de justice à son encontre n'a été trouvée (recherche du {dateJustice(justice!.date)}).</p>
{:else if detail}
  <ul class="affaires">
    {#each affaires as a, i (`${i}-${a.affaire}`)}
      <li>
        <p class="titre"><strong>{a.infraction}</strong> · {a.affaire}</p>
        <ol class="decisions">
          {#each a.decisions as d, i (i)}
            <li><span class="quand">{dateJustice(d.date)}</span> · {d.juridiction} : <strong>{d.issue}</strong>{d.peine ? ` — ${d.peine}` : ""}</li>
          {/each}
        </ol>
        <p class="statut petit"><span class="etiquette-signal">Statut</span> {a.statut}{#if precision(a) === "présomption d'innocence"}. Décision non définitive : la présomption d'innocence s'applique jusqu'à la décision définitive{:else if precision(a)}. Décision non définitive{/if}.</p>
        {@render sources(a)}
      </li>
    {/each}
  </ul>
{:else}
  <ul class="lignes">
    {#each affaires as a, i (`${i}-${a.affaire}`)}
      <li class:relaxe={!condamnation(a)}>{resume(a)}{#if precision(a)}{" "}<span class="discret">({precision(a)})</span>{/if}</li>
    {/each}
  </ul>
{/if}

{#if parti && affaires !== undefined}
  {#if parti.affaires.length}
    <details class="parti">
      <summary>Dans son parti ({parti.nom}) : {nombre(parti.affaires.length, "décision")} visant {nombre(personnes, "personne")}</summary>
      <p class="discret petit">Élus et responsables dont le parti actuel est le sien, d'après <a href="https://poligraph.fr" target="_blank" rel="noopener noreferrer">Poligraph</a>. Leur nombre dépend aussi de la taille et de l'ancienneté du parti.</p>
      <ul class="lignes">
        {#each parti.affaires as a, i (`${i}-${a.personne}-${a.affaire}`)}
          <li class:relaxe={!condamnation(a)}><strong>{a.personne}</strong> · {resume(a)}{#if detail && a.sources.length} · <a href={a.sources.at(-1)!.url} target="_blank" rel="noopener noreferrer">sources</a>{/if}</li>
        {/each}
      </ul>
    </details>
  {:else}
    <p class="discret petit">Aucune décision visant des membres de son parti ({parti.nom}) n'a été trouvée.</p>
  {/if}
{/if}

<style>
  .affaires { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
  .affaires > li { border-left: 4px solid var(--trait); padding-left: 10px; }
  .titre { margin: 0 0 4px; }
  .decisions { margin: 0 0 4px; padding-left: 18px; font-size: 15.5px; }
  .decisions li { margin-bottom: 2px; }
  .quand { white-space: nowrap; }
  .statut { margin: 0; }
  .statut .etiquette-signal { margin-right: 4px; color: var(--discret); }
  .sources { margin: 4px 0 0; }
  .sources a { display: inline-block; min-height: 24px; }
  .lignes { margin: 0; padding-left: 18px; font-size: 15.5px; }
  .lignes li { margin-bottom: 4px; }
  .lignes li::marker { color: var(--encre); }
  .lignes li.relaxe::marker { color: var(--discret); }
  .parti { margin-top: 8px; }
  .parti summary { min-height: 44px; padding: 10px 0; font-weight: 700; font-size: 15.5px; }
</style>

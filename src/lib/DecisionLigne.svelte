<script lang="ts">
  import { dateJustice, fiche, ISSUE, precision, type Affaire } from "./justice";

  /**
   * Une décision de justice sur une ligne : l'issue en étiquette (condamnation, relaxe, décision civile), l'infraction,
   * la date et le statut (rond plein : définitive ; rond vide : pas encore). Même présentation partout (« Pour rappel »,
   * récap) et pour tous. avecPersonne : nom de la personne visée (décisions visant des membres du parti).
   * depliable : un clic ouvre le détail, tel quel : l'affaire, chaque décision (juridiction, issue, peine), le statut,
   * la note éventuelle et les sources de presse.
   */
  let { affaire, avecPersonne = false, avecPrecision = false, depliable = false }: {
    affaire: Affaire; avecPersonne?: boolean; avecPrecision?: boolean; depliable?: boolean;
  } = $props();
  const l = $derived(fiche(affaire));
  const p = $derived(avecPrecision ? precision(affaire) : "");
</script>

{#snippet ligne()}
  <span class="tag {l.issue}">{ISSUE[l.issue]}</span>
  <span class="corps">
    <span class="infraction">{#if avecPersonne && affaire.personne}<span class="personne">{affaire.personne}</span> · {/if}{l.infraction}</span>
    <span class="meta">{l.quand}{#if l.statut}<span class="statut" class:definitive={l.definitive}>{l.statut}</span>{/if}{#if p}<span class="precision">{p}</span>{/if}</span>
  </span>
{/snippet}

{#if depliable}
  <li class="decision depliable">
    <details>
      <summary class="ligne">{@render ligne()}<span class="ouvrir" aria-hidden="true"></span><span class="visually-hidden"> : voir le détail et les sources</span></summary>
      <div class="detail">
        <p class="affaire">{affaire.affaire}</p>
        {#if affaire.origine}<p class="origine petit">{affaire.origine === "presse" ? "Vérifiée à la main dans la presse." : "D'après Poligraph (au moins deux sources), pas encore revérifiée à la main."}</p>{/if}
        <ol class="etapes">
          {#each affaire.decisions as d, i (i)}
            <li>
              <span class="quand">{dateJustice(d.date)}</span>
              <span>{d.juridiction}{d.juridiction ? " : " : ""}<strong>{d.issue}</strong></span>
              {#if d.peine}<span class="peine">{d.peine}</span>{/if}
            </li>
          {/each}
        </ol>
        <p class="petit"><strong>Statut :</strong> {affaire.statut}{#if p === "présomption d'innocence"}. La présomption d'innocence s'applique jusqu'à la décision définitive{:else if p}. Décision non définitive{/if}.</p>
        {#if affaire.note}<p class="petit">{affaire.note}</p>{/if}
        {#if affaire.sources.length}
          <p class="petit sources-titre"><strong>Sources</strong></p>
          <ul class="sources">
            {#each affaire.sources as s, i (i)}<li><a href={s.url} target="_blank" rel="noopener noreferrer">{s.titre}</a></li>{/each}
          </ul>
        {/if}
      </div>
    </details>
  </li>
{:else}
  <li class="decision ligne">{@render ligne()}</li>
{/if}

<style>
  .ligne { display: grid; grid-template-columns: 8.4em 1fr; gap: 10px; align-items: start; }
  .tag { display: inline-block; text-align: center; padding: 3px 6px; border-radius: 999px; font-size: 12.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; border: 2px solid var(--contour); line-height: 1.2; }
  .tag.condamnation { background: var(--encre); color: var(--fond); }
  .tag.relaxe { background: transparent; color: var(--encre); }
  .tag.civil { background: transparent; color: var(--encre); border-style: dashed; }
  .corps { display: grid; gap: 2px; }
  .infraction { font-weight: 700; line-height: 1.3; }
  .personne { font-weight: 800; }
  .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; font-size: 14.5px; color: var(--discret); }
  .statut { display: inline-flex; align-items: center; gap: 5px; }
  /* Rond plein : décision définitive ; rond vide : procédure encore ouverte. */
  .statut::before { content: ""; width: 8px; height: 8px; border-radius: 50%; border: 2px solid currentColor; }
  .statut.definitive::before { background: currentColor; }
  .precision { font-style: italic; }

  /* Version dépliable : toute la ligne est cliquable, un chevron indique qu'il y a plus. */
  .depliable details { border-radius: var(--rayon); }
  .depliable summary { list-style: none; cursor: pointer; grid-template-columns: 8.4em 1fr 20px; padding: 6px; margin: -6px; border-radius: var(--rayon); }
  .depliable summary::-webkit-details-marker { display: none; }
  .depliable summary:hover { background: var(--fond); }
  .ouvrir { align-self: center; width: 10px; height: 10px; border-right: 2px solid var(--discret); border-bottom: 2px solid var(--discret); transform: rotate(45deg); transition: transform 0.2s; }
  details[open] .ouvrir { transform: rotate(-135deg); }
  .detail { margin: 10px 0 4px calc(8.4em + 10px); padding: 10px 12px; background: var(--fond); border-radius: var(--rayon); border: 1px solid var(--trait); font-size: 15px; }
  .detail p { margin: 0 0 8px; }
  .affaire { font-weight: 700; }
  .origine { color: var(--discret); font-style: italic; }
  .etapes { margin: 0 0 8px; padding-left: 18px; display: grid; gap: 6px; }
  .etapes li { display: grid; gap: 1px; }
  .quand { font-weight: 700; }
  .peine { color: var(--discret); }
  .sources-titre { margin-bottom: 2px !important; }
  .sources { margin: 0; padding: 0; list-style: none; display: grid; gap: 4px; }
  .sources a { display: inline-block; min-height: 24px; padding: 2px 0; }
  @media (max-width: 420px) {
    .ligne { grid-template-columns: 1fr; gap: 4px; }
    .depliable summary { grid-template-columns: 1fr 20px; }
    .depliable summary .tag { grid-column: 1 / -1; }
    .tag { justify-self: start; }
    .detail { margin-left: 0; }
  }
  @media (prefers-reduced-motion: reduce) { .ouvrir { transition: none; } }
</style>

<script lang="ts">
  import { fiche, ISSUE, precision, type Affaire } from "./justice";

  /**
   * Une décision de justice sur une ligne : l'issue en étiquette (condamnation, relaxe, décision civile), l'infraction,
   * la date et le statut (rond plein : définitive ; rond vide : pas encore). Même présentation partout (« Pour rappel »,
   * récap) et pour tous. avecPersonne : nom de la personne visée (décisions visant des membres du parti).
   */
  let { affaire, avecPersonne = false, avecPrecision = false }: { affaire: Affaire; avecPersonne?: boolean; avecPrecision?: boolean } = $props();
  const l = $derived(fiche(affaire));
  const p = $derived(avecPrecision ? precision(affaire) : "");
</script>

<li class="decision">
  <span class="tag {l.issue}">{ISSUE[l.issue]}</span>
  <span class="corps">
    <span class="infraction">{#if avecPersonne && affaire.personne}<span class="personne">{affaire.personne}</span> · {/if}{l.infraction}</span>
    <span class="meta">{l.quand}{#if l.statut}<span class="statut" class:definitive={l.definitive}>{l.statut}</span>{/if}{#if p}<span class="precision">{p}</span>{/if}</span>
  </span>
</li>

<style>
  .decision { display: grid; grid-template-columns: 8.4em 1fr; gap: 10px; align-items: start; }
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
  @media (max-width: 420px) { .decision { grid-template-columns: 1fr; gap: 4px; } .tag { justify-self: start; } }
</style>

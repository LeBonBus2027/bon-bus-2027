<script lang="ts">
  import { tick } from "svelte";
  import { BAC, type Niveau } from "../lib/niveaux";
  import { arrets, type Revelation } from "../lib/revelation";
  import Afficheur from "./Afficheur.svelte";
  import AvantApres from "./AvantApres.svelte";
  import Bilan from "./Bilan.svelte";
  import Partage from "./Partage.svelte";
  import { affairesPubliees, chargerJustice, nombre, type Justice } from "../lib/justice";
  import DecisionLigne from "../lib/DecisionLigne.svelte";
  import Photo from "../lib/Photo.svelte";

  /**
   * Révélation pas à pas, dans le cadre de la carte (juste sous la ville), avant la page récap :
   * 1. où s'arrêtent les bus, 2. la peinture grattée, 3. pour rappel, ce que dit la justice, 4. la girouette et la morale, 5. le partage.
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

  const NB = 5;
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

  const TITRES = ["Tout le monde descend", "On a gratté la peinture", "Pour rappel", "Morale de l'histoire", "Partage ton trajet"];
  const BOUTONS = $derived([gratte ? "Suivant" : "Gratter la peinture", "Suivant", "Suivant", "Suivant", "Voir mon récap"]);

  // « Pour rappel » : ce que dit la justice sur les mêmes candidats que la peinture grattée.
  let justice = $state<Justice | null>(null);
  $effect(() => { chargerJustice().then(j => { justice = j; }); });
  // D'abord les candidats visés par des décisions, puis, ensemble, ceux qui n'en ont aucune.
  // En tête : ton coup de cœur qui t'éloigne (revelation.decu) ; ensuite l'ordre du classement.
  const rappel = $derived(justice ? revelation.rappel.map(f => ({ f, liste: affairesPubliees(justice!, f.candidat.id) ?? [] })) : null);
  const decu = $derived(revelation.decu);
  const avec = $derived((rappel?.filter(r => r.liste.length) ?? []).sort((a, b) => Number(b.f === decu) - Number(a.f === decu)));
  const sans = $derived(rappel?.filter(r => !r.liste.length) ?? []);
</script>

<section class="diapo" class:occupe aria-labelledby="titre-diapo">
  <div class="tete">
    <p class="etiquette-signal compteur">{etape + 1}<span class="visually-hidden"> sur </span><span aria-hidden="true"> / </span>{NB}</p>
    <button class="discret passer" onclick={onFin}>Passer au récap</button>
  </div>
  <h2 id="titre-diapo" tabindex="-1" bind:this={titre}>{TITRES[etape]}</h2>

  <div class="contenu">
    {#if etape === 0}
      <Afficheur podium={revelation.podium} total={revelation.focus.length} />
      <p class="message">{revelation.message}</p>
      {#if !gratte}<p class="discret petit">Pour l'instant, tes bus ont encore la peinture que tu leur as donnée. Dessous, il y a ce qu'ils valent vraiment pour toi.</p>{/if}
    {:else if etape === 1}
      <AvantApres focus={revelation.focus} {bacs} peinture={revelation.peinture} compact titre={false} />
    {:else if etape === 2}
      <p class="petit">Ce que dit la justice sur {revelation.haut ? `tes bus « ${BAC[revelation.haut]} » et ` : ""}les 3 bus qui te rapprochent le plus. Ça ne change pas leur trajet.</p>
      {#if !rappel}<p class="discret petit">Chargement…</p>
      {:else}
        {#if avec.length}
          <ul class="rappel">
            {#each avec as { f, liste } (f.candidat.id)}
              <li class="fiche" class:decu={f === decu}>
                <p class="qui"><Photo id={f.candidat.id} taille={40} /> <strong>{f.candidat.nom}</strong> <span class="compte">{nombre(liste.length, "décision")}</span></p>
                {#if f === decu && revelation.haut}<p class="chapeau">Tu l'avais mis dans le bac « {BAC[revelation.haut]} », mais son bus te laisse à {arrets(f.trajet.arrets)} de chez toi. En plus, voici ce que dit la justice à son sujet.</p>{/if}
                <ul class="lignes">
                  {#each liste.slice(0, 3) as a, i (`${i}-${a.affaire}`)}<DecisionLigne affaire={a} />{/each}
                </ul>
                {#if liste.length > 3}<p class="plus">+ {nombre(liste.length - 3, "autre décision")} dans ton récap</p>{/if}
              </li>
            {/each}
          </ul>
        {/if}
        {#if sans.length}
          <div class="aucune">
            <p>{avec.length ? "Aucune décision de justice connue pour les autres :" : "Aucune décision de justice connue pour ces candidats :"}</p>
            <ul>{#each sans as { f } (f.candidat.id)}<li><Photo id={f.candidat.id} taille={28} /> {f.candidat.nom}</li>{/each}</ul>
          </div>
        {/if}
      {/if}
      <p class="discret petit"><span aria-hidden="true">●</span> décision définitive · <span aria-hidden="true">○</span> pas encore définitive : la présomption d'innocence s'applique. Le détail, les sources et les décisions visant leur parti sont dans ton récap.</p>
    {:else if etape === 3}
      <blockquote class="girouette">{revelation.metaphore}</blockquote>
      <p class="morale"><span>Aucun bus ne te dépose pile devant chez toi. Prends celui qui te rapproche le plus.</span></p>
      <Bilan {revelation} {bacs} />
    {:else}
      <p class="petit">Ton ticket de bus, prêt à partager. Sans les noms, il ne dit rien de tes préférences : juste de quoi donner envie d'essayer.</p>
      <Partage {revelation} {bacs} titre={false} />
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
  .rappel, .lignes, .aucune ul { list-style: none; padding: 0; margin: 0; }
  .rappel { display: grid; gap: 10px; margin-bottom: 10px; }
  .fiche { background: var(--carte); border-left: 5px solid var(--jaune); border-radius: var(--rayon); padding: 10px 12px; }
  .fiche.decu { border-left-width: 8px; }
  .chapeau { margin: 0 0 8px; font-weight: 600; }
  .qui { display: flex; align-items: center; gap: 10px; margin: 0 0 8px; font-size: 17px; }
  .compte { margin-left: auto; font-size: 13.5px; color: var(--discret); white-space: nowrap; }
  .lignes { display: grid; gap: 8px; }
  .plus { margin: 8px 0 0; font-size: 14px; color: var(--discret); }
  .aucune { padding: 10px 12px; border: 2px dashed var(--trait); border-radius: var(--rayon); margin-bottom: 10px; }
  .aucune p { margin: 0 0 8px; font-weight: 600; }
  .aucune ul { display: flex; flex-wrap: wrap; gap: 6px 14px; }
  .aucune li { display: inline-flex; align-items: center; gap: 6px; }
  .nav button { padding-inline: 14px; }
  @media (prefers-reduced-motion: reduce) { .contenu, .nav { transition: none; } }
</style>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Classe } from "../lib/calcul";
  import type { Candidat } from "../lib/donnees";
  import { BAC, NIVEAUX, type Niveau } from "../lib/niveaux";
  import { arrets, type Revelation } from "../lib/revelation";
  import Bus from "../lib/Bus.svelte";
  import Photo from "../lib/Photo.svelte";
  import Afficheur from "./Afficheur.svelte";
  import AvantApres from "./AvantApres.svelte";
  import Justice from "./Justice.svelte";
  import { affairesPubliees, chargerJustice, nombre, type Justice as DonneesJustice } from "../lib/justice";
  import Partage from "./Partage.svelte";

  /*
   * Page récap, dans l'ordre de priorité du message (pour qu'il ne se dilue pas) :
   * 1. le verdict (quel bus te rapproche le plus) ; 2. l'écart entre ton ressenti et la réalité (peinture grattée) ;
   * 3. la leçon (girouette, morale) ; 4. l'appel à voter ; 5. le partage ; 6. le détail bus par bus ;
   * 7. pour aller plus loin (affiner, priorités, rétroviseur), replié ou en retrait ; 8. recommencer.
   */
  let { revelation, classement, bacs, horsSelection, onPourquoi, onRecommencer, onAffiner, restantes = 0, outils }: {
    revelation: Revelation;
    classement: readonly Classe<Candidat>[];
    bacs: Record<string, Niveau>;
    /** Candidat non ajouté qui t'aurait déposé plus près que tous tes bus. */
    horsSelection?: Classe<Candidat>;
    onPourquoi: (id: string) => void;
    /** Présent tant qu'il reste des questions (hors mode duo) : 10 questions ciblées, ou toutes les restantes. */
    onAffiner?: (mode: "cible" | "tout") => void;
    /** Nombre de questions pas encore posées. */
    restantes?: number;
    /** Outils interactifs (priorités, rétroviseur), dans « Pour aller plus loin ». */
    outils?: Snippet;
    onRecommencer: () => void;
  } = $props();

  // « Ce que dit la justice » : le nombre de décisions de chaque candidat, pour l'en-tête de sa carte.
  let justice = $state<DonneesJustice | null>(null);
  $effect(() => { chargerJustice().then(j => { justice = j; }); });
  const nbDecisions = (id: string) => (justice ? (affairesPubliees(justice, id)?.length ?? 0) : null);
</script>

<h2 id="titre-recap" class="etiquette-signal recap" tabindex="-1">Ton récap</h2>
<Afficheur podium={revelation.podium} total={classement.length} />
<p class="message">{revelation.message}</p>

<AvantApres focus={revelation.focus} {bacs} peinture={revelation.peinture} {onPourquoi} compact />

<blockquote class="girouette">{revelation.metaphore}</blockquote>
<p class="morale"><span>Aucun bus ne te dépose pile devant chez toi. Prends celui qui te rapproche le plus.</span></p>

<div class="boite conduis">
  <h2>Maintenant, c'est toi qui conduis</h2>
  <p>Ton vote, c'est une voix de plus dans le bus qui te rapproche le plus. Avant tout, vérifie ton inscription sur les listes électorales : ça prend deux minutes.</p>
  <p><a class="bouton" href="https://www.service-public.fr/particuliers/vosdroits/R51788" target="_blank" rel="noopener noreferrer">Vérifier mon inscription</a></p>
</div>

<Partage {revelation} {bacs} />

<h2>Tes bus</h2>
<p class="discret petit">Où chaque bus s'arrête, de ta porte (à gauche) jusqu'au terminus (à droite), en passant par la gare d'où ils sont tous partis.</p>
<p class="echelle" aria-hidden="true"><span class="graduations"><span>⌂ chez toi</span><span>gare</span><span>terminus</span></span></p>
<ol class="tes-bus">
  {#each classement as c, i (c.candidat.id)}
    {@const avant = bacs[c.candidat.id] ?? "inconnu"}
    {@const apres = revelation.peinture[c.candidat.id] ?? "bof"}
    <li class:premier={i === 0}>
      <span class="rang" aria-hidden="true">{i + 1}</span>
      <Photo id={c.candidat.id} taille={44} />
      <span class="identite">
        <a class="nom" href={c.candidat.url_source} target="_blank" rel="noopener noreferrer">{c.candidat.nom}</a>
        <span class="parti">{c.candidat.parti}</span>
      </span>
      <span class="distance">{arrets(c.trajet.arrets)}{#if c.trajet.incomplet}<span class="incomplet"> (position incomplète)</span>{/if}</span>
      <span class="jauge" aria-hidden="true"><span class="repere" style:left="{Math.min(100, (c.trajet.distance / 20) * 100)}%"></span></span>
      <span class="peintures">
        <svg viewBox="-34 -8 240 112" aria-hidden="true"><Bus niveau={avant} /></svg><span aria-hidden="true">→</span><svg viewBox="-34 -8 240 112" aria-hidden="true"><Bus niveau={apres} /></svg>
        <span class="bacs">{BAC[avant]} → <span class="bus-apres">{NIVEAUX.find(n => n.cle === apres)?.bus}</span></span>
      </span>
      <button class="pourquoi" onclick={() => onPourquoi(c.candidat.id)}>Pourquoi ?<span class="visually-hidden"> {c.candidat.nom}</span></button>
    </li>
  {/each}
</ol>
<p class="discret petit">Le nom de chaque candidat mène à ses positions sourcées sur MonVote2027.</p>
{#if horsSelection}
  <p class="info petit">Le bus de {horsSelection.candidat.nom}, que tu n'avais pas ajouté à ta gare, se serait arrêté encore plus près ({arrets(horsSelection.trajet.arrets)}).</p>
{/if}

<h2>Ce que dit la justice</h2>
<p class="discret petit">Pour chacun de tes bus, les décisions de justice rendues à l'encontre du candidat, telles quelles : condamnations et relaxes, avec leur statut. Elles ne changent pas son trajet. Méthode et sources : <a href="#methode">comment ça marche</a>.</p>
<div class="justice">
  {#each classement as c (c.candidat.id)}
    {@const n = nbDecisions(c.candidat.id)}
    <section class="fiche-justice" class:vide={n === 0} aria-labelledby="justice-{c.candidat.id}">
      <h3 id="justice-{c.candidat.id}" class="qui-justice"><Photo id={c.candidat.id} taille={40} /> {c.candidat.nom}
        {#if n !== null}<span class="compte">{n ? nombre(n, "décision") : "aucune décision"}</span>{/if}</h3>
      <Justice id={c.candidat.id} detail={false} />
    </section>
  {/each}
</div>

<h2>Pour aller plus loin</h2>
{#if onAffiner && restantes > 0}
  {@const minutes = Math.max(1, Math.round((restantes * 6) / 60))}
  <div class="boite affiner">
    <h3>Affine ton résultat</h3>
    <p>Tu n'as répondu qu'à une partie des questions : ton résultat peut encore bouger.</p>
    {#if restantes > 10}
      <p class="rangee">
        <button class="principal" onclick={() => onAffiner("cible")}>10 questions ciblées</button>
        <button onclick={() => onAffiner("tout")}>Les {restantes} restantes</button>
      </p>
      <p class="discret petit">Les 10 questions ciblées sont celles où tes bus les plus proches ne sont pas d'accord entre eux (environ 1 minute). Les {restantes} restantes donnent le résultat le plus précis (environ {minutes} minutes).</p>
    {:else}
      <p><button class="principal" onclick={() => onAffiner("tout")}>Les {restantes} dernières questions</button></p>
    {/if}
  </div>
{/if}
{@render outils?.()}

<p class="recommencer"><button class="discret" onclick={onRecommencer}>Recommencer</button></p>

<style>
  .recap { margin: 20px 0 4px; color: var(--discret); }
  .recap:focus { outline: none; }
  .message { font-size: 20px; font-weight: 600; }
  /* « Tes bus » : une ligne par bus. Rang, photo, nom ; distance en grand ; jauge porte → gare → terminus ; peintures. */
  .tes-bus { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
  .tes-bus li {
    display: grid; grid-template-columns: 1.7em 44px minmax(0, 1fr) 8.5em; column-gap: 10px; row-gap: 6px; align-items: center;
    padding: 10px 12px; background: var(--carte); border-radius: var(--rayon); border: 2px solid transparent;
  }
  .tes-bus li.premier { border-color: var(--jaune); }
  .rang { display: grid; place-items: center; width: 1.7em; height: 1.7em; border-radius: 6px; background: var(--marque); color: var(--jaune); font-weight: 900; }
  .identite { display: grid; min-width: 0; }
  .nom { font-weight: 800; font-size: 17px; line-height: 1.2; color: var(--encre); }
  .parti { font-size: 14px; color: var(--discret); }
  .distance { font-weight: 900; font-size: 18px; white-space: nowrap; text-align: right; }
  .incomplet { display: block; font-size: 12.5px; font-weight: 600; color: var(--discret); white-space: normal; }
  /* Jauge : de ta porte (0) au terminus (20), la gare au milieu (10). */
  .jauge { grid-column: 3; position: relative; height: 8px; border-radius: 999px; background: linear-gradient(90deg, var(--jaune), var(--trait) 50%, var(--trait)); }
  .jauge::after { content: ""; position: absolute; left: 50%; top: -3px; width: 2px; height: 14px; background: var(--discret); }
  .repere { position: absolute; top: 50%; width: 16px; height: 16px; margin: -8px 0 0 -8px; border-radius: 50%; background: var(--marque); border: 3px solid var(--fond); box-shadow: 0 0 0 2px var(--marque); z-index: 1; }
  .peintures { grid-column: 3; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; font-size: 14px; color: var(--discret); }
  .peintures svg { width: 40px; height: auto; }
  .bacs { flex-basis: 100%; }
  /* Graduations au-dessus de la liste, sur la même grille que les lignes pour tomber pile sur les jauges. */
  .echelle { display: grid; grid-template-columns: 1.7em 44px minmax(0, 1fr) 8.5em; column-gap: 10px; margin: 0 0 4px; padding: 0 14px; font-size: 13px; color: var(--discret); }
  .graduations { grid-column: 3; position: relative; height: 1.3em; }
  .graduations span { position: absolute; top: 0; white-space: nowrap; }
  .graduations span:nth-child(1) { left: 0; }
  .graduations span:nth-child(2) { left: 50%; transform: translateX(-50%); }
  .graduations span:nth-child(3) { right: 0; }
  @media (max-width: 480px) {
    .tes-bus li, .echelle { grid-template-columns: 1.7em 44px minmax(0, 1fr) 7.4em; column-gap: 8px; }
    .tes-bus li { padding: 8px 10px; }
    .echelle { padding: 0 12px; }
    .nom { font-size: 16px; }
    .distance { font-size: 16px; }
    .pourquoi { padding: 4px 10px; font-size: 14px; }
  }
  .conduis { margin: 20px 0 16px; border-left: 6px solid var(--jaune); }
  .conduis h2 { margin-top: 0; }
  .conduis p:last-child { margin-bottom: 0; }
  .affiner { margin: 0 0 10px; }
  .affiner h3 { margin: 0 0 6px; font-size: 19px; }
  .affiner p:last-child { margin-bottom: 0; }
  .pourquoi { justify-self: end; min-height: 40px; padding: 6px 14px; font-size: 15px; border-color: var(--trait); }
  .recommencer { margin-top: 24px; }
  .justice { display: grid; gap: 12px; }
  .fiche-justice { background: var(--carte); border-left: 5px solid var(--jaune); border-radius: var(--rayon); padding: 10px 12px; }
  .fiche-justice.vide { border-left-color: var(--trait); }
  .fiche-justice :global(.parti summary) { font-size: 15px; }
  .justice h3 { margin: 0 0 10px; font-size: 17px; }
  .qui-justice { display: flex; align-items: center; gap: 10px; }
  .compte { margin-left: auto; font-size: 13.5px; font-weight: 600; color: var(--discret); white-space: nowrap; }
  .bouton { display: inline-flex; align-items: center; min-height: 48px; padding: 10px 18px; border-radius: 999px; background: var(--marque); color: var(--jaune); border: 2px solid var(--jaune); text-decoration: none; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; }
</style>

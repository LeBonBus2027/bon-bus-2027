<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Classe } from "../lib/calcul";
  import type { Candidat } from "../lib/donnees";
  import { BAC, NIVEAUX, type Niveau } from "../lib/niveaux";
  import { arrets, type Revelation } from "../lib/revelation";
  import Photo from "../lib/Photo.svelte";
  import Afficheur from "./Afficheur.svelte";
  import AvantApres from "./AvantApres.svelte";
  import Justice from "./Justice.svelte";
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
<p class="discret petit">Distance en arrêts entre l'endroit où le bus s'arrête et ta porte. Au-delà de 10, il est reparti dans l'autre sens.</p>
<div class="tableau">
  <table>
    <thead><tr><th scope="col">#</th><th scope="col">Candidat</th><th scope="col">Ton ressenti → pour toi</th><th scope="col">Distance</th></tr></thead>
    <tbody>
      {#each classement as c, i (c.candidat.id)}
        <tr>
          <td>{i + 1}</td>
          <td class="qui">
            <Photo id={c.candidat.id} taille={40} />
            <a href={c.candidat.url_source} target="_blank" rel="noopener noreferrer">{c.candidat.nom}</a>
            <span class="discret petit">{c.candidat.parti}</span>
          </td>
          <td>{BAC[bacs[c.candidat.id] ?? "inconnu"]} <span class="discret petit">→ {NIVEAUX.find(n => n.cle === revelation.peinture[c.candidat.id])?.bus}</span></td>
          <td>
            {arrets(c.trajet.arrets)}{#if c.trajet.incomplet}<span class="discret petit"> (position incomplète)</span>{/if}
            <button class="pourquoi" onclick={() => onPourquoi(c.candidat.id)}>Pourquoi ?<span class="visually-hidden"> {c.candidat.nom}</span></button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<p class="discret petit">Le nom de chaque candidat mène à ses positions sourcées sur MonVote2027.</p>
{#if horsSelection}
  <p class="info petit">Le bus de {horsSelection.candidat.nom}, que tu n'avais pas ajouté à ta gare, se serait arrêté encore plus près ({arrets(horsSelection.trajet.arrets)}).</p>
{/if}

<h2>Ce que dit la justice</h2>
<p class="discret petit">Pour chacun de tes bus, les décisions de justice rendues à l'encontre du candidat, telles quelles : condamnations et relaxes, avec leur statut. Elles ne changent pas son trajet. Méthode et sources : <a href="#methode">comment ça marche</a>.</p>
<div class="justice">
  {#each classement as c (c.candidat.id)}
    <section aria-labelledby="justice-{c.candidat.id}">
      <h3 id="justice-{c.candidat.id}" class="qui-justice"><Photo id={c.candidat.id} taille={32} /> {c.candidat.nom}</h3>
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
  .tableau { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 16.5px; background: var(--carte); border-radius: var(--rayon); }
  th { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--trait); vertical-align: top; }
  td span { display: block; }
  td.qui { display: grid; grid-template-columns: 40px 1fr; column-gap: 10px; align-items: center; }
  td.qui :global(.photo) { grid-row: span 2; }
  .conduis { margin: 20px 0 16px; border-left: 6px solid var(--jaune); }
  .conduis h2 { margin-top: 0; }
  .conduis p:last-child { margin-bottom: 0; }
  .affiner { margin: 0 0 10px; }
  .affiner h3 { margin: 0 0 6px; font-size: 19px; }
  .affiner p:last-child { margin-bottom: 0; }
  .pourquoi { display: block; margin-top: 4px; min-height: 40px; padding: 6px 12px; font-size: 15px; border-color: var(--trait); }
  .recommencer { margin-top: 24px; }
  .justice { display: grid; gap: 14px; }
  .justice h3 { margin: 0 0 6px; font-size: 17px; }
  .qui-justice { display: flex; align-items: center; gap: 8px; }
  .bouton { display: inline-flex; align-items: center; min-height: 48px; padding: 10px 18px; border-radius: 999px; background: var(--marque); color: var(--jaune); border: 2px solid var(--jaune); text-decoration: none; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; }
</style>

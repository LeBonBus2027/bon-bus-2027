<script lang="ts">
  import type { Classe } from "../lib/calcul";
  import type { Candidat } from "../lib/donnees";
  import { BAC, type Niveau } from "../lib/niveaux";
  import { arrets, type Revelation } from "../lib/revelation";
  import Partage from "./Partage.svelte";

  let { revelation, classement, bacs, horsSelection, onPourquoi, onRecommencer }: {
    revelation: Revelation;
    classement: readonly Classe<Candidat>[];
    bacs: Record<string, Niveau>;
    /** Candidat non ajouté qui t'aurait déposé plus près que tous tes bus. */
    horsSelection?: Classe<Candidat>;
    onPourquoi: (id: string) => void;
    onRecommencer: () => void;
  } = $props();
</script>

<p class="message">{revelation.message}</p>
<p class="morale">Aucun bus ne te dépose pile devant chez toi. Prends celui qui te rapproche le plus.</p>

{#if horsSelection}
  <p class="boite note">À noter : le bus de {horsSelection.candidat.nom}, que tu n'avais pas ajouté à ta gare, se serait arrêté encore plus près ({arrets(horsSelection.trajet.arrets)}).</p>
{/if}

<Partage {revelation} {bacs} />

<h2>Tes bus</h2>
<p class="discret petit">Distance en arrêts entre l'endroit où le bus s'arrête et ta porte. Au-delà de 10, il est reparti dans l'autre sens.</p>
<div class="tableau">
  <table>
    <thead><tr><th scope="col">#</th><th scope="col">Candidat</th><th scope="col">Ton bac</th><th scope="col">Distance</th></tr></thead>
    <tbody>
      {#each classement as c, i (c.candidat.id)}
        <tr>
          <td>{i + 1}</td>
          <td>
            <a href={c.candidat.url_source} target="_blank" rel="noopener noreferrer">{c.candidat.nom}</a>
            <span class="discret petit">{c.candidat.parti}</span>
          </td>
          <td>{BAC[bacs[c.candidat.id] ?? "inconnu"]}</td>
          <td>
            {arrets(c.trajet.arrets)}{#if c.trajet.incomplet}<span class="discret petit"> (position incomplète)</span>{/if}
            <button class="pourquoi" onclick={() => onPourquoi(c.candidat.id)}>Pourquoi ?<span class="visually-hidden"> {c.candidat.nom}</span></button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<p class="discret petit">Le nom de chaque candidat mène à ses positions sourcées sur MonVote2027.</p>

<div class="boite fin">
  <h2>Maintenant, c'est toi qui conduis</h2>
  <p>Ton vote, c'est une voix de plus dans le bus qui te rapproche le plus. Avant tout, vérifie que tu es bien inscrit sur les listes électorales : ça prend deux minutes.</p>
  <p class="rangee">
    <a class="bouton" href="https://www.service-public.fr/particuliers/vosdroits/R51788" target="_blank" rel="noopener noreferrer">Vérifier mon inscription</a>
    <button class="discret" onclick={onRecommencer}>Recommencer</button>
  </p>
</div>

<style>
  .message { font-size: 20px; font-weight: 600; margin-top: 16px; }
  .morale { color: var(--accent-texte); font-weight: 600; }
  .tableau { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 16.5px; background: var(--carte); border-radius: var(--rayon); }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--trait); vertical-align: top; }
  td span { display: block; }
  .fin { margin-top: 28px; }
  .note { margin: 12px 0; }
  .pourquoi { display: block; margin-top: 4px; min-height: 40px; padding: 6px 12px; font-size: 15px; border-color: var(--trait); }
  .fin h2 { margin-top: 0; }
  .bouton { display: inline-flex; align-items: center; min-height: 48px; padding: 10px 18px; border-radius: 999px; background: var(--bleu); color: #fff; text-decoration: none; font-weight: 600; }
</style>

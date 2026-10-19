<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Classe } from "../lib/calcul";
  import type { Candidat } from "../lib/donnees";
  import { BAC, NIVEAUX, type Niveau } from "../lib/niveaux";
  import { arrets, niveauReel, type Revelation } from "../lib/revelation";
  import Photo from "../lib/Photo.svelte";
  import AvantApres from "./AvantApres.svelte";
  import Partage from "./Partage.svelte";

  let { revelation, classement, bacs, horsSelection, onPourquoi, onRecommencer, onAffiner, outils }: {
    revelation: Revelation;
    classement: readonly Classe<Candidat>[];
    bacs: Record<string, Niveau>;
    /** Candidat non ajouté qui t'aurait déposé plus près que tous tes bus. */
    horsSelection?: Classe<Candidat>;
    onPourquoi: (id: string) => void;
    /** Présent seulement après une version rapide (et hors mode duo) : propose 10 questions de plus. */
    onAffiner?: () => void;
    /** Outils interactifs (priorités, rétroviseur), placés juste après le résultat. */
    outils?: Snippet;
    onRecommencer: () => void;
  } = $props();
</script>

<p class="message">{revelation.message}</p>

<AvantApres focus={revelation.focus} {bacs} {onPourquoi} />

{#if onAffiner}
  <div class="boite affiner">
    <h2>Affine ton résultat</h2>
    <p>Tu n'as répondu qu'à une partie des questions : ton résultat peut encore bouger. Réponds à 10 questions de plus, choisies parmi celles où tes bus les plus proches ne sont pas d'accord entre eux.</p>
    <p><button class="principal" onclick={onAffiner}>10 questions de plus</button></p>
  </div>
{/if}
<blockquote class="metaphore">{revelation.metaphore}</blockquote>
<p class="morale"><span>Aucun bus ne te dépose pile devant chez toi. Prends celui qui te rapproche le plus.</span></p>

{@render outils?.()}

{#if horsSelection}
  <p class="boite note">À noter : le bus de {horsSelection.candidat.nom}, que tu n'avais pas ajouté à ta gare, se serait arrêté encore plus près ({arrets(horsSelection.trajet.arrets)}).</p>
{/if}

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
          <td>{BAC[bacs[c.candidat.id] ?? "inconnu"]} <span class="discret petit">→ {NIVEAUX.find(n => n.cle === niveauReel(c.trajet.arrets))?.bus}</span></td>
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

<div class="boite fin">
  <h2>Maintenant, c'est toi qui conduis</h2>
  <p>Ton vote, c'est une voix de plus dans le bus qui te rapproche le plus. Avant tout, vérifie ton inscription sur les listes électorales : ça prend deux minutes.</p>
  <p class="rangee">
    <a class="bouton" href="https://www.service-public.fr/particuliers/vosdroits/R51788" target="_blank" rel="noopener noreferrer">Vérifier mon inscription</a>
    <button class="discret" onclick={onRecommencer}>Recommencer</button>
  </p>
</div>

<style>
  .message { font-size: 20px; font-weight: 600; margin-top: 16px; }
  .morale { font-weight: 800; }
  .morale span { background: var(--surligne); }
  .tableau { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 16.5px; background: var(--carte); border-radius: var(--rayon); }
  th { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--trait); vertical-align: top; }
  td span { display: block; }
  td.qui { display: grid; grid-template-columns: 40px 1fr; column-gap: 10px; align-items: center; }
  td.qui :global(.photo) { grid-row: span 2; }
  .fin { margin-top: 28px; }
  .affiner { margin: 16px 0; }
  .affiner h2 { margin-top: 0; }
  .affiner p:last-child { margin-bottom: 0; }
  /* La métaphore s'affiche comme la girouette d'un bus : texte jaune à chasse fixe sur bleu nuit (contraste 11:1). */
  .metaphore {
    margin: 12px 0; padding: 14px 16px; border-radius: var(--rayon); background: var(--marque); color: var(--jaune);
    font-family: ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace; font-size: 17px; font-weight: 700; line-height: 1.45;
    box-shadow: inset 0 0 0 3px #13294a;
  }
  .note { margin: 12px 0; }
  .pourquoi { display: block; margin-top: 4px; min-height: 40px; padding: 6px 12px; font-size: 15px; border-color: var(--trait); }
  .fin h2 { margin-top: 0; }
  .bouton { display: inline-flex; align-items: center; min-height: 48px; padding: 10px 18px; border-radius: 999px; background: var(--marque); color: var(--jaune); border: 2px solid var(--jaune); text-decoration: none; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; }
</style>

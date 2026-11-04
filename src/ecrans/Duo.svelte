<script lang="ts">
  import { tick } from "svelte";
  import Photo from "../lib/Photo.svelte";
  import { candidats, positions } from "../lib/donnees";
  import { comparer, type Partie } from "../lib/duo";
  import { arrets } from "../lib/revelation";
  import Trajet from "./Trajet.svelte";

  let { noms, parties, onRecommencer }: {
    noms: [string, string];
    parties: [Partie, Partie];
    onRecommencer: () => void;
  } = $props();

  // Les candidats vus par l'un ou l'autre.
  const ids = $derived(candidats.filter(c => c.id in parties[0].bacs || c.id in parties[1].bacs).map(c => c.id));
  const comp = $derived(comparer(parties[0], parties[1], ids, positions));
  const parId = new Map(candidats.map(c => [c.id, c]));
  const commun = $derived(parId.get(comp.commun.id)!);

  let onglet = $state<0 | 1 | 2>(2);
  // Onglets courts à l'écran (prénoms), complets pour les lecteurs d'écran (« Trajet de … »).
  const ONGLETS = $derived([[ "Trajet de ", noms[0]], ["Trajet de ", noms[1]], ["", "Ensemble"]] as const);

  async function choisir(i: 0 | 1 | 2) {
    onglet = i;
    await tick();
    document.getElementById(`panneau-${i}`)?.querySelector<HTMLElement>("h1, h2")?.focus();
  }

  function clavier(e: KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    choisir(((onglet + (e.key === "ArrowRight" ? 1 : 2)) % 3) as 0 | 1 | 2);
    document.getElementById(`onglet-${onglet}`)?.focus();
  }

  const proximite = (n: number) =>
    n <= 3 ? "Vos idées sont très proches." : n <= 7 ? "Vous êtes plutôt d'accord." : n <= 12 ? "Vous êtes partagés." : "Vous partez dans des directions opposées.";
</script>

{#snippet jauge(nom: string, d: number)}
  <p class="jauge-personne">
    <span class="nom-personne">{nom}</span>
    <span class="jauge" aria-hidden="true"><span class="repere" style:left="{100 - Math.min(100, (Math.round(d) / 20) * 100)}%"></span></span>
    <span class="arrets">{arrets(Math.round(d))}</span>
  </p>
{/snippet}

<div class="onglets" role="tablist" aria-label="Résultats du duo" tabindex="-1" onkeydown={clavier}>
  {#each ONGLETS as titre, i (i)}
    <button role="tab" id="onglet-{i}" aria-selected={onglet === i} aria-controls="panneau-{i}" tabindex={onglet === i ? 0 : -1} class:actif={onglet === i} onclick={() => choisir(i as 0 | 1 | 2)}><span class="visually-hidden">{titre[0]}</span>{titre[1]}</button>
  {/each}
</div>

{#if onglet === 2}
  <div id="panneau-2" role="tabpanel" aria-labelledby="onglet-2">
    <h1 tabindex="-1">{noms[0]} et {noms[1]}</h1>
    <div class="tableau-arrivee">
      <p class="tete-afficheur" aria-hidden="true"><span class="point"></span>Entre vos deux maisons</p>
      <p class="chiffre">{arrets(comp.maisons)}</p>
      <p class="phrase">{proximite(comp.maisons)}</p>
      <p class="visually-hidden">Sur les {comp.communes} questions auxquelles vous avez répondu tous les deux, vous étiez du même côté sur {comp.accord} et de côtés opposés sur {comp.desaccord}.</p>
      <ul class="tuiles" aria-hidden="true">
        <li><strong>{comp.communes}</strong> questions en commun</li>
        <li class="accord"><strong>{comp.accord}</strong> du même côté</li>
        <li class="desaccord"><strong>{comp.desaccord}</strong> de côtés opposés</li>
      </ul>
    </div>

    <h2>Le bus qui vous rapproche tous les deux</h2>
    <div class="ticket">
      <p class="bandeau etiquette-signal" aria-hidden="true">Votre compromis</p>
      <p class="qui-commun"><Photo id={commun.id} taille={56} /> <strong>{commun.nom}</strong></p>
      {#each [[noms[0], comp.commun.a], [noms[1], comp.commun.b]] as [nom, d] (nom)}
        {@render jauge(nom as string, d as number)}
      {/each}
    </div>
    <p class="discret petit">C'est le compromis : le bus qui laisse la personne la plus éloignée de vous deux le moins loin possible de chez elle. Aucun bus ne dépose deux personnes pile devant chez elles.</p>

    <h2>Tous les bus, pour vous deux</h2>
    <p class="echelle discret petit" aria-hidden="true"><span class="graduations"><span>terminus</span><span>gare</span><span>chez vous ⌂</span></span></p>
    <ol class="duo-bus">
      {#each comp.lignes as l, i (l.id)}
        <li class:premier={l.id === comp.commun.id}>
          <p class="qui-bus"><span class="rang" aria-hidden="true">{i + 1}</span><Photo id={l.id} taille={40} /> <strong>{parId.get(l.id)?.nom}</strong></p>
          {@render jauge(noms[0], l.a)}
          {@render jauge(noms[1], l.b)}
        </li>
      {/each}
    </ol>
    <p class="rangee fin">
      <button onclick={() => choisir(0)}>Voir le trajet de {noms[0]}</button>
      <button onclick={() => choisir(1)}>Voir le trajet de {noms[1]}</button>
      <button class="discret" onclick={onRecommencer}>Recommencer</button>
    </p>
  </div>
{:else}
  {#key onglet}
    {@const p = parties[onglet]}
    <div id="panneau-{onglet}" role="tabpanel" aria-labelledby="onglet-{onglet}">
      <Trajet bacs={p.bacs} reponses={p.reponses} ordre={p.ordre} {onRecommencer} />
    </div>
  {/key}
{/if}

<style>
  .onglets { display: flex; gap: 6px; margin-bottom: 14px; overflow-x: auto; }
  .onglets button { flex: 1 1 0; min-width: 0; border-radius: 6px; font-size: 15px; padding: 8px 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .onglets button.actif { background: var(--jaune); border-color: var(--jaune); color: var(--marque); font-weight: 900; }
  /* « Ensemble » : mêmes codes que le reste (afficheur jaune sur bleu nuit, ticket, jauges du terminus, à gauche, jusqu'à chez vous, à droite). */
  .tableau-arrivee { padding: 12px 14px 14px; border-radius: var(--rayon); background: var(--marque); color: var(--jaune); box-shadow: inset 0 0 0 3px #13294a, 0 6px 0 #13294a; margin-bottom: 8px; }
  .tableau-arrivee p { margin: 0; }
  .tete-afficheur { display: flex; align-items: center; gap: 8px; font-family: ui-monospace, "Cascadia Mono", Consolas, monospace; font-weight: 700; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.85; }
  .point { width: 8px; height: 8px; border-radius: 50%; background: var(--jaune); }
  .chiffre { font-size: 44px; font-weight: 900; line-height: 1.1; margin-top: 6px !important; }
  .phrase { color: #fff; font-weight: 700; }
  .tuiles { list-style: none; padding: 0; margin: 12px 0 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .tuiles li { padding: 8px; border-radius: 6px; background: #13294a; color: #fff; font-size: 13.5px; text-align: center; line-height: 1.2; }
  .tuiles strong { display: block; font-size: 22px; color: var(--jaune); }
  .ticket { background: var(--panneau); color: var(--marque); border: 2px solid var(--contour); border-radius: var(--rayon); overflow: hidden; padding-bottom: 10px; }
  .ticket .bandeau { margin: 0 0 10px; padding: 6px 12px; background: var(--marque); color: var(--jaune); font-size: 13px; }
  .qui-commun { display: flex; align-items: center; gap: 12px; margin: 0 12px 6px; font-size: 20px; }
  .ticket .jauge-personne { margin-inline: 12px; }
  .jauge-personne { display: grid; grid-template-columns: 6em minmax(0, 1fr) 6.5em; align-items: center; gap: 10px; margin: 6px 0; font-size: 14.5px; }
  .nom-personne { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .arrets { font-weight: 800; text-align: right; white-space: nowrap; }
  .jauge { position: relative; height: 8px; border-radius: 999px; background: linear-gradient(90deg, var(--trait), var(--trait) 50%, var(--jaune)); }
  .jauge::after { content: ""; position: absolute; left: 50%; top: -3px; width: 2px; height: 14px; background: var(--discret); }
  .repere { position: absolute; top: 50%; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%; background: var(--marque); border: 3px solid var(--fond); box-shadow: 0 0 0 2px var(--marque); z-index: 1; }
  .echelle { display: grid; grid-template-columns: 6em minmax(0, 1fr) 6.5em; gap: 10px; margin: 0 0 4px; padding: 0 14px; font-size: 14.5px; }
  .graduations { grid-column: 2; position: relative; height: 1.3em; font-size: 13px; }
  .graduations span { position: absolute; top: 0; white-space: nowrap; }
  .graduations span:nth-child(1) { left: 0; }
  .graduations span:nth-child(2) { left: 50%; transform: translateX(-50%); }
  .graduations span:nth-child(3) { right: 0; }
  .duo-bus { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
  .duo-bus li { padding: 10px 12px; background: var(--carte); border-radius: var(--rayon); border: 2px solid transparent; }
  .duo-bus li.premier { border-color: var(--jaune); }
  .qui-bus { display: flex; align-items: center; gap: 10px; margin: 0 0 4px; font-size: 16.5px; }
  .rang { display: grid; place-items: center; width: 1.7em; height: 1.7em; border-radius: 6px; background: var(--marque); color: var(--jaune); font-weight: 900; }
  @media (max-width: 420px) {
    .jauge-personne, .echelle { grid-template-columns: 4.5em minmax(0, 1fr) 5.6em; }
    /* Jauge étroite : seulement les deux extrémités ; la gare reste marquée par le trait au milieu. */
    .graduations { font-size: 12px; }
    .graduations span:nth-child(2) { display: none; }
  }
  .fin { margin-top: 20px; }
</style>

<script lang="ts">
  import { pas, type Position, type Reponse, type Trajet } from "../lib/calcul";
  import { questions, type Candidat } from "../lib/donnees";
  import { BAC, NIVEAUX, type Niveau } from "../lib/niveaux";
  import { arrets, VU, type Peinture } from "../lib/revelation";
  import Bus from "../lib/Bus.svelte";
  import Photo from "../lib/Photo.svelte";

  /**
   * « Pourquoi X s'arrête à N arrêts » : la même lecture pour chaque candidat. En tête, où le bus s'arrête (jauge de ta
   * porte au terminus) et sa peinture avant → après ; puis le bilan avancé / reculé / immobile ; puis les questions qui
   * ont le plus compté, chacune avec ta réponse, la position du candidat et le pas (+2 à −2).
   */
  let { candidat, trajet, bac, apres, ordre, reponses, positions, onFermer }: {
    candidat: Candidat;
    trajet: Trajet;
    bac: Niveau;
    /** Peinture grattée (d'après son rang parmi tes bus). */
    apres: Peinture;
    /** Questions répondues, dans l'ordre de rejeu. */
    ordre: readonly string[];
    reponses: Readonly<Record<string, Reponse>>;
    positions: Readonly<Record<string, Position>>;
    onFermer: () => void;
  } = $props();

  const TOI: Record<number, string> = { 2: "Tout à fait d'accord", 1: "Plutôt d'accord", 0: "Neutre", [-1]: "Plutôt pas d'accord", [-2]: "Pas du tout d'accord" };
  const LUI: Record<number, string> = { 2: "Tout à fait pour", 1: "Plutôt pour", 0: "Neutre ou nuancé", [-1]: "Plutôt contre", [-2]: "Tout à fait contre" };
  const parId = new Map(questions.map(q => [q.id, q]));
  const nomBus = (n: Niveau) => NIVEAUX.find(x => x.cle === n)?.bus ?? "";

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
  <li class="question">
    <span class="pas" class:plus={l.pas > 0} class:moins={l.pas < 0}>
      {l.pas > 0 ? `+${l.pas}` : l.pas < 0 ? `−${-l.pas}` : "0"}<span class="visually-hidden">{l.pas > 0 ? ` : son bus avance de ${l.pas}` : l.pas < 0 ? ` : son bus recule de ${-l.pas}` : " : son bus ne bouge pas"}</span>
    </span>
    <span class="corps">
      <span class="q">{l.texte}</span>
      <span class="avis">
        <span class="avis-toi"><span class="qui">Toi</span> {TOI[l.u ?? 0]}</span>
        <span class="avis-lui"><span class="qui">Candidat</span> {l.p === null ? "position inconnue" : LUI[l.p]}</span>
      </span>
    </span>
  </li>
{/snippet}

<section class="explication" aria-labelledby="titre-explication">
  <div class="tete">
    <Photo id={candidat.id} taille={56} />
    <h2 id="titre-explication" tabindex="-1" bind:this={titre}>Pourquoi {candidat.nom} s'arrête à {arrets(trajet.arrets)}</h2>
    <button class="discret fermer" onclick={onFermer} aria-label="Fermer l'explication">✕</button>
  </div>

  <div class="carte-trajet">
    <p class="echelle" aria-hidden="true"><span>⌂ chez toi</span><span>gare</span><span>terminus</span></p>
    <span class="jauge" aria-hidden="true"><span class="repere" style:left="{Math.min(100, (trajet.distance / 20) * 100)}%"></span></span>
    <p class="peinture">
      <span class="bus" aria-hidden="true"><svg viewBox="-34 -8 240 112"><Bus niveau={bac} /></svg>→<svg viewBox="-34 -8 240 112"><Bus niveau={apres} /></svg></span>
      <span>Tu l'avais mis dans le bac « {BAC[bac]} » ({nomBus(bac).toLowerCase()}). Peinture grattée, pour toi c'est en réalité <strong>{VU[apres]}</strong>. {lieu}</span>
    </p>
  </div>

  <p class="bilan-texte">Sur tes {lignes.length} réponses, son bus a avancé sur {pour.length}, reculé sur {contre.length} et n'a pas bougé sur {neutres}.</p>
  <ul class="tuiles" aria-hidden="true">
    <li class="tuile plus"><strong>{pour.length}</strong> fois en avant</li>
    <li class="tuile moins"><strong>{contre.length}</strong> fois en arrière</li>
    <li class="tuile"><strong>{neutres}</strong> sans bouger</li>
  </ul>

  {#if pour.length}
    <h3>Ce qui a rapproché son bus de chez toi</h3>
    <ul class="questions">{#each pour.slice(0, 3) as l (l.id)}{@render ligne(l)}{/each}</ul>
  {/if}
  {#if contre.length}
    <h3>Ce qui a éloigné son bus</h3>
    <ul class="questions">{#each contre.slice(0, 3) as l (l.id)}{@render ligne(l)}{/each}</ul>
  {/if}

  <details class="toutes">
    <summary>Voir les {lignes.length} questions</summary>
    <ul class="questions">{#each lignes as l (l.id)}{@render ligne(l)}{/each}</ul>
  </details>
  <p class="petit"><a href={candidat.url_source} target="_blank" rel="noopener noreferrer">Ses positions sourcées sur MonVote2027</a></p>
</section>

<style>
  .explication { margin: 12px 0; padding: 14px 16px 16px; background: var(--carte); border-radius: var(--rayon); border-top: 6px solid var(--jaune); }
  .tete { display: flex; align-items: center; gap: 12px; }
  .tete h2 { flex: 1; }
  h2 { margin: 0; font-size: 20px; line-height: 1.25; }
  h2:focus { outline: none; }
  h3 { font-size: 17px; margin: 18px 0 8px; }
  .fermer { min-width: 48px; padding: 0; flex: none; }

  /* Où il s'arrête : la même jauge que « Tes bus ». */
  .carte-trajet { margin: 12px 0 10px; padding: 12px; background: var(--fond); border-radius: var(--rayon); }
  .echelle { position: relative; height: 1.3em; margin: 0 0 4px; font-size: 13px; color: var(--discret); }
  .echelle span { position: absolute; top: 0; white-space: nowrap; }
  .echelle span:nth-child(1) { left: 0; }
  .echelle span:nth-child(2) { left: 50%; transform: translateX(-50%); }
  .echelle span:nth-child(3) { right: 0; }
  .jauge { display: block; position: relative; height: 8px; border-radius: 999px; background: linear-gradient(90deg, var(--jaune), var(--trait) 50%, var(--trait)); }
  .jauge::after { content: ""; position: absolute; left: 50%; top: -3px; width: 2px; height: 14px; background: var(--discret); }
  .repere { position: absolute; top: 50%; width: 16px; height: 16px; margin: -8px 0 0 -8px; border-radius: 50%; background: var(--marque); border: 3px solid var(--fond); box-shadow: 0 0 0 2px var(--marque); z-index: 1; }
  .peinture { display: flex; align-items: center; gap: 12px; margin: 14px 0 0; }
  .bus { display: inline-flex; align-items: center; gap: 4px; flex: none; font-weight: 900; }
  .bus svg { width: 54px; height: auto; }

  /* Bilan : trois tuiles. */
  .bilan-texte { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .tuiles { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .tuile { padding: 8px 10px; border-radius: var(--rayon); background: var(--fond); border: 2px solid var(--trait); font-size: 14px; text-align: center; line-height: 1.2; }
  .tuile strong { display: block; font-size: 24px; font-weight: 900; }
  .tuile.plus { border-color: var(--jaune); }
  .tuile.moins { border-color: var(--marque); }

  /* Une question : le pas en pastille, ta réponse et la position du candidat en étiquettes. */
  .questions { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
  .question { display: grid; grid-template-columns: 2.6em 1fr; gap: 10px; align-items: start; padding: 10px; background: var(--fond); border-radius: var(--rayon); }
  .pas { display: grid; place-items: center; height: 2.2em; border-radius: 999px; font-weight: 900; border: 2px solid var(--trait); color: var(--encre); }
  .pas.plus { background: var(--jaune); border-color: var(--jaune); color: var(--marque); }
  .pas.moins { background: var(--marque); border-color: var(--marque); color: #fff; }
  .corps { display: grid; gap: 6px; }
  .q { font-weight: 700; line-height: 1.3; }
  .avis { display: flex; flex-wrap: wrap; gap: 6px; font-size: 14px; }
  .avis > span { display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px 2px 2px; border-radius: 999px; border: 1px solid var(--trait); }
  .qui { padding: 1px 7px; border-radius: 999px; background: var(--carte); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; }

  .toutes { margin-top: 14px; }
  .toutes summary { cursor: pointer; font-weight: 700; min-height: 44px; padding: 10px 0; }
  .petit a { display: inline-block; min-height: 32px; padding: 4px 0; }
  @media (max-width: 420px) { .peinture { flex-direction: column; align-items: flex-start; } .tuile strong { font-size: 20px; } }
</style>

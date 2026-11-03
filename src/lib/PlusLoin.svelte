<script lang="ts" module>
  /** Un texte « Pour aller plus loin » (data/explications.json, produit par scripts/explications.mjs). */
  export interface Bloc { titre: string; elements: string[] }
  export interface Explication {
    contexte: Bloc | null;
    preuves: Bloc[];
    aussi: string[];
    choix: string[];
    sources: { titre: string; url: string }[];
  }
</script>

<script lang="ts">
  /**
   * « De quoi parle-t-on ? » sous chaque question : un grand bouton qui déplie l'explication (le même texte quelle que
   * soit la réponse). Quatre volets en onglets (le contexte, les preuves, à savoir aussi, ce qui reste un choix), le premier ouvert
   * d'office, et les sources en bas. Le texte vient d'un fichier de données : il est affiché comme du texte, jamais
   * comme du HTML ; seul le gras (**…**) est mis en forme.
   */
  let { id, texte, ouvert = $bindable(false) }: {
    id: string;
    texte: Explication;
    /** Déplié ou non ; gardé d'une question à l'autre par la page des questions. */
    ouvert?: boolean;
  } = $props();

  type Volet = { cle: string; libelle: string; blocs: Bloc[] };
  const volets = $derived<Volet[]>([
    ...(texte.contexte ? [{ cle: "contexte", libelle: "Le contexte", blocs: [texte.contexte] }] : []),
    ...(texte.preuves.length ? [{ cle: "preuves", libelle: "Les preuves", blocs: texte.preuves }] : []),
    { cle: "aussi", libelle: "À savoir aussi", blocs: [{ titre: "Ce qu'il faut savoir aussi", elements: texte.aussi }] },
    { cle: "choix", libelle: "Ce qui reste un choix", blocs: [{ titre: "Ce qui reste un choix", elements: texte.choix }] },
  ]);

  let actif = $state(0);
  // Nouvelle question : on revient au premier volet.
  $effect(() => { void id; actif = 0; });
  const volet = $derived(volets[Math.min(actif, volets.length - 1)]!);
  /** Temps de lecture, à 200 mots par minute. */
  const minutes = $derived(Math.max(1, Math.round(volets.flatMap(v => v.blocs.flatMap(b => b.elements)).join(" ").split(/\s+/).length / 200)));

  const boutons: HTMLButtonElement[] = [];
  function clavier(e: KeyboardEvent, i: number) {
    const n = volets.length;
    const cible = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (cible < 0) return;
    e.preventDefault();
    actif = cible;
    boutons[cible]?.focus();
  }

  /** « **gras** texte » → morceaux à afficher. */
  const morceaux = (s: string) => s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(m => m.startsWith("**") && m.endsWith("**") ? { g: true, t: m.slice(2, -2) } : { g: false, t: m });
  const estPuce = (s: string) => s.startsWith("- ");
  /** Regroupe les puces consécutives en listes. */
  function groupes(elements: string[]) {
    const out: ({ liste: false; t: string } | { liste: true; items: string[] })[] = [];
    for (const e of elements) {
      const der = out.at(-1);
      if (estPuce(e)) { if (der?.liste) der.items.push(e.slice(2)); else out.push({ liste: true, items: [e.slice(2)] }); }
      else out.push({ liste: false, t: e });
    }
    return out;
  }
  const domaine = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
</script>

{#snippet riche(s: string)}{#each morceaux(s) as m, i (i)}{#if m.g}<strong>{m.t}</strong>{:else}{m.t}{/if}{/each}{/snippet}

<section class="plus-loin" class:ouvert aria-labelledby="titre-plus-loin-{id}">
  <h2 class="titre">
    <button class="declencheur" id="titre-plus-loin-{id}" aria-expanded={ouvert} aria-controls="corps-plus-loin-{id}" onclick={() => (ouvert = !ouvert)}>
      <span class="pastille" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9.2 9.2a2.9 2.9 0 1 1 4 2.7c-.8.4-1.2 1-1.2 1.9v.4" /><path d="M12 17.6v.1" /></svg>
      </span>
      <span class="libelles">
        <span class="principal-texte">De quoi parle-t-on ?</span>
        <span class="sous-texte">Contexte, preuves, sources · {minutes} min</span>
      </span>
      <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
    </button>
  </h2>

  {#if ouvert}
  <div class="corps" id="corps-plus-loin-{id}">

  <div class="onglets" role="tablist" aria-label="Volets de l'explication">
    {#each volets as v, i (v.cle)}
      <button
        bind:this={boutons[i]}
        role="tab"
        id="onglet-{id}-{v.cle}"
        aria-selected={actif === i}
        aria-controls="volet-{id}"
        tabindex={actif === i ? 0 : -1}
        onclick={() => (actif = i)}
        onkeydown={e => clavier(e, i)}
      ><span class="num" aria-hidden="true">{i + 1}</span>{v.libelle}</button>
    {/each}
  </div>

  <div class="volet" role="tabpanel" id="volet-{id}" aria-labelledby="onglet-{id}-{volet.cle}" tabindex="0">
    {#key `${id}-${volet.cle}`}
      <div class="contenu" class:choix={volet.cle === "choix"}>
        {#each volet.blocs as b, k (k)}
          {#if volet.blocs.length > 1 || (volet.cle !== "aussi" && volet.cle !== "choix" && b.titre !== volet.libelle)}<h3>{b.titre}</h3>{/if}
          {#each groupes(b.elements) as g, j (j)}
            {#if g.liste}
              <ul>{#each g.items as it, n (n)}<li>{@render riche(it)}</li>{/each}</ul>
            {:else}
              <p>{@render riche(g.t)}</p>
            {/if}
          {/each}
        {/each}
      </div>
    {/key}
    {#if actif < volets.length - 1}
      <button class="suite discret" onclick={() => { actif += 1; boutons[actif]?.focus(); }}>Suite : {volets[actif + 1]!.libelle.toLowerCase()} →</button>
    {/if}
  </div>

  <details class="sources">
    <summary>Sources ({texte.sources.length})</summary>
    <ol>
      {#each texte.sources as s, i (i)}
        <li><a href={s.url} target="_blank" rel="noopener noreferrer nofollow">{s.titre}</a> <span class="domaine">{domaine(s.url)}</span></li>
      {/each}
    </ol>
  </details>
  </div>
  {/if}
</section>

<style>
  .plus-loin { margin: 6px 0 14px; background: var(--carte); border-radius: calc(var(--rayon) * 1.5); border: 2px solid var(--jaune); overflow: hidden; }
  /* Le bouton : une bande jaune bien visible, qui reste l'en-tête de l'encart une fois déplié. */
  .titre { margin: 0; }
  .declencheur {
    display: flex; align-items: center; gap: 12px; width: 100%; min-height: 60px; padding: 10px 14px; border: 0; border-radius: 0;
    background: var(--jaune); color: var(--marque); font: inherit; text-align: left; cursor: pointer;
  }
  .declencheur:hover .pastille { transform: rotate(-8deg) scale(1.06); }
  .declencheur:focus-visible { outline: 3px solid var(--lien); outline-offset: -3px; }
  .pastille { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--marque); color: var(--jaune); flex: none; transition: transform 0.2s; }
  .pastille svg { width: 22px; height: 22px; }
  .libelles { display: grid; gap: 1px; flex: 1; }
  .principal-texte { font-size: 17.5px; font-weight: 900; line-height: 1.2; letter-spacing: -0.01em; }
  .sous-texte { font-size: 13.5px; font-weight: 600; opacity: 0.85; }
  .chevron { width: 24px; height: 24px; flex: none; transition: transform 0.25s; }
  .ouvert .chevron { transform: rotate(180deg); }
  .corps { padding-top: 4px; animation: deplier 0.25s ease-out; }
  @keyframes deplier { from { opacity: 0; transform: translateY(-6px); } }

  /* Onglets en pastilles : une rangée sur grand écran, deux colonnes sur téléphone (tout reste visible). */
  .onglets { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 14px 0; }
  [role="tab"] {
    display: inline-flex; align-items: center; gap: 7px; min-height: 40px; padding: 6px 13px 6px 7px; text-align: left;
    border-radius: 999px; border: 1.5px solid var(--trait); background: var(--fond); color: var(--encre);
    font: inherit; font-size: 14.5px; font-weight: 700; line-height: 1.15; cursor: pointer; transition: background 0.15s, border-color 0.15s;
  }
  [role="tab"]:hover { border-color: var(--contour); }
  /* Onglet ouvert : jaune de marque, lisible en mode clair comme en mode sombre. */
  [role="tab"][aria-selected="true"] { background: var(--jaune); border-color: var(--jaune); color: var(--marque); }
  .num { display: grid; place-items: center; width: 22px; height: 22px; flex: none; border-radius: 50%; background: var(--carte); font-size: 12px; font-weight: 900; }
  [role="tab"][aria-selected="true"] .num { background: var(--marque); color: var(--jaune); }
  @media (max-width: 560px) {
    .onglets { display: grid; grid-template-columns: 1fr 1fr; }
    [role="tab"] { border-radius: 14px; }
  }

  .volet { margin: 10px 8px 8px; padding: 4px 14px 12px; background: var(--fond); border-radius: var(--rayon); }
  .volet:focus-visible { outline: 3px solid var(--lien); outline-offset: 2px; }
  .contenu { animation: entree 0.22s ease-out; }
  @keyframes entree { from { opacity: 0; transform: translateY(4px); } }
  h3 { margin: 14px 0 6px; font-size: 15px; color: var(--discret); text-transform: uppercase; letter-spacing: 0.04em; }
  p, li { font-size: 16px; line-height: 1.55; color: var(--encre); }
  p { margin: 10px 0; }
  ul { list-style: none; margin: 10px 0; padding: 0; display: grid; gap: 10px; }
  li { position: relative; padding-left: 18px; }
  li::before { content: ""; position: absolute; left: 2px; top: 0.6em; width: 8px; height: 8px; border-radius: 2px; background: var(--jaune); transform: rotate(45deg); }
  li :global(strong), p :global(strong) { font-weight: 800; }
  /* « Ce qui reste un choix » : mis en valeur comme une conclusion ouverte. */
  .choix p { padding: 10px 12px; border-left: 4px solid var(--jaune); background: var(--carte); border-radius: 0 var(--rayon) var(--rayon) 0; }
  .suite { display: block; margin: 4px 0 0 auto; min-height: 40px; padding: 6px 4px; font-weight: 700; font-size: 14.5px; }

  .sources { margin: 0 14px 12px; font-size: 14px; color: var(--discret); }
  .sources summary { cursor: pointer; font-weight: 700; min-height: 40px; display: flex; align-items: center; }
  .sources ol { margin: 4px 0 8px; padding-left: 20px; display: grid; gap: 6px; }
  .sources li { font-size: 14px; line-height: 1.4; padding-left: 0; }
  .sources li::before { content: none; }
  .domaine { color: var(--discret); font-size: 12.5px; }
  @media (prefers-reduced-motion: reduce) { .contenu, .corps { animation: none; } .chevron, .pastille { transition: none; } }
</style>

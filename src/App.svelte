<script lang="ts">
  import { onMount, tick } from "svelte";
  import { melanger } from "./lib/aleatoire";
  import type { Reponse } from "./lib/calcul";
  import { candidats, meta, retenusParDefaut, selection } from "./lib/candidats";
  import type { Niveau } from "./lib/niveaux";
  import Accueil from "./ecrans/Accueil.svelte";
  import Bus from "./lib/Bus.svelte";
  import Classement from "./ecrans/Classement.svelte";
  import Relais from "./ecrans/Relais.svelte";
  import type { Partie } from "./lib/duo";

  // Chargement à la demande : l'accueil et le classement s'affichent sans attendre le reste
  // (questions, positions, carte, ticket…), qu'on précharge discrètement juste après.
  const ECRANS = {
    questionnaire: () => import("./ecrans/Questionnaire.svelte"),
    trajet: () => import("./ecrans/Trajet.svelte"),
    duo: () => import("./ecrans/Duo.svelte"),
  };
  onMount(() => {
    const precharger = () => { ECRANS.questionnaire(); ECRANS.trajet(); };
    const id = setTimeout(precharger, 1200);
    return () => clearTimeout(id);
  });

  type Etape = "accueil" | "classement" | "questionnaire" | "relais" | "trajet";

  // Tout reste en mémoire dans l'onglet : rien n'est stocké ni envoyé.
  let etape = $state<Etape>("accueil");
  const retenus = () => melanger(candidats.filter(c => retenusParDefaut.includes(c.id)));
  let ordreCandidats = $state(retenus());
  let bacs = $state<Record<string, Niveau>>({});
  let reponses = $state<Record<string, Reponse>>({});
  let ordreQuestions = $state<string[]>([]);
  let format = $state<20 | 100 | null>(null);
  // Après « Affine ton résultat » : le questionnaire reprend à la première nouvelle question.
  let debutQuestions = $state(0);
  // Mode duo : deux personnes jouent tour à tour sur le même téléphone ; le premier tour est gardé de côté.
  let duo = $state<{ noms: [string, string]; joueur: 0 | 1; premier: Partie | null } | null>(null);

  function commencer(noms: [string, string] | null) {
    duo = noms ? { noms, joueur: 0, premier: null } : null;
    aller("classement");
  }

  function finQuestions() {
    if (duo && duo.joueur === 0) {
      duo.premier = $state.snapshot({ bacs, reponses, ordre: ordreQuestions });
      // Second tour : mêmes candidats et mêmes questions, dans un nouvel ordre.
      const memes = new Set(ordreCandidats.map(c => c.id));
      ordreCandidats = melanger(candidats.filter(c => memes.has(c.id)));
      ordreQuestions = melanger($state.snapshot(ordreQuestions));
      bacs = {};
      reponses = {};
      duo.joueur = 1;
      aller("relais");
    } else aller("trajet");
  }

  // Pages annexes : simple ancre dans l'adresse ; le parcours en cours est conservé pendant la lecture.
  const PAGES = {
    methode: () => import("./pages/Methode.svelte"),
    confidentialite: () => import("./pages/Confidentialite.svelte"),
    "mentions-legales": () => import("./pages/MentionsLegales.svelte"),
    "a-propos": () => import("./pages/APropos.svelte"),
  } as const;

  /** Donne le focus au titre de l'écran dès qu'il est affiché (les écrans chargés à la demande arrivent un peu après). */
  function focaliser(selecteur: string, essais = 60) {
    const el = document.querySelector<HTMLElement>(selecteur);
    if (el) el.focus();
    else if (essais > 0) requestAnimationFrame(() => focaliser(selecteur, essais - 1));
  }
  type NomPage = keyof typeof PAGES;
  const lirePage = () => (location.hash.slice(1) in PAGES ? (location.hash.slice(1) as NomPage) : null);
  let page = $state<NomPage | null>(lirePage());
  $effect(() => {
    const surChangement = async () => {
      page = lirePage();
      await tick();
      window.scrollTo(0, 0);
      focaliser(page ? "#page h1" : "#parcours h1");
    };
    window.addEventListener("hashchange", surChangement);
    return () => window.removeEventListener("hashchange", surChangement);
  });

  async function aller(vers: Etape) {
    etape = vers;
    await tick();
    window.scrollTo(0, 0);
    focaliser("#parcours h1");
  }

  function affiner(ids: string[]) {
    debutQuestions = ordreQuestions.length;
    ordreQuestions = [...ordreQuestions, ...ids];
    aller("questionnaire");
  }

  function recommencer() {
    ordreCandidats = retenus();
    bacs = {};
    reponses = {};
    ordreQuestions = [];
    format = null;
    debutQuestions = 0;
    duo = null;
    aller("accueil");
  }

  /** Le logo ramène à l'accueil ; si un parcours est en cours, on demande d'abord (il serait effacé). */
  function versAccueil(ev: MouseEvent) {
    const enCours = etape !== "accueil" && (Object.keys(bacs).length > 0 || duo !== null);
    if (enCours && !confirm("Revenir à l'accueil ? Ton parcours en cours sera effacé.")) { ev.preventDefault(); return; }
    if (etape !== "accueil") recommencer();
  }
</script>

<!-- Un onglet resté ouvert pendant une mise à jour du site demande d'anciens fichiers, qui n'existent plus : on le dit. -->
{#snippet nouvelleVersion()}
  <div class="info" role="alert">
    <p>Une nouvelle version du site est en ligne. Recharge la page pour continuer.</p>
    <p><button class="principal" onclick={() => location.reload()}>Recharger la page</button></p>
  </div>
{/snippet}

<header class="bandeau">
  <div class="interieur">
    <a class="logo" href="#retour" onclick={versAccueil}>
      <svg viewBox="-34 -8 240 112" aria-hidden="true"><Bus niveau="adore" /></svg>
      <span class="marque">LeBonBus<span>2027</span></span><span class="visually-hidden">, retour à l'accueil</span>
    </a>
  </div>
</header>

<main>
  {#if page}
    <div id="page">
      <p><a href="#retour">← Revenir au site</a></p>
      {#await PAGES[page]() then { default: Page }}<Page />{:catch}{@render nouvelleVersion()}{/await}
    </div>
  {/if}
  <!-- Le parcours reste monté (masqué) pendant la lecture d'une page : rien n'est perdu ni rejoué. -->
  <div id="parcours" hidden={!!page}>
  {#if duo && (etape === "classement" || etape === "questionnaire")}
    <p class="tour etiquette-signal">Au tour de {duo.noms[duo.joueur]}</p>
  {/if}
  {#if etape === "accueil"}
    <Accueil onCommencer={commencer} />
  {:else if etape === "relais" && duo}
    <Relais nom={duo.noms[1]} onPret={() => aller("classement")} />
  {:else if etape === "classement"}
    <Classement bind:ordre={ordreCandidats} bind:bacs onFini={() => aller("questionnaire")} />
  {:else if etape === "questionnaire"}
    {#await ECRANS.questionnaire() then { default: Questionnaire }}
      <Questionnaire bind:reponses bind:ordre={ordreQuestions} bind:format debut={debutQuestions} onFini={finQuestions} />
    {:catch}
      {@render nouvelleVersion()}
    {/await}
  {:else if duo?.premier}
    {#await ECRANS.duo() then { default: Duo }}
      <Duo noms={duo.noms} parties={[duo.premier, { bacs, reponses, ordre: ordreQuestions }]} onRecommencer={recommencer} />
    {:catch}
      {@render nouvelleVersion()}
    {/await}
  {:else}
    {#await ECRANS.trajet() then { default: Trajet }}
      <Trajet {bacs} {reponses} ordre={ordreQuestions} onRecommencer={recommencer} onAffiner={affiner} />
    {:catch}
      {@render nouvelleVersion()}
    {/await}
  {/if}
  </div>
</main>

<footer class="pied">
  <div class="interieur">
    <p class="signature"><span class="marque">LeBonBus<span>2027</span></span> <span class="devise">Outil citoyen, indicatif et indépendant de tout parti et de tout candidat. Aucune donnée collectée.</span></p>

    <h2 class="etiquette-signal titre-sources">Sources</h2>
    <ul class="sources">
      <li><span class="quoi">Questions et positions</span><a href="https://monvote2027.fr" target="_blank" rel="noopener noreferrer">MonVote2027</a><span class="detail">Données du {new Date(meta.date_import).toLocaleDateString("fr-FR")}</span></li>
      <li><span class="quoi">Candidats proposés d'office</span><a href={selection.url} target="_blank" rel="noopener noreferrer">Moyenne des sondages</a><span class="detail">au {new Date(selection.date).toLocaleDateString("fr-FR")}</span></li>
      <li><span class="quoi">Portraits</span><a href="#a-propos">Wikimedia Commons</a><span class="detail">auteurs crédités dans « À propos »</span></li>
      <li><span class="quoi">Idée originale</span><a href="https://www.tiktok.com/@4deux_93/video/7688815863260024097" target="_blank" rel="noopener noreferrer">Vidéo de @4deux_93</a><span class="detail">la métaphore des bus</span></li>
    </ul>

    <nav aria-label="Informations">
      <a href="#methode">Comment ça marche</a><a href="#confidentialite">Confidentialité</a><a href="#mentions-legales">Mentions légales</a><a href="#a-propos">À propos</a>
    </nav>
  </div>
</footer>

<style>
  .bandeau { background: var(--marque); color: #fff; border-bottom: 4px solid var(--jaune); }
  .bandeau .interieur { max-width: 760px; margin: 0 auto; padding: 10px 16px; display: flex; align-items: center; gap: 10px; }
  /* Logo : le car de luxe et le nom ; tout le bloc ramène à l'accueil. */
  .logo { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; color: #fff; text-decoration: none; border-radius: var(--rayon); }
  .logo svg { width: 54px; height: auto; flex: none; }
  .marque { font-size: 23px; font-weight: 900; letter-spacing: -0.01em; line-height: 1; }
  .marque span { color: var(--jaune); }
  .logo:hover .marque { text-decoration: underline; text-decoration-color: var(--jaune); text-underline-offset: 4px; }
  .logo:focus-visible { outline: 3px solid var(--jaune); outline-offset: 3px; }
  /* Pied de page : bandeau bleu nuit comme l'en-tête, sources en petits blocs, liens en pastilles. Ne change pas en mode sombre. */
  .pied { background: var(--marque); color: #dbe3ee; border-top: 4px solid var(--jaune); margin-top: 24px; }
  .pied .interieur { max-width: 760px; margin: 0 auto; padding: 22px 16px 30px; }
  .signature { display: grid; gap: 6px; margin: 0 0 18px; }
  .signature .marque { font-size: 22px; color: #fff; }
  .devise { font-size: 15px; line-height: 1.45; }
  .titre-sources { margin: 0 0 8px; color: var(--jaune); font-size: 13px; }
  .sources { list-style: none; padding: 0; margin: 0 0 18px; display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 8px; }
  .sources li { display: grid; gap: 2px; align-content: start; padding: 10px 12px; border-radius: var(--rayon); background: #13294a; }
  .quoi { font-size: 12px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #b4c0d0; }
  .sources a { color: var(--jaune); font-weight: 800; font-size: 16px; text-underline-offset: 3px; }
  .detail { font-size: 13.5px; color: #b4c0d0; }
  .pied nav { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 16px; border-top: 1px solid #2a3f60; }
  .pied nav a { display: inline-flex; align-items: center; min-height: 44px; padding: 6px 14px; border-radius: 999px; border: 2px solid #dbe3ee; color: #fff; font-weight: 700; font-size: 15px; text-decoration: none; }
  .pied nav a:hover { background: var(--jaune); border-color: var(--jaune); color: var(--marque); }
  .pied a:focus-visible { outline: 3px solid var(--jaune); outline-offset: 2px; }
  :global(main h1:focus) { outline: none; }
  .tour { display: inline-block; background: var(--jaune); color: var(--marque); padding: 4px 10px; border-radius: 6px; margin: 0 0 6px; }
</style>

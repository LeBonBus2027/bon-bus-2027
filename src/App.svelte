<script lang="ts">
  import { onMount, tick } from "svelte";
  import { melanger } from "./lib/aleatoire";
  import type { Reponse } from "./lib/calcul";
  import { candidats, meta, retenusParDefaut } from "./lib/candidats";
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
      {#await PAGES[page]() then { default: Page }}<Page />{/await}
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
    {/await}
  {:else if duo?.premier}
    {#await ECRANS.duo() then { default: Duo }}
      <Duo noms={duo.noms} parties={[duo.premier, { bacs, reponses, ordre: ordreQuestions }]} onRecommencer={recommencer} />
    {/await}
  {:else}
    {#await ECRANS.trajet() then { default: Trajet }}
      <Trajet {bacs} {reponses} ordre={ordreQuestions} onRecommencer={recommencer} onAffiner={affiner} />
    {/await}
  {/if}
  </div>
</main>

<footer>
  <p>Questions et positions des candidats : <a href="https://monvote2027.fr" target="_blank" rel="noopener noreferrer">MonVote2027</a>, données du {new Date(meta.date_import).toLocaleDateString("fr-FR")}. Idée originale : une vidéo de @4deux_93.</p>
  <p>Aucune donnée collectée. Outil indicatif, indépendant de tout parti et de tout candidat.</p>
  <nav aria-label="Informations">
    <a href="#methode">Comment ça marche</a> · <a href="#confidentialite">Confidentialité</a> ·
    <a href="#mentions-legales">Mentions légales</a> · <a href="#a-propos">À propos</a>
  </nav>
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
  footer { max-width: 760px; margin: 0 auto; padding: 16px 16px 32px; color: var(--discret); font-size: 15px; border-top: 4px solid var(--jaune); }
  footer p { margin-bottom: 4px; }
  footer nav { margin-top: 8px; line-height: 2.4; }
  footer a { color: var(--discret); }
  :global(main h1:focus) { outline: none; }
  .tour { display: inline-block; background: var(--jaune); color: var(--marque); padding: 4px 10px; border-radius: 6px; margin: 0 0 6px; }
</style>

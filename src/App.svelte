<script lang="ts">
  import { tick } from "svelte";
  import { melanger } from "./lib/aleatoire";
  import type { Reponse } from "./lib/calcul";
  import { candidats, meta } from "./lib/donnees";
  import type { Niveau } from "./lib/niveaux";
  import Accueil from "./ecrans/Accueil.svelte";
  import Classement from "./ecrans/Classement.svelte";
  import Questionnaire from "./ecrans/Questionnaire.svelte";
  import Trajet from "./ecrans/Trajet.svelte";
  import APropos from "./pages/APropos.svelte";
  import Confidentialite from "./pages/Confidentialite.svelte";
  import MentionsLegales from "./pages/MentionsLegales.svelte";
  import Methode from "./pages/Methode.svelte";

  type Etape = "accueil" | "classement" | "questionnaire" | "trajet";

  // Tout reste en mémoire dans l'onglet : rien n'est stocké ni envoyé.
  let etape = $state<Etape>("accueil");
  let ordreCandidats = $state(melanger(candidats));
  let bacs = $state<Record<string, Niveau>>({});
  let reponses = $state<Record<string, Reponse>>({});
  let ordreQuestions = $state<string[]>([]);
  let format = $state<20 | 100 | null>(null);

  // Pages annexes : simple ancre dans l'adresse ; le parcours en cours est conservé pendant la lecture.
  const PAGES = { methode: Methode, confidentialite: Confidentialite, "mentions-legales": MentionsLegales, "a-propos": APropos } as const;
  type NomPage = keyof typeof PAGES;
  const lirePage = () => (location.hash.slice(1) in PAGES ? (location.hash.slice(1) as NomPage) : null);
  let page = $state<NomPage | null>(lirePage());
  $effect(() => {
    const surChangement = async () => {
      page = lirePage();
      await tick();
      window.scrollTo(0, 0);
      document.querySelector<HTMLElement>(page ? "#page h1" : "#parcours h1")?.focus();
    };
    window.addEventListener("hashchange", surChangement);
    return () => window.removeEventListener("hashchange", surChangement);
  });

  async function aller(vers: Etape) {
    etape = vers;
    await tick();
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>("#parcours h1")?.focus();
  }

  function recommencer() {
    ordreCandidats = melanger(candidats);
    bacs = {};
    reponses = {};
    ordreQuestions = [];
    format = null;
    aller("accueil");
  }
</script>

<main>
  {#if page}
    {@const Page = PAGES[page]}
    <div id="page">
      <p><a href="#retour">← Revenir au site</a></p>
      <Page />
    </div>
  {/if}
  <!-- Le parcours reste monté (masqué) pendant la lecture d'une page : rien n'est perdu ni rejoué. -->
  <div id="parcours" hidden={!!page}>
  {#if etape === "accueil"}
    <Accueil onCommencer={() => aller("classement")} />
  {:else if etape === "classement"}
    <Classement ordre={ordreCandidats} bind:bacs onFini={() => aller("questionnaire")} />
  {:else if etape === "questionnaire"}
    <Questionnaire bind:reponses bind:ordre={ordreQuestions} bind:format onFini={() => aller("trajet")} />
  {:else}
    <Trajet {bacs} {reponses} ordre={ordreQuestions} onRecommencer={recommencer} />
  {/if}
  </div>
</main>

<footer>
  <p>Questions et positions des candidats : <a href="https://monvote2027.fr" target="_blank" rel="noopener noreferrer">MonVote2027</a>, données du {new Date(meta.date_import).toLocaleDateString("fr-FR")}. Idée originale : une vidéo de @4deux_93.</p>
  <p>Aucune donnée collectée. Outil indicatif, indépendant de tout parti et de tout candidat.</p>
  <nav aria-label="Informations">
    <a href="#methode">Comment ça marche</a> · <a href="#confidentialite">Confidentialité</a> ·
    <a href="#mentions-legales">Mentions légales</a> · <a href="#a-propos">À propos</a>
  </nav>
</footer>

<style>
  footer { max-width: 760px; margin: 0 auto; padding: 0 16px 32px; color: var(--discret); font-size: 13px; }
  footer p { margin-bottom: 4px; }
  footer nav { margin-top: 8px; line-height: 2.4; }
  footer a { color: var(--discret); }
  :global(main h1:focus) { outline: none; }
</style>

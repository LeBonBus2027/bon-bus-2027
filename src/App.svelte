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

  type Etape = "accueil" | "classement" | "questionnaire" | "trajet";

  // Tout reste en mémoire dans l'onglet : rien n'est stocké ni envoyé.
  let etape = $state<Etape>("accueil");
  let ordreCandidats = $state(melanger(candidats));
  let bacs = $state<Record<string, Niveau>>({});
  let reponses = $state<Record<string, Reponse>>({});
  let ordreQuestions = $state<string[]>([]);
  let format = $state<20 | 100 | null>(null);

  async function aller(vers: Etape) {
    etape = vers;
    await tick();
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>("main h1")?.focus();
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
  {#if etape === "accueil"}
    <Accueil onCommencer={() => aller("classement")} />
  {:else if etape === "classement"}
    <Classement ordre={ordreCandidats} bind:bacs onFini={() => aller("questionnaire")} />
  {:else if etape === "questionnaire"}
    <Questionnaire bind:reponses bind:ordre={ordreQuestions} bind:format onFini={() => aller("trajet")} />
  {:else}
    <Trajet {bacs} {reponses} ordre={ordreQuestions} onRecommencer={recommencer} />
  {/if}
</main>

<footer>
  <p>Questions et positions des candidats : <a href="https://monvote2027.fr" target="_blank" rel="noopener noreferrer">MonVote2027</a>, données du {new Date(meta.date_import).toLocaleDateString("fr-FR")}. Idée originale : une vidéo de @4deux_93.</p>
  <p>Aucune donnée collectée. Outil indicatif, indépendant de tout parti et de tout candidat.</p>
</footer>

<style>
  footer { max-width: 760px; margin: 0 auto; padding: 0 16px 32px; color: var(--discret); font-size: 13px; }
  footer p { margin-bottom: 4px; }
  :global(main h1:focus) { outline: none; }
</style>

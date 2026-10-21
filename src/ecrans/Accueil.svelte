<script lang="ts">
  import { choisirTheme, themeActuel } from "../lib/theme";

  /** noms = null : parcours solo ; deux prénoms : mode duo (chacun son tour sur le même téléphone). */
  let { onCommencer }: { onCommencer: (noms: [string, string] | null) => void } = $props();

  let duo = $state(false);
  let nom1 = $state("");
  let nom2 = $state("");
  let theme = $state(themeActuel());
  // Tant qu'on n'a rien forcé, le bouton suit le réglage du système, même s'il change pendant la visite.
  $effect(() => {
    const systeme = matchMedia("(prefers-color-scheme: dark)");
    const suivre = () => { theme = themeActuel(); };
    systeme.addEventListener("change", suivre);
    return () => systeme.removeEventListener("change", suivre);
  });
  function basculerTheme() {
    theme = themeActuel() === "sombre" ? "clair" : "sombre";
    choisirTheme(theme);
  }
  const propre = (n: string, defaut: string) => n.trim().slice(0, 24) || defaut;

  // La bande-annonce (carte, bus animés) arrive à part : le bouton « C'est parti » ne l'attend pas.
  const bandeAnnonce = import("./BandeAnnonce.svelte");
  let partir: HTMLButtonElement | undefined = $state();
</script>

<div class="hero">
  <div class="haut">
    <p class="etiquette-signal">Présidentielle 2027</p>
    <!-- Le bouton annonce le mode vers lequel il bascule. -->
    <button class="theme" class:sombre={theme === "sombre"} onclick={basculerTheme}>
      <span aria-hidden="true">{theme === "sombre" ? "☀" : "☾"}</span> {theme === "sombre" ? "Mode clair" : "Mode sombre"}
    </button>
  </div>
  <h1 tabindex="-1">Quel bus te ramène chez toi ?</h1>
</div>

{#await bandeAnnonce}
  <div class="attente" aria-hidden="true"></div>
{:then { default: BandeAnnonce }}
  <BandeAnnonce onPasser={() => partir?.focus()} />
{/await}

<p class="rangee">
  <button class="principal" bind:this={partir} onclick={() => onCommencer(null)}>C'est parti</button>
  <button onclick={() => (duo = !duo)} aria-expanded={duo}>À deux</button>
  <span class="discret petit">5 minutes environ</span>
</p>

{#if duo}
  <form class="boite duo" onsubmit={ev => { ev.preventDefault(); onCommencer([propre(nom1, "Joueur 1"), propre(nom2, "Joueur 2")]); }}>
    <p><strong>Idéal en famille ou entre amis.</strong> Chacun range les candidats et répond de son côté, sur ce téléphone, puis on compare vos deux trajets.</p>
    <label>Premier prénom <input bind:value={nom1} maxlength="24" placeholder="Joueur 1" autocomplete="off" /></label>
    <label>Second prénom <input bind:value={nom2} maxlength="24" placeholder="Joueur 2" autocomplete="off" /></label>
    <p class="discret petit">Les prénoms restent sur ce téléphone et disparaissent à la fermeture de la page.</p>
    <button class="principal" type="submit">Commencer à deux</button>
  </form>
{/if}

<p class="info petit">Rien n'est enregistré : tout se passe dans ton navigateur et disparaît quand tu fermes la page. Pas de compte, pas de cookie, pas de pub.</p>

<style>
  .hero { background: var(--marque); color: #fff; margin: -20px -16px 16px; padding: 24px 16px 22px; border-bottom: 6px solid var(--jaune); }
  .hero p { color: var(--jaune); margin: 0 0 6px; }
  .haut { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 4px; }
  .haut p { margin: 0; }
  /* Bouton plein, bien visible sur le bandeau bleu nuit : blanc en mode clair, jaune en mode sombre. */
  .theme { min-height: 44px; padding: 6px 14px; font-size: 15px; border-radius: 999px; background: #fff; color: var(--marque); border-color: #fff; font-weight: 800; }
  .theme.sombre { background: var(--jaune); border-color: var(--jaune); }
  .hero h1 { margin: 0; }
  /* Place réservée à la bande-annonce le temps qu'elle arrive : la page ne saute pas. */
  .attente { max-width: 560px; margin: 4px auto 18px; aspect-ratio: 3 / 2.6; border-radius: var(--rayon); background: var(--carte); }
  .duo { display: grid; gap: 10px; margin-bottom: 16px; }
  .duo p { margin: 0; }
  .duo label { display: grid; gap: 4px; font-weight: 700; }
  .duo input { font: inherit; min-height: 48px; padding: 8px 12px; border: 2px solid var(--contour); border-radius: 6px; background: var(--fond); color: var(--encre); }
</style>

<script lang="ts">
  import Bus from "../lib/Bus.svelte";
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
</script>

<div class="hero">
  <div class="haut">
    <p class="etiquette-signal">Présidentielle 2027</p>
    <button class="theme" onclick={basculerTheme} aria-pressed={theme === "sombre"}>
      <span aria-hidden="true">{theme === "sombre" ? "☀" : "☾"}</span> Mode sombre
    </button>
  </div>
  <h1 tabindex="-1">Quel bus te ramène chez toi ?</h1>
</div>

<div class="trio" aria-hidden="true">
  <svg viewBox="-34 -8 240 112"><Bus niveau="adore" /></svg>
  <svg viewBox="-34 -8 240 112"><Bus niveau="bof" /></svg>
  <svg viewBox="-34 -8 240 112"><Bus niveau="jamais" /></svg>
</div>

<p>En 2027, plusieurs bus vont se présenter devant toi. Aucun ne te déposera pile devant chez toi. Mais lequel te rapproche le plus de tes idées ?</p>
<p>Et si ce n'était pas celui qui a la plus belle carrosserie ?</p>

<ol class="etapes">
  <li><strong>Tu ranges les candidats</strong> selon ton ressenti. Chacun devient un bus, du car de luxe à l'épave.</li>
  <li><strong>Tu réponds aux questions</strong>, 20 ou 100, au choix.</li>
  <li><strong>Les bus partent.</strong> On regarde lequel s'arrête le plus près de chez toi.</li>
</ol>

<p class="rangee">
  <button class="principal" onclick={() => onCommencer(null)}>C'est parti</button>
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
  .theme { min-height: 44px; padding: 6px 14px; font-size: 15px; border-radius: 999px; background: transparent; color: #fff; border-color: rgb(255 255 255 / 0.6); }
  .theme[aria-pressed="true"] { background: var(--jaune); border-color: var(--jaune); color: var(--marque); }
  .hero h1 { margin: 0; }
  .trio { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 8px 0 16px; background: var(--panneau); border-radius: var(--rayon); padding: 6px; }
  .trio svg { width: 100%; height: auto; }
  .etapes { padding-left: 22px; }
  .etapes li { margin-bottom: 6px; }
  .etapes li::marker { font-weight: 900; }
  .duo { display: grid; gap: 10px; margin-bottom: 16px; }
  .duo p { margin: 0; }
  .duo label { display: grid; gap: 4px; font-weight: 700; }
  .duo input { font: inherit; min-height: 48px; padding: 8px 12px; border: 2px solid var(--contour); border-radius: 6px; background: var(--fond); color: var(--encre); }
</style>

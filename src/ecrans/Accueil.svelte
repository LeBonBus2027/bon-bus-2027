<script lang="ts">
  import Bus from "../lib/Bus.svelte";

  let { onCommencer }: { onCommencer: () => void } = $props();
</script>

<div class="hero">
  <p class="etiquette-signal">Présidentielle 2027</p>
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

<p class="rangee"><button class="principal" onclick={onCommencer}>C'est parti</button> <span class="discret petit">5 minutes environ</span></p>

<p class="info petit">Rien n'est enregistré : tout se passe dans ton navigateur et disparaît quand tu fermes la page. Pas de compte, pas de cookie, pas de pub.</p>

<style>
  .hero { background: var(--nuit); color: #fff; margin: -20px -16px 16px; padding: 24px 16px 22px; border-bottom: 6px solid var(--jaune); }
  .hero p { color: var(--jaune); margin: 0 0 6px; }
  .hero h1 { margin: 0; }
  .trio { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 8px 0 16px; }
  .trio svg { width: 100%; height: auto; }
  .etapes { padding-left: 22px; }
  .etapes li { margin-bottom: 6px; }
  .etapes li::marker { font-weight: 900; }
</style>

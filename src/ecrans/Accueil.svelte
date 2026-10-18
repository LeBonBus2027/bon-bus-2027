<script lang="ts">
  import Bus from "../lib/Bus.svelte";

  let { onCommencer }: { onCommencer: () => void } = $props();
</script>

<h1 tabindex="-1">Quel bus te ramène chez toi ?</h1>

<div class="trio" aria-hidden="true">
  <svg viewBox="-34 -8 240 112"><Bus niveau="adore" /></svg>
  <svg viewBox="-34 -8 240 112"><Bus niveau="bof" /></svg>
  <svg viewBox="-34 -8 240 112"><Bus niveau="jamais" /></svg>
</div>

<p>En 2027, plusieurs bus vont se présenter devant toi. Aucun ne te déposera pile devant chez toi. Mais lequel te rapproche le plus de tes idées ?</p>
<p>Et si ce n'était pas celui qui a la plus belle carrosserie ?</p>

<ol class="etapes">
  <li><strong>Tu ranges les candidats</strong> selon ton ressenti. Chacun devient un bus, du car de luxe à l'épave.</li>
  <li><strong>Tu réponds aux questions</strong>, 20 ou 100, au choix.</li>
  <li><strong>Les bus partent.</strong> On regarde lequel s'arrête le plus près de chez toi.</li>
</ol>

<p class="rangee"><button class="principal" onclick={onCommencer}>C'est parti</button> <span class="discret petit">5 minutes environ</span></p>

<p class="boite petit">Rien n'est enregistré : tout se passe dans ton navigateur et disparaît quand tu fermes la page. Pas de compte, pas de cookie, pas de pub.</p>

<style>
  .trio { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 8px 0 16px; }
  .trio svg { width: 100%; height: auto; }
  .etapes { padding-left: 22px; }
  .etapes li { margin-bottom: 6px; }
</style>

<script lang="ts">
  import Photo from "../lib/Photo.svelte";
  import type { Classe } from "../lib/calcul";
  import type { Candidat } from "../lib/donnees";
  import { arrets } from "../lib/revelation";

  /**
   * « Tout le monde descend » : l'afficheur de l'arrêt de bus, jaune sur bleu nuit, avec les 3 bus qui s'arrêtent
   * le plus près de chez toi. Les lignes tombent comme des palettes d'afficheur ; la première est plus grande.
   * La peinture n'est pas encore grattée : on n'y montre que les noms et les arrêts.
   */
  let { podium, total }: { podium: readonly Classe<Candidat>[]; total: number } = $props();
</script>

<div class="afficheur">
  <p class="tete" aria-hidden="true"><span class="point"></span>Terminus · arrivées</p>
  <ol aria-label="Les {podium.length} bus qui s'arrêtent le plus près de chez toi, sur {total}">
    {#each podium as c, i (c.candidat.id)}
      <li class:premier={i === 0} style:--retard="{0.15 + i * 0.25}s">
        <span class="rang" aria-hidden="true">{i + 1}</span>
        <Photo id={c.candidat.id} taille={i === 0 ? 48 : 36} />
        <span class="nom">{c.candidat.nom}</span>
        <span class="arrets">{arrets(c.trajet.arrets)}</span>
      </li>
    {/each}
  </ol>
</div>

<style>
  /* Afficheur d'arrêt : mêmes couleurs que la girouette (contraste 11:1), ne change pas en mode sombre. */
  .afficheur {
    margin: 4px 0 12px; padding: 10px 12px 12px; border-radius: var(--rayon); background: var(--marque); color: var(--jaune);
    box-shadow: inset 0 0 0 3px #13294a, 0 6px 0 #13294a;
    font-family: ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace; font-weight: 700;
  }
  .tete { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.85; }
  .point { width: 8px; height: 8px; border-radius: 50%; background: var(--jaune); animation: clignote 1.2s steps(2, jump-none) infinite; }
  @keyframes clignote { 50% { opacity: 0.2; } }
  ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; perspective: 600px; }
  li {
    display: grid; grid-template-columns: 1.6em auto 1fr auto; align-items: center; gap: 10px;
    padding: 6px 8px; border-radius: 6px; background: #13294a; font-size: 16px;
    transform-origin: top; animation: palette 0.55s cubic-bezier(.3, 1.4, .5, 1) var(--retard) both;
  }
  @keyframes palette { from { transform: rotateX(-95deg); opacity: 0; } to { transform: none; opacity: 1; } }
  .premier { font-size: 19px; padding-block: 9px; box-shadow: inset 0 0 0 2px var(--jaune); }
  .rang { display: grid; place-items: center; width: 1.6em; height: 1.6em; border-radius: 4px; background: var(--jaune); color: var(--marque); font-weight: 900; }
  .nom { color: #fff; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-weight: 800; line-height: 1.2; min-width: 0; }
  .arrets { white-space: nowrap; text-align: right; }
  @media (max-width: 420px) { li { grid-template-columns: 1.6em auto 1fr; } .arrets { grid-column: 3; text-align: left; font-size: 14px; } .premier .arrets { font-size: 16px; } }
  @media (prefers-reduced-motion: reduce) { li, .point { animation: none; } }
</style>

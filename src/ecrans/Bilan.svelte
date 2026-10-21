<script lang="ts">
  import Bus from "../lib/Bus.svelte";
  import BusAnime from "../lib/BusAnime.svelte";
  import Photo from "../lib/Photo.svelte";
  import { R0, type Classe } from "../lib/calcul";
  import type { Candidat } from "../lib/donnees";
  import { BAC, type Niveau } from "../lib/niveaux";
  import { arrets, effet, type Revelation } from "../lib/revelation";

  /**
   * Sous la morale, les deux bus les plus parlants : ton plus beau bus quand il ne te rapproche pas le plus,
   * et le bus qui te rapproche le plus. Si ton intuition était la bonne, une seule carte.
   */
  let { revelation, bacs }: { revelation: Revelation; bacs: Record<string, Niveau> } = $props();

  interface Carte { c: Classe<Candidat>; titre: string; phrase: string }
  const rangement = (c: Classe<Candidat>) => {
    const n = bacs[c.candidat.id] ?? "inconnu";
    return n === "inconnu" ? "Tu ne le connaissais pas." : `Tu l'avais mis dans le bac « ${BAC[n]} ».`;
  };
  const cartes = $derived.by((): Carte[] => {
    const { meilleur, beau, intuition } = revelation;
    if (intuition || !beau || beau.trajet.arrets <= meilleur.trajet.arrets) {
      return [{ c: meilleur, titre: intuition ? "Ton intuition" : "Ton bus", phrase: `${rangement(meilleur)} C'est lui qui te rapproche le plus.` }];
    }
    return [
      { c: beau, titre: "Ton coup de cœur", phrase: `${rangement(beau)} ${beau.trajet.arrets > R0 ? "Il est parti dans l'autre sens, vers le terminus." : "Il ne va pas vraiment vers chez toi."}` },
      { c: meilleur, titre: "La surprise", phrase: `${rangement(meilleur)} C'est pourtant lui qui te rapproche le plus.` },
    ];
  });
</script>

<ul class="bilan" class:seul={cartes.length === 1}>
  {#each cartes as { c, titre, phrase }, i (c.candidat.id)}
    {@const avant = bacs[c.candidat.id] ?? "inconnu"}
    {@const apres = revelation.peinture[c.candidat.id] ?? "bof"}
    <li class="ticket" style:--retard="{i * 0.2}s">
      <p class="titre etiquette-signal">{titre}</p>
      <p class="qui"><Photo id={c.candidat.id} taille={44} /> <strong>{c.candidat.nom}</strong></p>
      <p class="bus" aria-hidden="true">
        <svg viewBox="-34 -8 240 112"><Bus niveau={avant} /></svg>
        <span class="fleche">→</span>
        <span class="apres"><BusAnime niveau={apres} effet={effet(avant, apres)} retard={i * 0.2 + 0.3} /></span>
      </p>
      <p class="arrets">{arrets(c.trajet.arrets)}</p>
      <p class="phrase">{phrase}</p>
    </li>
  {/each}
</ul>

<style>
  .bilan { list-style: none; padding: 0; margin: 14px 0 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
  .seul { grid-template-columns: minmax(0, 340px); }
  .ticket { background: var(--panneau); color: var(--marque); border: 2px solid var(--contour); border-radius: var(--rayon); overflow: hidden; display: grid; animation: entree 0.5s ease-out both; animation-delay: var(--retard); }
  @keyframes entree { from { opacity: 0; transform: translateY(10px); } }
  .ticket p { margin: 0; padding-inline: 12px; }
  /* Bandeau façon girouette : jaune sur bleu nuit. */
  .titre { background: var(--marque); color: var(--jaune); padding-block: 6px; font-size: 13px; }
  .qui { display: flex; align-items: center; gap: 10px; padding-top: 10px; font-size: 17px; }
  .bus { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 4px; padding-top: 4px; }
  .bus > svg, .apres { width: 100%; max-width: 110px; height: auto; justify-self: center; }
  .fleche { font-size: 22px; font-weight: 900; }
  .arrets { font-size: 26px; font-weight: 900; line-height: 1.1; padding-top: 2px; }
  .phrase { padding-bottom: 12px; font-size: 15px; color: #4a5b72; }
  @media (prefers-reduced-motion: reduce) { .ticket { animation: none; } }
</style>

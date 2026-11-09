<script lang="ts" module>
  import brut from "../../data/photos.json";

  export interface InfoPhoto {
    fichier: string; licence: string; auteur: string; date: string; page: string; local: string;
    cadrage?: { zoom: number; x: number; y: number };
  }
  /** Portraits libres de Wikimedia Commons, hébergés avec le site (data/photos.json, scripts/photos-commons.mjs). */
  export const PHOTOS = brut as Record<string, InfoPhoto>;
  export const urlPhoto = (id: string) => (PHOTOS[id] ? import.meta.env.BASE_URL + PHOTOS[id].local : null);
</script>

<script lang="ts">
  import { candidats } from "./candidats";

  /**
   * Portrait rond, même traitement pour tous ; décoratif car le nom est toujours écrit à côté.
   * Sans portrait sous licence libre (nouveau candidat, par exemple), les initiales du nom, dans le même rond.
   */
  let { id, taille = 48 }: { id: string; taille?: number } = $props();
  const info = $derived(PHOTOS[id]);
  const c = $derived(info?.cadrage ?? { zoom: 1, x: 50, y: 25 });
  const initiales = $derived.by(() => {
    const mots = (candidats.find(x => x.id === id)?.nom ?? "").split(/\s+/).filter(m => /^\p{Lu}/u.test(m));
    return ((mots[0]?.[0] ?? "") + (mots.length > 1 ? mots.at(-1)![0] : "")).toUpperCase();
  });
</script>

<span class="photo" class:sans={!info} style:width="{taille}px" style:height="{taille}px" style:font-size="{Math.round(taille * 0.38)}px" aria-hidden="true">
  {#if info}
    <img src={urlPhoto(id)} alt="" loading="lazy" decoding="async" width={taille} height={taille}
      style:object-position="{c.x}% {c.y}%" style:transform="scale({c.zoom})" style:transform-origin="{c.x}% {c.y}%" />
  {:else}
    {initiales}
  {/if}
</span>

<style>
  .photo { display: inline-block; flex: none; border-radius: 50%; overflow: hidden; background: #d9d4c7; vertical-align: middle; }
  .sans { display: inline-grid; place-items: center; background: #0b1f3a; color: #ffcd00; font-weight: 900; letter-spacing: 0.02em; line-height: 1; }
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style>

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
  /** Portrait rond, même traitement pour tous ; décoratif car le nom est toujours écrit à côté. */
  let { id, taille = 48 }: { id: string; taille?: number } = $props();
  const info = $derived(PHOTOS[id]);
  const c = $derived(info?.cadrage ?? { zoom: 1, x: 50, y: 25 });
</script>

<span class="photo" style:width="{taille}px" style:height="{taille}px" aria-hidden="true">
  {#if info}
    <img src={urlPhoto(id)} alt="" loading="lazy" decoding="async" width={taille} height={taille}
      style:object-position="{c.x}% {c.y}%" style:transform="scale({c.zoom})" style:transform-origin="{c.x}% {c.y}%" />
  {/if}
</span>

<style>
  .photo { display: inline-block; flex: none; border-radius: 50%; overflow: hidden; background: #d9d4c7; vertical-align: middle; }
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style>

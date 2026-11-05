<script lang="ts">
  import Bus from "../lib/Bus.svelte";
  import { NIVEAUX, type Niveau } from "../lib/niveaux";
  import type { Revelation } from "../lib/revelation";
  import { lignesPartage, lignesTicket } from "../lib/partage";
  import { dessinerTicket } from "../lib/ticket";

  let { revelation, bacs, titre = true, vedette = false }: {
    revelation: Revelation; bacs: Record<string, Niveau>;
    /** false quand le titre est déjà donné autour (diaporama). */
    titre?: boolean;
    /** Récap : sur fond bleu nuit, gros bouton jaune et réseaux visibles d'emblée (on veut que ça circule). */
    vedette?: boolean;
  } = $props();

  let avecNoms = $state(false);
  let enCours = $state(false);
  let message = $state("");
  // Un dessin caché de chaque bus, sérialisé en image pour le ticket.
  let dessins = $state<Partial<Record<Niveau, SVGSVGElement>>>({});
  let apercu = $state<string | null>(null);
  // On partage l'accueil, jamais un résultat : ni réponse ni classement dans l'adresse.
  const lien = `${location.origin}${location.pathname}`;
  const APPEL = "Et toi, quel bus te ramène chez toi ?";

  // Le hashtag permet de suivre ce qui se dit du site sur les réseaux (aucune mesure d'audience sur le site lui-même).
  const HASHTAG = "#LeBonBus2027";
  const texte = $derived(`${lignesPartage(revelation, bacs, avecNoms).join(" ")} ${APPEL} ${HASHTAG}`);
  const e = encodeURIComponent;

  // Simples liens vers les pages de partage des réseaux : aucun de leurs scripts n'est chargé ici.
  const reseaux = $derived([
    { nom: "WhatsApp", url: `https://wa.me/?text=${e(`${texte} ${lien}`)}` },
    // Facebook et LinkedIn refusent tout texte prérempli : on le copie au clic, il n'y a plus qu'à le coller.
    { nom: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${e(lien)}`, copie: true },
    { nom: "X", url: `https://x.com/intent/post?text=${e(texte)}&url=${e(lien)}` },
    { nom: "Bluesky", url: `https://bsky.app/intent/compose?text=${e(`${texte} ${lien}`)}` },
    { nom: "LinkedIn", url: `https://www.linkedin.com/sharing/share-offsite/?url=${e(lien)}`, copie: true },
    { nom: "Telegram", url: `https://t.me/share/url?url=${e(lien)}&text=${e(texte)}` },
  ]);

  async function imageBus(niveau: Niveau): Promise<HTMLImageElement | null> {
    const svg = dessins[niveau];
    if (!svg) return null;
    const copie = svg.cloneNode(true) as SVGSVGElement;
    copie.querySelectorAll(".bouffee, .mouche").forEach(el => el.remove());   // animées en CSS, absentes de l'image
    copie.setAttribute("width", "660");
    copie.setAttribute("height", "308");
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copie)], { type: "image/svg+xml" }));
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }


  async function creerImage(): Promise<File> {
    const blob = await dessinerTicket(lignesTicket(revelation, bacs, avecNoms), imageBus, location.host);
    return new File([blob], "mon-ticket-2027.png", { type: "image/png" });
  }

  // Aperçu du ticket, refait quand on coche ou décoche les noms.
  $effect(() => {
    void avecNoms;
    if (NIVEAUX.some(n => !dessins[n.cle])) return;
    let annule = false;
    let url: string | null = null;
    creerImage().then(f => {
      if (annule) return;
      url = URL.createObjectURL(f);
      apercu = url;
    }).catch(() => { apercu = null; });
    return () => { annule = true; if (url) URL.revokeObjectURL(url); };
  });

  /** Menu de partage du téléphone (HTTPS uniquement) ; sinon on renvoie vers les boutons. */
  async function partager() {
    enCours = true;
    message = "";
    try {
      if (!navigator.share) { message = "Ton navigateur ne propose pas le partage direct : choisis un réseau ci-dessous."; return; }
      const fichier = await creerImage().catch(() => null);
      if (fichier && navigator.canShare?.({ files: [fichier] })) await navigator.share({ files: [fichier], text: texte, url: lien });
      else await navigator.share({ text: texte, url: lien });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) message = "Le partage n'a pas abouti : choisis un réseau ci-dessous.";
    } finally {
      enCours = false;
    }
  }

  /** Avant d'ouvrir Facebook ou LinkedIn : copie du texte (le lien, lui, est transmis au réseau). */
  async function copierAvant(r: { copie?: boolean }) {
    if (!r.copie) return;
    try {
      await navigator.clipboard.writeText(texte);
      message = "Ton texte est copié : colle-le dans ta publication.";
    } catch { /* presse-papiers indisponible (page non sécurisée) : le lien est partagé sans texte */ }
  }

  async function copier() {
    try {
      await navigator.clipboard.writeText(`${texte} ${lien}`);
      message = "Texte et lien copiés : tu n'as plus qu'à les coller.";
    } catch {
      message = `Copie impossible ici. Voici le lien : ${lien}`;
    }
  }

  async function telecharger() {
    try {
      const f = await creerImage();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(f);
      a.download = f.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch {
      message = "L'image n'a pas pu être créée. Fais plutôt une capture d'écran.";
    }
  }
</script>

{#snippet listeReseaux()}
  <ul class="reseaux" aria-label="Partager sur un réseau">
    {#each reseaux as r (r.nom)}
      <li><a class="reseau" href={r.url} target="_blank" rel="noopener noreferrer" onclick={() => copierAvant(r)}>{r.nom}</a></li>
    {/each}
    <li><button class="reseau" onclick={copier}>Copier le lien</button></li>
    <li><button class="reseau" onclick={telecharger}>Télécharger l'image</button></li>
  </ul>
{/snippet}

<div class="boite partage" class:nu={!titre} class:vedette>
  {#if titre}<h2>Partage ton trajet</h2>{/if}
  {#if apercu}<img class="apercu" src={apercu} alt="Aperçu de ton ticket de bus à partager : ton coup de cœur et celui qui te ramène, tels que tu les imaginais et tels qu'ils sont vraiment pour toi." />{/if}
  <p><button class="principal" class:geant={vedette} onclick={partager} disabled={enCours}>
    {#if vedette}<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>{/if}
    {enCours ? "Préparation…" : vedette ? "Partager mon ticket" : "Partager"}
  </button></p>
  {#if vedette}{@render listeReseaux()}{/if}
  <label><input type="checkbox" bind:checked={avecNoms} /> Afficher les noms des candidats</label>
  <p class="discret petit">Sans les noms, ton partage ne dévoile pas tes préférences : il donne juste envie d'essayer. Le lien mène à l'accueil, jamais à ton résultat.</p>
  {#if !vedette}
    <details>
      <summary>Choisir un réseau, copier le lien ou télécharger l'image</summary>
      {@render listeReseaux()}
    </details>
  {/if}
  {#if message}<p role="status">{message}</p>{/if}
  <div class="cache" aria-hidden="true">
    {#each NIVEAUX as n (n.cle)}
      <svg bind:this={dessins[n.cle]} viewBox="-20 -6 230 110" xmlns="http://www.w3.org/2000/svg"><Bus niveau={n.cle} /></svg>
    {/each}
  </div>
</div>

<style>
  .partage { margin: 16px 0; }
  /* Dans le diaporama : pas de boîte autour, le ticket un peu plus grand. */
  .nu { margin: 0; padding: 0; background: none; }
  .nu .apercu { max-width: 260px; }
  h2 { margin-top: 0; }
  .reseaux { list-style: none; padding: 0; margin: 4px 0 12px; display: flex; flex-wrap: wrap; gap: 8px; }
  .reseau {
    display: inline-flex; align-items: center; min-height: 44px; padding: 8px 14px; border-radius: 999px;
    border: 2px solid var(--contour); background: var(--fond); color: var(--encre); text-decoration: none; font-size: 16px; font-weight: 700;
  }
  label { display: inline-flex; align-items: center; gap: 8px; min-height: 48px; }
  input { width: 22px; height: 22px; }
  .partage p:last-of-type { margin-bottom: 0; }
  summary { min-height: 48px; padding: 12px 0; font-weight: 700; color: var(--lien); }
  .cache { position: absolute; width: 1px; height: 1px; overflow: hidden; left: -9999px; }
  /* Récap : posé sur la carte bleu nuit de la page. */
  .vedette { margin: 0; padding: 0; background: none; color: #fff; }
  .vedette .apercu { max-width: 280px; box-shadow: 0 8px 24px rgb(0 0 0 / 0.35); }
  .geant {
    display: inline-flex; align-items: center; justify-content: center; gap: 10px; width: 100%; min-height: 60px;
    font-size: 19px; border-radius: 999px; box-shadow: 0 4px 0 #c9a200; animation: appel 2.4s ease-in-out 1s 3;
  }
  .geant:active { transform: translateY(2px); box-shadow: 0 2px 0 #c9a200; }
  .icone { width: 24px; height: 24px; flex: none; }
  @keyframes appel { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.035); } }
  .vedette .reseaux { justify-content: center; margin: 0 0 10px; }
  .vedette .reseau { background: #fff; color: var(--marque); border-color: #fff; }
  .vedette .reseau:hover { border-color: var(--jaune); }
  .vedette label { color: #fff; }
  .vedette .discret { color: #c9d4e3; }
  .vedette [role="status"] { color: var(--jaune); font-weight: 700; }
  @media (prefers-reduced-motion: reduce) { .geant { animation: none; } }
  .apercu { display: block; width: 100%; max-width: 220px; height: auto; margin: 0 auto 14px; border-radius: var(--rayon); box-shadow: 0 6px 20px rgb(11 31 58 / 0.18); }
</style>

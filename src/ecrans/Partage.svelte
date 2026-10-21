<script lang="ts">
  import Bus from "../lib/Bus.svelte";
  import { BAC, NIVEAUX, type Niveau } from "../lib/niveaux";
  import { effet, type Revelation } from "../lib/revelation";
  import { dessinerTicket, type LigneTicket } from "../lib/ticket";

  let { revelation, bacs }: { revelation: Revelation; bacs: Record<string, Niveau> } = $props();

  let avecNoms = $state(false);
  let enCours = $state(false);
  let message = $state("");
  // Un dessin caché de chaque bus, sérialisé en image pour le ticket.
  let dessins = $state<Partial<Record<Niveau, SVGSVGElement>>>({});
  let apercu = $state<string | null>(null);
  const n = (k: number) => `${k} arrêt${k > 1 ? "s" : ""}`;
  // On partage l'accueil, jamais un résultat : ni réponse ni classement dans l'adresse.
  const lien = `${location.origin}${location.pathname}`;
  const APPEL = "Et toi, quel bus te ramène chez toi ?";

  /** Texte partagé : sans nom de candidat par défaut (cahier des charges, section 2). */
  function lignesTexte(): string[] {
    const { meilleur, beau, intuition } = revelation;
    const nomM = avecNoms ? ` (${meilleur.candidat.nom})` : "";
    if (!beau) return [`Le bus qui me rapproche le plus${nomM} s'arrête à ${n(meilleur.trajet.arrets)} de chez moi.`];
    if (intuition) return [`Mon bus préféré${nomM} est bien celui qui me rapproche le plus de chez moi : ${n(meilleur.trajet.arrets)}.`];
    const nomB = avecNoms ? ` (${beau.candidat.nom})` : "";
    const bac = bacs[meilleur.candidat.id];
    return [
      `Mon plus beau bus${nomB} s'arrête à ${n(beau.trajet.arrets)} de chez moi.`,
      bac === "inconnu"
        ? `Celui qui me ramenait le plus près${nomM}, je ne le connaissais même pas.`
        : `Celui qui me ramenait le plus près${nomM}, je l'avais mis dans le bac « ${BAC[bac ?? "inconnu"]} ».`,
    ];
  }
  const texte = $derived(`${lignesTexte().join(" ")} ${APPEL}`);
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

  /** Contenu du ticket : bus imaginé → bus réel, sans nom par défaut. */
  function lignesTicket(): LigneTicket[] {
    const { meilleur, beau, intuition } = revelation;
    const ligne = (titre: string, c: typeof meilleur): LigneTicket => ({
      titre, nom: avecNoms ? c.candidat.nom : undefined,
      avant: bacs[c.candidat.id] ?? "inconnu", apres: revelation.peinture[c.candidat.id] ?? "bof", arrets: c.trajet.arrets,
      effet: effet(bacs[c.candidat.id] ?? "inconnu", revelation.peinture[c.candidat.id] ?? "bof"),
    });
    if (!beau || intuition) return [ligne(intuition ? "MON BUS PRÉFÉRÉ ME RAMÈNE BIEN" : "CELUI QUI ME RAMÈNE", meilleur)];
    return [ligne("MON PLUS BEAU BUS", beau), ligne("CELUI QUI ME RAMÈNE", meilleur)];
  }

  async function creerImage(): Promise<File> {
    const blob = await dessinerTicket(lignesTicket(), imageBus, location.host);
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

<div class="boite partage">
  <h2>Partage ton trajet</h2>
  {#if apercu}<img class="apercu" src={apercu} alt="Aperçu de ton ticket de bus à partager : ton plus beau bus et celui qui te ramène, tels que tu les imaginais et tels qu'ils sont vraiment pour toi." />{/if}
  <p><button class="principal" onclick={partager} disabled={enCours}>{enCours ? "Préparation…" : "Partager"}</button></p>
  <label><input type="checkbox" bind:checked={avecNoms} /> Afficher les noms des candidats</label>
  <p class="discret petit">Sans les noms, ton partage ne dévoile pas tes préférences : il donne juste envie d'essayer. Le lien mène à l'accueil, jamais à ton résultat.</p>
  <details>
    <summary>Choisir un réseau, copier le lien ou télécharger l'image</summary>
  <ul class="reseaux" aria-label="Partager sur un réseau">
    {#each reseaux as r (r.nom)}
      <li><a class="reseau" href={r.url} target="_blank" rel="noopener noreferrer" onclick={() => copierAvant(r)}>{r.nom}</a></li>
    {/each}
    <li><button class="reseau" onclick={copier}>Copier le lien</button></li>
    <li><button class="reseau" onclick={telecharger}>Télécharger l'image</button></li>
  </ul>
  </details>
  {#if message}<p role="status">{message}</p>{/if}
  <div class="cache" aria-hidden="true">
    {#each NIVEAUX as n (n.cle)}
      <svg bind:this={dessins[n.cle]} viewBox="-20 -6 230 110" xmlns="http://www.w3.org/2000/svg"><Bus niveau={n.cle} /></svg>
    {/each}
  </div>
</div>

<style>
  .partage { margin: 16px 0; }
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
  .apercu { display: block; width: 100%; max-width: 220px; height: auto; margin: 0 auto 14px; border-radius: var(--rayon); box-shadow: 0 6px 20px rgb(11 31 58 / 0.18); }
</style>

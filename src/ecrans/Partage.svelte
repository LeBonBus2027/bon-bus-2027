<script lang="ts">
  import Bus from "../lib/Bus.svelte";
  import type { Niveau } from "../lib/niveaux";
  import { BAC } from "../lib/niveaux";
  import type { Revelation } from "../lib/revelation";

  let { revelation, bacs }: { revelation: Revelation; bacs: Record<string, Niveau> } = $props();

  let avecNoms = $state(false);
  let enCours = $state(false);
  let message = $state("");
  let dessinBus: SVGSVGElement | undefined = $state();

  const niveauMeilleur = $derived(bacs[revelation.meilleur.candidat.id] ?? "inconnu");
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
    { nom: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${e(lien)}` },
    { nom: "X", url: `https://x.com/intent/post?text=${e(texte)}&url=${e(lien)}` },
    { nom: "Bluesky", url: `https://bsky.app/intent/compose?text=${e(`${texte} ${lien}`)}` },
    { nom: "LinkedIn", url: `https://www.linkedin.com/sharing/share-offsite/?url=${e(lien)}` },
    { nom: "Telegram", url: `https://t.me/share/url?url=${e(lien)}&text=${e(texte)}` },
  ]);

  function couper(ctx: CanvasRenderingContext2D, t: string, largeur: number): string[] {
    const sortie: string[] = [];
    let ligne = "";
    for (const mot of t.split(" ")) {
      const essai = ligne ? `${ligne} ${mot}` : mot;
      if (ctx.measureText(essai).width > largeur && ligne) { sortie.push(ligne); ligne = mot; } else ligne = essai;
    }
    if (ligne) sortie.push(ligne);
    return sortie;
  }

  async function imageBus(): Promise<HTMLImageElement | null> {
    if (!dessinBus) return null;
    const copie = dessinBus.cloneNode(true) as SVGSVGElement;
    copie.querySelectorAll(".bouffee, .mouche").forEach(el => el.remove());   // animées en CSS, absentes de l'image
    copie.setAttribute("width", "600");
    copie.setAttribute("height", "280");
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

  /** Image 1080 × 1350 (format portrait des réseaux), fabriquée dans le navigateur. */
  async function creerImage(): Promise<File> {
    const W = 1080, H = 1350, canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
    // Bandeau « Ligne 2027 », comme en haut du site.
    ctx.fillStyle = "#0b1f3a"; ctx.fillRect(0, 0, W, 96); ctx.fillStyle = "#ffcd00"; ctx.fillRect(0, 96, W, 10);
    ctx.beginPath(); ctx.arc(110, 48, 24, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = "#0b1f3a"; ctx.font = "900 28px system-ui, sans-serif"; ctx.fillText("B", 100, 58);
    ctx.fillStyle = "#ffffff"; ctx.font = "800 26px system-ui, sans-serif"; ctx.fillText("LIGNE 2027 · LE BON BUS", 150, 58);
    ctx.fillStyle = "#0b1f3a"; ctx.font = "900 72px system-ui, sans-serif";
    couper(ctx, "Quel bus te ramène chez toi ?", W - 160).forEach((l, i) => ctx.fillText(l, 80, 170 + i * 86));
    const img = await imageBus();
    if (img) ctx.drawImage(img, 240, 360, 600, 280);
    ctx.font = "600 46px system-ui, sans-serif";
    let y = 760;
    for (const para of lignesTexte()) {
      for (const l of couper(ctx, para, W - 160)) { ctx.fillText(l, 80, y); y += 60; }
      y += 24;
    }
    ctx.fillStyle = "#0b1f3a"; ctx.font = "800 38px system-ui, sans-serif";
    for (const l of couper(ctx, `Aucun bus ne te dépose pile devant chez toi. ${APPEL}`, W - 160)) { ctx.fillText(l, 80, y + 20); y += 50; }
    ctx.fillStyle = "#4a5b72"; ctx.font = "400 30px system-ui, sans-serif";
    ctx.fillText("Selon mon classement personnel", 80, H - 120);
    ctx.fillText(location.host, 80, H - 72);
    const blob = await new Promise<Blob | null>(ok => canvas.toBlob(ok, "image/png"));
    if (!blob) throw new Error("image");
    return new File([blob], "mon-bus-2027.png", { type: "image/png" });
  }

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
  <p><button class="principal" onclick={partager} disabled={enCours}>{enCours ? "Préparation…" : "Partager"}</button></p>
  <ul class="reseaux" aria-label="Partager sur un réseau">
    {#each reseaux as r (r.nom)}
      <li><a class="reseau" href={r.url} target="_blank" rel="noopener noreferrer">{r.nom}</a></li>
    {/each}
    <li><button class="reseau" onclick={copier}>Copier le lien</button></li>
    <li><button class="reseau" onclick={telecharger}>Télécharger l'image</button></li>
  </ul>
  <label><input type="checkbox" bind:checked={avecNoms} /> Afficher les noms des candidats</label>
  <p class="discret petit">Sans les noms, ton partage ne dévoile pas tes préférences : il donne juste envie d'essayer. Le lien mène à l'accueil, jamais à ton résultat.</p>
  {#if message}<p role="status">{message}</p>{/if}
  <svg bind:this={dessinBus} class="cache" viewBox="-34 -8 240 112" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><Bus niveau={niveauMeilleur} /></svg>
</div>

<style>
  .partage { margin: 16px 0; }
  h2 { margin-top: 0; }
  .reseaux { list-style: none; padding: 0; margin: 4px 0 12px; display: flex; flex-wrap: wrap; gap: 8px; }
  .reseau {
    display: inline-flex; align-items: center; min-height: 44px; padding: 8px 14px; border-radius: 999px;
    border: 2px solid var(--nuit); background: #fff; color: var(--nuit); text-decoration: none; font-size: 16px; font-weight: 700;
  }
  label { display: inline-flex; align-items: center; gap: 8px; min-height: 48px; }
  input { width: 22px; height: 22px; }
  .partage p:last-of-type { margin-bottom: 0; }
  .cache { position: absolute; width: 1px; height: 1px; overflow: hidden; left: -9999px; }
</style>

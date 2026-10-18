<script lang="ts">
  import Bus from "../lib/Bus.svelte";
  import type { Niveau } from "../lib/niveaux";
  import { BAC } from "../lib/niveaux";
  import type { Revelation } from "../lib/revelation";

  let { revelation, bacs }: { revelation: Revelation; bacs: Record<string, Niveau> } = $props();

  let avecNoms = $state(false);
  let enCours = $state(false);
  let erreur = $state("");
  let dessinBus: SVGSVGElement | undefined = $state();

  const niveauMeilleur = $derived(bacs[revelation.meilleur.candidat.id] ?? "inconnu");
  const n = (k: number) => `${k} arrêt${k > 1 ? "s" : ""}`;

  /** Texte de l'image : sans nom de candidat par défaut (cahier des charges, section 2). */
  function lignesTexte(): string[] {
    const { meilleur, beau, intuition } = revelation;
    const nomM = avecNoms ? ` (${meilleur.candidat.nom})` : "";
    if (!beau) return [`Le bus qui me rapproche le plus${nomM} s'arrête à ${n(meilleur.trajet.arrets)} de chez moi.`];
    if (intuition) return [`Mon bus préféré${nomM} est bien celui qui me rapproche le plus de chez moi : ${n(meilleur.trajet.arrets)}.`];
    const nomB = avecNoms ? ` (${beau.candidat.nom})` : "";
    const bac = bacs[meilleur.candidat.id];
    return [
      `Mon plus beau bus${nomB} m'a laissé à ${n(beau.trajet.arrets)} de chez moi.`,
      bac === "inconnu"
        ? `Celui qui me ramenait le plus près${nomM}, je ne le connaissais même pas.`
        : `Celui qui me ramenait le plus près${nomM}, je l'avais mis dans le bac « ${BAC[bac ?? "inconnu"]} ».`,
    ];
  }

  function couper(ctx: CanvasRenderingContext2D, texte: string, largeur: number): string[] {
    const sortie: string[] = [];
    let ligne = "";
    for (const mot of texte.split(" ")) {
      const essai = ligne ? `${ligne} ${mot}` : mot;
      if (ctx.measureText(essai).width > largeur && ligne) { sortie.push(ligne); ligne = mot; } else ligne = essai;
    }
    if (ligne) sortie.push(ligne);
    return sortie;
  }

  async function imageBus(): Promise<HTMLImageElement | null> {
    if (!dessinBus) return null;
    const copie = dessinBus.cloneNode(true) as SVGSVGElement;
    copie.querySelectorAll(".bouffee, .mouche").forEach(e => e.remove());   // animées en CSS, absentes de l'image
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

  async function partager() {
    enCours = true;
    erreur = "";
    try {
      const W = 1080, H = 1350, canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#f6f3ec"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#1f2328"; ctx.font = "700 72px system-ui, sans-serif";
      couper(ctx, "Quel bus te ramène chez toi ?", W - 160).forEach((l, i) => ctx.fillText(l, 80, 170 + i * 86));
      const img = await imageBus();
      if (img) ctx.drawImage(img, 240, 360, 600, 280);
      ctx.font = "600 46px system-ui, sans-serif";
      let y = 760;
      for (const para of lignesTexte()) {
        for (const l of couper(ctx, para, W - 160)) { ctx.fillText(l, 80, y); y += 60; }
        y += 24;
      }
      ctx.fillStyle = "#e85d2a"; ctx.font = "600 38px system-ui, sans-serif";
      for (const l of couper(ctx, "Aucun bus ne te dépose pile devant chez toi. Et toi, lequel te rapproche le plus ?", W - 160)) { ctx.fillText(l, 80, y + 20); y += 50; }
      ctx.fillStyle = "#5c6570"; ctx.font = "400 30px system-ui, sans-serif";
      ctx.fillText("Selon mon classement personnel", 80, H - 120);
      ctx.fillText(location.host, 80, H - 72);

      const blob = await new Promise<Blob | null>(ok => canvas.toBlob(ok, "image/png"));
      if (!blob) throw new Error("image");
      const fichier = new File([blob], "mon-bus-2027.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [fichier] })) {
        await navigator.share({ files: [fichier], text: `Et toi, quel bus te ramène chez toi ? ${location.origin}` });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fichier.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) erreur = "L'image n'a pas pu être créée. Réessaie, ou fais une capture d'écran.";
    } finally {
      enCours = false;
    }
  }
</script>

<div class="boite partage">
  <p class="rangee">
    <button class="principal" onclick={partager} disabled={enCours}>{enCours ? "Préparation…" : "Partager mon résultat"}</button>
    <label><input type="checkbox" bind:checked={avecNoms} /> Afficher les noms des candidats</label>
  </p>
  <p class="discret petit">Sans les noms, ton image ne dévoile pas tes préférences : elle donne juste envie d'essayer.</p>
  {#if erreur}<p role="alert">{erreur}</p>{/if}
  <svg bind:this={dessinBus} class="cache" viewBox="-34 -8 240 112" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><Bus niveau={niveauMeilleur} /></svg>
</div>

<style>
  .partage { margin: 16px 0; }
  .partage p:last-of-type { margin-bottom: 0; }
  label { display: inline-flex; align-items: center; gap: 8px; min-height: 48px; }
  input { width: 22px; height: 22px; }
  .cache { position: absolute; width: 1px; height: 1px; overflow: hidden; left: -9999px; }
</style>

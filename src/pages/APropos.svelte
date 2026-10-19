<script lang="ts">
  import { candidats } from "../lib/candidats";
  import { PHOTOS } from "../lib/Photo.svelte";
</script>

<h1 tabindex="-1">À propos</h1>
<p>L'idée vient d'une <a href="https://www.tiktok.com/@4deux_93/video/7688815863260024097" target="_blank" rel="noopener noreferrer">vidéo de @4deux_93</a> : les partis sont des bus, tes idées sont ta maison. Aucun bus ne te dépose pile devant chez toi, mais certains te rapprochent plus que d'autres. Si tu attends le bus parfait, tu attends toute ta vie.</p>
<p>Ce site reprend la métaphore, pas les opinions de l'auteur de la vidéo. Il ne soutient aucun candidat.</p>

<h2>Pourquoi des bus beaux et des bus moches ?</h2>
<p>C'est <strong>ton</strong> ressenti de départ qui habille les bus. Le site ne juge aucun candidat : il montre l'écart entre ce que tu penses d'un candidat et ce qu'il propose réellement.</p>

<h2>Merci</h2>
<ul>
  <li><a href="https://monvote2027.fr" target="_blank" rel="noopener noreferrer">MonVote2027</a>, pour son travail de recensement et de sourçage des positions.</li>
  <li>@4deux_93, pour la métaphore.</li>
</ul>

<h2>Crédits photos</h2>
<p class="petit">Portraits issus de Wikimedia Commons, choisis selon les mêmes critères pour tous : licence libre, portrait de face, au repos, le plus récent possible. Recadrage rond identique pour tous.</p>
<ul class="petit credits">
  {#each candidats.filter(c => PHOTOS[c.id]) as c (c.id)}
    {@const p = PHOTOS[c.id]!}
    <li>{c.nom} : <a href={p.page} target="_blank" rel="noopener noreferrer">{p.auteur || "auteur inconnu"}</a>, {p.licence}{p.date ? `, ${p.date.slice(0, 4)}` : ""}</li>
  {/each}
</ul>

<h2>Signaler un problème</h2>
<ul>
  <li>Une position de candidat te semble fausse : signale-la à <a href="https://monvote2027.fr/contact" target="_blank" rel="noopener noreferrer">MonVote2027</a>, qui la vérifiera.</li>
  <li>Un bug ou une faille de sécurité sur ce site : <span class="a-completer">[À compléter : adresse mail du projet]</span>.</li>
</ul>

<style>
  .a-completer { background: #fff3c4; }
  .credits li { margin-bottom: 4px; }
  .credits a { display: inline-block; min-height: 24px; }
</style>

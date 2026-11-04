<script lang="ts">
  import { COUVERTURE_MIN, MIN_REPONSES, R0 } from "../lib/calcul";
  import { candidats, dateLongue, enSilence, meta, questions, redaction, retenusParDefaut, selection } from "../lib/donnees";
</script>

<h1 tabindex="-1">Comment ça marche</h1>
<p>Le site compare tes réponses aux positions publiques des candidats. Il ne donne pas de consigne de vote : il montre quel bus te rapproche le plus de tes idées, selon tes réponses.</p>

<h2>D'où viennent les données</h2>
<p>Les {questions.length} questions et les positions des {candidats.length} candidats viennent de <a href="https://monvote2027.fr/donnees" target="_blank" rel="noopener noreferrer">MonVote2027</a>, un outil citoyen indépendant qui source chaque position (programmes, déclarations, votes). Nous n'en modifions aucune. Une erreur sur une position ? Signale-la directement à MonVote2027 : la correction arrivera ici à l'import suivant.</p>
<p>Les explications « De quoi parle-t-on ? » sous chaque question sont rédigées par LeBonBus2027, d'après les sources citées sous chacune. Textes et sources vérifiés le {dateLongue(redaction.date)}. Voir plus bas comment elles sont écrites.</p>
<p>Les portraits des candidats viennent de Wikimedia Commons, sous licence libre, choisis selon les mêmes critères pour tous. Leurs auteurs sont crédités sur la page <a href="#a-propos">À propos</a>.</p>
<p class="petit discret">Version des données : explications vérifiées le {new Date(redaction.date).toLocaleDateString("fr-FR")}, positions importées de MonVote2027 le {new Date(meta.date_import).toLocaleDateString("fr-FR")}, empreinte <code>{meta.empreinte.slice(0, 16)}…</code></p>

<h2>Les explications « De quoi parle-t-on ? »</h2>
<p>Sous chaque question, un bouton « De quoi parle-t-on ? » déplie une explication en quatre volets : le contexte, ce que disent les preuves, ce qu'il faut savoir aussi, et ce qui reste un choix de valeurs. C'est le même texte pour tout le monde, quelle que soit ta réponse, et il ne cite aucun candidat ni aucun parti.</p>
<ul>
  <li><strong>Les preuves les plus solides comptent le plus :</strong> d'abord les revues de la recherche, puis les études évaluées, puis la statistique publique (INSEE, DARES, Cour des comptes…). Les rapports d'institutions, d'ONG ou de groupes de réflexion sont présentés comme tels. Un avis ou une déclaration ne pèse jamais autant qu'une étude.</li>
  <li><strong>La même règle pour tous les arguments,</strong> que la preuve arrange ou non un programme.</li>
  <li><strong>Les données les plus récentes d'abord.</strong></li>
  <li><strong>Les faits d'un côté, les choix de valeurs de l'autre.</strong> Les textes ne disent jamais quoi voter.</li>
</ul>
<p>Chaque explication liste ses sources. Ces textes résument des travaux publiés : ils peuvent contenir des erreurs ou vieillir.</p>

<h2>Quels candidats au départ</h2>
{#if enSilence}
<p>La loi interdit de publier ou de commenter des sondages la veille et le jour du vote. Pendant cette période, on te propose donc tous les candidats, sans présélection.</p>
{:else}
<p>Pour que le classement reste rapide, on te propose d'office les candidats à <strong>{selection.seuil} % ou plus</strong> dans la moyenne des sondages du premier tour ({retenusParDefaut.length} candidats). Source : <a href={selection.url} target="_blank" rel="noopener noreferrer">{selection.source}</a>, au {new Date(selection.date).toLocaleDateString("fr-FR")}. Ce seuil est le même que celui du remboursement des frais de campagne. La veille et le jour de chaque tour, comme la loi l'impose, le site ne mentionne plus aucun sondage et propose tous les candidats.</p>
{/if}
<p>Tous les autres candidats référencés restent disponibles : tu peux les ajouter à ta gare en un geste. Le calcul est fait pour tous les candidats ; si le bus d'un candidat que tu n'as pas ajouté s'arrête plus près de chez toi que les tiens, on te le signale.</p>

<h2>Comment les bus avancent</h2>
<p>Tous les bus partent de la gare, à {R0} arrêts de chez toi. Pour chaque question, on compare ta réponse à la position du candidat :</p>
<ul>
  <li>même camp et même intensité : le bus avance de 2 pas ;</li>
  <li>même camp, intensité différente : il avance de 1 pas ;</li>
  <li>l'un de vous deux est neutre : il ne bouge pas ;</li>
  <li>camps opposés : il recule de 1 pas ;</li>
  <li>« tout à fait d'accord » face à « pas du tout d'accord » : il recule de 2 pas.</li>
</ul>
<p>À la fin, la distance vaut {R0} × (1 − somme des pas ÷ 2n), où n est le nombre de questions répondues. Un bus d'accord avec toi sur tout, à la même intensité, arrive devant ta porte ; un bus opposé sur tout finit au terminus, {2 * R0} arrêts plus loin. Les questions passées ne comptent pas. Il faut au moins {MIN_REPONSES} réponses.</p>
<p>Si un candidat n'a pas de position sur plus de {Math.round((1 - COUVERTURE_MIN) * 100)} % des questions auxquelles tu as répondu, son résultat porte la mention « position incomplète ».</p>

<h2>La peinture grattée</h2>
<p>À l'arrivée, chaque bus perd la peinture que tu lui avais donnée et prend celle de son rang parmi tes bus : le plus proche de chez toi devient l'autocar de luxe, le plus éloigné l'épave, et les autres se répartissent entre les deux. Deux bus au même nombre d'arrêts ont la même peinture : tous de luxe s'ils sont en tête, tous épaves s'ils sont en queue, sinon celle du milieu de leur groupe. Un bus que tu adorais et qui arrive premier brille ; un bus qui perd trois niveaux ou plus tombe en panne. Ces effets ne disent rien des candidats : ils comparent seulement ton ressenti de départ à tes réponses.</p>

<h2>Ce qui compte pour toi</h2>
<p>À l'arrivée, tu peux choisir jusqu'à 3 grands thèmes qui comptent double, pour tous les candidats de la même façon. Les questions de ces thèmes donnent à chaque bus une poussée en plus : s'il est globalement d'accord avec toi sur ces thèmes, il avance ; s'il ne l'est pas, il recule. Jamais l'inverse, même si tu es un peu moins d'accord avec lui sur ces thèmes qu'ailleurs. Et un bus n'en dépasse un autre que s'il fait mieux que lui sur les thèmes choisis. Sans thème choisi, on retrouve exactement la règle de base. MonVote2027 propose un réglage du même esprit sur sa page de résultats.</p>

<h2>Pourquoi nos résultats peuvent différer de MonVote2027</h2>
<p>MonVote2027 calcule un pourcentage avec une formule linéaire. Nous utilisons leur tableau de concordance qualitative, qui distingue mieux « plutôt pour » de « plutôt contre ». Le classement peut donc légèrement différer. Pour ne pas afficher deux chiffres contradictoires, nous affichons des arrêts plutôt que leur pourcentage.</p>

<h2>Le diaporama de fin</h2>
<p>Si un bus de ton plus beau bac s'arrête plus loin que celui qui te rapproche le plus, c'est ton « coup de cœur qui t'éloigne », repris dans la morale et sur ton ticket. Ce choix dépend seulement de ton classement de départ et de tes réponses, jamais du candidat.</p>

<h2>Ce qui ne compte pas</h2>
<ul>
  <li><strong>Ton classement de départ</strong> ne change que l'apparence des bus. Il n'a aucun effet sur leur trajet.</li>
  <li><strong>Les rues empruntées</strong> par chaque bus sont tirées au hasard une fois pour toutes. Elles ne disent rien des candidats : seul compte le nombre d'arrêts.</li>
  <li><strong>L'ordre d'affichage</strong> des candidats et des questions est tiré au hasard à chaque visite. Les ex-aequo sont départagés au hasard. En version rapide, les 20 questions sont elles-mêmes tirées au hasard parmi les 100 à chaque parcours, 2 dans chacun des 10 grands thèmes pour qu'aucun sujet ne soit oublié.</li>
</ul>

<h2>Les limites</h2>
<p>C'est un outil indicatif. Il ne tient compte ni de la crédibilité des candidats, ni de leur bilan, ni de l'importance que tu donnes à chaque sujet. La campagne n'est pas terminée : les programmes peuvent encore évoluer. Le vote final t'appartient.</p>

<script lang="ts">
  import { COUVERTURE_MIN, MIN_REPONSES, R0 } from "../lib/calcul";
  import { candidats, meta, questions, retenusParDefaut, selection } from "../lib/donnees";
</script>

<h1 tabindex="-1">Comment ça marche</h1>
<p>Le site compare tes réponses aux positions publiques des candidats. Il ne donne pas de consigne de vote : il montre quel bus te rapproche le plus de tes idées, selon tes réponses.</p>

<h2>D'où viennent les données</h2>
<p>Les {questions.length} questions et les positions des {candidats.length} candidats viennent de <a href="https://monvote2027.fr/donnees" target="_blank" rel="noopener noreferrer">MonVote2027</a>, un outil citoyen indépendant qui source chaque position (programmes, déclarations, votes). Nous n'en modifions aucune. Une erreur sur une position ? Signale-la directement à MonVote2027 : la correction arrivera ici à l'import suivant.</p>
<p class="petit discret">Version des données : import du {new Date(meta.date_import).toLocaleDateString("fr-FR")}, empreinte <code>{meta.empreinte.slice(0, 16)}…</code></p>

<h2>Quels candidats au départ</h2>
<p>Pour que le classement reste rapide, on te propose d'office les candidats à <strong>{selection.seuil} % ou plus</strong> dans la moyenne des sondages du premier tour ({retenusParDefaut.length} candidats). Source : <a href={selection.url} target="_blank" rel="noopener noreferrer">{selection.source}</a>, au {new Date(selection.date).toLocaleDateString("fr-FR")}. Ce seuil est le même que celui du remboursement des frais de campagne.</p>
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

<h2>Pourquoi nos résultats peuvent différer de MonVote2027</h2>
<p>MonVote2027 calcule un pourcentage avec une formule linéaire. Nous utilisons leur tableau de concordance qualitative, qui distingue mieux « plutôt pour » de « plutôt contre ». Le classement peut donc légèrement différer. Pour ne pas afficher deux chiffres contradictoires, nous affichons des arrêts plutôt que leur pourcentage.</p>

<h2>Ce qui ne compte pas</h2>
<ul>
  <li><strong>Ton classement de départ</strong> ne change que l'apparence des bus. Il n'a aucun effet sur leur trajet.</li>
  <li><strong>Les rues empruntées</strong> par chaque bus sont tirées au hasard une fois pour toutes. Elles ne disent rien des candidats : seul compte le nombre d'arrêts.</li>
  <li><strong>L'ordre d'affichage</strong> des candidats et des questions est tiré au hasard à chaque visite. Les ex-aequo sont départagés au hasard.</li>
</ul>

<h2>Les limites</h2>
<p>C'est un outil indicatif. Il ne tient compte ni de la crédibilité des candidats, ni de leur bilan, ni de l'importance que tu donnes à chaque sujet. La campagne n'est pas terminée : les programmes peuvent encore évoluer. Le vote final t'appartient.</p>

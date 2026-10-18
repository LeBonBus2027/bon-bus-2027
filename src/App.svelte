<script lang="ts">
  import donnees from "../data/monvote.json";
</script>

<main>
  <h1>Le Bon Bus 2027</h1>
  <p>Socle technique en place : {donnees.candidats.length} candidats, {donnees.questions.length} questions (données monvote2027 du {donnees.meta.date_import}).</p>
</main>

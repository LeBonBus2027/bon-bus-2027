# Simulations de cohérence

Données MonVote2027, 100 questions, 23 candidats. Distance en arrêts : 0 = devant ta porte, 10 = la gare, 20 = le terminus opposé.

## 1. Un électeur qui pense exactement comme le candidat

- **Clone** : reprend toutes ses positions (100 questions). Il doit arriver premier, le plus près possible de la maison.
- **Rapide** : le même clone, sur 200 tirages de 20 questions.
- **Modéré** : mêmes camps, mais « plutôt » au lieu de « tout à fait ».
- **Distrait** : répond au hasard à un quart des questions (200 essais).
- **Anti** : prend le contre-pied de chaque position. Le bus doit partir vers le terminus opposé.

| Candidat | Positions (dont neutres) | Clone : arrêts, rang | Plus proche voisin | Rapide : 1er | Modéré : rang | Distrait : 1er / top 3 | Anti : arrêts, rang depuis la fin |
|---|---|---|---|---|---|---|---|
| Nathalie Arthaud | 89 (8) | 1, 1 | Anasse Kazib (3) | 100 % | 1 (4 arrêts) | 100 % / 100 % | 17, 1 |
| François Asselineau | 91 (18) | 2, 1 | Florian Philippot (5) | 100 % | 1 (4 arrêts) | 100 % / 100 % | 16, 1 |
| Gabriel Attal | 93 (3) | 0, 1 | Édouard Philippe (4) | 100 % | 1 (2 arrêts) | 100 % / 100 % | 16, 1 |
| Delphine Batho | 93 (3) | 0, 1 | Jean-Luc Mélenchon (3) | 100 % | 1 (3 arrêts) | 100 % / 100 % | 18, 1 |
| Xavier Bertrand | 86 (5) | 1, 1 | Édouard Philippe (4) | 100 % | 1 (2 arrêts) | 100 % / 100 % | 16, 1 |
| Juan Branco | 89 (8) | 1, 1 | François Ruffin (6) | 100 % | 1 (3 arrêts) | 100 % / 100 % | 16, 1 |
| Bernard Cazeneuve | 84 (10) | 1, 1 | Dominique de Villepin (5) | 100 % | 1 (2 arrêts) | 100 % / 100 % | 15, 1 |
| Dominique de Villepin | 89 (10) | 1, 1 | Bernard Cazeneuve (6) | 100 % | 1 (2 arrêts) | 100 % / 100 % | 15, 1 |
| Nicolas Dupont-Aignan | 96 (8) | 1, 1 | Éric Zemmour (5) | 100 % | 1 (3 arrêts) | 100 % / 100 % | 17, 1 |
| Raphaël Glucksmann | 93 (7) | 1, 1 | Marine Tondelier (4) | 100 % | 1 (3 arrêts) | 100 % / 100 % | 17, 1 |
| Anasse Kazib | 93 (2) | 0, 1 | Jean-Luc Mélenchon (2) | 100 % | 1 (4 arrêts) | 100 % / 100 % | 19, 1 |
| Marine Le Pen | 97 (2) | 0, 1 | Éric Zemmour (4) | 100 % | 1 (3 arrêts) | 100 % / 100 % | 18, 1 |
| David Lisnard | 89 (4) | 0, 1 | Bruno Retailleau (2) | 100 % | 1 (3 arrêts) | 100 % / 100 % | 18, 1 |
| Jean-Luc Mélenchon | 100 (2) | 0, 1 | Marine Tondelier (2) | 100 % | 3 (5 arrêts) | 100 % / 100 % | 19, 1 |
| Antoine Mikolajczak | 70 (8) | 1, 1 | Raphaël Glucksmann (5) | 100 % | 1 (2 arrêts) | 100 % / 100 % | 15, 1 |
| Édouard Philippe | 92 (12) | 1, 1 | Gabriel Attal (4) | 100 % | 1 (2 arrêts) | 100 % / 100 % | 15, 1 |
| Florian Philippot | 85 (3) | 0, 1 | Nicolas Dupont-Aignan (4) | 100 % | 1 (3 arrêts) | 100 % / 100 % | 18, 1 |
| Natacha Polony | 75 (10) | 1, 1 | Nicolas Dupont-Aignan (6) | 100 % | 1 (2 arrêts) | 100 % / 100 % | 15, 1 |
| Bruno Retailleau | 96 (6) | 1, 1 | David Lisnard (3) | 100 % | 1 (4 arrêts) | 100 % / 100 % | 18, 1 |
| Fabien Roussel | 98 (5) | 1, 1 | François Ruffin (3) | 100 % | 1 (3 arrêts) | 100 % / 100 % | 18, 1 |
| François Ruffin | 96 (4) | 0, 1 | Fabien Roussel (3) | 100 % | 1 (3 arrêts) | 100 % / 100 % | 17, 1 |
| Marine Tondelier | 98 (4) | 0, 1 | Jean-Luc Mélenchon (2) | 100 % | 3 (4 arrêts) | 100 % / 100 % | 19, 1 |
| Éric Zemmour | 98 (4) | 0, 1 | Marine Le Pen (4) | 100 % | 1 (4 arrêts) | 100 % / 100 % | 18, 1 |

## 2. Électeurs qui répondent au hasard

Part des électeurs pour qui chaque candidat arrive premier (2 000 électeurs). Aucun candidat ne devrait dominer.

| Candidat | 100 questions | 20 questions |
|---|---|---|
| Gabriel Attal | 12 % | 9 % |
| Dominique de Villepin | 9 % | 4 % |
| Bernard Cazeneuve | 8 % | 6 % |
| Édouard Philippe | 7 % | 6 % |
| Juan Branco | 6 % | 5 % |
| Marine Le Pen | 5 % | 7 % |
| François Ruffin | 4 % | 3 % |
| Xavier Bertrand | 4 % | 4 % |
| Éric Zemmour | 4 % | 4 % |
| Natacha Polony | 4 % | 4 % |
| Raphaël Glucksmann | 4 % | 6 % |
| Florian Philippot | 4 % | 5 % |
| Nicolas Dupont-Aignan | 4 % | 4 % |
| Fabien Roussel | 4 % | 3 % |
| François Asselineau | 4 % | 2 % |
| Antoine Mikolajczak | 3 % | 4 % |
| Delphine Batho | 3 % | 3 % |
| Nathalie Arthaud | 3 % | 4 % |
| David Lisnard | 2 % | 3 % |
| Bruno Retailleau | 2 % | 6 % |
| Anasse Kazib | 2 % | 4 % |
| Marine Tondelier | 1 % | 3 % |
| Jean-Luc Mélenchon | 1 % | 2 % |

## 3. « Ce qui compte pour toi »

3450 électeurs proches d'un candidat (20 questions, un tiers de réponses au hasard) choisissent 1 à 3 thèmes prioritaires au hasard.

- Le candidat qui pense comme eux perd la 1re place : 1,5 % des cas.
- … sans que le nouveau premier fasse mieux que lui sur les thèmes choisis : 0.
- Bus qui avancent alors que tu es en désaccord avec eux sur ces thèmes, ou qui reculent alors que tu es d'accord : 0.
- Clones parfaits qui ne retrouvent plus leur candidat en 1er : 0.

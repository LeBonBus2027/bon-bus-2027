# Simulations de cohérence

Données MonVote2027, 100 questions, 21 candidats. Distance en arrêts : 0 = devant ta porte, 10 = la gare, 20 = le terminus opposé.

## 1. Un électeur qui pense exactement comme le candidat

- **Clone** : reprend toutes ses positions (100 questions). Il doit arriver premier, le plus près possible de la maison.
- **Rapide** : le même clone, sur 200 tirages de 20 questions.
- **Modéré** : mêmes camps, mais « plutôt » au lieu de « tout à fait ».
- **Distrait** : répond au hasard à un quart des questions (200 essais).
- **Anti** : prend le contre-pied de chaque position. Le bus doit partir vers le terminus opposé.

| Candidat | Positions (dont neutres) | Clone : arrêts, rang | Plus proche voisin | Rapide : 1er | Modéré : rang | Distrait : 1er / top 3 | Anti : arrêts, rang depuis la fin |
|---|---|---|---|---|---|---|---|
| Nathalie Arthaud | 100 (19) | 2, 1 | Anasse Kazib (4) | 100 % | 1 (5 arrêts) | 100 % / 100 % | 17, 1 |
| François Asselineau | 100 (27) | 3, 1 | Florian Philippot (6) | 100 % | 1 (4 arrêts) | 100 % / 100 % | 15, 1 |
| Gabriel Attal | 100 (10) | 1, 1 | Édouard Philippe (4) | 100 % | 1 (2 arrêts) | 100 % / 100 % | 16, 1 |
| Delphine Batho | 100 (9) | 1, 1 | Jean-Luc Mélenchon (3) | 100 % | 1 (4 arrêts) | 100 % / 100 % | 17, 1 |
| Xavier Bertrand | 100 (19) | 2, 1 | Édouard Philippe (5) | 100 % | 1 (3 arrêts) | 100 % / 100 % | 15, 1 |
| Juan Branco | 100 (17) | 2, 1 | Jean-Luc Mélenchon (6) | 100 % | 1 (3 arrêts) | 100 % / 100 % | 16, 1 |
| Bernard Cazeneuve | 100 (28) | 3, 1 | Dominique de Villepin (6) | 100 % | 1 (3 arrêts) | 100 % / 100 % | 14, 1 |
| Dominique de Villepin | 100 (26) | 3, 1 | Raphaël Glucksmann (6) | 100 % | 1 (3 arrêts) | 100 % / 100 % | 14, 1 |
| Nicolas Dupont-Aignan | 100 (12) | 1, 1 | Éric Zemmour (5) | 100 % | 1 (4 arrêts) | 100 % / 100 % | 17, 1 |
| Raphaël Glucksmann | 100 (14) | 1, 1 | Marine Tondelier (5) | 100 % | 1 (4 arrêts) | 100 % / 100 % | 17, 1 |
| Anasse Kazib | 100 (9) | 1, 1 | Jean-Luc Mélenchon (3) | 100 % | 1 (5 arrêts) | 100 % / 100 % | 18, 1 |
| Marine Le Pen | 100 (4) | 0, 1 | Éric Zemmour (4) | 100 % | 1 (3 arrêts) | 100 % / 100 % | 18, 1 |
| David Lisnard | 100 (15) | 2, 1 | Bruno Retailleau (3) | 100 % | 1 (4 arrêts) | 100 % / 100 % | 17, 1 |
| Jean-Luc Mélenchon | 100 (1) | 0, 1 | Marine Tondelier (2) | 100 % | 3 (4 arrêts) | 100 % / 100 % | 19, 1 |
| Édouard Philippe | 100 (20) | 2, 1 | Gabriel Attal (4) | 100 % | 1 (3 arrêts) | 100 % / 100 % | 15, 1 |
| Florian Philippot | 100 (18) | 2, 1 | Nicolas Dupont-Aignan (5) | 100 % | 1 (4 arrêts) | 100 % / 100 % | 17, 1 |
| Bruno Retailleau | 100 (10) | 1, 1 | David Lisnard (3) | 100 % | 1 (4 arrêts) | 100 % / 100 % | 17, 1 |
| Fabien Roussel | 100 (7) | 1, 1 | François Ruffin (3) | 100 % | 1 (4 arrêts) | 100 % / 100 % | 18, 1 |
| François Ruffin | 100 (8) | 1, 1 | Jean-Luc Mélenchon (3) | 100 % | 1 (3 arrêts) | 100 % / 100 % | 17, 1 |
| Marine Tondelier | 100 (6) | 1, 1 | Jean-Luc Mélenchon (2) | 100 % | 2 (4 arrêts) | 100 % / 100 % | 18, 1 |
| Éric Zemmour | 100 (6) | 1, 1 | Marine Le Pen (4) | 100 % | 1 (4 arrêts) | 100 % / 100 % | 18, 1 |

## 2. Électeurs qui répondent au hasard

Part des électeurs pour qui chaque candidat arrive premier (2 000 électeurs). Aucun candidat ne devrait dominer.

| Candidat | 100 questions | 20 questions |
|---|---|---|
| Gabriel Attal | 13 % | 10 % |
| Bernard Cazeneuve | 8 % | 6 % |
| Édouard Philippe | 8 % | 6 % |
| Juan Branco | 8 % | 6 % |
| Dominique de Villepin | 8 % | 4 % |
| Marine Le Pen | 6 % | 7 % |
| François Ruffin | 5 % | 3 % |
| Xavier Bertrand | 5 % | 4 % |
| Nicolas Dupont-Aignan | 4 % | 4 % |
| Florian Philippot | 4 % | 5 % |
| Éric Zemmour | 4 % | 4 % |
| Raphaël Glucksmann | 4 % | 6 % |
| François Asselineau | 4 % | 3 % |
| Delphine Batho | 4 % | 4 % |
| Fabien Roussel | 4 % | 4 % |
| Bruno Retailleau | 3 % | 6 % |
| Nathalie Arthaud | 2 % | 4 % |
| David Lisnard | 2 % | 3 % |
| Anasse Kazib | 2 % | 4 % |
| Marine Tondelier | 1 % | 3 % |
| Jean-Luc Mélenchon | 1 % | 2 % |

## 3. « Ce qui compte pour toi »

3150 électeurs proches d'un candidat (20 questions, un tiers de réponses au hasard) choisissent 1 à 3 thèmes prioritaires au hasard.

- Le candidat qui pense comme eux perd la 1re place : 1,3 % des cas.
- … sans que le nouveau premier fasse mieux que lui sur les thèmes choisis : 0.
- Bus qui avancent alors que tu es en désaccord avec eux sur ces thèmes, ou qui reculent alors que tu es d'accord : 0.
- Clones parfaits qui ne retrouvent plus leur candidat en 1er : 0.

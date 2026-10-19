# Audit des données MonVote2027

Données importées le 2026-10-18 depuis https://monvote2027.fr/donnees : 100 questions, 21 candidats.
Cet audit ne vérifie pas chaque position une par une contre les déclarations des candidats : MonVote2027 ne publie pas de source par position dans ses données. Il cherche les déséquilibres visibles dans les données elles-mêmes.

## En bref

- **Formulation des questions** : répondre « d'accord » rapproche du pôle Jean-Luc Mélenchon sur 62 questions, du pôle Bruno Retailleau sur 27, et ne pousse franchement d'aucun côté sur 11.
- **Électeurs qui répondent toujours la même chose** : toujours « Tout à fait d'accord » → Marine Tondelier ; toujours « Plutôt d'accord » → François Ruffin ; toujours « Plutôt pas d'accord » → Gabriel Attal ; toujours « Pas du tout d'accord » → Éric Zemmour.
- **Électeurs qui répondent au hasard** (règle actuelle) : le candidat le plus souvent premier l'est 12 % du temps, le moins souvent 1 %. Corrélation entre « positions tranchées » et « premier pour un électeur au hasard » : -0,7.
- **Électeurs réalistes** (le clone d'un candidat, avec un tiers de réponses au hasard) : leur candidat arrive premier 100 % du temps.
- **Électeurs qui approuvent trop facilement** (section 3) : quand ils ne retrouvent pas leur candidat, ils partent surtout vers le pôle Jean-Luc Mélenchon, conséquence de la formulation des questions.

## 1. Profil des positions

Une position « tranchée » vaut ±2 (tout à fait d'accord ou pas du tout), une position « nuancée » ±1. « Tranchant » = moyenne des valeurs absolues (0 à 2). « D'accord » = part des questions où le candidat est d'accord avec l'affirmation.

| Candidat | −2 | −1 | 0 | +1 | +2 | Inconnues | Tranchant | D'accord |
|---|---|---|---|---|---|---|---|---|
| Jean-Luc Mélenchon | 28 | 6 | 1 | 6 | 59 | 0 | 1,9 | 65 % |
| Anasse Kazib | 32 | 7 | 9 | 7 | 45 | 0 | 1,7 | 52 % |
| Marine Tondelier | 21 | 8 | 6 | 12 | 53 | 0 | 1,7 | 65 % |
| Éric Zemmour | 41 | 22 | 6 | 11 | 20 | 0 | 1,6 | 31 % |
| Marine Le Pen | 33 | 28 | 4 | 14 | 21 | 0 | 1,5 | 35 % |
| Fabien Roussel | 18 | 18 | 7 | 18 | 39 | 0 | 1,5 | 57 % |
| Delphine Batho | 17 | 11 | 9 | 23 | 40 | 0 | 1,5 | 63 % |
| Bruno Retailleau | 34 | 27 | 10 | 5 | 24 | 0 | 1,5 | 29 % |
| Nicolas Dupont-Aignan | 24 | 21 | 12 | 18 | 25 | 0 | 1,4 | 43 % |
| François Ruffin | 13 | 17 | 8 | 31 | 31 | 0 | 1,4 | 62 % |
| David Lisnard | 29 | 29 | 15 | 6 | 21 | 0 | 1,4 | 27 % |
| Nathalie Arthaud | 27 | 8 | 19 | 20 | 26 | 0 | 1,3 | 46 % |
| Raphaël Glucksmann | 11 | 15 | 14 | 27 | 33 | 0 | 1,3 | 60 % |
| Florian Philippot | 21 | 18 | 18 | 16 | 27 | 0 | 1,3 | 43 % |
| Gabriel Attal | 10 | 44 | 10 | 21 | 15 | 0 | 1,1 | 36 % |
| Juan Branco | 11 | 22 | 17 | 30 | 20 | 0 | 1,1 | 50 % |
| Xavier Bertrand | 12 | 34 | 19 | 20 | 15 | 0 | 1,1 | 35 % |
| François Asselineau | 8 | 19 | 27 | 25 | 21 | 0 | 1,0 | 46 % |
| Édouard Philippe | 10 | 40 | 20 | 21 | 9 | 0 | 1,0 | 30 % |
| Dominique de Villepin | 4 | 26 | 26 | 39 | 5 | 0 | 0,8 | 44 % |
| Bernard Cazeneuve | 6 | 31 | 28 | 32 | 3 | 0 | 0,8 | 35 % |

## 2. L'axe principal des positions

Une analyse en composantes principales résume les 100 positions de chaque candidat. Le premier axe explique 63 % des différences entre candidats, le second 12 %. L'axe est simplement orienté de Jean-Luc Mélenchon à Bruno Retailleau, sans étiquette.

| Candidat | Axe 1 | Axe 2 |
|---|---|---|
| Jean-Luc Mélenchon | -16,1 | 1,0 |
| Marine Tondelier | -14,9 | -3,5 |
| Anasse Kazib | -14,2 | 2,4 |
| Delphine Batho | -12,3 | -1,7 |
| François Ruffin | -10,9 | 0,1 |
| Nathalie Arthaud | -10,8 | 1,4 |
| Fabien Roussel | -10,6 | 1,4 |
| Raphaël Glucksmann | -8,0 | -6,3 |
| Juan Branco | -5,0 | 3,5 |
| Dominique de Villepin | -2,4 | -2,1 |
| Bernard Cazeneuve | -0,6 | -5,1 |
| François Asselineau | 1,0 | 7,5 |
| Florian Philippot | 5,2 | 9,9 |
| Nicolas Dupont-Aignan | 9,0 | 8,5 |
| Édouard Philippe | 9,2 | -7,4 |
| Gabriel Attal | 9,6 | -7,9 |
| Xavier Bertrand | 11,4 | -4,0 |
| Marine Le Pen | 13,3 | 4,8 |
| David Lisnard | 15,2 | -2,6 |
| Éric Zemmour | 15,5 | 3,2 |
| Bruno Retailleau | 16,4 | -3,1 |

Lecture : si cet ordre paraît plausible au regard des programmes connus, les positions codées par MonVote2027 sont cohérentes entre elles. C'est une vérification de vraisemblance, pas une preuve d'exactitude.

## 3. Formulation des questions

Pour chaque question, on regarde vers quel pôle de l'axe 1 pousse une réponse « d'accord » (corrélation entre les positions sur la question et l'axe, au-delà de ±0,4). Si une large majorité des affirmations allait dans le même sens, un électeur qui a tendance à approuver (biais d'acquiescement, bien documenté dans les sondages) serait poussé vers ce camp.

| | Vers Jean-Luc Mélenchon | Vers Bruno Retailleau | Sans direction nette |
|---|---|---|---|
| Toutes les questions | 62 | 27 | 11 |
| Quiz rapide de MonVote (20) | 12 | 6 | 2 |
| Thème agriculture | 2 | 0 | 0 |
| Thème consommation | 1 | 0 | 1 |
| Thème defense | 1 | 1 | 0 |
| Thème democratie | 3 | 0 | 1 |
| Thème economie | 7 | 2 | 0 |
| Thème education | 1 | 2 | 0 |
| Thème energie | 1 | 1 | 0 |
| Thème environnement | 6 | 0 | 1 |
| Thème europe | 1 | 1 | 2 |
| Thème fiscal | 1 | 0 | 0 |
| Thème immigration | 2 | 7 | 1 |
| Thème institutions | 4 | 0 | 0 |
| Thème international | 5 | 0 | 2 |
| Thème jeunesse | 1 | 1 | 0 |
| Thème justice | 1 | 0 | 0 |
| Thème laicite | 0 | 1 | 0 |
| Thème logement | 3 | 2 | 0 |
| Thème medias | 2 | 0 | 0 |
| Thème numerique | 1 | 0 | 2 |
| Thème outremer | 1 | 0 | 0 |
| Thème sante | 4 | 0 | 0 |
| Thème securite | 1 | 4 | 0 |
| Thème social | 4 | 2 | 0 |
| Thème societe | 6 | 0 | 1 |
| Thème transport | 3 | 0 | 0 |
| Thème travail | 0 | 3 | 0 |

### Électeurs qui répondent toujours la même chose

Avec la règle actuelle. Un électeur qui approuve tout ne devrait pas tomber systématiquement sur un camp.

| Électeur | 1er | 2e | 3e | Dernier |
|---|---|---|---|---|
| toujours « Tout à fait d'accord » | Marine Tondelier (6,6) | Jean-Luc Mélenchon (6,9) | Delphine Batho (7,1) | Éric Zemmour (12,7) |
| toujours « Plutôt d'accord » | François Ruffin (6,9) | Raphaël Glucksmann (7,0) | Delphine Batho (7,1) | Bruno Retailleau (11,3) |
| toujours « Plutôt pas d'accord » | Gabriel Attal (6,9) | David Lisnard (7,0) | Édouard Philippe (7,0) | Marine Tondelier (11,4) |
| toujours « Pas du tout d'accord » | Éric Zemmour (7,3) | Bruno Retailleau (7,9) | David Lisnard (8,0) | Marine Tondelier (13,4) |

### Clones « complaisants »

Un électeur qui pense comme le candidat, mais qui glisse d'un cran vers « d'accord » sur la moitié des questions, en version rapide (20 questions au hasard, 300 essais). Sur les 100 questions avec 30 % de glissement, tous retrouvent leur candidat. Quand il ne retrouve pas son candidat en premier, vers quel pôle part-il ?

| Candidat | Retrouve son candidat | Part vers Jean-Luc Mélenchon | Part vers Bruno Retailleau |
|---|---|---|---|
| Jean-Luc Mélenchon | 99 % | 0 % | 1 % |
| Marine Tondelier | 92 % | 7 % | 1 % |
| Anasse Kazib | 79 % | 19 % | 2 % |
| Delphine Batho | 78 % | 21 % | 1 % |
| François Ruffin | 81 % | 17 % | 2 % |
| Nathalie Arthaud | 49 % | 48 % | 3 % |
| Fabien Roussel | 93 % | 6 % | 0 % |
| Raphaël Glucksmann | 94 % | 6 % | 0 % |
| Juan Branco | 94 % | 6 % | 0 % |
| Dominique de Villepin | 77 % | 23 % | 0 % |
| Bernard Cazeneuve | 79 % | 21 % | 0 % |
| François Asselineau | 98 % | 1 % | 1 % |
| Florian Philippot | 95 % | 4 % | 1 % |
| Nicolas Dupont-Aignan | 98 % | 2 % | 0 % |
| Édouard Philippe | 85 % | 0 % | 15 % |
| Gabriel Attal | 99 % | 1 % | 0 % |
| Xavier Bertrand | 96 % | 3 % | 1 % |
| Marine Le Pen | 98 % | 1 % | 1 % |
| David Lisnard | 83 % | 10 % | 8 % |
| Éric Zemmour | 96 % | 2 % | 1 % |
| Bruno Retailleau | 95 % | 5 % | 0 % |

## 4. Contrôles de cohérence

- Questions où tous les candidats ont la même position (elles ne départagent personne) : aucune.
- Questions où au moins la moitié des candidats sont neutres : q34 (« Un mandat de parlementaire doit être incompatible avec l'exercice de toute autre activité professionnelle rémunérée. »).
- Paires de candidats qui diffèrent sur 10 questions ou moins : aucune.

## 5. Trois règles de déplacement comparées

- **MonVote** : +2 même camp et même intensité, +1 même camp, 0 si l'un des deux est neutre, −1 camps opposés, −2 extrêmes opposés.
- **Neutre = accord** : pareil, mais neutre face à neutre compte +2.
- **Écart pur** : le pas vaut 2 − |réponse − position|. Un candidat plus tranché que toi dans ton sens « te dépasse » : il est compté aussi loin qu'un candidat moins tranché que toi.

| | MonVote (règle actuelle) | MonVote + neutre face à neutre = accord | Écart pur (le bus peut dépasser chez toi) |
|---|---|---|---|
| Clones pile devant la maison (sur 21) | 2 | 21 | 21 |
| Clone le plus loin de chez lui (arrêts) | 2,8 | 0,0 | 0,0 |
| Clones « modérés » qui retrouvent leur candidat en 1er | 19 | 20 | 17 |
| Anti-clone : arrêts (min) | 14,1 | 11,3 | 8,1 |
| Électeurs réalistes qui retrouvent leur candidat | 100 % | 100 % | 100 % |
| Électeurs au hasard : premier le plus fréquent | Gabriel Attal 12 % | Bernard Cazeneuve 16 % | Bernard Cazeneuve 35 % |
| Électeurs au hasard : premier le plus rare | Jean-Luc Mélenchon 1 % | Jean-Luc Mélenchon 0 % | Anasse Kazib 0 % |
| « Toujours plutôt d'accord » → 1er | François Ruffin | François Ruffin | Dominique de Villepin |

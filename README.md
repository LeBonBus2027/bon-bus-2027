<p align="center">
  <img src="public/icon-512.png" alt="" width="96" height="96">
</p>

<h1 align="center">LeBonBus2027</h1>

<p align="center"><strong>Quel bus te ramène chez toi ?</strong><br>
Un outil citoyen pour la présidentielle 2027 : neutre, gratuit, sans compte et sans aucune collecte de données.</p>

<p align="center"><a href="https://lebonbus2027.fr"><strong>lebonbus2027.fr</strong></a></p>

<p align="center"><img src="public/og.png" alt="Trois bus : un car de luxe, un bus jaune et une épave, sous le titre « Quel bus te ramène chez toi ? »" width="600"></p>

---

## L'idée

Les candidats sont des bus, tes idées sont ta maison. Aucun bus ne te dépose pile devant chez toi, mais certains te rapprochent plus que d'autres. Si tu attends le bus parfait, tu attends toute ta vie.

1. **Tu ranges les candidats à l'instinct** : car de luxe, bus correct ou épave. C'est ton ressenti de départ, il habille les bus.
2. **Tu réponds aux questions** : 20 tirées au hasard (2 à 3 minutes) ou les 100 (10 minutes). Chaque réponse pose une brique de ta maison.
3. **Les bus partent de la gare** et s'arrêtent plus ou moins près de chez toi, selon les positions réelles des candidats.
4. **On gratte la peinture** : le site montre l'écart entre ce que tu pensais d'un candidat et ce qu'il propose vraiment.
5. **Tu partages ton ticket**, sans les noms si tu veux : il donne envie d'essayer sans dévoiler tes préférences.

Sous chaque question, le bouton **« De quoi parle-t-on ? »** ouvre une explication en quatre volets : le contexte, les preuves, ce qu'il faut savoir aussi et ce qui reste un choix de valeurs.

Le mode **« À deux »** permet de faire le trajet à deux sur le même téléphone, puis de comparer.

## Nos principes

- **Neutre.** Le site ne soutient aucun candidat et ne donne aucune consigne de vote. Les explications ne nomment aucun candidat ni aucun parti, et un contrôle automatique le vérifie à chaque modification.
- **Aucune donnée collectée.** Tout est calculé dans ton navigateur. Pas de compte, pas de cookie, pas de statistiques, pas de service tiers : le navigateur ne contacte que l'hébergeur.
- **Sourcé.** Les positions viennent de MonVote2027, qui source chacune d'elles. Chaque explication liste ses sources.
- **Accessible.** Lisible au clavier et au lecteur d'écran, contrastes vérifiés, animations coupées si tu le demandes à ton appareil.

La méthode de calcul est détaillée sur la page [Comment ça marche](https://lebonbus2027.fr/#methode).

## Sources et crédits

| Quoi | Source |
|---|---|
| Questions et positions des candidats | [MonVote2027](https://monvote2027.fr/donnees), outil citoyen indépendant |
| Explications « De quoi parle-t-on ? » | Rédigées par LeBonBus2027 d'après les sources citées sous chacune |
| Candidats proposés d'office | Moyenne des sondages [Pouls](https://pouls.app/), d'après les notices de la Commission des sondages |
| Portraits | Wikimedia Commons, licences libres, auteurs crédités sur la page [À propos](https://lebonbus2027.fr/#a-propos) |
| Idée originale | La [vidéo de @4deux_93](https://www.tiktok.com/@4deux_93/video/7688815863260024097) et sa métaphore des bus |

Une position de candidat te semble fausse ? Signale-la directement à [MonVote2027](https://monvote2027.fr/contact) : la correction arrivera ici au prochain import.

## Sous le capot

- **[Svelte 5](https://svelte.dev) + [Vite](https://vite.dev)**, en TypeScript. Le site est entièrement statique : aucun serveur, aucune base de données.
- **Hébergement** sur Cloudflare Workers (fichiers statiques seulement), avec une politique de sécurité stricte (aucun script externe, HTTPS obligatoire, impossible d'intégrer le site dans une autre page).
- **Tests** : [Vitest](https://vitest.dev) pour le calcul et les données, [Playwright](https://playwright.dev) avec audit d'accessibilité [axe](https://github.com/dequelabs/axe-core) sur Chrome, Firefox, Safari et mobile.

```
src/
  ecrans/      les étapes du parcours (accueil, classement, questions, trajet, récap, partage…)
  lib/         le calcul des trajets, les données, les bus dessinés, le ticket à partager
  pages/       Comment ça marche, Confidentialité, Mentions légales, À propos
data/          positions MonVote2027, explications, moyenne des sondages, portraits
scripts/       import MonVote2027, génération des explications, contrôle de neutralité, mise en ligne
e2e/           tests de bout en bout et d'accessibilité
```

## Lancer le projet

Il faut [Node.js](https://nodejs.org) 24.

```bash
npm install
```

```bash
npm run dev
```

Avant toute mise en ligne, la vérification complète doit passer : contrôle de neutralité, types, tests unitaires, puis tests de bout en bout et d'accessibilité.

```bash
npm run verifier
```

Mettre à jour les positions depuis MonVote2027 (chaque position modifiée est listée, à relire avant publication) :

```bash
npm run import:monvote
```

Régénérer les explications à partir des textes rédigés (un fichier `qNN.md` par question) :

```bash
node scripts/explications.mjs <dossier des textes>
```

## Contribuer

Les remarques sur les explications sont les bienvenues, surtout si elles s'appuient sur une source : étude évaluée, statistique publique ou rapport d'institution. Chaque texte suit les mêmes règles, quel que soit le camp que la preuve arrange. Elles sont décrites sur la page [Comment ça marche](https://lebonbus2027.fr/#methode).

---

<p align="center">Outil citoyen, indicatif et indépendant de tout parti et de tout candidat.<br>
<strong>Vérifie ton inscription sur les listes électorales, puis va voter.</strong></p>

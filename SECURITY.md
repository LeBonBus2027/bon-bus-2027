# Sécurité

## Signaler une faille

Tu as trouvé une faille sur [lebonbus2027.fr](https://lebonbus2027.fr) ou dans ce code ? Merci de la signaler **en privé**, pas dans un ticket public :

**[Signaler une faille](https://github.com/LeBonBus2027/bon-bus-2027/security/advisories/new)** (onglet « Security » du dépôt, puis « Report a vulnerability »).

Seul l'éditeur du site voit ton signalement. Décris ce que tu as trouvé et, si possible, comment le reproduire.

## Ce qui est concerné

- Le site lebonbus2027.fr : fichiers statiques servis par Cloudflare, sans serveur, sans base de données, sans compte et sans aucune collecte de données.
- Le code de ce dépôt et ses workflows GitHub Actions.

Une position de candidat qui te semble fausse n'est pas une faille : signale-la à [MonVote2027](https://monvote2027.fr/contact), qui la vérifiera.

## Ce que le site fait déjà

- Politique de sécurité stricte : aucun script externe, HTTPS obligatoire (HSTS), impossible d'intégrer le site dans une autre page.
- Aucune donnée personnelle collectée : tout est calculé dans le navigateur.
- Dépendances surveillées par Dependabot, actions GitHub épinglées par empreinte, vérification complète (neutralité, types, tests, accessibilité) avant chaque mise en ligne.

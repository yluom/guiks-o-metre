# guiks-o-metre

Un mod Claude Code : une tête de Guiks s'affiche au-dessus du prompt et réagit à ce que fait Claude.

| Situation | Tête | Répliques |
|---|:---:|---|
| Au repos | <img src="docs/faces/serious-guiks.png" width="40" alt=":serious-guiks:" title=":serious-guiks:"> | « j’observe, faites pas chier » |
| Début d'un tour | <img src="docs/faces/serious-guiks.png" width="40" alt=":serious-guiks:" title=":serious-guiks:"> | « bon, je regarde » · « attends, je réfléchis » · « chais pas, je regarde » · « genre je fais quoi là ? » |
| Claude lit du code | <img src="docs/faces/serious-guiks.png" width="40" alt=":serious-guiks:" title=":serious-guiks:"> | « je lis, foutez-moi la paix » · « je lis, faites pas chier putain » · « attends je lis le truc » · « ça fait quoi ce truc ? » · « du coup, ça fait quoi ? » |
| Claude écrit du code | <img src="docs/faces/serious-guiks.png" width="40" alt=":serious-guiks:" title=":serious-guiks:"> | « j’écris, faites pas chier » · « genre je mets ça ici ? » · « après, ça peut marcher » · « bah je tente » |
| Build ou commande longue (gradle, npm, docker…) | <img src="docs/faces/gamer-guiks.png" width="40" alt=":gamer-guiks:" title=":gamer-guiks:"> | « go build, ça va m’occuper » · « go build, je m’en balek » · « putain, ça va m’occuper » · « on peut respirer deux secondes ? » |
| Une commande échoue | <img src="docs/faces/jpp-guiks.png" width="40" alt=":jpp-guiks:" title=":jpp-guiks:"> | « ’tain » · « quelle merde » · « ça me casse les couilles » · « un truc de merde ça » · « ah ouais ? » · « je vois pas le rapport » |
| Deuxième échec de suite | <img src="docs/faces/jpp-guiks-2.png" width="40" alt=":jpp-guiks-2:" title=":jpp-guiks-2:"> | « nan mais bordel » · « putain, encore ? » · « nan mais quel enculé ce truc » · « ça me casse les couilles là » · « foutez-moi la paix » · « on peut respirer deux secondes ? » |
| Des tests passent | <img src="docs/faces/smirk-guiks.png" width="40" alt=":smirk-guiks:" title=":smirk-guiks:"> | « oh ça a l’air bien ça » · « ouais c’est pas mal » · « LMAO ça passe » · « ah bah voilà » |
| Commande risquée (`rm -rf`, `push --force`, `reset --hard`, `DROP TABLE`…) | <img src="docs/faces/evil-guiks.png" width="40" alt=":evil-guiks:" title=":evil-guiks:"> | « ça va être violent » · « balek, go » · « je m’en bats les couilles, go » · « t’iras en enfer » · « genre tu fais ça ? mdr » · « j’envoie aux RH » |
| Permission refusée | <img src="docs/faces/guiks-troll.png" width="40" alt=":guiks-troll:" title=":guiks-troll:"> | « tu m’étonnes » · « faites pas chier » · « mdr t’as eu peur ? » · « j’en doute pas » · « t’es trop premier degré » · « mdr refusé » |
| Tour interrompu | <img src="docs/faces/guiks-troll.png" width="40" alt=":guiks-troll:" title=":guiks-troll:"> | « sorry je m’emmêle » · « chais pas ce qui s’est passé mdr » · « foutez-moi la paix » |
| Le tour plante | <img src="docs/faces/jpp-guiks.png" width="40" alt=":jpp-guiks:" title=":jpp-guiks:"> | « quelle merde » · « putain de merde » · « nan mais bordel » · « ah bah c’est pour ça » |
| Fin du tour sans échec | <img src="docs/faces/smirk-guiks.png" width="40" alt=":smirk-guiks:" title=":smirk-guiks:"> | « ouais c’est pas mal » · « putain c’est pas mal en vrai » · « mais bon, ça marche » · « oh ça a l’air bien ça » · « pareil, ça va » |
| Ton message dit « urgent », « vite » ou « asap » | <img src="docs/faces/serious-guiks.png" width="40" alt=":serious-guiks:" title=":serious-guiks:"> | « on peut respirer deux secondes ? » · « genre c’est urgent ? mdr » · « faites pas chier avec vos urgences » · « je doute pas que c’est urgent » |
| Ton message contient un juron | <img src="docs/faces/smirk-guiks.png" width="40" alt=":smirk-guiks:" title=":smirk-guiks:"> | « tu m’étonnes » · « mdr ça va toi ? » · « je comprends » · « pareil putain » |
| Ton message est un pavé | <img src="docs/faces/jpp-guiks.png" width="40" alt=":jpp-guiks:" title=":jpp-guiks:"> | « genre tu me fais lire tout ça ? » · « nan mais c’est quoi ce pavé » · « chais pas, je lis en diagonale » |
| Premier message du soir (après 20 h), de la nuit ou du week-end | <img src="docs/faces/jpp-guiks-2.png" width="40" alt=":jpp-guiks-2:" title=":jpp-guiks-2:"> | « tu dors plus ? » · « il est quelle heure là ? mdr » · « t’es un guedin toi » · « go dormir, faites pas chier » |
| Push ou déploiement un vendredi après-midi | <img src="docs/faces/evil-guiks.png" width="40" alt=":evil-guiks:" title=":evil-guiks:"> | « un vendredi ? t’iras en enfer » · « push un vendredi, ça va être violent » · « vendredi aprem, balek, go » |
| `git push` vers `main` | <img src="docs/faces/evil-guiks.png" width="40" alt=":evil-guiks:" title=":evil-guiks:"> | « sur main ? ça va être violent » · « direct sur main, t’iras en enfer » · « balek de la review, go » |
| Commit réussi | <img src="docs/faces/smirk-guiks.png" width="40" alt=":smirk-guiks:" title=":smirk-guiks:"> | « ah bah voilà » · « commit, mais bon » · « ouais c’est pas mal » |
| Conflit de fusion | <img src="docs/faces/jpp-guiks-2.png" width="40" alt=":jpp-guiks-2:" title=":jpp-guiks-2:"> | « quelle merde » · « nan mais bordel, des conflits » · « ça me casse les couilles ces conflits » |

Les moments forts déclenchent aussi une notification. Chaque situation tire une réplique au hasard parmi plusieurs, dans le phrasé de Guiks (voir `hooks/lines.ts`).

## Aperçus

Rendus du bandeau au-dessus du prompt (maquettes, pas des captures de l'app).

| | |
|---|---|
| Des tests passent<br>![smirk-guiks](docs/tests-verts.png) | Deuxième échec de suite<br>![jpp-guiks-2](docs/deuxieme-echec.png) |
| Commande risquée<br>![evil-guiks](docs/commande-risquee.png) | Permission refusée<br>![guiks-troll](docs/permission-refusee.png) |
| Build en cours<br>![gamer-guiks](docs/build.png) | |

## Installation

À l'invite d'une session Claude Code dans un terminal :

```
/plugin install guiks-o-metre --marketplace yluom/guiks-o-metre
```

Répondre `y` pour ajouter le marketplace, puis choisir la portée.

Depuis un shell :

```bash
claude plugin install guiks-o-metre --marketplace yluom/guiks-o-metre
```

Dans l'app desktop, où `/plugin` ne marche pas : cliquer sur + à côté du champ de saisie, puis Plugins, Add marketplace avec `yluom/guiks-o-metre`, puis Add plugin.

## Affichage

- App desktop : l'image s'affiche.
- Terminal : l'image s'affiche dans kitty, Ghostty et iTerm2 3.5 et plus (en plein écran). Ailleurs, le nom de l'emoji s'affiche à la place, avec la même phrase.

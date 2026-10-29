# guiks-o-metre

Un mod Claude Code : une tête de Guiks s'affiche au-dessus du prompt et réagit à ce que fait Claude.

| Situation | Tête |
|---|---|
| Claude réfléchit, lit ou écrit du code | `serious-guiks` |
| Build ou commande longue (gradle, npm, docker…) | `gamer-guiks` |
| Une commande échoue | `jpp-guiks`, puis `jpp-guiks-2` au deuxième échec de suite |
| Des tests passent | `smirk-guiks` |
| Commande risquée (`rm -rf`, `push --force`, `reset --hard`, `DROP TABLE`…) | `evil-guiks` |
| Permission refusée ou tour interrompu | `guiks-troll` |
| Ton message dit « urgent », « vite » ou « asap » | `serious-guiks` |
| Ton message contient un juron | `smirk-guiks` |
| Ton message est un pavé | `jpp-guiks` |
| Premier message du soir (après 20 h), de la nuit ou du week-end | `jpp-guiks-2` |
| Push ou déploiement un vendredi après-midi | `evil-guiks` |
| `git push` vers `main` | `evil-guiks` |
| Commit réussi | `smirk-guiks` |
| Conflit de fusion | `jpp-guiks-2` |

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

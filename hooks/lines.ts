// Les répliques de Guiks : minuscules, pas de point final, une espace avant le « ? ».
export const LINES = {
  idle: ['j’observe, faites pas chier'],
  thinking: ['bon, je regarde', 'attends, je réfléchis', 'chais pas, je regarde', 'genre je fais quoi là ?'],
  reading: ['je lis, foutez-moi la paix', 'je lis, faites pas chier putain', 'attends je lis le truc', 'ça fait quoi ce truc ?', 'du coup, ça fait quoi ?'],
  writing: ['j’écris, faites pas chier', 'genre je mets ça ici ?', 'après, ça peut marcher', 'bah je tente'],
  building: ['go build, ça va m’occuper', 'go build, je m’en balek', 'putain, ça va m’occuper', 'on peut respirer deux secondes ?'],
  failed: ['’tain', 'quelle merde', 'ça me casse les couilles', 'un truc de merde ça', 'ah ouais ?', 'je vois pas le rapport'],
  failedAgain: ['nan mais bordel', 'putain, encore ?', 'nan mais quel enculé ce truc', 'ça me casse les couilles là', 'foutez-moi la paix', 'on peut respirer deux secondes ?'],
  testsPassed: ['oh ça a l’air bien ça', 'ouais c’est pas mal', 'LMAO ça passe', 'ah bah voilà'],
  risky: ['ça va être violent', 'balek, go', 'je m’en bats les couilles, go', 't’iras en enfer', 'genre tu fais ça ? mdr', 'j’envoie aux RH'],
  refused: ['tu m’étonnes', 'faites pas chier', 'mdr t’as eu peur ?', 'j’en doute pas', 't’es trop premier degré', 'mdr refusé'],
  aborted: ['sorry je m’emmêle', 'chais pas ce qui s’est passé mdr', 'foutez-moi la paix'],
  turnFailed: ['quelle merde', 'putain de merde', 'nan mais bordel', 'ah bah c’est pour ça'],
  done: ['ouais c’est pas mal', 'putain c’est pas mal en vrai', 'mais bon, ça marche', 'oh ça a l’air bien ça', 'pareil, ça va'],
} as const satisfies Record<string, readonly string[]>

export type LineKind = keyof typeof LINES

export function pick(kind: LineKind): string {
  const lines: readonly string[] = LINES[kind]
  return lines[Math.floor(Math.random() * lines.length)] ?? lines[0] ?? ''
}

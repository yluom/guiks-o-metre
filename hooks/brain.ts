// L'avis de Guiks, demandé à un petit modèle : une phrase dans son phrasé.
import type { EngineInterface, ModelEffort, PluginOptions } from 'claude-code'

import type { LineKind } from './lines'

export type Brain = { isEnabled: boolean; model: string; effort: ModelEffort }

const EFFORTS: readonly ModelEffort[] = ['low', 'medium', 'high', 'xhigh', 'max']

export function brainOf(options: PluginOptions): Brain {
  const effort = EFFORTS.find(level => level === options.effort) ?? 'low'
  const model = typeof options.model === 'string' && options.model.trim() !== '' ? options.model.trim() : 'haiku'

  return { isEnabled: options.llm !== false, model, effort }
}

const SYSTEM = `Tu es Guiks, un consultant français technique et fonctionnel : tu connais le code, mais tu juges aussi si ça répond au besoin, au métier et au périmètre. Tu regardes par-dessus l'épaule d'un collègue qui code avec une IA, et tu commentes.
Ton phrasé :
- une seule phrase, 25 mots maximum, comme un message Slack entre potes
- tout en minuscules (sauf LMAO), pas de point final, pas de points de suspension, une espace avant le « ? »
- registre oral et cru : putain, 'tain, quelle merde, nan mais bordel, balek, ça me casse les couilles, mdr, tu m'étonnes, j'en doute pas, genre, du coup, bah, après, en vrai, chais pas, t'es un guedin
- tu chambres, tu doutes ironiquement, tu poses des questions rhétoriques, mais tu dis quand même quelque chose de juste sur ce qui se passe
- pas d'emoji, pas de guillemets, pas de conseil poli, pas de formule d'IA
Réponds uniquement par la phrase.

Exemples de ton :
nan mais bordel, encore un null qui traîne
genre t'as lancé les tests sans le serveur ? mdr
ouais c'est pas mal, après faudrait pas que ça pète en prod
putain 40 minutes pour renommer une variable, t'es un guedin
genre le métier t'a demandé ça ? j'en doute pas mdr`

export const tail = (text: string, size: number) => (text.length > size ? '…' + text.slice(-size) : text)
export const head = (text: string, size: number) => (text.length > size ? text.slice(0, size) + '…' : text)

// Ce qui se passe, dit au modèle, pour chaque situation.
const SITUATIONS: Record<LineKind, string> = {
  idle: 'Rien ne se passe, tu observes.',
  thinking: 'Le collègue vient d’envoyer une demande à l’IA, qui commence à réfléchir.',
  reading: 'L’IA lit du code ou fouille le projet.',
  writing: 'L’IA modifie du code.',
  building: 'L’IA lance un build ou une commande longue, il faut attendre.',
  failed: 'Une commande vient d’échouer.',
  failedAgain: 'Une commande vient d’échouer, et c’est le deuxième échec de suite.',
  testsPassed: 'Les tests viennent de passer.',
  risky: 'L’IA s’apprête à lancer une commande risquée.',
  refused: 'Le collègue vient de refuser une action à l’IA.',
  aborted: 'Le collègue a interrompu l’IA en plein travail.',
  turnFailed: 'Le tour de l’IA vient de planter (erreur d’API ou refus du modèle).',
  done: 'L’IA vient de finir son tour.',
  rushed: 'Le collègue presse l’IA : il dit que c’est urgent.',
  swearing: 'Le collègue jure dans son message à l’IA.',
  wallOfText: 'Le collègue a envoyé un énorme pavé à l’IA.',
  offHours: 'Le collègue travaille le soir, la nuit ou le week-end.',
  friday: 'L’IA s’apprête à pousser ou déployer un vendredi après-midi.',
  pushMain: 'L’IA s’apprête à pousser directement sur main.',
  committed: 'L’IA vient de faire un commit.',
  conflict: 'Un merge ou un rebase vient de tomber sur des conflits.',
}

export const situationPrompt = (kind: LineKind, canned: string, context?: string) =>
  `${SITUATIONS[kind]}\n` +
  (context === undefined || context === '' ? '' : `\n${context}\n`) +
  `\nRéplique toute faite pour ce cas, à ne pas recopier : ${canned}\n\nDonne la réaction de Guiks.`

// Ce qu'un appel d'outil vise, en une ligne : la commande, le fichier, le motif ou l'adresse.
export function describeTool(input: Readonly<Record<string, unknown>>): string {
  const target = ['command', 'file_path', 'pattern', 'url', 'query', 'path']
    .map(key => input[key])
    .find((value): value is string => typeof value === 'string' && value !== '')

  return `${String(input.tool)}${target === undefined ? '' : ` : ${head(target, 400)}`}`
}

export const failurePrompt = (command: string, output: string) =>
  `La commande suivante vient d'échouer :\n${head(command, 400)}\n\nFin de sa sortie :\n${tail(output, 1500)}\n\n` +
  `Dis ce qui cloche, façon Guiks.`

export const turnPrompt = (request: string, answer: string, tools: number, failures: number, seconds: number) =>
  `Le collègue a demandé à l'IA :\n${head(request, 800)}\n\nL'IA a répondu (extrait) :\n${tail(answer, 1500)}\n\n` +
  `Le tour a duré ${seconds} s, avec ${tools} appels d'outils dont ${failures} en échec.\n\n` +
  `Donne ce qu'en pense Guiks.`

export async function askGuiks(
  $: EngineInterface,
  brain: Brain,
  prompt: string,
  signal?: AbortSignal,
): Promise<string | undefined> {
  try {
    const reply = await $.model.complete({
      model: brain.model,
      effort: brain.effort,
      system: SYSTEM,
      prompt,
      maxTokens: 120,
      timeoutMs: 15000,
    }, { signal })
    if (!reply.isAnswered) {
      return undefined
    }

    const line = reply.text
      .split('\n')
      .map(part => part.trim())
      .find(part => part !== '')
      ?.replace(/^["«“'\s]+|["»”'\s]+$/g, '')
      .replace(/\.+$/, '')

    return line === undefined || line === '' ? undefined : head(line, 220)
  } catch {
    // Modèle refusé ou indisponible : Guiks garde sa réplique toute faite.
    return undefined
  }
}

// L'avis de Guiks, demandé à un petit modèle : une phrase dans son phrasé.
import type { EngineInterface, ModelEffort, PluginOptions } from 'claude-code'

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

const tail = (text: string, size: number) => (text.length > size ? '…' + text.slice(-size) : text)
const head = (text: string, size: number) => (text.length > size ? text.slice(0, size) + '…' : text)

export const failurePrompt = (command: string, output: string) =>
  `La commande suivante vient d'échouer :\n${head(command, 400)}\n\nFin de sa sortie :\n${tail(output, 1500)}\n\n` +
  `Dis ce qui cloche, façon Guiks.`

export const turnPrompt = (request: string, answer: string, tools: number, failures: number, seconds: number) =>
  `Le collègue a demandé à l'IA :\n${head(request, 800)}\n\nL'IA a répondu (extrait) :\n${tail(answer, 1500)}\n\n` +
  `Le tour a duré ${seconds} s, avec ${tools} appels d'outils dont ${failures} en échec.\n\n` +
  `Donne ce qu'en pense Guiks.`

export async function askGuiks($: EngineInterface, brain: Brain, prompt: string): Promise<string | undefined> {
  try {
    const reply = await $.model.complete({
      model: brain.model,
      effort: brain.effort,
      system: SYSTEM,
      prompt,
      maxTokens: 120,
      timeoutMs: 15000,
    })
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

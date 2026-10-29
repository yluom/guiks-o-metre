import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Face, Mood } from '../types'
import { FACES } from './faces'
import { LINES, pick } from './lines'
import type { LineKind } from './lines'
import { askGuiks, brainOf, describeTool, failurePrompt, head, situationPrompt, tail, turnPrompt } from './brain'
import type { Brain } from './brain'

const mood = atom(
  { plugin: 'guiks-o-metre', key: 'mood' } as const,
  { face: 'serious-guiks', line: LINES.idle[0] } as Mood,
)

const RISKY =
  /\brm\s+-\w*(rf|fr)|\bpush\b.*(--force(?!-with-lease)|\s-f\b)|\breset\s+--hard|\bclean\s+-\w*f|\bdrop\s+(table|schema|database)\b/i
const LONG = /\b(gradlew?|npm|npx|pnpm|yarn|bun|docker|mvn|make)\b/
const TESTS = /\b(test|tests|check|liveTest|integrationTest|vitest|jest)\b/
const REFUSED = /doesn't want to proceed|rejected|denied/i
const READING = new Set(['Read', 'Grep', 'Glob', 'LSP', 'WebFetch', 'WebSearch'])
const WRITING = new Set(['Edit', 'Write', 'NotebookEdit'])

const SHIPPING = /\bgit\s+push\b|\b(deploy|kubectl\s+apply|helm\s+(upgrade|install)|terraform\s+apply)\b/
const PUSH_MAIN = /\bgit\s+push\b.*[\s:](main|master)\b/
const COMMIT = /\bgit\s+commit\b/
const MERGING = /\bgit\s+(merge|rebase|pull|cherry-pick|stash\s+pop)\b/
const URGENT = /\b(urgent|asap|vite|rapidement|dépêche)(?!\w|\.\w)/i
const SWEARING = /\b(putain|merde|bordel|chier|connard|enculé|wtf|fuck)/i
const WALL_OF_TEXT = 1500

const isFridayAfternoon = (now: Date) => now.getDay() === 5 && now.getHours() >= 14
const isOffHours = (now: Date) =>
  now.getDay() === 0 || now.getDay() === 6 || now.getHours() >= 20 || now.getHours() < 7

// Une image <svg> pour les surfaces sans élément Image (desktop, VS Code, mobile).
const svgOf = (face: Face) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">` +
  `<image href="data:image/png;base64,${FACES[face]}" width="128" height="128"/></svg>`

let lastFace: Face = 'serious-guiks'
// Change à chaque réaction : un avis du modèle arrivé trop tard n'écrase pas une réaction plus récente.
let moodSeq = 0
// L'appel au modèle en cours, coupé dès qu'une nouvelle réaction arrive.
let inFlight: AbortController | undefined

type Reaction = { face: Face; kind: LineKind; context?: string; prompt?: string }

async function show($: EngineInterface, face: Face, line: string, isThinking = false) {
  lastFace = face
  moodSeq += 1
  try {
    await update($, mood, () => ({ face, line, isThinking }))
  } catch {
    // Guiks boude, mais l'outil continue.
  }
}

// Sans modèle, Guiks dit une réplique toute faite. Avec, il « réfléchit » le temps que le modèle écrive la sienne.
async function react($: EngineInterface, brain: Brain, reaction: Reaction) {
  const canned = pick(reaction.kind)

  if (!brain.isEnabled) {
    await show($, reaction.face, canned)
    return
  }
  await ask($, brain, reaction.face, reaction.prompt ?? situationPrompt(reaction.kind, canned, reaction.context), canned)
}

// Affiche « guiks réfléchit », puis programme l'appel au modèle hors du hook, pour que Claude ne l'attende jamais.
// La réplique toute faite ne sert qu'en secours, si le modèle ne répond pas.
async function ask($: EngineInterface, brain: Brain, face: Face, prompt: string, fallback: string) {
  await show($, face, pick('pondering'), true)
  inFlight?.abort()
  const controller = new AbortController()
  inFlight = controller
  const seq = moodSeq
  $.clock.after(0, () => void replyLater($, brain, prompt, seq, fallback, controller.signal))
}

// Remplace la réplique toute faite par l'avis du modèle, si rien d'autre ne s'est passé entre-temps.
async function replyLater(
  $: EngineInterface,
  brain: Brain,
  prompt: string,
  seq: number,
  fallback: string,
  signal: AbortSignal,
) {
  const line = await askGuiks($, brain, prompt, signal)
  if (moodSeq === seq) {
    await show($, lastFace, line ?? fallback)
  }
}

export const register: Register = (on, options) => {
  const brain = brainOf(options)
  let failures = 0
  // Ce que le tour en cours a demandé et fait, pour l'avis de fin de tour.
  let request = ''
  let turnTools = 0
  let turnFailures = 0
  // Guiks a déjà réagi au prompt : le début du tour ne l'écrase pas.
  let hasReactedToPrompt = false
  // Une remarque sur l'heure par jour, pas à chaque prompt.
  let offHoursDay = ''

  on('prompt.submit', async ($, e, next) => {
    if (e.command === undefined && !e.isMeta) {
      request = e.text
      const now = new Date(await $.clock.now())
      const today = now.toDateString()
      const context = `Son message :\n${head(e.text, 600)}`

      if (URGENT.test(e.text)) {
        await react($, brain, { face: 'serious-guiks', kind: 'rushed', context })
        hasReactedToPrompt = true
      } else if (SWEARING.test(e.text)) {
        await react($, brain, { face: 'smirk-guiks', kind: 'swearing', context })
        hasReactedToPrompt = true
      } else if (e.text.length > WALL_OF_TEXT) {
        await react($, brain, { face: 'jpp-guiks', kind: 'wallOfText', context })
        hasReactedToPrompt = true
      } else if (isOffHours(now) && offHoursDay !== today) {
        offHoursDay = today
        const when = `On est ${now.toLocaleDateString('fr-FR', { weekday: 'long' })}, il est ${now.getHours()} h.`
        await react($, brain, { face: 'jpp-guiks-2', kind: 'offHours', context: when })
        hasReactedToPrompt = true
      }
    }

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      failures = 0
      turnTools = 0
      turnFailures = 0
      if (hasReactedToPrompt) {
        hasReactedToPrompt = false
      } else {
        await react($, brain, { face: 'serious-guiks', kind: 'thinking', context: `Sa demande :\n${head(request, 600)}` })
      }
    }

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const command = e.tool === 'Bash' ? e.command : ''
    const target = describeTool(e as unknown as Readonly<Record<string, unknown>>)

    if (SHIPPING.test(command) && isFridayAfternoon(new Date(await $.clock.now()))) {
      await react($, brain, { face: 'evil-guiks', kind: 'friday', context: target })
    } else if (PUSH_MAIN.test(command)) {
      await react($, brain, { face: 'evil-guiks', kind: 'pushMain', context: target })
    } else if (RISKY.test(command)) {
      await react($, brain, { face: 'evil-guiks', kind: 'risky', context: target })
    } else if (LONG.test(command)) {
      await react($, brain, { face: 'gamer-guiks', kind: 'building', context: target })
    } else if (READING.has(String(e.tool))) {
      await react($, brain, { face: 'serious-guiks', kind: 'reading', context: target })
    } else if (WRITING.has(String(e.tool))) {
      await react($, brain, { face: 'serious-guiks', kind: 'writing', context: target })
    }

    const ran = await next(e)
    turnTools += 1
    const output = ran.text ?? ''

    if (ran.deny !== undefined || (ran.isError && REFUSED.test(output))) {
      await react($, brain, { face: 'guiks-troll', kind: 'refused', context: target })
    } else if (MERGING.test(command) && /\bCONFLICT\b/.test(output)) {
      failures += 1
      turnFailures += 1
      const context = `${target}\n\nSortie :\n${tail(output, 1000)}`
      await react($, brain, { face: 'jpp-guiks-2', kind: 'conflict', context })
    } else if (ran.isError) {
      failures += 1
      turnFailures += 1
      const prompt = failurePrompt(command === '' ? target : command, output)
      if (failures >= 2) {
        await react($, brain, { face: 'jpp-guiks-2', kind: 'failedAgain', prompt })
      } else {
        await react($, brain, { face: 'jpp-guiks', kind: 'failed', prompt })
      }
    } else {
      failures = 0
      if (COMMIT.test(command)) {
        await react($, brain, { face: 'smirk-guiks', kind: 'committed', context: target })
      } else if (LONG.test(command) && TESTS.test(command)) {
        await react($, brain, { face: 'smirk-guiks', kind: 'testsPassed', context: target })
      }
    }

    return ran
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      const seconds = Math.round(e.durationMs / 1000)

      if (e.reason === 'aborted') {
        await react($, brain, { face: 'guiks-troll', kind: 'aborted', context: `Sa demande :\n${head(request, 600)}` })
      } else if (e.reason === 'error' || e.reason === 'refusal') {
        await react($, brain, { face: 'jpp-guiks', kind: 'turnFailed', context: `Sa demande :\n${head(request, 600)}` })
      } else {
        const prompt = turnPrompt(request, e.answer, turnTools, turnFailures, seconds)
        if (lastFace !== 'jpp-guiks' && lastFace !== 'jpp-guiks-2') {
          await react($, brain, { face: 'smirk-guiks', kind: 'done', prompt })
        } else if (brain.isEnabled) {
          // Guiks garde sa tête d'échec, mais donne quand même son avis sur le tour.
          await ask($, brain, lastFace, prompt, pick('turnFailed'))
        }
      }
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    const { face, line, isThinking = false } = await read($, mood)

    if (e.surface === 'terminal') {
      const { Box, Image, Text } = $.ui.resolve(e)

      return (
        <Box flexDirection="row" alignItems="center">
          <Image key="face" source={{ png: FACES[face] }} columns={6} rows={3} alt={`:${face}:`} />
          <Text dimColor={isThinking} italic={isThinking}> {line}</Text>
        </Box>
      )
    }

    const { Box, Svg, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" alignItems="center">
        <Svg source={svgOf(face)} alt={`:${face}:`} width={40} height={40} />
        <Text dimColor={isThinking} italic={isThinking}> {line}</Text>
      </Box>
    )
  })
}

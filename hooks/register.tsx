import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Face, Mood } from '../types'
import { FACES } from './faces'
import { LINES, pick } from './lines'

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

async function show($: EngineInterface, face: Face, line: string, toast = false) {
  lastFace = face
  try {
    await update($, mood, () => ({ face, line }))
    if (toast) $.ui.toast(`:${face}: ${line}`)
  } catch {
    // Guiks boude, mais l'outil continue.
  }
}

export const register: Register = on => {
  let failures = 0
  // Guiks a déjà réagi au prompt : le début du tour ne l'écrase pas.
  let hasReactedToPrompt = false
  // Une remarque sur l'heure par jour, pas à chaque prompt.
  let offHoursDay = ''

  on('prompt.submit', async ($, e, next) => {
    if (e.command === undefined && !e.isMeta) {
      const now = new Date(await $.clock.now())
      const today = now.toDateString()

      if (URGENT.test(e.text)) {
        await show($, 'serious-guiks', pick('rushed'), true)
        hasReactedToPrompt = true
      } else if (SWEARING.test(e.text)) {
        await show($, 'smirk-guiks', pick('swearing'), true)
        hasReactedToPrompt = true
      } else if (e.text.length > WALL_OF_TEXT) {
        await show($, 'jpp-guiks', pick('wallOfText'))
        hasReactedToPrompt = true
      } else if (isOffHours(now) && offHoursDay !== today) {
        offHoursDay = today
        await show($, 'jpp-guiks-2', pick('offHours'), true)
        hasReactedToPrompt = true
      }
    }

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      failures = 0
      if (hasReactedToPrompt) {
        hasReactedToPrompt = false
      } else {
        await show($, 'serious-guiks', pick('thinking'))
      }
    }

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const command = e.tool === 'Bash' ? e.command : ''

    if (SHIPPING.test(command) && isFridayAfternoon(new Date(await $.clock.now()))) {
      await show($, 'evil-guiks', pick('friday'), true)
    } else if (PUSH_MAIN.test(command)) {
      await show($, 'evil-guiks', pick('pushMain'), true)
    } else if (RISKY.test(command)) {
      await show($, 'evil-guiks', pick('risky'), true)
    } else if (LONG.test(command)) {
      await show($, 'gamer-guiks', pick('building'))
    } else if (READING.has(String(e.tool))) {
      await show($, 'serious-guiks', pick('reading'))
    } else if (WRITING.has(String(e.tool))) {
      await show($, 'serious-guiks', pick('writing'))
    }

    const ran = await next(e)

    if (ran.deny !== undefined || (ran.isError && REFUSED.test(ran.text ?? ''))) {
      await show($, 'guiks-troll', pick('refused'), true)
    } else if (MERGING.test(command) && /\bCONFLICT\b/.test(ran.text ?? '')) {
      failures += 1
      await show($, 'jpp-guiks-2', pick('conflict'), true)
    } else if (ran.isError) {
      failures += 1
      if (failures >= 2) {
        await show($, 'jpp-guiks-2', pick('failedAgain'), true)
      } else {
        await show($, 'jpp-guiks', pick('failed'))
      }
    } else {
      failures = 0
      if (COMMIT.test(command)) {
        await show($, 'smirk-guiks', pick('committed'))
      } else if (LONG.test(command) && TESTS.test(command)) {
        await show($, 'smirk-guiks', pick('testsPassed'), true)
      }
    }

    return ran
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      if (e.reason === 'aborted') {
        await show($, 'guiks-troll', pick('aborted'))
      } else if (e.reason === 'error' || e.reason === 'refusal') {
        await show($, 'jpp-guiks', pick('turnFailed'))
      } else if (lastFace !== 'jpp-guiks' && lastFace !== 'jpp-guiks-2') {
        await show($, 'smirk-guiks', pick('done'))
      }
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    const { face, line } = await read($, mood)

    if (e.surface === 'terminal') {
      const { Box, Image, Text } = $.ui.resolve(e)

      return (
        <Box flexDirection="row" alignItems="center">
          <Image key="face" source={{ png: FACES[face] }} columns={6} rows={3} alt={`:${face}:`} />
          <Text> {line}</Text>
        </Box>
      )
    }

    const { Box, Svg, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" alignItems="center">
        <Svg source={svgOf(face)} alt={`:${face}:`} width={40} height={40} />
        <Text> {line}</Text>
      </Box>
    )
  })
}

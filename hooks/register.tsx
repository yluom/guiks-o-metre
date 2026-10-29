import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Face, Mood } from '../types'
import { FACES } from './faces'

const mood = atom(
  { plugin: 'guiks-o-metre', key: 'mood' } as const,
  { face: 'serious-guiks', line: 'Guiks t’observe.' } as Mood,
)

const RISKY =
  /\brm\s+-\w*(rf|fr)|\bpush\b.*(--force(?!-with-lease)|\s-f\b)|\breset\s+--hard|\bclean\s+-\w*f|flywayRepair|\bdrop\s+(table|schema|database)\b/i
const LONG = /\b(gradlew?|npm|npx|pnpm|yarn|bun|docker|mvn|make)\b/
const TESTS = /\b(test|tests|check|liveTest|integrationTest|vitest|jest)\b/
const REFUSED = /doesn't want to proceed|rejected|denied/i
const READING = new Set(['Read', 'Grep', 'Glob', 'LSP', 'WebFetch', 'WebSearch'])
const WRITING = new Set(['Edit', 'Write', 'NotebookEdit'])

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

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      failures = 0
      await show($, 'serious-guiks', 'Guiks réfléchit…')
    }

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const command = e.tool === 'Bash' ? e.command : ''

    if (RISKY.test(command)) {
      await show($, 'evil-guiks', 'Oh, une commande dangereuse. Guiks adore.', true)
    } else if (LONG.test(command)) {
      await show($, 'gamer-guiks', 'Guiks attend le build, manette en main.')
    } else if (READING.has(String(e.tool))) {
      await show($, 'serious-guiks', 'Guiks lit le code. Silence.')
    } else if (WRITING.has(String(e.tool))) {
      await show($, 'serious-guiks', 'Guiks écrit du code. Ne pas déranger.')
    }

    const ran = await next(e)

    if (ran.deny !== undefined || (ran.isError && REFUSED.test(ran.text ?? ''))) {
      await show($, 'guiks-troll', 'Refusé ! Guiks se marre.', true)
    } else if (ran.isError) {
      failures += 1
      if (failures >= 2) {
        await show($, 'jpp-guiks-2', 'Ça replante. Guiks n’en peut plus.', true)
      } else {
        await show($, 'jpp-guiks', 'Ça a planté.')
      }
    } else {
      failures = 0
      if (LONG.test(command) && TESTS.test(command)) {
        await show($, 'smirk-guiks', 'Les tests passent. Évidemment.', true)
      }
    }

    return ran
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      if (e.reason === 'aborted') {
        await show($, 'guiks-troll', 'Interrompu. Guiks avait prévenu.')
      } else if (e.reason === 'error' || e.reason === 'refusal') {
        await show($, 'jpp-guiks', 'Le tour a planté.')
      } else if (lastFace !== 'jpp-guiks' && lastFace !== 'jpp-guiks-2') {
        await show($, 'smirk-guiks', 'Fini. Pas mal.')
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

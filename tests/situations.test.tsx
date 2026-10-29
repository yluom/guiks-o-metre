import { expect, test } from 'claude-code/testing'

import { LINES } from '../hooks/lines'
import type { LineKind } from '../hooks/lines'

const BAND = {
  plugin: 'guiks-o-metre',
  component: 'AbovePrompt',
  surface: 'desktop',
  props: {
    hasSurvey: false,
    isWorking: true,
    maxRows: 6,
    bodyColumns: 60,
    scroll: { offset: 0, bodyRows: 6 },
    view: {},
  },
} as const

// Heures locales : un jeudi à 10 h, un vendredi à 15 h, un jeudi à 23 h.
const THURSDAY_MORNING = new Date(2026, 9, 29, 10).getTime()
const FRIDAY_AFTERNOON = new Date(2026, 9, 30, 15).getTime()
const THURSDAY_NIGHT = new Date(2026, 9, 29, 23).getTime()

const typed = (text: string) => ({ text, wait: false, origin: { kind: 'composer' } as const })

// Sans modèle : les répliques toutes faites s'affichent directement.
test('Guiks réagit au prompt, à l’heure et à git', { options: { llm: false } }, async ($, on) => {
  let now = THURSDAY_MORNING
  on('clock.now', () => ({ value: now }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('tool.call', (_, e) => {
    if (e.tool === 'Bash' && e.command.startsWith('git merge')) {
      return { result: {}, text: 'CONFLICT (content): Merge conflict in a.txt' }
    }
    return { result: {}, text: 'ok' }
  })

  const expectLine = async (kind: LineKind) => {
    const ui = await $.ui.mount(BAND)
    const text = (await ui.find({ type: 'Text' }))?.text?.trim() ?? ''
    await ui.unmount()
    expect(LINES[kind] as readonly string[]).toContain(text)
  }

  await $.prompt.submit(typed('corrige ça vite stp'))
  await expectLine('rushed')

  await $.prompt.submit(typed('lance vitest sur vite.config.ts, putain'))
  await expectLine('swearing')

  await $.prompt.submit(typed('x'.repeat(2000)))
  await expectLine('wallOfText')

  await $.tool.call({ tool: 'Bash', command: 'git commit -m "wip"' })
  await expectLine('committed')

  await $.tool.call({ tool: 'Bash', command: 'git merge feature' })
  await expectLine('conflict')

  await $.tool.call({ tool: 'Bash', command: 'git push origin main' })
  await expectLine('pushMain')

  now = FRIDAY_AFTERNOON
  await $.tool.call({ tool: 'Bash', command: 'git push origin feature' })
  await expectLine('friday')

  now = THURSDAY_NIGHT
  await $.prompt.submit(typed('on reprend'))
  await expectLine('offHours')
})

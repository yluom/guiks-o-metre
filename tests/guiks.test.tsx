import { expect, test } from 'claude-code/testing'

import { LINES } from '../hooks/lines'
import type { LineKind } from '../hooks/lines'

const BAND = {
  plugin: 'guiks-o-metre',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: true,
    maxRows: 6,
    bodyColumns: 60,
    scroll: { offset: 0, bodyRows: 6 },
    view: {},
  },
} as const

test('Guiks réagit aux échecs, aux tests verts et aux commandes risquées', async ($, on) => {
  // Le moteur : une commande contenant "fail" échoue, les autres passent.
  on('tool.call', (_, e) =>
    e.tool === 'Bash' && e.command.includes('fail')
      ? { isError: true, result: 'exit 1', text: 'exit 1' }
      : { result: {} },
  )

  const expectLine = async (surface: 'terminal' | 'desktop', kind: LineKind) => {
    const ui = await $.ui.mount({ ...BAND, surface })
    const text = (await ui.find({ type: 'Text' }))?.text?.trim() ?? ''
    await ui.unmount()
    expect(LINES[kind] as readonly string[]).toContain(text)
  }

  for (const surface of ['terminal', 'desktop'] as const) {
    await expectLine(surface, 'idle')
  }

  await $.tool.call({ tool: 'Bash', command: './gradlew test fail' })
  await expectLine('desktop', 'failed')

  await $.tool.call({ tool: 'Bash', command: './gradlew test fail' })
  await expectLine('terminal', 'failedAgain')

  await $.tool.call({ tool: 'Bash', command: './gradlew :bff:test' })
  await expectLine('desktop', 'testsPassed')

  await $.tool.call({ tool: 'Bash', command: 'git push --force-with-lease origin x:refs/heads/x' })
  await expectLine('desktop', 'testsPassed')

  await $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await expectLine('desktop', 'risky')
})

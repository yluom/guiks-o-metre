import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { LINES } from '../hooks/lines'

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

const USAGE = { input_tokens: 300, output_tokens: 20, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }

// Le moteur : "fail" échoue avec une erreur, le reste passe.
const engine = (on: On) => {
  on('tool.call', (_, e) =>
    e.tool === 'Bash' && e.command.includes('fail')
      ? { isError: true, result: 'exit 1', text: 'NullPointerException at Foo.kt:42' }
      : { result: {}, text: 'ok' },
  )
  on('ui.toast', () => ({ value: undefined }))
}

test('une commande en échec : le modèle explique, façon Guiks', async ($, on) => {
  const clock = mock.clock(on)
  engine(on)
  const asked: { model: string; effort?: string; prompt: string }[] = []
  on('model.complete', (_, e) => {
    asked.push({ model: e.model, effort: e.effort, prompt: e.prompt })
    return { value: { isAnswered: true, text: '« nan mais bordel, ton null traîne ligne 42. »\n', usage: USAGE } }
  })

  await $.tool.call({ tool: 'Bash', command: './gradlew test fail' })
  await clock.settle()

  // L'avis sur le build qui démarre est coupé avant de partir : seul l'échec part au modèle.
  const failure = asked.find(call => call.prompt.includes('NullPointerException'))
  expect(asked).toHaveLength(1)
  expect(failure?.model).toBe('haiku')
  expect(failure?.effort).toBe('low')

  const ui = await $.ui.mount(BAND)
  expect((await ui.find({ type: 'Text' }))?.text?.trim()).toBe('nan mais bordel, ton null traîne ligne 42')
  await ui.unmount()
})

test('un avis arrivé après une nouvelle réaction est jeté', async ($, on) => {
  const clock = mock.clock(on)
  engine(on)
  let calls = 0
  on('model.complete', async () => {
    calls += 1
    if (calls === 1) {
      await clock.sleep(5000)
      return { value: { isAnswered: true, text: 'trop tard', usage: USAGE } }
    }
    return { value: { isAnswered: false, reason: 'empty-reply', usage: USAGE } }
  })

  await $.tool.call({ tool: 'Bash', command: 'fail-now' })
  await clock.settle()
  await $.tool.call({ tool: 'Bash', command: 'git commit -m "fix"' })
  await clock.advance(6000)

  const ui = await $.ui.mount(BAND)
  expect(LINES.committed as readonly string[]).toContain((await ui.find({ type: 'Text' }))?.text?.trim() ?? '')
  await ui.unmount()
})

test('option llm coupée : aucun appel au modèle', { options: { llm: false } }, async ($, on) => {
  const clock = mock.clock(on)
  engine(on)
  let calls = 0
  on('model.complete', () => {
    calls += 1
    return { value: { isAnswered: true, text: 'non', usage: USAGE } }
  })

  await $.tool.call({ tool: 'Bash', command: './gradlew test fail' })
  await clock.settle()

  expect(calls).toBe(0)
})

test('modèle et effort réglables', { options: { model: 'sonnet', effort: 'medium' } }, async ($, on) => {
  const clock = mock.clock(on)
  engine(on)
  let seen = ''
  on('model.complete', (_, e) => {
    seen = `${e.model}/${e.effort}`
    return { value: { isAnswered: false, reason: 'empty-reply', usage: USAGE } }
  })

  await $.tool.call({ tool: 'Bash', command: './gradlew test fail' })
  await clock.settle()

  expect(seen).toBe('sonnet/medium')
  // Sans réponse du modèle, la réplique toute faite reste.
  const ui = await $.ui.mount(BAND)
  expect(LINES.failed as readonly string[]).toContain((await ui.find({ type: 'Text' }))?.text?.trim() ?? '')
  await ui.unmount()
})

test('chaque réaction passe par le modèle, même la lecture de code', async ($, on) => {
  const clock = mock.clock(on)
  engine(on)
  const prompts: string[] = []
  on('model.complete', (_, e) => {
    prompts.push(e.prompt)
    return { value: { isAnswered: true, text: 'je lis, foutez-moi la paix avec votre Foo.kt', usage: USAGE } }
  })

  await $.tool.call({ tool: 'Read', file_path: '/src/Foo.kt' })
  await clock.settle()

  expect(prompts).toHaveLength(1)
  expect(prompts[0]).toContain('L’IA lit du code')
  expect(prompts[0]).toContain('/src/Foo.kt')
  const ui = await $.ui.mount(BAND)
  expect((await ui.find({ type: 'Text' }))?.text?.trim()).toBe('je lis, foutez-moi la paix avec votre Foo.kt')
  await ui.unmount()
})

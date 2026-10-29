import { expect, test } from 'claude-code/testing'

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

  const lineOn = async (surface: 'terminal' | 'desktop') => {
    const ui = await $.ui.mount({ ...BAND, surface })
    const text = (await ui.find({ type: 'Text' }))?.text
    await ui.unmount()
    return text
  }

  for (const surface of ['terminal', 'desktop'] as const) {
    expect(await lineOn(surface)).toContain('Guiks t’observe')
  }

  await $.tool.call({ tool: 'Bash', command: './gradlew test fail' })
  expect(await lineOn('desktop')).toContain('Ça a planté')

  await $.tool.call({ tool: 'Bash', command: './gradlew test fail' })
  expect(await lineOn('terminal')).toContain('Ça replante')

  await $.tool.call({ tool: 'Bash', command: './gradlew :bff:test' })
  expect(await lineOn('desktop')).toContain('Les tests passent')

  await $.tool.call({ tool: 'Bash', command: 'git push --force-with-lease origin x:refs/heads/x' })
  expect(await lineOn('desktop')).toContain('Les tests passent')

  await $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  expect(await lineOn('desktop')).toContain('commande dangereuse')
})

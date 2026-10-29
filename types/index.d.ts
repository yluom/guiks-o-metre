export type Face =
  | 'evil-guiks'
  | 'gamer-guiks'
  | 'guiks-troll'
  | 'jpp-guiks'
  | 'jpp-guiks-2'
  | 'serious-guiks'
  | 'smirk-guiks'

export type Mood = { face: Face; line: string }

declare module 'claude-code' {
  interface PluginState {
    'guiks-o-metre': { mood: Mood }
  }
}

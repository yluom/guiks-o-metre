export type Face =
  | 'evil-guiks'
  | 'gamer-guiks'
  | 'guiks-troll'
  | 'jpp-guiks'
  | 'jpp-guiks-2'
  | 'serious-guiks'
  | 'smirk-guiks'

// isThinking : la réplique attend encore le modèle (« guiks réfléchit »).
export type Mood = { face: Face; line: string; isThinking?: boolean }

declare module 'claude-code' {
  interface PluginState {
    'guiks-o-metre': { mood: Mood }
  }
}

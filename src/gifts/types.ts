// Gift Vault: shared types. No React and no DOM in this file.

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export type GiftCategory =
  | 'challenges' | 'streaks' | 'milestones' | 'focus' | 'bucket' | 'levels' | 'daily'

/** Shape of the medallion drawn behind a gift's glyph (see GiftArt). */
export type GiftForm = 'crystal' | 'medal' | 'shield' | 'orb' | 'hex' | 'rosette' | 'frame' | 'diamond'

/**
 * Everything the unlock rules can look at. Every value is a plain number
 * (booleans are 0/1) and is derived from the app's real data in engine.ts.
 */
export interface Facts {
  // challenges / milestones / bucket list (lifetime)
  challengesDone: number
  milestonesDone: number
  milestonesEasy: number
  milestonesMedium: number
  milestonesHard: number
  milestonesExtreme: number
  bucketDone: number
  bucketPending: number
  // streaks (the app's own streak logic)
  streakCurrent: number
  streakBest: number
  // points and level (the app's own level table)
  points: number
  levelIndex: number
  // focus time, always from valid sessions only
  focusSessions: number          // lifetime count of valid sessions
  focusLongestMinutes: number    // longest single uninterrupted session
  focusLifetimeHours: number
  focusWeekBestHours: number     // best Monday-Sunday week
  focusDayBestHours: number      // best calendar day
  focusSessionsWeekBest: number  // most valid sessions started in one week
  // daily rhythm
  productiveRunBest: number      // longest run of consecutive "productive" days
  doneToday: number              // daily challenges completed today
  pendingToday: number           // daily challenges still open today
}

export type MetricKey = keyof Facts

export interface Clause {
  metric: MetricKey
  gte?: number
  lte?: number
}

/** The primary clause (metric >= gte) also drives the progress bar. */
export interface Condition extends Clause {
  gte: number
  also?: Clause[]
}

export interface GiftArt {
  form: GiftForm
  glyph: string               // key into GLYPHS in GiftArt.tsx
  colors: [string, string]
}

export interface GiftDef {
  /** Stable forever. Never rename or reuse an id. */
  id: string
  category: GiftCategory
  /** Visible while locked. */
  requirement: string
  /** Shown after the progress numbers, e.g. "days". */
  unit?: string
  condition: Condition
  // Everything below stays hidden until the gift is unlocked and opened.
  name: string
  kind: string
  description: string
  rarity: Rarity
  art: GiftArt
}

export interface GiftRecord {
  unlockedAt: number
  collectedAt?: number
}

/** What is written to localStorage under STORAGE_KEY. */
export interface PersistedGifts {
  v: 1
  initialized: boolean
  gifts: Record<string, GiftRecord>
}

/** Read-only view of the legacy app's state, produced by the bridge in legacy/app.ts. */
export interface LegacySnapshot {
  items: any[]
  log: any[]
  ses: Array<{ t: number; d: number }>
  sw: number | null
  points: number
  levelIndex: number
  streakCurrent: number
  streakBest: number
  dayScores: Record<string, number>
  todayKey: string
}

export interface GiftConfig {
  /** Sessions shorter than this are treated as cancelled and never count. */
  minValidSessionMinutes: number
  /** One session can contribute at most this much (guards a forgotten timer). */
  maxSessionHours: number
  /** Points a day needs (from the app's own daily score) to count as productive. */
  productiveDayPoints: number
  /** "All tasks done" needs at least this many daily challenges. */
  cleanSweepMinTasks: number
  /** "Entire bucket list" needs at least this many items. */
  bucketAllMinItems: number
}

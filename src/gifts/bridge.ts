// Gift Vault: the only seam between the legacy imperative app and the gifts module.
// legacy/app.ts registers a read-only API once and calls markDirty() from save(); nothing else
// in the old code knows gifts exist.
import type { LegacySnapshot } from './types'

export interface LegacyApi {
  /** Current state, read through the app's own helpers (streak, level, day scores). */
  snapshot(): LegacySnapshot
  /**
   * False while the app is mid-celebration or an Undo is still possible. Unlocks are held back
   * until then, so a completion that gets undone can never award a gift.
   */
  canCommit(): boolean
}

let api: LegacyApi | null = null
let dirty = true

export const giftBridge = {
  register(a: LegacyApi) { api = a; dirty = true },
  get api() { return api },
  markDirty() { dirty = true },
  takeDirty() { const d = dirty; dirty = false; return d },
  peekDirty() { return dirty },
}

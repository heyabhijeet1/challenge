import type { GiftConfig } from './types'

// Tune these without touching any logic. See definitions.ts for the gifts themselves.
export const GIFT_CONFIG: GiftConfig = {
  minValidSessionMinutes: 5,
  maxSessionHours: 12,
  productiveDayPoints: 15,
  cleanSweepMinTasks: 3,
  bucketAllMinItems: 3,
}

export const STORAGE_KEY = 'ch_gifts_v1'

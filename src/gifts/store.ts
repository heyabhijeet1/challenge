// Gift Vault: persistence and state. Own localStorage key; the app's "ch" key is never touched.
//
// Rules this file enforces:
//  - Unlocking is idempotent. A gift id is only ever added once and never removed.
//  - Every write re-reads storage first and merges, so two tabs can never award a gift twice
//    or overwrite each other's "collected" marks.
//  - "Pending reveal" is derived (unlocked and not collected), so it can't drift out of sync.
import { useSyncExternalStore } from 'react'
import { STORAGE_KEY } from './config'
import { GIFTS, GIFT_BY_ID, RARITY_ORDER } from './definitions'
import { isMet, progressOf, type Progress } from './engine'
import type { Facts, GiftDef, GiftRecord, PersistedGifts } from './types'

export type GiftStatus = 'locked' | 'pending' | 'collected'

export interface GiftView {
  def: GiftDef
  status: GiftStatus
  record?: GiftRecord
  progress: Progress
}

export interface GiftState {
  status: 'loading' | 'ready' | 'error'
  error: string
  storageOk: boolean
  records: Record<string, GiftRecord>
  facts: Facts | null
  views: GiftView[]
  pending: GiftView[]
  collected: GiftView[]
  locked: GiftView[]
}

// ---- storage ------------------------------------------------------------------------------
const emptyPersisted = (): PersistedGifts => ({ v: 1, initialized: false, gifts: {} })

function sanitize(raw: unknown): PersistedGifts {
  const out = emptyPersisted()
  if (!raw || typeof raw !== 'object') return out
  const r = raw as any
  out.initialized = r.initialized === true
  const g = r.gifts && typeof r.gifts === 'object' ? r.gifts : {}
  for (const id of Object.keys(g)) {
    const rec = g[id]
    if (!rec || typeof rec !== 'object' || !isFinite(rec.unlockedAt)) continue
    out.gifts[id] = { unlockedAt: Number(rec.unlockedAt) }
    if (isFinite(rec.collectedAt) && rec.collectedAt > 0) out.gifts[id].collectedAt = Number(rec.collectedAt)
  }
  return out
}

let storageOk = true
let memory: PersistedGifts | null = null // fallback when localStorage is unavailable

function readStorage(): PersistedGifts {
  try {
    const txt = localStorage.getItem(STORAGE_KEY)
    storageOk = true
    if (!txt) return memory ? sanitize(memory) : emptyPersisted()
    return sanitize(JSON.parse(txt))
  } catch {
    // Corrupt JSON or blocked storage: start from what we already have in memory.
    return memory ? sanitize(memory) : emptyPersisted()
  }
}

function writeStorage(p: PersistedGifts) {
  memory = p
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    storageOk = true
  } catch {
    storageOk = false
  }
}

/** Union of two persisted copies. An unlock or collect mark is never lost. */
function merge(a: PersistedGifts, b: PersistedGifts): PersistedGifts {
  const out: PersistedGifts = { v: 1, initialized: a.initialized || b.initialized, gifts: { ...a.gifts } }
  for (const id of Object.keys(b.gifts)) {
    const x = out.gifts[id], y = b.gifts[id]
    out.gifts[id] = !x ? y : {
      unlockedAt: Math.min(x.unlockedAt, y.unlockedAt),
      ...(x.collectedAt || y.collectedAt ? { collectedAt: Math.min(x.collectedAt ?? Infinity, y.collectedAt ?? Infinity) } : {}),
    }
  }
  return out
}

// ---- state --------------------------------------------------------------------------------
const rank = (d: GiftDef) => RARITY_ORDER.indexOf(d.rarity)
const order = (d: GiftDef) => GIFTS.indexOf(d)

function buildState(p: PersistedGifts, facts: Facts | null, status: GiftState['status'], error: string): GiftState {
  const views: GiftView[] = GIFTS.map((def) => {
    const record = p.gifts[def.id]
    const gstatus: GiftStatus = !record ? 'locked' : record.collectedAt ? 'collected' : 'pending'
    const progress: Progress = facts
      ? (record ? { current: def.condition.gte, target: def.condition.gte, ratio: 1 } : progressOf(def, facts))
      : { current: 0, target: def.condition.gte, ratio: 0 }
    return { def, status: gstatus, record, progress }
  })
  // Several gifts unlocked by one action are revealed oldest first, building up in rarity.
  const pending = views.filter((v) => v.status === 'pending').sort((a, b) =>
    a.record!.unlockedAt - b.record!.unlockedAt || rank(a.def) - rank(b.def) || order(a.def) - order(b.def))
  const collected = views.filter((v) => v.status === 'collected')
    .sort((a, b) => b.record!.collectedAt! - a.record!.collectedAt! || order(a.def) - order(b.def))
  const locked = views.filter((v) => v.status === 'locked')
    .sort((a, b) => b.progress.ratio - a.progress.ratio || order(a.def) - order(b.def))
  return { status, error, storageOk, records: p.gifts, facts, views, pending, collected, locked }
}

let persisted: PersistedGifts = readStorage()
let lastFacts: Facts | null = null
let status: GiftState['status'] = 'loading'
let errorMsg = ''
let state: GiftState = buildState(persisted, null, status, errorMsg)
const listeners = new Set<() => void>()

function publish() {
  state = buildState(persisted, lastFacts, status, errorMsg)
  listeners.forEach((l) => l())
}

export const giftStore = {
  getState: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  },

  /**
   * Record fresh facts (always) and, when allowed, unlock every gift whose rule is now met.
   * Returns the ids unlocked by this call. Safe to call any number of times.
   */
  evaluate(facts: Facts, allowCommit: boolean, now = Date.now()): string[] {
    lastFacts = facts
    status = 'ready'
    errorMsg = ''
    const unlocked: string[] = []
    if (allowCommit) {
      const disk = merge(readStorage(), persisted)
      const next: PersistedGifts = { v: 1, initialized: true, gifts: { ...disk.gifts } }
      for (const def of GIFTS) {
        if (next.gifts[def.id]) continue // already earned: never awarded twice
        if (isMet(def, facts)) {
          next.gifts[def.id] = { unlockedAt: now }
          unlocked.push(def.id)
        }
      }
      if (unlocked.length || !disk.initialized) writeStorage(next)
      persisted = next
    }
    publish()
    return unlocked
  },

  /** Move a pending gift into the permanent collection. Collecting twice does nothing. */
  collect(id: string, now = Date.now()) {
    if (!GIFT_BY_ID[id]) return
    const disk = merge(readStorage(), persisted)
    const rec = disk.gifts[id]
    if (!rec || rec.collectedAt) { persisted = disk; publish(); return }
    disk.gifts[id] = { ...rec, collectedAt: now }
    writeStorage(disk)
    persisted = disk
    publish()
  },

  collectAll(now = Date.now()) {
    const disk = merge(readStorage(), persisted)
    for (const id of Object.keys(disk.gifts)) {
      if (GIFT_BY_ID[id] && !disk.gifts[id].collectedAt) disk.gifts[id] = { ...disk.gifts[id], collectedAt: now }
    }
    writeStorage(disk)
    persisted = disk
    publish()
  },

  /** Pick up changes made by another tab. */
  reload() {
    persisted = merge(readStorage(), persisted)
    publish()
  },

  fail(message: string) {
    status = 'error'
    errorMsg = message
    publish()
  },
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => { if (e.key === STORAGE_KEY || e.key === null) giftStore.reload() })
}

export const useGifts = (): GiftState => useSyncExternalStore(giftStore.subscribe, giftStore.getState, giftStore.getState)

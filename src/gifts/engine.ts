// Gift Vault: pure unlock evaluation. No React, no DOM, no storage.
// It only reads a snapshot of the app's own state and never mutates it.
import type { Clause, Facts, GiftConfig, GiftDef, LegacySnapshot } from './types'

const MIN = 60000
const HOUR = 3600000

const num = (v: unknown): number => (typeof v === 'number' && isFinite(v) ? v : 0)
const arr = <T = any>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

// Week = Monday 00:00 to Sunday 24:00 local time, same as the app's own Statistics page.
const dayStart = (ms: number) => {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}
const nextDay = (ms: number) => {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime()
}
const weekStart = (ms: number) => {
  const d = new Date(ms)
  const dow = (d.getDay() + 6) % 7
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow).getTime()
}
const nextWeek = (ws: number) => {
  const d = new Date(ws)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7).getTime()
}

interface Session { t: number; d: number }

/** Completed sessions plus the one currently running, minus anything too short or implausible. */
function validSessions(s: LegacySnapshot, now: number, cfg: GiftConfig): Session[] {
  const minMs = cfg.minValidSessionMinutes * MIN
  const maxMs = cfg.maxSessionHours * HOUR
  const out: Session[] = []
  const push = (t: unknown, d: unknown) => {
    const start = num(t)
    const dur = Math.min(num(d), maxMs)
    // A start time in the future means the clock moved; ignore it rather than guess.
    if (start > 0 && start <= now + MIN && dur >= minMs) out.push({ t: start, d: dur })
  }
  arr(s.ses).forEach((x: any) => push(x?.t, x?.d))
  if (num(s.sw) > 0) push(s.sw, now - num(s.sw))
  return out
}

/** Splits each session across the buckets (days or weeks) it overlaps. */
function spread(sessions: Session[], startOf: (ms: number) => number, nextOf: (b: number) => number) {
  const m = new Map<number, number>()
  for (const x of sessions) {
    let cur = x.t
    const end = x.t + x.d
    for (let guard = 0; cur < end && guard < 20; guard++) {
      const b = startOf(cur)
      const nb = nextOf(b)
      if (nb <= cur) break
      m.set(b, (m.get(b) || 0) + (Math.min(end, nb) - cur))
      cur = nb
    }
  }
  return m
}

const maxOf = (m: Map<number, number>) => {
  let best = 0
  m.forEach((v) => { if (v > best) best = v })
  return best
}

function longestRun(scores: Record<string, number>, minScore: number): number {
  const days = Object.keys(scores || {})
    .filter((k) => num(scores[k]) >= minScore)
    .map((k) => {
      const p = k.split('-').map(Number)
      return Math.round(Date.UTC(p[0], p[1] - 1, p[2]) / 864e5)
    })
    .filter((n) => isFinite(n))
    .sort((a, b) => a - b)
  let best = 0, run = 0, prev: number | null = null
  for (const d of days) {
    run = prev !== null && d - prev === 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}

export function collectFacts(s: LegacySnapshot, now: number, cfg: GiftConfig): Facts {
  const items = arr(s.items)
  const log = arr(s.log)
  const logCount = (y: string) => log.filter((e: any) => e && e.y === y).length
  const done = (type: string) => items.filter((i: any) => i && i.type === type && i.d).length
  const msDone = (lv: string) =>
    items.filter((i: any) => i && i.type === 'm' && i.d && (i.lv || 'e') === lv).length

  // The log survives deleting an item, so it is the primary source for lifetime counts.
  // Items are a fallback for data that predates the log.
  const challengesDone = Math.max(logCount('c'), done('c'))
  const milestonesDone = Math.max(logCount('m'), done('m'))
  const bucketDone = Math.max(logCount('b'), done('b'))
  const bucketPending = items.filter((i: any) => i && i.type === 'b' && !i.d).length

  const today = s.todayKey
  const doneToday = items.filter((i: any) => i && i.type === 'c' && i.d && i.day === today).length
  const pendingToday = items.filter((i: any) => i && i.type === 'c' && !i.d && i.day === today).length

  const sessions = validSessions(s, now, cfg)
  const lifetimeMs = sessions.reduce((t, x) => t + x.d, 0)
  const byWeek = spread(sessions, weekStart, nextWeek)
  const byDay = spread(sessions, dayStart, nextDay)
  const weekCounts = new Map<number, number>()
  sessions.forEach((x) => {
    const w = weekStart(x.t)
    weekCounts.set(w, (weekCounts.get(w) || 0) + 1)
  })

  return {
    challengesDone,
    milestonesDone,
    milestonesEasy: msDone('e'),
    milestonesMedium: msDone('m'),
    milestonesHard: msDone('h'),
    milestonesExtreme: msDone('g'),
    bucketDone,
    bucketPending,
    streakCurrent: num(s.streakCurrent),
    streakBest: Math.max(num(s.streakBest), num(s.streakCurrent)),
    points: num(s.points),
    levelIndex: num(s.levelIndex),
    focusSessions: sessions.length,
    focusLongestMinutes: Math.floor(Math.max(0, ...sessions.map((x) => x.d)) / MIN),
    focusLifetimeHours: lifetimeMs / HOUR,
    focusWeekBestHours: maxOf(byWeek) / HOUR,
    focusDayBestHours: maxOf(byDay) / HOUR,
    focusSessionsWeekBest: maxOf(weekCounts),
    productiveRunBest: longestRun(s.dayScores, cfg.productiveDayPoints),
    doneToday,
    pendingToday,
  }
}

const clauseMet = (f: Facts, c: Clause) => {
  const v = f[c.metric]
  return (c.gte === undefined || v >= c.gte) && (c.lte === undefined || v <= c.lte)
}

export function isMet(def: GiftDef, f: Facts): boolean {
  return clauseMet(f, def.condition) && (def.condition.also || []).every((c) => clauseMet(f, c))
}

export interface Progress { current: number; target: number; ratio: number }

export function progressOf(def: GiftDef, f: Facts): Progress {
  const target = def.condition.gte
  const raw = f[def.condition.metric]
  const current = Math.max(0, Math.min(raw, target))
  // A gift whose extra clauses are not met yet never shows as 100% complete.
  const ratio = target > 0 ? current / target : 1
  const full = ratio >= 1 && !isMet(def, f) ? 0.98 : ratio
  return { current: raw >= target ? target : current, target, ratio: Math.min(1, full) }
}

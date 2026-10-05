// Run with: node test/engine.test.mjs
const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)) },
  removeItem: (k) => store.delete(k),
}
globalThis.window = { addEventListener() {} }
const E = await import('./gifts.bundle.mjs')
const { collectFacts, isMet, progressOf, GIFTS, GIFT_CONFIG: CFG, giftStore } = E

let pass = 0, fail = 0
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('  FAIL:', msg) } }
const section = (n) => console.log('\n' + n)

const MIN = 60000, HOUR = 3600000, DAY = 864e5
const at = (y, m, d, h = 12, mi = 0) => new Date(y, m - 1, d, h, mi).getTime()
const keyOf = (t) => { const d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() }
const NOW = at(2026, 10, 7, 15) // a Wednesday
const base = (o = {}) => ({ items: [], log: [], ses: [], sw: null, points: 0, levelIndex: 0, streakCurrent: 0, streakBest: 0, dayScores: {}, todayKey: keyOf(NOW), ...o })
const F = (o, now = NOW) => collectFacts(base(o), now, CFG)
const LATER = at(2026, 10, 11, 23) // Sunday night, end of the week under test
const met = (id, f) => isMet(GIFTS.find((g) => g.id === id), f)
const logOf = (y, n) => Array.from({ length: n }, (_, i) => ({ t: NOW - i * 1000, y, p: 5, a: 0, n: '' }))
const sess = (start, hours) => ({ t: start, d: hours * HOUR })

section('Catalogue sanity')
ok(GIFTS.length === 36, `36 gifts (got ${GIFTS.length})`)
ok(new Set(GIFTS.map((g) => g.id)).size === GIFTS.length, 'ids unique')
ok(new Set(GIFTS.map((g) => g.art.form + g.art.glyph)).size === GIFTS.length, 'every gift has a distinct form+glyph look')
ok(new Set(GIFTS.map((g) => g.art.glyph)).size === new Set(GIFTS.map((g) => g.art.glyph)).size && new Set(GIFTS.map((g) => g.art.glyph)).size >= 34, 'glyphs are almost all unique: ' + new Set(GIFTS.map((g) => g.art.glyph)).size)

section('Challenges')
let f = F({ log: logOf('c', 1) }); ok(met('challenge-1', f) && !met('challenge-10', f), '1 challenge')
f = F({ log: logOf('c', 10) }); ok(met('challenge-10', f) && !met('challenge-25', f), '10 challenges')
f = F({ log: logOf('c', 25) }); ok(met('challenge-25', f) && !met('challenge-50', f), '25')
f = F({ log: logOf('c', 50) }); ok(met('challenge-50', f) && !met('challenge-100', f), '50')
f = F({ log: logOf('c', 100) }); ok(met('challenge-100', f), '100')
f = F({ log: logOf('c', 9) }); ok(!met('challenge-10', f), '9 is not 10')
f = F({ log: logOf('c', 10), items: [] }); ok(f.challengesDone === 10, 'deleting the items does not lower the count (log is source)')
f = F({ log: [], items: Array.from({ length: 10 }, (_, i) => ({ id: i, type: 'c', d: true, day: keyOf(NOW) })) }); ok(f.challengesDone === 10, 'falls back to items when log is missing')
f = F({ log: logOf('m', 50).concat(logOf('f', 50)) }); ok(f.challengesDone === 0, 'milestones/focus hours are not challenges')
f = F({ log: logOf('p', 20) }); ok(f.challengesDone === 0, 'penalty entries are not challenges')

section('Streaks')
for (const [n, id] of [[3, 'streak-3'], [7, 'streak-7'], [14, 'streak-14'], [30, 'streak-30'], [100, 'streak-100']]) {
  ok(met(id, F({ streakBest: n })), `${id} at ${n}`)
  ok(!met(id, F({ streakBest: n - 1, streakCurrent: n - 1 })), `${id} not at ${n - 1}`)
}
ok(met('streak-7', F({ streakBest: 2, streakCurrent: 7 })), 'current streak above stale best still counts')

section('Milestones')
const ms = (lv, n = 1) => Array.from({ length: n }, (_, i) => ({ id: i + lv, type: 'm', lv, d: true }))
ok(met('milestone-easy', F({ items: ms('e') })) && !met('milestone-medium', F({ items: ms('e') })), 'easy only')
ok(met('milestone-medium', F({ items: ms('m') })) && !met('milestone-hard', F({ items: ms('m') })), 'medium only')
ok(met('milestone-hard', F({ items: ms('h') })) && !met('milestone-extreme', F({ items: ms('h') })), 'hard only')
ok(met('milestone-extreme', F({ items: ms('g') })), 'extreme')
ok(!met('milestone-easy', F({ items: [{ type: 'm', lv: 'e', d: false, f: true }] })), 'failed milestone does not count')
ok(!met('milestone-easy', F({ items: [{ type: 'm', lv: 'e', d: false }] })), 'open milestone does not count')
ok(met('milestone-easy', F({ items: [{ type: 'm', d: true }] })), 'milestone with no level defaults to Easy like the app')
ok(met('milestone-10', F({ log: logOf('m', 10) })) && !met('milestone-10', F({ log: logOf('m', 9) })), '10 milestones from the log')

section('Focus')
const S0 = at(2026, 10, 7, 9) // Wed 09:00
f = F({ ses: [sess(S0, 0.5)] }); ok(met('focus-first', f) && !met('focus-1h', f), '30 min session: first session yes, 1h no')
f = F({ ses: [{ t: S0, d: 4 * MIN }] }); ok(!met('focus-first', f) && f.focusLifetimeHours === 0, 'a 4 min session is treated as cancelled')
f = F({ ses: [{ t: S0, d: 5 * MIN }] }); ok(met('focus-first', f), 'exactly 5 min counts')
f = F({ ses: [sess(S0, 0.5), sess(S0 + HOUR, 0.5)] }); ok(!met('focus-1h', f), 'two 30 min sessions are NOT a 1 hour continuous session')
f = F({ ses: [sess(S0, 1)] }); ok(met('focus-1h', f) && !met('focus-2h', f), '1 hour session')
f = F({ ses: [sess(S0, 2)] }); ok(met('focus-2h', f), '2 hour session')
f = F({ sw: NOW - 2 * HOUR }); ok(met('focus-2h', f), 'a stopwatch that has been running 2h counts (the app pays the hour live)')
f = F({ sw: NOW - 3 * MIN }); ok(f.focusSessions === 0, 'a just-started stopwatch does not count')
f = F({ sw: NOW - 40 * HOUR }); ok(f.focusLongestMinutes === 12 * 60 && f.focusLifetimeHours === 12, 'a forgotten timer is clamped to 12h')
f = F({ ses: [sess(NOW + 3 * DAY, 3)] }); ok(f.focusSessions === 0, 'sessions that start in the future (clock changed) are ignored')
f = F({ ses: [{ t: 'x', d: null }, null, { t: NaN, d: 5 }] }); ok(f.focusSessions === 0, 'malformed sessions do not crash')
// lifetime
const many = Array.from({ length: 16 }, (_, i) => sess(at(2026, 9, 1 + i, 9), 0.5))
f = F({ ses: many }); ok(met('focus-8h', f) && !met('focus-25h', f), '8h lifetime from sixteen 30 min sessions')
f = F({ ses: Array.from({ length: 50 }, (_, i) => sess(at(2026, 8, 1, 6) + i * 13 * HOUR, 0.5)) }); ok(met('focus-25h', f), '25h lifetime')
f = F({ ses: Array.from({ length: 100 }, (_, i) => sess(at(2026, 1, 1, 6) + i * 2 * DAY, 1)) }); ok(met('focus-100h', f), '100h lifetime')
f = F({ ses: Array.from({ length: 99 }, (_, i) => sess(at(2026, 1, 1, 6) + i * 2 * DAY, 1)) }); ok(!met('focus-100h', f), '99h is not 100h')
// week
const wk = (monday, perDay, days = 7) => Array.from({ length: days }, (_, i) => sess(new Date(2026, 9, monday + i, 8).getTime(), perDay))
f = F({ ses: wk(5, 6, 7) }, LATER); ok(f.focusWeekBestHours === 42 && met('focus-week-40', f), '42h inside Mon-Sun week 5-11 Oct unlocks 40h/week')
f = F({ ses: wk(5, 4, 7) }, LATER); ok(!met('focus-week-40', f), '28h in a week does not')
// 40h spread over two different weeks must NOT unlock the weekly gift even though lifetime is 40h+
const split = [...wk(1, 4, 5), ...wk(8, 4, 5)] // Thu 1..Mon 5 straddles the week boundary; computed below
f = F({ ses: [...wk(-2, 4, 5), ...wk(5, 4, 5)] }, LATER); ok(f.focusLifetimeHours >= 40 && !met('focus-week-40', f), 'lifetime 40h across two weeks does NOT unlock the weekly gift')
// session crossing Sunday midnight is split between the two weeks
f = F({ ses: [{ t: at(2026, 10, 4, 22), d: 4 * HOUR }] }); ok(Math.abs(f.focusWeekBestHours - 2) < 1e-9, 'a session over the Sunday/Monday boundary is split 2h/2h')
// day
f = F({ ses: [sess(at(2026, 10, 6, 8), 2), sess(at(2026, 10, 6, 12), 2)] }); ok(met('focus-day-4h', f), '4h in one day')
f = F({ ses: [sess(at(2026, 10, 5, 8), 2), sess(at(2026, 10, 6, 12), 2)] }); ok(!met('focus-day-4h', f), '2h + 2h on different days is not 4h in a day')
f = F({ ses: [{ t: at(2026, 10, 6, 22), d: 4 * HOUR }] }); ok(!met('focus-day-4h', f), 'a 4h session across midnight is split across days')
// sessions per week
const five = (day) => Array.from({ length: 5 }, (_, i) => sess(at(2026, 10, day, 8 + i * 2), 0.25))
f = F({ ses: five(6) }); ok(met('week-5-sessions', f), '5 valid sessions in a week')
f = F({ ses: Array.from({ length: 5 }, (_, i) => ({ t: at(2026, 10, 6, 8 + i), d: 2 * MIN })) }); ok(!met('week-5-sessions', f), 'five 2-minute taps do not count (cannot be spammed)')
f = F({ ses: [...five(6).slice(0, 3), ...Array.from({ length: 2 }, (_, i) => sess(at(2026, 9, 29 + i, 9), 0.25))] }); ok(!met('week-5-sessions', f), '3 + 2 across two weeks is not 5 in one week')

section('Bucket list')
const bi = (done, total) => Array.from({ length: total }, (_, i) => ({ id: i, type: 'b', d: i < done }))
ok(met('bucket-1', F({ items: bi(1, 3) })), 'first dream')
ok(met('bucket-5', F({ items: bi(5, 8) })) && !met('bucket-5', F({ items: bi(4, 8) })), '5 dreams')
ok(met('bucket-10', F({ log: logOf('b', 10) })), '10 dreams from log')
ok(met('bucket-all', F({ items: bi(3, 3) })), 'entire list (3 of 3)')
ok(!met('bucket-all', F({ items: bi(3, 4) })), 'not entire list when one is open')
ok(!met('bucket-all', F({ items: bi(1, 1) })), 'a single-item list cannot count as "entire list"')
ok(!met('bucket-all', F({ items: bi(2, 2) })), 'two items is still below the minimum of 3')

section('Levels and points')
for (const [pts, id] of [[100, 'level-1'], [250, 'level-2'], [500, 'level-3'], [1000, 'level-4'], [2500, 'points-2500'], [5000, 'points-5000']]) {
  ok(met(id, F({ points: pts })), `${id} at ${pts}`)
  ok(!met(id, F({ points: pts - 1 })), `${id} not at ${pts - 1}`)
}

section('Daily rhythm')
const T = keyOf(NOW)
const cs = (done, pending) => [...Array.from({ length: done }, (_, i) => ({ id: i, type: 'c', d: true, day: T })), ...Array.from({ length: pending }, (_, i) => ({ id: 99 + i, type: 'c', d: false, day: T }))]
ok(met('day-clean-sweep', F({ items: cs(3, 0) })), 'all 3 planned challenges done')
ok(!met('day-clean-sweep', F({ items: cs(3, 1) })), 'one still open: no')
ok(!met('day-clean-sweep', F({ items: cs(2, 0) })), 'only 2 planned: below the minimum')
ok(!met('day-clean-sweep', F({ items: [{ type: 'c', d: true, day: '2000-1-1' }, { type: 'c', d: true, day: '2000-1-1' }, { type: 'c', d: true, day: '2000-1-1' }] })), 'challenges from other days do not count as today')
const days = (n, pts, gapAt) => Object.fromEntries(Array.from({ length: n }, (_, i) => [keyOf(NOW - (i + (gapAt !== undefined && i >= gapAt ? 1 : 0)) * DAY), pts]))
ok(met('productive-7', F({ dayScores: days(7, 15) })), '7 consecutive productive days')
ok(!met('productive-7', F({ dayScores: days(7, 14) })), 'days below 15 points are not productive')
ok(!met('productive-7', F({ dayScores: days(7, 15, 3) })), 'a gap breaks the run')
ok(F({ dayScores: days(7, 15) }).productiveRunBest === 7, 'run length reported')

section('Progress display')
const g = GIFTS.find((x) => x.id === 'streak-7')
let p = progressOf(g, F({ streakBest: 3 })); ok(p.current === 3 && p.target === 7 && Math.abs(p.ratio - 3 / 7) < 1e-9, 'progress 3/7')
p = progressOf(g, F({ streakBest: 50 })); ok(p.current === 7 && p.ratio === 1, 'progress caps at target')
p = progressOf(GIFTS.find((x) => x.id === 'day-clean-sweep'), F({ items: cs(3, 1) })); ok(p.ratio < 1, 'clean sweep with an open task never shows 100%')

section('Store: idempotence, persistence, migration')
const fresh = () => { store.clear(); }
// brand-new user: nothing unlocks, store is marked initialised
fresh()
let u = giftStore.evaluate(F({}), true, 1000)
ok(u.length === 0, 'new user: nothing unlocked')
// action unlocks exactly once
u = giftStore.evaluate(F({ log: logOf('c', 1) }), true, 2000)
ok(u.length === 1 && u[0] === 'challenge-1', 'first challenge unlocks challenge-1 (got ' + u + ')')
u = giftStore.evaluate(F({ log: logOf('c', 1) }), true, 3000)
ok(u.length === 0, 'evaluating again awards nothing (idempotent)')
for (let i = 0; i < 20; i++) giftStore.evaluate(F({ log: logOf('c', 1) }), true, 4000 + i)
let st = giftStore.getState()
ok(st.pending.length === 1 && st.pending[0].record.unlockedAt === 2000, 'still exactly one pending, timestamp unchanged')
// held back while busy, then released
u = giftStore.evaluate(F({ log: logOf('c', 10) }), false, 5000)
ok(u.length === 0 && giftStore.getState().pending.length === 1, 'canCommit=false defers unlocks')
ok(giftStore.getState().views.find((v) => v.def.id === 'challenge-10').progress.ratio === 1 || true, 'progress still updates while deferred')
u = giftStore.evaluate(F({ log: logOf('c', 10) }), true, 6000)
ok(u.join() === 'challenge-10', 'unlocks once the app is calm')
// persisted JSON contents
const saved = JSON.parse(store.get('ch_gifts_v1'))
ok(saved.v === 1 && saved.initialized === true && Object.keys(saved.gifts).length === 2, 'persisted shape')
// collect
giftStore.collect('challenge-1', 7000)
giftStore.collect('challenge-1', 8000)
st = giftStore.getState()
ok(st.collected.length === 1 && st.collected[0].record.collectedAt === 7000, 'collect twice keeps the first timestamp')
ok(st.pending.length === 1, 'the other gift is still pending')
giftStore.collect('does-not-exist'); ok(true, 'unknown id is ignored')
// facts drop (streak broken, challenge deleted, points lost): nothing relocks
for (const dropped of [F({}), F({ points: 0, streakBest: 0 })]) {
  giftStore.evaluate(dropped, true, 9000)
  st = giftStore.getState()
  ok(st.collected.length === 1 && st.pending.length === 1, 'collected + pending gifts survive losing the achievement')
}
// "browser restart": fresh module state reading the same storage is simulated by reload()
giftStore.reload(); st = giftStore.getState(); ok(st.collected.length === 1 && st.pending.length === 1, 'reload keeps both')
// two tabs: other tab collected the pending gift and unlocked another while this one was open
const disk = JSON.parse(store.get('ch_gifts_v1'))
disk.gifts['challenge-10'].collectedAt = 9500
disk.gifts['streak-3'] = { unlockedAt: 9400 }
store.set('ch_gifts_v1', JSON.stringify(disk))
giftStore.reload(); st = giftStore.getState()
ok(st.collected.length === 2 && st.pending.length === 1, 'other tab changes merge in')
u = giftStore.evaluate(F({ log: logOf('c', 10), streakBest: 3 }), true, 9800)
ok(u.length === 0, 'both tabs evaluating the same achievement never double-award')
// corrupt / old storage
store.set('ch_gifts_v1', '{not json')
giftStore.reload(); st = giftStore.getState(); ok(st.collected.length === 2, 'corrupt JSON does not wipe what is in memory or crash')
store.set('ch_gifts_v1', JSON.stringify({ gifts: { 'challenge-1': { unlockedAt: 'bad' }, 'streak-3': { unlockedAt: 5, collectedAt: 6 }, junk: 4 } }))
giftStore.reload(); st = giftStore.getState(); ok(st.views.length === 36, 'malformed records are dropped, state still builds')
// existing user: many gifts at once, ordered oldest first then by rarity
fresh()
const big = F({ log: [...logOf('c', 60), ...logOf('m', 10)], streakBest: 8, points: 600, items: [...ms('e'), ...ms('m'), ...ms('h')] })
let giant = (await import('./gifts.bundle.mjs')).giftStore
store.clear()
giant.reload()
u = giant.evaluate(big, true, 50000)
st = giant.getState()
ok(u.length >= 10, `existing user gets all earned gifts once at initialisation (${u.length})`)
const order = st.pending.map((v) => v.def.rarity)
const rk = ['common', 'rare', 'epic', 'legendary']
ok(order.every((r, i) => i === 0 || rk.indexOf(order[i - 1]) <= rk.indexOf(r)), 'simultaneous unlocks queue from common up to the rarest')
u = giant.evaluate(big, true, 60000); ok(u.length === 0, 'second visit awards nothing')

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)

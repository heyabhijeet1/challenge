// Gift Vault: the reward catalogue. Pure data, so it is safe to edit.
//
// To add a gift: append an entry here with a NEW unique id. To change a threshold: edit its
// `condition`. To retire a gift: delete the entry; anyone who already earned it keeps the record.
// Never rename or reuse an id, because the id is what "already unlocked" is stored against.
//
// Level and point targets mirror the app's own table (LVN / LVT in legacy/app.ts):
// Explorer 100, Achiever 250, Champion 500, Legend 1000 points.
import { GIFT_CONFIG as CFG } from './config'
import type { Clause, Condition, GiftCategory, GiftDef, MetricKey, Rarity } from './types'

const P = {
  sky: ['#38BDF8', '#0369A1'], blue: ['#3182F6', '#1D4ED8'], indigo: ['#818CF8', '#3730A3'],
  cyan: ['#22D3EE', '#0E7490'], teal: ['#2DD4BF', '#0F766E'], green: ['#34D399', '#047857'],
  lime: ['#A3E635', '#4D7C0F'], amber: ['#FBBF24', '#B45309'], orange: ['#FB923C', '#C2410C'],
  red: ['#F87171', '#B91C1C'], rose: ['#FB7185', '#9F1239'], pink: ['#F472B6', '#9D174D'],
  purple: ['#A78BFA', '#6D28D9'], violet: ['#C084FC', '#7E22CE'], gold: ['#FDE047', '#CA8A04'],
} as const satisfies Record<string, readonly [string, string]>

const when = (metric: MetricKey, gte: number, also?: Clause[]): Condition => ({ metric, gte, also })

type Row = Omit<GiftDef, 'art'> & { art: [GiftDef['art']['form'], string, keyof typeof P] }
const row = (
  id: string, category: GiftCategory, rarity: Rarity,
  requirement: string, condition: Condition, unit: string,
  name: string, kind: string, description: string,
  art: Row['art'],
): Row => ({ id, category, rarity, requirement, condition, unit, name, kind, description, art })

const ROWS: Row[] = [
  // ---- Challenges -------------------------------------------------------------------------
  row('challenge-1', 'challenges', 'common', 'Complete your first challenge', when('challengesDone', 1), 'challenges',
    'First Spark', 'Crystal', 'A small bright shard from the very first challenge you finished. Everything big starts like this.',
    ['crystal', 'Zap', 'sky']),
  row('challenge-10', 'challenges', 'common', 'Complete 10 challenges', when('challengesDone', 10), 'challenges',
    'Tenfold Token', 'Badge', 'Ten challenges done. It is no longer a guess, it is a pattern.',
    ['medal', 'CheckCheck', 'blue']),
  row('challenge-25', 'challenges', 'rare', 'Complete 25 challenges', when('challengesDone', 25), 'challenges',
    'Quarter-Century Crest', 'Badge', 'Twenty-five challenges conquered. You wear this one on purpose.',
    ['shield', 'Swords', 'indigo']),
  row('challenge-50', 'challenges', 'epic', 'Complete 50 challenges', when('challengesDone', 50), 'challenges',
    'Halfway Halo', 'Relic', 'Fifty finished challenges bend into a ring of light. Consistency has its own gravity.',
    ['orb', 'Orbit', 'violet']),
  row('challenge-100', 'challenges', 'legendary', 'Complete 100 challenges', when('challengesDone', 100), 'challenges',
    'The Centurion', 'Trophy', 'One hundred challenges. Not luck and not mood, but a record that cannot be faked.',
    ['rosette', 'Crown', 'gold']),

  // ---- Streaks ----------------------------------------------------------------------------
  row('streak-3', 'streaks', 'common', 'Reach a 3-day streak', when('streakBest', 3), 'days',
    'Ember Streak', 'Crystal', 'Three days in a row. A small fire is still a fire.',
    ['crystal', 'Flame', 'orange']),
  row('streak-7', 'streaks', 'rare', 'Reach a 7-day streak', when('streakBest', 7), 'days',
    'Weeklight Lantern', 'Relic', 'A full week without breaking the chain. This lantern burns because you kept showing up.',
    ['hex', 'Lamp', 'amber']),
  row('streak-14', 'streaks', 'rare', 'Reach a 14-day streak', when('streakBest', 14), 'days',
    'Fortnight Forge', 'Badge', 'Two weeks of steady hammering. What you are building is starting to take shape.',
    ['shield', 'Anvil', 'red']),
  row('streak-30', 'streaks', 'epic', 'Reach a 30-day streak', when('streakBest', 30), 'days',
    'Thirty-Day Eclipse', 'Relic', 'Thirty days of consistent progress. You outlasted a whole moon and you are still rising.',
    ['orb', 'Moon', 'purple']),
  row('streak-100', 'streaks', 'legendary', 'Reach a 100-day streak', when('streakBest', 100), 'days',
    'Phoenix Heart', 'Crystal', 'A hundred days. You have burned, rebuilt and kept going. Legends are made of this.',
    ['diamond', 'Bird', 'gold']),

  // ---- Milestones -------------------------------------------------------------------------
  row('milestone-easy', 'milestones', 'common', 'Complete your first Easy milestone', when('milestonesEasy', 1), 'milestones',
    'Waypoint Marker', 'Badge', 'You planted a flag and reached it. The first waypoint is always the sweetest.',
    ['medal', 'Flag', 'green']),
  row('milestone-medium', 'milestones', 'rare', 'Complete your first Medium milestone', when('milestonesMedium', 1), 'milestones',
    'Compass Core', 'Relic', 'A bigger goal, a steadier hand. This compass only points at things you actually finish.',
    ['orb', 'Compass', 'amber']),
  row('milestone-hard', 'milestones', 'epic', 'Complete your first Hard milestone', when('milestonesHard', 1), 'milestones',
    'Summit Stone', 'Crystal', 'Cut from the top of something hard. You climbed it, so it is yours.',
    ['crystal', 'Mountain', 'red']),
  row('milestone-extreme', 'milestones', 'legendary', 'Complete your first Extreme milestone', when('milestonesExtreme', 1), 'milestones',
    'Apex Sigil', 'Trophy', 'Few people even attempt an Extreme goal. You finished one.',
    ['rosette', 'MountainSnow', 'purple']),
  row('milestone-10', 'milestones', 'epic', 'Complete 10 milestones', when('milestonesDone', 10), 'milestones',
    'Pathfinder', 'Title', 'Ten milestones completed. You do not just chase goals, you finish them. Title unlocked: Pathfinder.',
    ['frame', 'Milestone', 'teal']),

  // ---- Focus ------------------------------------------------------------------------------
  row('focus-first', 'focus', 'common', `Finish a focus session of ${CFG.minValidSessionMinutes}+ minutes`, when('focusSessions', 1), 'sessions',
    'First Light', 'Crystal', 'Your first real focus session. Quiet, deliberate and entirely yours.',
    ['crystal', 'Timer', 'cyan']),
  row('focus-1h', 'focus', 'rare', 'Focus for 1 hour in a single session', when('focusLongestMinutes', 60), 'min',
    'Hourglass Prism', 'Relic', 'An unbroken hour. Distraction tried its best and lost.',
    ['hex', 'Hourglass', 'teal']),
  row('focus-2h', 'focus', 'epic', 'Focus for 2 hours in a single session', when('focusLongestMinutes', 120), 'min',
    'Deep Dive Pearl', 'Relic', 'Two hours without surfacing. That is what real depth feels like.',
    ['orb', 'Waves', 'sky']),
  row('focus-8h', 'focus', 'rare', 'Reach 8 hours of total focus time', when('focusLifetimeHours', 8), 'hours',
    'Eight-Hour Beacon', 'Badge', 'A full working day, collected a session at a time. It shines the same way.',
    ['diamond', 'Radar', 'cyan']),
  row('focus-25h', 'focus', 'epic', 'Reach 25 hours of total focus time', when('focusLifetimeHours', 25), 'hours',
    'Quarter-Hundred Prism', 'Crystal', 'Twenty-five hours of attention, refracted into something worth keeping.',
    ['crystal', 'Atom', 'indigo']),
  row('focus-100h', 'focus', 'legendary', 'Reach 100 hours of total focus time', when('focusLifetimeHours', 100), 'hours',
    'Hundred-Hour Monolith', 'Trophy', 'One hundred hours of deliberate work. Skill is built from exactly this.',
    ['rosette', 'Infinity', 'gold']),
  row('focus-week-40', 'focus', 'legendary', 'Focus for 40 hours within one week (Mon to Sun)', when('focusWeekBestHours', 40), 'hours',
    'Iron Week Mantle', 'Relic', 'A full-time job of focus in a single week. Very few people ever do this.',
    ['shield', 'Gauge', 'violet']),
  row('focus-day-4h', 'focus', 'epic', 'Focus for 4 hours in a single day', when('focusDayBestHours', 4), 'hours',
    'Deep Work Medal', 'Badge', 'Four hours in one day. You protected your attention and it paid you back.',
    ['medal', 'Brain', 'pink']),

  // ---- Bucket list ------------------------------------------------------------------------
  row('bucket-1', 'bucket', 'rare', 'Achieve your first Bucket List dream', when('bucketDone', 1), 'dreams',
    'Dream Catcher', 'Relic', 'One dream moved from someday to done. Now you know it can be done.',
    ['orb', 'Sparkles', 'pink']),
  row('bucket-5', 'bucket', 'epic', 'Achieve 5 Bucket List dreams', when('bucketDone', 5), 'dreams',
    'Constellation Map', 'Relic', 'Five dreams achieved. They have started to form a pattern in the sky.',
    ['frame', 'Telescope', 'indigo']),
  row('bucket-10', 'bucket', 'legendary', 'Achieve 10 Bucket List dreams', when('bucketDone', 10), 'dreams',
    "Dreamwalker's Wings", 'Trophy', 'Ten dreams, ten times you refused to leave it as a wish.',
    ['diamond', 'Plane', 'rose']),
  row('bucket-all', 'bucket', 'legendary', `Achieve every dream on your Bucket List (at least ${CFG.bucketAllMinItems})`,
    when('bucketDone', CFG.bucketAllMinItems, [{ metric: 'bucketPending', lte: 0 }]), 'dreams',
    'Horizon Complete', 'Trophy', 'Every dream on the list is done. The horizon moved, and so did you.',
    ['rosette', 'Rainbow', 'gold']),

  // ---- Levels and points ------------------------------------------------------------------
  row('level-1', 'levels', 'common', 'Reach the Explorer level (100 points)', when('points', 100), 'points',
    'Trailhead Token', 'Badge', 'You left the trailhead. Explorers are made by walking, not by planning.',
    ['medal', 'Footprints', 'lime']),
  row('level-2', 'levels', 'rare', 'Reach the Achiever level (250 points)', when('points', 250), 'points',
    "Achiever's Seal", 'Badge', 'Stamped with the mark of someone who gets things done.',
    ['shield', 'Award', 'amber']),
  row('level-3', 'levels', 'epic', 'Reach the Champion level (500 points)', when('points', 500), 'points',
    'Champion Plate', 'Frame', 'Polished by 500 points of real effort. Hang it where you can see it.',
    ['frame', 'Medal', 'orange']),
  row('level-4', 'levels', 'legendary', 'Reach the Legend level (1000 points)', when('points', 1000), 'points',
    'Legendary Core', 'Crystal', 'The final level. Inside it, every point you ever earned is still glowing.',
    ['crystal', 'Gem', 'violet']),
  row('points-2500', 'levels', 'epic', 'Earn 2,500 points', when('points', 2500), 'points',
    'Starforged Coin', 'Relic', 'Minted from 2,500 points of work. It is worth more than it weighs.',
    ['orb', 'Coins', 'amber']),
  row('points-5000', 'levels', 'legendary', 'Earn 5,000 points', when('points', 5000), 'points',
    'Sovereign Mint', 'Trophy', 'Five thousand points. You are not playing the game anymore, you are running it.',
    ['diamond', 'Landmark', 'gold']),

  // ---- Daily rhythm -----------------------------------------------------------------------
  row('day-clean-sweep', 'daily', 'rare',
    `Finish every challenge you planned for a day (at least ${CFG.cleanSweepMinTasks})`,
    when('doneToday', CFG.cleanSweepMinTasks, [{ metric: 'pendingToday', lte: 0 }]), 'done today',
    'Clean Sweep Seal', 'Badge', 'Nothing left on the list. A perfect day deserves a seal.',
    ['medal', 'ListChecks', 'green']),
  row('week-5-sessions', 'daily', 'rare',
    `Finish 5 focus sessions (${CFG.minValidSessionMinutes}+ min each) in one week`, when('focusSessionsWeekBest', 5), 'sessions',
    'Rhythm Ring', 'Relic', 'Five sessions in one week. You found a rhythm and it found you back.',
    ['orb', 'Activity', 'teal']),
  row('productive-7', 'daily', 'epic',
    `Have 7 productive days in a row (${CFG.productiveDayPoints}+ points each)`, when('productiveRunBest', 7), 'days',
    'Seven-Day Sunrise', 'Trophy', 'Seven strong days back to back. Every one of them counted.',
    ['rosette', 'Sunrise', 'orange']),
]

export const GIFTS: GiftDef[] = ROWS.map((r) => ({
  ...r,
  art: { form: r.art[0], glyph: r.art[1], colors: [...P[r.art[2]]] as [string, string] },
}))

export const GIFT_BY_ID: Record<string, GiftDef> = Object.fromEntries(GIFTS.map((g) => [g.id, g]))

export const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary']
export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary',
}

export const CATEGORY_LABEL: Record<GiftCategory, string> = {
  challenges: 'Challenges', streaks: 'Streaks', milestones: 'Milestones', focus: 'Focus',
  bucket: 'Bucket list', levels: 'Levels & points', daily: 'Daily rhythm',
}
export const CATEGORY_ORDER: GiftCategory[] = ['challenges', 'streaks', 'milestones', 'focus', 'bucket', 'levels', 'daily']

// Guard against copy-paste mistakes: duplicate ids would silently merge two gifts.
if (import.meta.env?.DEV) {
  const seen = new Set<string>()
  for (const g of GIFTS) {
    if (seen.has(g.id)) console.error('[gifts] duplicate gift id:', g.id)
    seen.add(g.id)
  }
}

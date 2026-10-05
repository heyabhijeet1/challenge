// Gift Vault: artwork. Every gift is drawn from a form (silhouette), a glyph and a colour pair,
// so no two gifts share the same combination. Mystery art deliberately says nothing about the
// gift inside: same box for every locked gift, regardless of rarity or category.
import { useId } from 'react'
import {
  Activity, Anvil, Atom, Award, Bird, Brain, CheckCheck, Coins, Compass, Crown, Flag, Flame,
  Footprints, Gauge, Gem, Hourglass, Infinity as InfinityIcon, Lamp, Landmark, ListChecks,
  Lock, Medal, Milestone, Moon, Mountain, MountainSnow, Orbit, Plane, Radar, Rainbow,
  Sparkles, Sunrise, Swords, Telescope, Timer, Waves, Zap, type LucideIcon,
} from 'lucide-react'
import type { GiftDef, GiftForm, Rarity } from './types'

const GLYPHS: Record<string, LucideIcon> = {
  Activity, Anvil, Atom, Award, Bird, Brain, CheckCheck, Coins, Compass, Crown, Flag, Flame,
  Footprints, Gauge, Gem, Hourglass, Infinity: InfinityIcon, Lamp, Landmark, ListChecks, Medal,
  Milestone, Moon, Mountain, MountainSnow, Orbit, Plane, Radar, Rainbow, Sparkles, Sunrise,
  Swords, Telescope, Timer, Waves, Zap,
}

/** Smooth-edged badge outline: n points alternating between two radii. */
function rosettePath(n = 14, r1 = 46, r2 = 39) {
  const pts: string[] = []
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n - Math.PI / 2
    const r = i % 2 ? r2 : r1
    pts.push(`${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`)
  }
  return pts.join(' ')
}
const ROSETTE = rosettePath()

interface Shape { body: JSX.Element; gy: number; gs: number }

function shapeFor(form: GiftForm, fill: string, shine: string): Shape {
  const edge = { stroke: 'rgba(255,255,255,.55)', strokeWidth: 1.6, strokeLinejoin: 'round' as const }
  switch (form) {
    case 'crystal':
      return { gy: 52, gs: 30, body: <>
        <polygon points="50,5 83,31 75,81 50,95 25,81 17,31" fill={fill} {...edge} />
        <polygon points="50,5 83,31 50,44 17,31" fill="#fff" opacity=".28" />
        <path d="M17 31 L50 44 L83 31 M50 44 V95 M25 81 L50 44 L75 81" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.2" />
        <polygon points="50,5 83,31 75,81 50,95 25,81 17,31" fill={shine} />
      </> }
    case 'medal':
      return { gy: 42, gs: 30, body: <>
        <polygon points="30,64 19,97 36,88 45,98 51,66" fill={fill} opacity=".85" />
        <polygon points="70,64 81,97 64,88 55,98 49,66" fill={fill} opacity=".7" />
        <circle cx="50" cy="42" r="33" fill={fill} {...edge} />
        <circle cx="50" cy="42" r="26" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="1.4" />
        <circle cx="50" cy="42" r="33" fill={shine} />
      </> }
    case 'shield':
      return { gy: 48, gs: 32, body: <>
        <path d="M50 5 L88 19 V49 C88 74 70 88 50 96 C30 88 12 74 12 49 V19 Z" fill={fill} {...edge} />
        <path d="M50 13 L80 24 V49 C80 68 66 80 50 87 C34 80 20 68 20 49 V24 Z" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.4" />
        <path d="M50 5 L88 19 V49 C88 74 70 88 50 96 C30 88 12 74 12 49 V19 Z" fill={shine} />
      </> }
    case 'orb':
      return { gy: 50, gs: 34, body: <>
        <circle cx="50" cy="50" r="44" fill="none" stroke={fill} strokeWidth="2" opacity=".55" />
        <circle cx="50" cy="50" r="38" fill={fill} {...edge} />
        <ellipse cx="38" cy="33" rx="15" ry="9" fill="#fff" opacity=".35" transform="rotate(-28 38 33)" />
        <circle cx="50" cy="50" r="38" fill={shine} />
      </> }
    case 'hex':
      return { gy: 50, gs: 34, body: <>
        <polygon points="50,5 89,27.5 89,72.5 50,95 11,72.5 11,27.5" fill={fill} {...edge} />
        <polygon points="50,15 80,32.5 80,67.5 50,85 20,67.5 20,32.5" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.4" />
        <polygon points="50,5 89,27.5 89,72.5 50,95 11,72.5 11,27.5" fill={shine} />
      </> }
    case 'rosette':
      return { gy: 50, gs: 34, body: <>
        <polygon points={ROSETTE} fill={fill} {...edge} />
        <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.5" />
        <polygon points={ROSETTE} fill={shine} />
      </> }
    case 'frame':
      return { gy: 50, gs: 36, body: <>
        <rect x="9" y="9" width="82" height="82" rx="20" fill={fill} {...edge} />
        <rect x="19" y="19" width="62" height="62" rx="13" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="1.5" />
        {[[19, 19], [81, 19], [19, 81], [81, 81]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.6" fill="#fff" opacity=".8" />)}
        <rect x="9" y="9" width="82" height="82" rx="20" fill={shine} />
      </> }
    case 'diamond':
    default:
      return { gy: 50, gs: 32, body: <>
        <polygon points="50,3 96,50 50,97 4,50" fill={fill} {...edge} />
        <polygon points="50,15 84,50 50,85 16,50" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.4" />
        <polygon points="50,3 96,50 50,97 4,50" fill={shine} />
      </> }
  }
}

export function GiftArt({ def, size = 88, glow = true }: { def: GiftDef; size?: number; glow?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const { form, glyph, colors } = def.art
  const Icon = GLYPHS[glyph] ?? Sparkles
  const s = shapeFor(form, `url(#f${uid})`, `url(#s${uid})`)
  const sparkle = def.rarity === 'legendary' || def.rarity === 'epic'
  return (
    <svg
      className={`gv-art r-${def.rarity}${glow ? ' glow' : ''}`}
      viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${def.name} artwork`}
    >
      <defs>
        <linearGradient id={`f${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colors[0]} />
          <stop offset="1" stopColor={colors[1]} />
        </linearGradient>
        <linearGradient id={`s${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".3" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {s.body}
      <g style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,.4))' }}>
        <Icon x={50 - s.gs / 2} y={s.gy - s.gs / 2} width={s.gs} height={s.gs} color="#fff" strokeWidth={2.2} aria-hidden />
      </g>
      {sparkle && ([[88, 14, 5], [12, 86, 4]] as const).map(([x, y, r], i) => (
        <path key={i} className="gv-twinkle" style={{ animationDelay: `${i * 0.9}s` }}
          d={`M${x} ${y - r} L${x + r / 3} ${y - r / 3} L${x + r} ${y} L${x + r / 3} ${y + r / 3} L${x} ${y + r} L${x - r / 3} ${y + r / 3} L${x - r} ${y} L${x - r / 3} ${y - r / 3} Z`}
          fill="#fff" />
      ))}
    </svg>
  )
}

/** The same sealed box for every gift that has not been opened. It carries no hint about its contents. */
export function MysteryArt({ size = 88, mode = 'locked' }: { size?: number; mode?: 'locked' | 'ready' | 'opening' }) {
  return (
    <svg className={`gv-mystery ${mode}`} viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
      <g className="lid">
        <rect className="lidr" x="16" y="30" width="68" height="18" rx="5" />
        <rect className="rib" x="45" y="30" width="10" height="18" />
        <path className="bow" d="M50 30 C38 14 24 22 34 30 Z M50 30 C62 14 76 22 66 30 Z" />
      </g>
      <rect className="body" x="21" y="46" width="58" height="46" rx="6" />
      <rect className="rib" x="45" y="46" width="10" height="46" />
      <path className="shine" d="M27 52 H36 V86 H27 Z" />
      {mode === 'locked' && (
        <g className="padlock">
          <circle cx="76" cy="82" r="13" />
          <Lock x={69} y={75} width={14} height={14} color="currentColor" strokeWidth={2.4} />
        </g>
      )}
    </svg>
  )
}

export const RARITY_CLASS = (r: Rarity) => `r-${r}`

import { useEffect, useState } from 'react'
import { CheckCircle2, Target, Sparkles, BarChart3, Timer, StickyNote, HelpCircle, Star, Flame, Gift } from 'lucide-react'
import { useGifts } from './gifts'
import ThemeToggle from './ThemeToggle'

const w = window as any
const PANEL_IDS = ['nt', 'nl', 'sw', 'pts', 'stk', 'recap', 'gv']
const PANEL_KEY: Record<string, string> = { nt: 'notes', nl: 'notes', sw: 'sw', pts: 'stats', stk: 'stats', recap: 'stats', gv: 'gifts' }
const visible = (id: string) => {
  const el = document.getElementById(id)
  return !!el && getComputedStyle(el).display !== 'none'
}

function closeAll() {
  for (let k = 0; k < 3; k++) {
    for (const id of PANEL_IDS) {
      if (!visible(id)) continue
      const el = document.getElementById(id)!
        ; ((el.querySelector('.nback') ?? el.querySelector('.vhead > button')) as HTMLElement | null)?.click()
    }
  }
}

export function goSection(key: string) {
  closeAll()
  if (key === 'stats') w.openRecap?.()
  else if (key === 'sw') w.openSw?.()
  else if (key === 'gifts') w.openGifts?.()
  else if (key === 'notes') w.openNotes?.()
  else w.setTab?.(key)
}

const ITEMS = [
  { key: 'c', label: 'Challenges', icon: CheckCircle2 },
  { key: 'm', label: 'Milestones', icon: Target },
  { key: 'b', label: 'Bucket list', icon: Sparkles },
  { key: 'gifts', label: 'Gift Vault', icon: Gift },
  { key: 'stats', label: 'Statistics', icon: BarChart3 },
  { key: 'sw', label: 'Stopwatch', icon: Timer },
  { key: 'notes', label: 'Notes', icon: StickyNote },
]

export default function Sidebar() {
  const [active, setActive] = useState('c')
  const [score, setScore] = useState('')
  const [streak, setStreak] = useState('')
  const waiting = useGifts().pending.length

  useEffect(() => {
    const read = () => {
      const open = PANEL_IDS.find(visible)
      let key = open ? PANEL_KEY[open] : 'c'
      if (!open) for (const [id, k] of [['tm', 'm'], ['tb', 'b']]) if (document.getElementById(id)?.classList.contains('on')) key = k
      setActive(key)
      setScore(document.getElementById('score')?.textContent?.replace('⭐', '').trim() ?? '')
      setStreak(document.getElementById('streak')?.textContent?.replace('🔥', '').trim() ?? '')
    }
    read()
    const t = setInterval(read, 300)
    return () => clearInterval(t)
  }, [])

  const go = goSection

  const base = 'flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-3.5 py-2.5 text-left text-[15px] font-semibold transition-colors'
  return (
    <aside className="fixed inset-y-0 left-0 z-[12] hidden w-[264px] flex-col border-r border-[var(--line)] bg-[var(--card)] p-5 min-[900px]:flex">
      <div className="mb-7 flex items-center gap-2.5 px-1">
        <img src="/logo.png" alt="" className="h-9 w-9 rounded-[10px]" />
        <span className="inline-block text-[26px] font-extrabold leading-tight text-[var(--text)]">
          Challenge
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => go(key)}
            data-gift-ready={key === 'gifts' && waiting > 0 ? 'true' : undefined}
            className={
              base +
              (active === key
                ? ' bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)]'
                : ' bg-transparent text-[var(--mute)] hover:bg-[color-mix(in_srgb,var(--mute)_12%,transparent)] hover:text-[var(--text)]')
            }
          >
            <Icon size={19} strokeWidth={2.2} className={key === 'gifts' && waiting > 0 ? 'gv-glow' : undefined} />
            {label}
            {key === 'gifts' && waiting > 0 && <span className="gv-badge" aria-label={`${waiting} gifts ready to open`}>{waiting}</span>}
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2">


        <ThemeToggle variant="row" />

        <button
          onClick={() => w.openOnb?.()}
          className={base + ' bg-transparent text-[var(--mute)] hover:text-[var(--text)]'}
        >
          <HelpCircle size={19} strokeWidth={2.2} /> How it works
        </button>
      </div>
    </aside>
  )
}

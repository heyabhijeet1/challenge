// Gift Vault: the unlock moment. One gift at a time, never stacked on top of another dialog.
// The gift's identity is not in the DOM at all until the reveal phase, so it can't leak early.
import { useEffect, useRef, useState } from 'react'
import { GiftArt, MysteryArt } from './GiftArt'
import { RARITY_LABEL } from './definitions'
import { giftStore, useGifts } from './store'
import { giftUi, useGiftUi } from './ui'
import { useReducedMotion } from './useReducedMotion'

type Phase = 'sealed' | 'opening' | 'revealed'

const OPEN_MS = 1100
const COLORS = ['#3182F6', '#8B5CF6', '#10B981', '#F97316', '#FDE047']

// Fixed layout so a re-render never reshuffles the burst.
const PARTICLES = Array.from({ length: 26 }, (_, i) => {
  const a = (Math.PI * 2 * i) / 26 + (i % 3) * 0.12
  const d = 110 + ((i * 37) % 70)
  return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, delay: (i % 5) * 0.04, c: COLORS[i % COLORS.length] }
})

export default function GiftReveal() {
  const gs = useGifts()
  const ui = useGiftUi()
  const reduced = useReducedMotion()
  const [st, setSt] = useState<{ id: string; phase: Phase }>({ id: '', phase: 'sealed' })
  const timer = useRef<number>()
  const boxRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)

  const waiting = gs.pending.filter((v) => !ui.dismissed.has(v.def.id))
  const pinned = ui.pinned ? gs.pending.find((v) => v.def.id === ui.pinned) : undefined
  const current = pinned ?? (ui.presentable ? waiting[0] : undefined)
  const id = current?.def.id ?? ''
  // The phase belongs to one specific gift; a different id always starts sealed.
  const phase: Phase = st.id === id ? st.phase : 'sealed'
  const total = gs.pending.length

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Focus management: remember where the user was, put focus on the main action, give it back after.
  useEffect(() => {
    if (!current) return
    if (!returnTo.current) returnTo.current = document.activeElement as HTMLElement | null
    btnRef.current?.focus()
  }, [id, phase, !!current])
  useEffect(() => {
    if (!current && returnTo.current) {
      returnTo.current.focus?.()
      returnTo.current = null
    }
  }, [!!current])

  const notNow = () => {
    giftUi.dismiss(gs.pending.map((v) => v.def.id))
  }

  // Escape closes the reveal (the gift stays waiting), and must not also close the page behind it.
  useEffect(() => {
    if (!current) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        notNow()
      } else if (e.key === 'Tab' && boxRef.current) {
        const f = Array.from(boxRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'))
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  })

  if (!current) return null
  const def = current.def

  const open = () => {
    if (phase !== 'sealed') return
    setSt({ id, phase: 'opening' })
    timer.current = window.setTimeout(() => setSt({ id, phase: 'revealed' }), reduced ? 150 : OPEN_MS)
  }
  const collect = () => {
    giftStore.collect(id)
    giftUi.clearPin()
  }
  const collectAll = () => {
    giftStore.collectAll()
    giftUi.clearPin()
  }

  return (
    <div id="gvr" className={`gv-reveal ph-${phase} r-${def.rarity}`} role="dialog" aria-modal="true" aria-labelledby="gvr-title">
      <div className="gv-rbox" ref={boxRef}>
        <div className="gv-rkicker">{phase === 'revealed' ? 'Gift unlocked' : 'A gift is waiting'}{total > 1 ? ` · ${total} waiting` : ''}</div>

        <div className="gv-stage">
          <div className="gv-halo" aria-hidden="true" />
          {phase !== 'revealed'
            ? <MysteryArt size={168} mode={phase === 'opening' ? 'opening' : 'ready'} />
            : <div className="gv-pop"><GiftArt def={def} size={176} /></div>}
          {phase === 'revealed' && !reduced && (
            <div className="gv-burst" aria-hidden="true">
              {PARTICLES.map((p, i) => (
                <span key={i} className="gv-p" style={{ ['--dx' as any]: `${p.dx}px`, ['--dy' as any]: `${p.dy}px`, ['--delay' as any]: `${p.delay}s`, ['--c' as any]: p.c }} />
              ))}
            </div>
          )}
          {phase === 'opening' && !reduced && <div className="gv-flash" aria-hidden="true" />}
        </div>

        {phase !== 'revealed' ? (
          <>
            <h2 id="gvr-title" className="gv-rtitle">Something is waiting for you</h2>
            <p className="gv-rwhy">You earned it: <b>{def.requirement}</b></p>
          </>
        ) : (
          <>
            <div className="gv-rmeta"><span className="gv-pill">{RARITY_LABEL[def.rarity]}</span><span className="gv-tag2">{def.kind}</span></div>
            <h2 id="gvr-title" className="gv-rtitle">{def.name}</h2>
            <p className="gv-rdesc">{def.description}</p>
            <p className="gv-rwhy">Unlocked by: {def.requirement}</p>
          </>
        )}

        <div className="gv-ractions">
          {phase === 'sealed' && <button ref={btnRef} type="button" className="gv-btn primary" onClick={open}>Open gift</button>}
          {phase === 'opening' && <button ref={btnRef} type="button" className="gv-btn primary" disabled>Opening…</button>}
          {phase === 'revealed' && <button ref={btnRef} type="button" className="gv-btn primary" onClick={collect}>Collect Gift</button>}
          <div className="gv-rsec">
            <button type="button" className="gv-btn ghost" onClick={notNow}>Not now</button>
            {total >= 3 && <button type="button" className="gv-btn ghost" onClick={collectAll}>Collect all {total}</button>}
          </div>
        </div>

        <div className="gv-sr" aria-live="polite">
          {phase === 'revealed' ? `Unlocked ${def.name}. ${RARITY_LABEL[def.rarity]} ${def.kind}. ${def.description}` : ''}
        </div>
      </div>
    </div>
  )
}

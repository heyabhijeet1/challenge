// Gift Vault: the page. Three states per gift: locked (mystery), ready to open, collected.
import { useEffect, useRef, useState } from 'react'
import { GiftArt, MysteryArt } from './GiftArt'
import { CATEGORY_LABEL, CATEGORY_ORDER, RARITY_LABEL } from './definitions'
import { useGifts, type GiftView } from './store'
import { giftUi, useGiftUi } from './ui'
import type { GiftCategory } from './types'

const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })

function progressText(v: GiftView): string {
  const { current, target } = v.progress
  const n = (x: number) => (v.def.unit === 'hours' ? String(Math.round(x * 10) / 10) : Math.floor(x).toLocaleString())
  return `${n(current)} / ${n(target)} ${v.def.unit ?? ''}`.trim()
}

function LockedCard({ v, next }: { v: GiftView; next: boolean }) {
  const pct = Math.round(v.progress.ratio * 100)
  return (
    <article className="gv-card locked" aria-label={`Mystery gift. To unlock: ${v.def.requirement}`}>
      <MysteryArt size={72} mode="locked" />
      <div className="gv-body">
        <div className="gv-meta">
          <span className="gv-tag2">{CATEGORY_LABEL[v.def.category]}</span>
          {next && <span className="gv-next">Next up</span>}
        </div>
        <b className="gv-req">{v.def.requirement}</b>
        <div className="gv-prog" role="progressbar" aria-label={`Progress toward: ${v.def.requirement}`}
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={progressText(v)}>
          <i style={{ width: `${pct}%` }} />
        </div>
        <small className="gv-ptxt">{progressText(v)}</small>
      </div>
    </article>
  )
}

function ReadyCard({ v }: { v: GiftView }) {
  return (
    <button type="button" className="gv-card ready" onClick={() => giftUi.pin(v.def.id)}
      aria-label={`Open your new gift. Unlocked by: ${v.def.requirement}`}>
      <MysteryArt size={72} mode="ready" />
      <div className="gv-body">
        <div className="gv-meta"><span className="gv-new">Ready to open</span></div>
        <b className="gv-req">{v.def.requirement}</b>
        <small className="gv-ptxt">Tap to see what you earned</small>
      </div>
    </button>
  )
}

function CollectedCard({ v }: { v: GiftView }) {
  const d = v.def
  return (
    <article className={`gv-card collected r-${d.rarity}`} aria-label={`${d.name}, ${RARITY_LABEL[d.rarity]} ${d.kind}`}>
      <GiftArt def={d} size={76} />
      <div className="gv-body">
        <div className="gv-meta">
          <span className="gv-pill">{RARITY_LABEL[d.rarity]}</span>
          <span className="gv-tag2">{d.kind}</span>
        </div>
        <b className="gv-name">{d.name}</b>
        <p className="gv-desc">{d.description}</p>
        <small className="gv-ptxt">Unlocked by: {d.requirement}</small>
        <small className="gv-ptxt">Collected {fmtDate(v.record!.collectedAt!)}</small>
      </div>
    </article>
  )
}

export default function GiftVault() {
  const gs = useGifts()
  const ui = useGiftUi()
  const [tab, setTab] = useState<'vault' | 'collection'>('vault')
  const [cat, setCat] = useState<'all' | GiftCategory>('all')
  const headRef = useRef<HTMLHeadingElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const open = ui.vaultOpen

  useEffect(() => {
    if (open) {
      returnTo.current = document.activeElement as HTMLElement | null
      headRef.current?.focus()
    } else if (returnTo.current) {
      returnTo.current.focus?.()
      returnTo.current = null
    }
  }, [open])

  // Badge on the phone header button while something is waiting to be opened.
  useEffect(() => {
    document.getElementById('gvbtn')?.classList.toggle('has-gift', gs.pending.length > 0)
  }, [gs.pending.length])

  const total = gs.views.length
  const lockedShown = gs.locked.filter((v) => cat === 'all' || v.def.category === cat)
  const pct = total ? Math.round((gs.collected.length / total) * 100) : 0

  return (
    <div id="gv" style={{ display: open ? 'block' : 'none' }} role="region" aria-label="Gift Vault">
      <div className="vbox gvbox">
        <div className="vhead">
          <b ref={headRef} tabIndex={-1} className="gv-h">Gift Vault</b>
          <button type="button" onClick={() => giftUi.closeVault()}>Done</button>
        </div>
        <p className="gv-tagline">Keep progressing. Something is waiting for you, but you don't know what it is yet.</p>

        {!gs.storageOk && (
          <div className="gv-warn" role="alert">
            This browser is blocking storage, so gifts can't be saved on this device. Allow site storage to keep them.
          </div>
        )}

        <div className="rcard gv-sum">
          <div className="gv-sumtop">
            <b>{gs.collected.length} of {total} collected</b>
            <small>{gs.locked.length} still sealed</small>
          </div>
          <div className="gv-prog" role="progressbar" aria-label="Collection progress"
            aria-valuemin={0} aria-valuemax={total} aria-valuenow={gs.collected.length}>
            <i style={{ width: `${pct}%` }} />
          </div>
          {gs.pending.length > 0 && (
            <button type="button" className="gv-open" onClick={() => giftUi.pin(gs.pending[0].def.id)}>
              {gs.pending.length === 1 ? '1 gift is ready to open' : `${gs.pending.length} gifts are ready to open`}
            </button>
          )}
        </div>

        <div className="tabs" role="tablist" aria-label="Vault sections">
          <button type="button" role="tab" id="gv-t-vault" aria-selected={tab === 'vault'} aria-controls="gv-p-vault"
            className={tab === 'vault' ? 'on' : ''} onClick={() => setTab('vault')}>Vault</button>
          <button type="button" role="tab" id="gv-t-coll" aria-selected={tab === 'collection'} aria-controls="gv-p-coll"
            className={tab === 'collection' ? 'on' : ''} onClick={() => setTab('collection')}>
            Collection ({gs.collected.length})
          </button>
        </div>

        {gs.status === 'loading' && (
          <div className="gv-grid" aria-busy="true" aria-label="Loading your vault">
            {[0, 1, 2].map((i) => <div key={i} className="gv-card skeleton" />)}
          </div>
        )}

        {gs.status === 'error' && (
          <div className="rcard gv-err" role="alert">
            <b>Couldn't read your progress</b>
            <p>Your gifts are safe. {gs.error}</p>
            <button type="button" className="gv-open" onClick={() => (window as any).openGifts?.()}>Try again</button>
          </div>
        )}

        {gs.status === 'ready' && tab === 'vault' && (
          <div role="tabpanel" id="gv-p-vault" aria-labelledby="gv-t-vault">
            {gs.pending.length > 0 && (
              <>
                <h3>Ready to open</h3>
                <div className="gv-grid">{gs.pending.map((v) => <ReadyCard key={v.def.id} v={v} />)}</div>
              </>
            )}
            <h3>Sealed gifts</h3>
            <div className="gv-chips" role="group" aria-label="Filter sealed gifts by category">
              {(['all', ...CATEGORY_ORDER] as const).map((c) => (
                <button key={c} type="button" className={cat === c ? 'on' : ''} aria-pressed={cat === c} onClick={() => setCat(c)}>
                  {c === 'all' ? 'All' : CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
            {lockedShown.length === 0 ? (
              <div className="empty">
                {gs.locked.length === 0 ? 'Every gift in the vault is yours. New ones will appear here.' : 'Nothing sealed in this category.'}
              </div>
            ) : (
              <div className="gv-grid">
                {lockedShown.map((v) => (
                  <LockedCard key={v.def.id} v={v}
                    next={cat === 'all' && v.progress.ratio > 0 && gs.locked.indexOf(v) < 3} />
                ))}
              </div>
            )}
          </div>
        )}

        {gs.status === 'ready' && tab === 'collection' && (
          <div role="tabpanel" id="gv-p-coll" aria-labelledby="gv-t-coll">
            {gs.collected.length === 0 ? (
              <div className="empty gv-emptycol">
                <MysteryArt size={84} mode="locked" />
                <p>Your collection is empty.<br />Keep going. Your first gift is closer than you think.</p>
              </div>
            ) : (
              <div className="gv-grid">{gs.collected.map((v) => <CollectedCard key={v.def.id} v={v} />)}</div>
            )}
          </div>
        )}

        <p className="note gv-foot">
          Collected gifts are yours for good: they stay even if a streak breaks or a challenge is deleted.
          Gifts are saved on this device only and don't sync between devices yet.
        </p>
      </div>
    </div>
  )
}


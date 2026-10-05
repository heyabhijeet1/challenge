// Gift Vault: the loop that watches the app and unlocks gifts. No rendering in here.
import { GIFT_CONFIG } from './config'
import { giftBridge } from './bridge'
import { collectFacts } from './engine'
import { giftStore } from './store'
import { giftUi } from './ui'

const shown = (id: string) => {
  const el = document.getElementById(id)
  return !!el && getComputedStyle(el).display !== 'none'
}

/** Reveals wait for a calm moment: not over another dialog, a celebration, or while typing a note. */
function calmMoment(): boolean {
  const api = giftBridge.api
  if (!api || document.visibilityState !== 'visible') return false
  return api.canCommit() && !shown('ask') && !shown('onb') && !shown('nt')
}

let started = false
let lastRun = 0

function run(): void {
  const api = giftBridge.api
  if (!api) return
  try {
    const snap = api.snapshot()
    const facts = collectFacts(snap, Date.now(), GIFT_CONFIG)
    giftStore.evaluate(facts, api.canCommit())
    lastRun = Date.now()
  } catch (e) {
    giftStore.fail(e instanceof Error ? e.message : 'Could not read your progress.')
  }
}

export function startGiftEngine(): void {
  if (started) return
  started = true
  const w = window as any
  w.openGifts = () => { run(); giftUi.openVault() }
  w.closeGifts = () => giftUi.closeVault()

  run()
  giftUi.setPresentable(calmMoment())

  setInterval(() => {
    const api = giftBridge.api
    if (api) {
      // Re-evaluate when the app saved something, or every few seconds while the stopwatch runs
      // (focus gifts depend on elapsed time, not on a save).
      const running = !!api.snapshot().sw
      if (giftBridge.peekDirty() || (running && Date.now() - lastRun > 5000)) {
        if (api.canCommit()) giftBridge.takeDirty()
        run()
      }
    }
    giftUi.setPresentable(calmMoment())
  }, 500)

  document.addEventListener('visibilitychange', () => { if (!document.hidden) run() })
}

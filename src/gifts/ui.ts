// Gift Vault: small UI state shared by the vault panel, the reveal overlay and the sidebar.
import { useSyncExternalStore } from 'react'

interface UiState {
  vaultOpen: boolean
  /** True when nothing else (celebration, dialog, note editor) is on screen. */
  presentable: boolean
  /** Gifts the user chose "Not now" for during this page visit. */
  dismissed: ReadonlySet<string>
  /** A gift the user explicitly asked to open from the vault. */
  pinned: string | null
}

let state: UiState = { vaultOpen: false, presentable: false, dismissed: new Set(), pinned: null }
const listeners = new Set<() => void>()
const set = (patch: Partial<UiState>) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export const giftUi = {
  get: () => state,
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } },
  openVault: () => set({ vaultOpen: true }),
  closeVault: () => set({ vaultOpen: false }),
  setPresentable(v: boolean) { if (v !== state.presentable) set({ presentable: v }) },
  dismiss(ids: string[]) { set({ dismissed: new Set([...state.dismissed, ...ids]), pinned: null }) },
  pin(id: string) {
    const d = new Set(state.dismissed)
    d.delete(id)
    set({ dismissed: d, pinned: id })
  },
  clearPin() { if (state.pinned) set({ pinned: null }) },
}

export const useGiftUi = (): UiState => useSyncExternalStore(giftUi.subscribe, giftUi.get, giftUi.get)

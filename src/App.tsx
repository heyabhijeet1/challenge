import { useEffect } from 'react'
import Markup from './Markup'
import Sidebar, { goSection } from './Sidebar'
import ThemeToggle from './ThemeToggle'
import { initApp } from './legacy/app'
import { installEmojiIcons } from './emojiIcons'
import { GiftReveal, GiftVault, startGiftEngine } from './gifts'
import { installBackNav } from './backNav'


const PANELS = ['nt', 'nl', 'sw', 'pts', 'stk', 'recap', 'gv']
const isOpen = (id: string) => {
  const el = document.getElementById(id)
  return !!el && getComputedStyle(el).display !== 'none'
}
const SECTION_KEYS: Record<string, string> = {
  c: 'c', m: 'm', b: 'b', g: 'gifts', t: 'stats', s: 'sw', n: 'notes',
}

export default function App() {
  useEffect(() => {
    initApp()
    const stopBack = installBackNav()
    startGiftEngine()
    installEmojiIcons()
    const w = window as any
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const sub = document.querySelector('.sub')
      if (sub) sub.textContent = 'Click ✅ to complete. Earn your points.'
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape') {
        const id = PANELS.find(isOpen)
        if (!id) return
        const el = document.getElementById(id)!
          ; ((el.querySelector('.nback') ?? el.querySelector('.vhead > button')) as HTMLElement | null)?.click()
        return
      }
            const t = e.target as HTMLElement
      if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
      if (isOpen('nt')) return // note editor open: never steal keystrokes
      if (['pop', 'ask', 'lvup', 'onb', 'gvr'].some(isOpen)) return
      const section = SECTION_KEYS[e.key.toLowerCase()]
      if (!section) return
      e.preventDefault()
      goSection(section)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      stopBack()
    }
  }, [])
  return (
    <>
      <Sidebar />
      <Markup />
      <GiftVault />
      <GiftReveal />
    </>
  )
}

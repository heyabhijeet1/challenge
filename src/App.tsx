import { useEffect } from 'react'
import Markup from './Markup'
import Sidebar from './Sidebar'
import ThemeToggle from './ThemeToggle'
import { initApp } from './legacy/app'
import { installEmojiIcons } from './emojiIcons'

const PANELS = ['nt', 'nl', 'sw', 'pts', 'stk', 'recap']
const isOpen = (id: string) => {
  const el = document.getElementById(id)
  return !!el && getComputedStyle(el).display !== 'none'
}

export default function App() {
  useEffect(() => {
    initApp()
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
      if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName)) return
      if (PANELS.some(isOpen) || ['pop', 'ask', 'lvup', 'onb'].some(isOpen)) return
      if (e.key === 'n') { e.preventDefault(); w.newNote?.() }
      if (e.key === 's') { e.preventDefault(); w.openSw?.() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  return (
    <>
      <Sidebar />
      <Markup />
    </>
  )
}

// Notes editor: a small contenteditable editor with a toolbar, keyboard shortcuts, checklists and a
// "/" command menu. Built on the browser's own editing commands (execCommand), so native undo/redo,
// IME input and selection all keep working. legacy/app.ts talks to it only through `noteEditor`.
import './notes.css'
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, ListTodo,
  Quote, Minus, Undo2, Redo2, RemoveFormatting, Clock,
} from 'lucide'
import type { IconNode } from 'lucide'
import { isDocEmpty, plainToHtml, sanitize, toText } from './content'

type Kind = 'p' | 'h1' | 'h2' | 'h3' | 'quote' | 'ul' | 'ol' | 'todo'

const NS = 'http://www.w3.org/2000/svg'
function icon(node: IconNode, size = 16): SVGElement {
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('width', String(size))
  svg.setAttribute('height', String(size))
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  for (const [tag, attrs] of node) {
    const c = document.createElementNS(NS, tag)
    for (const k of Object.keys(attrs)) c.setAttribute(k, String((attrs as Record<string, unknown>)[k]))
    svg.appendChild(c)
  }
  return svg
}

// ---- state --------------------------------------------------------------------------------
let host: HTMLElement | null = null
let el: HTMLElement
let tb: HTMLElement
let menu: HTMLElement
let lastRange: Range | null = null
let suppress: { node: Node; start: number } | null = null
let menuOpen = false
let matches: SlashItem[] = []
let active = 0
const callbacks: Array<() => void> = []

// Chromium nests lists, quotes and dividers inside <p> blocks, which breaks the structure, so the live
// editor works with <div> lines. Stored html (see content.ts) is always the clean <p> form.
const toEditorHtml = (h: string) => h.replace(/<(\/?)p>/g, '<$1div>')

// ---- selection helpers --------------------------------------------------------------------
function selElement(): Element | null {
  const s = getSelection()
  if (!s || !s.rangeCount) return null
  const n = s.anchorNode
  if (!n || !el.contains(n)) return null
  return n.nodeType === 1 ? (n as Element) : n.parentElement
}
function within(selector: string): HTMLElement | null {
  const r = selElement()?.closest(selector) as HTMLElement | null
  return r && r !== el && el.contains(r) ? r : null
}
function kindNow(): Kind {
  const li = within('li')
  if (li) {
    const p = li.parentElement
    if (p?.tagName === 'OL') return 'ol'
    return p?.classList.contains('cl') ? 'todo' : 'ul'
  }
  if (within('h1')) return 'h1'
  if (within('h2')) return 'h2'
  if (within('h3')) return 'h3'
  if (within('blockquote')) return 'quote'
  return 'p'
}
function ensureFocus() {
  if (document.activeElement === el) return
  el.focus({ preventScroll: true })
  const s = getSelection()
  if (lastRange && s) { s.removeAllRanges(); s.addRange(lastRange) }
}
function exec(cmd: string, val?: string): boolean {
  ensureFocus()
  return document.execCommand(cmd, false, val)
}
function fire() {
  el.dispatchEvent(new Event('input', { bubbles: true }))
}
function caretTo(node: Node, atEnd = false) {
  const r = document.createRange()
  r.selectNodeContents(node)
  r.collapse(!atEnd)
  const s = getSelection()
  s?.removeAllRanges()
  s?.addRange(r)
}

/**
 * Chromium sometimes freezes computed styles into <span style> / <font> when it converts blocks or
 * pastes. We never want those (the saved html drops them anyway), so remove them from the live editor
 * and put the selection back on the very same nodes.
 */
function scrub() {
  if (!el.querySelector('span, font, [style]')) return
  const s = getSelection()
  const keep = s && s.rangeCount && s.anchorNode && s.focusNode && el.contains(s.anchorNode) && el.contains(s.focusNode)
    ? ([s.anchorNode, s.anchorOffset, s.focusNode, s.focusOffset] as const) : null
  el.querySelectorAll('span, font').forEach((n) => {
    while (n.firstChild) n.parentNode!.insertBefore(n.firstChild, n)
    n.remove()
  })
  el.querySelectorAll('[style]').forEach((n) => n.removeAttribute('style'))
  if (keep && s && el.contains(keep[0]) && el.contains(keep[2])) s.setBaseAndExtent(keep[0], keep[1], keep[2], keep[3])
}

// ---- block commands -----------------------------------------------------------------------
function unlist() {
  const li = within('li')
  if (!li) return
  exec(li.parentElement?.tagName === 'OL' ? 'insertOrderedList' : 'insertUnorderedList')
}
function tagTodo() {
  within('ul')?.classList.add('cl')
}

/** Turns the current line into `kind`, from whatever it is now. Does nothing if it already is `kind`. */
function setBlock(kind: Kind) {
  ensureFocus()
  const cur = kindNow()
  if (cur === kind) return
  const isList = cur === 'ul' || cur === 'ol' || cur === 'todo'
  if (kind === 'p') {
    if (isList) unlist()
    else if (cur === 'quote') { exec('formatBlock', '<div>'); if (within('blockquote')) exec('outdent') }
    else exec('formatBlock', '<div>')
  } else if (kind === 'h1' || kind === 'h2' || kind === 'h3' || kind === 'quote') {
    if (isList) unlist()
    exec('formatBlock', kind === 'quote' ? '<blockquote>' : `<${kind}>`)
  } else if (kind === 'ul') {
    if (cur === 'todo') { const u = within('ul'); u?.classList.remove('cl'); if (u && !u.getAttribute('class')) u.removeAttribute('class'); fire() }
    else {
      if (cur !== 'ol' && cur !== 'p') exec('formatBlock', '<div>')
      exec('insertUnorderedList')
    }
  } else if (kind === 'ol') {
    if (cur !== 'ul' && cur !== 'todo' && cur !== 'p') exec('formatBlock', '<div>')
    exec('insertOrderedList')
  } else if (kind === 'todo') {
    if (cur === 'ul') { tagTodo(); fire() }
    else {
      if (cur !== 'ol' && cur !== 'p') exec('formatBlock', '<div>')
      if (cur === 'ol') exec('insertOrderedList') // out of the numbered list first
      exec('insertUnorderedList')
      tagTodo()
      fire()
    }
  }
  scrub()
  refreshToolbar()
}
/** Toolbar and shortcut behaviour: pressing the active block again turns it back into a paragraph. */
const toggleBlock = (kind: Kind) => setBlock(kindNow() === kind ? 'p' : kind)

function insertDivider() {
  ensureFocus()
  if (kindNow() !== 'p') setBlock('p')
  const had = new Set(Array.from(el.querySelectorAll('hr')))
  exec('insertHorizontalRule')
  // Guarantee a line after the new divider and park the caret there so typing continues.
  const hr = Array.from(el.querySelectorAll('hr')).find((h) => !had.has(h))
  if (hr) {
    let next = hr.nextElementSibling
    if (!next || next.tagName === 'HR') {
      next = document.createElement('div')
      next.innerHTML = '<br>'
      hr.after(next)
    }
    caretTo(next)
  }
  fire()
}

function clearFormatting() {
  ensureFocus()
  exec('removeFormat')
  const cur = kindNow()
  if (cur !== 'p') setBlock('p')
  scrub()
  refreshToolbar()
}
function insertTimestamp() {
  ensureFocus()
  const stamp = new Date().toLocaleString([], {
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
  exec('bold'); exec('insertText', `${stamp}`); exec('bold'); exec('insertText', ' ')
}

// ---- toolbar ------------------------------------------------------------------------------
interface Btn { id: string; label: string; keys?: string; icon: IconNode; run: () => void; on?: () => boolean }
const BUTTONS: Btn[][] = [
  [
    { id: 'undo', label: 'Undo', keys: 'Ctrl+Z', icon: Undo2, run: () => exec('undo') },
    { id: 'redo', label: 'Redo', keys: 'Ctrl+Y', icon: Redo2, run: () => exec('redo') },
  ],
  [
    { id: 'bold', label: 'Bold', keys: 'Ctrl+B', icon: Bold, run: () => exec('bold'), on: () => document.queryCommandState('bold') },
    { id: 'italic', label: 'Italic', keys: 'Ctrl+I', icon: Italic, run: () => exec('italic'), on: () => document.queryCommandState('italic') },
    { id: 'underline', label: 'Underline', keys: 'Ctrl+U', icon: Underline, run: () => exec('underline'), on: () => document.queryCommandState('underline') },
    { id: 'strike', label: 'Strikethrough', icon: Strikethrough, run: () => exec('strikeThrough'), on: () => document.queryCommandState('strikeThrough') },
  ],
  [
    { id: 'h1', label: 'Heading 1', keys: 'Ctrl+Alt+1', icon: Heading1, run: () => toggleBlock('h1'), on: () => kindNow() === 'h1' },
    { id: 'h2', label: 'Heading 2', keys: 'Ctrl+Alt+2', icon: Heading2, run: () => toggleBlock('h2'), on: () => kindNow() === 'h2' },
    { id: 'h3', label: 'Heading 3', keys: 'Ctrl+Alt+3', icon: Heading3, run: () => toggleBlock('h3'), on: () => kindNow() === 'h3' },
  ],
  [
    { id: 'ul', label: 'Bulleted list', keys: 'Ctrl+Shift+8', icon: List, run: () => toggleBlock('ul'), on: () => kindNow() === 'ul' },
    { id: 'ol', label: 'Numbered list', keys: 'Ctrl+Shift+7', icon: ListOrdered, run: () => toggleBlock('ol'), on: () => kindNow() === 'ol' },
    { id: 'todo', label: 'Checklist', icon: ListTodo, run: () => toggleBlock('todo'), on: () => kindNow() === 'todo' },
  ],
  [
    { id: 'quote', label: 'Quote', icon: Quote, run: () => toggleBlock('quote'), on: () => kindNow() === 'quote' },
    { id: 'hr', label: 'Divider', icon: Minus, run: insertDivider },
    { id: 'clear', label: 'Clear formatting', icon: RemoveFormatting, run: clearFormatting },
    { id: 'time', label: 'Insert timestamp', icon: Clock, run: insertTimestamp },
  ],
]
const ALL_BTNS = BUTTONS.flat()

function buildToolbar(): HTMLElement {
  const bar = document.createElement('div')
  bar.className = 'ntb'
  bar.setAttribute('role', 'toolbar')
  bar.setAttribute('aria-label', 'Text formatting')
  BUTTONS.forEach((group, gi) => {
    if (gi) {
      const sep = document.createElement('span')
      sep.className = 'sep'
      sep.setAttribute('aria-hidden', 'true')
      bar.appendChild(sep)
    }
    group.forEach((b) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.dataset.cmd = b.id
      btn.title = b.keys ? `${b.label} — ${b.keys}` : b.label
      btn.setAttribute('aria-label', b.label)
      if (b.keys) btn.setAttribute('aria-keyshortcuts', b.keys.replace('Ctrl', 'Control').replace(/\+/g, '+'))
      if (b.on) btn.setAttribute('aria-pressed', 'false')
      btn.appendChild(icon(b.icon))
      // Keep the caret and selection in the editor when a button is pressed.
      btn.addEventListener('mousedown', (e) => e.preventDefault())
      btn.addEventListener('click', () => { closeMenu(); b.run(); el.focus({ preventScroll: true }) })
      bar.appendChild(btn)
    })
  })
  return bar
}

function refreshToolbar() {
  if (!tb) return
  const inside = !!selElement()
  tb.querySelectorAll<HTMLButtonElement>('button[data-cmd]').forEach((btn) => {
    const def = ALL_BTNS.find((b) => b.id === btn.dataset.cmd)
    if (!def?.on) return
    let on = false
    try { on = inside && def.on() } catch { on = false }
    btn.setAttribute('aria-pressed', on ? 'true' : 'false')
  })
}

// ---- slash menu ---------------------------------------------------------------------------
interface SlashItem { id: Kind | 'hr'; label: string; hint: string; icon: IconNode; keys: string[] }
const ITEMS: SlashItem[] = [
  { id: 'h1', label: 'Heading 1', hint: 'Big section title', icon: Heading1, keys: ['h1', 'heading 1', 'heading', 'head'] },
  { id: 'h2', label: 'Heading 2', hint: 'Medium section title', icon: Heading2, keys: ['h2', 'heading 2', 'heading', 'head'] },
  { id: 'h3', label: 'Heading 3', hint: 'Small section title', icon: Heading3, keys: ['h3', 'heading 3', 'heading', 'head'] },
  { id: 'todo', label: 'Checkbox', hint: 'Track tasks with a checklist', icon: ListTodo, keys: ['checkbox', 'todo', 'to-do', 'task', 'check', 'checklist'] },
  { id: 'ul', label: 'Bulleted List', hint: 'A simple bulleted list', icon: List, keys: ['bulleted list', 'bullet', 'bullets', 'list', 'unordered', 'ul'] },
  { id: 'ol', label: 'Numbered List', hint: 'A list with numbering', icon: ListOrdered, keys: ['numbered list', 'number', 'numbered', 'list', 'ordered', 'ol'] },
  { id: 'quote', label: 'Quote', hint: 'Capture a quote', icon: Quote, keys: ['quote', 'blockquote', 'cite'] },
  { id: 'hr', label: 'Divider', hint: 'Visually divide blocks', icon: Minus, keys: ['divider', 'line', 'rule', 'separator'] },
]

function filterItems(q: string): SlashItem[] {
  const s = q.toLowerCase()
  if (!s) return ITEMS
  return ITEMS.filter((it) => it.keys.some((k) => k.startsWith(s) || k.split(' ').some((w) => w.startsWith(s))))
}

interface SlashHit { node: Text; start: number; end: number; query: string }
/** A "/" typed at the start of a line or after a space, with the caret right behind what follows it. */
function findSlash(): SlashHit | null {
  const s = getSelection()
  if (!s || !s.rangeCount || !s.isCollapsed) return null
  const node = s.anchorNode
  if (!node || node.nodeType !== 3 || !el.contains(node)) return null
  const upto = (node as Text).data.slice(0, s.anchorOffset)
  const m = /(^|\s)\/([A-Za-z0-9-]*)$/.exec(upto)
  if (!m) return null
  const start = upto.length - m[2].length - 1
  if (start === 0) {
    const prev = node.previousSibling as Element | null
    if (prev && prev.nodeType === 1 && prev.tagName !== 'BR') return null // "bold/" must not open the menu
  }
  return { node: node as Text, start, end: s.anchorOffset, query: m[2] }
}

function buildMenu(): HTMLElement {
  const m = document.createElement('div')
  m.className = 'nslash'
  m.id = 'nslash'
  m.hidden = true
  m.setAttribute('role', 'listbox')
  m.setAttribute('aria-label', 'Insert block')
  m.addEventListener('mousedown', (e) => e.preventDefault()) // never steal focus from the editor
  m.addEventListener('click', (e) => {
    const row = (e.target as Element).closest<HTMLElement>('[data-i]')
    if (row) choose(Number(row.dataset.i))
  })
  document.body.appendChild(m)
  return m
}

function renderMenu() {
  menu.textContent = ''
  matches.forEach((it, i) => {
    const row = document.createElement('div')
    row.className = 'nsi' + (i === active ? ' on' : '')
    row.id = 'nslash-' + i
    row.dataset.i = String(i)
    row.setAttribute('role', 'option')
    row.setAttribute('aria-selected', i === active ? 'true' : 'false')
    const ic = document.createElement('span')
    ic.className = 'ic'
    ic.appendChild(icon(it.icon, 17))
    const txt = document.createElement('span')
    txt.className = 'tx'
    const b = document.createElement('b')
    b.textContent = it.label
    const sm = document.createElement('small')
    sm.textContent = it.hint
    txt.append(b, sm)
    row.append(ic, txt)
    menu.appendChild(row)
  })
  el.setAttribute('aria-activedescendant', 'nslash-' + active)
  menu.querySelector('.on')?.scrollIntoView({ block: 'nearest' })
}

function placeMenu() {
  const hit = findSlash()
  if (!menuOpen || !hit) return
  const r = document.createRange()
  r.setStart(hit.node, hit.start)
  r.setEnd(hit.node, hit.start + 1)
  let rect = r.getBoundingClientRect()
  if (!rect.width && !rect.height) rect = el.getBoundingClientRect()
  const vv = window.visualViewport
  const vw = vv ? vv.width : window.innerWidth
  const top0 = vv ? vv.offsetTop : 0
  const bottom0 = vv ? vv.offsetTop + vv.height : window.innerHeight
  const width = Math.min(300, vw - 16)
  menu.style.width = width + 'px'
  menu.style.maxHeight = '300px'
  const natural = Math.min(menu.scrollHeight + 2, 300) // height it would like to have
  const spaceBelow = bottom0 - rect.bottom - 12
  const spaceAbove = rect.top - top0 - 12
  const showBelow = spaceBelow >= natural || spaceBelow >= spaceAbove
  const room = showBelow ? spaceBelow : spaceAbove
  const maxH = Math.max(96, Math.min(natural, room)) // shrink and scroll rather than run off screen
  menu.style.maxHeight = maxH + 'px'
  const h = Math.min(natural, maxH)
  const left = Math.max(8, Math.min(rect.left, vw - width - 8))
  const top = showBelow ? rect.bottom + 6 : rect.top - h - 6
  menu.style.left = left + 'px'
  menu.style.top = Math.max(top0 + 4, Math.min(top, bottom0 - h - 4)) + 'px'
}

function openMenu() {
  menuOpen = true
  menu.hidden = false
  el.setAttribute('aria-expanded', 'true')
  el.setAttribute('aria-controls', 'nslash')
  renderMenu()
  placeMenu()
}
function closeMenu() {
  if (!menuOpen && menu?.hidden !== false) return
  menuOpen = false
  if (menu) menu.hidden = true
  if (el) {
    el.setAttribute('aria-expanded', 'false')
    el.removeAttribute('aria-activedescendant')
  }
}

/** Opens, updates or closes the menu to match the text before the caret. */
function refreshSlash() {
  const hit = findSlash()
  if (!hit) { closeMenu(); suppress = null; return }
  if (suppress && suppress.node === hit.node && suppress.start === hit.start) { closeMenu(); return }
  const list = filterItems(hit.query)
  if (!list.length) { closeMenu(); return }
  const changed = list.length !== matches.length || list.some((x, i) => x !== matches[i])
  matches = list
  if (changed || !menuOpen) active = 0
  if (!menuOpen) openMenu()
  else { renderMenu(); placeMenu() }
}

function choose(i: number) {
  const item = matches[i]
  const hit = findSlash()
  if (!item || !hit) { closeMenu(); return }
  closeMenu()
  // 1. remove "/command"  2. apply the block  3. the caret is left on that line, ready to type
  const r = document.createRange()
  r.setStart(hit.node, hit.start)
  r.setEnd(hit.node, hit.end)
  const s = getSelection()!
  s.removeAllRanges()
  s.addRange(r)
  exec('delete')
  if (item.id === 'hr') insertDivider()
  else setBlock(item.id)
  el.focus({ preventScroll: true })
}

// ---- editor element -----------------------------------------------------------------------
function normalizeBlocks() {
  if (!el.firstChild) { el.innerHTML = '<div><br></div>'; caretTo(el.firstChild!); return }
  // Loose text or inline nodes directly under the editor get wrapped in a paragraph.
  const loose = Array.from(el.childNodes).some((n) => n.nodeType === 3 || (n.nodeType === 1 && /^(B|I|U|S|BR|SPAN|STRIKE)$/.test((n as Element).tagName)))
  if (loose) exec('formatBlock', '<div>')
}
function updateEmpty() {
  const only = el.children.length === 1 && /^(P|DIV)$/.test(el.firstElementChild!.tagName)
  el.classList.toggle('is-empty', only && isDocEmpty(el))
}

function toggleChecklistItem(li: HTMLElement) {
  if (li.getAttribute('data-c') === '1') li.removeAttribute('data-c')
  else li.setAttribute('data-c', '1')
  fire()
}
/** Is this pointer event on the checkbox gutter of a checklist item? */
function checkboxHit(e: MouseEvent): HTMLElement | null {
  const li = (e.target as Element).closest?.('ul.cl > li') as HTMLElement | null
  if (!li || !el.contains(li)) return null
  const r = li.getBoundingClientRect()
  const x = e.clientX - r.left
  return x >= -6 && x <= 30 ? li : null
}

function insertSanitized(html: string) {
  const clean = sanitize(html)
  const single = /^<p>((?:(?!<\/?p>).)*)<\/p>$/.exec(clean) // one paragraph pastes inline
  exec('insertHTML', single ? single[1] : clean)
  scrub()
}

function onKeyDown(e: KeyboardEvent) {
  if (menuOpen) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      active = (active + (e.key === 'ArrowDown' ? 1 : matches.length - 1)) % matches.length
      renderMenu()
      return
    }
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); choose(active); return }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation() // closes the menu only, not the whole note
      const hit = findSlash()
      if (hit) suppress = { node: hit.node, start: hit.start }
      closeMenu()
      return
    }
  }
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && !e.isComposing) {
    const k = kindNow()
    const s = getSelection()
    if (k === 'quote' && within('blockquote') && !(within('blockquote')!.textContent || '').length) {
      e.preventDefault() // Enter on an empty quote line leaves the quote
      setBlock('p')
      return
    }
    if ((k === 'h1' || k === 'h2' || k === 'h3') && s?.isCollapsed) {
      e.preventDefault() // the line after a heading is normal text
      exec('insertParagraph')
      if (kindNow() !== 'p') exec('formatBlock', '<div>')
      scrub()
      return
    }
  }
  const mod = e.ctrlKey || e.metaKey
  if (!mod) return
  const k = e.code
  let handled = true
  if (!e.shiftKey && !e.altKey && k === 'KeyB') exec('bold')
  else if (!e.shiftKey && !e.altKey && k === 'KeyI') exec('italic')
  else if (!e.shiftKey && !e.altKey && k === 'KeyU') exec('underline')
  else if (!e.altKey && k === 'KeyZ') exec(e.shiftKey ? 'redo' : 'undo')
  else if (!e.shiftKey && !e.altKey && k === 'KeyY') exec('redo')
  else if (e.shiftKey && !e.altKey && k === 'Digit7') toggleBlock('ol')
  else if (e.shiftKey && !e.altKey && k === 'Digit8') toggleBlock('ul')
  else if (e.altKey && !e.shiftKey && k === 'Digit1') toggleBlock('h1')
  else if (e.altKey && !e.shiftKey && k === 'Digit2') toggleBlock('h2')
  else if (e.altKey && !e.shiftKey && k === 'Digit3') toggleBlock('h3')
  else if (!e.altKey && !e.shiftKey && k === 'Enter' && within('ul.cl > li')) toggleChecklistItem(within('li')!) // keyboard way to tick a box
  else handled = false
  if (handled) { e.preventDefault(); refreshToolbar() }
}

function createEditor(html: string): HTMLElement {
  const d = document.createElement('div')
  d.id = 'nbody'
  d.contentEditable = 'true'
  d.setAttribute('role', 'textbox')
  d.setAttribute('aria-multiline', 'true')
  d.setAttribute('aria-label', 'Note')
  d.setAttribute('aria-expanded', 'false')
  d.setAttribute('aria-haspopup', 'listbox')
  d.setAttribute('autocapitalize', 'sentences')
  d.innerHTML = toEditorHtml(html)

  d.addEventListener('keydown', onKeyDown)
  d.addEventListener('focus', () => { try { document.execCommand('defaultParagraphSeparator', false, 'div') } catch { /* ignore */ } })
  d.addEventListener('blur', () => closeMenu())
  d.addEventListener('beforeinput', (e) => {
    const ev = e as InputEvent
    // Soft keyboards (Android) report Enter here rather than as a key press.
    if (menuOpen && ev.inputType === 'insertParagraph') { e.preventDefault(); choose(active) }
  })
  d.addEventListener('input', (e) => {
    const ev = e as InputEvent
    normalizeBlocks()
    // A new line made by pressing Enter inside a checklist starts unticked.
    if (ev.inputType === 'insertParagraph') {
      const li = within('ul.cl > li')
      if (li) li.removeAttribute('data-c')
    }
    updateEmpty()
    refreshSlash()
    refreshToolbar()
    callbacks.forEach((f) => f())
  })
  d.addEventListener('mousedown', (e) => { if (checkboxHit(e)) e.preventDefault() })
  d.addEventListener('click', (e) => {
    const li = checkboxHit(e)
    if (li) { e.preventDefault(); toggleChecklistItem(li) }
  })
  d.addEventListener('paste', (e) => {
    e.preventDefault()
    const dt = e.clipboardData
    if (!dt) return
    const html = dt.getData('text/html')
    insertSanitized(html || plainToHtml(dt.getData('text/plain')))
  })
  // Dropping foreign content into the note is not supported; it would bypass the sanitiser.
  d.addEventListener('drop', (e) => e.preventDefault())
  return d
}

function onSelectionChange() {
  const s = getSelection()
  if (!s || !s.rangeCount || !el || !el.contains(s.anchorNode)) return
  lastRange = s.getRangeAt(0).cloneRange()
  refreshToolbar()
  if (document.activeElement === el) refreshSlash()
}

export const noteEditor = {
  /** Builds the toolbar and an empty editor inside `container`. Call once. */
  mount(container: HTMLElement) {
    if (host) return
    host = container
    host.textContent = ''
    tb = buildToolbar()
    menu = buildMenu()
    el = createEditor('<p><br></p>')
    host.append(tb, el)
    updateEmpty()
    document.addEventListener('selectionchange', onSelectionChange)
    window.addEventListener('resize', placeMenu)
    window.visualViewport?.addEventListener('resize', placeMenu)
    document.addEventListener('scroll', placeMenu, true)
  },
  /**
   * Shows a note. Uses its saved `html` when present, otherwise converts the old plain `text`.
   * A fresh editor element is created each time, so undo history never leaks between notes.
   */
  load(note: { text?: string; html?: string }) {
    if (!host) return
    closeMenu()
    suppress = null
    lastRange = null
    let html = typeof note.html === 'string' && note.html ? sanitize(note.html) : sanitize(plainToHtml(note.text || ''))
    if (/<hr>$/.test(html)) html += '<p><br></p>'
    const next = createEditor(html)
    el.replaceWith(next)
    el = next
    updateEmpty()
    refreshToolbar()
  },
  focus() {
    el.focus({ preventScroll: true })
    const last = el.lastElementChild
    if (last) {
      const target = last.tagName === 'UL' || last.tagName === 'OL' ? last.lastElementChild || last : last
      caretTo(target, true)
    }
    refreshToolbar()
  },
  getHtml: () => sanitize(el.innerHTML),
  getText: () => {
    const t = document.createElement('div')
    t.innerHTML = sanitize(el.innerHTML)
    return toText(t)
  },
  isEmpty: () => isDocEmpty(el),
  onInput(fn: () => void) { callbacks.push(fn) },
  closeMenu,
}

// Notes editor: content helpers. No editor behaviour in here, only conversions.
//
// A note is stored as { text, html }:
//   html  the rich content, always passed through sanitize() (on save, on load, on paste)
//   text  a plain-text rendering of the same content. The notes list preview and Copy use it,
//         and older notes only have this field, so it is also the migration source.
//
// The allowed vocabulary is deliberately tiny, which is what keeps stored notes safe and predictable:
//   blocks  p h1 h2 h3 blockquote hr ul ol (li)   checklist = <ul class="cl"> with <li data-c="1"> when ticked
//   inline  b i u s br

const DROP = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'IFRAME', 'OBJECT', 'EMBED', 'NOSCRIPT', 'HEAD', 'META', 'LINK', 'TITLE', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO', 'IMG', 'INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'])
const INLINE: Record<string, string> = { B: 'b', STRONG: 'b', I: 'i', EM: 'i', U: 'u', S: 's', STRIKE: 's', DEL: 's' }
const BLOCK_TAGS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'HR', 'PRE', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'TABLE', 'TR', 'FIGURE'])

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Plain text (an old note) to paragraphs. Every line becomes its own paragraph, blank lines included. */
export function plainToHtml(text: string): string {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n')
  return lines.map((l) => (l ? `<p>${escapeHtml(l)}</p>` : '<p><br></p>')).join('')
}

function appendInline(src: Node, dest: Node): void {
  if (src.nodeType === 3) {
    const t = (src as Text).data.replace(/[\r\n]+/g, ' ')
    if (t) dest.appendChild(document.createTextNode(t))
    return
  }
  if (src.nodeType !== 1) return
  const e = src as Element
  const tag = e.tagName
  if (DROP.has(tag)) return
  if (tag === 'BR') { dest.appendChild(document.createElement('br')); return }
  const mapped = INLINE[tag]
  if (mapped) {
    const n = document.createElement(mapped)
    e.childNodes.forEach((c) => appendInline(c, n))
    if (n.childNodes.length) dest.appendChild(n)
    return
  }
  // Any other element is unwrapped. A nested block starts on a new line.
  if (BLOCK_TAGS.has(tag) && dest.lastChild && (dest.lastChild as Element).tagName !== 'BR') {
    dest.appendChild(document.createElement('br'))
  }
  e.childNodes.forEach((c) => appendInline(c, dest))
}

const closeBlock = <T extends HTMLElement>(el: T): T => {
  // A lone <br> keeps an empty line open; after real content it is only browser noise.
  while (el.childNodes.length > 1 && (el.lastChild as Element).tagName === 'BR') el.removeChild(el.lastChild!)
  if (!el.childNodes.length) el.appendChild(document.createElement('br'))
  return el
}

function appendBlocks(src: Node, out: HTMLElement): void {
  let cur: HTMLElement | null = null
  const flush = () => { if (cur) { out.appendChild(closeBlock(cur)); cur = null } }
  const implicit = () => (cur ??= document.createElement('p'))

  src.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      const t = (n as Text).data.replace(/[\r\n]+/g, ' ')
      if (t.trim() || cur) appendInline(document.createTextNode(t), implicit())
      return
    }
    if (n.nodeType !== 1) return
    const e = n as Element
    const tag = e.tagName
    if (DROP.has(tag)) return
    if (tag === 'HR') { flush(); out.appendChild(document.createElement('hr')); return }
    if (/^H[1-6]$/.test(tag)) {
      flush()
      const lvl = Math.min(3, Number(tag[1]))
      const h = document.createElement('h' + lvl)
      e.childNodes.forEach((c) => appendInline(c, h))
      out.appendChild(closeBlock(h))
      return
    }
    if (tag === 'BLOCKQUOTE') {
      flush()
      const q = document.createElement('blockquote')
      e.childNodes.forEach((c) => appendInline(c, q))
      out.appendChild(closeBlock(q))
      return
    }
    if (tag === 'UL' || tag === 'OL') {
      flush()
      const isTodo = tag === 'UL' && e.classList.contains('cl')
      const list = document.createElement(tag.toLowerCase())
      if (isTodo) list.className = 'cl'
      e.childNodes.forEach((c) => {
        if (c.nodeType !== 1 || (c as Element).tagName !== 'LI') return
        const li = document.createElement('li')
        if (isTodo && (c as Element).getAttribute('data-c') === '1') li.setAttribute('data-c', '1')
        c.childNodes.forEach((k) => appendInline(k, li))
        list.appendChild(closeBlock(li))
      })
      if (list.childNodes.length) out.appendChild(list)
      return
    }
    if (tag === 'LI') { // a stray <li> outside a list
      flush()
      const p = document.createElement('p')
      e.childNodes.forEach((c) => appendInline(c, p))
      out.appendChild(closeBlock(p))
      return
    }
    if (tag === 'P' || BLOCK_TAGS.has(tag)) {
      flush()
      if (Array.from(e.children).some((c) => BLOCK_TAGS.has(c.tagName))) { appendBlocks(e, out); return }
      const p = document.createElement('p')
      e.childNodes.forEach((c) => appendInline(c, p))
      out.appendChild(closeBlock(p))
      return
    }
    appendInline(e, implicit()) // span, a, font, b, i ...
  })
  flush()
}

/** Returns safe editor HTML containing only the vocabulary above. Always has at least one block. */
export function sanitize(html: string): string {
  const doc = new DOMParser().parseFromString('<body>' + String(html ?? ''), 'text/html')
  const out = document.createElement('div')
  appendBlocks(doc.body, out)
  if (!out.childNodes.length) out.innerHTML = '<p><br></p>'
  return out.innerHTML
}

function inlineText(node: Node): string {
  let s = ''
  node.childNodes.forEach((c) => {
    if (c.nodeType === 3) s += (c as Text).data
    else if (c.nodeType === 1) {
      const e = c as Element
      if (e.tagName === 'BR') { if (e.nextSibling || !(e.parentNode && e.parentNode.lastChild === e)) s += '\n' }
      else s += inlineText(e)
    }
  })
  return s
}

/** Plain-text rendering used for the list preview, Copy and the `text` field. */
export function toText(root: HTMLElement): string {
  const lines: string[] = []
  root.childNodes.forEach((n) => {
    if (n.nodeType === 3) { lines.push((n as Text).data); return }
    if (n.nodeType !== 1) return
    const e = n as Element
    const tag = e.tagName
    if (tag === 'HR') lines.push('---')
    else if (tag === 'UL' || tag === 'OL') {
      let i = 0
      e.childNodes.forEach((li) => {
        if ((li as Element).tagName !== 'LI') return
        i++
        const t = inlineText(li)
        if (tag === 'OL') lines.push(`${i}. ${t}`)
        else if (e.classList.contains('cl')) lines.push(`${(li as Element).getAttribute('data-c') === '1' ? '☑' : '☐'} ${t}`)
        else lines.push(`• ${t}`)
      })
    } else if (tag === 'BLOCKQUOTE') {
      inlineText(e).split('\n').forEach((l) => lines.push('> ' + l))
    } else lines.push(inlineText(e))
  })
  return lines.join('\n')
}

/** True when the note has no words and no divider (checkbox or list markers alone do not count). */
export function isDocEmpty(root: HTMLElement): boolean {
  return !root.querySelector('hr') && !(root.textContent || '').trim()
}

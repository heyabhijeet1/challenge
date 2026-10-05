// Replaces emoji characters anywhere in the page with crisp inline Lucide SVG icons.
import { AlarmClock, Angry, ArrowRight, Atom, Ban, Bell, BellOff, Bird, BookOpen, Brain, ChartColumn, CircleCheck, CircleHelp, ClipboardList, Clock, Coins, Compass, Crown, DoorOpen, Drama, Droplet, Dumbbell, Eye, Flag, Flame, Flower2, Footprints, Frown, Gamepad2, Gauge, Gem, Gift, Globe, Guitar, Hammer, Hand, Handshake, Hourglass, Key, Lightbulb, Link, Lock, Medal, Mountain, Orbit, PartyPopper, PawPrint, Puzzle, Rainbow, Receipt, Recycle, RefreshCw, Repeat, Rocket, Route, Shield, Skull, SlidersHorizontal, Sofa, Sparkle, Sparkles, Sprout, Star, StickyNote, Sunrise, Swords, Target, Timer, Trash2, TreePalm, TreePine, TrendingUp, TriangleAlert, Trophy, WandSparkles, Wind, Wrench, Zap } from 'lucide'
import type { IconNode } from 'lucide'

const MAP: Record<string, IconNode> = {
  "🔥": Flame,
  "✨": Sparkles,
  "⭐": Star,
  "🌟": Star,
  "🌠": Sparkle,
  "🚀": Rocket,
  "🏆": Trophy,
  "⏱": Timer,
  "🎯": Target,
  "✅": CircleCheck,
  "⏳": Hourglass,
  "⌛": Hourglass,
  "💪": Dumbbell,
  "🌅": Sunrise,
  "🔁": Repeat,
  "🏔": Mountain,
  "⚡": Zap,
  "📋": ClipboardList,
  "🦁": PawPrint,
  "🦄": WandSparkles,
  "🦅": Bird,
  "💥": Zap,
  "🔄": RefreshCw,
  "🌈": Rainbow,
  "🏎": Gauge,
  "🌍": Globe,
  "🔒": Lock,
  "💎": Gem,
  "🌱": Sprout,
  "⏰": AlarmClock,
  "🤯": Atom,
  "🕰": Clock,
  "🌌": Orbit,
  "🤔": CircleHelp,
  "🧭": Compass,
  "♟": Puzzle,
  "😢": Frown,
  "🔔": Bell,
  "📊": ChartColumn,
  "📝": StickyNote,
  "🧠": Brain,
  "🎮": Gamepad2,
  "🥊": Swords,
  "🛠": Wrench,
  "🔨": Hammer,
  "🧘": Flower2,
  "🏁": Flag,
  "🏃": Footprints,
  "📚": BookOpen,
  "🌳": TreePine,
  "🔧": Wrench,
  "🗝": Key,
  "🪞": Eye,
  "🚪": DoorOpen,
  "🔐": Lock,
  "🎛": SlidersHorizontal,
  "🩸": Droplet,
  "🌀": Wind,
  "⚠": TriangleAlert,
  "👁": Eye,
  "💰": Coins,
  "⚔": Swords,
  "😤": Angry,
  "😈": Skull,
  "😮‍💨": Wind,
  "🚫": Ban,
  "⛓": Link,
  "💀": Skull,
  "🥇": Medal,
  "🌪": Wind,
  "🛡": Shield,
  "💡": Lightbulb,
  "♻": Recycle,
  "📈": TrendingUp,
  "🤝": Handshake,
  "🪜": TrendingUp,
  "🛋": Sofa,
  "🧾": Receipt,
  "🎭": Drama,
  "🛤": Route,
  "👑": Crown,
  "👋": Hand,
  "👉": ArrowRight,
  "💫": Sparkles,
  "🎸": Guitar,
  "🏝": TreePalm,
  "🔕": BellOff,
  "🗑": Trash2,
  "🎉": PartyPopper,
  "🎁": Gift,
}

const RE = /[\u{1F000}-\u{1FAFF}\u2300-\u23FF\u2600-\u27BF\u2B00-\u2BFF](?:\uFE0F|[\u{1F3FB}-\u{1F3FF}])*(?:\u200D[\u{1F000}-\u{1FAFF}\u2600-\u27BF]\uFE0F?)*/gu
const svg = (n: IconNode) =>
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  n.map(([t, a]) => `<${t} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('') + '</svg>'

function convert(t: Text) {
  const s = t.data
  RE.lastIndex = 0
  if (!RE.test(s)) return
  RE.lastIndex = 0
  const frag = document.createDocumentFragment()
  let last = 0, hit = false, m: RegExpExecArray | null
  while ((m = RE.exec(s))) {
    const key = m[0].replace(/\uFE0F/g, '').replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '')
    const icon = MAP[key]
    if (!icon) continue
    hit = true
    if (m.index > last) frag.append(s.slice(last, m.index))
    const span = document.createElement('span')
    span.className = 'ico'
    span.innerHTML = svg(icon)
    frag.append(span)
    last = m.index + m[0].length
  }
  if (!hit) return
  if (last < s.length) frag.append(s.slice(last))
  t.replaceWith(frag)
}

// Text the user is typing (inputs, textareas, the rich notes editor) must never be rewritten.
const isEditable = (n: Node) => {
  const e = n.nodeType === 1 ? (n as HTMLElement) : n.parentElement
  return !!e && e.isContentEditable
}

function walk(node: Node) {
  if (node.nodeType === 3) return isEditable(node) ? undefined : convert(node as Text)
  if (node.nodeType !== 1) return
  const tag = (node as Element).tagName
  if (/^(SCRIPT|STYLE|TEXTAREA|INPUT|svg)$/i.test(tag)) return
  if (isEditable(node)) return
  Array.from(node.childNodes).forEach(walk)
}

export function installEmojiIcons() {
  walk(document.body)
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') walk(m.target)
      else m.addedNodes.forEach(walk)
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true })
}

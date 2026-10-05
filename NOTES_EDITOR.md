# Notes editor

Files: `src/notes/` (`richEditor.ts` behaviour, `content.ts` conversions, `notes.css` styles), plus small hooks in
`Markup.tsx`, `legacy/app.ts` and `emojiIcons.ts`. No new dependencies (icons come from the existing `lucide` package).

## How a note is stored
Each note in `S.notes` (inside the app's existing `ch` localStorage key) keeps its old fields and gains one:

- `text`  plain-text rendering (checklists as ☐/☑, bullets as •, quotes as >, dividers as ---). Still used by the
          notes list preview and Copy. Old notes only have this field.
- `html`  the rich content. Only this vocabulary is ever stored: p h1 h2 h3 blockquote hr ul ol li and b i u s br.
          A checklist is `<ul class="cl">` and a ticked item is `<li data-c="1">`.

Old notes are converted the first time they are opened (each line becomes a paragraph) and the original text is
kept exactly. Nothing is rewritten until a note is opened and saved.

## Safety
`html` goes through `sanitize()` when saved, when loaded and when pasted, so stored content cannot contain scripts,
event handlers, styles or other tags. Drag-and-drop of outside content into a note is disabled for the same reason.

## Shortcuts (inside the editor only)
Ctrl+B / I / U, Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z, Ctrl+Shift+7 numbered list, Ctrl+Shift+8 bulleted list,
Ctrl+Alt+1/2/3 headings, and Ctrl+Enter to tick the checklist item under the caret (keyboard alternative to clicking).

## Known limits
- Built on the browser's `execCommand` editing API. It is deprecated on paper but supported by every browser and gives
  native undo/redo. Automated tests ran in Chromium only.
- Ticking a checkbox is not an undo step (it is a click on a stored state, like in most note apps).
- Turning a list into a heading takes two undo steps.
- Pasting keeps bold/italic/underline/strikethrough, headings, lists, quotes and dividers; everything else is dropped.
- Tab does not indent (lists are one level).

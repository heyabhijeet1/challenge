# Gift Vault

Files: `src/gifts/` (everything), plus small hooks in `App.tsx`, `Sidebar.tsx`, `Markup.tsx`, `emojiIcons.ts`, `legacy/app.ts`.

## Change a reward
- `src/gifts/definitions.ts`: add/edit/remove rows. Use a NEW unique id for a new gift; never rename or reuse an id.
- `src/gifts/config.ts`: thresholds used by some rules (min session minutes, productive-day points, ...).
- Removing a gift from the catalogue never removes it from someone who already earned it (their record stays in storage).

## How it works
- `legacy/app.ts` exposes a read-only snapshot through `gifts/bridge.ts` and calls `markDirty()` inside `save()`. Nothing else in the old code changed.
- `engine.ts` turns that snapshot into facts and checks rules. Pure functions, no storage.
- `store.ts` persists to its own key `ch_gifts_v1` (the app's `ch` key is never written). Unlocks are idempotent and merged with whatever is on disk, so two tabs can't double-award.
- Unlocks wait while a celebration popup, level-up, or the Undo toast is on screen, so an undone completion can never award a gift.
- "Pending" = unlocked but not collected, so a refresh or closed dialog never loses a reward.

## Limits
- Local to one browser (same as the rest of the app). No cross-device sync.
- The app no longer has a "Reset all progress" button. To start fresh while testing, clear site data (or run `localStorage.clear()`) in dev tools.
- Streak/level/points come from the app's existing logic. If that logic changes, gifts follow.

# AGENTS.md

Conventions for working on this repo. Read this before making changes.

## What this is

A macOS menu bar app that pulls a meeting's transcript from the Granola API
and turns it into a set of talk-time "awards" (longest monologue, quietest
mouse, etc). Portfolio piece for a design engineer application — the
functional layer is done first, styling is a deliberate second pass.

## Stack

- Tauri v2 (Rust shell) + Vue 3 + TypeScript, built with Vite.
- macOS only for now. `src-tauri/tauri.conf.json` bundles `app` and `dmg`
  targets only.
- No backend service. The frontend calls `https://public-api.granola.ai/v1`
  directly with a user-supplied API key. The Rust side only owns the tray
  icon, the popover window, and app lifecycle.
- Storybook runs standalone against Vite, not inside the Tauri shell.
- Composition API + `<script setup>` everywhere. Plain composables/functions
  over Pinia — nothing here is shared across enough components to need a
  store yet.

## Commands

- `npm run dev` — Tauri dev mode (tray icon + popover).
- `npm run build` — full macOS app bundle via `tauri build`.
- `npm run check` — lint + `vue-tsc --noEmit`. Run this before committing.
- `npm run test` — Vitest, logic layer only (`src/logic`).
- `npm run storybook` — component explorer, no Tauri required.

## API rules (`src/api/granola.ts`)

- Auth key comes from `VITE_GRANOLA_API_KEY`. If it's missing, functions
  throw `GranolaConfigError` immediately — no silent fallback to mock data.
  Mock data only activates when `VITE_USE_MOCK_DATA=true` is set explicitly.
- `getNote` returns `null` on a 404, it does not throw. A 404 means the note
  is still processing or was never summarized — that's an expected state,
  not an error. Render it as "not ready yet" in the UI, not as a failure.
- Requests go through a sliding-window queue capped at 25 requests per 5
  seconds (which is also the sustained 5 req/s limit — same constraint,
  same window). A 429 retries with backoff, capped at 3 retries total.
- Don't add a try/catch-and-fall-back-to-mock anywhere in this file. If mock
  mode is off and a request fails, let it fail.

## The diarization split (`src/logic/speakerStats.ts`)

iOS-recorded transcripts carry a `diarization_label` per utterance and
support a full per-speaker breakdown. macOS-recorded transcripts only have
`speaker.source: 'microphone' | 'speaker'` — the note owner vs. everyone
else lumped together, no per-person detail. `computeSpeakerStats` detects
which case it's in (does any utterance have a label?) and returns either a
`full` result (per-speaker profiles) or a `two-way` result (`you` vs.
`restOfCall`). Don't try to fake a full breakdown out of two-way data —
there's no information to do it with.

Overlap/interruption counting is an approximation: an utterance counts as an
overlap if it starts before the previous utterance (from a different
speaker) ends. Transcript segmentation isn't guaranteed to capture true
overlap, so this is a signal, not a precise measurement — keep it labeled
as approximate in the UI.

## Awards (`src/logic/awards.ts`)

`AWARD_DEFINITIONS` is a flat list — id, title, a `pickWinner` function, a
`formatValue` function, and a `requiresFullBreakdown` flag. Adding a new
award category means adding one entry here, not touching any component.

Full breakdowns get all five categories. Two-way data collapses to a single
honestly-labeled comparison ("you talked more/less than the rest of the
call") instead of dressing up a two-person result as a five-category
prizegiving — that would overstate what a two-way split actually supports.

## Menu bar behavior

- Activation policy is `Accessory` on macOS — no Dock icon, tray only.
- The popover window (`label: "popover"`) is borderless, always-on-top,
  hidden by default, and toggles on tray click. It hides on blur
  (`WindowEvent::Focused(false)`) via `src-tauri/src/lib.rs`.
- `tauri-plugin-positioner` anchors the window below the tray icon
  (`Position::TrayBottomCenter`).
- Note list polling defaults to every 5 minutes (`NoteSelector.vue`'s
  `pollIntervalMs` prop) plus a debounced refresh on popover focus (wired in
  `App.vue` via `onFocusChanged`), not a refetch on every open.
- "Launch at login" (`src-tauri/src/launch_at_login.rs`) is a stub: it holds
  an in-memory bool and doesn't touch a real login-item API yet
  (`SMAppService` on macOS 13+, or the legacy `SMLoginItemSetEnabled`). Wire
  the real thing here when it's time, the frontend toggle already exists.

## Design tokens (`src/styles/`)

Granola-aligned tokens live in `src/styles/tokens.css` (the public
`oats` palette + semantic roles scraped from granola.ai), with minimal
document defaults in `base.css`. Prefer semantic aliases
(`--color-canvas`, `--color-ink`, `--color-fill-accent`, `--font-display`)
over raw `--color-oats-*` in components.

Components still render mostly unstyled markup beyond those document
defaults — the visual pass should consume the tokens, not invent new
hexes. Don't redistribute Melange/Quadrant; UI uses the system stack
(Granola's own macOS app uses SF Pro), display uses a Quadrant-like
serif fallback stack.

## Storybook

Storybook is wired to always run against the fixtures in
`src/mocks/notes.ts` (see `viteFinal` in `.storybook/main.ts` — it defines
`VITE_USE_MOCK_DATA` at build time), so it works standalone with no API key
and no network access. `AwardsBoard` and `NoteSelector` also accept an
optional `forcedStatus` prop used only by stories to reach states that
aren't otherwise producible from the fixtures (a stuck loading state, a
thrown error). Real app code never sets `forcedStatus`.

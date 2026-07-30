# Granola Prizegiving

A macOS menu bar app that turns a Granola meeting transcript into a set of
talk-time awards for that meeting — longest monologue, quietest mouse,
chatterbox, fastest talker, most interruptions.

Work in progress. This pass covers the data layer, API client, tray/popover
shell, and unstyled components — everything renders with plain semantic
markup and no visual design yet. The styling pass is intentionally separate
and hasn't happened.

See `AGENTS.md` for the stack, conventions, and the reasoning behind the
diarization/awards logic.

## Setup

```
npm install
cp .env.example .env   # add a real Granola API key, or set VITE_USE_MOCK_DATA=true
npm run dev            # Tauri dev mode
```

Other commands: `npm run check` (lint + typecheck), `npm run test`
(Vitest), `npm run storybook`, `npm run build` (macOS app bundle).

## Status

- API client, speaker stats, and awards logic: done, tested.
- Tray icon / popover window / menu bar behavior: done.
- Components: functional, unstyled.
- Design pass: not started.

<p align="center">
  <img src="docs/granola-pg-mark.png" alt="Granola Prizegiving" width="128" height="128" />
</p>

<h1 align="center">Granola Prizegiving</h1>

<p align="center">
  <em>A macOS menu bar app that turns meeting transcripts into tongue-in-cheek talk-time awards.</em>
</p>

---

Recently became aware of the Granola API, which allows users to fetch notes and diarised transcripts. Simultaneously found myself monologuing super hard in a meeting at work. Been wanting to try my hand at building a MacOS menu bar item for a while and thought this would be a good opportunity. Have got Claude to scaffold out a simple project for me to add to.

Idea is to parse the transcript and hand out (heavily tongue-in-cheek) awards to meeting participants post-meeting, thinking:

- **Chatterbox** - biggest talker, both word count and total time spoken
- **Monologuer** - longest monologue
- **Interruption Machine** - who cuts across people mid sentence
- **Favourite words**
- **Buzzword detector**
- etc...


## Setup

```
npm install
cp .env.example .env   # add a real Granola API key, or set VITE_USE_MOCK_DATA=true
npm run dev            # Tauri dev mode
```

Other commands: `npm run check` (lint + typecheck), `npm run test`
(Vitest), `npm run storybook`, `npm run build` (macOS app bundle).

## Status

- Started: AI generated project scaffold: API client, speaker stats, awards logic
- Done: Design tokens aligned to Granola's public `oats` system (`src/styles/tokens.css`)
- Todo: Component styling pass consuming those tokens

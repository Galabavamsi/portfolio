# PORTFOLIO.ROM

Interactive 8-bit portfolio of **Galaba Vamsi** — software engineering, full-stack & AI/ML.

**Live:** [galabavamsi.github.io/portfolio](https://galabavamsi.github.io/portfolio)

Pure HTML/CSS/JS frontend. Zero build step. Supabase backend for the leaderboard
and for keeping the AI chat's API key server-side.

## Features

- Boot sequence, HUD with score + XP scroll bar, sections as game levels
- **BIT.EXE** — an animated pixel cat (wanders, sleeps, blinks, tracks your cursor)
  that comments as you scroll and answers questions via **DeepSeek v4 Flash**
- Hidden **snake game** with a global leaderboard (enter your pilot name, compete)
- Working terminal (`/`), konami code, coins, idle invader, 10 achievements
- Chiptune WebAudio sound effects, all motion in `steps()` easing

## Open source

### [HFlow](https://github.com/Hebbian-Robotics/hflow) · [Hebbian Robotics (YC S26)](https://www.ycombinator.com/companies/hebbian-robotics)

- [PR #598 · merged](https://github.com/Hebbian-Robotics/hflow/pull/598) · [issue #597](https://github.com/Hebbian-Robotics/hflow/issues/597) — Refused sources with multiple channels on one topic before canonical episode creation, added `hflow doctor` diagnostics, and bumped `TRANSFORM_BEHAVIOR_VERSION` to 10.
- [PR #350 · merged](https://github.com/Hebbian-Robotics/hflow/pull/350) · [issue #296](https://github.com/Hebbian-Robotics/hflow/issues/296) — LeRobot’s Hugging Face tree discovery stopped after the first API page; added paginated traversal via `Link: rel="next"`, preserved request headers, deduplicated paths, rejected unsafe cross-origin links, and prevented pagination loops.
- [PR #353 · merged](https://github.com/Hebbian-Robotics/hflow/pull/353) · [issue #292](https://github.com/Hebbian-Robotics/hflow/issues/292) — LeRobot video-cache filenames omitted the video file index; included the camera key, video chunk index, and video file index in cache identity and bumped the converter version to invalidate stale outputs.
- [PR #360 · merged](https://github.com/Hebbian-Robotics/hflow/pull/360) · [issue #314](https://github.com/Hebbian-Robotics/hflow/issues/314) — Centralized ingest URI parsing across the CLI, server, and SDK with shared trimming and safety checks; normalized safe relative URIs and rejected blank, absolute, and parent-escaping paths.

Open-source SDK for scalable multimodal data pipelines in robotics and Physical AI.

### [Inspect Robots](https://github.com/robocurve/inspect-robots) · [Robocurve (YC Summer 2026)](https://www.ycombinator.com/companies/robocurve)

- [PR #476 · merged](https://github.com/robocurve/inspect-robots/pull/476) — Exposes configurable retry policy across agent integrations and honors valid `Retry-After` headers.
- [PR #475 · merged](https://github.com/robocurve/inspect-robots/pull/475) — Preserves unknown git provenance when working-tree status cannot be verified.
- [PR #434 · open](https://github.com/robocurve/inspect-robots/pull/434) — Adds a first-party `inspect-robots-wandb` plugin with a `WandbSink` for per-evaluation configuration and aggregate metrics.

## DEPLOY

### 1. Supabase (backend — free tier)

1. Create a project at [supabase.com](https://supabase.com).
2. **Leaderboard:** Dashboard → SQL Editor → run `supabase/schema.sql`.
3. **Chat proxy** (protects the DeepSeek key) — with the [Supabase CLI](https://supabase.com/docs/guides/cli):
   ```sh
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF
   supabase functions deploy chat --no-verify-jwt
   supabase secrets set DEEPSEEK_KEY=sk-your-deepseek-key
   ```
4. Fill in `config.js` with your project URL, anon key (Dashboard → Settings → API),
   and the function URL `https://YOUR-PROJECT-REF.supabase.co/functions/v1/chat`.

> The anon key is **public by design** — the database is protected by Row Level
> Security (read + insert only, values capped). The DeepSeek key lives only in
> the edge function secret, never in this repo.
> After testing, tighten `ALLOWED_ORIGIN` in `supabase/functions/chat/index.ts`
> to your Pages origin.

### 2. GitHub Pages

1. Push to GitHub (make sure `DEV_DEEPSEEK_KEY` in `config.js` is `''`).
2. Repo → Settings → Pages → Source: **Deploy from a branch** → `main` / root.
3. Site appears at `https://<user>.github.io/<repo>/`.

### Local dev

Open `index.html`, or `python -m http.server 8000`. To test chat without the
edge function, temporarily set `DEV_DEEPSEEK_KEY` in `config.js` — **revert
before committing**.

## Stack

| File | Purpose |
|---|---|
| `index.html` | content & structure |
| `style.css` | phosphor-CRT theme |
| `script.js` | audio, boot, snake, terminal, achievements |
| `pet.js` | BIT the pixel cat + DeepSeek chat |
| `blog/` | build-log posts (`index.html` listing, `blog.css`, `blog.js`, `figures/`) |
| `leaderboard.js` | pilot names + Supabase high scores |
| `config.js` | deployment config (public values only) |
| `supabase/` | DB schema + chat proxy edge function |

## Secrets

There are 10 achievements hidden on this cartridge. A few hints: the oldest
cheat code in the book still works · the cartridge library has a dusty
unlabeled slot · arcade machines run on coins · try pressing `/` · going AFK
has consequences · the corner critter knows things.

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

- [PR #350 · merged](https://github.com/Hebbian-Robotics/hflow/pull/350) · [issue #296](https://github.com/Hebbian-Robotics/hflow/issues/296) — LeRobot’s Hugging Face tree discovery stopped after the first API page; added paginated traversal via `Link: rel="next"`, preserved request headers, deduplicated paths, rejected unsafe cross-origin links, and prevented pagination loops.
- [PR #353 · merged](https://github.com/Hebbian-Robotics/hflow/pull/353) · [issue #292](https://github.com/Hebbian-Robotics/hflow/issues/292) — LeRobot video-cache filenames omitted the video file index; included the camera key, video chunk index, and video file index in cache identity and bumped the converter version to invalidate stale outputs.
- [PR #360 · merged](https://github.com/Hebbian-Robotics/hflow/pull/360) · [issue #314](https://github.com/Hebbian-Robotics/hflow/issues/314) — Centralized ingest URI parsing across the CLI, server, and SDK with shared trimming and safety checks; normalized safe relative URIs and rejected blank, absolute, and parent-escaping paths.

Open-source SDK for scalable multimodal data pipelines in robotics and Physical AI.

### [Inspect Robots](https://github.com/robocurve/inspect-robots) · [Robocurve (YC Summer 2026)](https://www.ycombinator.com/companies/robocurve)

MIT-licensed open-source evaluation framework for robot AI ("Inspect AI for robotics") · **2 merged PRs** · **3 open PRs awaiting merge** · **author of [inspect-robots-wandb](https://pypi.org/project/inspect-robots-wandb/) on PyPI**

<a href="https://robocurve.org/">Robocurve</a> is a San Francisco Public Benefit Corporation building open-source tools and independent benchmarks for physical AI. Every PR clears 100% coverage, strict mypy, and ruff in CI.

- [inspect-robots-wandb v0.1.0](https://pypi.org/project/inspect-robots-wandb/) · [source](https://github.com/Galabavamsi/inspect-robots-wandb) — Weights & Biases logging sink: one W&B run per evaluation with the full eval spec, trial counts, and every aggregate metric. Started as PR #434, moved to its own package at the maintainers' request; 100% coverage, CI on Python 3.10 to 3.13, PyPI trusted publishing.
- [PR #476 · merged](https://github.com/robocurve/inspect-robots/pull/476) · [issue #441](https://github.com/robocurve/inspect-robots/issues/441) — Configurable LLM retry policy across five wire protocols, honoring `Retry-After` (seconds and HTTP-date) with exponential backoff fallback, recorded in the eval log.
- [PR #475 · merged](https://github.com/robocurve/inspect-robots/pull/475) · [issue #473](https://github.com/robocurve/inspect-robots/issues/473) — Stopped an unknown working-tree state from being logged as a verified-clean commit SHA.
- [PR #514 · open, awaiting merge](https://github.com/robocurve/inspect-robots/pull/514) · [issue #136](https://github.com/robocurve/inspect-robots/issues/136) — Checkpoint and resume for long eval sets on robot hardware: single-writer manifest, immutable per-attempt logs, in-flight markers, safety aborts never auto-retried (about 4,100 lines with tests).
- [PR #550 · open, awaiting merge](https://github.com/robocurve/inspect-robots/pull/550) — Optional `on_eval_error` sink hook; approved by the automated reviewer, awaiting a maintainer.
- [PR #551 · open, awaiting merge](https://github.com/robocurve/inspect-robots/pull/551) — Community plugins section in the plugin guide.

### [Cerulion](https://github.com/cerulion-inc/cerulion)

Zero-copy, deterministic communication framework for real-time robotics, in Rust · **3 merged PRs** · **2 open PRs awaiting merge** · [all PRs](https://github.com/cerulion-inc/cerulion/pulls?q=is%3Apr+author%3AGalabavamsi)

- [PR #216 · open, awaiting merge](https://github.com/cerulion-inc/cerulion/pull/216) · issue #53 — `ros2 attach --dry-run` runs outside a workspace using an exclusively created temp root with RAII cleanup, so a pre-planted directory cannot change the report.
- [PR #226 · open, awaiting merge](https://github.com/cerulion-inc/cerulion/pull/226) · issue #71 — Documented the fail-closed arm of the `CERULION_NETWORK` kill-switch; review surfaced a real gap, filed as issue #239.
- [PR #224 · merged](https://github.com/cerulion-inc/cerulion/pull/224) — Fixed 21 stale `USER_API.md` references across 11 files.
- [PR #222 · merged](https://github.com/cerulion-inc/cerulion/pull/222) — ASCII punctuation in shipped doc comments (26 em dashes).
- [PR #220 · merged](https://github.com/cerulion-inc/cerulion/pull/220) — Corrected misleading workspace-root comments in `cerulion_cli_engine`.


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

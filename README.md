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

## Open-source contribution

In 2026, I contributed two maintainer-reviewed and merged pull requests to [HFlow](https://github.com/Hebbian-Robotics/hflow), an open-source robotics data processing and evaluation framework by Hebbian-Robotics:

- [PR #350](https://github.com/Hebbian-Robotics/hflow/pull/350) addressed [issue #296](https://github.com/Hebbian-Robotics/hflow/issues/296): LeRobot’s Hugging Face tree discovery stopped after the first API page. I implemented paginated tree traversal using `Link: rel="next"` headers, preserved User-Agent and authentication headers on every request, deduplicated entries by path, rejected unsafe cross-origin pagination URLs to prevent bearer-token leakage, prevented infinite loops caused by repeated pagination URLs, and added regression tests for pagination, duplicate entries, malformed later pages, authentication preservation, cross-origin links, and self-referential links.
- [PR #353](https://github.com/Hebbian-Robotics/hflow/pull/353) addressed [issue #292](https://github.com/Hebbian-Robotics/hflow/issues/292): LeRobot video-cache filenames omitted the video file index, causing different MP4 files with the same camera and chunk to share one cache entry. I updated the cache identity to include the camera key, video chunk index, and video file index, bumped the converter version to invalidate stale outputs, and added outcome-focused tests proving both distinct-file handling and reuse of the same cached source.

Both contributions passed the project’s GitHub Actions CI, full test suites on Python 3.11 and Python 3.14, Ruff linting and formatting, and ty static type checking. This work involved Python, API pagination, security-conscious credential handling, caching, regression testing, static analysis, Git, GitHub, and CI/CD.

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

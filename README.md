# Galaba Vamsi — portfolio

Personal site of **Galaba Vamsi**. Mechatronics at IIT Bhilai. Builds full-stack apps, AI agents, and ML models, and contributes to open-source robotics tools. The site covers his open-source contributions, RIS emulator research, projects, writing, and film.

**Live:** [galabavamsi.com](https://galabavamsi.com/)

Plain HTML, CSS, and JavaScript with no build step. Vercel serves `main` at galabavamsi.com (`.vercelignore` keeps `experiments/` and `supabase/` off the site); a Supabase edge function keeps the chat model's API key off the client.

## What's on the site

- **Two profiles in one page.** *Tech* (featured work, open-source contributions, experience, projects, research, writing, resume) and *Film* (credits, archive, process). The header switch toggles them; `#film` deep-links to the film profile.
- **Blog** under `blog/`: one post per experiment, with exact numbers and what did not work.
- **BIT**, a small pixel assistant (`pet.js`). It answers questions about Vamsi's work from a curated fact list, through the Supabase chat proxy when deployed and a local keyword fallback otherwise.

## Open source

Vamsi contributes pull requests to these robotics tools; other teams build and maintain them. inspect-robots-wandb is the exception: a community plugin for Inspect Robots that he wrote and maintains.

### [HFlow](https://github.com/Hebbian-Robotics/hflow) · [Hebbian Robotics (YC S26)](https://www.ycombinator.com/companies/hebbian-robotics)

Open-source SDK for verifying the quality of robot training data · **8 merged PRs**

- [PR #657 · merged](https://github.com/Hebbian-Robotics/hflow/pull/657) · [issue #656](https://github.com/Hebbian-Robotics/hflow/issues/656) — Types Arrow columns from every message, preserving fields introduced after startup and reporting incompatible shapes with topic and field context.
- [PR #598 · merged](https://github.com/Hebbian-Robotics/hflow/pull/598) · [issue #597](https://github.com/Hebbian-Robotics/hflow/issues/597) — Refused sources with multiple channels on one topic before canonical episode creation, added `hflow doctor` diagnostics, and bumped `TRANSFORM_BEHAVIOR_VERSION` to 10.
- [PR #400 · merged](https://github.com/Hebbian-Robotics/hflow/pull/400) · [issue #399](https://github.com/Hebbian-Robotics/hflow/issues/399) — Refused LeRobot depth videos before conversion, so the RGB H.264 path cannot silently lose 12-bit depth semantics.
- [PR #367 · merged](https://github.com/Hebbian-Robotics/hflow/pull/367) · [issue #365](https://github.com/Hebbian-Robotics/hflow/issues/365) — Added a reproducible cold camera-frame benchmark; it showed no safe speedup, so the shipped filter graph stayed unchanged.
- [PR #362 · merged](https://github.com/Hebbian-Robotics/hflow/pull/362) — Matched saved EgoSuite labels by source provenance instead of basenames.
- [PR #360 · merged](https://github.com/Hebbian-Robotics/hflow/pull/360) · [issue #314](https://github.com/Hebbian-Robotics/hflow/issues/314) — Centralized ingest URI parsing across the CLI, server, and SDK with shared trimming and safety checks; normalized safe relative URIs and rejected blank, absolute, and parent-escaping paths.
- [PR #353 · merged](https://github.com/Hebbian-Robotics/hflow/pull/353) · [issue #292](https://github.com/Hebbian-Robotics/hflow/issues/292) — LeRobot video-cache filenames omitted the video file index; included the camera key, video chunk index, and video file index in cache identity and bumped the converter version to invalidate stale outputs.
- [PR #350 · merged](https://github.com/Hebbian-Robotics/hflow/pull/350) · [issue #296](https://github.com/Hebbian-Robotics/hflow/issues/296) — LeRobot’s Hugging Face tree discovery stopped after the first API page; added paginated traversal via `Link: rel="next"`, preserved request headers, deduplicated paths, rejected unsafe cross-origin links, and prevented pagination loops.

### [Inspect Robots](https://github.com/robocurve/inspect-robots) · [Robocurve (YC S26)](https://www.ycombinator.com/companies/robocurve)

**2 merged PRs** · **3 open** · **author of [inspect-robots-wandb](https://pypi.org/project/inspect-robots-wandb/) on PyPI**

[Robocurve](https://robocurve.org/) builds open-source tools and independent benchmarks for physical AI. Inspect Robots is its MIT-licensed evaluation framework; its CI gates merges on 100% core test coverage, strict mypy, and ruff.

- [inspect-robots-wandb v0.1.0](https://pypi.org/project/inspect-robots-wandb/) · [source](https://github.com/Galabavamsi/inspect-robots-wandb) — Weights & Biases logging sink: one W&B run per evaluation with the full eval spec, trial counts, and every aggregate metric. The original PR #434 was closed by agreement when the maintainers asked for W&B support to live outside the core, so the sink became this community plugin: 100% coverage gate, CI on Python 3.10 to 3.13, PyPI trusted publishing.
- [PR #476 · merged](https://github.com/robocurve/inspect-robots/pull/476) · [issue #441](https://github.com/robocurve/inspect-robots/issues/441) — Configurable LLM retry policy across five wire protocols, honoring `Retry-After` (seconds and HTTP-date) with exponential backoff fallback, recorded in the eval log.
- [PR #475 · merged](https://github.com/robocurve/inspect-robots/pull/475) · [issue #473](https://github.com/robocurve/inspect-robots/issues/473) — Stopped an unknown working-tree state from being logged as a verified-clean commit SHA.
- [PR #514 · open, in review](https://github.com/robocurve/inspect-robots/pull/514) · [issue #136](https://github.com/robocurve/inspect-robots/issues/136) — Checkpoint and resume for long eval sets on robot hardware: single-writer manifest, immutable per-attempt logs, in-flight markers, safety aborts never auto-retried (about 4,100 lines with tests).
- [PR #550 · open](https://github.com/robocurve/inspect-robots/pull/550) — Optional `on_eval_error` sink hook.
- [PR #551 · open](https://github.com/robocurve/inspect-robots/pull/551) — Community plugins section in the plugin guide.

### [Cerulion](https://github.com/cerulion-inc/cerulion)

Open-source Rust robot runtime that records a run and re-executes it against new code (iceoryx2 shared memory, ROS 2 interop) · **5 merged PRs: one CLI fix and four documentation and comment corrections** · [all PRs](https://github.com/cerulion-inc/cerulion/pulls?q=is%3Apr+author%3AGalabavamsi)

- [PR #216 · merged](https://github.com/cerulion-inc/cerulion/pull/216) · issue #53 — `ros2 attach --dry-run` runs outside a workspace using an exclusively created temp root with RAII cleanup, so a pre-planted directory cannot change the report.
- [PR #226 · merged](https://github.com/cerulion-inc/cerulion/pull/226) · issue #71 — Documented the fail-closed arm of the `CERULION_NETWORK` kill-switch.
- [PR #224 · merged](https://github.com/cerulion-inc/cerulion/pull/224) — Fixed 21 stale `USER_API.md` references across 11 files.
- [PR #222 · merged](https://github.com/cerulion-inc/cerulion/pull/222) — Replaced 26 em dashes in an rmw_cerulion test file's comments so it passes the repo's ASCII-only public-surface check.
- [PR #220 · merged](https://github.com/cerulion-inc/cerulion/pull/220) — Corrected misleading workspace-root comments in `cerulion_cli_engine`.

## Research

- Co-author — *Experience with RF Energy Harvesting-Driven Self-Powered RIS*, IEEE INDICON 2025. [IEEE Xplore](https://ieeexplore.ieee.org/abstract/document/11392908/)
- Co-author — *A systematic literature review on simulation models and deployments for reconfigurable intelligent surfaces*, Ad Hoc Networks (Elsevier), 2026. [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1570870526001964)
- Co-author — *Inspect Robots: Evaluating the Capabilities and Safety of Embodied AI*, [arXiv:2610.06306](https://arxiv.org/abs/2610.06306) (2026); accepted to the Science of Physical AI Safety (SPAIS) Workshop at CoRL 2026 (poster).
- Sole author (preprint draft, arXiv submission pending) — [*Timed RIS Control in the Loop: A Sample-Accurate IQ-Level Emulator with Characterized Timing*](https://github.com/Galabavamsi/sremu-paper/blob/master/preprint/sremu-preprint-draft.pdf), 2026. Code: [sremu](https://github.com/Galabavamsi/sremu) (MIT). Successor to the earlier Open Emulator draft.

## Keeping content in sync

The same facts appear in several places. When one changes, update all of them:

| Where | What |
|---|---|
| `index.html` | Tech and Film profile content |
| `pet.js` | BIT's `LINKS` and `FACTS` (a separate copy of the content) |
| `blog/` | posts, plus the cards in `index.html#blog` |
| `resume.html` | resume chooser page: robotics, software and full-stack, machine learning |
| `resumes/*.tex` → `resume_robotics.pdf`, `resume_software.pdf`, `resume_ml.pdf` | the three one-page resumes, built with `xelatex` (fontspec, Arial). `resume_vamsi.pdf` and `vamsi resume.pdf` are copies of the software one so old links keep working |
| `README.md` | the open-source and research lists above |
| [Galabavamsi/Galabavamsi](https://github.com/Galabavamsi/Galabavamsi) | GitHub profile README |

The positioning line, "Mechatronics at IIT Bhilai. Full-stack, AI/ML, and open-source robotics.", is the same string in the resume headline, the profile header (`TAGLINE` in `tools/paint.mjs` and the header image's alt text), and the start of BIT's `FACTS.summary`. The site hero expands on it in prose.

Bump the `?v=` query strings on `style.css`, `config.js`, `script.js`, and `pet.js` (in `index.html` and the blog pages) after changing them, so browsers pick up the new files.

## Deploy

### Chat proxy (Supabase, free tier)

1. Create a project at [supabase.com](https://supabase.com).
2. Deploy the edge function with the [Supabase CLI](https://supabase.com/docs/guides/cli):
   ```sh
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF
   supabase functions deploy chat --no-verify-jwt
   supabase secrets set DEEPSEEK_KEY=sk-your-deepseek-key
   ```
3. Fill in `config.js` with the project URL, the anon key (Dashboard → Settings → API), and `https://YOUR-PROJECT-REF.supabase.co/functions/v1/chat`.

> The anon key is public by design. The DeepSeek key lives only in the edge function's secrets, never in this repo. Keep `ALLOWED_ORIGIN` in `supabase/functions/chat/index.ts` set to the Pages origin.

`supabase/schema.sql` creates the leaderboard table for the retired snake game; the current site does not use it.

### GitHub Pages

Pushing to `main` runs `.github/workflows/static.yml`, which publishes the repo root except `experiments/`. Keep `DEV_DEEPSEEK_KEY` in `config.js` empty.

### Local dev

Run `python -m http.server 8000` and open `http://localhost:8000/`. Locally, BIT uses its keyword fallback unless `USE_REMOTE_CHAT_LOCALLY` is set in `config.js`.

## Files

| File | Purpose |
|---|---|
| `index.html` | content and structure for both profiles |
| `style.css` | site theme |
| `script.js` | profile switcher, mobile menu, reveal-on-scroll, nav highlighting |
| `pet.js` | BIT assistant and chat |
| `blog/` | posts (`index.html` listing, `blog.css`, `blog.js`, `figures/`) |
| `config.js` | deployment config (public values only) |
| `assets/` | portrait (`profile.webp`) and social preview card (`og-card.jpg`) |
| `resumes/`, `resume_*.pdf` | resume sources and builds |
| `supabase/` | chat proxy edge function (and the legacy leaderboard schema) |
| `experiments/` | design experiments, run locally only; excluded from the Pages build (see `experiments/README.md`) |

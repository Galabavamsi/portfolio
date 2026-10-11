# Experiments

Design experiments for websites, using the portfolio content as the example material. Each experiment is a self-contained folder with its own README. They live in the repository for reference but are **not part of the published site**: the Pages workflow excludes `experiments/` from the build.

| # | Folder | Idea |
|---|---|---|
| 01 | [`01-shan-shui/`](01-shan-shui/) | A horizontally scrolling handscroll. The landscape is painted once, offline, by LingDong-'s {Shan, Shui}* generator with clearings planned for the text, then saved as image tiles; no photos. |

## Running one locally

From the repository root:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000/experiments/01-shan-shui/`. Experiments are plain HTML, CSS and JavaScript with no build step.

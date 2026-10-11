# 01 · Shan Shui scroll

A portfolio laid out as a Chinese landscape handscroll: one long painting you travel along from left to right, with the text set in clearings the mountains leave open. There are no photographs; the only images are the painting itself.

The painting is made **once, offline**, by the original [{Shan, Shui}*](https://github.com/LingDong-/shan-shui-inf) generator (LingDong-, MIT), vendored unchanged in `vendor/`. A Node script runs it with the text stations planned as clearings, and a second script rasterizes the result into WebP tiles. The page does no drawing at all; it lays the tiles end to end on a canvas and scrolls.

Open `index.html` through a local server (see [`../README.md`](../README.md)).

## Controls

- Mouse wheel or trackpad: travel along the scroll (vertical wheel movement is mapped to horizontal travel).
- Drag with the mouse; on touch screens, pan natively.
- `→` `←` `Space` `PageUp` `PageDown` `Home` `End`.
- The section names at the top jump to a station; `#section` in the URL does the same.

## How it is made

```sh
cd tools
npm install          # @resvg/resvg-js and sharp, prebuilt binaries
node paint.js        # plan + paint: build/tile-NN.svg, painting.json, boat.svg, seal.svg
node rasterize.js    # build/tile-NN.svg -> tiles/tile-NN.webp
node paper.js        # paper.png (only needed once)
```

`node paint.js 2027-01-01` paints a different scroll from another seed. `build/` is ignored by git; `tiles/`, `painting.json`, `boat.svg`, `seal.svg` and `paper.png` are committed so the page works without running anything.

- **paint.js** loads the generator's scripts into a Node `vm` sandbox with stubs for `window` and `document`, then drives its own planner (`mountplanner`) chunk by chunk, exactly as the original page does, with one change: any mountain, flat mount or boat whose span overlaps a text station is dropped, and each station instead gets a low shore of rocks, shrubs and a ripple of water. Everything else, including distant ridges, is left as the original plans it.
- **Stations** are fixed world positions (the painting is 800 units tall; the scroll is 22,528 units long) written to `painting.json`. The page scales the painting to the viewport height, so one unit is `innerHeight / 800` pixels; on narrow screens it shrinks the painted band so a station fits the width and lets the text run on below it.
- **Tiles** are 1024 units wide, rasterized at 1.5 px/unit (1536 × 1200) on a transparent background and composited over the paper with `mix-blend-mode: multiply`, so the generator's white fills become paper, as on the original site.
- **The boat** at the bottom is the original's `Arch.boat01`, saved as `boat.svg`; it stays put on screen and turns to face the direction of travel.

## Files

| File | Purpose |
|---|---|
| `index.html`, `style.css`, `scroll.js` | the page: tiles on a canvas, text stations, travel |
| `painting.json` | seed, length, tile layout, station positions (written by paint.js) |
| `tiles/` | the painting, 22 WebP tiles, about 1.5 MB |
| `boat.svg`, `seal.svg`, `paper.png` | the boat, the red name seal, the paper texture |
| `tools/` | `paint.js`, `rasterize.js`, `paper.js`, `package.json` |
| `vendor/` | `shan-shui-inf.html` and its MIT `LICENSE`, unmodified |

## Credits

The landscape is drawn entirely by [{Shan, Shui}*](https://github.com/LingDong-/shan-shui-inf), © 2018 Lingdong Huang, MIT License (`vendor/LICENSE`). The scroll layout, station clearings, offline pipeline, page and seal are this experiment's.

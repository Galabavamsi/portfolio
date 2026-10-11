/* ============================================================
   rasterize.js — turns build/tile-NN.svg into tiles/tile-NN.webp.

   The SVG is drawn on a transparent background; the page composites
   the tiles over its paper texture with mix-blend-mode: multiply, so
   the generator's white fills become paper, as in the original.

   Usage:  node rasterize.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const OUT = path.join(ROOT, 'tiles');
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'painting.json'), 'utf8'));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) if (/^tile-\d+\.webp$/.test(f)) fs.unlinkSync(path.join(OUT, f));
  let total = 0;
  const t0 = Date.now();
  for (let t = 0; t < meta.tile.count; t++) {
    const name = 'tile-' + String(t).padStart(2, '0');
    const svg = fs.readFileSync(path.join(BUILD, name + '.svg'), 'utf8');
    const png = new Resvg(svg, {
      fitTo: { mode: 'width', value: meta.tile.px },
      background: 'rgba(0,0,0,0)',
      font: { loadSystemFonts: true, defaultFontFamily: 'Verdana' },
    }).render().asPng();
    const out = path.join(OUT, name + '.webp');
    await sharp(png).webp({ quality: 84, effort: 5 }).toFile(out);
    total += fs.statSync(out).size;
    process.stdout.write('\r' + name + '.webp  (' + (total / 1e6).toFixed(1) + ' MB so far)');
  }
  console.log('\n' + meta.tile.count + ' tiles · ' + (total / 1e6).toFixed(1) + ' MB · ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
})().catch((e) => { console.error(e); process.exit(1); });

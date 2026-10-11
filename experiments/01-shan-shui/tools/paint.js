/* ============================================================
   paint.js — paints the whole scroll once, offline.

   Runs the vendored {Shan, Shui}* generator (vendor/shan-shui-inf.html,
   MIT, Lingdong Huang) inside a Node vm, plans the text stations as
   clearings the mountains must leave empty, and writes:

     build/tile-NN.svg   one SVG per 1024-unit tile (rasterize.js turns
                         these into WebP)
     painting.json       seed, size, tile layout, station positions
     boat.svg, seal.svg  small pieces the page draws on top

   Usage:  node paint.js [seed]      (default seed: 2026-10-12)
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const SEED = process.argv[2] || '2026-10-12';
const TILE = 1024;            // world units per tile (the painting is 800 units tall)
const CHUNK = 512;            // the original plans the landscape in 512-unit chunks

/* ---------- boot the original generator in a sandbox ---------- */
const html = fs.readFileSync(path.join(ROOT, 'vendor', 'shan-shui-inf.html'), 'utf8');
const head = html.split('<body')[0];
const scripts = [...head.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const ctx = vm.createContext({
  window: {
    btoa: (s) => Buffer.from(String(s), 'binary').toString('base64'),
    location: { href: 'file:///scroll?seed=' + encodeURIComponent(SEED) },
    addEventListener() {},
  },
  document: {
    addEventListener() {},
    getElementById() { return { setAttribute() {}, style: {}, innerHTML: '', value: '' }; },
  },
  console: { log() {} },
  self: {},
});
vm.runInContext(scripts.join('\n'), ctx, { filename: 'shan-shui-inf.html' });
const G = vm.runInContext('this', ctx);     // the sandbox's own global (its Math is the seeded one)
const R = () => G.Math.random();            // the generator's own seeded stream
const choice = (a) => a[Math.floor(R() * a.length)];

/* ---------- station layout, in world units ---------- */
const SECTIONS = [
  ['home', 640], ['about', 600], ['work', 700], ['open-source', 640], ['experience', 640],
  ['projects', 820], ['research', 660], ['skills', 660], ['highlights', 640], ['contact', 600], ['colophon', 540],
];
let u = 760;                                 // some landscape before the title
const stations = SECTIONS.map(([id, w]) => {
  const st = { id, u0: Math.round(u), u1: Math.round(u + w) };
  u += w + 900 + R() * 500;
  return st;
});
const WIDTH = Math.ceil((u + 2200) / TILE) * TILE;   // a tail of landscape after the colophon
const PAD = 40;
const inClearing = (x0, x1) => stations.some((s) => x1 > s.u0 - PAD && x0 < s.u1 + PAD);

/* ---------- plan and paint, chunk by chunk (mirrors the original chunkloader) ---------- */
const items = [];                            // { x, y, canv }
const add = (x, y, canv) => { if (canv) items.push({ x, y, canv: canv.replace(/NaN/g, '-1000') }); };
const t0 = Date.now();
for (let c = 0; c < WIDTH; c += CHUNK) {
  const plan = G.mountplanner(c, c + CHUNK);
  for (let i = 0; i < plan.length; i++) {
    const p = plan[i];
    if (p.tag === 'mount') {
      if (inClearing(p.x - 330, p.x + 330)) continue;
      add(p.x, p.y, G.Mount.mountain(p.x, p.y, i * 2 * R()));
      add(p.x, p.y - 10000, G.water(p.x, p.y, i * 2));
    } else if (p.tag === 'flatmount') {
      if (inClearing(p.x - 520, p.x + 520)) continue;
      add(p.x, p.y, G.Mount.flatMount(p.x, p.y, 2 * R() * Math.PI, { wid: 600 + R() * 400, hei: 100, cho: 0.5 + R() * 0.2 }));
    } else if (p.tag === 'distmount') {
      add(p.x, p.y, G.Mount.distMount(p.x, p.y, R() * 100, { hei: 150, len: choice([500, 1000, 1500]) }));
    } else if (p.tag === 'boat') {
      if (inClearing(p.x - 90, p.x + 90)) continue;
      add(p.x, p.y, G.Arch.boat01(p.x, p.y, R(), { sca: p.y / 800, fli: choice([true, false]) }));
    }
  }
  process.stdout.write('\rpainted ' + Math.min(c + CHUNK, WIDTH) + ' / ' + WIDTH + ' units');
}
process.stdout.write('\n');

/* ---------- the shore under each station: rocks, shrubs, a ripple of water ---------- */
for (const st of stations) {
  const cx = (st.u0 + st.u1) / 2, half = (st.u1 - st.u0) / 2;
  // kept low (y > 720 of 800) so even a tall station clears it
  add(cx, -9000, G.water(cx + (R() - 0.5) * 200, 762 + R() * 16, R() * 10, { len: 700, clu: 8 }));
  for (let k = 0; k < 2 + R() * 3; k++) {
    const x = cx + (R() - 0.5) * half * 1.6;
    add(x, 730, G.Mount.rock(x, 728 + R() * 10, R() * 100, { wid: 16 + R() * 26, hei: 10 + R() * 12, sha: 2 }));
  }
  for (let k = 0; k < 6 + R() * 10; k++) {
    const x = cx + (R() - 0.5) * half * 1.8;
    add(x, 731, G.Tree.tree02(x, 724 + R() * 14));
  }
  if (R() < 0.35) {
    const x = cx + (R() - 0.5) * half;
    add(x, 732, G.Tree.tree08(x, 738, { hei: 30 + R() * 18 }));
  }
}

items.sort((a, b) => a.y - b.y);             // farther (smaller y) paints first, as in the original

/* ---------- write one SVG per tile ---------- */
fs.mkdirSync(BUILD, { recursive: true });
for (const f of fs.readdirSync(BUILD)) if (/^tile-\d+\.svg$/.test(f)) fs.unlinkSync(path.join(BUILD, f));
const tiles = WIDTH / TILE;
for (let t = 0; t < tiles; t++) {
  const x0 = t * TILE, x1 = x0 + TILE;
  const body = items.filter((it) => it.x > x0 - 1300 && it.x < x1 + 1300).map((it) => it.canv).join('');
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='" + x0 + ' 0 ' + TILE + " 800' width='" + TILE * 1.5 + "' height='1200'>" + body + '</svg>';
  fs.writeFileSync(path.join(BUILD, 'tile-' + String(t).padStart(2, '0') + '.svg'), svg);
}

/* ---------- small pieces ---------- */
fs.writeFileSync(path.join(ROOT, 'boat.svg'),
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 70' width='150' height='70'>" +
  G.Arch.boat01(14, 52, R(), { sca: 1, fli: false }) + '</svg>');

// a red relief seal, name set in two columns, edges wobbled by the same random stream
(function seal() {
  const size = 84, half = size / 2, cx = 50, cy = 50, n = 40, pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / n; let px, py;
    if (t < 0.25) { px = -half + (t / 0.25) * size; py = -half; }
    else if (t < 0.5) { px = half; py = -half + ((t - 0.25) / 0.25) * size; }
    else if (t < 0.75) { px = half - ((t - 0.5) / 0.25) * size; py = half; }
    else { px = -half; py = half - ((t - 0.75) / 0.25) * size; }
    const k = 1 + (R() - 0.5) * 0.05;
    pts.push((cx + px * k).toFixed(1) + ',' + (cy + py * k).toFixed(1));
  }
  const col = 'rgba(178,44,38,0.9)';
  const text = (x, s) => "<text x='" + x + "' y='" + (cy - half + 10) + "' writing-mode='tb' font-size='15' letter-spacing='2.5' font-family='Georgia, serif' font-weight='bold' fill='rgb(243,233,212)'>" + s + '</text>';
  fs.writeFileSync(path.join(ROOT, 'seal.svg'),
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><polygon points='" + pts.join(' ') + "' fill='" + col + "' stroke='" + col + "' stroke-width='1.5' stroke-linejoin='round'/>" +
    text(68, 'GALABA') + text(42, 'VAMSI') + '</svg>');
})();

fs.writeFileSync(path.join(ROOT, 'painting.json'), JSON.stringify({
  seed: SEED, width: WIDTH, height: 800,
  tile: { units: TILE, px: TILE * 1.5, count: tiles, pattern: 'tiles/tile-NN.webp' },
  stations,
}, null, 2) + '\n');

console.log('seed ' + SEED + ' · ' + WIDTH + ' units · ' + tiles + ' tiles · ' + items.length + ' items · ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
console.log('tile SVG total: ' + (fs.readdirSync(BUILD).reduce((s, f) => s + fs.statSync(path.join(BUILD, f)).size, 0) / 1e6).toFixed(1) + ' MB');

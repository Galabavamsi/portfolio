/* paper.js — writes ../paper.png, a 256px tileable paper texture in the
   spirit of the original's canvas background (warm, lightly mottled).
   Usage: node paper.js */
'use strict';
const path = require('path');
const sharp = require('sharp');

const N = 256;
// seeded value noise so the texture is reproducible
let s = 20261012;
const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
const grid = 16, g = [];
for (let i = 0; i < grid * grid; i++) g.push(rnd());
const smooth = (t) => t * t * (3 - 2 * t);
function noise(x, y) {                       // tileable: lattice wraps at the edges
  const gx = (x / N) * grid, gy = (y / N) * grid;
  const x0 = Math.floor(gx) % grid, y0 = Math.floor(gy) % grid, x1 = (x0 + 1) % grid, y1 = (y0 + 1) % grid;
  const fx = smooth(gx - Math.floor(gx)), fy = smooth(gy - Math.floor(gy));
  const a = g[y0 * grid + x0], b = g[y0 * grid + x1], c = g[y1 * grid + x0], d = g[y1 * grid + x1];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}
const buf = Buffer.alloc(N * N * 3);
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const c = 245 + noise(x, y) * 10 - rnd() * 18;
  const k = (y * N + x) * 3;
  buf[k] = c; buf[k + 1] = c * 0.955; buf[k + 2] = c * 0.87;
}
sharp(buf, { raw: { width: N, height: N, channels: 3 } }).png({ compressionLevel: 9 })
  .toFile(path.resolve(__dirname, '..', 'paper.png'))
  .then((info) => console.log('paper.png ' + info.width + 'x' + info.height + ' ' + info.size + ' bytes'));

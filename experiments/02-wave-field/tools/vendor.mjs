// Vendor the runtime libraries into ../vendor/ as minified ES modules.
//   cd tools && npm install && node vendor.mjs
// three.js 0.186.1 ships no minified builds, and jsDelivr's on-the-fly minified
// three.webgpu.min.js still imports the unminified core, so we minify here.
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'vendor');
const nm = path.join(here, 'node_modules');
fs.mkdirSync(path.join(out, 'three'), { recursive: true });

const min = (entry, outfile, external = []) => build({
  entryPoints: [entry], outfile, bundle: external.length > 0, external, format: 'esm', minify: true,
  legalComments: 'inline', target: 'es2022', logLevel: 'warning',
});

// core + webgpu (the webgpu build imports ./three.core.js; point it at the minified file)
await min(path.join(nm, 'three/build/three.core.js'), path.join(out, 'three/three.core.min.js'));
await min(path.join(nm, 'three/build/three.webgpu.js'), path.join(out, 'three/three.webgpu.min.js'));
const wg = path.join(out, 'three/three.webgpu.min.js');
fs.writeFileSync(wg, fs.readFileSync(wg, 'utf8').replaceAll('"./three.core.js"', '"./three.core.min.js"'));
await min(path.join(nm, 'three/build/three.tsl.js'), path.join(out, 'three/three.tsl.min.js'));
// the one addon we use, with its helpers bundled in and three left external
await min(path.join(nm, 'three/examples/jsm/loaders/GLTFLoader.js'), path.join(out, 'three/GLTFLoader.min.js'), ['three']);
fs.copyFileSync(path.join(nm, 'three/LICENSE'), path.join(out, 'three/LICENSE'));
// Lenis
fs.mkdirSync(path.join(out, 'lenis'), { recursive: true });
await min(path.join(nm, 'lenis/dist/lenis.mjs'), path.join(out, 'lenis/lenis.min.js'));
fs.copyFileSync(path.join(nm, 'lenis/LICENSE'), path.join(out, 'lenis/LICENSE'));

for (const f of ['three/three.core.min.js', 'three/three.webgpu.min.js', 'three/three.tsl.min.js', 'three/GLTFLoader.min.js', 'lenis/lenis.min.js']) {
  console.log(f.padEnd(28), (fs.statSync(path.join(out, f)).size / 1024).toFixed(0).padStart(5), 'KB');
}

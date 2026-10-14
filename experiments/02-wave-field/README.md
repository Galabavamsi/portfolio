# 02 · Wave field

The portfolio printed on a live wave field. Every ripple on the page is a solution of the 2D wave equation, stepped on the visitor's GPU: the cursor is a transmitter, the name is a piece of metal the waves scatter off, paragraphs sit on absorber so the water goes calm under the words, and three small instruments use the same solver to show the physics behind the work.

- **Replay** (open source): drop a pulse in a box of posts, let it scatter, then run time backwards. The leapfrog scheme is exactly reversible, so the wave comes home (measured: 100.0% of the original height back at the drop point). Lose one frame and repeat the last one in its place: the wave forgets which way it was moving and about half of it comes home (measured: about 50%). Keep the data whole, or refuse it.
- **Steer** (research): a 1-bit reconfigurable intelligent surface. Each element of the ceiling switches its boundary between Dirichlet (reflection −1) and Neumann (+1); a 10 Hz controller picks the pattern that focuses on the reader's pointer behind a wall. A twin simulation with a plain metal ceiling runs alongside, and the readout is the measured gain over it (about +7 to +10 dB at the demo spots on a 1440 px desktop once the field has settled; it varies with viewport and spot).
- **Focus** (film): a plane wave through a lens of slower medium; drag the sensor to pull focus. The spot width is measured from the field (on a 1440 px desktop about 25 px at focus and 200 px at the far end; the pixel figure scales with the viewfinder).

It is not the emulator from my research (that one works on IQ samples with controllers in the loop); the captions say so.

Open `index.html` through a local server (see below). Everything readable is plain HTML; without WebGL the page is static and the instruments show posters.

## Running it

```sh
node experiments/02-wave-field/tools/serve.mjs 8765
```

Then open `http://127.0.0.1:8765/experiments/02-wave-field/`. (`python -m http.server` can serve `.js` as `text/plain` on Windows, which browsers refuse for modules.) URL flags: `?gl` forces the WebGL 2 backend, `?static` skips the GPU, `?nolenis` turns off smooth scrolling, `?perf` logs frame rates.

## Controls

- Move the pointer to make waves (moving faster than the waves makes a Mach cone); click to send a pulse. On touch, tap.
- Replay: click inside the box or use the buttons. Steer: move inside, or pick Plain wall / Random / Optimized. Focus: drag the sensor or use the slider.
- Pause motion in the header (remembered on this device); `prefers-reduced-motion` turns off the pointer and idle sources, the parallax and the demos, and the instruments only simulate while you use them.

## How it is made

- **Solver** (`js/wave/solver.js`): `u_tt + σ u_t = k c² ∇²u`, leapfrog in time, 5-point Laplacian, ping-pong between two float render targets with full-screen passes, written in three.js TSL so it runs on WebGPU and on the WebGL 2 fallback. State texel = (u now, u previous, energy, –); medium texel = (wall, damping, k, Neumann). Extra passes: integer shift (scrolling), time reversal (swap now and previous), dropped frame, inject (a bump with zero velocity), snapshots, and an unpadded readback for the meters.
- **Page field** (`js/field/page-field.js`): the simulation covers the viewport plus a sponge margin and is glued to the page by shifting whole cells as you scroll. The medium is rebuilt from the layout: the chrome name's footprint (rendered from above, from the same mesh you see) is a wall, `data-absorb` blocks are absorbers, `data-absorb="plate"` blocks are metal plates, the About box is a closed tank with five sources.
- **Look** (`js/field/surface.js`, `js/scene/studio.js`): the field is the height of a black glossy liquid lit by two procedural studios (PMREM), with thin tungsten lines on crests and daylight lines on troughs, weighted by local energy. `PageCamera` is an off-axis perspective camera: the page plane stays pixel-aligned with the DOM while the eye moves, which gives the letters parallax.
- **Name** (`assets/name.glb`): Archivo Black, extruded and bevelled in Blender by `tools/blender/text_mesh.py`, split into its two words at runtime so it can break onto two lines on phones.
- **Libraries** (`vendor/`): three.js 0.186.1 (r186 ships no minified builds, so `tools/vendor.mjs` minifies them with esbuild) and Lenis 1.3.26.

```sh
cd experiments/02-wave-field/tools
npm install && node vendor.mjs          # rebuild vendor/
"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --factory-startup --python-exit-code 1 \
  -P blender/text_mesh.py -- --font blender/fonts/ArchivoBlack-Regular.ttf --text "GALABA VAMSI" --out out --name name
# then copy out/name.glb to ../assets/name.glb
```

## Files

| File | Purpose |
|---|---|
| `index.html`, `style.css` | the page and all its content |
| `js/main.js` | dial, motion toggle, capability check; loads `app.js` only when WebGPU or WebGL 2 exists |
| `js/app.js` | renderer, loop, smooth scroll, stats |
| `js/wave/solver.js` | the GPU wave solver |
| `js/field/` | the page field and the surface material |
| `js/scene/` | page camera, procedural studios |
| `js/instruments/` | Replay, Steer, Focus and their shared base |
| `assets/` | the name mesh, instrument posters |
| `vendor/` | minified three.js and Lenis with their licences |
| `tools/` | static server, vendoring script, Blender script and font (OFL) |

## Credits

[three.js](https://threejs.org/) (MIT), [Lenis](https://github.com/darkroomengineering/lenis) (MIT), Archivo Black, Archivo, Instrument Serif and IBM Plex Mono (SIL OFL). Content from the main site as of October 2026.

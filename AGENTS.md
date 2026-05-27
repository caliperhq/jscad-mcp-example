# Agents guide — jscad-mcp-example

> Conventions and gotchas for AI coding agents (Claude Code, Cursor, Aider, etc.) working in this repo. Read this before making any change.

This is a **public demo gallery** for the [jscad-mcp](https://github.com/caliperhq/jscad-mcp) MCP server. Three example projects show what becomes possible when an agent can both *write* JSCAD geometry and *see* the rendered result.

The repo is small but has been the site of two history-rewrite-and-recreate cleanups. Several rules below exist because of past leaks; please follow them.

---

## Persona & scrubbing — non-negotiable

Everything published from this repo goes out under the **msd-hq** GitHub persona.

- Git author identity is set per-repo (`git config user.name "msd-hq"`, `git config user.email "dev@caliperhq.dev"`). Plain `git commit` uses these.
- **Never** use `claude@mikedoty.name` (or any address containing a real surname) as a committer or author email. That string would surface in `git log` on a public repo. Do not pass `-c user.email=...` overrides that include real-name fragments.
- Strip EXIF from every image before commit: `exiftool -all= -overwrite_original <file>`. The scrub-check below also enforces this.
- Do not put local filesystem paths (`/home/<user>/`, `/mnt/<...>/`, `~/<...>`) into any published file. Use repo-relative paths.
- Personal-identifier denylist patterns live in the **gitignored** `.scrub-patterns.local` file (allowlist semantics — the public `scripts/scrub-check.sh` itself carries no literal personal identifiers).

### Run the scrub check before every push

```bash
./scripts/scrub-check.sh
```

It validates four things:

1. No `/home/X/`, `/Users/X/`, `/mnt/X/`, or `~/X/` paths in committed text files.
2. No patterns from `.scrub-patterns.local` (gitignored, owner-maintained) in committed text files.
3. Every author + committer identity in `git log` matches the allowlist (`msd-hq` / `msd` / `caliperhq` for names; `dev@caliperhq.dev`, `noreply@github.com`, or `[digits]+[user]@users.noreply.github.com` for emails).
4. No images carry identifying EXIF (`Author`, `Artist`, `Copyright`, `GPS`, `Owner`, `UserComment`, `Software:`).

A failing scrub-check blocks the push by design — fix the leak first.

---

## Repo layout

```
examples/                    single-file demos
  cycloidal_drive.jscad      named parts + highlight
  gyroid.jscad               marching-cubes TPMS
  vase.jscad                 extrudeFromSlices lofting
  voronoi_panel.jscad        2D Voronoi → extrude
  thread.jscad               extrudeHelical bolt + nut
  gear_pair.jscad            cosine-tooth meshing gears
  snap_box.jscad             tolerance-driven snap fit
  caliper.jscad              animated mechanism
  heatsink.jscad             parametric fin array
  water_tower.jscad          HO-scale wooden water tower
  truss_bridge.jscad         HO-scale Pratt through-truss railroad bridge
  lithophane.jscad           image → 3D heightmap panel (requires lib/litho_heightmap.js)
  *_bundled.jscad            generated single-file bundles for openjscad.xyz
  lib/
    cycloid.js               cycloid profile generator (Hugo-Elias form)
    gyroid.js                gyroid scalar field
    marching-cubes.js        marching cubes algorithm
    marching-cubes-tables.js Paul Bourke's public-domain tables
    vase-profile.js          radius-control-point vase generator
    voronoi.js               half-plane Voronoi cells
    thread.js                helical thread profile
    gear.js                  cosine-tooth gear geometry
    litho_heightmap.js       AUTO-GENERATED grayscale heightmap (see build-lithophane-data.js)
  screenshots/<demo>/        per-demo PNGs + GIFs
demos/engine/                multi-file demo (cutaway 4-stroke engine)
  assembly.js                entry: main(), parts, getParameterDefinitions
  block.js, head.js, piston.js, conrod.js, crankshaft.js, valves.js, ports.js
  engine_bundled.jscad       generated single-file bundle for openjscad.xyz
  screenshots/               iso.png, slice_y.png, ..., crank_sweep.gif
scripts/
  bundle-engine.js           regenerates engine_bundled.jscad
  bundle-examples.js         regenerates the examples/*_bundled.jscad files
  build-lithophane-data.js   preprocesses an input image → lib/litho_heightmap.js
                               via ImageMagick (PGM intermediate, zero npm deps)
  scrub-check.sh             pre-push verification
tests/                       node:test unit tests for the math helpers
docs/
  images/                    repo-wide images (e.g. claude-time-estimates.png)
  superpowers/               LOCAL working artifacts (specs, plans) — gitignored
EXAMPLES.md                  per-demo walkthrough
README.md                    gallery landing page
```

---

## Working with the demos

### Demo file conventions

Every demo (single- or multi-file) exports:

```js
const DEFAULTS = { /* baseline params */ }
const buildAll = (params) => { /* returns { partName: geom, ... } */ }
const _defaultParts = buildAll({})
const main = (params = {}) => Object.values(buildAll(params)).flat()
module.exports = { main, parts: _defaultParts, getParameterDefinitions }
```

The MCP calls `main({})` with no params; defaults must be baked into `buildAll`. `parts` is read as a *static* property at module load — that's why `_defaultParts` is precomputed once.

### The require-cache trap (multi-file demos AND lib data files)

Two flavors of the same trap. Both manifest as "I changed something and my re-render didn't pick it up." Both have the same fix.

**Flavor A — multi-file demos** (`demos/engine/`): the MCP server's Node process caches sub-module requires (`block.js`, `head.js`, etc.) across calls. The evaluator only busts the cache for the *entry* file. Edits to a sub-module won't show up in re-renders.

**Flavor B — generated lib data** (`examples/lib/litho_heightmap.js` and friends): a single-file `.jscad` whose lib is regenerated (e.g. you re-ran `build-lithophane-data.js` with a new input image) hits two cache layers simultaneously:
1. The MCP's content-addressed PNG cache — the entry `.jscad` file didn't change, so its hash didn't change, so `take_image file=...` returns the previous render.
2. The require cache — even on a PNG-cache miss, `require('./lib/litho_heightmap')` returns the lib loaded on the previous call.

**Fix (both flavors):** render via inline `code:` that (a) busts the require cache for the entry + every lib/sub-module and (b) includes a literal marker that changes between calls (just paste a different timestamp comment) so the PNG cache misses too. Example for the engine:

```js
'use strict'
const path = require('path')
const ENGINE = '/home/mike/caliperhq/jscad-mcp-example/demos/engine'
for (const f of ['block','head','piston','conrod','crankshaft','valves','ports','assembly']) {
  delete require.cache[path.join(ENGINE, f + '.js')]
}
const engine = require(ENGINE + '/assembly.js')
module.exports = { main: engine.main, parts: engine.parts }
```

Example for lithophane after regenerating the heightmap:

```js
'use strict'
const path = require('path')
const DIR = '/home/mike/caliperhq/jscad-mcp-example/examples'
// MARKER: 2026-05-27T14:48Z  — change this each call to defeat the PNG cache
delete require.cache[path.join(DIR, 'lithophane.jscad')]
delete require.cache[path.join(DIR, 'lib', 'litho_heightmap.js')]
const mod = require(path.join(DIR, 'lithophane.jscad'))
module.exports = { main: mod.main, parts: mod.parts }
```

Embedding the marker as a runtime value (e.g. `const m = fs.statSync(...).mtimeMs`) does *not* defeat the PNG cache — the cache hashes the source string, not what it evaluates to. The marker must be a literal in the source you pass to `code:`.

Documented in detail in `skills/jscad-mcp/SKILL.md`. Don't waste time confused by stale renders; reach for the cache-bust.

### Per-part coloring

The engine assembly applies `colorize()` to each part via `PART_COLORS` in `assembly.js`. Distinctive RGBA per part makes the cutaway readable at a glance. When adding a new multi-part assembly, follow the same pattern — the renderer respects per-solid colors.

### Regenerate the `*_bundled.jscad` files

The openjscad.xyz "Try in browser" links point at single-file bundles because openjscad.xyz cannot resolve relative requires (e.g. `./lib/cycloid`) against a GitHub raw URL. Any time a file under `demos/engine/` or any `examples/*.jscad` / `examples/lib/*.js` file changes, regenerate the matching bundle:

```bash
node scripts/bundle-engine.js     # -> demos/engine/engine_bundled.jscad
node scripts/bundle-examples.js   # -> examples/cycloidal_drive_bundled.jscad, examples/gyroid_bundled.jscad
```

`tests/bundle-engine.test.js` and `tests/bundle-examples.test.js` verify the bundle structure and that the output evaluates with the right exports. CI does not currently run these (no GitHub Actions workflow); the human author runs them locally before pushing.

**Lib module exports — bundler regex limitations.** `bundle-examples.js` matches lib exports with a regex roughly `module\.exports\s*=\s*\{([^}]*)\}` and matches consumer requires with `const\s+\{([^}]*)\}\s*=\s*require('\.\/[^']+')`. Two consequences when adding a new lib-using example:

1. **Lib `module.exports = { ... }` must be a single line of identifiers only.** Don't put complex values inline — the regex captures everything between the first `{` and first `}` and splits on commas, so inline arrays/nested objects/multi-line exports become phantom destructure names. Declare values as `const` above:
   ```js
   const w = 120
   const h = 150
   const values = [/* ...18000 numbers... */]
   module.exports = { w, h, values }      // ✅ bundler-safe
   ```
2. **The consumer file must use bare destructure names matching the lib's exports.** The bundler strips your `require('./lib/x')` line and emits its own destructure with the lib's raw names. So `const { w: WIDTH } = require('./lib/x')` will leave `WIDTH` undefined in the bundle. Use bare names and rebuild the object locally if you want a namespace.

Symptom of either: the bundled `.jscad` is much smaller than expected, or evaluating it throws `ReferenceError: X is not defined`. Inspect the first few lines of the bundled output to see what destructure the bundler emitted.

### Image-input demos (lithophane pattern)

`examples/lithophane.jscad` is the template for any demo whose input is a raster image. `.jscad` files run sandboxed at render time with no `fs` access, so image data must be embedded as JS, not read from disk. The pipeline:

```bash
# preprocessor: image → grayscale PGM (via ImageMagick) → JS data module
node scripts/build-lithophane-data.js path/to/photo.jpg 120
# regenerate the bundle so the openjscad.xyz link picks up the new heightmap
node scripts/bundle-examples.js
```

`build-lithophane-data.js` uses ImageMagick's `convert` (zero npm deps) and emits the lib in the bundler-safe shape described above. If you copy the pattern for a new image-input demo (terrain ribbon, lithophane variants, embossed plaque), keep the same export shape — see the bundler caveats one section up.

### Marching cubes / implicit surfaces

`examples/gyroid.jscad` uses `f² - t²` as the iso-function (not the naive `|f| - t`). The kink at `f=0` in `|f|` breaks marching cubes — produces non-manifold triangles that render as a solid blob. Use the smooth squared form for any new TPMS demo.

Paul Bourke's tables in `examples/lib/marching-cubes-tables.js` are public domain and must not be edited.

### Iteration GIFs

`examples/screenshots/<demo>/iteration.gif` and `demos/engine/screenshots/crank_sweep.gif` are stitched from frames in `.iteration-frames/` or `.crank-frames/` (both directories are gitignored). The recipe:

```bash
ffmpeg -y -framerate 1.5 -pattern_type glob -i '.iteration-frames/*.png' \
       -vf 'scale=720:-1:flags=lanczos,palettegen=stats_mode=diff' /tmp/_p.png
ffmpeg -y -framerate 1.5 -pattern_type glob -i '.iteration-frames/*.png' \
       -i /tmp/_p.png -lavfi 'scale=720:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer' \
       iteration.gif
exiftool -all= -overwrite_original iteration.gif
```

The crank-sweep uses `-framerate 8` (12 frames at 8 fps for smooth rotation) instead of 1.5.

---

## Local environment

- **Node**: developed on Node 24. Note that `headless-gl` (a transitive dep of jscad-mcp) needs a patch + rebuild on Node 24+ with GCC 14+ — instructions in the tool repo's README, also captured in `EXAMPLES.md`'s postscript.
- **No `node_modules` in this repo** by design. For local `node -e "..."` checks of demos that import `@jscad/modeling`, prefix with `NODE_PATH=/path/to/jscad-mcp/node_modules` or symlink.
- **Required CLI tools:** `node`, `git`, `gh`, `ffmpeg`, `exiftool`.
- **MCP server**: most rendering is done through `jscad-mcp` running as an MCP server connected to the local agent. See the tool repo's README for setup.

---

## Tests

```bash
node --test tests/                  # all unit tests
node --test tests/cycloid.test.js   # cycloidal profile
node --test tests/marching-cubes.test.js
node --test tests/gyroid.test.js
node --test tests/bundle-engine.test.js
node --test tests/bundle-examples.test.js
```

Tests are pure-JS where possible (no `@jscad/modeling` dependency for cycloid / gyroid / marching cubes). The `bundle-engine` and `bundle-examples` tests need `@jscad/modeling` available; set `NODE_PATH` if running outside the tool repo.

---

## Commit conventions

- Conventional commits: `feat(cycloidal):`, `fix(gyroid):`, `docs:`, `chore:`, `test:`, etc.
- One logical change per commit. The full plan-execution history on `main` is a good reference for granularity.
- Always run `./scripts/scrub-check.sh` before commit (it's not a hook — must be explicit).
- Don't force-push `main` once published. Use branches + PRs for any history rewrite (the two prior rewrites required full repo deletion + recreation to remove orphaned commit SHAs from GitHub's cache).

---

## What's outside this repo

- The **canonical readable engine source** is here, in `demos/engine/`. The bundle is a generated artifact.
- The **GPU waterblock** referenced in `EXAMPLES.md` is *not* in this repo. It's a private, in-flight engineering project. Don't try to import or vendor any waterblock files; the public reference is purely textual.
- The **spec and plan** that produced this repo (`docs/superpowers/specs/` and `docs/superpowers/plans/`) are gitignored. They're local working artifacts, not part of the public deliverable.
- The **skills** in `~/caliperhq/jscad-mcp/skills/` are the canonical "how to work on JSCAD with the MCP" docs. If you're hitting a problem this AGENTS.md doesn't cover, check there.

---

## When in doubt

- **Visual verification before declaring done.** Every geometry change goes through render → describe → compare → fix. That's the entire premise of the repo.
- **Read EXAMPLES.md's postscript** if you want a sense of the failure modes this codebase grew from.
- **Don't paper over a leak.** If `scrub-check.sh` fails, fix the leak; don't loosen the patterns.

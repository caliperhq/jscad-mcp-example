# jscad-mcp-example

Demo projects and walkthroughs for [jscad-mcp](https://github.com/caliperhq/jscad-mcp) — an MCP server that gives Claude visual and structural awareness of OpenJSCAD models.

Each demo is chosen because **it would be painful to design without the visual feedback loop**, and each leans on a different jscad-mcp feature (`take_standard_views`, `slice`, `list_parts` + `highlight` + `label_parts`).

## Gallery

| Cycloidal drive | Engine cutaway |
|---|---|
| [![cycloidal](examples/screenshots/cycloidal/iso.png)](EXAMPLES.md#cycloidal-drive-reducer) | [![engine](demos/engine/screenshots/slice_y.png)](EXAMPLES.md#cutaway-4-stroke-engine) |
| Named parts + highlight, with parametric cycloid profile. The "highlight" feature lets you spotlight any of the four named parts (`eccentric_input`, `cycloid_disc`, `pin_housing`, `output_pins`). | Cross-section `slice` view through a colored cutaway engine — block, head, piston, conrod, crank, valves, ports, spark plug. |

| Gyroid lattice | Engine — crank-angle sweep |
|---|---|
| [![gyroid](examples/screenshots/gyroid/iso.png)](EXAMPLES.md#gyroid-lattice-cube) | ![sweep](demos/engine/screenshots/crank_sweep.gif) |
| Marching-cubes-generated triply-periodic minimal surface. The `slice` tool reveals the iconic gyroid cross-section. | 12-frame parameter sweep stepping `crankAngle` 0° → 330°. Piston cycles TDC → BDC → TDC. |

Full walkthroughs, iteration GIFs, parameter docs, and openjscad.xyz "Try in browser" links: **[EXAMPLES.md](EXAMPLES.md)**.

## Quick start

```bash
git clone https://github.com/caliperhq/jscad-mcp-example.git
cd jscad-mcp-example
```

You can sanity-check the demos without any 3D rendering by requiring them:

```bash
node -e "require('./examples/cycloidal_drive.jscad').main()"
node -e "require('./demos/engine/assembly.js').main()"
node -e "require('./examples/gyroid.jscad').main()"
```

(For the above to find `@jscad/modeling`, either install it via `npm install @jscad/modeling` in this repo, or set `NODE_PATH` to a directory that has it.)

To **render** the demos visually you need [jscad-mcp](https://github.com/caliperhq/jscad-mcp) installed and connected to Claude. Or open any demo in your browser via the openjscad.xyz links in [EXAMPLES.md](EXAMPLES.md).

## Structure

```
examples/                    single-file demos
  cycloidal_drive.jscad
  gyroid.jscad
  lib/                       shared helpers (cycloid math, gyroid field, marching cubes + tables)
  screenshots/               per-demo screenshots + GIFs
demos/engine/                multi-file demo (cutaway engine)
  assembly.js                entry point
  block.js, head.js, ...     per-part modules
  engine_bundled.jscad       generated single-file bundle for openjscad.xyz
scripts/
  bundle-engine.js           regenerates engine_bundled.jscad
  scrub-check.sh             pre-push scrub verification (allowlist-based)
tests/                       unit tests for the math helpers
```

## Built with jscad-mcp

This repo was built in a single Claude Code session using the same jscad-mcp MCP server it demonstrates. The brainstorming phase [estimated about 9 hours of work](EXAMPLES.md#postscript-estimates-vs-reality) at human-developer pace; the actual perception loop — Claude writes geometry, Claude renders it, Claude sees what came out and adjusts — turns out to be a major accelerator. See the postscript in EXAMPLES.md for the full estimates-vs-reality story.

## License

MIT — see [LICENSE](LICENSE).

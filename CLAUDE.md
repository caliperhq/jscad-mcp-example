# CLAUDE.md

Repo-specific guidance for Claude Code sessions.

## Start here

Read **[AGENTS.md](AGENTS.md)** — it covers everything an agent needs to work in this repo:

- Persona + scrubbing rules (the public-repo identity must be `msd-hq <dev@caliperhq.dev>`; the scrub-check script is non-negotiable)
- Repo layout
- Demo conventions (defaults baked into `main`, precomputed `parts`, per-part `colorize`)
- The require-cache trap — multi-file demos *and* generated lib data (heightmaps, MC tables): both layers, with the cache-bust recipe
- Bundler regex limitations for new lib modules (single-line identifier-only exports, no rename destructuring)
- Image-input demo pipeline (`build-lithophane-data.js` template)
- Marching-cubes implicit-surface pattern
- Iteration GIF recipe (ffmpeg)
- Commit conventions

Everything in AGENTS.md applies to Claude Code too. The rest of this file is Claude-specific add-ons.

## Render via the MCP, not by guessing

This repo exists to demonstrate the jscad-mcp perception loop. **Use it.**

When `mcp__jscad__*` tools are available in the session:

- After any geometry change, call `mcp__jscad__take_standard_views` (or `take_image` for a custom angle, `slice` for cross-sections, `highlight` for parts) and describe what you see in one sentence per view. Don't say "done" without a visible verification.
- The MCP's `file` parameter shows stale geometry whenever a dependency changes without the entry file itself changing — both for the engine's sub-modules *and* for examples that import generated lib data (lithophane's heightmap, marching-cubes tables). Use inline `code:` with `delete require.cache[...]` AND a literal marker that varies between calls (pattern in AGENTS.md → "The require-cache trap").
- For parameter sweeps (e.g., the 12-frame crank sweep), each frame is one MCP call with inline `code:` that calls `mod.main({ <param>: value })`. Parallel calls are safe — each is content-hashed.
- For thin-relief panels (lithophane, embossed plaque, terrain): the printable defaults render as a nearly featureless rectangle because diffuse shading can't reveal sub-mm relief. Verify the geometry is correct via `list_parts` (bbox z range), then render at grazing elevation (~3°) or with exaggerated thickness for the hero shot.

## Install the companion skills

If they're not already in `~/.claude/skills/`, install from the tool repo for the best experience:

```bash
SKILLS_DIR="$HOME/.claude/skills"
mkdir -p "$SKILLS_DIR"
cp -r ~/caliperhq/jscad-mcp/skills/jscad-mcp     "$SKILLS_DIR/"
cp -r ~/caliperhq/jscad-mcp/skills/jscad          "$SKILLS_DIR/"
cp -r ~/caliperhq/jscad-mcp/skills/jscad-wiki     "$SKILLS_DIR/"
cp -r ~/caliperhq/jscad-mcp/skills/jscad-examples "$SKILLS_DIR/"
```

The skills capture (among other things) the lessons learned while building this repo: the require-cache trap, the `|f|-t` → `f²-t²` marching-cubes fix, the cycloidal Hugo-Elias profile, per-part coloring, multi-file bundling. If you hit a sharp edge that isn't in AGENTS.md, the skills probably already document it.

## Working artifacts stay local

`docs/superpowers/` is gitignored. If you're using the superpowers workflow (specs → plans → executing-plans), the spec and plan for this repo's original construction are at:

- `docs/superpowers/specs/2026-05-26-jscad-mcp-demos-design.md`
- `docs/superpowers/plans/2026-05-26-jscad-mcp-demos.md`

They're a useful reference but not committed by design.

## Pre-push checklist

Every push to `main` (or any public branch) must pass:

```bash
./scripts/scrub-check.sh
```

`scrub-check.sh` validates committer identity (allowlist), bans `/home/X/` / `/Users/X/` / `/mnt/X/` / `~/X/` paths in published files, applies the gitignored `.scrub-patterns.local` denylist, and checks for identifying EXIF on images. If it fails, fix the leak — don't loosen the patterns.

#!/usr/bin/env bash
# Pre-push scrub check. Blocks publication if:
#   1. Any committed file contains an absolute home-directory or mount path.
#   2. Any committed file contains a pattern listed in the gitignored
#      personal-denylist file (see PATTERNS_FILE below).
#   3. Any commit's author or committer is NOT in the identity allowlist.
#   4. Any image has identifying EXIF (Author/Artist/Copyright/GPS/Software).
#
# This script is committed to the public repo, so it carries NO literal
# personal-identifier strings. Owner-specific patterns live in the
# gitignored denylist file consumed by check #2.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FAIL=0

TARGETS=()
for t in examples demos scripts README.md EXAMPLES.md; do
  [ -e "$t" ] && TARGETS+=("$t")
done

# --- 1. Local filesystem path leaks in published files ---
echo "== Scanning published files for local filesystem paths =="
if [ ${#TARGETS[@]} -gt 0 ] && \
   grep -rIniE '(/home/[A-Za-z0-9._-]+/|/Users/[A-Za-z0-9._-]+/|/mnt/[A-Za-z0-9._-]+/|~/[A-Za-z0-9._-]+)' \
    --include='*.md' --include='*.js' --include='*.jscad' --include='*.sh' \
    "${TARGETS[@]}" 2>/dev/null; then
  echo "  FAIL: local filesystem path leak above"
  FAIL=1
fi

# --- 2. Local denylist (gitignored file) ---
PATTERNS_FILE=".scrub-patterns.local"
if [ -f "$PATTERNS_FILE" ] && [ ${#TARGETS[@]} -gt 0 ]; then
  echo "== Scanning published files against $PATTERNS_FILE =="
  if grep -rIniF -f "$PATTERNS_FILE" \
      --include='*.md' --include='*.js' --include='*.jscad' --include='*.sh' \
      "${TARGETS[@]}" 2>/dev/null; then
    echo "  FAIL: forbidden pattern from $PATTERNS_FILE matched above"
    FAIL=1
  fi
fi

# --- 3. Allowed committer / author identities ---
# Allowlist. Anything else fails. Add patterns here if more identities are valid.
ALLOWED_NAME_REGEX='^(msd-hq|msd|caliperhq)$'
ALLOWED_EMAIL_REGEX='^(dev@caliperhq\.dev|[0-9]+\+[A-Za-z0-9._-]+@users\.noreply\.github\.com|noreply@github\.com)$'

if git rev-parse --git-dir >/dev/null 2>&1; then
  echo "== Verifying every git log identity is allowlisted =="
  while IFS=$'\t' read -r who name email; do
    if ! printf '%s' "$name" | grep -qE "$ALLOWED_NAME_REGEX"; then
      echo "  FAIL: unrecognized $who name: $name <$email>"
      FAIL=1
    elif ! printf '%s' "$email" | grep -qE "$ALLOWED_EMAIL_REGEX"; then
      echo "  FAIL: unrecognized $who email: $name <$email>"
      FAIL=1
    fi
  done < <({
    git log --all --format='author%x09%an%x09%ae' 2>/dev/null
    git log --all --format='committer%x09%cn%x09%ce' 2>/dev/null
  } | sort -u)
fi

# --- 4. EXIF metadata in published images ---
echo "== Scanning images for identifying EXIF =="
while IFS= read -r -d '' img; do
  if exiftool -s -G "$img" 2>/dev/null | \
      grep -iE '(GPS|Author|Copyright|Owner|UserComment|Artist|Software:)' >/dev/null; then
    echo "  FAIL: $img has identifying EXIF"
    FAIL=1
  fi
done < <(find . -type f \( -iname '*.jpg' -o -iname '*.png' -o -iname '*.gif' \) \
         -not -path './.git/*' -print0)

if [ $FAIL -eq 0 ]; then
  echo "OK: scrub check passed"
fi
exit $FAIL

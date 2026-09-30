#!/usr/bin/env bash
# Rebuild js/plan-engine.js from the APP repo's origin/main (read-only).
# Run after any change to the app's drills, estimator or plan engine, then
# redeploy the lead-plan function's drills.json from the same commit.
#   APP_REPO=~/dev/sz-calc-embed scripts/build-plan-engine.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SITE="$(dirname "$HERE")"
APP_REPO="${APP_REPO:-$HOME/dev/sz-calc-embed}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
git -C "$APP_REPO" fetch -q origin main
REV="$(git -C "$APP_REPO" rev-parse --short origin/main)"
git -C "$APP_REPO" archive origin/main src | tar -x -C "$TMP"
# The engine reaches the app's store only for types and one helper it never calls;
# the store would drag in Supabase and zustand. Swap it for a stand-in, in the copy only.
cp "$HERE/plan-engine/stubs/store.ts" "$TMP/src/lib/store.ts"
npx --yes esbuild@0.24.0 "$HERE/plan-engine/entry.ts" --bundle --format=iife --global-name=SZEngine \
  --alias:@="$TMP/src" --alias:lucide-react="$HERE/plan-engine/stubs/lucide.ts" --target=es2018 --minify --legal-comments=none \
  --banner:js="/* Scoring Zone plan engine, built from the-scoring-zone@$REV by scripts/build-plan-engine.sh. Do not edit. */" \
  --outfile="$SITE/js/plan-engine.js"
echo "built js/plan-engine.js from app@$REV"

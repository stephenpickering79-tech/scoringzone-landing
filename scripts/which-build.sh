#!/usr/bin/env bash
# Which landing-page tree is the CURRENT build?
# Build number = commit count on HEAD. Highest number wins. Lower numbers are dead.
# Run this BEFORE editing anything. Never edit a tree that is not the winner.
set -uo pipefail

TREES=(
  "$HOME/dev/scoringzone-landing"
  "$HOME/dev/scoring-zone-landing"
  "$HOME/Documents/Claude Code/Landing Page"
)

best_n=-1; best_d=""
printf '%-8s %-10s %-26s %s\n' "BUILD" "HEAD" "DATE" "TREE"
for d in "${TREES[@]}"; do
  [ -d "$d/.git" ] || continue
  n=$(git -C "$d" rev-list --count HEAD 2>/dev/null) || continue
  printf '%-8s %-10s %-26s %s\n' "$n" \
    "$(git -C "$d" log -1 --format=%h)" \
    "$(git -C "$d" log -1 --format=%ci)" "$d"
  if [ "$n" -gt "$best_n" ]; then best_n=$n; best_d=$d; fi
done

echo
echo "CURRENT BUILD: $best_n"
echo "EDIT ONLY:     $best_d"

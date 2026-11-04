#!/usr/bin/env python3
"""Check that no published page loads a file that .vercelignore leaves out.

Works out what Vercel deploys (tracked files minus .vercelignore matches),
reads every published .html / .css / .js file, resolves each local reference
the way Vercel serves it (cleanUrls: "/about" -> about.html, "/blog/" ->
blog/index.html, plus vercel.json redirects and rewrites), and reports:

  IGNORED  a published file references something .vercelignore removes.
           This is what a new ignore pattern can break, so it fails the run.
  MISSING  a reference that resolves to nothing even today. Listed for
           information; these were broken before .vercelignore existed.

Usage:
  python3 scripts/check_deploy_refs.py                 # use ./.vercelignore
  python3 scripts/check_deploy_refs.py --ignore-file /dev/null   # as if none
  python3 scripts/check_deploy_refs.py --list-ignored  # print removed files

Run it from the repo root. Exit status 1 when any IGNORED reference exists.
"""
import argparse
import json
import os
import posixpath
import re
import subprocess
import sys
from urllib.parse import unquote, urlsplit

SITE_HOSTS = {"www.scoringzone.net", "scoringzone.net"}
SCAN_EXT = (".html", ".css", ".js")
ASSET_EXT = r"(?:webp|png|jpe?g|gif|svg|ico|avif|mp4|webm|mov|mp3|wav|m4a|woff2?|ttf|otf|css|js|json|pdf|txt|xml)"

ATTR_RE = re.compile(r'\b(?:src|href|poster|data-src|data-bg|data-image)\s*=\s*"([^"]*)"|'
                     r"\b(?:src|href|poster|data-src|data-bg|data-image)\s*=\s*'([^']*)'", re.I)
# <meta content="..."> only counts when it holds a URL (og:image, twitter:image).
META_URL_RE = re.compile(r'\bcontent\s*=\s*"((?:https?://|/)[^"\s]*)"', re.I)
SRCSET_RE = re.compile(r'\bsrcset\s*=\s*"([^"]*)"', re.I)
CSS_URL_RE = re.compile(r'url\(\s*["\']?([^"\')]+?)["\']?\s*\)', re.I)
JS_ASSET_RE = re.compile(r'["\']([^"\'\s<>()]+\.' + ASSET_EXT + r')["\']', re.I)


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout


def tracked_files():
    return set(git("ls-files", "-z").split("\0")) - {""}


def ignored_files(ignore_file):
    if not os.path.exists(ignore_file) or os.path.getsize(ignore_file) == 0:
        return set()
    out = git("ls-files", "-z", "-c", "-i", "--exclude-from=" + ignore_file)
    return set(out.split("\0")) - {""}


def read(path):
    if os.path.exists(path):
        with open(path, encoding="utf-8", errors="replace") as fh:
            return fh.read()
    # Sparse checkouts leave some tracked files off disk; read them from git.
    return subprocess.run(["git", "show", "HEAD:" + path], capture_output=True,
                          text=True, errors="replace").stdout


def route_prefixes():
    """Path prefixes that vercel.json redirects or rewrites answer for."""
    try:
        with open("vercel.json", encoding="utf-8") as fh:
            cfg = json.load(fh)
    except FileNotFoundError:
        return []
    prefixes = []
    for rule in cfg.get("redirects", []) + cfg.get("rewrites", []):
        src = unquote(rule.get("source", ""))
        cut = re.split(r"[:(]", src, maxsplit=1)[0]
        if cut and cut != "/":
            prefixes.append(cut.lstrip("/"))
    return prefixes


def candidates(path):
    """Files Vercel could serve for a request path (cleanUrls on)."""
    p = path.strip("/")
    if p == "":
        return ["index.html"]
    return [p, p + ".html", posixpath.join(p, "index.html")]


def refs_in(path, text):
    found = []
    if path.endswith(".html"):
        for m in ATTR_RE.finditer(text):
            found.append(m.group(1) if m.group(1) is not None else m.group(2))
        found.extend(m.group(1) for m in META_URL_RE.finditer(text))
        for m in SRCSET_RE.finditer(text):
            found.extend(part.strip().split(" ")[0] for part in m.group(1).split(","))
    if path.endswith((".html", ".css")):
        found.extend(m.group(1) for m in CSS_URL_RE.finditer(text))
    if path.endswith(".js"):
        found.extend(m.group(1) for m in JS_ASSET_RE.finditer(text))
    return found


def resolve(ref, from_file):
    """Return a repo-relative path for a local reference, or None to skip it."""
    ref = ref.strip()
    if not ref or ref.startswith(("#", "%23", "mailto:", "tel:", "javascript:", "data:", "{", "$")):
        return None
    if any(t in ref for t in ("${", "' +", "+ '", "{{")):
        return None
    parts = urlsplit(ref)
    if parts.scheme in ("http", "https"):
        if parts.hostname not in SITE_HOSTS:
            return None
        path = parts.path
    elif parts.scheme or ref.startswith("//"):
        return None
    else:
        path = parts.path
    if not path:
        return None
    path = unquote(path)
    if path.startswith("/"):
        joined = path
    elif from_file.endswith(".js"):
        # Scripts build asset URLs against the page, which is almost always the
        # site root or one level down; resolve against the root.
        joined = "/" + re.sub(r"^(\.\./|\./)+", "", path)
    else:
        joined = "/" + posixpath.join(posixpath.dirname(from_file), path)
    norm = posixpath.normpath(joined)
    if joined.endswith("/") and not norm.endswith("/"):
        norm += "/"
    return norm.lstrip("/") if norm != "/" else ""


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--ignore-file", default=".vercelignore")
    ap.add_argument("--list-ignored", action="store_true")
    args = ap.parse_args()

    tracked = tracked_files()
    ignored = ignored_files(args.ignore_file)
    published = tracked - ignored
    prefixes = route_prefixes()

    if args.list_ignored:
        for f in sorted(ignored):
            print(f)
        print(f"\n{len(ignored)} tracked files left out, {len(published)} published.")
        return 0

    bad_ignored, bad_missing = {}, {}
    scanned = 0
    for page in sorted(f for f in published if f.endswith(SCAN_EXT)):
        scanned += 1
        for ref in refs_in(page, read(page)):
            target = resolve(ref, page)
            if target is None:
                continue
            opts = candidates(target)
            if any(o in published for o in opts):
                continue
            if any(target.startswith(px) or ("/" + target).startswith(px) for px in prefixes):
                continue
            bucket = bad_ignored if any(o in ignored for o in opts) else bad_missing
            bucket.setdefault((ref, target), set()).add(page)

    print(f"Published files: {len(published)}  (left out: {len(ignored)})")
    print(f"Scanned {scanned} published .html/.css/.js files.\n")

    def show(title, bucket):
        print(f"{title}: {len(bucket)}")
        for (ref, target), pages in sorted(bucket.items()):
            shown = ", ".join(sorted(pages)[:3]) + (f" (+{len(pages) - 3} more)" if len(pages) > 3 else "")
            print(f"  {ref!r} -> {target}   in {shown}")
        print()

    show("IGNORED (would break after deploy)", bad_ignored)
    show("MISSING (already broken, not caused by .vercelignore)", bad_missing)
    return 1 if bad_ignored else 0


if __name__ == "__main__":
    sys.exit(main())

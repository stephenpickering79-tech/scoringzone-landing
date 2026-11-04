#!/usr/bin/env python3
"""Remove links from indexable pages to blog posts that carry noindex.

A noindex post is one we have chosen to keep out of Google. Linking to it from
indexable pages sends readers and link value into a dead end, so this script
removes those links. It only removes links that stand alone as their own block:
a related-post card, a hub-list entry or a "read next" callout, i.e. an <a>
element that starts and ends on lines of its own. A link inside a sentence is
never touched; it is reported so a person can rewrite that sentence.

It also reports vercel.json redirects that land on a noindex post, and any
noindex URL still listed in sitemap.xml or llms.txt.

Usage (from the repo root):
  python3 scripts/unlink_hidden_posts.py              # dry run, prints the plan
  python3 scripts/unlink_hidden_posts.py --write      # apply
  python3 scripts/unlink_hidden_posts.py --write --skip blog/putting-guide.html

Safe to re-run: once a link is gone there is nothing left to remove.
"""
import argparse
import json
import os
import re
import subprocess
import sys

NOINDEX_RE = re.compile(r'<meta\s+name="robots"\s+content="[^"]*noindex', re.I)
# Pages that are not part of the public site (see .vercelignore).
NOT_PUBLIC = ("homepage-redesign.html", "blog-ad-preview.html", "popup-preview.html",
              "preview-subtext-styles.html", "scrolling-reveal-preview.html",
              "email-signature.html", "hero-previews/", "professionals/preview.html",
              "blog/images/", "social-templates/", "video-templates/", "reels/",
              "scrolling-reveal/", "18 birdies brand/", "Scoring Zone for Professional Coaches/")


def html_files():
    out = subprocess.run(["git", "ls-files", "-z", "*.html"], capture_output=True, text=True, check=True).stdout
    return [f for f in out.split("\0") if f and os.path.exists(f) and not f.startswith(NOT_PUBLIC)]


def slug_of(href):
    path = href.split("#")[0].split("?")[0].rstrip("/")
    return path.split("/")[-1].removesuffix(".html")


def links_to(href, page, hidden):
    """True when href points at one of the hidden blog posts."""
    path = href.split("#")[0].split("?")[0]
    if path.startswith(("http://", "https://")):
        if "scoringzone.net/blog/" not in path:
            return False
    elif "/" in path.strip("/") or path.startswith("/"):
        if "blog/" not in path:
            return False
    elif not page.startswith("blog/"):
        return False  # a bare relative slug only means a blog post from inside /blog/
    return slug_of(path) in hidden


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="apply the changes")
    ap.add_argument("--skip", action="append", default=[], help="page to leave untouched")
    args = ap.parse_args()

    pages = html_files()
    texts = {p: open(p, encoding="utf-8").read() for p in pages}
    hidden = {slug_of(p) for p, t in texts.items() if p.startswith("blog/") and NOINDEX_RE.search(t)}
    print(f"{len(hidden)} noindex posts: {', '.join(sorted(hidden))}\n")

    anchor = re.compile(r'(?m)^[ \t]*<a\b[^>]*\bhref="([^"]*)"[^>]*>.*?</a>[ \t]*\n', re.S)
    any_anchor = re.compile(r'<a\b[^>]*\bhref="([^"]*)"', re.I)
    removed_total, inline = 0, []

    for page in sorted(pages):
        text = texts[page]
        if NOINDEX_RE.search(text) or page in args.skip:
            continue
        removed = []

        def drop(m):
            block = m.group(0)
            # A standalone block holds exactly one link; anything else is left alone.
            if len(any_anchor.findall(block)) != 1 or not links_to(m.group(1), page, hidden):
                return block
            removed.append(slug_of(m.group(1)))
            return ""

        new = anchor.sub(drop, text)
        for m in any_anchor.finditer(new):
            if links_to(m.group(1), page, hidden):
                line = new[:m.start()].count("\n") + 1
                inline.append(f"{page}:{line} -> {slug_of(m.group(1))}")
        if removed:
            removed_total += len(removed)
            print(f"{page}: remove {len(removed)} ({', '.join(removed)})")
            if args.write:
                with open(page, "w", encoding="utf-8") as fh:
                    fh.write(new)

    print(f"\n{'Removed' if args.write else 'Would remove'} {removed_total} standalone links.")
    if args.skip:
        print("Skipped: " + ", ".join(args.skip))
    print(f"\nLinks inside running text (not touched, rewrite by hand): {len(inline)}")
    for item in inline:
        print("  " + item)

    problems = 0
    with open("vercel.json", encoding="utf-8") as fh:
        cfg = json.load(fh)
    for r in cfg.get("redirects", []):
        dest = r.get("destination", "")
        if dest.startswith("/blog/") and slug_of(dest) in hidden:
            problems += 1
            print(f"vercel.json: {r['source']} -> {dest} lands on a noindex post")
    for listing in ("sitemap.xml", "llms.txt"):
        if os.path.exists(listing):
            body = open(listing, encoding="utf-8").read()
            for slug in sorted(hidden):
                if re.search(r"/blog/" + re.escape(slug) + r"(?:\.html)?[\s<)\"]", body):
                    problems += 1
                    print(f"{listing}: still lists /blog/{slug}")
    print(f"\nRedirect / listing problems: {problems}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

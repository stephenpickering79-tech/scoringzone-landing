#!/usr/bin/env python3
"""Give every <img> on the public site its intrinsic width and height, and set
how blog-post images load.

Why the dimensions: an <img> without width and height has no box until the file
arrives, so everything below it jumps (CLS). With both attributes the browser
reserves the right aspect ratio before the download. css/shared.css carries

    :where(img[width][height]) { height: auto; }

so an attribute height never stretches an image whose CSS sets only a width.
That rule has zero specificity: any class rule, page <style> or inline style
that sets a height on purpose still wins. The pages that do not load
shared.css (features/*.html, tools/*.html) carry the same line in their own
<style>; a new page that loads neither needs it too.

Why the loading pass (blog/*.html only): the hero photo under the post title is
the LCP element on mobile, so it gets fetchpriority="high" and is never lazy.
Every later content image gets loading="lazy" if it has no loading attribute.
Site logos are left alone (the nav already loaded the same file).

Idempotent. A tag that already has both attributes is not touched, and the
loading pass only adds what is missing, so re-running after other branches
merge only picks up new tags.

    python3 scripts/add_img_dimensions.py          # write the changes
    python3 scripts/add_img_dimensions.py --check  # change nothing; exit 1 if anything would change

Needs Pillow (pip install Pillow).
"""

import argparse
import fnmatch
import os
import re
import sys
from collections import Counter, defaultdict
from urllib.parse import unquote, urlparse

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Pages that exist in the repo but are not part of the public site: previews,
# templates that render social/OG images, and asset folders. Paths are relative
# to the repo root; a trailing slash means the whole folder. Anything listed in
# .vercelignore is skipped as well.
INTERNAL = [
    "homepage-redesign.html",
    "blog-ad-preview.html",
    "popup-preview.html",
    "preview-subtext-styles.html",
    "scrolling-reveal-preview.html",
    "email-signature.html",
    "email-signatures/",
    "hero-previews/",
    "professionals/preview.html",
    "blog/images/",
    "Scoring Zone for Professional Coaches/",
    "scrolling-reveal/",
    "18 birdies brand/",
    "reels/",
    "Images for n8n/",
    "social-assets/",
    "email-assets/",
    "video-assets/",
    "video-templates/",
    "social-templates/",
    "scripts/",
    "node_modules/",
]

SITE_HOSTS = {"www.scoringzone.net", "scoringzone.net"}

# An <img ...> tag, allowing ">" inside quoted attribute values.
IMG_RE = re.compile(r"<img\b(?:[^>\"']|\"[^\"]*\"|'[^']*')*>", re.I)
# Regions where an <img> is not markup: scripts, comments, templates.
SKIP_RE = re.compile(r"<script\b.*?</script\s*>|<!--.*?-->|<template\b.*?</template\s*>", re.I | re.S)


def attr_re(name):
    # Preceded by whitespace so "src" never matches "data-src".
    return re.compile(r"(?<=\s)" + name + r"\s*=\s*(\"[^\"]*\"|'[^']*'|[^\s\"'>]+)", re.I)


SRC_RE, SRCSET_RE = attr_re("src"), attr_re("srcset")
WIDTH_RE, HEIGHT_RE = attr_re("width"), attr_re("height")
LOADING_RE, FETCHPRIORITY_RE = attr_re("loading"), attr_re("fetchpriority")


def value(m):
    v = m.group(1)
    return v[1:-1] if v[:1] in "\"'" else v


# ── Which pages are public ────────────────────────────────────────────────────

def vercelignore_patterns():
    path = os.path.join(ROOT, ".vercelignore")
    if not os.path.isfile(path):
        return []
    pats = []
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith(("#", "!")):
            pats.append(line.lstrip("/"))
    return pats


def is_internal(rel, extra):
    for pat in INTERNAL + extra:
        if pat.endswith("/"):
            if rel.startswith(pat) or fnmatch.fnmatch(rel, pat + "*"):
                return True
        elif rel == pat or fnmatch.fnmatch(rel, pat) or rel.startswith(pat + "/"):
            return True
    return False


def public_pages():
    extra = vercelignore_patterns()
    out = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if not d.startswith(".")]
        for f in filenames:
            if f.endswith(".html"):
                rel = os.path.relpath(os.path.join(dirpath, f), ROOT).replace(os.sep, "/")
                if not is_internal(rel, extra):
                    out.append(rel)
    return sorted(out)


# ── Image files ───────────────────────────────────────────────────────────────

def resolve(page, src):
    """Map an src to a file in the repo. Returns (path, None) or (None, reason)."""
    src = src.strip()
    if not src:
        return None, "empty src"
    if src.startswith("data:"):
        return None, "data: URI"
    if src.startswith(("http://", "https://", "//")):
        u = urlparse("https:" + src if src.startswith("//") else src)
        if u.netloc.lower() not in SITE_HOSTS:
            return None, "external URL"
        src = u.path
    path = unquote(src.split("#")[0].split("?")[0])
    if path.startswith("/"):
        fp = os.path.join(ROOT, path.lstrip("/"))
    else:
        fp = os.path.normpath(os.path.join(ROOT, os.path.dirname(page), path))
    if not os.path.isfile(fp):
        return None, "file not found"
    return fp, None


_size_cache = {}


def svg_size(fp):
    head = open(fp, encoding="utf-8", errors="ignore").read(4096)
    m = re.search(r"<svg\b[^>]*>", head, re.I | re.S)
    if not m:
        return None
    tag = m.group(0)

    def num(name):
        a = re.search(r"\s" + name + r"\s*=\s*[\"']\s*([\d.]+)\s*(px)?\s*[\"']", tag)
        return float(a.group(1)) if a else None

    w, h = num("width"), num("height")
    if w and h:
        return round(w), round(h)
    vb = re.search(r"viewBox\s*=\s*[\"']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)", tag)
    if vb:
        return round(float(vb.group(1))), round(float(vb.group(2)))
    return None


def intrinsic_size(fp):
    if fp in _size_cache:
        return _size_cache[fp]
    size = None
    if fp.lower().endswith(".svg"):
        size = svg_size(fp)
    else:
        try:
            with Image.open(fp) as im:
                size = im.size
                # Browsers apply EXIF rotation, so a rotated JPEG's box is swapped.
                try:
                    if im.getexif().get(0x0112) in (5, 6, 7, 8):
                        size = (size[1], size[0])
                except Exception:
                    pass
        except Exception:
            size = None
    _size_cache[fp] = size
    return size


# ── Pass 1: width and height ──────────────────────────────────────────────────

def skip_spans(html):
    return [m.span() for m in SKIP_RE.finditer(html)]


def in_spans(pos, spans):
    return any(a <= pos < b for a, b in spans)


def as_int(s):
    try:
        return int(float(s))
    except ValueError:
        return None


def add_dimensions(page, html, stats, problems):
    spans = skip_spans(html)
    out, last = [], 0
    for m in IMG_RE.finditer(html):
        if in_spans(m.start(), spans):
            continue
        tag = m.group(0)
        stats["tags"] += 1
        wm, hm = WIDTH_RE.search(tag), HEIGHT_RE.search(tag)
        if wm and hm:
            continue
        line = html.count("\n", 0, m.start()) + 1
        sm = SRC_RE.search(tag)
        if not sm:
            sm = SRCSET_RE.search(tag)
            src = value(sm).split(",")[0].strip().split(" ")[0] if sm else ""
            if sm:
                problems.append((page, line, src, "has srcset but no src"))
            else:
                problems.append((page, line, "", "no src"))
            continue
        src = value(sm)
        fp, why = resolve(page, src)
        if not fp:
            problems.append((page, line, src, why))
            continue
        size = intrinsic_size(fp)
        if not size or not size[0] or not size[1]:
            problems.append((page, line, src, "could not read image size"))
            continue
        iw, ih = size
        if wm and not hm:
            w = as_int(value(wm))
            if not w:
                problems.append((page, line, src, "non-numeric width"))
                continue
            new = tag[: wm.end()] + f' height="{round(w * ih / iw)}"' + tag[wm.end():]
        elif hm and not wm:
            h = as_int(value(hm))
            if not h:
                problems.append((page, line, src, "non-numeric height"))
                continue
            new = tag[: hm.start()] + f'width="{round(h * iw / ih)}" ' + tag[hm.start():]
        else:
            new = tag[: sm.end()] + f' width="{iw}" height="{ih}"' + tag[sm.end():]
        out.append(html[last : m.start()])
        out.append(new)
        last = m.end()
        stats["dimensioned"] += 1
        stats["images:" + os.path.relpath(fp, ROOT)] += 1
    out.append(html[last:])
    return "".join(out)


# ── Pass 2: blog image loading ────────────────────────────────────────────────

def is_logo(tag):
    sm = SRC_RE.search(tag)
    return bool(sm) and "/logo/" in "/" + value(sm).lstrip("./")


def set_blog_loading(page, html, stats, notes):
    """Hero (first <img> after the <h1>, inside the h1's <section>) gets
    fetchpriority="high" and loses loading="lazy"; every later non-logo <img>
    without a loading attribute gets loading="lazy"."""
    h1 = re.search(r"<h1\b", html, re.I)
    if not h1:
        notes.append((page, "no <h1>; loading left alone"))
        return html
    section_end = html.find("</section", h1.end())
    if section_end == -1:
        section_end = len(html)
    spans = skip_spans(html)
    tags = [m for m in IMG_RE.finditer(html, h1.end()) if not in_spans(m.start(), spans)]
    hero = next((m for m in tags if m.start() < section_end and not is_logo(m.group(0))), None)
    if hero is None:
        notes.append((page, "no hero image under the <h1>; only lazy-loading later images"))

    out, last = [], 0
    for m in tags:
        tag = new = m.group(0)
        if m is hero:
            lm = LOADING_RE.search(new)
            if lm and value(lm).lower() == "lazy":
                new = new[: lm.start()].rstrip() + new[lm.end():]
                stats["hero_unlazied"] += 1
            fm = FETCHPRIORITY_RE.search(new)
            if not fm:
                # Append as the last attribute, keeping any whitespace before ">".
                end = len(new) - (2 if new.endswith("/>") else 1)
                body = new[:end].rstrip()
                new = body + ' fetchpriority="high"' + new[len(body):]
                stats["hero_fetchpriority"] += 1
            elif value(fm).lower() != "high":
                new = new[: fm.start()] + 'fetchpriority="high"' + new[fm.end():]
                stats["hero_fetchpriority"] += 1
        elif hero is None or m.start() > hero.start():
            if not LOADING_RE.search(new) and not is_logo(new):
                new = "<img loading=\"lazy\"" + new[4:]
                stats["lazy_added"] += 1
        if new != tag:
            out.append(html[last : m.start()])
            out.append(new)
            last = m.end()
    out.append(html[last:])
    return "".join(out)


def is_blog_post(rel):
    return rel.startswith("blog/") and rel.count("/") == 1 and rel != "blog/index.html"


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--check", action="store_true", help="report only; exit 1 if any file would change")
    args = ap.parse_args()

    stats, problems, notes = Counter(), [], []
    changed = []
    pages = public_pages()
    for page in pages:
        path = os.path.join(ROOT, page)
        with open(path, encoding="utf-8", newline="") as f:
            html = f.read()
        new = add_dimensions(page, html, stats, problems)
        if is_blog_post(page):
            new = set_blog_loading(page, new, stats, notes)
        if new != html:
            changed.append(page)
            if not args.check:
                with open(path, "w", encoding="utf-8", newline="") as f:
                    f.write(new)

    images = {k: v for k, v in stats.items() if k.startswith("images:")}
    verb = "would change" if args.check else "changed"
    print(f"Public pages scanned:        {len(pages)}")
    print(f"<img> tags scanned:          {stats['tags']}")
    print(f"width/height added:          {stats['dimensioned']} tags, {len(images)} distinct images")
    print(f"blog hero fetchpriority:     {stats['hero_fetchpriority']} added/raised, {stats['hero_unlazied']} un-lazied")
    print(f"blog loading=\"lazy\" added:   {stats['lazy_added']}")
    print(f"Files {verb}:{' ' * (19 - len(verb))}{len(changed)}")
    for page in changed:
        print(f"  {page}")
    if notes:
        print(f"\nBlog posts without a hero image ({len(notes)}):")
        for page, note in notes:
            print(f"  {page}: {note}")
    print(f"\nImages left without width/height ({len(problems)}):")
    for page, line, src, why in problems:
        print(f"  {page}:{line}  {why}  {src}")
    if args.check and changed:
        sys.exit(1)


if __name__ == "__main__":
    main()

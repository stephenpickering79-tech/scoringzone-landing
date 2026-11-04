#!/usr/bin/env python3
"""Give each blog post its own share image and an Article schema image.

For every indexable post in blog/ (noindex posts are skipped):

  * The hero photo is the first content <img> after the <h1> and before the
    first <h2> (logos, badges, icons and the author photo don't count).
  * Article / BlogPosting JSON-LD gets "image": the hero photo's absolute URL,
    when it has no image yet. Google reads WebP, so the original file is used.
  * og:image and twitter:image point at a JPEG copy of the hero photo when the
    photo is at least 1200 px wide. Some share scrapers (LinkedIn in
    particular) do not reliably render WebP, so the copy is a JPEG, written to
    og-images/<photo-name>.jpg at most 1200 px wide with no crop. Smaller heroes
    keep the site-wide /og-image.png.
  * A post that already names its own og:image keeps it, as long as the file
    exists. A share image pointing at a missing file is replaced.
  * og:image:width / og:image:height always match the image actually used.

newsletter/index.html and tools/index.html, which had no share image at all,
get /og-image.png with its dimensions.

Usage (from the repo root, needs Pillow):
  python3 scripts/set_share_images.py            # dry run
  python3 scripts/set_share_images.py --write    # apply
Safe to re-run: pages that are already done are left as they are.
"""
import argparse
import glob
import json
import os
import re
import sys
from urllib.parse import quote, unquote

from PIL import Image

SITE = "https://www.scoringzone.net"
DEFAULT_OG = SITE + "/og-image.png"
OG_DIR = "og-images"
MIN_OG_WIDTH = 1200
NOINDEX_RE = re.compile(r'<meta\s+name="robots"\s+content="[^"]*noindex', re.I)
NOT_CONTENT = re.compile(r"logo|badge|authors/|icon", re.I)
LD_RE = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.S)


def abs_url(repo_path):
    return SITE + "/" + quote(repo_path)


def local_path(url):
    """Repo path for an absolute site URL, or None for other hosts."""
    if not url.startswith(SITE + "/"):
        return None
    return unquote(url[len(SITE) + 1:])


def hero_of(page, html):
    h1 = re.search(r"<h1\b", html)
    if not h1:
        return None
    h2 = re.search(r"<h2\b", html[h1.end():])
    stop = h1.end() + h2.start() if h2 else len(html)
    for m in re.finditer(r'<img\b[^>]*\bsrc="([^"]+)"', html[h1.end():stop]):
        src = m.group(1)
        if NOT_CONTENT.search(src) or src.startswith(("http", "data:")):
            continue
        path = os.path.normpath(os.path.join(os.path.dirname(page), unquote(src)))
        return path if os.path.exists(path) else None
    return None


def jpeg_copy(src, write):
    name = re.sub(r"[^a-z0-9]+", "-", os.path.splitext(os.path.basename(src))[0].lower()).strip("-")
    out = os.path.join(OG_DIR, name + ".jpg")
    with Image.open(src) as im:
        w, h = im.size
        scale = min(1.0, MIN_OG_WIDTH / w)
        size = (round(w * scale), round(h * scale))
        if write and not os.path.exists(out):
            os.makedirs(OG_DIR, exist_ok=True)
            im.convert("RGB").resize(size, Image.LANCZOS).save(out, "JPEG", quality=82, optimize=True, progressive=True)
    return out, size


def set_meta(html, prop, attr, value):
    """Replace a meta tag's content, or add it after og:image / og:url."""
    pat = re.compile(r'(<meta\s+' + attr + r'="' + re.escape(prop) + r'"\s+content=")[^"]*(")')
    if pat.search(html):
        return pat.sub(lambda m: m.group(1) + value + m.group(2), html, count=1)
    anchor = re.search(r'(?m)^([ \t]*)<meta\s+property="og:image"\s+content="[^"]*">[ \t]*\n', html) \
        or re.search(r'(?m)^([ \t]*)<meta\s+property="og:url"\s+content="[^"]*">[ \t]*\n', html)
    if not anchor:
        raise ValueError("no og:image or og:url tag to anchor " + prop)
    line = f'{anchor.group(1)}<meta {attr}="{prop}" content="{value}">\n'
    return html[:anchor.end()] + line + html[anchor.end():]


def set_size_tags(html, w, h):
    html = re.sub(r'(?m)^[ \t]*<meta\s+property="og:image:(?:width|height)"\s+content="[^"]*">[ \t]*\n', "", html)
    m = re.search(r'(?m)^([ \t]*)<meta\s+property="og:image"\s+content="[^"]*">[ \t]*\n', html)
    ind = m.group(1)
    extra = f'{ind}<meta property="og:image:width" content="{w}">\n{ind}<meta property="og:image:height" content="{h}">\n'
    return html[:m.end()] + extra + html[m.end():]


def add_article_image(html, url):
    """Insert "image" into the Article/BlogPosting node that lacks one."""
    def fix(m):
        body = m.group(2)
        data = json.loads(body)
        nodes = data.get("@graph", [data]) if isinstance(data, dict) else data
        if not any(isinstance(n, dict) and n.get("@type") in ("Article", "BlogPosting") and not n.get("image")
                   for n in nodes):
            return m.group(0)
        hl = re.search(r'(?m)^([ \t]*)"headline"\s*:\s*"(?:[^"\\]|\\.)*",[ \t]*\n', body)
        if not hl:
            raise ValueError("Article has no headline line to anchor image")
        new_body = body[:hl.end()] + f'{hl.group(1)}"image": "{url}",\n' + body[hl.end():]
        json.loads(new_body)  # must still parse
        return m.group(1) + new_body + m.group(3)
    return LD_RE.sub(fix, html)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()
    with Image.open("og-image.png") as im:
        default_size = im.size

    counts = {"own_og": 0, "default_og": 0, "kept_og": 0, "schema_image": 0, "no_hero": 0, "changed": 0}
    for page in sorted(glob.glob("blog/*.html")):
        if page.endswith("index.html"):
            continue
        html = open(page, encoding="utf-8").read()
        if NOINDEX_RE.search(html):
            continue
        new = html
        hero = hero_of(page, html)
        current = re.search(r'property="og:image"\s+content="([^"]+)"', html)
        current = current.group(1) if current else DEFAULT_OG
        cur_path = local_path(current)
        custom_ok = current != DEFAULT_OG and cur_path and os.path.exists(cur_path) \
            and not cur_path.startswith(OG_DIR + "/")

        if custom_ok:
            og_url, og_file = current, cur_path
            counts["kept_og"] += 1
        elif hero and Image.open(hero).size[0] >= MIN_OG_WIDTH:
            og_file, _ = jpeg_copy(hero, args.write)
            og_url = abs_url(og_file)
            counts["own_og"] += 1
        else:
            og_url, og_file = DEFAULT_OG, "og-image.png"
            counts["default_og"] += 1

        if os.path.exists(og_file):
            with Image.open(og_file) as im:
                w, h = im.size
        else:  # dry run: the JPEG is not written yet
            w, h = jpeg_copy(hero, False)[1] if hero else default_size

        new = set_meta(new, "og:image", "property", og_url)
        new = set_meta(new, "twitter:image", "name", og_url)
        new = set_size_tags(new, w, h)

        schema_src = og_file if custom_ok else hero
        if schema_src:
            before = new
            new = add_article_image(new, abs_url(schema_src))
            counts["schema_image"] += new != before
        else:
            counts["no_hero"] += 1
            print(f"{page}: no hero photo, keeps {og_url.rsplit('/', 1)[-1]}, no schema image")

        if new != html:
            counts["changed"] += 1
            if args.write:
                open(page, "w", encoding="utf-8").write(new)

    for page in ("newsletter/index.html", "tools/index.html"):
        html = open(page, encoding="utf-8").read()
        new = set_meta(html, "og:image", "property", DEFAULT_OG)
        new = set_meta(new, "twitter:image", "name", DEFAULT_OG)
        new = set_size_tags(new, *default_size)
        if new != html:
            counts["changed"] += 1
            print(f"{page}: add /og-image.png")
            if args.write:
                open(page, "w", encoding="utf-8").write(new)

    print(f"\nPosts with their own share image: {counts['own_og']}  "
          f"kept an existing custom one: {counts['kept_og']}  "
          f"site default (hero under {MIN_OG_WIDTH}px or none): {counts['default_og']}")
    print(f"Article schema image added: {counts['schema_image']}  posts without a hero photo: {counts['no_hero']}")
    print(f"Files {'changed' if args.write else 'to change'}: {counts['changed']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

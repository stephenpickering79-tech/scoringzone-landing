# Scoring Zone Marketing Website

## Project
Static HTML marketing site for **Scoring Zone** — a golf short game practice app with scored drills, XP system, pressure tests, and stats tracking.

- **Live site:** https://www.scoringzone.net
- **Canonical domain:** www.scoringzone.net (non-www 308 redirects to www)
- **Hosted on:** Vercel (auto-deploys from main branch)
- **Repo:** scoringzone-landing (GitHub)
- **GA4:** G-08M47VV5NM

## Tech Stack
- Static HTML + CSS + JS (no framework)
- `css/shared.css` — site-wide styles
- `js/shared.js` — scroll reveal + mobile menu
- Google Fonts: Barlow Condensed, DM Sans, DM Mono
- Schema markup via inline JSON-LD

## Site Structure
```
index.html                          — Homepage
features/
  putting-drills.html               — Feature page
  chipping-drills.html              — Feature page
  practice-assistant.html           — Feature page
  round-stats.html                  — Feature page
  sim-lab.html                      — Feature page
  elite-mode.html                   — Feature page
blog/
  index.html                        — Blog listing
  [slug].html                       — Blog posts (~15 posts)
for-beginners.html                  — Audience page
for-high-handicappers.html          — Audience page
for-seniors.html                    — Audience page
for-juniors.html                    — Audience page
about.html                          — About / E-E-A-T page
contact.html                        — Contact page
privacy.html                        — Privacy policy
professionals/index.html            — Coach partner page (live, actively maintained)
sitemap.xml                         — 30+ URLs with lastmod
robots.txt                          — Allows all bots including AI crawlers
og-image.png                        — Shared OG image (1200x630)
```

## SEO Standards (follow on every page)
- **Title tag:** under 60 characters, primary keyword + "| Scoring Zone"
- **Meta description:** under 160 characters, hook not summary
- **Canonical tag:** absolute URL with `www.scoringzone.net`
- **OG tags:** og:title, og:description, og:image (og-image.png), og:url, og:type
- **Twitter Card:** card, title, description, image
- **Schema:** BreadcrumbList on all pages. Article + FAQPage on blog posts. Organization + SoftwareApplication + WebSite on homepage.
- **GA4:** Must be on every page (G-08M47VV5NM)
- **H1:** Exactly one per page
- **Images:** Use `loading="lazy"` on below-fold images. Use `golf images/` directory. All images need alt text.

## Blog Post Template
Use `blog/how-to-break-90.html` as the reference template for new posts. It has the correct:
- Head structure (GA4, meta, OG, Twitter, schema, inline CSS)
- Nav + mobile menu
- Breadcrumb section
- Article hero with mono-label, H1, date line
- Prose container with reveal animations
- Internal link blocks (`.blog-internal-link`)
- FAQ section (`.faq-section` / `.faq-item`)
- Related posts (`.related-posts`)
- Tags (`.blog-tags`)
- CTA blocks
- Footer

## Blog Copywriting
Use the `golf-blog-copywriting` skill for writing blog content. Key rules:
- Scoring Zone mentioned 2-3 times max, never in intro
- Give golf advice first, mention app where relevant
- Every post needs: meta tags, 3 schema blocks, FAQ section, 2-3 internal links, CTA
- Add "Key takeaway" block at top of article for AI extractability

## Content Conventions
- Use `&rsquo;` for apostrophes, `&mdash;` for em dashes, `&ndash;` for en dashes
- British English spelling (practise, colour, etc.) in body copy
- Copyright: &copy; 2026 Scoring Zone
- Contact email: hello@scoringzone.net
- Author: "Scoring Zone Team" (in schema)

## Social Profiles
- X: https://x.com/ScoringZone1
- Instagram: https://www.instagram.com/scoring.zone1/
- YouTube: https://www.youtube.com/@ScoringZone1
- Facebook: https://www.facebook.com/yourgolfjourney/

## Professionals Page (`professionals/index.html`)
- Live at `scoringzone.net/professionals/` — fully rebuilt and actively maintained
- Target audience: PGA Teaching Professionals
- Founders Commission: 50% from student #1 (first 60 days), then tiers: 1–10 → 30%, 11–20 → 40%, 21+ → 50%
- All CTAs link to `https://scoring-zone-referral.vercel.app/coaches` (sign up) or `https://scoring-zone-referral.vercel.app` (home)
- Final signup CTA links to `https://scoring-zone-referral.vercel.app/coaches#signup`
- "Back to Home" button links to `https://scoring-zone-referral.vercel.app`
- Hero commission card uses `.bento-item.bento-persistent` with animated border wrapper
- Feature cards use `.bento-grid` (9 cards, 2-col desktop, 1-col mobile)
- CSS font variables defined in `shared.css`: `--font-heading` (Barlow Condensed), `--font-body` (DM Sans), `--font-mono` (DM Mono)
- Section spacing: 6.5rem desktop, 5rem tablet, 3.5rem mobile
- CTA buttons have `.cta-pulse` green glow animation
- Do NOT add emoji icons to headings on this page

## Things to Avoid
- Don't use the old `images/` directory — it's empty. Use `golf images/` instead
- Don't use `scoringzone.net` without `www.` in any canonical, OG, or schema URLs
- Don't add more than 1 H1 per page
- Don't exceed 60 chars on title tags or 160 chars on meta descriptions

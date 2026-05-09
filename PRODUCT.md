# Product

## Register

brand

## Users

The homepage at `scoringzone.net` is the public marketing front door for **Scoring Zone**, a short-game practice app for golfers. The page targets the end user, not the coach: amateur golfers across the full handicap range (single digits to 25+ handicap, juniors to seniors), men and women, who are serious enough about the game to seek out a structured way to practise. The single largest segment is the mid-handicap player (12–22 handicap) who knows their short game is the gap between their current scores and the scores they want to shoot.

Their context when reading the homepage: searching for "best golf practice app" or "how to break 90", landing here from a Reddit/forum mention or a Google ad, evaluating whether this app is worth installing. They've been burned by generic golf apps that turned out to be GPS trackers or lesson-content libraries. They're sceptical of gamification that doesn't translate to lower scores, and allergic to any messaging that sounds like a swing-tips firehose without a structure.

The job they're trying to get done: decide in under three minutes whether to sign up for Early Access. The decision is emotional ("does this sound like a tool a serious player would actually use?") and analytical ("does the data and structure look real?"). Sign-ups happen on desktop or mobile, often after they've watched the carousel and read the founder section. The bar for trust is "would I tell my regular Saturday group to install this?", not "would I keep a free app on my phone?".

Coaches are a secondary audience reached via the `/professionals/` page, not the homepage. Coach-facing decisions live in the separate Loyalty repo (`scoring-zone-referral`). The homepage should never read as a B2B pitch.

## Product Purpose

Drive Early Access signups from amateur golfers who are ready to practise with structure. The signup form is the single conversion event the homepage exists to produce; everything else (founder credibility, feature explanation, scored-drill demos, blog/news, pricing) is in service of that signup happening.

Success looks like a golfer reaching the form already convinced, not "I'll think about it". Failure modes are: (a) the page reads as another golf-content app and they bounce before the carousel, (b) the gamification feels childish and a serious player dismisses it, (c) the value isn't compressed into the first viewport so they scroll once and leave.

The homepage is intentionally dense (12 sections from hero to footer) because the audience is sceptical and needs proof at multiple altitudes: the headline metric (3.2 stroke improvement), the founder's voice, the actual app screens, the scored-drill examples, the gamification system, the blog content as evidence of expertise, and finally pricing. Removing density would help bounce rate; preserving it converts the people who actually engage.

## Brand Personality

**Performance-grade. Honest. Range-tested.**

- *Performance-grade* — Talks about strokes gained, benchmarks, scored drills, pressure tests. The voice respects that the audience already knows golf vocabulary; it doesn't explain three-putts. Numbers carry the page. Decoration does not.
- *Honest* — No "transform your game in 30 days" promises. The 3.2-stroke figure is real, attributed to early-access users, presented plainly. The founder's letter on `/professionals/` translates to the same voice on this homepage. Every claim is one a golfer could verify with their own stats.
- *Range-tested* — Earned, not theoretical. The aesthetic, language, and proof points all signal that someone who actually plays the game built this. Not a swing-coach repackaging a course library, not a SaaS team pivoting from another vertical.

The dominant emotion the homepage should evoke is *quiet recognition* — the feeling a serious player gets when they read something and think "yes, that's how it actually works". Not excitement, not aspiration. Recognition.

## Anti-references

The homepage must NOT drift into any of these lanes:

1. **Generic dark-mode SaaS / YC-startup landing.** Animated gradient on black, glassmorphism nav, four-up icon-and-metric stat grid, typewriter h1 as personality, hero-metric template. The dominant 2024–26 marketing-page reflex. Reads as "tech bro who has never broken 90". The first audit pass identified and removed several specific instances of this; the rule keeps them out.
2. **Golf-content firehose.** Cluttered cards of "10 tips to fix your slice", swing video thumbnails, instructor headshots, broadcast-blue accents. Reads as "another GolfPass / GolfTec / SwingU clone".
3. **Gamification-first kids' app.** Confetti, achievement badges floating over the UI, cartoon characters, neon level-up animations. Reads as "Duolingo for golf" — wrong audience signal for a serious amateur.
4. **Old-school country-club aesthetic.** Forest green and gold trim, serif headlines, oil-painting fairway photography, Edwardian typography. Wrong audience signal in the other direction; reads as the 1990s pro shop website.
5. **Swing-tips academy.** Endless instructor videos, technique diagrams, "the secret of the modern golf swing" copy. The product is about *practice*, not technique; any drift toward technique-content positioning weakens it.

Specific banned patterns: side-stripe colored borders on cards, em dashes anywhere in body copy, hero-metric template, identical card grids, glassmorphism, gradient text, `#000` / `#fff` literals, Inter / DM Sans / Plus Jakarta as headline (Barlow Condensed is the established display face).

## Design Principles

1. **Numbers carry the page.** The "3.2 stroke improvement" headline metric and the "50+ scored drills" / "Day-5 streak" inside the app screens are the strongest proof points the homepage has. Type weight and size do the work; no decoration around the numbers. If a number can't carry itself with weight + a single committed colour, the underlying claim isn't strong enough — fix the claim, not the typography.

2. **Founder voice is the trust seam.** The Stephen Pickering founder section (and the linked `/professionals/` letter) is the only piece of copy on the page that sounds like one person talking to another player. It does more conversion work than any feature explanation. Visual choices around that section should never compete with it.

3. **Range vocabulary, not startup vocabulary.** "Drills, pressure tests, scored, benchmarks, strokes gained, short game HCP, lag putting" — the language a serious player uses. Avoid: users, engagement, leverage, journey, transform, unlock potential, level up your game (when used as motivational filler rather than literal in-app XP progression).

4. **Restrained green, dark surface, single moments.** Green (`#22c55e`) is load-bearing — used on CTAs, the hero accent word ("Short Game"), the headline metric, key in-app screen highlights, and the founder accent. Never two saturated accents at once. The dark surface is part of the identity (Pebble Beach video hero, near-black ground); white sections appear later in the page (signup, carousel, gamification white-bg variant) as deliberate brightness shifts, not as the default.

5. **Density earns trust.** Twelve sections is intentional. Don't trim sections under the banner of minimalism. Trim *within* sections (one bold metric instead of four, one founder photo instead of three, one CTA instead of three nearby) — but the page-level scope stays full.

## Accessibility & Inclusion

WCAG **AA** baseline, with explicit care on the items that matter for the audience:

- **Body-text contrast** ≥ 4.5:1 always. Stop using `--text-dim` (low alpha) for primary prose; reserve it for de-emphasised metadata.
- **Font size** ≥ 16px on all reading text. No 14px or 13px body copy. Mono labels at 12–13px are fine because they are eyebrows, not the primary read.
- **Touch targets** ≥ 44×44px on every interactive element, including secondary text links in nav and footer (already enforced site-wide via `shared.css` after the audit pass).
- **Skip-to-main link** as the first focusable element on every page.
- **Single `<h1>`** per page; subordinate headings should not exceed `<h3>` depth on the homepage (current `<h2>` count of 14 is heading inflation and a known follow-up).
- **Reduced motion** — respect `prefers-reduced-motion` on the typewriter h1, the `.cta-pulse` pulse, the carousel sticky-scroll, and the WebGL shader render. The homepage does not yet honor this; treat it as a known gap to close in the next round.
- **Colour blindness** — green is load-bearing throughout the brand and cannot be replaced. Compensate with weight, size, and labels rather than shifting hue. Never use red/green pairs to communicate state without an icon or label.
- **Alt text** — every `<img>` must have descriptive alt text (current pass already at 14/14).

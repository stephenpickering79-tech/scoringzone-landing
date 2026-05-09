---
name: Scoring Zone (Homepage)
description: Marketing homepage for the Scoring Zone short-game practice app. Dark surface with deliberate white-section breaks, condensed sans hierarchy, one load-bearing green.
colors:
  range-green: "#22c55e"
  range-green-bright: "#4ade80"
  range-green-deep: "#166534"
  bunker-black: "#060b08"
  bunker-black-2: "#0b0b0b"
  card-shell: "#0a0a0a"
  card-shell-2: "#111111"
  practice-chalk: "#f0fdf4"
  practice-chalk-2: "#d1fae5"
  practice-chalk-muted: "#6b7280"
  practice-chalk-dim: "#2d4a36"
  range-amber: "#f59e0b"
  range-amber-deep: "#d97706"
  pressure-red: "#ef4444"
  hairline: "#ffffff12"
  hairline-strong: "#ffffff21"
  hairline-green: "#22c55e33"
  category-chips: "hsl(38, 91%, 55%)"
  category-putting: "hsl(265, 76%, 67%)"
  category-sim-lab: "hsl(210, 70%, 60%)"
  category-distance-wedge: "hsl(200, 70%, 55%)"
  category-assistant: "hsl(263, 70%, 58%)"
  category-pressure: "hsl(0, 84%, 60%)"
typography:
  display:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 6.5vw, 5rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "0"
  hero-metric:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "clamp(5rem, 14vw, 11rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "0.04em"
  title:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.05em"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0"
  body-prose:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: "0"
  label-mono:
    fontFamily: "DM Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.15em"
rounded:
  pill: "100px"
  card: "12px"
  card-lg: "16px"
  card-xl: "24px"
  card-xxl: "36px"
  control: "10px"
  control-wrapper: "12px"
spacing:
  hairline: "1px"
  xs: "6px"
  sm: "12px"
  md: "20px"
  lg: "32px"
  xl: "48px"
  xxl: "80px"
components:
  button-primary:
    backgroundColor: "{colors.range-green}"
    textColor: "{colors.bunker-black}"
    typography: "{typography.title}"
    rounded: "{rounded.control}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.range-green-bright}"
    textColor: "{colors.bunker-black}"
    typography: "{typography.title}"
    rounded: "{rounded.control}"
  button-amber:
    backgroundColor: "{colors.range-amber}"
    textColor: "{colors.bunker-black}"
    typography: "{typography.title}"
    rounded: "{rounded.control}"
    padding: "14px 28px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.practice-chalk-muted}"
    typography: "{typography.body}"
    rounded: "8px"
    padding: "12px"
  card-bento:
    backgroundColor: "{colors.card-shell}"
    textColor: "{colors.practice-chalk}"
    typography: "{typography.body}"
    rounded: "{rounded.card-lg}"
    padding: "24px"
  card-xp:
    backgroundColor: "{colors.card-shell}"
    textColor: "{colors.practice-chalk}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "22px 24px"
  card-xp-peak:
    backgroundColor: "#0a0a0a"
    textColor: "{colors.practice-chalk}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "28px 30px"
  mono-eyebrow:
    backgroundColor: "transparent"
    textColor: "{colors.range-green}"
    typography: "{typography.label-mono}"
    padding: "0"
  iphone-frame:
    backgroundColor: "{colors.bunker-black}"
    textColor: "{colors.practice-chalk}"
    typography: "{typography.body}"
    rounded: "{rounded.card-xxl}"
    padding: "0"
---

# Design System: Scoring Zone (Homepage)

## 1. Overview

**Creative North Star: "The Range Bay at Dusk"**

The homepage reads like the moment a serious player steps into a covered range bay at the end of a working day. The surface is a deep green-black, the brand green is the only accent that earns saturation, and the type carries every claim through weight rather than decoration. The page sequences cleanly: dark hero with the Pebble Beach video, dark Digital Serenity definition, a deliberate white break for the carousel and signup, then dark again through gamification and pricing. Every transition is intentional. Nothing on the page is decorative for its own sake.

The system explicitly rejects three lanes documented in PRODUCT.md: the dark-mode YC-startup look (animated gradients, glassmorphism, four-up icon-and-metric stat grids), the golf-content firehose (cluttered tip cards, instructor headshots, broadcast-blue accents), and the gamification-first kids' app look (confetti, badge floats, neon level-ups). The audience is amateur golfers who want a serious tool, not a toy or a tip library.

The voice is performance-grade, honest, and range-tested. Quiet recognition beats excitement, every time.

**Key Characteristics:**
- Dark surface as the default, with deliberate white sections for brightness shifts (carousel, signup, gamification white variant)
- Single load-bearing brand green; no second saturated accent on the conversion path
- Condensed industrial display sans (Barlow Condensed) over a humanist body sans (DM Sans), with mono labels (DM Mono) for metadata only
- Plain numbers as the primary visual moment; the "3.2" headline metric and the "50+" drill count are sized to carry themselves
- Multi-section density (12 sections from hero to footer) is intentional. Trust scales with proof, not with whitespace.

## 2. Colors

A near-monochrome dark palette tinted toward green, with one saturated accent that does the conversion work. White sections appear as deliberate brightness breaks, not as the default.

### Primary
- **Range Green** (`#22c55e`): the load-bearing accent. Used on CTAs, the hero accent word ("Short Game"), the headline metric, the green dot in pulse badges, mono eyebrows, the in-app screen highlights, and the founder accent. Treat this color as the entire conversion identity. If a surface needs a "second accent", the answer is more weight, more size, or nothing.
- **Range Green Bright** (`#4ade80`): hover-only. Buttons swap to this on `:hover`.
- **Range Green Deep** (`#166534`): reserved for `:active` or pressed states; used sparingly.

### Neutral (the dark scale)
- **Bunker Black** (`#060b08`): the page surface. Tinted toward green-black so layered greens read as part of the same family. Replaces every former `#000` literal.
- **Bunker Black 2** (`#0b0b0b`): an alternate tone for sections that need separation without a hard rule.
- **Card Shell** (`#0a0a0a`) / **Card Shell 2** (`#111111`): two steps for bento cards and surfaces above the page ground.
- **Practice Chalk** (`#f0fdf4`) and **Practice Chalk 2** (`#d1fae5`): primary and secondary text colours on dark. Tinted near-whites; never `#fff`.
- **Practice Chalk Muted** (`#6b7280`): de-emphasised metadata, low-importance text.
- **Practice Chalk Dim** (`#2d4a36`): a green-tinted dim for the most de-emphasised tier.
- **Hairline** (`#ffffff12`) and **Hairline Strong** (`#ffffff21`): card borders and section dividers.

### Tertiary (states and category coding)
- **Range Amber** (`#f59e0b`) / **Range Amber Deep** (`#d97706`): the secondary CTA on `/professionals/` and the `2×` XP multiplier tier. Used sparingly.
- **Pressure Red** (`#ef4444`): the `3×` XP super-bonus tier and form error state.
- **Category coding** (chips/putting/sim-lab/distance-wedge/assistant/pressure): each short-game category has its own HSL hue, used inside feature blocks and challenge cards to differentiate without competing with brand green.

### Named Rules
**The One Voice Rule.** Range Green is the only saturated accent on the conversion path. Category hues exist for taxonomy (chipping/putting/etc.) and never appear on CTAs. Amber and red are state-only — secondary CTA, warning, error, or XP multiplier tier coding — never decorative.

**The Tonal-Not-Tinted Rule.** Layered surfaces (cards on bg, hovered cards on idle cards) move within the dark scale (`Bunker Black → Card Shell → Card Shell 2`). They do not introduce tinted colours. The exception is the `xp-card--peak` tier, which uses a pressure-red gradient tint to mark it as the visual anchor of the gamification ladder.

**The White-As-Break Rule.** White sections (`#ffffff` background on the carousel, signup form, and gamification white variant) are deliberate brightness shifts, not a default surface. Never break to white inside a dark section. Never use a white card on dark — use a Card Shell card with hairline border instead.

## 3. Typography

**Display Font:** Barlow Condensed (with system-ui, sans-serif fallback)
**Body Font:** DM Sans (with system-ui, sans-serif fallback)
**Label/Mono Font:** DM Mono (with monospace fallback)

**Character:** A condensed industrial display sans against a calm humanist body sans, with a small caps-mono for metadata. The pairing reads as a technical instrument: weight contrast and size do the hierarchy, not embellishment. All three faces are identity-locked — the brand has invested in this pairing across the marketing site, the coaches site, and the in-app type system, and they should not be revisited as fresh choices.

### Hierarchy
- **Display** (Barlow Condensed 900, `clamp(2.75rem, 6.5vw, 5rem)`, line-height `0.95`): the H1 only. One per page. Uppercase. Tight tracking lets the condensed face do its job. The hero typewriter character-reveal animation is identity-locked here.
- **Hero Metric** (Barlow Condensed 900, `clamp(5rem, 14vw, 11rem)`, line-height `1`): reserved for the page's load-bearing number. The "3.2" in the Digital Serenity section is the only place this scale appears. Range Green. Never decorated, never gradient-clipped.
- **Headline** (Barlow Condensed 800, `clamp(1.75rem, 4vw, 3rem)`, `0.04em` letter-spacing): section H2s. Uppercase.
- **Title** (Barlow Condensed 800, `1.25rem`, `0.05em`): primary button label, panel sub-titles, XP card label.
- **Body** (DM Sans 400, `1rem`, `1.65` line-height): default reading text on the page. 65–75ch max line length on prose. Never below 1rem.
- **Body Prose** (DM Sans 400, `0.95rem`, `1.8` line-height): reserved for the founder section and any long-form copy where the looser line-height does comprehension work.
- **Label Mono** (DM Mono 700, `0.875rem` (14px), `0.15em` letter-spacing, uppercase): mono eyebrows above section headlines (PLATFORM, GAMIFICATION, PERFORMANCE TESTS, etc.), metadata captions inside cards, and the in-app stat labels.

### Named Rules
**The Plain Numbers Rule.** When a number is the point, the number is the type. The "3.2" is sized like a poster headline because that *is* the proof. No icon, no accent stripe, no animated flourish under it. Type weight + size + a single saturated colour carries it.

**The Phone-In-Pocket Rule.** Body copy never goes below `1rem`. Mono labels at `0.875rem` are the smallest type the homepage allows, and they are eyebrows or metadata, never the primary read. The audience reads on a phone between holes, in mixed daylight; calibrate for the worst case.

**The Mono-As-Metadata Rule.** Mono is only ever used for: section eyebrows, in-app stat captions, XP rewards, and small structural labels. Never for body copy, never for headlines, never for pull quotes.

## 4. Elevation

The system is **flat by default**. Surfaces sit on the page and are differentiated by tonal layering within the Bunker Black → Card Shell → Card Shell 2 scale. Depth at rest comes from green-tinted hairline borders on a small set of trust-bearing surfaces (signup card, founder card on `/professionals/`), and from one-pixel hover lifts on bento and XP cards. Nothing on the page floats at idle.

Shadows enter only as a response to state. Buttons gain a green-glow shadow on hover; the hero iPhone composite carries a single drop-shadow because it's a transparent PNG that needs grounding; the in-app screen mockups inside the carousel use a similar treatment for the same reason. The Pebble Beach video hero overlay is the most visually loaded surface on the page — everything else is calibrated against it for restraint.

### Shadow Vocabulary
- **Range Glow** (`box-shadow: 0 4px 24px rgba(34, 197, 94, 0.30)`): primary CTA hover only. Brand-coloured glow, not neutral elevation.
- **Hero Phone Drop** (`filter: drop-shadow(0 18px 36px rgba(0, 0, 0, 0.45))`): the transparent iPhone PNG in the hero. Used once.
- **iPhone Frame Glow** (`box-shadow: 0 0 40px rgba(34, 197, 94, 0.10), 0 20px 60px rgba(0, 0, 0, 0.6)`): the in-app phone mockups inside the carousel. Pairs an ambient green halo with a deeper neutral drop.
- **XP Peak Glow** (`box-shadow: 0 0 32px rgba(239, 68, 68, 0.08)`): the `3×` Super Bonus card — the only place pressure-red surfaces as a glow. Marks the apex of the ladder without competing with brand green.
- **Bento Hover Hint** (`box-shadow: 0 2px 12px rgba(255, 255, 255, 0.03)`): bento card hover. Almost-invisible white shadow paired with translateY(-2px).

### Named Rules
**The Flat-At-Rest Rule.** Cards, sections, and surfaces never carry a shadow at idle. If a surface needs to look "important", the move is a hairline-green border, not a drop shadow. Neutral box-shadows on dark surfaces look like 2014 SaaS.

**The Glow-As-Intent Rule.** Coloured glow is allowed when it signals interaction (button hover) or hierarchy (XP peak tier, hero phone). It is not allowed as ambient decoration on every card.

## 5. Components

### Buttons
- **Shape:** `10px` radius (Control). Primary CTA optionally wraps in an animated `12px` conic-gradient border (`btn-border-anim`) for the highest-priority calls to action.
- **Primary (`btn-primary`):** Range Green background, Bunker Black text. Uppercase Title type (Barlow Condensed 700, `0.95rem`, `0.05em` tracking). Padding `14px 28px`, min-height `48px`. Has a sweeping highlight on `:hover` via a `::after` skewed gradient.
- **Hover / Focus:** Background swaps to Range Green Bright, `translateY(-1px)`, Range Glow shadow, sheen sweeps left-to-right.
- **Amber (`btn-amber`):** Same shape; amber-on-near-black. Used for secondary "Start Early Access Now" CTAs in the lower funnel.
- **Animated-Border Wrapper (`btn-border-anim`):** A 2px-padded conic-gradient ring rotating at 3s linear infinite. Used on the hero, gamification, and signup CTAs only.

### Inputs / Fields
- **Style:** `1px solid var(--border)` border, white-at-low-alpha background, Practice Chalk text. Mono placeholder at low alpha. `10px` radius, `16px 20px` padding (~56px height).
- **Focus:** Border swaps to a green tint (`rgba(34, 197, 94, 0.4)`).
- **Labels:** All inputs have an `sr-only` `<label htmlFor>` for screen readers; the visual cue is the placeholder. Add `autoComplete` attributes (`name`, `email`) so browsers offer autofill.
- **Error:** Form error messages use Pressure Red, `0.875rem`, with `role="alert"` and `aria-live="polite"`.

### Cards / Containers
- **Bento Card (`bento-item`):** Card Shell background, hairline border, `16px` radius, `24px` padding. Hover lifts subtly with the Bento Hover Hint shadow.
- **XP Card (`xp-card`):** `12px` radius, `22px 24px` padding, hairline border. The first two tiers (1× / 2×) use this baseline.
- **XP Peak Card (`xp-card--peak`):** The 3× Super Bonus tier. `28px 30px` padding, pressure-red-tinted gradient bg, accent-coloured border, larger multiplier (3.2rem). Marks the visual anchor of the ladder. The grid is asymmetric (`1fr 1fr 1.35fr`), so the peak card is also wider.
- **Challenge Card:** Used in the Featured Challenges section. Each tier (Beginner / Intermediate / Advanced) has its own category hue applied as a top accent only — not as a side-stripe.
- **Signup Card:** Bunker Black background, hairline-green border, `24px` radius. Two-column on desktop, stacks on mobile. Calendly badge sits as a floating widget separate from the card.

### Navigation
- **Shape:** Sticky, transparent over the hero, gains a solid Bunker Black background on scroll. `1px` Hairline bottom border. No backdrop-blur — explicitly forbidden.
- **Logo:** Display type, "SCORING ZONE" in Practice Chalk + Range Green for the second word.
- **Links:** DM Sans 500, `0.85rem`, `0.02em` tracking, Practice Chalk Muted at rest, Practice Chalk on hover. `12px` padding + `min-height: 44px` so every link clears the touch-target threshold. The mega-menu dropdown attaches to the "Features" link.
- **Mobile menu:** Hamburger toggle on the right, full-screen drawer below `1024px`. Each item is `48px` tall.

### Hero
- **Background:** Pebble Beach 33MB MP4 video, autoplay muted loop, with a `rgba(0, 0, 0, 0.35)` overlay and an image-slideshow fallback.
- **Headline:** Display type with a typewriter character-reveal at 45ms per char. The accent word ("Short Game") is Range Green.
- **Phone mockup:** Transparent PNG on the right column, sized to `204px` wide (15% smaller than launch), with a drop-shadow and a subtle radial green glow halo. Hidden on mobile. Aligned with the bottom of the QR card on the left.
- **QR card:** Bottom-left card with a QR code and a one-line "Trusted by Professional Golf Coaches" trust mark below the phone. Hidden on mobile.

### In-App Screen Carousel
- White-background section. Phone mockups (transparent PNGs) scroll horizontally as the user scrolls vertically (sticky-scroll). Each phone has its own subtle iPhone frame treatment using `iphone-frame` styles. Five screens: Home Dashboard, Performance Hub, Putting Drills, Stats Tracking, Chipping Drill.

### Mono Eyebrow / Section Label
- **Style:** DM Mono 700, `0.875rem` (14px), `0.15em` letter-spacing, uppercase, Range Green.
- **Where used:** Above every section H2 — PLATFORM, GAMIFICATION, PERFORMANCE TESTS, YOUR SHORT GAME JOURNEY, INSIDE THE APP, PRICING, HOW IT WORKS.
- **Rule:** Never use mono type for body copy. Mono is metadata only.

### Skip Link (`skip-link`)
- **Style:** Visually hidden until focused (sr-only pattern). On focus, fixes to top-left at `12px` offset, `12px 18px` padding, Range Green background, Bunker Black text, `8px` radius, `1000` z-index.

### Signature: Typewriter H1
- The hero `<h1>` reveals character-by-character at 45ms/char with a blinking Range Green cursor that fades after the last character. Identity-locked. New pages within the brand register may reuse the pattern; never use it on H2 or below.

## 6. Do's and Don'ts

### Do:
- **Do** use Range Green (`#22c55e`) as the only saturated colour on the conversion path of any homepage section.
- **Do** size the most important number on the page like a poster headline (`clamp(5rem, 14vw, 11rem)`). If it can't carry itself at that scale with weight + colour alone, the underlying claim isn't strong enough.
- **Do** keep elevation flat at rest. Use hairline-green borders for trust emphasis, not drop shadows.
- **Do** keep body type at `1rem` minimum and mono labels at `0.875rem` minimum. The audience reads on a phone in mixed daylight.
- **Do** lead numbers with type weight and size. The "3.2" and "50+" both follow the Plain Numbers Rule.
- **Do** carry a `min-height: 44px` on every interactive element, including secondary text links in nav and footer.
- **Do** treat `var(--bg)` and `var(--text)` as the canonical replacements for `#000` and `#fff` everywhere, including SVG `fill`/`stroke` (use `currentColor`).
- **Do** keep section eyebrows (PLATFORM, GAMIFICATION, etc.) in DM Mono uppercase at `0.875rem` for hierarchy consistency across the page.

### Don't:
- **Don't** use side-stripe coloured borders. `border-left` greater than `1px` as an accent on cards, list items, callouts, or alerts is forbidden — including absolute-positioned 3px stripes that simulate the effect (the `xp-card-accent` was removed for this reason).
- **Don't** use gradient text. `background-clip: text` plus a gradient background is decorative, never meaningful. Use a single solid colour.
- **Don't** use glassmorphism — `backdrop-filter: blur()` on nav, modals, or cards as a default. The previous backdrop-blur nav was removed.
- **Don't** ship the hero-metric template (icon + huge number + tiny caption × 4 identical cards). The Digital Serenity section already runs the bold "3.2" statement; that is the version of "show the math" we ship.
- **Don't** ship em dashes anywhere in the copy. Use commas, colons, periods, or parentheses. Sweep them on every new section before commit.
- **Don't** drift into the YC dark-startup costume (animated gradients on black, decorative rings around stats, Inter / Plus Jakarta as headline, marquee logos of fake customers).
- **Don't** drift into the golf-content firehose (cluttered tip cards, instructor headshots, broadcast-blue, swing-video thumbnails). The product is about practice, not technique content.
- **Don't** drift into the gamification-first kids' app costume (confetti, badge floats, neon level-ups, cartoon characters).
- **Don't** use mono type for body copy. Mono is for metadata only.
- **Don't** add a second saturated accent on the conversion path. Range Green is the only one. Amber is state-only (secondary CTA + 2× XP), pressure-red is state-only (3× XP + form error), category hues are taxonomy-only.
- **Don't** layer multiple decorative effects on the same surface (Pebble Beach video + grid background + green wash + spotlight glow + animated borders + typewriter all at once). Pick one and let it carry.
- **Don't** break to white inside a dark section. White-section breaks happen between sections, not within them.
- **Don't** ship `#000` or `#fff` literals. Use `var(--bg)` (`#060b08`, tinted near-black) and `var(--text)` (`#f0fdf4`, tinted near-white) instead.

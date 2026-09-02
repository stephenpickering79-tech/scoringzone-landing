/* ============================================================
   Scoring Zone — In-content blog advert
   ------------------------------------------------------------
   Injects one topical advert into the body of a blog post.
   Three variants, chosen from the post's own subject:

     putting   putting drills, start line, distance control
     chipping  chipping, pitching, bunker, up-and-down
     stats     handicap, strokes gained, scoring

   Usage:
     <link rel="stylesheet" href="../css/blog-ad.css">
     <script src="../js/blog-ad.js" data-asset-base="../" defer></script>

   The variant is detected from the URL slug and headings unless
   pinned explicitly:
     <script ... data-variant="chipping">

   Placement is automatic — before the second <h2> of the article,
   which is a natural section break — unless the post carries a
   marker, which always wins:
     <div data-sz-blogad></div>

   Overrides for testing:
     ?szad=off        disable
     ?szad=putting    force a variant
   ============================================================ */

(function () {
  'use strict';

  var script = document.currentScript;

  var CFG = {
    assetBase: '',
    variant: '',
    // Skip very short posts — an advert two paragraphs in reads as a wall.
    minParagraphs: 6,
    storeBase: 'https://apps.apple.com/app/apple-store/id6769477447',
    providerToken: '128906825',
    webBase: 'https://scoringzone.app/'
  };

  if (script) {
    if (script.dataset.assetBase) CFG.assetBase = script.dataset.assetBase;
    if (script.dataset.variant) CFG.variant = script.dataset.variant;
    if (script.dataset.minParagraphs) CFG.minParagraphs = parseInt(script.dataset.minParagraphs, 10);
  }

  var params = new URLSearchParams(window.location.search);
  var override = (params.get('szad') || '').toLowerCase();

  function asset(path) { return CFG.assetBase + path; }

  /* ── Variants ────────────────────────────────────────
     Copy is written to the reader's problem in that topic,
     not to the feature list.
     ------------------------------------------------------ */

  var VARIANTS = {
    handicap: {
      label: 'Short game app',
      shot: 'app-screens/blog-ad-handicap.webp',
      panelLight: true,
      alt: 'The Scoring Zone Performance Hub showing a 2.8 short game handicap on a progress ring, 2.2 strokes better than benchmark',
      head: 'Turn practice into<em>lower scores.</em>',
      sub: '',
      flow: ['Test', 'Identify', 'Practise', 'Improve'],
      points: [
        '35+ drills &amp; performance tests',
        'Practice like the pros',
        'Identify your weakness and lower your scores',
        'Build confidence under pressure'
      ],
      ctaStyle: 'badges',
      campaign: 'Blog Ad Handicap',
      altHref: 'features/performance-hub.html',
      altText: ''
    },
    putting: {
      label: 'Putting &middot; Scored practice',
      shot: 'app-screens/blog-ad-putting.webp',
      alt: 'The Scoring Zone putting drill list showing the Clock Drill, Lag King and Knockout Ladder with scores and handicap benchmarks',
      head: 'Practise putting with<em>a score to beat.</em>',
      sub: 'Gate, clock and ladder drills that are <b>scored against your handicap</b>, so you can see your start line and distance control improving instead of guessing.',
      cta: 'Get the putting drills',
      campaign: 'Blog Ad Putting',
      altHref: 'features/putting-drills.html',
      altText: 'or see how putting drills work'
    },
    chipping: {
      label: 'Chipping &middot; Scored practice',
      shot: 'app-screens/blog-ad-chipping.webp',
      alt: 'The Scoring Zone chipping screen showing a 5.3 chipping handicap and four of seven challenges completed',
      head: 'Turn chipping practice into<em>a number that moves.</em>',
      sub: 'Up-and-down challenges from real lies and distances, each one <b>benchmarked to your handicap</b> so you know when your short game is genuinely sharper.',
      cta: 'Get the chipping drills',
      campaign: 'Blog Ad Chipping',
      altHref: 'features/chipping-drills.html',
      altText: 'or see how chipping drills work'
    },
    stats: {
      label: 'Stats &middot; Strokes gained',
      shot: 'app-screens/blog-ad-stats.webp',
      alt: 'The Scoring Zone stats screen showing a 4.6 short game handicap and a strokes gained breakdown by putting, up and down, approach and off the tee',
      head: 'See exactly where<em>your strokes go.</em>',
      sub: 'A Short Game Handicap and a <b>strokes gained breakdown</b> built from your own rounds, so practice targets the part of your game actually costing you shots.',
      cta: 'Track your short game',
      campaign: 'Blog Ad Stats',
      altHref: 'features/round-stats.html',
      altText: 'or see how the stats work'
    }
  };

  /* ── Variant detection ───────────────────────────────
     Slug first — it is the most reliable signal on this
     site — then the headings if the slug says nothing.
     ------------------------------------------------------ */

  var RULES = [
    // Handicap runs first: it is the sharpest intent of the four and the
    // stats rule would otherwise swallow it.
    { v: 'handicap', re: /handicap|hcp/ },
    { v: 'chipping', re: /chip|pitch|bunker|flop|up-and-down|up_and_down|short-game|shortgame|thinning|chunking|wedge/ },
    { v: 'putting',  re: /putt|green|three-putt|lag/ },
    { v: 'stats',    re: /strokes-gained|strokes_gained|stat|score|break-\d|average|percentage/ }
  ];

  function detect() {
    if (override && VARIANTS[override]) return override;
    if (CFG.variant && VARIANTS[CFG.variant]) return CFG.variant;

    var slug = window.location.pathname.toLowerCase();
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i].re.test(slug)) return RULES[i].v;
    }

    var heads = document.querySelectorAll('h1, h2');
    var text = '';
    for (var j = 0; j < heads.length && j < 12; j++) text += ' ' + heads[j].textContent.toLowerCase();
    for (var k = 0; k < RULES.length; k++) {
      if (RULES[k].re.test(text)) return RULES[k].v;
    }

    // Scoring is the broadest of the three, so it is the safe default.
    return 'stats';
  }

  /* ── Markup ──────────────────────────────────────────── */

  var starSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  var appleSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.05 12.54c.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.98.9-3.78 2.29-1.61 2.79-.41 6.92 1.16 9.18.77 1.11 1.68 2.35 2.87 2.3 1.15-.05 1.59-.74 2.98-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.13 2.78-2.24.88-1.28 1.24-2.52 1.26-2.59-.03-.01-2.42-.93-2.44-3.69M14.9 5.6c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.68 1.37-.59.68-1.11 1.77-.97 2.81 1.02.08 2.06-.52 2.71-1.28"/></svg>';

  function storeUrl(v) {
    return CFG.storeBase + '?pt=' + CFG.providerToken +
           '&ct=' + encodeURIComponent(v.campaign) + '&mt=8';
  }

  function webUrl(v) {
    return CFG.webBase + '?utm_source=scoringzone.net&utm_medium=blog_ad' +
           '&utm_campaign=app_download&utm_content=' + encodeURIComponent(v.campaign.toLowerCase().replace(/ /g, '_'));
  }

  function flow(v) {
    if (!v.flow) return '';
    return '<p class="szad-flow">' +
      v.flow.join('<i aria-hidden="true">&rarr;</i>') +
    '</p>';
  }

  function points(v) {
    if (!v.points) return '';
    return '<ul class="szad-points">' + v.points.map(function (p) {
      return '<li>' + p + '</li>';
    }).join('') + '</ul>';
  }

  function actions(v) {
    // Store badges, as the popup uses, plus the orange trial line centred
    // beneath them.
    if (v.ctaStyle === 'badges') {
      return '<div class="szad-actions szad-actions--badges">' +
        '<div class="szad-stores">' +
          '<a class="szad-store" data-szad-cta="app_store" href="' + storeUrl(v) + '" target="_blank" rel="noopener">' +
            '<img src="' + asset('badges/app-store-badge.svg') + '" alt="Download Scoring Zone on the App Store" height="44" decoding="async">' +
          '</a>' +
          '<a class="szad-store" data-szad-cta="android" href="' + webUrl(v) + '">' +
            '<img src="' + asset('badges/android-badge.webp') + '" alt="Download Scoring Zone for Android" width="520" height="152" decoding="async">' +
          '</a>' +
        '</div>' +
        '<p class="szad-trial">7 day free trial</p>' +
      '</div>';
    }

    return '<div class="szad-actions">' +
      '<a class="szad-cta" data-szad-cta="app_store" href="' + storeUrl(v) + '" target="_blank" rel="noopener">' +
        appleSvg + v.cta +
      '</a>' +
      (v.altText ? '<a class="szad-alt" data-szad-cta="feature" href="' + asset(v.altHref) + '">' + v.altText + '</a>' : '') +
    '</div>' +
    '<p class="szad-foot">7-day free trial &middot; iOS + web app</p>';
  }

  function brand() {
    return '<div class="szad-brand">' +
      '<img src="' + asset('logo/new-log.webp') + '" width="18" height="18" alt="" decoding="async">' +
      '<span>Scoring Zone Golf</span>' +
    '</div>';
  }

  function build(name) {
    var v = VARIANTS[name];
    var el = document.createElement('aside');
    el.className = 'szad szad--' + name;
    el.setAttribute('data-shown', 'false');
    el.setAttribute('data-szad-variant', name);
    el.setAttribute('aria-label', 'Advertisement for the Scoring Zone app');

    var stars = starSvg + starSvg + starSvg + starSvg + starSvg;

    el.innerHTML =
      '<div class="szad-grid">' +
        '<div class="szad-shot' + (v.panelLight ? ' szad-shot--light' : '') + '">' +
          '<img src="' + asset(v.shot) + '" loading="lazy" decoding="async" alt="' + v.alt + '">' +
        '</div>' +
        '<div class="szad-body">' +
          '<p class="szad-label"><i aria-hidden="true"></i>' + v.label + '</p>' +
          '<h2 class="szad-h">' + v.head + '</h2>' +
          (v.sub ? '<p class="szad-sub">' + v.sub + '</p>' : '') +
          flow(v) +
          points(v) +
          '<div class="szad-rating">' +
            '<span class="szad-stars" role="img" aria-label="Rated 5 out of 5 on the App Store">' + stars + '</span>' +
            '<span>5.0 on the App Store</span>' +
          '</div>' +
          actions(v) +
          brand() +
        '</div>' +
      '</div>';

    return el;
  }

  /* ── Placement ───────────────────────────────────────── */

  function proseRoot() {
    // The container holding the most paragraphs is the article body.
    var best = null, bestCount = 0;
    var nodes = document.querySelectorAll('div, article, section, main');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i].querySelectorAll(':scope > p').length;
      if (n > bestCount) { bestCount = n; best = nodes[i]; }
    }
    return bestCount ? best : null;
  }

  function place(el) {
    var marker = document.querySelector('[data-sz-blogad]');
    if (marker && marker.parentNode) {
      marker.parentNode.replaceChild(el, marker);
      return 'marker';
    }

    var root = proseRoot();
    if (!root) return null;

    var paras = root.querySelectorAll(':scope > p');
    if (paras.length < CFG.minParagraphs) return null;

    // Prefer the second h2 — a real section break, so the advert
    // lands between ideas rather than mid-argument.
    var heads = root.querySelectorAll(':scope > h2');
    if (heads.length >= 2) {
      heads[1].parentNode.insertBefore(el, heads[1]);
      return 'h2';
    }

    var idx = Math.min(4, paras.length - 2);
    paras[idx].parentNode.insertBefore(el, paras[idx].nextSibling);
    return 'paragraph';
  }

  /* ── Tracking ────────────────────────────────────────── */

  function track(name, extra) {
    if (typeof window.gtag !== 'function') return;
    var payload = {
      blogad_variant: extra.variant,
      blogad_page: window.location.pathname
    };
    for (var k in extra) if (k !== 'variant') payload['blogad_' + k] = extra[k];
    window.gtag('event', name, payload);
  }

  /* ── Run ─────────────────────────────────────────────── */

  function init() {
    var name = detect();
    var el = build(name);
    var how = place(el);
    if (!how) return;

    var seen = false;
    function reveal() {
      el.setAttribute('data-shown', 'true');
      if (seen) return;
      seen = true;
      track('blog_ad_view', { variant: name, position: how });
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) { reveal(); io.disconnect(); }
        }
      }, { threshold: 0.35 });
      io.observe(el);
    } else {
      reveal();
    }

    el.addEventListener('click', function (e) {
      var cta = e.target.closest('[data-szad-cta]');
      if (!cta) return;
      track('blog_ad_click', {
        variant: name,
        position: how,
        cta: cta.getAttribute('data-szad-cta'),
        link_url: cta.getAttribute('href')
      });
    });

    window.szBlogAd = { variant: name, position: how, el: el };
  }

  // Exposed so blog-ad-preview.html can render every variant from the
  // real component rather than a copy that drifts out of step.
  window.szBlogAdKit = { build: build, variants: VARIANTS, detect: detect };

  if (override === 'off') return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

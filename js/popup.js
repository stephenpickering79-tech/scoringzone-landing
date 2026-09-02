/* ============================================================
   Scoring Zone — Conversion popup
   ------------------------------------------------------------
   Injects the popup after a delay, with exit-intent as an
   early trigger on pointer devices.

   Usage:
     <link rel="stylesheet" href="css/popup.css">
     <script src="js/popup.js" defer></script>

   Overrides for testing:
     ?szpopup=off      disable
     ?szpdelay=0       fire immediately (ms)
     ?szpreset=1       clear the suppression record
   ============================================================ */

(function () {
  'use strict';

  var script = document.currentScript;

  var CFG = {
    variant: 'a2',
    // Readers on a blog post need time to get into the article. The popup
    // fires on whichever engagement signal lands first, never before minMs.
    minMs: 8000,
    delayMs: 30000,
    scrollPercent: 40,
    exitIntent: true,
    suppressDays: 7,
    convertedDays: 120,
    // Campaign-tagged destinations. These must stay in step with the
    // /go/ios and /go/android redirects in vercel.json, which carry the
    // same params for links shared outside the site.
    //   Apple  — pt/ct/mt surface the click in App Store Connect > Campaigns
    //   Web    — utm_* surface it in GA4 on scoringzone.app
    webUrl: 'https://scoringzone.app/?utm_source=scoringzone.net&utm_medium=popup&utm_campaign=app_download&utm_content=web',
    storeUrl: 'https://apps.apple.com/app/apple-store/id6769477447?pt=128906825&ct=Scoring%20Zone%20Website&mt=8',
    androidUrl: 'https://scoringzone.app/?utm_source=scoringzone.net&utm_medium=popup&utm_campaign=app_download&utm_content=android',
    assetBase: '',
    storageKey: 'sz_popup_v1',
    sessionKey: 'sz_popup_seen'
  };

  if (script) {
    if (script.dataset.variant) CFG.variant = script.dataset.variant;
    if (script.dataset.delay) CFG.delayMs = parseInt(script.dataset.delay, 10);
    if (script.dataset.minDelay) CFG.minMs = parseInt(script.dataset.minDelay, 10);
    if (script.dataset.scroll) CFG.scrollPercent = parseInt(script.dataset.scroll, 10);
    if (script.dataset.assetBase) CFG.assetBase = script.dataset.assetBase;
  }

  var params = new URLSearchParams(window.location.search);
  if (params.get('szpopup')) CFG.variant = params.get('szpopup').toLowerCase();
  if (params.get('szpdelay') !== null) {
    CFG.delayMs = parseInt(params.get('szpdelay'), 10) || 0;
    CFG.minMs = 0;
    CFG.scrollPercent = 0;
  }
  if (params.get('szpreset')) {
    safeRemove(CFG.storageKey);
    try { window.sessionStorage.removeItem('sz_popup_seen'); } catch (e) { /* private mode */ }
  }

  if (CFG.variant === 'off') return;
  if (CFG.variant !== 'a2') CFG.variant = 'a2';

  function asset(path) {
    return CFG.assetBase + path;
  }

  /* ── Suppression ─────────────────────────────────────── */

  function safeGet(k) {
    try { return window.localStorage.getItem(k); } catch (e) { return null; }
  }
  function safeSet(k, v) {
    try { window.localStorage.setItem(k, v); } catch (e) { /* private mode */ }
  }
  function safeRemove(k) {
    try { window.localStorage.removeItem(k); } catch (e) { /* private mode */ }
  }

  // Once per browsing session: seeing it on one page means it stays
  // away for every other page the visitor opens in the same tab.
  function seenThisSession() {
    try { return window.sessionStorage.getItem(CFG.sessionKey) === '1'; } catch (e) { return false; }
  }
  function markSeenThisSession() {
    try { window.sessionStorage.setItem(CFG.sessionKey, '1'); } catch (e) { /* private mode */ }
  }

  function isSuppressed() {
    var raw = safeGet(CFG.storageKey);
    if (!raw) return false;
    try {
      return Date.now() < JSON.parse(raw).until;
    } catch (e) {
      return false;
    }
  }

  function suppress(days, reason) {
    safeSet(CFG.storageKey, JSON.stringify({
      until: Date.now() + days * 86400000,
      reason: reason,
      variant: CFG.variant
    }));
  }

  if (isSuppressed() || seenThisSession()) return;

  /* ── Content ─────────────────────────────────────────── */

  // Quoted from the testimonials section of the homepage.
  var REVIEWS = [
    {
      name: 'Matt Wilson',
      meta: 'HCP 8 &middot; Dubai',
      photo: 'social-proof/thumbs/matt-wilson.webp',
      quote: 'Best short game app out there by far.'
    },
    {
      name: 'Aisling Jennings',
      meta: 'HCP 28 &middot; Dubai',
      photo: 'social-proof/thumbs/aisling-jennings.webp',
      quote: '&hellip;my short game has come on so much.'
    },
    {
      name: 'Max Newton',
      meta: 'HCP 18 &middot; Atlanta',
      photo: 'social-proof/thumbs/max-newton.webp',
      quote: 'It&rsquo;s like a game and makes me want to practise.'
    }
  ];

  var starSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  var downSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v13M6 13l6 6 6-6"/></svg>';
  var closeSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function reviewCard(r) {
    return '<figure class="szp-review">' +
      '<div class="szp-review-head">' +
        '<img src="' + asset(r.photo) + '" alt="" width="72" height="72" decoding="async">' +
        '<figcaption class="szp-review-who">' +
          '<span class="szp-review-name">' + r.name + '</span>' +
          '<span class="szp-review-meta">' + r.meta + '</span>' +
        '</figcaption>' +
        '<span class="szp-stars" role="img" aria-label="Rated 5 out of 5">' + starSvg + starSvg + starSvg + starSvg + starSvg + '</span>' +
      '</div>' +
      '<blockquote class="szp-review-quote">&ldquo;' + r.quote + '&rdquo;</blockquote>' +
    '</figure>';
  }

  function reviewMarquee() {
    var set = REVIEWS.map(reviewCard).join('');
    // The second pass is the loop's tail, not extra testimonials.
    return '<div class="szp-reviews">' +
      '<div class="szp-track">' + set +
        '<span aria-hidden="true" style="display:contents">' + set + '</span>' +
      '</div>' +
    '</div>';
  }

  function panel() {
    return '<div class="szp-panel">' +
      '<div class="szp-shot">' +
        '<img src="' + asset('app-screens/popup-panel.webp') + '" width="900" height="1276" decoding="async" ' +
        'alt="The Scoring Zone app home screen showing a 2.8 short game handicap, 11 drills this week, a 5 day streak and Level 7 progress">' +
      '</div>' +
    '</div>';
  }

  function body() {
    return '<div class="szp-body">' +
      '<span class="szp-claim"><i aria-hidden="true"></i>' +
        '<span class="szp-claim-long">World&rsquo;s </span>Fastest-growing short game app' +
      '</span>' +
      '<h2 class="szp-h" id="szp-title">Train your short game.<br><em>Lower your scores.</em></h2>' +
      '<p class="szp-sub">Built for golfers who want to improve, perform and <b>score under pressure</b>.</p>' +
      '<div class="szp-spec">' +
        '<div><b>35+</b><span>Drills &amp; tests</span></div>' +
        '<div><b>7-day</b><span>Free trial</span></div>' +
        '<div><b>iOS</b><span>+ Web app</span></div>' +
      '</div>' +
      '<div class="szp-actions">' +
        '<span class="szp-prompt">Download using the buttons below' + downSvg + '</span>' +
        '<div class="szp-stores">' +
          '<a class="szp-store" data-szp-cta="app_store" href="' + CFG.storeUrl + '" target="_blank" rel="noopener">' +
            '<img src="' + asset('badges/app-store-badge.svg') + '" alt="Download Scoring Zone on the App Store" height="44" decoding="async">' +
          '</a>' +
          '<a class="szp-store" data-szp-cta="android" href="' + CFG.androidUrl + '">' +
            '<img src="' + asset('badges/android-badge.webp') + '" alt="Download Scoring Zone for Android" width="520" height="152" decoding="async">' +
          '</a>' +
        '</div>' +
        '<span class="szp-foot szp-trial">7 day free trial</span>' +
      '</div>' +
    '</div>';
  }

  function markup() {
    return '<div class="szp-scrim" data-szp-close role="presentation"></div>' +
      '<div class="szp-card" role="dialog" aria-modal="true" aria-labelledby="szp-title" tabindex="-1">' +
        '<button type="button" class="szp-close" data-szp-close aria-label="Close">' + closeSvg + '</button>' +
        panel() +
        body() +
        reviewMarquee() +
      '</div>';
  }

  /* ── Build ───────────────────────────────────────────── */

  var root = document.createElement('div');
  root.className = 'szp szp--' + CFG.variant;
  root.setAttribute('data-open', 'false');
  root.innerHTML = markup();

  var card = root.querySelector('.szp-card');
  var opened = false;
  var lastFocus = null;
  var scrollLockY = 0;

  function track(name, extra) {
    if (typeof window.gtag !== 'function') return;
    var payload = { popup_variant: CFG.variant };
    for (var k in extra) payload[k] = extra[k];
    window.gtag('event', name, payload);
  }

  /* ── WHY EVERY SPLIT IS ALSO ITS OWN EVENT NAME ────────────────
     The params below (popup_cta, popup_trigger, popup_dismiss_reason)
     are readable in the GA4 UI but NOT through the Data API unless
     each one is registered as an event-scoped custom dimension in
     GA4 admin — and that route is closed to us. So alongside each
     general event we fire a specific one whose NAME carries the
     split, because eventName is built in and needs no registration.

     The general events keep their names and therefore their whole
     history; these are additive. The params stay too — they cost
     nothing and they are still what the GA4 UI shows.

     The metrics dashboard's /website page reads the names below.
     Renaming one here silently empties a panel there:
     scoring-zone-metrics/src/lib/ga4.ts.
     ------------------------------------------------------------ */

  // GA4 event names allow letters, digits and underscore only.
  function trackSplit(prefix, key) {
    track(prefix + String(key).toLowerCase().replace(/[^a-z0-9_]+/g, '_'));
  }

  function focusables() {
    return Array.prototype.filter.call(
      card.querySelectorAll('a[href], button:not([disabled])'),
      function (el) { return el.offsetParent !== null; }
    );
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close('escape');
      return;
    }
    if (e.key !== 'Tab') return;
    var list = focusables();
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function lockScroll() {
    scrollLockY = window.scrollY;
    var gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.position = 'fixed';
    document.body.style.top = -scrollLockY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    if (gap > 0) document.body.style.paddingRight = gap + 'px';
  }

  function unlockScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.paddingRight = '';
    window.scrollTo(0, scrollLockY);
  }

  function open() {
    if (opened) return;
    opened = true;
    clearTimeout(timer);
    document.removeEventListener('mouseout', onExitIntent);
    window.removeEventListener('scroll', onScroll);

    markSeenThisSession();
    document.body.appendChild(root);
    lastFocus = document.activeElement;
    lockScroll();

    // Force a frame so the entrance transition runs from its closed state.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.setAttribute('data-open', 'true');
      });
    });

    document.addEventListener('keydown', onKeydown);
    setTimeout(function () { card.focus({ preventScroll: true }); }, 60);
    track('popup_view', {
      popup_trigger: triggerReason,
      popup_page: window.location.pathname
    });
    // popup_open_timer | popup_open_scroll | popup_open_exit_intent
    trackSplit('popup_open_', triggerReason);
  }

  function close(reason) {
    if (!opened) return;
    opened = false;
    root.setAttribute('data-open', 'false');
    document.removeEventListener('keydown', onKeydown);
    unlockScroll();

    setTimeout(function () {
      if (root.parentNode) root.parentNode.removeChild(root);
    }, 500);

    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
    suppress(CFG.suppressDays, reason);
    track('popup_dismiss', { popup_dismiss_reason: reason });
    // popup_close_close | popup_close_scrim | popup_close_escape
    trackSplit('popup_close_', reason);
  }

  root.addEventListener('click', function (e) {
    var closer = e.target.closest('[data-szp-close]');
    if (closer) {
      e.preventDefault();
      close(closer.classList.contains('szp-scrim') ? 'scrim' : 'close');
      return;
    }
    var cta = e.target.closest('[data-szp-cta]');
    if (cta) {
      suppress(CFG.convertedDays, 'converted');
      track('popup_cta_click', {
        popup_cta: cta.getAttribute('data-szp-cta'),
        popup_trigger: triggerReason,
        popup_page: window.location.pathname,
        // The tagged destination, so GA4 can be reconciled against
        // App Store Connect campaigns and the scoringzone.app UTMs.
        // Named popup_link_url, not link_url, to avoid colliding with the
        // built-in GA4 dimension that enhanced measurement populates.
        popup_link_url: cta.getAttribute('href')
      });
      // popup_click_app_store | popup_click_web. Named for the
      // DESTINATION, not the badge: data-szp-cta="android" is the
      // Android-branded button, and it links to scoringzone.app —
      // the web app. There is no Play listing to count.
      var which = cta.getAttribute('data-szp-cta');
      trackSplit('popup_click_', which === 'android' ? 'web' : which);
    }
  });

  /* ── Triggers ────────────────────────────────────────────
     Whichever of these lands first wins, but nothing fires
     before minMs so a fast scroller is not interrupted.
     ------------------------------------------------------ */

  var armedAt = Date.now();
  var timer = setTimeout(open, Math.max(0, CFG.delayMs));

  function tooSoon() {
    return Date.now() - armedAt < CFG.minMs;
  }

  function fire(reason) {
    if (tooSoon()) {
      // Hold the trigger until the minimum dwell has elapsed.
      setTimeout(function () { openWith(reason); }, CFG.minMs - (Date.now() - armedAt));
      return;
    }
    openWith(reason);
  }

  function openWith(reason) {
    triggerReason = reason;
    open();
  }

  var triggerReason = 'timer';

  function onScroll() {
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    var pct = (window.scrollY / scrollable) * 100;
    if (pct >= CFG.scrollPercent) {
      window.removeEventListener('scroll', onScroll);
      fire('scroll');
    }
  }

  if (CFG.scrollPercent > 0) {
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function onExitIntent(e) {
    if (e.clientY > 8) return;
    if (e.relatedTarget || e.toElement) return;
    fire('exit_intent');
  }

  if (CFG.exitIntent && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mouseout', onExitIntent);
  }

  // Warm the panel image shortly after arming, not on first paint.
  setTimeout(function () {
    new Image().src = asset('app-screens/popup-panel.webp');
  }, Math.max(2000, CFG.minMs - 2500));

  window.szPopup = { open: open, close: close, config: CFG };
})();

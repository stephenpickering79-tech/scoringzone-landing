/* ============================================================
   Scoring Zone — Sticky mobile app bar
   ------------------------------------------------------------
   A persistent bottom bar on phones: dismiss X, logo, name, and
   one "Get app" button that resolves to the right store for the
   device it is being read on.

   Usage:
     <script src="js/app-bar.js" data-asset-base="" defer></script>
     <script src="../js/app-bar.js" data-asset-base="../" defer></script>

   data-asset-base is the path back to the site root, matching the
   convention blog-ad.js already uses, because this file is loaded
   from pages at three different depths.

   It ships its own CSS rather than living in shared.css: only 164
   of the 222 pages load shared.css, and the bar is meant to be on
   every public page, so it cannot depend on a stylesheet that may
   not be there.

   Overrides for testing:
     ?szbar=off     hide
     ?szbar=on      show, ignoring both the dismissal and the
                    viewport check (so it can be seen on desktop)
     ?szbar=ios     force the iOS link
     ?szbar=android force the Android link
   ============================================================ */

(function () {
  'use strict';

  var SCRIPT = document.currentScript ||
    (function () { var s = document.getElementsByTagName('script'); return s[s.length - 1]; })();
  var BASE = (SCRIPT && SCRIPT.getAttribute('data-asset-base')) || '';

  var DISMISS_KEY = 'sz_appbar_dismissed_until';
  var DISMISS_DAYS = 30;
  var MAX_WIDTH = 768;          // matches the site's mobile breakpoint

  var IOS_URL = 'https://apps.apple.com/us/app/scoring-zone-golf/id6769477447' +
                '?pt=128906825&ct=Scoring%20Zone%20App%20Bar&mt=8';
  var ANDROID_URL = 'https://scoringzone.app/?utm_source=scoringzone.net' +
                    '&utm_medium=app_bar&utm_campaign=app_download&utm_content=android';

  var params = new URLSearchParams(window.location.search);
  var override = params.get('szbar');
  if (override === 'off') return;

  /* ---- Which store? --------------------------------------------
     iPadOS 13+ reports itself as a Mac, and the only reliable tell
     is that the "Mac" has a touchscreen — hence the maxTouchPoints
     check rather than a userAgent match alone. */
  function isIOS() {
    var ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  }
  function isAndroid() {
    return /Android/i.test(navigator.userAgent || '');
  }

  var platform =
    override === 'ios' ? 'ios' :
    override === 'android' ? 'android' :
    isIOS() ? 'ios' :
    isAndroid() ? 'android' : 'other';

  // Anything that is not an iPhone/iPad goes to the web app, which
  // is also where the Play listing points.
  var href = platform === 'ios' ? IOS_URL : ANDROID_URL;

  /* ---- Should it show at all? ---------------------------------- */
  function dismissed() {
    try {
      var until = window.localStorage.getItem(DISMISS_KEY);
      return !!until && Date.now() < parseInt(until, 10);
    } catch (e) {
      return false;   // Safari private mode throws on localStorage
    }
  }

  if (override !== 'on') {
    if (window.innerWidth > MAX_WIDTH) return;
    if (dismissed()) return;
  }

  /* ---- Styles --------------------------------------------------
     Scoped to .sz-appbar. A light bar because the site alternates
     dark and white chapters, and near-white is the one value that
     stays legible over both. */
  var css = [
    '.sz-appbar{',
      'position:fixed;left:0;right:0;bottom:0;z-index:9000;',
      'display:flex;align-items:center;gap:10px;',
      'padding:9px 12px;',
      'padding-bottom:calc(9px + env(safe-area-inset-bottom,0px));',
      'background:#ffffff;',
      'border-top:1px solid rgba(13,26,16,0.12);',
      'box-shadow:0 -6px 24px rgba(6,11,8,0.14);',
      'font-family:"DM Sans",system-ui,-apple-system,sans-serif;',
      'transform:translateY(100%);',
      'transition:transform .28s ease;',
    '}',
    '.sz-appbar.is-in{transform:none}',
    '@media (prefers-reduced-motion: reduce){',
      '.sz-appbar{transition:none}',
    '}',

    /* Dismiss — left, like the reference. 40px keeps it a real tap
       target without letting it compete with the CTA. */
    '.sz-appbar-close{',
      'flex:none;display:flex;align-items:center;justify-content:center;',
      'width:34px;height:34px;margin-left:-4px;padding:0;',
      'border:0;border-radius:50%;background:transparent;',
      'color:#6b7a70;cursor:pointer;',
    '}',
    '.sz-appbar-close:hover{background:rgba(13,26,16,0.06);color:#0d1a10}',
    '.sz-appbar-close:focus-visible{outline:2px solid #15803d;outline-offset:2px}',
    '.sz-appbar-close svg{width:15px;height:15px;display:block}',

    '.sz-appbar-logo{',
      'flex:none;width:38px;height:38px;border-radius:9px;display:block;',
      'object-fit:cover;background:#0a120c;',
    '}',

    '.sz-appbar-text{flex:1 1 auto;min-width:0;line-height:1.25}',
    '.sz-appbar-name{',
      'display:block;font-size:0.95rem;font-weight:700;color:#0d1a10;',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
    '}',
    '.sz-appbar-sub{',
      'display:block;margin-top:1px;font-size:0.75rem;color:#5b6b60;',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
    '}',

    '.sz-appbar-cta{',
      'flex:none;display:inline-flex;align-items:center;justify-content:center;',
      'min-height:38px;padding:0 18px;',
      'border-radius:999px;background:#16a34a;color:#ffffff;',
      'font-size:0.92rem;font-weight:700;letter-spacing:0.01em;',
      'text-decoration:none;white-space:nowrap;',
      'transition:background .2s ease;',
    '}',
    '.sz-appbar-cta:hover{background:#15803d;color:#ffffff}',
    '.sz-appbar-cta:focus-visible{outline:2px solid #0d1a10;outline-offset:2px}',

    /* Very narrow phones: drop the subtitle before anything wraps. */
    '@media (max-width: 360px){',
      '.sz-appbar{gap:8px;padding-left:9px;padding-right:9px}',
      '.sz-appbar-sub{display:none}',
      '.sz-appbar-cta{padding:0 14px}',
    '}',

    /* Desktop never sees it, including after a resize. */
    '@media (min-width: ' + (MAX_WIDTH + 1) + 'px){',
      '.sz-appbar:not(.is-forced){display:none}',
    '}'
  ].join('');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---- Markup -------------------------------------------------- */
  var bar = document.createElement('div');
  bar.className = 'sz-appbar' + (override === 'on' ? ' is-forced' : '');
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Get the Scoring Zone app');

  var close = document.createElement('button');
  close.type = 'button';
  close.className = 'sz-appbar-close';
  close.setAttribute('aria-label', 'Dismiss the app download bar');
  close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.2" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M5 5l14 14M19 5L5 19"/></svg>';

  var logo = document.createElement('img');
  logo.className = 'sz-appbar-logo';
  logo.src = BASE + 'logo/new-log.webp';
  logo.alt = '';
  logo.width = 38;
  logo.height = 38;
  logo.setAttribute('aria-hidden', 'true');
  logo.setAttribute('decoding', 'async');

  var text = document.createElement('div');
  text.className = 'sz-appbar-text';
  var name = document.createElement('span');
  name.className = 'sz-appbar-name';
  name.textContent = 'Scoring Zone';
  var sub = document.createElement('span');
  sub.className = 'sz-appbar-sub';
  sub.textContent = 'Available for iOS and Android';
  text.appendChild(name);
  text.appendChild(sub);

  var cta = document.createElement('a');
  cta.className = 'sz-appbar-cta';
  cta.href = href;
  cta.textContent = 'Get app';
  cta.setAttribute('data-cta', 'app_bar_' + platform);
  cta.setAttribute('rel', 'noopener');

  bar.appendChild(close);
  bar.appendChild(logo);
  bar.appendChild(text);
  bar.appendChild(cta);

  /* ---- Insert + keep the footer clear -------------------------- */
  function mount() {
    document.body.appendChild(bar);

    // Reserve the bar's height so the last of the footer is reachable
    // rather than sitting permanently underneath it.
    var pad = bar.offsetHeight;
    var prev = document.body.style.paddingBottom;
    document.body.dataset.szAppbarPrevPad = prev || '';
    document.body.style.paddingBottom =
      'calc(' + (prev && prev !== '0px' ? prev + ' + ' : '') + pad + 'px)';

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { bar.classList.add('is-in'); });
    });
  }

  function unmount() {
    bar.remove();
    document.body.style.paddingBottom = document.body.dataset.szAppbarPrevPad || '';
    delete document.body.dataset.szAppbarPrevPad;
  }

  close.addEventListener('click', function () {
    try {
      window.localStorage.setItem(
        DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 864e5));
    } catch (e) { /* private mode — it just comes back next load */ }

    bar.classList.remove('is-in');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      unmount();
    } else {
      setTimeout(unmount, 300);
    }
  });

  cta.addEventListener('click', function () {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'app_bar_click', {
        platform: platform,
        page_location: window.location.href
      });
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

/* =====================================================================
   Rank result popup, for the "Where do you rank?" calculator on the
   handicap-by-age guide.

   SZRankCard.open(result) shows the calculator's result as a modal: the
   "Rank Result Popup" handoff (2026-11-14), result step only. Its plan
   button hands over to the guide's original onboarding (js/plan-funnel.js)
   through result.onPlan; the handoff's quiz and email gate are not used here.
   Styles: the shared shell in css/rank-popup.css, plus its .sgp-rk-* rules.

     result  from the page's calculator, so the popup and the inline card
             never disagree: { hcp, hcpText, gender: 'male'|'female',
             ageTxt, avg, avgText, pct, tier, diff, onPlan }

   Events (GA4 + PostHog), src "rank_finder": rank_popup_open,
   rank_popup_plan, rank_popup_close.
   ===================================================================== */
(function () {
  'use strict';

  var REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var FINE = !!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);
  var CALC_URL = '/tools/golf-handicap-calculator';

  // The app's skill keys (CategoryTile + GolfIcons), in the handoff's colours.
  var SKILLS = [
    { c: '#C9A0FF', icon: '<line x1="5" y1="4" x2="10" y2="12"/><rect x="9" y="12" width="9" height="3.3" rx="0.6"/><circle cx="16" cy="18.5" r="1.6" fill="currentColor"/><line x1="4" y1="20.5" x2="20" y2="20.5" opacity=".5"/>' },
    { c: '#F2C94C', icon: '<line x1="3" y1="20" x2="21" y2="20" opacity=".5"/><path d="M5 18 C 9 9, 14 9, 17 17" stroke-dasharray="2 2" opacity=".9"/><circle cx="5" cy="18" r="1.3" fill="currentColor"/><line x1="18.5" y1="6" x2="18.5" y2="20"/><path d="M18.5 6 L23 7.5 L18.5 9 Z" fill="currentColor" opacity=".85"/>' },
    { c: '#4ADE80', icon: '<line x1="3" y1="20" x2="21" y2="20" opacity=".5"/><line x1="8" y1="3" x2="11.5" y2="14"/><path d="M10 14.5 L15 16.5 L13.2 12.5 Z" fill="currentColor" opacity=".85"/><path d="M14 16 C 16 6, 20 8, 20 18" stroke-dasharray="2 2" opacity=".8"/><circle cx="20" cy="18" r="1.2" fill="currentColor"/>' },
    { c: '#7DB3FF', icon: '<line x1="2" y1="20" x2="22" y2="20" opacity=".5"/><line x1="4" y1="5" x2="10" y2="15"/><path d="M9 15.5 L14 17 L12 13 Z" fill="currentColor" opacity=".85"/><path d="M13 17 C 15 3, 20 3, 22 15" stroke-dasharray="2 2"/><circle cx="22" cy="15" r="1.2" fill="currentColor"/>' },
  ];
  var LOGO = '<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="14" fill="none" stroke="#01F343" stroke-width="1.9"/><circle cx="15" cy="15" r="8.2" fill="none" stroke="#01F343" stroke-width="1.9"/><circle cx="15" cy="15" r="3.5" fill="#01F343"/></svg>';
  var X = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var ARROW = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var MAIL = '<svg width="13" height="10" viewBox="0 0 13 10" aria-hidden="true"><rect x=".6" y=".6" width="11.8" height="8.8" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M1 1.4l5.5 4 5.5-4" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>';

  function orb(s) {
    return '<span class="sgp-orb" style="--s:50px;--c:' + s.c + '" aria-hidden="true"><i>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">' + s.icon + '</svg></i></span>';
  }
  function track(name, props) {
    props = props || {};
    props.src = 'rank_finder';
    try { if (window.gtag) window.gtag('event', name, props); } catch (e) {}
    try { if (window.posthog && window.posthog.capture) window.posthog.capture(name, props); } catch (e) {}
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // "an 8", "an 11", "an 18", "an 80"; "a 14", "a +2"
  function article(h) { return /^(8|11|18)(\D|$)/.test(h) || /^8\d/.test(h) ? 'an' : 'a'; }
  function shots(n) { return n + (n === '1' ? ' shot' : ' shots'); }

  var root, modal, content, lastFocus, downOnBackdrop = false, res = null;

  function cardHtml(r) {
    var who = r.gender === 'female' ? 'women' : 'men', person = r.gender === 'female' ? 'woman' : 'man';
    var even = Math.abs(r.diff) < 0.5, d = Math.abs(r.diff).toFixed(1).replace(/\.0$/, '');
    var good = even || r.diff > 0; // diff = age average − index: positive is better
    var gap = even ? '±0' : (r.diff > 0 ? '−' : '+') + d;
    var line = 'The average ' + person + ' aged ' + r.ageTxt + ' plays to ' + r.avgText + '. Your ' + r.hcpText + ' is ' +
      (even ? 'right on your age group’s average.' : shots(d) + ' ' + (r.diff > 0 ? 'better than' : 'behind') + ' your age group.');
    // The age average sits on the centre tick; the green runs from you to the right, the share you're ahead of.
    var pos = Math.max(4, Math.min(96, 100 - r.pct)) + '%';
    return '<div class="sgp-stack">' +
      '<div class="sgp-card sgp-res">' +
        '<span class="sgp-lbl">' + esc((r.tier + ' · ' + who + ' ' + r.ageTxt).toUpperCase()) + '</span>' +
        '<div class="sgp-disp sgp-rk-big" id="sgp-title">Ahead of <b>' + r.pct + '%</b></div>' +
        '<span class="sgp-sub">of ' + who + ' aged ' + esc(r.ageTxt) + '</span>' +
        '<div class="sgp-rk-sl" aria-hidden="true"><i class="sgp-rk-track"></i><i class="sgp-rk-fill" style="left:50%" data-left="' + pos + '"></i>' +
          '<i class="sgp-rk-tick"></i><i class="sgp-rk-you" style="left:50%" data-left="' + pos + '"></i></div>' +
        '<div class="sgp-rk-legend" aria-hidden="true"><span>← LOWER</span><span>AGE AVG</span><span>HIGHER →</span></div>' +
        '<div class="sgp-rk-stats">' +
          '<div><span>YOU</span><b>' + esc(r.hcpText) + '</b></div>' +
          '<div><span>AGE AVG</span><b style="color:var(--sgp-dim)">' + esc(r.avgText) + '</b></div>' +
          '<div style="background:' + (good ? 'rgba(74,222,128,.07)' : 'rgba(242,201,76,.06)') + '"><span>GAP</span><b style="color:' + (good ? 'var(--sgp-green)' : 'var(--sgp-warn)') + '">' + gap + '</b></div>' +
        '</div>' +
        '<p class="sgp-rk-line">' + esc(line) + '</p>' +
        '<p class="sgp-rk-link">Want your official Handicap Index? <a href="' + CALC_URL + '">Use the free calculator →</a></p>' +
      '</div>' +
      '<div class="sgp-card sgp-rk-offer"><div class="sgp-cglow"></div>' +
        '<div class="sgp-keys">' + SKILLS.map(orb).join('') + '</div>' +
        '<span class="sgp-lbl">Free · 2-week plan</span>' +
        '<h2 class="sgp-h3">Want to improve your handicap?</h2>' +
        '<p class="sgp-body">Answer a few quick questions and we’ll build 4 practice sessions around your weakest area, with targets set for ' + article(r.hcpText) + ' ' + esc(r.hcpText) + ' handicap.</p>' +
        '<button type="button" class="sgp-btn" data-sgp-plan><span>Get my free plan</span>' + ARROW + '</button>' +
        '<div class="sgp-rk-foot">' + MAIL + '<span>Sent to your inbox as a PDF</span></div>' +
      '</div>' +
    '</div>';
  }

  function build() {
    root = document.createElement('div');
    root.className = 'sgp';
    root.innerHTML = '<div class="sgp-m" role="dialog" aria-modal="true" aria-labelledby="sgp-title" tabindex="-1"><div class="sgp-glow" aria-hidden="true"></div>' +
      '<div class="sgp-h"><div class="sgp-brand">' + LOGO + '<span>Scoring Zone</span></div>' +
      '<button type="button" class="sgp-ib" data-sgp-close aria-label="Close">' + X + '</button></div>' +
      '<div class="sgp-c"></div></div>';
    modal = root.firstChild;
    content = modal.querySelector('.sgp-c');
    // The backdrop closes only on a press that starts and ends on it.
    root.addEventListener('pointerdown', function (e) { downOnBackdrop = e.target === root; });
    root.addEventListener('click', function (e) {
      if (e.target === root) { if (downOnBackdrop) close(); return; }
      var t = e.target.closest('button');
      if (!t) return;
      if (t.hasAttribute('data-sgp-close')) close();
      else if (t.hasAttribute('data-sgp-plan')) plan();
    });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return; // keep focus inside the popup
      var f = [].filter.call(modal.querySelectorAll('button, a[href]'), function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === modal)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    document.body.appendChild(root);
  }

  function open(result) {
    if (!result) return;
    if (!root) build();
    res = result;
    content.innerHTML = cardHtml(result);
    lastFocus = document.activeElement;
    document.documentElement.classList.add('sgp-lock');
    root.classList.remove('open'); void root.offsetWidth; // replay the entrance on every open
    root.classList.add('open');
    root.scrollTop = 0;
    // The marker and its fill slide from the age average to the golfer.
    var slide = function () { [].forEach.call(content.querySelectorAll('[data-left]'), function (el) { el.style.left = el.getAttribute('data-left'); }); };
    if (REDUCED) slide(); else requestAnimationFrame(function () { requestAnimationFrame(slide); });
    var target = FINE ? content.querySelector('[data-sgp-plan]') : modal; // touch: no focus ring on arrival
    try { target.focus({ preventScroll: true }); } catch (e) {}
    track('rank_popup_open', { pct: result.pct, hcp: result.hcp, gender: result.gender, age: result.ageTxt });
  }

  function close(why) {
    if (!root || !root.classList.contains('open')) return;
    root.classList.remove('open');
    document.documentElement.classList.remove('sgp-lock');
    if (why !== 'plan') track('rank_popup_close', {});
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
  }

  // Hand over to the guide's own onboarding, unchanged.
  function plan() {
    track('rank_popup_plan', { pct: res.pct });
    close('plan');
    if (res.onPlan) res.onPlan();
  }

  window.SZRankCard = { open: open, close: close };
})();

/* =====================================================================
   Short game handicap popup, for the UK rank calculator.

   SZRankPopup.open(result, step) shows the calculator's result as a modal,
   sells the free short game plan, asks four questions (one per skill, the
   app's four), gates the per-skill handicaps behind an email, then reveals
   them. Design: the "Short Game Handicap Popup" handoff (2026-11-14), styled
   in css/rank-popup.css.

     result  from the page's calculator, so the popup and the inline card
             never disagree: { hcp, hcpText, gender, age, avg, pct,
             diffTxt, diffGood, nextTxt }
     step    0 the result (default), 1 the first question. Reopening with
             step 1 resumes wherever the golfer left off.

   The email step posts to the `lead-plan` edge function, the same send as
   js/plan-funnel.js: the PDF is the app's own 2-week plan for the weakest
   area (js/plan-engine.js), and the golfer joins the Brevo lead list. The
   PDF's "Est. short game handicap", "Biggest gap" and shots-lost bars are
   this popup's numbers, so the email repeats what the reveal showed.

   Events (GA4 + PostHog), src "uk_rank", flow "sg_popup": lead_funnel_open,
   lead_funnel_step, lead_submit, lead_sent, lead_failed, lead_funnel_close.
   ===================================================================== */
(function () {
  'use strict';

  var FN_URL = 'https://smlftzaikxfneaxnahkt.supabase.co/functions/v1/lead-plan';
  // The app's public (anon) key, as in js/plan-funnel.js.
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbGZ0emFpa3hmbmVheG5haGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODYzMDgsImV4cCI6MjA4NTk2MjMwOH0.qtJt3tuA6O9Upcwg6-7-GqKJCaNWuqceE1r7OruY7yo';
  var SRC = 'uk_rank', FLOW = 'sg_popup';
  // The lead-plan function's own pattern, so nothing passes here and fails there.
  var EMAIL_RE = /^[A-Za-z0-9._%+'-]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,24}$/;
  var REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var FINE = !!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);

  /* ── The short game model ──────────────────────────────────────────────
     ⚠️ PLACEHOLDER SCORING, from the design handoff ("illustrative, replace
     with the real scoring model"). Each answer (worst → best) maps to a
     handicap for that skill; the short game handicap is their mean, and the
     weakest skill is the highest number (the first wins a tie).
     Shots lost (the PDF's bars) are hcp × 0.38 ÷ 4 per skill: the app's
     estimator counts 38% of strokes over scratch as short game
     (baselineEstimate.ts SHORTGAME_SHARE). An even split keeps the bars in
     the same order as the handicaps, so the PDF's "Biggest gap" is the
     longest bar. */
  var SHOTS_PER_HCP = 0.38 / 4;
  var SKILLS = [
    { key: 'putting', name: 'Putting', range: 'On the green', c: '#C9A0FF',
      q: 'How many putts in a typical round?', hint: 'Count every stroke on the green.',
      opts: ['36 or more', '33–35', '30–32', '29 or fewer'],
      short: ['36+ PUTTS', '33–35 PUTTS', '30–32 PUTTS', '≤29 PUTTS'], hcp: [24, 15, 8, 1],
      icon: '<line x1="5" y1="4" x2="10" y2="12"/><rect x="9" y="12" width="9" height="3.3" rx="0.6"/><circle cx="16" cy="18.5" r="1.6" fill="currentColor"/><line x1="4" y1="20.5" x2="20" y2="20.5" opacity=".5"/>' },
    { key: 'chips', name: 'Chipping', range: 'Around the green', c: '#F2C94C',
      q: 'How often do you get up and down from just off the green?', hint: 'Chip or pitch, then hole the putt.',
      opts: ['Under 20%', '20–35%', '35–50%', 'Over 50%'],
      short: ['<20% UP & DOWN', '20–35% UP & DOWN', '35–50% UP & DOWN', '50%+ UP & DOWN'], hcp: [25, 16, 8, 0],
      icon: '<line x1="3" y1="20" x2="21" y2="20" opacity=".5"/><path d="M5 18 C 9 9, 14 9, 17 17" stroke-dasharray="2 2" opacity=".9"/><circle cx="5" cy="18" r="1.3" fill="currentColor"/><line x1="18.5" y1="6" x2="18.5" y2="20"/><path d="M18.5 6 L23 7.5 L18.5 9 Z" fill="currentColor" opacity=".85"/>' },
    { key: 'short-wedges', name: 'Short Wedges', range: 'Inside 50 yards', c: '#4ADE80',
      q: 'From inside 50 yards, how often do you finish within 15 feet?', hint: 'Pitches and half swings, not chips.',
      opts: ['Rarely', 'About 1 in 4', 'About half', 'Most of the time'],
      short: ['RARELY INSIDE 15FT', '1 IN 4 INSIDE 15FT', 'HALF INSIDE 15FT', 'MOSTLY INSIDE 15FT'], hcp: [24, 16, 8, 1],
      icon: '<line x1="3" y1="20" x2="21" y2="20" opacity=".5"/><line x1="8" y1="3" x2="11.5" y2="14"/><path d="M10 14.5 L15 16.5 L13.2 12.5 Z" fill="currentColor" opacity=".85"/><path d="M14 16 C 16 6, 20 8, 20 18" stroke-dasharray="2 2" opacity=".8"/><circle cx="20" cy="18" r="1.2" fill="currentColor"/>' },
    { key: 'distance-wedges', name: 'Distance Wedges', range: '50 to 100 yards', c: '#7DB3FF',
      q: 'From 50–100 yards, how often do you hit the green?', hint: 'Full and three-quarter wedges.',
      opts: ['Under 25%', '25–50%', '50–75%', 'Over 75%'],
      short: ['<25% GREENS', '25–50% GREENS', '50–75% GREENS', '75%+ GREENS'], hcp: [24, 16, 9, 2],
      icon: '<line x1="2" y1="20" x2="22" y2="20" opacity=".5"/><line x1="4" y1="5" x2="10" y2="15"/><path d="M9 15.5 L14 17 L12 13 Z" fill="currentColor" opacity=".85"/><path d="M13 17 C 15 3, 20 3, 22 15" stroke-dasharray="2 2"/><circle cx="22" cy="15" r="1.2" fill="currentColor"/>' },
  ];
  // Stand-ins behind the blur on the email gate: the real numbers never reach the DOM before unlock.
  var DECOY = ['14.2', '9.8', '17.5', '11.3'];
  var STEP_NAME = ['result', 'q_putting', 'q_chipping', 'q_short_wedges', 'q_distance_wedges', 'email', 'reveal'];

  /* ── Icons ───────────────────────────────────────────────────────────── */
  var LOGO = '<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="14" fill="none" stroke="#01F343" stroke-width="1.9"/><circle cx="15" cy="15" r="8.2" fill="none" stroke="#01F343" stroke-width="1.9"/><circle cx="15" cy="15" r="3.5" fill="#01F343"/></svg>';
  var X = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var BACK = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M12 7H2.5M6.5 3 2.5 7l4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ARROW = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var MAIL = '<svg width="16" height="12" viewBox="0 0 13 10" aria-hidden="true"><rect x=".6" y=".6" width="11.8" height="8.8" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M1 1.4l5.5 4 5.5-4" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>';
  var LOCK = '<svg width="9" height="11" viewBox="0 0 10 12" aria-hidden="true"><rect x=".6" y="5" width="8.8" height="6.4" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M2.6 5V3.4a2.4 2.4 0 0 1 4.8 0V5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';

  function orb(s, size) {
    return '<span class="sgp-orb" style="--s:' + size + 'px;--c:' + s.c + '" aria-hidden="true"><i>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">' + s.icon + '</svg></i></span>';
  }

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  function track(name, props) {
    props = props || {};
    props.src = SRC; props.flow = FLOW;
    try { if (window.gtag) window.gtag('event', name, props); } catch (e) {}
    try { if (window.posthog && window.posthog.capture) window.posthog.capture(name, props); } catch (e) {}
  }
  function anonId() {
    try {
      var k = 'sz.site.anon', v = localStorage.getItem(k);
      if (!v && window.crypto && crypto.randomUUID) { v = crypto.randomUUID(); localStorage.setItem(k, v); }
      return v || null;
    } catch (e) { return null; }
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function r1(n) { return Math.round(n * 10) / 10; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function f1(n) { return r1(Math.abs(n)).toFixed(1); }
  // One decimal; below zero is a plus handicap, shown "+1.2".
  function fmtH(n) { return (n < -0.05 ? '+' : '') + f1(n); }
  // "an 8.5", "an 11.0", "an 18.0"; "a 14.2", "a +1.0"
  function article(h) { return /^(8|11|18)(\D|$)/.test(h) || /^8\d/.test(h) ? 'an' : 'a'; }

  /* ── State ───────────────────────────────────────────────────────────── */
  var root, modal, head, content, lastFocus, swapTimer, pickTimer, raf;
  var res = null;
  var st = { step: 0, answers: [null, null, null, null], email: '', sending: false, err: '', sent: false, p: 1 };

  function score() {
    var h = SKILLS.map(function (s, i) { return s.hcp[st.answers[i]]; });
    var sg = h.reduce(function (a, b) { return a + b; }, 0) / h.length;
    var weak = 0;
    h.forEach(function (v, i) { if (v > h[weak]) weak = i; });
    return { h: h, sg: sg, weak: weak, gap: sg - res.hcp };
  }

  /* ── Markup ──────────────────────────────────────────────────────────── */
  function headHtml() {
    var s = st.step, left;
    if (s === 0 || s === 6) {
      left = '<div class="sgp-brand">' + LOGO + '<span>Scoring Zone</span></div>';
    } else {
      var dots = SKILLS.map(function (k, i) {
        return '<i style="' + (i < s ? 'background:' + k.c + ';' : '') + (i === s - 1 ? 'box-shadow:0 0 8px ' + k.c : '') + '"></i>';
      }).join('');
      left = '<button type="button" class="sgp-ib" data-sgp-back aria-label="Back">' + BACK + '</button>' +
        '<div class="sgp-prog"><div class="sgp-dots" aria-hidden="true">' + dots + '</div>' +
        '<span aria-label="Question ' + Math.min(s, 4) + ' of 4">' + Math.min(s, 4) + '/4</span></div>';
    }
    return left + '<button type="button" class="sgp-ib" data-sgp-close aria-label="Close">' + X + '</button>';
  }

  function resultHtml() {
    var who = res.gender === 'women' ? 'women in England' : 'men in England';
    return '<div class="sgp-stack">' +
      '<div class="sgp-card sgp-res">' +
        '<span class="sgp-lbl">Your result · ' + who + '</span>' +
        '<div class="sgp-res-row">' +
          '<div class="sgp-disp sgp-ahead" id="sgp-title">Ahead of <b>' + res.pct + '%</b></div>' +
          '<div class="sgp-idx"><b>' + esc(res.hcpText) + '</b><span>/ AVG ' + res.avg + '</span></div>' +
        '</div>' +
        '<span class="sgp-sub">of ' + who + ' with a handicap (estimate)</span>' +
        '<div class="sgp-bar" role="img" aria-label="Ahead of ' + res.pct + '% of ' + who + '"><i data-w="' + res.pct + '%"></i></div>' +
        '<div class="sgp-foot"><span style="color:' + (res.diffGood ? 'var(--sgp-green)' : 'var(--sgp-warn)') + '">' + esc(res.diffTxt) + '</span><span>' + esc(res.nextTxt) + '</span></div>' +
      '</div>' +
      '<div class="sgp-card sgp-offer"><div class="sgp-cglow"></div>' +
        '<div class="sgp-keys">' + SKILLS.map(function (s) { return orb(s, 50); }).join('') + '</div>' +
        '<h2 class="sgp-h3">Want to improve your handicap?</h2>' +
        '<p class="sgp-body">Your index says ' + esc(res.hcpText) + '. Get a handicap for each area of your short game, plus a free 2-week plan for your weakest one.</p>' +
        '<button type="button" class="sgp-btn" data-sgp-start><span>Get free short game practice plan</span>' + ARROW + '</button>' +
      '</div>' +
      '<div class="sgp-pill">' + MAIL + '<span>4 quick questions · result sent to your inbox</span></div>' +
    '</div>';
  }

  function questionHtml(qi) {
    var s = SKILLS[qi];
    return '<div class="sgp-pad" style="--c:' + s.c + '">' +
      '<div class="sgp-qh">' + orb(s, 60) + '<div><b>' + s.name + '</b><span>' + s.range + '</span></div></div>' +
      '<h2 class="sgp-h3 sgp-q" id="sgp-title">' + s.q + '</h2>' +
      '<span class="sgp-hint">' + s.hint + '</span>' +
      '<div class="sgp-opts" role="radiogroup" aria-labelledby="sgp-title">' +
        s.opts.map(function (o, i) {
          var on = st.answers[qi] === i;
          return '<button type="button" class="sgp-opt" role="radio" aria-checked="' + on + '" data-sgp-pick="' + i + '"><span>' + o + '</span><i aria-hidden="true"></i></button>';
        }).join('') +
      '</div></div>';
  }

  function gateHtml() {
    var ok = EMAIL_RE.test(st.email.trim());
    return '<div class="sgp-pad sgp-gate">' +
      '<span class="sgp-lbl">Result ready</span>' +
      '<h2 class="sgp-h3" id="sgp-title">Your four handicaps are in</h2>' +
      '<div class="sgp-rows">' +
        SKILLS.map(function (s, i) {
          return '<div class="sgp-row" style="--c:' + s.c + '">' + orb(s, 48) +
            '<div class="sgp-row-name"><b>' + s.name + '</b><span class="sgp-locked">' + LOCK + 'LOCKED</span></div>' +
            '<div class="sgp-hcp" aria-hidden="true"><span>HCP</span><b class="blur">' + DECOY[i] + '</b></div></div>';
        }).join('') +
      '</div>' +
      '<form class="sgp-form" novalidate data-sgp-form>' +
        '<label for="sgp-email">Email to unlock</label>' +
        '<input id="sgp-email" class="sgp-email' + (ok ? ' ok' : '') + '" type="email" name="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" placeholder="you@example.com" value="' + esc(st.email) + '"' +
          (st.err ? ' aria-invalid="true" aria-describedby="sgp-err"' : '') + (st.sending ? ' disabled' : '') + '>' +
        '<input class="sgp-hp" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        (st.err ? '<span class="sgp-err" id="sgp-err" role="alert">' + esc(st.err) + '</span>' : '') +
        '<button type="submit" class="sgp-btn"' + (st.sending ? ' disabled' : '') + '>' + (st.sending ? 'Calculating…' : 'Unlock my handicaps') + '</button>' +
      '</form>' +
      '<span class="sgp-fine">Includes your free 2-week short game plan as a PDF. No spam, unsubscribe any time.</span>' +
    '</div>';
  }

  function revealHtml() {
    var sc = score(), sgTxt = fmtH(sc.sg), g = r1(sc.gap), shots = Math.round(sc.gap), line;
    if (sc.gap > 0.5) line = 'Inside 100 yards you play like ' + article(sgTxt) + ' ' + sgTxt + '. That’s roughly ' + shots + ' shot' + (shots === 1 ? '' : 's') + ' a round you can win back without touching your driver.';
    else if (sc.gap < -0.5) line = 'Your short game is ' + f1(sc.gap) + ' shots better than your index. Sharpen your weakest area and the next milestone gets closer.';
    else line = 'Your short game matches your index. Your weakest area below is the fastest route to lower scores.';
    var weak = SKILLS[sc.weak];
    return '<div class="sgp-stack tight sgp-done">' +
      '<div class="sgp-card sgp-hero"><div class="sgp-cglow"></div>' +
        '<h2 class="sgp-lbl" id="sgp-title" style="margin:0;font-weight:400">Short game handicap</h2>' +
        '<div class="sgp-hero-row">' +
          '<span class="sgp-big" data-sgp-count="' + sc.sg + '" aria-label="' + sgTxt + '">' + fmtH(sc.sg * st.p) + '</span>' +
          '<div class="sgp-two">' +
            '<div><span>INDEX</span><b>' + esc(res.hcpText) + '</b></div>' +
            '<div><span>GAP</span><b style="color:' + (sc.gap > 0.5 ? 'var(--sgp-warn)' : 'var(--sgp-green)') + '">' + (g >= 0 ? '+' : '−') + f1(g) + '</b></div>' +
          '</div>' +
        '</div>' +
        '<p class="sgp-line">' + line + '</p>' +
      '</div>' +
      SKILLS.map(function (s, i) {
        var a = st.answers[i], focus = i === sc.weak;
        var dots = [0, 1, 2].map(function (d) { return '<i' + (d < a ? ' class="on"' : '') + '></i>'; }).join('');
        return '<div class="sgp-card sgp-row sgp-srow' + (focus ? ' focus' : '') + '" style="--c:' + s.c + '">' + orb(s, 54) +
          '<div class="sgp-row-name"><div class="sgp-nm"><b>' + s.name + '</b>' + (focus ? '<span class="sgp-tag">PLAN FOCUS</span>' : '') + '</div>' +
            '<div class="sgp-str"><span aria-hidden="true">' + dots + '</span><span>' + s.short[a] + '</span></div></div>' +
          '<div class="sgp-hcp"><span>HCP</span><b data-sgp-count="' + sc.h[i] + '" aria-label="' + fmtH(sc.h[i]) + '">' + fmtH(sc.h[i] * st.p) + '</b></div></div>';
      }).join('') +
      '<div class="sgp-pill sgp-done-pill">' + MAIL + '<span>' + weak.name + ' plan sent to <strong>' + esc(st.email.trim()) + '</strong></span></div>' +
      '<button type="button" class="sgp-btn2" data-sgp-close>Back to the guide</button>' +
    '</div>';
  }

  function paint() {
    head.innerHTML = headHtml();
    var s = st.step;
    content.innerHTML = s === 0 ? resultHtml() : s <= 4 ? questionHtml(s - 1) : s === 5 ? gateHtml() : revealHtml();
    modal.setAttribute('aria-labelledby', 'sgp-title');
    if (s === 0) {
      var bar = content.querySelector('.sgp-bar i');
      if (REDUCED) bar.style.width = bar.getAttribute('data-w');
      else requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.width = bar.getAttribute('data-w'); }); });
    }
  }

  function focusStep() {
    var s = st.step, el;
    if (s >= 1 && s <= 4) el = content.querySelector('.sgp-opt[aria-checked="true"]') || content.querySelector('.sgp-opt');
    else if (s === 5 && FINE) el = content.querySelector('#sgp-email');
    else if (s === 0) el = content.querySelector('[data-sgp-start]');
    if (!el || (s === 0 && !FINE)) el = modal; // touch: no focus ring or keyboard pop on arrival
    try { el.focus({ preventScroll: true }); } catch (e) {}
  }

  /* ── Steps ───────────────────────────────────────────────────────────── */
  function go(step) {
    clearTimeout(swapTimer); clearTimeout(pickTimer);
    var swap = function () {
      st.step = step; st.err = '';
      if (step === 6) st.p = REDUCED || document.visibilityState === 'hidden' ? 1 : 0;
      paint();
      root.scrollTop = 0;
      content.classList.add('out'); void content.offsetWidth; content.classList.remove('out');
      focusStep();
      track('lead_funnel_step', { step: STEP_NAME[step] });
      if (step === 6 && st.p < 1) countUp();
    };
    if (REDUCED) return swap();
    content.classList.add('out');
    swapTimer = setTimeout(swap, 180);
  }

  // Every number on the reveal tweens 0 → value over 1100ms, ease-out cubic.
  function countUp() {
    cancelAnimationFrame(raf);
    var t0 = null, els = content.querySelectorAll('[data-sgp-count]');
    var tick = function (t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / 1100);
      st.p = 1 - Math.pow(1 - k, 3);
      if (document.visibilityState === 'hidden') st.p = 1;
      [].forEach.call(els, function (el) { el.textContent = fmtH(Number(el.getAttribute('data-sgp-count')) * st.p); });
      if (st.p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function pick(i) {
    var qi = st.step - 1;
    st.answers[qi] = i;
    [].forEach.call(content.querySelectorAll('.sgp-opt'), function (b) { b.setAttribute('aria-checked', String(Number(b.getAttribute('data-sgp-pick')) === i)); });
    clearTimeout(pickTimer);
    pickTimer = setTimeout(function () { go(st.step + 1); }, 260);
  }

  function setErr(msg) {
    st.err = msg;
    paint();
    var input = content.querySelector('#sgp-email');
    if (input && FINE) try { input.focus({ preventScroll: true }); } catch (e) {}
  }

  function submit(form) {
    if (st.sending) return;
    var email = st.email.trim();
    if (!EMAIL_RE.test(email)) return setErr('Enter a valid email to see your result.');
    if (!window.SZEngine) return setErr('We couldn’t send it. Refresh the page and try again.');
    var sc = score(), weak = SKILLS[sc.weak];
    // The plan: the app's engine, told only the index and the weakest skill, builds the 2-week
    // plan for that skill. A plus index plans at scratch and is sent as "no index" (the function takes 0–54).
    var payload = window.SZEngine.leadBody(email, {
      hcp: r1(Math.max(0, res.hcp)), weakest: weak.key, frequency: null,
      upDowns: null, threePutts: null, bunkerUpDowns: null, shortPutts: null, shortSided: null, pitchShots: null,
    }, anonId());
    payload.hcp = res.hcp >= 0 ? r1(res.hcp) : null;
    payload.estimate = clamp(r1(sc.sg), -5, 60);
    payload.shotsLost = {};
    SKILLS.forEach(function (s, i) { payload.shotsLost[s.key] = clamp(r1(Math.max(0, sc.h[i]) * SHOTS_PER_HCP), 0, 20); });
    payload.src = SRC;
    var hp = form.querySelector('[name="company"]');
    payload.company = hp ? hp.value : '';

    st.sending = true; st.err = ''; st.email = email; paint();
    var info = { weakest: weak.key, sg_hcp: r1(sc.sg), hcp: res.hcp, gender: res.gender, age: res.age || 'any', has_index: payload.hcp !== null };
    SKILLS.forEach(function (s, i) { info['a_' + s.key.replace('-', '_')] = st.answers[i]; info['h_' + s.key.replace('-', '_')] = sc.h[i]; });
    track('lead_submit', info);
    fetch(FN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: 'Bearer ' + ANON_KEY, apikey: ANON_KEY },
      body: JSON.stringify(payload),
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, ok: r.ok && j && j.ok, j: j }; });
    }).then(function (out) {
      st.sending = false;
      if (out.ok) { st.sent = true; track('lead_sent', { weakest: weak.key }); go(6); return; }
      track('lead_failed', { status: out.status, reason: out.j && out.j.error });
      setErr(out.status === 429
        ? 'You’ve asked for a plan in the last few minutes. Check your inbox, or try again shortly.'
        : out.j && out.j.error === 'invalid' && out.j.field === 'email'
          ? 'Enter a valid email to see your result.'
          : 'We couldn’t send it. Check the address and try again.');
    }).catch(function () {
      st.sending = false;
      track('lead_failed', { status: 0 });
      setErr('We couldn’t send it. Check your connection and try again.');
    });
  }

  /* ── Events ──────────────────────────────────────────────────────────── */
  // The backdrop closes only on a press that starts and ends on it, so a text
  // selection dragged out of the email field never shuts the popup.
  var downOnBackdrop = false;
  function onClick(e) {
    if (e.target === root) { if (downOnBackdrop) close(); return; }
    var t = e.target.closest('button');
    if (!t || t.disabled) return;
    if (t.hasAttribute('data-sgp-close')) close();
    else if (t.hasAttribute('data-sgp-back')) go(st.step - 1);
    else if (t.hasAttribute('data-sgp-start')) go(st.sent ? 6 : 1);
    else if (t.hasAttribute('data-sgp-pick')) pick(Number(t.getAttribute('data-sgp-pick')));
  }
  function onInput(e) {
    if (e.target.id !== 'sgp-email') return;
    st.email = e.target.value;
    e.target.classList.toggle('ok', EMAIL_RE.test(st.email.trim()));
    if (st.err) { // typing clears the last attempt's message
      st.err = '';
      e.target.removeAttribute('aria-invalid');
      e.target.removeAttribute('aria-describedby');
      var m = content.querySelector('.sgp-err'); if (m) m.remove();
    }
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') { // keep focus inside the popup
      var f = [].filter.call(modal.querySelectorAll('button:not([disabled]), input:not([disabled]):not(.sgp-hp)'), function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === modal)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    // Arrow keys move between a question's options, as in any radio group.
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) >= 0 && e.target.classList && e.target.classList.contains('sgp-opt')) {
      e.preventDefault();
      var opts = [].slice.call(content.querySelectorAll('.sgp-opt')), i = opts.indexOf(e.target);
      var n = opts[(i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : opts.length - 1)) % opts.length];
      if (n) n.focus();
    }
  }

  function build() {
    root = document.createElement('div');
    root.className = 'sgp';
    root.innerHTML = '<div class="sgp-m" role="dialog" aria-modal="true" tabindex="-1"><div class="sgp-glow" aria-hidden="true"></div>' +
      '<div class="sgp-h"></div><div class="sgp-c"></div></div>';
    modal = root.firstChild;
    head = modal.querySelector('.sgp-h');
    content = modal.querySelector('.sgp-c');
    root.addEventListener('pointerdown', function (e) { downOnBackdrop = e.target === root; });
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('keydown', onKey);
    root.addEventListener('submit', function (e) { e.preventDefault(); if (e.target.hasAttribute('data-sgp-form')) submit(e.target); });
    document.body.appendChild(root);
  }

  /* ── API ─────────────────────────────────────────────────────────────── */
  function open(result, step) {
    if (!result) return;
    if (!root) build();
    var fresh = !res || res.hcp !== result.hcp || res.gender !== result.gender;
    res = result;
    if (!st.sending) {
      // Step 1 (the inline card's plan button) resumes a walk already under way.
      st.step = step === 1 ? (st.sent ? 6 : (st.step >= 1 && st.step <= 5 && !fresh ? st.step : 1)) : 0;
      st.err = '';
    }
    if (st.step === 6) st.p = 1;
    clearTimeout(swapTimer); clearTimeout(pickTimer); cancelAnimationFrame(raf);
    content.classList.remove('out');
    paint();
    lastFocus = document.activeElement;
    document.documentElement.classList.add('sgp-lock');
    root.classList.remove('open'); void root.offsetWidth; // replay the entrance on every open
    root.classList.add('open');
    root.scrollTop = 0;
    focusStep();
    track('lead_funnel_open', { step: STEP_NAME[st.step], hcp: res.hcp, gender: res.gender, age: res.age || 'any', pct: res.pct });
  }

  function close() {
    if (!root || !root.classList.contains('open')) return;
    clearTimeout(swapTimer); clearTimeout(pickTimer); cancelAnimationFrame(raf);
    if (st.step === 6) st.p = 1;
    root.classList.remove('open');
    document.documentElement.classList.remove('sgp-lock');
    track('lead_funnel_close', { step: STEP_NAME[st.step] });
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
  }

  window.SZRankPopup = { open: open, close: close };
})();

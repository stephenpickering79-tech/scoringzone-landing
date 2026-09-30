/* =====================================================================
   Calculator lead funnel: the app's first-run cards, hosted on the website.

   SZFunnel.open({ hcp, src }) opens a full-screen sheet (a phone-sized card on
   desktop) that looks and moves like the app's onboarding (obStd.css,
   AreaPickerCard.tsx), rebuilt here in plain JS:
     1 area  2 handicap + practice  3 questions 1–3  4 questions 4–6
     5 where you stand  6 building your plan  7 email  8 check your inbox
   The estimate and the plan come from js/plan-engine.js, a build of the app's
   own engine (scripts/build-plan-engine.sh). Nothing in the app changes.

   The email step posts drill ids + numbers to the `lead-plan` edge function,
   which renders the PDF from its own drill library, sends it and adds the
   golfer to the Brevo lead list. No free text leaves this page but the email.

   Events (GA4 + PostHog): lead_funnel_open, lead_funnel_step, lead_submit,
   lead_sent, lead_failed, lead_app_click, lead_funnel_close.
   ===================================================================== */
(function () {
  'use strict';

  var FN_URL = 'https://smlftzaikxfneaxnahkt.supabase.co/functions/v1/lead-plan';
  // The app's public (anon) key: already in every scoringzone.app page. The
  // function also requires it; access is limited by the function itself.
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbGZ0emFpa3hmbmVheG5haGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODYzMDgsImV4cCI6MjA4NTk2MjMwOH0.qtJt3tuA6O9Upcwg6-7-GqKJCaNWuqceE1r7OruY7yo';
  var APP_STORE = 'https://apps.apple.com/us/app/golf-practice-scoring-zone/id6769477447?pt=128906825&ct=Lead%20Funnel&mt=8';
  var WEB_APP = 'https://scoringzone.app/?utm_source=scoringzone.net&utm_medium=lead_funnel&utm_campaign=android';

  var HUE = { putting: '#C084FC', chips: '#F6C85F', 'short-wedges': '#22E06B', 'distance-wedges': '#60A5FA' };
  var AREAS = [
    { key: 'putting', name: 'Putting', sub: 'On the surface', glowAt: '80% 50%', glowA: '2E' },
    { key: 'chips', name: 'Chipping', sub: 'Around the green', glowAt: '80% 38%', glowA: '2E' },
    { key: 'short-wedges', name: 'Short wedges', sub: 'Inside 50 yards', glowAt: '60% 30%', glowA: '29' },
    { key: 'distance-wedges', name: 'Distance wedges', sub: '50 to 100 yards', glowAt: '55% 22%', glowA: '2E' },
  ];
  // The area picker's shot geometry, from AreaPickerCard.tsx (layout "a").
  var GEO = {
    chips: { d: 'M18 86 Q50 42 82 84 Q86 86 90 86 L132 86', hole: [136, 86], sh: 'M18 86 L132 86' },
    putting: { d: 'M18 82 C58 74 100 92 136 80', hole: [140, 80] },
    'short-wedges': { d: 'M18 86 Q74 12 130 84', hole: [134, 86], sh: 'M18 86 L130 86' },
    'distance-wedges': { d: 'M12 86 Q80 -20 146 84', hole: [148, 86], sh: 'M12 86 L146 86' },
  };
  // [label, value], as the app's cards draw them.
  var FREQ = [
    ['Daily', 'daily'], ['2–3× wk', '2-3x'], ['1× wk', 'weekly'],
    ['2–3× mo', '2-3x-month'], ['1× mo', 'monthly'], ['Rarely', 'rarely'],
  ];
  var OUT_OF_5 = [0, 1, 2, 3, 4, 5].map(function (v) { return [String(v), v]; });
  var QUESTIONS = [
    { id: 'upDowns', n: '01', name: 'Up and downs', hint: '↑ Higher is better', q: 'From 15 yards, how many out of 10 do you get up and down?',
      opts: [['0–1', 1], ['2–3', 3], ['4–5', 5], ['6–7', 7], ['8+', 9]] },
    { id: 'threePutts', n: '02', name: 'Three putts', hint: '↓ Lower is better', q: 'Three-putts in a typical round?',
      opts: [['None', 0], ['1', 1], ['2', 2], ['3', 3], ['4+', 4]] },
    { id: 'bunkerUpDowns', n: '03', name: 'Bunker shots', hint: '↑ Higher is better', q: '20-yard bunker shot: out of 5, how many do you get up and down?', opts: OUT_OF_5 },
    { id: 'shortPutts', n: '04', name: 'Short putts', hint: '↑ Higher is better', q: 'Out of 10 putts from 6 feet, how many do you hole?',
      opts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (v) { return [String(v), v]; }), cols: 5 },
    { id: 'shortSided', n: '05', name: 'Short sided', hint: '↑ Higher is better', q: '5 flop shots to a tight pin off a tight lie. How many finish within 5 feet?', opts: OUT_OF_5 },
    { id: 'pitchShots', n: '06', name: 'Pitch shot', hint: '↑ Higher is better', q: '5 short pitches from 50 yards. How many finish within 10 feet?', opts: OUT_OF_5 },
  ];
  var STEPS = ['area', 'basics', 'q1', 'q2', 'estimate', 'build', 'email', 'sent'];
  var PCT = { area: 12, basics: 26, q1: 40, q2: 54, estimate: 68, build: 80, email: 92, sent: 100 };
  var LABEL = { area: 'Step 1 of 6', basics: 'Step 2 of 6', q1: 'Step 3 of 6', q2: 'Step 4 of 6', estimate: 'Your estimate', build: 'Building', email: 'Your plan', sent: 'Your plan' };
  var GLOW_STEPS = { area: 1, estimate: 1, sent: 1 };
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8h11M9.5 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var TICK = '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 5.2 4.2 7.3 8 2.8" fill="none" stroke="#0A0A0F" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function track(name, props) {
    try { if (window.gtag) window.gtag('event', name, props || {}); } catch (e) {}
    try { if (window.posthog && window.posthog.capture) window.posthog.capture(name, props || {}); } catch (e) {}
  }
  function anonId() {
    try {
      var k = 'sz.site.anon', v = localStorage.getItem(k);
      if (!v && window.crypto && crypto.randomUUID) { v = crypto.randomUUID(); localStorage.setItem(k, v); }
      return v || null;
    } catch (e) { return null; }
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dl(s) { return ' style="--d:' + s + 's"'; }

  /* The area picker's animated shot (AreaPickerCard shotArt), as markup. SMIL,
     looping out of phase; a still drawing when motion is reduced. */
  function shotArt(cat, i) {
    var c = HUE[cat], s = GEO[cat], id = 'szf-' + cat, hx = s.hole[0], hy = s.hole[1];
    var x0 = Number(s.d.split(' ')[0].slice(1));
    var loop = ' dur="3.8s" begin="' + (-i * 0.55) + 's" repeatCount="indefinite"';
    var kt = '0;0.12;0.62;1';
    var ks = cat === 'putting' ? '0 0 1 1;0.15 0.55 0.3 1;0 0 1 1' : '0 0 1 1;0.3 0.05 0.3 1;0 0 1 1';
    var fade = '<animate attributeName="opacity" values="0;1;1;1;0" keyTimes="0;0.1;0.62;0.86;1"' + loop + '/>';
    var wedge = cat === 'short-wedges' || cat === 'distance-wedges';
    var h = '<svg viewBox="0 0 160 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" style="display:block;overflow:visible" aria-hidden="true"><defs>' +
      '<linearGradient id="tr-' + id + '" gradientUnits="userSpaceOnUse" x1="' + x0 + '" y1="0" x2="' + hx + '" y2="0"><stop offset="0" stop-color="' + c + '" stop-opacity="0"/><stop offset="0.6" stop-color="' + c + '" stop-opacity="0.7"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>' +
      '<linearGradient id="gr-' + id + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<filter id="bl-' + id + '" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.6"/></filter></defs>';
    h += cat === 'putting'
      ? '<ellipse cx="' + (x0 + hx) / 2 + '" cy="' + (hy + 4) + '" rx="' + (hx - x0) / 1.7 + '" ry="12" fill="' + c + '" opacity="0.06"/>'
      : '<rect x="0" y="86.5" width="100%" height="0.8" fill="url(#gr-' + id + ')"/>';
    h += '<path d="' + s.d + '" fill="none" stroke="' + c + '" stroke-opacity="0.28" stroke-width="0.9" stroke-dasharray="1 3.2" stroke-linecap="round"/>';
    if (wedge) h += '<line x1="' + hx + '" y1="' + hy + '" x2="' + hx + '" y2="' + (hy - 22) + '" stroke="#F5F5F5" stroke-opacity="0.5" stroke-width="0.8"/><path d="M' + hx + ' ' + (hy - 22) + ' L' + (hx - 9) + ' ' + (hy - 19) + ' L' + hx + ' ' + (hy - 16) + ' Z" fill="' + c + '" opacity="0.85"/>';
    h += '<ellipse cx="' + hx + '" cy="' + hy + '" rx="4.5" ry="1.5" fill="#000" stroke="' + c + '" stroke-opacity="0.7" stroke-width="0.6"/>';
    if (!REDUCED) {
      h += '<ellipse cx="' + hx + '" cy="' + hy + '" rx="5" ry="1.7" fill="none" stroke="' + c + '" stroke-width="0.9">' +
        '<animate attributeName="rx" values="5;5;5;22;22" keyTimes="0;0.6;0.62;0.92;1"' + loop + '/>' +
        '<animate attributeName="ry" values="1.7;1.7;1.7;7;7" keyTimes="0;0.6;0.62;0.92;1"' + loop + '/>' +
        '<animate attributeName="opacity" values="0;0;0.9;0;0" keyTimes="0;0.6;0.62;0.92;1"' + loop + '/></ellipse>';
      h += '<path d="' + s.d + '" fill="none" stroke="url(#tr-' + id + ')" stroke-width="1.8" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1">' +
        '<animate attributeName="stroke-dashoffset" values="1;1;0;0" keyTimes="' + kt + '" calcMode="spline" keySplines="' + ks + '"' + loop + '/>' + fade + '</path>';
      if (s.sh) h += '<ellipse cx="0" cy="0" rx="4" ry="1" fill="' + c + '" opacity="0"><animateMotion path="' + s.sh + '" keyPoints="0;0;1;1" keyTimes="' + kt + '" calcMode="spline" keySplines="' + ks + '"' + loop + '/>' +
        '<animate attributeName="opacity" values="0;0.5;0.5;0.3;0" keyTimes="0;0.1;0.62;0.86;1"' + loop + '/></ellipse>';
      h += '<g opacity="0"><animateMotion path="' + s.d + '" keyPoints="0;0;1;1" keyTimes="' + kt + '" calcMode="spline" keySplines="' + ks + '"' + loop + '/>' + fade +
        '<circle r="6" fill="' + c + '" opacity="0.55" filter="url(#bl-' + id + ')"/><circle r="2.3" fill="#fff"/></g>';
    }
    return h + '</svg>';
  }

  var root, sheet, body, backBtn, labelEl, pctEl, segsEl, lastFocus, buildTimer, countTimer;
  var state, src;

  function fresh(hcp) {
    return {
      step: 'area', weakest: null, frequency: null, hcpText: hcp == null ? '' : String(hcp), noIndex: false,
      upDowns: null, threePutts: null, bunkerUpDowns: null, shortPutts: null, shortSided: null, pitchShots: null,
      email: '', sending: false, error: '', built: false,
    };
  }

  function build() {
    root = document.createElement('div');
    root.className = 'szf';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Get your free practice plan');
    root.innerHTML =
      '<div class="szf-scrim" data-szf-close></div>' +
      '<div class="szf-sheet"><div class="szf-glow" aria-hidden="true"></div>' +
        '<div class="szf-chrome"><div class="szf-top">' +
          '<button type="button" class="szf-back" data-szf-back aria-label="Previous step"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" style="transform:scaleX(-1)"><path d="M2.5 8h11M9.5 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Back</span></button>' +
          '<div class="szf-toplabel" aria-live="polite"></div>' +
          '<button type="button" class="szf-x" data-szf-close aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '</div>' +
        '<div class="szf-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="Progress"><div class="szf-segs" aria-hidden="true">' +
          '<div class="szf-seg"><i></i></div><div class="szf-seg"><i></i></div><div class="szf-seg"><i></i></div><div class="szf-seg"><i></i></div><div class="szf-seg"><i></i></div><div class="szf-seg"><i></i></div>' +
        '</div><div class="szf-pct" aria-hidden="true">0%</div></div></div>' +
        '<div class="szf-body"></div>' +
      '</div>';
    sheet = root.querySelector('.szf-sheet');
    body = root.querySelector('.szf-body');
    backBtn = root.querySelector('[data-szf-back]');
    labelEl = root.querySelector('.szf-toplabel');
    pctEl = root.querySelector('.szf-pct');
    segsEl = root.querySelector('.szf-segs');
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('keydown', onKey);
    root.addEventListener('submit', function (e) { e.preventDefault(); submit(e.target); });
    document.body.appendChild(root);
  }

  function answers() {
    var n = parseFloat(String(state.hcpText).replace(',', '.'));
    var hcp = !state.noIndex && isFinite(n) && n >= 0 && n <= 54 ? Math.round(n * 10) / 10 : null;
    return {
      hcp: hcp, weakest: state.weakest, frequency: state.frequency,
      upDowns: state.upDowns, threePutts: state.threePutts, bunkerUpDowns: state.bunkerUpDowns,
      shortPutts: state.shortPutts, shortSided: state.shortSided, pitchShots: state.pitchShots,
    };
  }
  function hcpValid() {
    if (state.noIndex || String(state.hcpText).trim() === '') return true;
    var t = String(state.hcpText).trim().replace(',', '.');
    var n = Number(t);
    return /^\d{1,2}(\.\d)?$/.test(t) && n >= 0 && n <= 54;
  }

  function setChrome() {
    var i = STEPS.indexOf(state.step), pct = PCT[state.step];
    backBtn.hidden = i === 0 || state.step === 'build' || state.step === 'sent' || state.sending;
    labelEl.textContent = LABEL[state.step];
    pctEl.textContent = pct + '%';
    root.querySelector('.szf-prog').setAttribute('aria-valuenow', pct);
    var filled = pct / 100 * 6;
    [].forEach.call(segsEl.children, function (s, k) { s.firstChild.style.width = Math.max(0, Math.min(1, filled - k)) * 100 + '%'; });
    sheet.classList.toggle('glow', !!GLOW_STEPS[state.step]);
  }

  function go(step) {
    clearTimeout(buildTimer); clearInterval(countTimer);
    state.step = step;
    state.error = '';
    render();
    track('lead_funnel_step', { step: step, src: src });
    body.scrollTop = 0;
    sheet.scrollLeft = 0; body.scrollLeft = 0; // the glow is wider than the sheet; never let it pan
    var f = body.querySelector('[data-autofocus]');
    if (f) try { f.focus({ preventScroll: true }); } catch (e) {}
    if (step === 'estimate') animateEstimate();
    if (step === 'build') runBuild();
  }

  function opts(key, list, cols, sm) {
    var cur = state[key];
    return '<div class="szf-opts" role="radiogroup" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))">' +
      list.map(function (o) {
        return '<button type="button" class="szf-opt' + (sm ? ' sm' : '') + '" role="radio" aria-checked="' + (cur === o[1]) + '" data-szf-pick="' + key + '" data-v="' + esc(o[1]) + '">' + esc(o[0]) + '</button>';
      }).join('') + '</div>';
  }
  function question(q, k) {
    return '<div class="szf-card szf-q szf-in"' + dl(0.2 + k * 0.12) + '><div class="szf-qhead"><div><span class="szf-qnum">' + q.n + '</span><span class="szf-qname" id="szf-' + q.id + '">' + esc(q.name) + '</span></div>' +
      '<span class="szf-hint">' + esc(q.hint) + '</span></div><p class="szf-qtext">' + esc(q.q) + '</p>' +
      opts(q.id, q.opts, q.cols || q.opts.length, true) + '</div>';
  }

  function render() {
    setChrome();
    var E = window.SZEngine, h = '';

    if (state.step === 'area') {
      h = '<div class="szf-step"><h1 class="szf-h1 szf-in"' + dl(0.1) + '>Select the area you want to <em>improve</em></h1>' +
        '<div class="szf-grid" role="radiogroup" aria-label="The area you want to improve">' + AREAS.map(function (a, k) {
          var c = HUE[a.key];
          return '<button type="button" class="szf-tile szf-in" role="radio" aria-checked="' + (state.weakest === a.key) + '" data-szf-area="' + a.key + '"' + (k === 0 ? ' data-autofocus' : '') +
            ' style="--d:' + (0.25 + k * 0.12) + 's;--hue:' + c + ';--tglow:radial-gradient(90% 60% at ' + a.glowAt + ', ' + c + a.glowA + ', transparent 70%)">' +
            '<span class="szf-tglow" aria-hidden="true"></span><span class="szf-art">' + shotArt(a.key, k) + '</span>' +
            '<span class="szf-ttext"><span class="szf-tnum" aria-hidden="true">0' + (k + 1) + '</span><span class="szf-tname">' + a.name + '</span><span class="szf-thint">' + a.sub + '</span></span>' +
            '<span class="szf-ring" aria-hidden="true"></span><span class="szf-check" aria-hidden="true"><i>' + TICK + '</i></span></button>';
        }).join('') + '</div><div class="szf-spacer"></div><p class="szf-foot szf-in"' + dl(0.8) + '>Free 2-week plan · sent as a PDF</p></div>';
    } else if (state.step === 'basics') {
      var bad = !hcpValid();
      var lbl = state.noIndex ? 'No index · we’ll use a typical round' : (src === 'rank_finder' && state.hcpText !== '' ? 'From your calculator' : 'Your handicap index');
      h = '<div class="szf-step"><h1 class="szf-h1 szf-in"' + dl(0.05) + '>Let’s build <em>a plan</em></h1>' +
        '<p class="szf-label szf-in" id="szf-hcp-l" style="--d:0.25s;margin-top:28px">' + lbl + '</p>' +
        '<label class="szf-hcp szf-in"' + dl(0.3) + '><input id="szf-hcp" type="text" inputmode="decimal" autocomplete="off" placeholder="00.0" aria-labelledby="szf-hcp-l" value="' + esc(state.hcpText) + '"' + (state.noIndex ? ' disabled' : '') + (bad ? ' aria-invalid="true"' : '') + '></label>' +
        (bad ? '<p class="szf-err">Enter an index between 0 and 54.</p>' : '') +
        '<button type="button" class="szf-link szf-in"' + dl(0.4) + ' data-szf-noindex aria-pressed="' + state.noIndex + '"><span class="box" aria-hidden="true">' + (state.noIndex ? TICK : '') + '</span>I don’t have a handicap index</button>' +
        '<p class="szf-label szf-in" style="--d:0.5s;margin-top:26px">How often you practise</p>' +
        '<div class="szf-in"' + dl(0.55) + ' style="--d:0.55s;margin-top:8px">' + opts('frequency', FREQ, 3, false) + '</div>' +
        '<p class="szf-note szf-in"' + dl(0.7) + '>Sets your plan’s pace, not the estimate.</p>' +
        '<div class="szf-spacer"></div><button type="button" class="szf-btn szf-in"' + dl(0.75) + ' data-szf-next="q1"' + (bad ? ' disabled' : '') + '>Continue ' + ARROW + '</button>' +
        '<p class="szf-foot">No account needed</p></div>';
    } else if (state.step === 'q1') {
      h = '<div class="szf-step"><h1 class="szf-h1 szf-in"' + dl(0.05) + '>Let’s get <em>some data</em></h1>' +
        '<p class="szf-sub szf-in"' + dl(0.15) + '>Best guesses are fine. Skip any you don’t know.</p>' +
        '<div class="szf-qs">' + QUESTIONS.slice(0, 3).map(question).join('') + '</div>' +
        '<div class="szf-spacer"></div><button type="button" class="szf-btn szf-in"' + dl(0.7) + ' data-szf-next="q2">Continue ' + ARROW + '</button></div>';
    } else if (state.step === 'q2') {
      h = '<div class="szf-step"><h1 class="szf-h1 szf-in"' + dl(0.05) + '>Last <em>few</em></h1>' +
        '<div class="szf-qs">' + QUESTIONS.slice(3).map(question).join('') + '</div>' +
        '<div class="szf-spacer"></div><button type="button" class="szf-btn szf-in"' + dl(0.7) + ' data-szf-next="estimate">Calculate handicap ' + ARROW + '</button></div>';
    } else if (state.step === 'estimate') {
      var est = E.estimate(answers());
      var max = Math.max.apply(null, est.skills.map(function (s) { return s.shotsLost; }).concat([0.1]));
      var wc = HUE[est.weakest.category];
      h = '<div class="szf-step"><h1 class="szf-h1 szf-in"' + dl(0.05) + '>Here’s where <em>you stand</em></h1>' +
        '<div class="szf-card szf-est szf-in"' + dl(0.2) + '><div class="szf-esttop"><span class="szf-fig" data-count="' + est.estimatedHcp + '">0.0</span><span class="szf-vr"></span>' +
        '<div><span class="szf-pill szf-pop" style="--d:0.9s;color:#F5A524;border-color:rgba(245,165,36,0.35);background:rgba(245,165,36,0.08)">Estimate</span>' +
        '<div class="szf-estname">Short game handicap</div><div class="szf-weak" style="color:' + wc + '"><span style="background:' + wc + '"></span>Weakest: ' + esc(est.weakest.label) + '</div></div></div>' +
        '<div class="szf-rule"></div><div class="szf-bars" role="group" aria-label="Shots lost by skill">' + est.skills.map(function (s, k) {
          var c = HUE[s.category], f = s.category === est.weakest.category;
          return '<div class="szf-bar szf-in' + (f ? ' focus' : '') + '" style="--d:' + (0.35 + k * 0.08) + 's"><span class="l"><i style="background:' + c + ';box-shadow:0 0 8px ' + c + '"></i>' + esc(s.label) + '</span>' +
            '<span class="t"><i data-w="' + Math.min(1, s.shotsLost / max) * 100 + '" style="background:linear-gradient(90deg,' + c + '59,' + c + ');' + (f ? 'box-shadow:0 0 10px ' + c + '73' : '') + '"></i></span>' +
            '<span class="v" style="color:' + (f ? c : 'var(--fg)') + '">' + s.shotsLost.toFixed(1) + '</span></div>';
        }).join('') + '</div>' +
        '<div class="szf-gapline szf-in"' + dl(0.8) + '>● About ' + est.totalShotsLost.toFixed(1) + ' shots a round to find</div></div>' +
        '<p class="szf-note szf-in"' + dl(0.9) + '>An estimate from your answers. The plan’s drills measure the real number.</p>' +
        '<div class="szf-spacer"></div><button type="button" class="szf-btn szf-in"' + dl(1) + ' data-szf-next="build">Build my plan ' + ARROW + '</button></div>';
    } else if (state.step === 'build') {
      var ticks = '';
      for (var t = 0; t < 90; t++) {
        var an = ((t / 90) * 360 - 90) * Math.PI / 180, r0 = t % 30 === 0 ? 95 : 98;
        ticks += '<line class="tick" data-i="' + t + '" x1="' + (104 + r0 * Math.cos(an)).toFixed(2) + '" y1="' + (104 + r0 * Math.sin(an)).toFixed(2) + '" x2="' + (104 + 104 * Math.cos(an)).toFixed(2) + '" y2="' + (104 + 104 * Math.sin(an)).toFixed(2) + '" stroke="#fff" stroke-opacity="0.12" stroke-width="2" stroke-linecap="round"/>';
      }
      h = '<div class="szf-step"><div class="szf-build" aria-live="polite"><h1 class="szf-h1" id="szf-btitle">Reading your answers</h1><p class="szf-sub" id="szf-bsub">Six answers, one handicap</p>' +
        '<svg class="szf-dial" viewBox="0 0 208 208" aria-hidden="true">' + ticks +
        '<g class="done"><circle cx="104" cy="104" r="44" fill="rgba(0,255,136,0.1)" stroke="#00FF88" stroke-opacity="0.5"/><path d="M86 105 L99 118 L123 91" fill="none" stroke="#00FF88" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>' +
        '<text id="szf-bpct" x="104" y="116" text-anchor="middle" fill="#F5F5F5" style="font:700 34px \'Barlow Condensed\',sans-serif">0%</text></svg>' +
        '<div class="szf-rail"><span data-r="0" class="on">Your answers</span><span data-r="1">Your level</span><span data-r="2">Your drills</span></div></div>' +
        '<div class="szf-spacer"></div><button type="button" class="szf-btn" data-szf-next="email" id="szf-bgo" style="visibility:hidden">Get your custom plan ' + ARROW + '</button></div>';
    } else if (state.step === 'email') {
      var e2 = E.estimate(answers()), c2 = HUE[e2.weakest.category];
      h = '<div class="szf-step"><h1 class="szf-h1 szf-in"' + dl(0.05) + '>Get your <em>plan</em></h1>' +
        '<p class="szf-sub szf-in"' + dl(0.15) + '>Your 2-week plan, sent to your inbox as a PDF.</p>' +
        '<div class="szf-card szf-plan szf-in"' + dl(0.25) + '><div class="szf-row"><span style="font-weight:600">' + esc(e2.weakest.label) + ' plan</span><span class="szf-pill" style="color:' + c2 + ';border-color:' + c2 + '59;background:' + c2 + '14">● Focus</span></div>' +
        [[1, 1], [1, 2], [2, 1], [2, 2]].map(function (ws) { return '<div class="szf-row"><span>Week ' + ws[0] + ' · Session ' + ws[1] + '</span><span class="r">3 drills · ~30 min</span></div>'; }).join('') +
        '<div class="szf-row locked"><span style="display:inline-flex;align-items:center;gap:8px"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0"/></svg>Weeks 3–4 + final test</span><span class="r">In the app</span></div></div>' +
        '<div class="szf-spacer"></div>' +
        '<form data-szf-form novalidate class="szf-in"' + dl(0.45) + '>' +
          '<input class="szf-hp" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">' +
          '<div class="szf-fieldgroup' + (state.error ? ' bad' : '') + '"><label class="szf-field"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2.5" y="4" width="11" height="8" rx="1.5"/><path d="M3 5l5 3.5L13 5"/></svg>' +
          '<input id="szf-email" type="email" inputmode="email" autocomplete="email" placeholder="Email" aria-label="Email" value="' + esc(state.email) + '"' + (state.sending ? ' disabled' : '') + (state.error ? ' aria-invalid="true"' : '') + ' data-autofocus></label></div>' +
          (state.error ? '<p class="szf-err" role="alert">' + esc(state.error) + '</p>' : '') +
          '<button type="submit" class="szf-btn"' + (state.sending ? ' disabled' : '') + '>' + (state.sending ? '<span class="szf-spin" aria-hidden="true"></span> Sending…' : 'Get my plan ' + ARROW) + '</button>' +
        '</form>' +
        '<p class="szf-legal">We’ll email your plan and short game tips. Unsubscribe any time. <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</p></div>';
    } else if (state.step === 'sent') {
      h = '<div class="szf-step"><div class="szf-mail szf-pop"' + dl(0.1) + ' aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></div>' +
        '<h1 class="szf-h1 szf-in"' + dl(0.2) + '>Check your <em>inbox</em></h1>' +
        '<p class="szf-sub szf-in"' + dl(0.3) + '>Your plan is on its way to <strong style="color:var(--fg);word-break:break-all">' + esc(state.email) + '</strong>. If it isn’t there in a few minutes, check spam or promotions.</p>' +
        '<div class="szf-spacer"></div>' +
        '<button type="button" class="szf-btn szf-in"' + dl(0.45) + ' data-szf-close data-autofocus>Done</button>' +
        '<a class="szf-btn secondary szf-in"' + dl(0.55) + ' href="' + APP_STORE + '" target="_blank" rel="noopener" data-szf-app="ios">Or start it in the app · 7 days free · iOS</a>' +
        '<p class="szf-alt">Or go to <a href="' + WEB_APP + '" target="_blank" rel="noopener" data-szf-app="android">scoringzone.app</a> for Android</p></div>';
    }
    body.innerHTML = h;
  }

  function animateEstimate() {
    requestAnimationFrame(function () { setTimeout(function () {
      [].forEach.call(body.querySelectorAll('.szf-bar .t i'), function (el) { el.style.width = el.getAttribute('data-w') + '%'; });
    }, REDUCED ? 0 : 400); });
    var fig = body.querySelector('.szf-fig'); if (!fig) return;
    var to = Number(fig.getAttribute('data-count'));
    if (REDUCED) { fig.textContent = to.toFixed(1); return; }
    var t0 = performance.now() + 350, dur = 1100;
    countTimer = setInterval(function () {
      var p = Math.max(0, Math.min(1, (performance.now() - t0) / dur));
      var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      fig.textContent = (to * e).toFixed(1);
      if (p >= 1) clearInterval(countTimer);
    }, 16);
  }

  /* "Building your plan": the dial fills, the titles step through the three
     stages, then the button appears. About 3.6s; instant with reduced motion. */
  function runBuild() {
    var TITLES = [['Reading your answers', 'Six answers, one handicap'], ['Matching your level', 'Targets set for your handicap'], ['Picking your drills', '4 sessions, 20 to 30 minutes each']];
    var DONE = ['Your plan is ready', 'Built from your answers'];
    var ticks = body.querySelectorAll('.tick'), title = body.querySelector('#szf-btitle'), sub = body.querySelector('#szf-bsub');
    var pctT = body.querySelector('#szf-bpct'), dial = body.querySelector('.szf-dial'), go = body.querySelector('#szf-bgo'), rail = body.querySelectorAll('.szf-rail span');
    var dur = REDUCED ? 0 : 3600, t0 = performance.now();
    function frame() {
      if (state.step !== 'build') return;
      var p = dur ? Math.min(1, (performance.now() - t0) / dur) : 1;
      var lit = Math.round(p * 90);
      for (var i = 0; i < ticks.length; i++) {
        var on = i < lit;
        ticks[i].setAttribute('stroke', on ? (p < 0.5 ? '#F5A524' : '#00FF88') : '#fff');
        ticks[i].setAttribute('stroke-opacity', on ? '1' : '0.12');
      }
      var stage = Math.min(2, Math.floor(p * 3));
      if (p < 1) {
        if (title.textContent !== TITLES[stage][0]) { title.textContent = TITLES[stage][0]; sub.textContent = TITLES[stage][1]; }
        pctT.textContent = Math.round(p * 100) + '%';
        [].forEach.call(rail, function (r, k) { r.className = k < stage ? 'done' : k === stage ? 'on' : ''; });
        buildTimer = setTimeout(frame, 30);
      } else {
        title.innerHTML = 'Your plan is <em>ready</em>'; sub.textContent = DONE[1];
        pctT.textContent = ''; dial.classList.add('ready');
        [].forEach.call(rail, function (r) { r.className = 'done'; });
        go.style.visibility = 'visible'; go.classList.add('szf-in');
        state.built = true;
        try { go.focus({ preventScroll: true }); } catch (e) {}
      }
    }
    if (state.built) dur = 0; // coming back to it: no replay
    frame();
  }

  function onClick(e) {
    var t = e.target.closest('button, a, [data-szf-close]');
    if (!t || !root.contains(t)) return;
    if (t.hasAttribute('data-szf-close')) { close(); return; }
    if (t.hasAttribute('data-szf-back')) {
      var i = STEPS.indexOf(state.step), prev = STEPS[i - 1];
      if (prev === 'build') prev = 'estimate'; // back skips the animation
      if (i > 0) go(prev);
      return;
    }
    if (t.hasAttribute('data-szf-area')) {
      state.weakest = t.getAttribute('data-szf-area');
      [].forEach.call(body.querySelectorAll('.szf-tile'), function (x) { x.setAttribute('aria-checked', String(x === t)); });
      setTimeout(function () { go('basics'); }, 220);
      return;
    }
    if (t.hasAttribute('data-szf-noindex')) { state.noIndex = !state.noIndex; render(); return; }
    if (t.hasAttribute('data-szf-pick')) {
      var key = t.getAttribute('data-szf-pick'), raw = t.getAttribute('data-v');
      var v = key === 'frequency' ? raw : Number(raw);
      state[key] = state[key] === v ? null : v; // tap again to clear, as in the app
      [].forEach.call(t.parentNode.children, function (c) {
        var cv = key === 'frequency' ? c.getAttribute('data-v') : Number(c.getAttribute('data-v'));
        c.setAttribute('aria-checked', String(state[key] === cv));
      });
      return;
    }
    if (t.hasAttribute('data-szf-next')) { if (!t.disabled) go(t.getAttribute('data-szf-next')); return; }
    if (t.hasAttribute('data-szf-app')) track('lead_app_click', { platform: t.getAttribute('data-szf-app'), src: src });
  }

  function onInput(e) {
    if (e.target.id === 'szf-hcp') {
      state.hcpText = e.target.value;
      var ok = hcpValid();
      e.target.setAttribute('aria-invalid', ok ? 'false' : 'true');
      var btn = body.querySelector('[data-szf-next="q1"]'); if (btn) btn.disabled = !ok;
      var err = body.querySelector('.szf-err');
      if (!ok && !err) e.target.parentNode.insertAdjacentHTML('afterend', '<p class="szf-err">Enter an index between 0 and 54.</p>');
      if (ok && err) err.remove();
    } else if (e.target.id === 'szf-email') {
      state.email = e.target.value;
      if (state.error) { // a correction clears the last attempt's message
        state.error = '';
        e.target.setAttribute('aria-invalid', 'false');
        var g = body.querySelector('.szf-fieldgroup'); if (g) g.classList.remove('bad');
        var msg = body.querySelector('.szf-err'); if (msg) msg.remove();
      }
    }
  }

  function onKey(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') { // keep focus inside the sheet
      var f = [].filter.call(root.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]):not(.szf-hp)'), function (x) { return x.offsetParent !== null && !x.hidden && x.style.visibility !== 'hidden'; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function submit(form) {
    if (!form.hasAttribute('data-szf-form') || state.sending) return;
    var email = String(state.email).trim();
    if (!EMAIL_RE.test(email)) { state.error = 'That doesn’t look like an email address.'; render(); return; }
    var hp = form.querySelector('[name="company"]');
    var payload = window.SZEngine.leadBody(email, answers(), anonId());
    payload.company = hp ? hp.value : '';
    state.sending = true; state.error = ''; render();
    track('lead_submit', { src: src, weakest: payload.weakest, has_index: payload.hcp !== null });
    fetch(FN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: 'Bearer ' + ANON_KEY, apikey: ANON_KEY },
      body: JSON.stringify(payload),
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, ok: r.ok && j && j.ok, j: j }; });
    }).then(function (res) {
      state.sending = false;
      if (res.ok) { state.email = email; track('lead_sent', { src: src, weakest: payload.weakest }); go('sent'); return; }
      state.error = res.status === 429
        ? 'You’ve asked for a plan in the last few minutes. Check your inbox, or try again shortly.'
        : res.j && res.j.error === 'invalid' && res.j.field === 'email'
          ? 'That doesn’t look like an email address.'
          : 'We couldn’t send it. Check the address and try again.';
      track('lead_failed', { src: src, status: res.status, reason: res.j && res.j.error });
      render();
    }).catch(function () {
      state.sending = false;
      state.error = 'We couldn’t send it. Check your connection and try again.';
      track('lead_failed', { src: src, status: 0 });
      render();
    });
  }

  function open(opts) {
    opts = opts || {};
    if (!window.SZEngine) { location.href = WEB_APP; return; }
    if (!root) build();
    src = opts.src || 'site';
    var hcp = typeof opts.hcp === 'number' && isFinite(opts.hcp) && opts.hcp >= 0 ? Math.round(opts.hcp * 10) / 10 : null;
    // A new index is a new walk; the same one resumes where it was left.
    if (!state || state.step === 'sent' || (hcp !== null && String(hcp) !== state.hcpText)) state = fresh(hcp);
    if (state.step === 'build') state.step = state.built ? 'email' : 'estimate';
    lastFocus = document.activeElement;
    document.documentElement.classList.add('szf-lock');
    root.classList.add('open');
    go(state.step);
    track('lead_funnel_open', { src: src, has_hcp: hcp !== null });
  }

  function close() {
    if (!root || !root.classList.contains('open')) return;
    clearTimeout(buildTimer); clearInterval(countTimer);
    root.classList.remove('open');
    document.documentElement.classList.remove('szf-lock');
    track('lead_funnel_close', { step: state && state.step, src: src });
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  window.SZFunnel = { open: open, close: close };
})();

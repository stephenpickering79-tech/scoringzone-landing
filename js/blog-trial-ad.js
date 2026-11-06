/* Scoring Zone — tracking for the static "Improve your game" trial advert
   (css/blog-trial-ad.css). Sends the same GA4 events as js/blog-ad.js,
   blog_ad_view and blog_ad_click, so both adverts report side by side.
   Each placement is told apart by data-sztad on its wrapper. */
(function () {
  'use strict';

  function track(name, el, extra) {
    if (typeof window.gtag !== 'function') return;
    var payload = {
      blogad_variant: 'trial',
      blogad_position: el.getAttribute('data-sztad'),
      blogad_page: window.location.pathname
    };
    for (var k in extra) payload['blogad_' + k] = extra[k];
    window.gtag('event', name, payload);
  }

  function init() {
    var ads = document.querySelectorAll('[data-sztad]');
    for (var i = 0; i < ads.length; i++) watch(ads[i]);
  }

  function watch(el) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        for (var j = 0; j < entries.length; j++) {
          // offsetParent is null while the placement is hidden at this width.
          if (entries[j].isIntersecting && el.offsetParent !== null) {
            track('blog_ad_view', el, {});
            io.disconnect();
          }
        }
      }, { threshold: 0.35 });
      io.observe(el);
    }

    el.addEventListener('click', function (e) {
      var cta = e.target.closest('[data-sztad-cta]');
      if (!cta) return;
      track('blog_ad_click', el, {
        cta: cta.getAttribute('data-sztad-cta'),
        link_url: cta.getAttribute('href')
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

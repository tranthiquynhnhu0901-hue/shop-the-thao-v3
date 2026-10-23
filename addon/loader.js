/* SportHub: single-line integration into the EXISTING V1 / V2 pages.
   Loads account modal, CRM tools, policies and signup reminder without replacing page markup. */
(function () {
  'use strict';
  if (window.__sporthubAddonStarted) return;
  window.__sporthubAddonStarted = true;
  var current = document.currentScript;
  if (!current || !current.src) return;
  var base = new URL('./', current.src).href;
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('sporthub-account.css', base).href;
  document.head.appendChild(css);
  function load(filename, cb) {
    var script = document.createElement('script');
    script.src = new URL(filename, base).href;
    script.async = false;
    script.onload = cb;
    script.onerror = function () {
      console.error('[SportHub] Không tải được', filename, '— kiểm tra file addon/ trên GitHub Pages.');
    };
    document.head.appendChild(script);
  }
  load('config.js', function () { load('sporthub-account.js'); });
})();

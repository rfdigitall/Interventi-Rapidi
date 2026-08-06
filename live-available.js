/**
 * Live availability chip under the nav (left half) — tap-to-call.
 * Europe/Rome clock. Visible until 23:00 Rome (hide from 23:00 inclusive).
 * Half-width left pill so it never crowds the header tel CTA.
 * Hides when #top hero scrolls out of view (mobile + desktop).
 */
(function () {
  if (window.__gfLiveAvail) return;
  window.__gfLiveAvail = true;

  var END_HOUR = 23; /* hide at 23:00 Rome — no separate start hour in config */
  var PHONE_TEL = 'tel:+393201147517';
  var PHONE_LABEL = '320 114 7517';
  var heroVisible = true;
  var inHours = false;
  var scrollBound = false;

  var css = [
    '.gf-live-avail{',
    'position:fixed;top:calc(64px + 8px);left:10px;right:auto;z-index:490;',
    'display:inline-flex;align-items:center;justify-content:flex-start;gap:7px;',
    'max-width:calc(50% - 14px);width:max-content;',
    'height:auto;min-height:28px;padding:5px 11px 5px 9px;box-sizing:border-box;',
    'border-radius:999px;',
    'background:linear-gradient(90deg,#073d1c 0%,#0b6b2f 100%);',
    'color:#fff;text-decoration:none;',
    'border:1px solid rgba(255,255,255,0.14);',
    'box-shadow:0 4px 16px rgba(0,0,0,0.32);',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;',
    '-webkit-tap-highlight-color:transparent;touch-action:manipulation;',
    'opacity:1;transform:translateY(0);pointer-events:auto;',
    'transition:opacity .2s ease,transform .2s ease,visibility .2s;',
    '}',
    '.gf-live-avail.gf-live-avail--away{',
    'opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-6px);',
    '}',
    '.gf-live-avail:hover,.gf-live-avail:focus{color:#fff;opacity:0.97;}',
    '.gf-live-avail.gf-live-avail--away:hover,.gf-live-avail.gf-live-avail--away:focus{opacity:0;}',
    '.gf-live-avail__dot{',
    'width:7px;height:7px;border-radius:50%;flex-shrink:0;',
    'background:#7dffa6;box-shadow:0 0 0 0 rgba(125,255,166,0.7);',
    'animation:gfLivePulse 2s ease-out infinite;',
    '}',
    '.gf-live-avail__txt{',
    'font-size:11.5px;font-weight:650;letter-spacing:0.01em;line-height:1.25;',
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;',
    '}',
    '.gf-live-avail__txt b{font-weight:800;}',
    '.gf-live-avail__cta{',
    'display:none;flex-shrink:0;align-items:center;gap:6px;',
    'font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;',
    'padding:4px 8px;border-radius:999px;background:rgba(255,255,255,0.14);',
    '}',
    '@media (min-width:640px){',
    '.gf-live-avail{top:calc(64px + 10px);left:16px;max-width:min(42%,420px);padding:6px 12px 6px 10px;}',
    '.gf-live-avail__txt{font-size:12.5px;}',
    '.gf-live-avail__cta{display:inline-flex;}',
    '}',
    '@media (min-width:901px){',
    '.gf-live-avail{max-width:min(38%,380px);}',
    '}',
    '@keyframes gfLivePulse{',
    '0%{box-shadow:0 0 0 0 rgba(125,255,166,0.55);}',
    '70%{box-shadow:0 0 0 8px rgba(125,255,166,0);}',
    '100%{box-shadow:0 0 0 0 rgba(125,255,166,0);}',
    '}',
    '@media (prefers-reduced-motion:reduce){',
    '.gf-live-avail__dot{animation:none;}',
    '.gf-live-avail{transition:none;}',
    '}',
  ].join('');

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function romeParts(d) {
    var fmt = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    var parts = {};
    fmt.formatToParts(d).forEach(function (p) {
      if (p.type !== 'literal') parts[p.type] = p.value;
    });
    return parts;
  }

  function romeHour(d) {
    var p = romeParts(d);
    var hour = parseInt(p.hour, 10);
    if (isNaN(hour)) hour = d.getHours();
    return hour;
  }

  /** Banner window: before END_HOUR (23:00) Rome. No start-hour config → only end. */
  function isBannerWindow(d) {
    return romeHour(d) < END_HOUR;
  }

  function buildLabel(d) {
    var p = romeParts(d);
    var weekday = (p.weekday || '').replace(/\.$/, '');
    var day = p.day || '';
    var month = (p.month || '').replace(/\.$/, '');
    var hour = romeHour(d);
    var time = pad(hour) + ':' + pad(parseInt(p.minute, 10) || 0);
    var when = weekday + ' ' + day + ' ' + month + ' · ' + time;
    return {
      html: 'Siamo disponibili anche oggi &middot; <b>' + weekday + ' ' + day + ' ' + month + '</b> &middot; <b>' + time + '</b>',
      plain: 'Siamo disponibili anche oggi · ' + when + '. Chiama ' + PHONE_LABEL,
    };
  }

  function ensureStyle() {
    if (document.querySelector('style[data-gf-live-avail]')) return;
    var style = document.createElement('style');
    style.setAttribute('data-gf-live-avail', '1');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function syncVisibility() {
    var a = document.getElementById('gf-live-avail');
    if (!a) return;
    var show = inHours && heroVisible;
    a.classList.toggle('gf-live-avail--away', !show);
    a.setAttribute('aria-hidden', show ? 'false' : 'true');
    if (show) document.body.classList.add('gf-has-live-avail');
    else document.body.classList.remove('gf-has-live-avail');
  }

  function showBanner() {
    ensureStyle();
    var a = document.getElementById('gf-live-avail');
    if (!a) {
      a = document.createElement('a');
      a.id = 'gf-live-avail';
      a.className = 'gf-live-avail';
      a.href = PHONE_TEL;
      a.setAttribute('data-gf-phone-track', 'phone_click_live_banner');
      a.innerHTML =
        '<span class="gf-live-avail__dot" aria-hidden="true"></span>' +
        '<span class="gf-live-avail__txt"></span>' +
        '<span class="gf-live-avail__cta">Chiama</span>';
      document.body.appendChild(a);
    }
    refreshLabel();
    syncVisibility();
    bindScrollWatch();
  }

  function hideBanner() {
    var a = document.getElementById('gf-live-avail');
    if (a && a.parentNode) a.parentNode.removeChild(a);
    document.body.classList.remove('gf-has-live-avail');
  }

  function refreshLabel() {
    var a = document.getElementById('gf-live-avail');
    if (!a) return;
    var txt = a.querySelector('.gf-live-avail__txt');
    if (!txt) return;
    var label = buildLabel(new Date());
    txt.innerHTML = label.html;
    a.setAttribute('aria-label', label.plain);
  }

  function heroStillInView() {
    var hero = document.getElementById('top');
    if (!hero) return true;
    var rect = hero.getBoundingClientRect();
    /* Hide once hero top has scrolled above header (~64px) */
    return rect.bottom > 80 && rect.top < window.innerHeight;
  }

  function onScrollOrResize() {
    heroVisible = heroStillInView();
    syncVisibility();
  }

  function bindScrollWatch() {
    if (scrollBound) return;
    scrollBound = true;

    var hero = document.getElementById('top');
    if (hero && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(
        function (entries) {
          var e = entries[0];
          heroVisible = !!(e && e.isIntersecting);
          syncVisibility();
        },
        {
          /* leave a bit of room under fixed header */
          root: null,
          rootMargin: '-64px 0px 0px 0px',
          threshold: 0,
        }
      );
      io.observe(hero);
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    onScrollOrResize();
  }

  function tick() {
    inHours = isBannerWindow(new Date());
    if (inHours) {
      showBanner();
      refreshLabel();
    } else {
      hideBanner();
    }
  }

  function start() {
    tick();
    setInterval(tick, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

/**
 * Live availability chip under the nav — tap-to-call.
 * Europe/Rome clock. Visible START_HOUR inclusive → END_HOUR exclusive
 * (06:00–22:59 Rome). Hidden from 23:00 through night until morning.
 * Centered under header; wraps up to 2 lines — no ellipsis.
 * Hides when #top hero scrolls out of view (mobile + desktop).
 */
(function () {
  if (window.__gfLiveAvail) return;
  window.__gfLiveAvail = true;

  var START_HOUR = 6; /* show from 06:00 Rome (inclusive) */
  var END_HOUR = 23; /* hide from 23:00 Rome (inclusive) — window is hour < 23 */
  var PHONE_TEL = 'tel:+393201147517';
  var PHONE_LABEL = '320 114 7517';
  var heroVisible = true;
  var inHours = false;
  var scrollBound = false;
  var STYLE_VER = '20260827g';

  var css = [
    '.gf-live-avail{',
    'position:fixed!important;',
    'top:calc(64px + 10px)!important;',
    'left:50%!important;',
    'right:auto!important;',
    'z-index:510!important;',
    'display:inline-flex!important;',
    'align-items:center;',
    'justify-content:center;',
    'gap:8px;',
    'transform:translateX(-50%)!important;',
    'margin:0!important;',
    'max-width:calc(100% - 24px);',
    'width:max-content;',
    'height:auto;',
    'min-height:30px;',
    'padding:7px 14px;',
    'box-sizing:border-box;',
    'border-radius:999px;',
    'background:linear-gradient(90deg,#073d1c 0%,#0b6b2f 100%);',
    'color:#fff!important;',
    'text-decoration:none!important;',
    'border:1px solid rgba(255,255,255,0.18);',
    'box-shadow:0 6px 20px rgba(0,0,0,0.35);',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;',
    '-webkit-tap-highlight-color:transparent;',
    'touch-action:manipulation;',
    'opacity:1!important;',
    'visibility:visible!important;',
    'pointer-events:auto!important;',
    'transition:opacity .2s ease,visibility .2s;',
    '}',
    '.gf-live-avail.gf-live-avail--away{',
    'opacity:0!important;',
    'visibility:hidden!important;',
    'pointer-events:none!important;',
    '}',
    '.gf-live-avail:hover,.gf-live-avail:focus{color:#fff!important;opacity:0.96!important;}',
    '.gf-live-avail.gf-live-avail--away:hover,.gf-live-avail.gf-live-avail--away:focus{opacity:0!important;}',
    '.gf-live-avail__dot{',
    'width:8px;height:8px;border-radius:50%;flex-shrink:0;',
    'background:#7dffa6;box-shadow:0 0 0 0 rgba(125,255,166,0.7);',
    'animation:gfLivePulse 2s ease-out infinite;',
    '}',
    '.gf-live-avail__txt{',
    'font-size:12px;font-weight:650;letter-spacing:0.01em;line-height:1.35;',
    'min-width:0;flex:1 1 auto;text-align:center;',
    'white-space:normal;overflow:visible;max-width:100%;',
    '}',
    '.gf-live-avail__txt b{font-weight:800;}',
    '.gf-live-avail__cta{',
    'display:none;flex-shrink:0;align-items:center;gap:6px;',
    'font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;',
    'padding:4px 9px;border-radius:999px;background:rgba(255,255,255,0.16);',
    '}',
    '@media (min-width:640px){',
    '.gf-live-avail{top:calc(64px + 12px)!important;max-width:min(560px,calc(100% - 40px));padding:8px 16px;}',
    '.gf-live-avail__txt{font-size:13px;}',
    '.gf-live-avail__cta{display:inline-flex;}',
    '}',
    '@media (min-width:901px){',
    '.gf-live-avail{max-width:min(580px,calc(100% - 48px));}',
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
      hourCycle: 'h23',
    });
    var parts = {};
    fmt.formatToParts(d).forEach(function (p) {
      if (p.type !== 'literal') parts[p.type] = p.value;
    });
    return parts;
  }

  /** Rome wall-clock hour 0–23. Normalizes Chrome "24" midnight quirk. */
  function romeHour(d) {
    var p = romeParts(d);
    var hour = parseInt(p.hour, 10);
    if (isNaN(hour)) {
      try {
        hour = parseInt(
          new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/Rome',
            hour: 'numeric',
            hourCycle: 'h23',
          }).format(d),
          10
        );
      } catch (e) {
        hour = 0;
      }
    }
    if (hour === 24) hour = 0;
    return hour;
  }

  function isBannerWindow(d) {
    var h = romeHour(d);
    return h >= START_HOUR && h < END_HOUR;
  }

  function buildLabel(d) {
    var p = romeParts(d);
    var weekday = (p.weekday || '').replace(/\.$/, '');
    var day = p.day || '';
    var month = (p.month || '').replace(/\.$/, '');
    var hour = romeHour(d);
    var time = pad(hour) + ':' + pad(parseInt(p.minute, 10) || 0);
    var when = weekday + ' ' + day + ' ' + month + ' · ' + time;
    var city = (window.__gfGeoCity || '').trim();
    if (city) {
      return {
        html: 'Disponibili a <b>' + city + '</b> &middot; <b>' + weekday + ' ' + day + ' ' + month + '</b> &middot; <b>' + time + '</b>',
        plain: 'Disponibili a ' + city + ' · ' + when + '. Chiama ' + PHONE_LABEL,
      };
    }
    return {
      html: 'Siamo disponibili anche oggi &middot; <b>' + weekday + ' ' + day + ' ' + month + '</b> &middot; <b>' + time + '</b>',
      plain: 'Siamo disponibili anche oggi · ' + when + '. Chiama ' + PHONE_LABEL,
    };
  }

  function ensureStyle() {
    var existing = document.querySelector('style[data-gf-live-avail]');
    if (existing) {
      if (existing.getAttribute('data-gf-live-ver') === STYLE_VER) return;
      existing.parentNode.removeChild(existing);
    }
    var style = document.createElement('style');
    style.setAttribute('data-gf-live-avail', '1');
    style.setAttribute('data-gf-live-ver', STYLE_VER);
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
    if (window.gfApplyDniSwap) window.gfApplyDniSwap('live-avail');
  }

  function hideBanner() {
    var a = document.getElementById('gf-live-avail');
    if (a && a.parentNode) a.parentNode.removeChild(a);
    document.body.classList.remove('gf-has-live-avail');
  }

  function dniTelHref() {
    var mobile = window.__gfDniMobile;
    var formatted = window.__gfDniFormatted;
    if (!mobile && !formatted) return PHONE_TEL;
    var tel = String(mobile || '').trim();
    if (tel.indexOf('tel:') === 0) return tel;
    if (tel.charAt(0) === '+') return 'tel:' + tel;
    if (tel) {
      var digits = tel.replace(/[^\d]/g, '');
      if (digits) return 'tel:+' + digits;
    }
    if (formatted) {
      var fd = String(formatted).replace(/[^\d]/g, '');
      if (fd) return 'tel:+' + fd;
    }
    return PHONE_TEL;
  }

  function refreshLabel() {
    var a = document.getElementById('gf-live-avail');
    if (!a) return;
    var txt = a.querySelector('.gf-live-avail__txt');
    if (!txt) return;
    var label = buildLabel(new Date());
    txt.innerHTML = label.html;
    a.setAttribute('aria-label', label.plain);
    a.href = dniTelHref();
    if (window.gfApplyDniSwap) window.gfApplyDniSwap('live-avail-label');
  }

  function heroStillInView() {
    var hero = document.getElementById('top');
    if (!hero) return true;
    var rect = hero.getBoundingClientRect();
    /* Keep visible while any meaningful part of hero remains under the nav */
    return rect.bottom > 96;
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
          /* Prefer geometry: IO alone can flicker on full-bleed heroes */
          if (e && e.isIntersecting) {
            heroVisible = true;
          } else {
            heroVisible = heroStillInView();
          }
          syncVisibility();
        },
        {
          root: null,
          rootMargin: '0px',
          threshold: [0, 0.01, 0.1],
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

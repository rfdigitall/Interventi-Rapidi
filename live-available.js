/**
 * Thin live availability banner under the nav.
 * Real Europe/Rome clock + tap-to-call for max conversion on H24 landings.
 * Visible until 23:00 Rome time (hide from 23:00 inclusive).
 */
(function () {
  if (window.__gfLiveAvail) return;
  window.__gfLiveAvail = true;

  var BANNER_H = 34;
  var END_HOUR = 23; /* hide at 23:00 Rome — no separate start hour in config */
  var PHONE_TEL = 'tel:+393201147517';
  var PHONE_LABEL = '320 114 7517';
  var PAD_BASE = 64;

  var css = [
    '.gf-live-avail{',
    'position:fixed;top:64px;left:0;right:0;z-index:495;',
    'display:flex;align-items:center;justify-content:center;gap:10px;',
    'height:' + BANNER_H + 'px;padding:0 14px;box-sizing:border-box;',
    'background:linear-gradient(90deg,#073d1c 0%,#0b6b2f 50%,#073d1c 100%);',
    'color:#fff;text-decoration:none;',
    'border-bottom:1px solid rgba(255,255,255,0.08);',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;',
    '-webkit-tap-highlight-color:transparent;touch-action:manipulation;',
    '}',
    '.gf-live-avail:hover,.gf-live-avail:focus{color:#fff;opacity:0.97;}',
    '.gf-live-avail__dot{',
    'width:7px;height:7px;border-radius:50%;flex-shrink:0;',
    'background:#7dffa6;box-shadow:0 0 0 0 rgba(125,255,166,0.7);',
    'animation:gfLivePulse 2s ease-out infinite;',
    '}',
    '.gf-live-avail__txt{',
    'font-size:12.5px;font-weight:650;letter-spacing:0.01em;line-height:1.2;',
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:min(92vw,720px);',
    '}',
    '.gf-live-avail__txt b{font-weight:800;}',
    '.gf-live-avail__cta{',
    'display:none;flex-shrink:0;align-items:center;gap:6px;',
    'font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;',
    'padding:5px 10px;border-radius:3px;background:rgba(255,255,255,0.14);',
    '}',
    '@media (min-width:640px){',
    '.gf-live-avail__txt{font-size:13px;}',
    '.gf-live-avail__cta{display:inline-flex;}',
    '}',
    '@keyframes gfLivePulse{',
    '0%{box-shadow:0 0 0 0 rgba(125,255,166,0.55);}',
    '70%{box-shadow:0 0 0 8px rgba(125,255,166,0);}',
    '100%{box-shadow:0 0 0 0 rgba(125,255,166,0);}',
    '}',
    '@media (prefers-reduced-motion:reduce){.gf-live-avail__dot{animation:none;}}',
    /* keep first screen fit above sticky after banner */
    '@media (max-width:900px){',
    'body.gf-has-live-avail #top.gf-page-hero{',
    'min-height:calc(100svh - 64px - ' + BANNER_H + 'px - 56px - env(safe-area-inset-bottom,0px)) !important;',
    'height:calc(100svh - 64px - ' + BANNER_H + 'px - 56px - env(safe-area-inset-bottom,0px)) !important;',
    '}',
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

  function nightHint(hour) {
    // H24 reassurance when people hesitate at night
    if (hour >= 22 || hour < 6) return 'Anche di notte — ';
    if (hour >= 6 && hour < 8) return 'Anche al mattino — ';
    if (hour >= 12 && hour < 14) return 'Anche a pranzo — ';
    return '';
  }

  function buildLabel(d) {
    var p = romeParts(d);
    var weekday = (p.weekday || '').replace(/\.$/, '');
    var day = p.day || '';
    var month = (p.month || '').replace(/\.$/, '');
    var hour = romeHour(d);
    var time = pad(hour) + ':' + pad(parseInt(p.minute, 10) || 0);
    var hint = nightHint(hour);
    return {
      html: 'Oggi <b>' + weekday + ' ' + day + ' ' + month + '</b> · <b>' + time + '</b> — ' + hint + 'siamo disponibili',
      plain: 'Oggi ' + weekday + ' ' + day + ' ' + month + ' · ' + time + ' — ' + hint + 'siamo disponibili. Chiama ' + PHONE_LABEL,
    };
  }

  function findPadWrap() {
    return document.querySelector('[style*="padding-top:64px"], [style*="padding-top: ' + PAD_BASE + 'px"]');
  }

  function setPad(on) {
    var wrap = findPadWrap();
    if (!wrap) return;
    wrap.style.paddingTop = (on ? PAD_BASE + BANNER_H : PAD_BASE) + 'px';
  }

  function ensureStyle() {
    if (document.querySelector('style[data-gf-live-avail]')) return;
    var style = document.createElement('style');
    style.setAttribute('data-gf-live-avail', '1');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function showBanner() {
    if (document.getElementById('gf-live-avail')) return;
    ensureStyle();

    var a = document.createElement('a');
    a.id = 'gf-live-avail';
    a.className = 'gf-live-avail';
    a.href = PHONE_TEL;
    a.setAttribute('data-gf-phone-track', 'phone_click_live_banner');
    a.innerHTML =
      '<span class="gf-live-avail__dot" aria-hidden="true"></span>' +
      '<span class="gf-live-avail__txt"></span>' +
      '<span class="gf-live-avail__cta">Chiama</span>';

    document.body.appendChild(a);
    document.body.classList.add('gf-has-live-avail');
    setPad(true);
    refreshLabel();
  }

  function hideBanner() {
    var a = document.getElementById('gf-live-avail');
    if (a && a.parentNode) a.parentNode.removeChild(a);
    document.body.classList.remove('gf-has-live-avail');
    setPad(false);
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

  function tick() {
    if (isBannerWindow(new Date())) {
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

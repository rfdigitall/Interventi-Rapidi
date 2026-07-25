/**
 * Consenso cookie + Google Consent Mode v2 + GA4 / Ads + coda conversioni.
 *
 * 1) Compila tracking-config.js (ID reali) — non inventarli.
 * 2) Questo file gestisce: consent default denied → update → load tags.
 */
(function () {
  var KEY = 'gf_cookie_consent';
  var LEAD_KEY = 'gf_lead_ok';
  window.GF_TRACKING = window.GF_TRACKING || {};
  window.__gfEventQueue = window.__gfEventQueue || [];

  function cfg() { return window.GF_TRACKING || {}; }

  function getConsent() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function ensureGtagStub() {
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function () { window.dataLayer.push(arguments); };
    }
  }

  /** Consent Mode v2 — default DENIED prima di qualsiasi tag (UE).
   *  Se lo snippet inline nell'HTML l'ha già fatto (__gfConsentDefaultsSet),
   *  questa funzione è idempotente. */
  function initConsentDefaults() {
    ensureGtagStub();
    if (window.__gfConsentDefaultsSet) return;
    window.__gfConsentDefaultsSet = true;
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted',
      wait_for_update: 500
    });
    // Regione UE: aiuta Ads / Privacy Sandbox
    window.gtag('set', 'ads_data_redaction', true);
    window.gtag('set', 'url_passthrough', true);
  }

  function updateConsentMode(granted) {
    ensureGtagStub();
    var state = granted ? 'granted' : 'denied';
    window.gtag('consent', 'update', {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state
    });
  }

  function hasTrackingIds() {
    var c = cfg();
    return !!(c.ga4Id || c.adsId);
  }

  /** Carica gtag.js una sola volta. I callback vengono ACCODATI quando la
   *  libreria è ancora in caricamento — così se l'utente clicca "Accetta"
   *  DURANTE il fetch di gtag.js, il config non viene perso (bug storico). */
  function loadGtagLibrary(cb) {
    window.__gfGtagLoadCbs = window.__gfGtagLoadCbs || [];
    if (window.__gfGtagScriptLoaded) {
      if (cb) { try { cb(); } catch (e) {} }
      return;
    }
    if (cb) window.__gfGtagLoadCbs.push(cb);
    if (window.__gfGtagScriptLoading) return;
    var c = cfg();
    // Prefer AW-ID come primary — è un account Google Ads con conversione
    // chiamate: caricare gtag.js con id=AW-… garantisce che il modulo
    // phone_conversion sia disponibile subito.
    var primary = c.adsId || c.adsIdConversion || c.ga4Id;
    if (!primary) return;
    window.__gfGtagScriptLoading = true;
    ensureGtagStub();
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(primary);
    s.onload = function () {
      window.__gfGtagScriptLoaded = true;
      window.__gfGtagScriptLoading = false;
      var cbs = window.__gfGtagLoadCbs || [];
      window.__gfGtagLoadCbs = [];
      for (var i = 0; i < cbs.length; i++) {
        try { cbs[i](); } catch (e) {}
      }
    };
    s.onerror = function () {
      window.__gfGtagScriptLoading = false;
      try { if (console && console.error) console.error('[GF] gtag.js failed to load:', s.src); } catch (e) {}
    };
    document.head.appendChild(s);
  }

  function applyTagConfigs() {
    var c = cfg();
    var ga4Id = c.ga4Id || '';
    var adsId = c.adsId || '';
    var adsConv = c.adsIdConversion || '';
    ensureGtagStub();
    window.gtag('js', new Date());

    if (ga4Id) {
      window.gtag('config', ga4Id, {
        anonymize_ip: true,
        send_page_view: true,
        allow_google_signals: getConsent() === 'all'
      });
    }
    if (adsId) {
      window.gtag('config', adsId, {
        anonymize_ip: true,
        allow_enhanced_conversions: !!c.enhancedConversions
      });
    }
    // Secondo account Ads (es. MCC) se indicato da Google
    if (adsConv && adsConv !== adsId) {
      window.gtag('config', adsConv, { anonymize_ip: true });
    }
    // Snippet numero di inoltro — formato esatto richiesto da Google
    applyPhoneConversionConfig();
    if (c.conversions) window.GADS_CONVERSIONS = c.conversions;
  }

  function isPhoneDebug() {
    try {
      return /(?:\?|&)google_phone_conversion_debug=true(?:&|$)/.test(location.search);
    } catch (e) { return false; }
  }

  /** Re-applica lo snippet chiamate dopo il render DreamCanvas. */
  function applyPhoneConversionConfig() {
    var c = cfg();
    if (!c.phoneConversionLabel) return;
    if (getConsent() !== 'all') return;
    ensureGtagStub();
    var phoneShown = (c.phoneConversionNumber || '320 114 7517').trim();
    var opts = {
      phone_conversion_number: phoneShown,
      phone_conversion_callback: function (replaced, formattedNumber, originalNumber) {
        try {
          window.__gfPhoneReplaced = !!replaced;
          if (typeof console !== 'undefined' && console.info) {
            console.info('[GF] phone replace:', replaced ? ('OK → ' + formattedNumber) : ('NO MATCH per "' + originalNumber + '"'));
          }
        } catch (e) {}
      }
    };
    window.gtag('config', c.phoneConversionLabel, opts);
    // Alcuni account Ads rispondono meglio se il config è anche sull'AW account + label separata
    if (c.adsIdConversion && c.phoneConversionLabel.indexOf('/') > -1) {
      var labelOnly = c.phoneConversionLabel.split('/').slice(1).join('/');
      if (labelOnly) {
        window.gtag('config', c.adsIdConversion, {
          phone_conversion_number: phoneShown,
          phone_conversion_label: labelOnly
        });
      }
    }
    if (isPhoneDebug() && typeof console !== 'undefined' && console.info) {
      console.info('[GF] debug chiamate attivo. Accetta cookie, attendi 5s. Numero cercato:', phoneShown);
    }
  }

  function schedulePhoneConversionRefresh() {
    if (!cfg().phoneConversionLabel) return;
    // Retry aggressivi: coprono (a) seed statico prima del boot React, (b)
    // primo render DreamCanvas (~800-2500ms), (c) eventuali re-render (setState).
    [200, 500, 900, 1500, 2500, 4000, 6000, 9000, 14000].forEach(function (ms) {
      setTimeout(applyPhoneConversionConfig, ms);
    });
    // Osserva mutazioni DOM per rieseguire il config dopo ogni re-render
    // significativo di DreamCanvas / React (setState).
    try {
      if (window.__gfPhoneMo) return;
      var scheduled = null;
      window.__gfPhoneMo = new MutationObserver(function () {
        if (scheduled) return;
        scheduled = setTimeout(function () {
          scheduled = null;
          applyPhoneConversionConfig();
        }, 400);
      });
      window.__gfPhoneMo.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
      // Estendiamo la finestra a 30s: alcune landing con font/CDN lenti
      // completano il primo render solo dopo 5-10s.
      setTimeout(function () {
        try { window.__gfPhoneMo.disconnect(); } catch (e) {}
      }, 30000);
    } catch (e) {}
  }

  function loadMarketing() {
    if (!hasTrackingIds()) return;
    updateConsentMode(true);
    loadGtagLibrary(function () {
      if (window.__gfMarketingLoaded) {
        applyPhoneConversionConfig();
        schedulePhoneConversionRefresh();
        flushQueue();
        return;
      }
      window.__gfMarketingLoaded = true;
      applyTagConfigs();
      schedulePhoneConversionRefresh();
      flushQueue();
      setTimeout(flushQueue, 800);
    });
  }

  function setConsent(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
    document.documentElement.setAttribute('data-gf-consent', value || '');
    window.dispatchEvent(new CustomEvent('gf-consent', { detail: value }));
    hideBanner();
    if (value === 'all') {
      loadMarketing();
    } else {
      updateConsentMode(false);
      // Tag library può restare caricata in denied per modeling (se ID presenti)
      if (hasTrackingIds()) loadGtagLibrary();
    }
  }

  function conversionSendTo(name) {
    var map = (cfg().conversions) || window.GADS_CONVERSIONS || {};
    if (map[name]) return map[name];
    if (/(phone_click|whatsapp_click|form_submit|lead_form)/.test(name) && map.default) return map.default;
    return null;
  }

  function fireNow(name, extra) {
    if (!window.gtag) return false;
    var payload = Object.assign({ event_category: 'engagement', transport_type: 'beacon' }, extra || {});
    window.gtag('event', name, payload);
    var sendTo = conversionSendTo(name);
    if (sendTo) {
      window.gtag('event', 'conversion', {
        send_to: sendTo,
        transport_type: 'beacon',
        event_timeout: 2000
      });
    }
    return true;
  }

  function flushQueue() {
    if (getConsent() !== 'all') return;
    if (!window.__gfMarketingLoaded) return;
    ensureGtagStub();
    var q = window.__gfEventQueue.splice(0, window.__gfEventQueue.length);
    for (var i = 0; i < q.length; i++) {
      fireNow(q[i].name, q[i].extra);
    }
  }

  window.gfTrack = function (name, extra) {
    if (getConsent() !== 'all') return false;
    ensureGtagStub();
    if (window.__gfMarketingLoaded) {
      fireNow(name, extra);
      return true;
    }
    window.__gfEventQueue.push({ name: name, extra: extra || null });
    if (hasTrackingIds()) loadMarketing();
    return true;
  };

  /** Persiste gclid / gbraid per matching offline (WhatsApp). */
  window.gfStoreAdsIds = function () {
    try {
      var p = new URLSearchParams(window.location.search);
      ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_campaign', 'utm_medium'].forEach(function (k) {
        var v = p.get(k);
        if (v) sessionStorage.setItem('gf_' + k, v);
      });
    } catch (e) {}
  };

  window.gfGetAdsSuffix = function () {
    try {
      var parts = [];
      var gclid = sessionStorage.getItem('gf_gclid') || new URLSearchParams(location.search).get('gclid');
      if (gclid) parts.push('gclid:' + gclid);
      var gbraid = sessionStorage.getItem('gf_gbraid');
      if (gbraid) parts.push('gbraid:' + gbraid);
      return parts.length ? (' [' + parts.join(' ') + ']') : '';
    } catch (e) { return ''; }
  };

  /** Flag lead valido (form inviato) — evita conversioni false su /grazie. */
  window.gfMarkLead = function () {
    try {
      sessionStorage.setItem(LEAD_KEY, String(Date.now()));
    } catch (e) {}
  };

  window.gfConsumeLead = function () {
    try {
      var p = new URLSearchParams(location.search);
      if (p.get('lead') !== '1') return false;
      var ts = sessionStorage.getItem(LEAD_KEY);
      if (!ts) return false;
      sessionStorage.removeItem(LEAD_KEY);
      var age = Date.now() - parseInt(ts, 10);
      return age >= 0 && age < 15 * 60 * 1000;
    } catch (e) { return false; }
  };

  window.gfSiteUrl = function () {
    var base = (cfg().siteUrl || '').replace(/\/$/, '');
    if (base) return base;
    try { return location.origin; } catch (e) { return ''; }
  };

  window.gfAbsoluteUrl = function (path) {
    var base = window.gfSiteUrl();
    if (!path) return base || '';
    if (/^https?:/i.test(path)) return path;
    return base + (path.charAt(0) === '/' ? path : '/' + path);
  };

  /** Canonical + og:url + schema url/image da siteUrl (o origin). */
  window.gfApplySeoAbsolute = function (pagePath) {
    try {
      var abs = window.gfAbsoluteUrl(pagePath || location.pathname.replace(/^\//, '') || '');
      if (!abs && location.href) abs = location.href.split('?')[0].split('#')[0];
      if (!abs) return;
      var link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = abs;
      var ogUrl = document.querySelector('meta[property="og:url"]');
      if (!ogUrl) {
        ogUrl = document.createElement('meta');
        ogUrl.setAttribute('property', 'og:url');
        document.head.appendChild(ogUrl);
      }
      ogUrl.setAttribute('content', abs);
      var ogImg = document.querySelector('meta[property="og:image"]');
      var imgAbs = window.gfAbsoluteUrl('assets/og-image.png');
      if (!ogImg) {
        ogImg = document.createElement('meta');
        ogImg.setAttribute('property', 'og:image');
        document.head.appendChild(ogImg);
      }
      if (imgAbs) ogImg.setAttribute('content', imgAbs);
      document.querySelectorAll('script[type="application/ld+json"]').forEach(function (el) {
        try {
          var data = JSON.parse(el.textContent);
          var list = Array.isArray(data) ? data : [data];
          list.forEach(function (node) {
            if (node && typeof node === 'object') {
              if ('url' in node && (!node.url || node.url === '')) node.url = abs;
              if (node.image && typeof node.image === 'string' && node.image.indexOf('http') !== 0) {
                node.image = window.gfAbsoluteUrl(node.image);
              }
            }
          });
          el.textContent = JSON.stringify(Array.isArray(data) ? list : list[0]);
        } catch (e) {}
      });
    } catch (e) {}
  };

  function hideBanner() {
    var el = document.getElementById('gf-cookie-banner');
    if (el) el.style.display = 'none';
    document.documentElement.classList.remove('gf-cookie-open');
  }

  function showBanner() {
    if (document.getElementById('gf-cookie-banner')) return;
    document.documentElement.classList.add('gf-cookie-open');
    var bar = document.createElement('div');
    bar.id = 'gf-cookie-banner';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-live', 'polite');
    bar.setAttribute('aria-label', 'Consenso cookie');
    bar.innerHTML =
      '<div class="gf-cookie-inner">' +
        '<p>Utilizziamo cookie tecnici necessari al funzionamento del sito. Con il tuo consenso attiviamo anche cookie di statistica e marketing (Google Analytics e Google Ads) per misurare le visite e le conversioni, comprese le chiamate. ' +
        '<a href="cookie.html">Cookie Policy</a> · <a href="privacy.html">Privacy</a></p>' +
        '<div class="gf-cookie-actions">' +
          '<button type="button" data-gf="reject" class="gf-cookie-btn gf-cookie-btn--ghost">Solo necessari</button>' +
          '<button type="button" data-gf="accept" class="gf-cookie-btn gf-cookie-btn--ok">Accetta</button>' +
        '</div>' +
      '</div>';
    if (isPhoneDebug()) {
      bar.innerHTML =
        '<div class="gf-cookie-inner">' +
          '<p><strong>Test chiamate Google Ads:</strong> premi <strong>Accetta</strong>, poi attendi 5 secondi. I numeri devono diventare 999-999-9999. ' +
          '<a href="cookie.html">Cookie Policy</a></p>' +
          '<div class="gf-cookie-actions">' +
            '<button type="button" data-gf="accept" class="gf-cookie-btn gf-cookie-btn--ok">Accetta</button>' +
          '</div>' +
        '</div>';
    }
    bar.addEventListener('click', function (e) {
      var t = e.target.closest('[data-gf]');
      if (!t) return;
      if (t.getAttribute('data-gf') === 'accept') setConsent('all');
      else setConsent('necessary');
    });
    document.body.appendChild(bar);
  }

  function injectStyles() {
    if (document.getElementById('gf-cookie-style')) return;
    var css = document.createElement('style');
    css.id = 'gf-cookie-style';
    css.textContent =
      '#gf-cookie-banner{position:fixed;left:0;right:0;bottom:0;z-index:600;padding:12px;padding-bottom:calc(12px + env(safe-area-inset-bottom));background:rgba(5,12,24,0.97);border-top:1px solid rgba(255,255,255,0.12);color:#fff;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;box-shadow:0 -8px 32px rgba(0,0,0,0.35);}' +
      '#gf-cookie-banner .gf-cookie-inner{max-width:1120px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 18px;}' +
      '#gf-cookie-banner p{margin:0;font-size:13px;line-height:1.55;color:rgba(255,255,255,0.78);flex:1 1 260px;}' +
      '#gf-cookie-banner a{color:#4aaee8;text-decoration:underline;}' +
      '#gf-cookie-banner .gf-cookie-actions{display:flex;flex-wrap:wrap;gap:8px;}' +
      '#gf-cookie-banner .gf-cookie-btn{border:0;border-radius:3px;padding:12px 16px;min-height:44px;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;cursor:pointer;font-family:inherit;}' +
      '#gf-cookie-banner .gf-cookie-btn--ok{background:#1259b0;color:#fff;}' +
      '#gf-cookie-banner .gf-cookie-btn--ghost{background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.28);}' +
      'html.gf-cookie-open .gf-sticky-call{visibility:hidden;pointer-events:none;}' +
      '@media (min-width:901px){.gf-sticky-call{display:none!important;}}' +
      'html,body{background:#030912;}' +
      'body.ads-traffic *{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition:none!important;}' +
      'body.ads-traffic #top.gf-page-hero{min-height:calc(100vh - 64px)!important;min-height:calc(100svh - 64px)!important;}' +
      '.gf-sticky-call{position:fixed;bottom:0;left:0;right:0;z-index:400;background:#1259b0;padding-bottom:env(safe-area-inset-bottom,0px);}' +
      '.gf-sticky-call>a{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:44px;padding:0 12px;margin:0;box-sizing:border-box;color:#fff;background:#1259b0;border-radius:0;line-height:1;animation:gfStickyPulse 2.6s ease-in-out infinite;}' +
      '.gf-sticky-call strong{font-family:Barlow Condensed,sans-serif;font-weight:800;font-size:20px;letter-spacing:0.03em;line-height:1;white-space:nowrap;text-align:center;}' +
      '.gf-sticky-call svg{width:16px;height:16px;flex-shrink:0;display:block;}' +
      '@keyframes gfStickyPulse{0%,100%{box-shadow:inset 0 0 0 0 rgba(74,174,232,0)}50%{box-shadow:inset 0 0 28px 0 rgba(74,174,232,0.28)}}' +
      '@media (prefers-reduced-motion:reduce){.gf-sticky-call>a{animation:none!important;}}' +
      '@media (max-width:600px){#gf-cookie-banner p{font-size:12px;}}';
    document.head.appendChild(css);
  }

  window.gfApplyLandingContext = function () {
    try {
      var p = new URLSearchParams(window.location.search);
      if (p.get('gclid') || p.get('gbraid') || p.get('wbraid') || p.get('utm_source') || p.get('utm_medium')) {
        document.body.classList.add('ads-traffic');
      }
      window.gfStoreAdsIds();
      var city = (p.get('city') || '').trim();
      var allowed = ['Udine', 'Pordenone', 'Gorizia', 'Trieste', 'Venezia', 'Treviso'];
      var hit = allowed.find(function (c) { return c.toLowerCase() === city.toLowerCase(); });
      if (hit) {
        document.documentElement.setAttribute('data-gf-city', hit);
        document.body.classList.add('city-' + hit.toLowerCase());
      }
      return hit || '';
    } catch (e) {
      return '';
    }
  };

  window.gfGetConsent = getConsent;
  window.gfSetConsent = setConsent;
  window.gfHasMarketingConsent = function () { return getConsent() === 'all'; };
  window.gfOpenCookieSettings = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    showBanner();
  };
  window.gfFlushTracking = flushQueue;

  function initFaqAccordion() {
    if (window.__gfFaqAccordion) return;
    window.__gfFaqAccordion = true;

    function closeOthers(opened) {
      var root = document.getElementById('faq') || document;
      root.querySelectorAll('details').forEach(function (other) {
        if (other !== opened) other.open = false;
      });
    }

    window.gfEnsureFaqNames = function () {
      document.querySelectorAll('#faq details, details.gf-faq').forEach(function (d) {
        d.setAttribute('name', 'gf-faq');
        if (!d.classList.contains('gf-faq')) d.classList.add('gf-faq');
      });
    };

    // Native exclusive accordion (name) + fallback click (DC may strip attrs)
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var sum = t.closest('#faq details summary, details.gf-faq summary');
      if (!sum) return;
      var d = sum.parentElement;
      if (!d || d.tagName !== 'DETAILS') return;
      d.setAttribute('name', 'gf-faq');
      setTimeout(function () {
        if (d.open) closeOthers(d);
      }, 0);
    }, true);

    document.addEventListener('toggle', function (e) {
      var d = e.target;
      if (!d || d.tagName !== 'DETAILS' || !d.open) return;
      if (!(d.classList && d.classList.contains('gf-faq')) && !(d.closest && d.closest('#faq'))) return;
      d.setAttribute('name', 'gf-faq');
      closeOthers(d);
    }, true);

    window.gfEnsureFaqNames();
    setTimeout(window.gfEnsureFaqNames, 400);
    setTimeout(window.gfEnsureFaqNames, 1200);
  }

  function boot() {
    initConsentDefaults();
    injectStyles();
    window.gfApplyLandingContext();
    initFaqAccordion();

    // Pre-carica gtag.js (consent ancora denied) se ID presenti — Consent Mode modeling
    if (hasTrackingIds()) loadGtagLibrary();

    var c = getConsent();
    if (c === 'all') {
      updateConsentMode(true);
      loadMarketing();
    } else if (c === 'necessary') {
      updateConsentMode(false);
      if (isPhoneDebug() && typeof console !== 'undefined' && console.warn) {
        console.warn('[GF] Debug chiamate: hai scelto Solo necessari. Premi «Gestisci cookie» → Accetta, poi ricarica con ?google_phone_conversion_debug=true');
      }
    } else {
      showBanner();
      if (isPhoneDebug() && typeof console !== 'undefined' && console.warn) {
        console.warn('[GF] Debug chiamate: prima Accetta i cookie, poi aspetta 3–5 secondi. I numeri diventano 999-999-9999 se lo snippet funziona.');
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

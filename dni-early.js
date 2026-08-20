/**
 * DNI early boot + anti-flicker
 * Load AFTER tracking-config.js, BEFORE consent-ads.js.
 *
 * Ads traffic: hide visible phone digits until Google forwarding number
 * arrives (or timeout) so the user never sees 320 → other number.
 * Seed #gf-ads-phone-seed stays readable for Google's scanner.
 */
(function () {
  var t = window.GF_TRACKING || {};
  if (!t.phoneConversionLabel) return;
  if (window.__gfEarlyDniStarted) return;

  function hasMarketingConsent() {
    if (t.forceMarketingConsent === true) return true;
    try {
      var until = (t.forceMarketingConsentUntil || "").trim();
      if (until && Date.now() < new Date(until).getTime()) return true;
      return localStorage.getItem("gf_cookie_consent") === "all";
    } catch (e) {
      return false;
    }
  }
  if (!hasMarketingConsent()) return;

  window.__gfEarlyDniStarted = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };

  var label = t.phoneConversionLabel;
  var awId = String(label).split("/")[0] || t.adsIdConversion || t.adsId;
  var number = (t.phoneConversionNumber || "320 114 7517").trim();
  var country = (t.phoneConversionCountryCode || "IT").trim();
  var digits = t.phoneNumberDigits || "3201147517";
  var FALLBACK_MS = 4500;

  function log() {
    try {
      if (!console || !console.info) return;
      console.info.apply(console, ["[GF early-DNI]"].concat([].slice.call(arguments)));
    } catch (e) {}
  }

  function isAdsTraffic() {
    try {
      var p = new URLSearchParams(location.search);
      if (p.get("google_phone_conversion_debug") === "true") return true;
      if (p.get("gclid") || p.get("gbraid") || p.get("wbraid")) return true;
      var med = (p.get("utm_medium") || "").toLowerCase();
      if (med === "cpc" || med === "ppc" || med === "paid") return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  function injectAntiFlickerCss() {
    if (document.getElementById("gf-dni-af-style")) return;
    var css =
      "html.gf-dni-await:not(.gf-dni-ready) a[href^=\"tel:\"]:not(#gf-ads-phone-seed a) strong{" +
      "color:transparent!important;position:relative;}" +
      "html.gf-dni-await:not(.gf-dni-ready) a[href^=\"tel:\"]:not(#gf-ads-phone-seed a) strong::after{" +
      "content:\"Chiama ora\";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);" +
      "white-space:nowrap;color:#fff;font-size:clamp(1.05rem,4.2vw,1.55rem);font-weight:800;" +
      "letter-spacing:0.02em;line-height:1;font-family:Barlow Condensed,system-ui,sans-serif;}" +
      "html.gf-dni-await:not(.gf-dni-ready) a.gf-ss-call{" +
      "color:transparent!important;position:relative;min-width:7.5rem;}" +
      "html.gf-dni-await:not(.gf-dni-ready) a.gf-ss-call::after{" +
      "content:\"Chiama ora\";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);" +
      "white-space:nowrap;color:#fff;font-size:13px;font-weight:700;letter-spacing:0.04em;}" +
      "html.gf-dni-await:not(.gf-dni-ready) .gf-ss-dial small{opacity:0;height:0;overflow:hidden;margin:0;display:block;}" +
      "html.gf-dni-await:not(.gf-dni-ready) a[href^=\"tel:\"]:not(#gf-ads-phone-seed a):not(.gf-ss-call):not(:has(strong)){" +
      "font-size:0!important;letter-spacing:0!important;}" +
      "html.gf-dni-await:not(.gf-dni-ready) a[href^=\"tel:\"]:not(#gf-ads-phone-seed a):not(.gf-ss-call):not(:has(strong))::after{" +
      "content:\"Chiama ora\";font-size:15px;font-weight:700;letter-spacing:0.02em;" +
      "color:#6BB5FF;font-family:Barlow Condensed,system-ui,sans-serif;}" +
      "html.gf-dni-await:not(.gf-dni-ready) .gf-sticky-call a strong::after{color:#fff;}" +
      "html.gf-dni-await:not(.gf-dni-ready) a.idra-dial strong::after," +
      "html.gf-dni-await:not(.gf-dni-ready) .gf-ss-dial strong::after{color:#fff;}";
    var el = document.createElement("style");
    el.id = "gf-dni-af-style";
    el.textContent = css;
    document.head.appendChild(el);
  }

  /** Show digits (Google number or real 320). Safe to call multiple times. */
  window.gfDniReveal = function (reason) {
    if (window.__gfDniRevealed) return;
    window.__gfDniRevealed = true;
    try {
      document.documentElement.classList.remove("gf-dni-await");
      document.documentElement.classList.add("gf-dni-ready");
    } catch (e) {}
    log("reveal", reason || "", {
      replaced: !!window.__gfPhoneReplaced,
      formatted: window.__gfDniFormatted || null,
    });
  };

  function armAntiFlicker() {
    if (!isAdsTraffic()) {
      log("anti-flicker OFF (not ads traffic)");
      return;
    }
    injectAntiFlickerCss();
    document.documentElement.classList.add("gf-dni-await");
    log("anti-flicker ON — digits hidden until DNI or timeout");
    setTimeout(function () {
      if (!window.__gfDniRevealed) {
        log("anti-flicker timeout — show number (DNI or real 320)");
        window.gfDniReveal("timeout-" + FALLBACK_MS + "ms");
      }
    }, FALLBACK_MS);
  }

  // Before body paints (script in head)
  armAntiFlicker();

  function swapNow(formatted, mobile) {
    if (!formatted) return;
    window.__gfPhoneReplaced = true;
    window.__gfDniFormatted = formatted;
    window.__gfDniMobile = mobile || formatted;
    if (typeof window.gfApplyDniSwap === "function") {
      window.gfApplyDniSwap("early-callback");
    } else {
      var tel = String(mobile || "").trim();
      if (tel && tel.indexOf("tel:") !== 0) {
        tel = tel.charAt(0) === "+" ? "tel:" + tel : "tel:+" + tel.replace(/[^\d]/g, "");
      }
      if (!tel) tel = "tel:+399999999999";
      var n = 0;
      try {
        var links = document.querySelectorAll("a[href]");
        for (var i = 0; i < links.length; i++) {
          var el = links[i];
          var href = el.getAttribute("href") || "";
          if (/^https?:\/\/(?:api\.)?wa\.me/i.test(href) || /^whatsapp:/i.test(href)) continue;
          if (
            href.indexOf(digits) === -1 &&
            href.indexOf("3201147517") === -1 &&
            !(el.textContent && el.textContent.indexOf(number) > -1)
          )
            continue;
          if (/^tel:/i.test(href) && href !== tel) {
            el.setAttribute("href", tel);
            n++;
          }
          if (el.textContent && el.textContent.indexOf(number) > -1) {
            var next = el.textContent.split(number).join(formatted);
            if (next !== el.textContent) {
              el.textContent = next;
              n++;
            }
          }
        }
        if (document.body && document.createTreeWalker) {
          var tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
          var node;
          while ((node = tw.nextNode())) {
            if (node.nodeValue && node.nodeValue.indexOf(number) > -1) {
              // Keep seed text for scanner until reveal; seed can show Google # too
              node.nodeValue = node.nodeValue.split(number).join(formatted);
              n++;
            }
          }
        }
      } catch (e) {}
      log("swap nodes=", n, { formatted: formatted, tel: tel });
    }
    window.gfDniReveal("dni-callback");
  }

  function applyPhoneConfig(reason) {
    if (
      window.__gfEarlyDniConfigured &&
      !/(?:\?|&)google_phone_conversion_debug=true(?:&|$)/.test(location.search)
    )
      return;
    window.__gfEarlyDniConfigured = true;
    log("config", reason, label, number);
    window.gtag("config", label, {
      phone_conversion_number: number,
      phone_conversion_country_code: country,
      phone_conversion_callback: function (formatted, mobile) {
        log("callback", { formatted: formatted, mobile: mobile });
        swapNow(formatted, mobile);
      },
    });
  }

  function whenPhoneInDom(cb) {
    function ready() {
      try {
        if (document.querySelector('a[href*="' + digits + '"], #gf-ads-phone-seed')) {
          cb();
          return true;
        }
      } catch (e) {}
      return false;
    }
    if (ready()) return;
    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        function () {
          if (!ready()) setTimeout(cb, 0);
        },
        { once: true }
      );
    } else {
      setTimeout(function () {
        if (!ready()) cb();
      }, 0);
    }
  }

  function onGtagReady() {
    window.__gfGtagScriptLoaded = true;
    window.gtag("js", new Date());
    if (t.adsId) {
      window.gtag("config", t.adsId, {
        anonymize_ip: true,
        allow_enhanced_conversions: !!t.enhancedConversions,
      });
    }
    if (t.adsIdConversion && t.adsIdConversion !== t.adsId) {
      window.gtag("config", t.adsIdConversion, { anonymize_ip: true });
    }
    whenPhoneInDom(function () {
      applyPhoneConfig("dom-ready");
      [200, 600, 1200, 2000].forEach(function (ms) {
        setTimeout(function () {
          if (!window.__gfPhoneReplaced) applyPhoneConfig("retry@" + ms);
          else if (window.__gfDniFormatted) swapNow(window.__gfDniFormatted, window.__gfDniMobile);
        }, ms);
      });
    });
  }

  if (window.__gfGtagScriptLoaded) {
    onGtagReady();
    return;
  }

  var existing = document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
  if (existing) {
    if (window.__gfGtagScriptLoaded) onGtagReady();
    else existing.addEventListener("load", onGtagReady, { once: true });
    window.__gfGtagLoadCbs = window.__gfGtagLoadCbs || [];
    window.__gfGtagLoadCbs.push(onGtagReady);
    return;
  }

  window.__gfGtagScriptLoading = true;
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(awId);
  s.onload = function () {
    window.__gfGtagScriptLoading = false;
    onGtagReady();
    var cbs = window.__gfGtagLoadCbs || [];
    window.__gfGtagLoadCbs = [];
    for (var i = 0; i < cbs.length; i++) {
      try {
        cbs[i]();
      } catch (e) {}
    }
  };
  s.onerror = function () {
    window.__gfGtagScriptLoading = false;
    log("gtag.js failed", s.src);
    window.gfDniReveal("gtag-error");
  };
  document.head.appendChild(s);
  log("loading gtag", awId);
})();

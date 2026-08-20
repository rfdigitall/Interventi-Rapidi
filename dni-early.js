/**
 * DNI early boot — must load AFTER tracking-config.js, BEFORE consent-ads.js.
 * Starts Google phone-conversion (number swap) immediately so Ads visitors
 * see the forwarding number in ~1–3s, not 20s+ (too late for emergency taps).
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

  function log() {
    try {
      if (!console || !console.info) return;
      console.info.apply(console, ["[GF early-DNI]"].concat([].slice.call(arguments)));
    } catch (e) {}
  }

  function swapNow(formatted, mobile) {
    if (!formatted) return;
    window.__gfPhoneReplaced = true;
    window.__gfDniFormatted = formatted;
    window.__gfDniMobile = mobile || formatted;
    if (typeof window.gfApplyDniSwap === "function") {
      window.gfApplyDniSwap("early-callback");
      return;
    }
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
            node.nodeValue = node.nodeValue.split(number).join(formatted);
            n++;
          }
        }
      }
    } catch (e) {}
    log("swap nodes=", n, { formatted: formatted, tel: tel });
  }

  function applyPhoneConfig(reason) {
    if (window.__gfEarlyDniConfigured && !/(?:\?|&)google_phone_conversion_debug=true(?:&|$)/.test(location.search))
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
    else
      existing.addEventListener("load", onGtagReady, { once: true });
    // Still queue config if script already loading via consent-ads
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
  };
  document.head.appendChild(s);
  log("loading gtag", awId);
})();

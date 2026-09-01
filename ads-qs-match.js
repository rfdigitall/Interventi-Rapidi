/**
 * Ads QS message match — hero eyebrow / H1 / subtitle from utm_keyword + page + city.
 * Load after ads-geo.js. Stronger default copy for all visitors; keyword tailoring on ads traffic.
 */
(function () {
  if (window.__gfAdsQsMatch) return;
  window.__gfAdsQsMatch = true;

  var VER = "20260901a";

  function params() {
    try {
      return new URLSearchParams(window.location.search);
    } catch (e) {
      return new URLSearchParams();
    }
  }

  function decodeVal(v) {
    if (!v) return "";
    try {
      return decodeURIComponent(String(v).replace(/\+/g, " ")).trim();
    } catch (e) {
      return String(v).trim();
    }
  }

  function isAdsTraffic(p) {
    return !!(p.get("gclid") || p.get("gbraid") || p.get("wbraid") || p.get("utm_source"));
  }

  function pageKind() {
    var path = (location.pathname || "").toLowerCase();
    if (path.indexOf("scarichi") >= 0) return "scarichi";
    if (path.indexOf("perdite") >= 0) return "perdite";
    if (path.indexOf("fabbro") >= 0) return "fabbro";
    if (path.indexOf("idraulico") >= 0) return "idraulico";
    return "idraulico";
  }

  function getKeyword(p) {
    return decodeVal(p.get("utm_keyword") || p.get("utm_term") || p.get("kw")).toLowerCase();
  }

  function cityName() {
    try {
      return window.__gfGeoCity || (window.gfApplyLandingContext && window.gfApplyLandingContext()) || "";
    } catch (e) {
      return "";
    }
  }

  var BASE = {
    idraulico: {
      eyebrow: "Idraulico urgente · Intervento idraulico · H24",
      title: "Idraulico Pronto Intervento H24",
      titleCity: function (c) {
        return "Idraulico Pronto Intervento H24 a " + c;
      },
      sub: "Rispondiamo subito — persona reale al telefono, niente call center. Prezzo chiaro prima di iniziare.",
    },
    scarichi: {
      eyebrow: "Scarico otturato · WC intasato · Spurgo H24",
      title: "Scarico Otturato? Sturiamo Subito",
      titleCity: function (c) {
        return "Scarico Otturato a " + c + " — H24";
      },
      sub: "WC intasato o scarico bloccato? Rispondiamo ora e partiamo in zona — prezzo chiaro al telefono.",
    },
    perdite: {
      eyebrow: "Perdita acqua · Tubo rotto · Allagamento H24",
      title: "Perdita d'acqua? Intervento urgente",
      titleCity: function (c) {
        return "Perdita d'acqua urgente a " + c;
      },
      sub: "Perdita o allagamento? Rispondiamo subito e blocchiamo il danno — costo comunicato prima.",
    },
    fabbro: {
      eyebrow: "Fabbro urgente · Apertura porte · H24",
      title: "Fabbro Pronto Intervento H24",
      titleCity: function (c) {
        return "Fabbro Pronto Intervento H24 a " + c;
      },
      sub: "Chiuso fuori o serratura bloccata? Rispondiamo subito — fabbro urgente, zero centralino.",
    },
  };

  /** Keyword → hero override (QS message match). First match wins. */
  var RULES = [
    {
      re: /wc intas|water ottur|water non scarica|disintasare wc/,
      eyebrow: "WC intasato · Spurgo urgente · H24",
      title: "WC Intasato? Pronto Intervento H24",
      titleCity: function (c) {
        return "WC Intasato a " + c + " — Spurgo H24";
      },
      sub: "Water otturato o WC che non scarica? Rispondiamo subito — spurgo professionale in zona.",
    },
    {
      re: /scarico ottur|scarico bloccat|spurgo scarich|stasatura|disottur|lavandino ottur|lavandino cucina|stappare lavandino|fogna ottur|il water non/,
      eyebrow: "Scarico otturato · Spurgo H24",
      title: "Scarico Otturato? Sturiamo Subito",
      titleCity: function (c) {
        return "Scarico Otturato a " + c + " — H24";
      },
      sub: "Scarico bloccato o lavandino intasato? Arriviamo con attrezzatura da spurgo — chiama ora.",
    },
    {
      re: /perdita acqua|perdite acqua|allagamento|tubo rotto|tubo scoppiat|acqua che esce|acqua che perde|riparazione perdita|perdita tubo/,
      eyebrow: "Perdita acqua · Tubo rotto · H24",
      title: "Perdita d'acqua? Blocchiamo Subito",
      titleCity: function (c) {
        return "Perdita d'acqua urgente a " + c;
      },
      sub: "Allagamento o tubo rotto? Rispondiamo in pochi secondi — blocchiamo il danno e ripariamo.",
    },
    {
      re: /intervento idraulico|pronto intervento idraulico|idraulico pronto intervento/,
      eyebrow: "Pronto intervento idraulico · H24",
      title: "Intervento Idraulico Urgente H24",
      titleCity: function (c) {
        return "Intervento Idraulico H24 a " + c;
      },
      sub: "Emergenza idraulica? Persona reale al telefono — niente attese, prezzo chiaro subito.",
    },
    {
      re: /idraulico urgente|idraulico h24|idraulico emergenza|emergenza idraulico|idraulico reperibile|idraulico subito/,
      eyebrow: "Idraulico urgente · H24",
      title: "Idraulico Urgente H24",
      titleCity: function (c) {
        return "Idraulico Urgente H24 a " + c;
      },
      sub: "Idraulico urgente disponibile ora — rispondiamo noi, senza call center. Chiama il 320.",
    },
    {
      re: /riparazioni idrauliche|riparazione idraulica/,
      eyebrow: "Riparazione idraulica · Urgente",
      title: "Riparazione Idraulica Urgente H24",
      titleCity: function (c) {
        return "Riparazione Idraulica a " + c;
      },
      sub: "Guasto idraulico da risolvere subito? Ti diciamo il costo al telefono — poi partiamo.",
    },
    {
      re: /chiuso fuori|porta blindata|porta sbattuta|serratura bloccat|chiave rotta|apertura port/,
      eyebrow: "Chiuso fuori · Apertura porte · H24",
      title: "Chiuso Fuori? Fabbro Urgente H24",
      titleCity: function (c) {
        return "Fabbro urgente a " + c + " — H24";
      },
      sub: "Porta chiusa o serratura bloccata? Rispondiamo subito — apertura senza danni, prezzo chiaro.",
    },
    {
      re: /fabbro urgente|fabbro h24|pronto intervento fabbro|fabbro pronto/,
      eyebrow: "Fabbro urgente · Pronto intervento",
      title: "Fabbro Urgente H24",
      titleCity: function (c) {
        return "Fabbro Urgente H24 a " + c;
      },
      sub: "Fabbro reperibile ora in Veneto e Friuli — persona reale al telefono, niente centralino.",
    },
  ];

  function pickCopy(kind, kw, ads) {
    var base = BASE[kind] || BASE.idraulico;
    var pack = {
      eyebrow: base.eyebrow,
      title: base.title,
      titleCity: base.titleCity,
      sub: base.sub,
    };
    if (ads && kw) {
      for (var i = 0; i < RULES.length; i++) {
        if (RULES[i].re.test(kw)) {
          pack.eyebrow = RULES[i].eyebrow;
          pack.title = RULES[i].title;
          pack.titleCity = RULES[i].titleCity || pack.titleCity;
          pack.sub = RULES[i].sub;
          break;
        }
      }
    }
    return pack;
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el && text) el.textContent = text;
  }

  function apply() {
    var p = params();
    var ads = isAdsTraffic(p);
    var kind = pageKind();
    var kw = getKeyword(p);
    var city = cityName();
    var copy = pickCopy(kind, kw, ads);

    var title = city && copy.titleCity ? copy.titleCity(city) : copy.title;
    setText("gf-hero-title", title);
    setText("gf-hero-sub", copy.sub);
    setText("gf-hero-eyebrow", copy.eyebrow);

    if (ads && kw) {
      try {
        document.documentElement.setAttribute("data-gf-kw-match", "1");
      } catch (e) {}
    }
  }

  window.gfApplyAdsQsHero = apply;

  function boot() {
    apply();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  var delays = [50, 400, 1200, 3000];
  for (var d = 0; d < delays.length; d++) {
    setTimeout(apply, delays[d]);
  }

  try {
    var mo = new MutationObserver(function () {
      apply();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () {
      mo.disconnect();
    }, 10000);
  } catch (e) {}
})();

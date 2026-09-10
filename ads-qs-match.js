/**
 * Ads QS message-match — hero eyebrow / H1 / subtitle from utm_keyword + city.
 * Load after ads-geo.js.
 * Sub = ONLY keywords (no phone, no zone list — dial is on the CTA button).
 */
(function () {
  if (window.__gfAdsQsMatch) return;
  window.__gfAdsQsMatch = true;

  var VER = "20260910qs2";
  var lastApplied = "";

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
      eyebrow: "Idraulico urgente · Pronto intervento · H24",
      title: "Idraulico Urgente — Pronto Intervento H24",
      titleCity: function (c) {
        return "Idraulico Urgente H24 a " + c;
      },
      sub: "Perdite · tubo rotto · scarichi otturati · WC intasato",
    },
    scarichi: {
      eyebrow: "Scarico otturato · WC intasato · Spurgo H24",
      title: "Scarico Otturato Urgente — Sturiamo Ora",
      titleCity: function (c) {
        return "Scarico Otturato Urgente a " + c;
      },
      sub: "WC intasato · lavandino otturato · spurgo urgente",
    },
    perdite: {
      eyebrow: "Perdita acqua · Tubo rotto · Allagamento",
      title: "Perdita d'Acqua Urgente — Tubo Rotto",
      titleCity: function (c) {
        return "Perdita d'Acqua Urgente a " + c;
      },
      sub: "Tubo rotto · allagamento · perdita urgente",
    },
    fabbro: {
      eyebrow: "Fabbro urgente · Apertura porte · H24",
      title: "Fabbro Urgente — Pronto Intervento H24",
      titleCity: function (c) {
        return "Fabbro Urgente H24 a " + c;
      },
      sub: "Apertura porte · serratura bloccata · chiave rotta",
    },
  };

  var RULES = [
    {
      re: /wc intas|water ottur|water non scarica|disintasare wc/,
      eyebrow: "WC intasato · Spurgo urgente · H24",
      title: "WC Intasato — Spurgo Urgente H24",
      titleCity: function (c) {
        return "WC Intasato a " + c;
      },
      sub: "WC intasato · water otturato · spurgo",
    },
    {
      re: /scarico ottur|scarico bloccat|spurgo scarich|stasatura|disottur|lavandino ottur|lavandino cucina|lavandino intas|stappare lavandino|fogna ottur|ingorg/,
      eyebrow: "Scarico otturato · Spurgo · H24",
      title: "Scarico Otturato — Spurgo Urgente",
      titleCity: function (c) {
        return "Scarico Otturato a " + c;
      },
      sub: "Scarico otturato · lavandino intasato · spurgo",
    },
    {
      re: /perdita acqua|perdite acqua|allagamento|tubo rotto|tubo scoppiat|acqua che esce|acqua che perde|riparazione perdita|perdita tubo|tubatura/,
      eyebrow: "Perdita acqua · Tubo rotto · H24",
      title: "Perdita d'Acqua Urgente — Tubo Rotto",
      titleCity: function (c) {
        return "Perdita d'Acqua a " + c;
      },
      sub: "Perdita acqua · tubo rotto · allagamento",
    },
    {
      re: /intervento idraulico|pronto intervento idraulico|idraulico pronto intervento/,
      eyebrow: "Pronto intervento idraulico · H24",
      title: "Pronto Intervento Idraulico H24",
      titleCity: function (c) {
        return "Pronto Intervento Idraulico a " + c;
      },
      sub: "Intervento idraulico · perdite · scarichi",
    },
    {
      re: /idraulico urgente|idraulico h24|idraulico emergenza|emergenza idraulico|idraulico reperibile|idraulico subito|sos idraulico/,
      eyebrow: "Idraulico urgente · H24",
      title: "Idraulico Urgente H24",
      titleCity: function (c) {
        return "Idraulico Urgente H24 a " + c;
      },
      sub: "Idraulico urgente · pronto intervento",
    },
    {
      re: /spurgo lavandino|stappare lavandino|disintasare/,
      eyebrow: "Spurgo lavandino · H24",
      title: "Spurgo Lavandino Urgente",
      titleCity: function (c) {
        return "Spurgo Lavandino a " + c;
      },
      sub: "Spurgo lavandino · scarico intasato",
    },
    {
      re: /chiuso fuori|porta blindata|porta sbattuta|serratura bloccat|chiave rotta|chiave spezzat|apertura port|sblocco/,
      eyebrow: "Apertura porte · Serratura bloccata",
      title: "Apertura Porte Urgente — Fabbro H24",
      titleCity: function (c) {
        return "Apertura Porte a " + c;
      },
      sub: "Chiuso fuori · serratura bloccata · chiave rotta",
    },
    {
      re: /fabbro urgente|fabbro h24|pronto intervento fabbro|fabbro pronto|intervento fabbro|emergenza fabbro/,
      eyebrow: "Fabbro urgente · Pronto intervento · H24",
      title: "Fabbro Urgente H24",
      titleCity: function (c) {
        return "Fabbro Urgente H24 a " + c;
      },
      sub: "Fabbro urgente · apertura porte · serrature",
    },
    {
      re: /cambio cilindro|cilindro europeo|cambio serratur|sostituzione serratur/,
      eyebrow: "Cambio serratura · Cilindro",
      title: "Cambio Serratura Urgente",
      titleCity: function (c) {
        return "Cambio Serratura a " + c;
      },
      sub: "Cambio serratura · cilindro europeo",
    },
  ];

  function pickCopy(kind, kw) {
    var base = BASE[kind] || BASE.idraulico;
    var pack = {
      eyebrow: base.eyebrow,
      title: base.title,
      titleCity: base.titleCity,
      sub: base.sub,
    };
    if (kw) {
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
    if (!el || text == null || text === "") return;
    if (el.textContent !== text) el.textContent = text;
  }

  function apply() {
    var p = params();
    var kind = pageKind();
    var kw = getKeyword(p);
    var city = cityName();
    var copy = pickCopy(kind, kw);

    var title = city && copy.titleCity ? copy.titleCity(city) : copy.title;
    var sig = [VER, title, copy.sub, copy.eyebrow].join("\u0001");
    if (sig === lastApplied) return;
    lastApplied = sig;

    setText("gf-hero-title", title);
    setText("gf-hero-sub", copy.sub);
    setText("gf-hero-eyebrow", copy.eyebrow);

    try {
      document.documentElement.setAttribute("data-gf-qs-ver", VER);
      if (kw) document.documentElement.setAttribute("data-gf-kw-match", "1");
      if (city) document.documentElement.setAttribute("data-gf-city", city);
    } catch (e) {}
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

  var moTimer = 0;
  try {
    var mo = new MutationObserver(function () {
      if (moTimer) clearTimeout(moTimer);
      moTimer = setTimeout(apply, 60);
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () {
      mo.disconnect();
      if (moTimer) clearTimeout(moTimer);
    }, 10000);
  } catch (e) {}
})();

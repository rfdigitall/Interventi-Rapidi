/**
 * Ads QS + call max — hero eyebrow / H1 / subtitle from utm_keyword + page + city.
 * Load after ads-geo.js. Strong call CTA in every subtitle (320).
 */
(function () {
  if (window.__gfAdsQsMatch) return;
  window.__gfAdsQsMatch = true;

  var VER = "20260910qs";
  var lastApplied = "";
  var TEL = "320 114 7517";

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

  var ZONES = "Udine, Pordenone, Gorizia, Trieste, Venezia, Treviso";

  var BASE = {
    idraulico: {
      eyebrow: "Idraulico urgente · Pronto intervento idraulico · H24",
      title: "Idraulico Urgente — Pronto Intervento H24",
      titleCity: function (c) {
        return "Idraulico Urgente H24 a " + c;
      },
      sub:
        "Pronto intervento idraulico: perdite, tubo rotto, scarichi otturati. Chiama ora " +
        TEL +
        " — " +
        ZONES +
        ".",
    },
    scarichi: {
      eyebrow: "Scarico otturato urgente · WC intasato · Pronto intervento scarichi",
      title: "Scarico Otturato Urgente — Sturiamo Ora",
      titleCity: function (c) {
        return "Scarico Otturato Urgente a " + c;
      },
      sub:
        "Pronto intervento scarichi: WC intasato, lavandino otturato. Chiama " +
        TEL +
        " — partiamo subito in zona.",
    },
    perdite: {
      eyebrow: "Perdita acqua urgente · Tubo rotto · Allagamento H24",
      title: "Perdita d'Acqua Urgente — Tubo Rotto",
      titleCity: function (c) {
        return "Perdita d'Acqua Urgente a " + c;
      },
      sub:
        "Pronto intervento perdita acqua e allagamento. Chiama " +
        TEL +
        " — blocchiamo il danno, costo chiaro al telefono.",
    },
    fabbro: {
      eyebrow: "Fabbro urgente · Pronto intervento fabbro · Apertura porte H24",
      title: "Fabbro Urgente — Pronto Intervento H24",
      titleCity: function (c) {
        return "Fabbro Urgente H24 a " + c;
      },
      sub:
        "Pronto intervento fabbro: apertura porte, serratura bloccata, chiave rotta. Chiama " +
        TEL +
        " — " +
        ZONES +
        ".",
    },
  };

  var RULES = [
    {
      re: /wc intas|water ottur|water non scarica|disintasare wc/,
      eyebrow: "WC intasato · Spurgo urgente · Chiama ora",
      title: "WC Intasato? Chiama Ora — Spurgo H24",
      titleCity: function (c) {
        return "WC Intasato a " + c + " — Chiama Ora";
      },
      sub: "Water otturato? Chiama subito " + TEL + " — spurgo professionale, risposta immediata.",
    },
    {
      re: /scarico ottur|scarico bloccat|spurgo scarich|stasatura|disottur|lavandino ottur|lavandino cucina|lavandino intas|stappare lavandino|fogna ottur|ingorg/,
      eyebrow: "Scarico otturato · Spurgo · Chiama ora",
      title: "Scarico Otturato? Chiama Ora H24",
      titleCity: function (c) {
        return "Scarico Otturato a " + c + " — Chiama Ora";
      },
      sub: "Lavandino o scarico bloccato? Chiama " + TEL + " — arriviamo con attrezzatura da spurgo.",
    },
    {
      re: /perdita acqua|perdite acqua|allagamento|tubo rotto|tubo scoppiat|acqua che esce|acqua che perde|riparazione perdita|perdita tubo|tubatura/,
      eyebrow: "Perdita acqua · Tubo rotto · Chiama ora",
      title: "Perdita d'Acqua? Chiama Ora — H24",
      titleCity: function (c) {
        return "Perdita d'Acqua Urgente a " + c;
      },
      sub: "Allagamento o tubo rotto? Chiama " + TEL + " — blocchiamo il danno subito.",
    },
    {
      re: /intervento idraulico|pronto intervento idraulico|idraulico pronto intervento/,
      eyebrow: "Pronto intervento idraulico · Chiama ora · H24",
      title: "Pronto Intervento Idraulico — Chiama Ora",
      titleCity: function (c) {
        return "Pronto Intervento Idraulico a " + c;
      },
      sub: "Emergenza idraulica? Chiama " + TEL + " — persona reale, prezzo chiaro subito.",
    },
    {
      re: /idraulico urgente|idraulico h24|idraulico emergenza|emergenza idraulico|idraulico reperibile|idraulico subito|sos idraulico/,
      eyebrow: "Idraulico urgente · Chiama ora · H24",
      title: "Idraulico Urgente H24 — Chiama Ora",
      titleCity: function (c) {
        return "Idraulico Urgente H24 a " + c;
      },
      sub: "Idraulico urgente disponibile ora. Chiama " + TEL + " — niente call center.",
    },
    {
      re: /spurgo lavandino|stappare lavandino|disintasare/,
      eyebrow: "Spurgo lavandino · Chiama ora · H24",
      title: "Spurgo Lavandino Urgente — Chiama Ora",
      titleCity: function (c) {
        return "Spurgo Lavandino a " + c + " — Chiama Ora";
      },
      sub: "Lavandino intasato? Chiama " + TEL + " — spurgo in zona, risposta immediata.",
    },
    {
      re: /chiuso fuori|porta blindata|porta sbattuta|serratura bloccat|chiave rotta|chiave spezzat|apertura port|sblocco/,
      eyebrow: "Chiuso fuori · Apertura porte · Chiama ora",
      title: "Chiuso Fuori? Fabbro Urgente — Chiama Ora",
      titleCity: function (c) {
        return "Fabbro Urgente a " + c + " — Chiama Ora";
      },
      sub: "Porta chiusa o serratura bloccata? Chiama " + TEL + " — apertura rapida, prezzo chiaro.",
    },
    {
      re: /fabbro urgente|fabbro h24|pronto intervento fabbro|fabbro pronto|intervento fabbro|emergenza fabbro/,
      eyebrow: "Fabbro urgente · Pronto intervento · Chiama ora",
      title: "Fabbro Urgente H24 — Chiama Ora",
      titleCity: function (c) {
        return "Fabbro Urgente H24 a " + c;
      },
      sub: "Fabbro reperibile ora. Chiama " + TEL + " — persona reale, niente centralino.",
    },
    {
      re: /cambio cilindro|cilindro europeo|cambio serratur|sostituzione serratur/,
      eyebrow: "Cambio serratura · Cilindro · Chiama ora",
      title: "Cambio Serratura Urgente — Chiama Ora",
      titleCity: function (c) {
        return "Cambio Serratura a " + c + " — Chiama Ora";
      },
      sub: "Serratura o cilindro da sostituire? Chiama " + TEL + " — intervento rapido in zona.",
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
    if (!el || !text) return;
    if (el.textContent !== text) el.textContent = text;
  }

  function apply() {
    var p = params();
    var ads = isAdsTraffic(p);
    var kind = pageKind();
    var kw = getKeyword(p);
    var city = cityName();
    // Apply keyword match for all visitors when kw present; else strong BASE
    var copy = pickCopy(kind, kw, ads || !!kw);

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

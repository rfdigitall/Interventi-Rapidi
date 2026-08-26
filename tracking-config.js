/**
 * ============================================================
 * TRACKING CONFIG — GA4 + Google Ads (da istruzioni Google)
 * ============================================================
 * Tag account: AW-299646523
 * 26/08/2026: DNI / inoltro Google DISATTIVATO.
 * Motivo: call_view = MISSED (annuncio + landing) mentre il 320
 * non squillava. Ora tel: va DIRETTO a 320 114 7517.
 * Click tel (WEBPAGE) resta attivo via conversions.default.
 * Per riattivare DNI: rimetti phoneConversionLabel sotto.
 */
window.GF_TRACKING = {
  ga4Id: 'G-JVSFEE2E7J',
  adsId: 'AW-299646523',
  /** ID account conversione (MCC / altro account Ads, se diverso da adsId) */
  adsIdConversion: 'AW-16810122289',
  /** VUOTO = niente sostituzione numero Google (chiamata diretta) */
  phoneConversionLabel: '',
  /** Deve coincidere ESATTAMENTE con il testo visibile sul sito */
  phoneConversionNumber: '320 114 7517',
  phoneConversionCountryCode: 'IT',
  phoneNumberDigits: '3201147517',
  siteUrl: 'https://interventi-rapidi.it',
  sedeLegale: '',
  enhancedConversions: false,

  /**
   * TEMP (17/08/2026): banner Accept/Rifiuta nascosto, tracking marketing ON
   * (GA4 + Ads + click tel) senza scelta cookie. Ripristinare quando il
   * cliente lo chiede: forceMarketingConsent = false e rimettere il banner.
   */
  forceMarketingConsent: true,

  conversions: {
    /**
     * Conversione "Click tel" (Ads) — AW-16810122289/-QLpCPvPidkcELG42M8-
     * Inviata su phone_click_* anche senza cookie marketing (Consent Mode cookieless).
     */
    default: 'AW-16810122289/-QLpCPvPidkcELG42M8-',
    form_submit_whatsapp: '',
    lead_form_completed: ''
  }
};

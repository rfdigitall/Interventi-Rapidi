const fs = require('fs');
const s = fs.readFileSync(
  'c:/Users/utente/Desktop/Interventi-Rapidi/consent-ads.js',
  'utf8'
);
const checks = [
  ['DNI label', s.includes('phoneConversionLabel')],
  ['DNI number', s.includes('phone_conversion_number')],
  ['DNI mutation observer', s.includes('__gfPhoneMo')],
  ['DNI retries', s.includes('retry@')],
  ['Ads conversion event', s.includes('send_to:i') && s.includes('"conversion"')],
  ['phone_click handling', s.includes('phone_click')],
  ['force consent', s.includes('forceMarketingConsentUntil')],
  ['GA4 id config', s.includes('ga4Id')],
  ['tel listener', s.includes("href^='tel:'") || s.includes('href^=\'tel:\'')],
  ['debounce', s.includes('__gfPhoneTrackAt')],
  ['fast path loaded', s.includes('__gfMarketingLoaded') && s.includes('__gfGtagScriptLoaded')],
];
checks.forEach(([n, ok]) => console.log(ok ? 'OK' : 'MISSING', n));
const i = s.indexOf('function m(e,t)');
console.log('\n', s.slice(i, i + 420));
const j = s.indexOf('window.gfTrack=');
console.log('\n', s.slice(j, j + 280));

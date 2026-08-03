const s = require('fs').readFileSync(
  'c:/Users/utente/Desktop/Interventi-Rapidi/consent-ads.js',
  'utf8'
);
console.log('delay400', /},400\)/.test(s));
console.log('preventDefault', s.includes('preventDefault'));
console.log('m uses setTimeout', s.includes('function m(e,t)') && s.slice(s.indexOf('function m(e,t)'), s.indexOf('function m(e,t)') + 80).includes('setTimeout') || s.slice(s.indexOf('function m(e,t)'), s.indexOf('function m(e,t)') + 200).includes('setTimeout'));
const i = s.indexOf('function m(e,t)');
console.log(s.slice(i, i + 220));
console.log('DNI', s.includes('phone_conversion_number'));
console.log('Ads conversion', s.includes('"conversion"') && s.includes('send_to:i'));

# Gianfranco Tuttofare — Landing H24

Landing pages pronto intervento **fabbro** e **idraulico** (Veneto / Friuli), ottimizzate per Google Ads → chiamata.

Telefono / WhatsApp: **320 1147517**

## Pagine

| URL | File |
|-----|------|
| `/` | `index.html` |
| `/fabbro` | `fabbro.html` |
| `/idraulico` | `idraulico.html` |
| `/grazie` | `grazie.html` |
| `/privacy` | `privacy.html` |
| `/cookie` | `cookie.html` |

## Prima del go-live — `tracking-config.js`

Apri **un solo file**: `tracking-config.js` e compila:

```js
ga4Id: 'G-XXXXXXXX',
adsId: 'AW-XXXXXXXXXX',
phoneConversionLabel: 'AW-XXXXXXXXXX/xxxxx', // Chiamate da sito (con durata se forwarding)
siteUrl: 'https://tuodominio.it',
sedeLegale: 'Via ..., CAP Città (PR)',
conversions: {
  default: 'AW-.../labelPhoneClick', // tap tel: (senza durata)
  form_submit_whatsapp: 'AW-.../labelForm',
  lead_form_completed: 'AW-.../labelGrazie'
}
```

### Chiamate con durata (come Call extension)

| Dove chiama | Azione conversioni Ads | Durata? |
|-------------|------------------------|---------|
| Numero nell’annuncio (Call asset) | **Chiamate da annunci** + reporting chiamate | Sì |
| `tel:` sul sito | **Chiamate da sito web** + `phoneConversionLabel` | Sì (con forwarding Google) |
| Solo tap `tel:` | Clic sul numero del sito → `conversions.default` | No |

Poi aggiorna anche `robots.txt` + `sitemap.xml` (sostituisci `YOURDOMAIN.it`).

## Cosa è già pronto

- **Consent Mode v2** (default denied → update su Accetta / Solo necessari)
- Banner cookie + Gestisci cookie
- Conversione Grazie solo dopo form reale (`?lead=1` + token)
- `gclid` passato nei messaggi WhatsApp
- Canonical / og:url / schema absolute da `siteUrl`
- Sticky call mobile, CTA tel ovunque
- Redirect Netlify + force HTTPS

## Deploy Netlify

1. Push su GitHub
2. Netlify → Import → publish `.`
3. Dominio custom + DNS
4. Compila `tracking-config.js` → redeploy
5. Test Tag Assistant: Accetta cookie → click tel / form

## WhatsApp — messaggi

| Contesto | Testo |
|----------|--------|
| Fabbro | `Ciao, ho bisogno di un fabbro urgente.` |
| Idraulico | `Ciao, ho bisogno di un idraulico urgente.` |
| Home | `Ciao, ho bisogno di un intervento urgente (idraulico o fabbro).` |
| Pick | `Ciao, ho questo problema: {label}. Potete aiutarmi?` |
| Form | `Ciao, sono {nome}...` + eventuale `[gclid:...]` |

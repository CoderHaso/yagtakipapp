// Uyumsoft SOAP 1.1 istemcisi (WS-Security UsernameToken)
//   Integration                 → e-Fatura / e-Arşiv (gelen-giden faturalar)
//   ProducerReceiptIntegration  → e-Müstahsil makbuzu

import { esc, parseXml, find } from './xml.js'

export var ORTAM = {
  canli: 'https://edonusumapi.uyum.com.tr/Services/',
  test: 'https://efatura-test.uyumsoft.com.tr/Services/',
}
var SERVIS = {
  fatura: { yol: 'Integration', arayuz: 'IIntegration' },
  mm: { yol: 'ProducerReceiptIntegration', arayuz: 'IProducerReceiptIntegration' },
}

function header(user, pass, timestamp) {
  var ts = ''
  if (timestamp) {
    var now = new Date()
    var exp = new Date(now.getTime() + 5 * 60 * 1000)
    ts = '<u:Timestamp u:Id="_0"><u:Created>' + now.toISOString() + '</u:Created><u:Expires>' + exp.toISOString() + '</u:Expires></u:Timestamp>'
  }
  return '<s:Header>' +
    '<o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"' +
    ' xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' +
    ts +
    '<o:UsernameToken u:Id="uuid-1"><o:Username>' + esc(user) + '</o:Username>' +
    '<o:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">' + esc(pass) + '</o:Password>' +
    '</o:UsernameToken></o:Security></s:Header>'
}

export function envelope(op, bodyInner, user, pass, timestamp) {
  return '<?xml version="1.0" encoding="utf-8"?>' +
    '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">' +
    header(user, pass, timestamp) +
    '<s:Body><' + op + ' xmlns="http://tempuri.org/">' + (bodyInner || '') + '</' + op + '></s:Body>' +
    '</s:Envelope>'
}

export class UyumsoftHata extends Error {
  constructor(msg, kod) { super(msg); this.kod = kod || 'UYUMSOFT' }
}

// cfg: { user, pass, base }
export async function call(cfg, servis, op, bodyInner) {
  var s = SERVIS[servis]
  var url = cfg.base + s.yol
  async function once(timestamp) {
    var ctrl = new AbortController()
    var t = setTimeout(function () { ctrl.abort() }, 45000)
    try {
      var res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: '"http://tempuri.org/' + s.arayuz + '/' + op + '"',
        },
        body: envelope(op, bodyInner, cfg.user, cfg.pass, timestamp),
        signal: ctrl.signal,
      })
      var text = await res.text()
      return { status: res.status, text: text }
    } catch (e) {
      throw new UyumsoftHata('Uyumsoft sunucusuna ulaşılamadı: ' + (e.name === 'AbortError' ? 'zaman aşımı' : e.message), 'BAGLANTI')
    } finally { clearTimeout(t) }
  }

  var r = await once(false)
  var tree = parseXml(r.text)
  var fault = find(tree, 'Fault')
  // Bazı WCF uçları zaman damgası ister — güvenlik hatasında bir kez damgalı dene
  if (fault && /secur|güvenlik|timestamp/i.test(faultText(fault))) {
    r = await once(true)
    tree = parseXml(r.text)
    fault = find(tree, 'Fault')
  }
  if (fault) {
    var ft = faultText(fault)
    var auth = /authenticat|password|kullanıcı|şifre|yetki|unauthori|secur/i.test(ft)
    throw new UyumsoftHata((auth ? 'Kimlik doğrulama hatası: ' : 'Uyumsoft hatası: ') + ft.slice(0, 500), auth ? 'KIMLIK' : 'FAULT')
  }
  if (r.status >= 400) {
    throw new UyumsoftHata('Uyumsoft HTTP ' + r.status + (r.status === 401 || r.status === 403 ? ' (kullanıcı adı / şifre?)' : ''), r.status === 401 ? 'KIMLIK' : 'HTTP')
  }
  var result = find(tree, op + 'Result')
  if (!result) throw new UyumsoftHata('Beklenmeyen Uyumsoft yanıtı (' + op + ')', 'YANIT')
  if (result.attrs.IsSucceded === 'false') {
    throw new UyumsoftHata(result.attrs.Message || 'İşlem başarısız', 'BASARISIZ')
  }
  return result
}

function faultText(fault) {
  var s = find(fault, 'faultstring') || find(fault, 'Text') || fault
  var out = ''
  ;(function walk(n) { out += n.text; n.children.forEach(walk) })(s)
  return out.replace(/\s+/g, ' ').trim()
}

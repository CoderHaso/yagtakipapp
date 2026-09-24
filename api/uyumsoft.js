// ─────────────────────────────────────────────────────────────
// /api/uyumsoft — Uyumsoft e-Dönüşüm köprüsü (Vercel sunucu fonksiyonu)
// Tarayıcı Uyumsoft'a doğrudan bağlanamaz (CORS + şifre gizliliği);
// tablet bu uca { islem, ... } POST eder, burası SOAP'a çevirir.
//
// Kimlik bilgisi önceliği:
//   1) Vercel ortam değişkenleri UYUMSOFT_KULLANICI / UYUMSOFT_SIFRE (önerilen)
//   2) Cihazın gönderdiği x-uyumsoft-kullanici / x-uyumsoft-sifre başlıkları
// Ortam: UYUMSOFT_ORTAM=test|canli (varsayılan canli) veya istekteki `ortam`.
// ─────────────────────────────────────────────────────────────

import { call, ORTAM, UyumsoftHata } from './_lib/soap.js'
import { esc, find, kids, flat, childText } from './_lib/xml.js'
import { buildReceipt, buildInvoice, trNow, uuid } from './_lib/ubl.js'
import { kimlikTuru } from '../src/lib/efatura.js'

var TEST_HESAP = { user: 'Uyumsoft', pass: 'Uyumsoft' }   // Uyumsoft'un herkese açık test hesabı

function config(req, body) {
  var ortam = body.ortam === 'test' || body.ortam === 'canli' ? body.ortam : (process.env.UYUMSOFT_ORTAM || 'canli')
  var envUser = process.env.UYUMSOFT_KULLANICI
  var envPass = process.env.UYUMSOFT_SIFRE
  var hUser = req.headers['x-uyumsoft-kullanici']
  var hPass = req.headers['x-uyumsoft-sifre']
  var user, pass, kaynak
  if (ortam === 'test') { user = TEST_HESAP.user; pass = TEST_HESAP.pass; kaynak = 'test' }
  else if (envUser && envPass) { user = envUser; pass = envPass; kaynak = 'sunucu' }
  else if (hUser && hPass) { user = decodeURIComponent(hUser); pass = decodeURIComponent(hPass); kaynak = 'cihaz' }
  return {
    ortam: ortam, kaynak: kaynak, user: user, pass: pass,
    base: process.env.UYUMSOFT_ADRES && ortam === 'canli' ? process.env.UYUMSOFT_ADRES : ORTAM[ortam],
  }
}

function num(v) { var n = Number(v); return isNaN(n) ? 0 : n }
function strList(ids) {
  return (Array.isArray(ids) ? ids : [ids]).filter(Boolean).map(function (id) { return '<string>' + esc(id) + '</string>' }).join('')
}
function isoGun(s, son) {
  if (!s) return null
  return s.length === 10 ? s + (son ? 'T23:59:59' : 'T00:00:00') : s
}
// Uyumsoft alan adları servisten servise değişiyor (InvoiceId bazen numara,
// DocumentId bazen ETTN). Görüntüleme/PDF uçları ETTN (GUID) ister → biçime bak.
var GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function ettnVeNo(a, b) {
  if (GUID.test(b || '') && !GUID.test(a || '')) return { id: b, no: a || '' }
  if (GUID.test(a || '') && !GUID.test(b || '')) return { id: a, no: b || '' }
  return { id: a || b, no: b && b !== a ? b : '' }
}

function guidMi(v) { return GUID.test(v || '') }

// Aday kimliklerle sırayla dene: Uyumsoft "bulunamadı / hata" derse sıradakine geç.
// adaylar bir fonksiyon da olabilir (tembel: yalnızca öncekiler başarısızsa çalışır).
async function sirayla(adaylar, fn) {
  var denenen = {}, son = null
  for (var i = 0; i < adaylar.length; i++) {
    var a = adaylar[i]
    var liste = typeof a === 'function' ? await a().catch(function () { return [] }) : [a]
    for (var j = 0; j < liste.length; j++) {
      var id = liste[j]
      if (!id || denenen[id]) continue
      denenen[id] = true
      try { return await fn(id) } catch (e) {
        if (e.kod !== 'BASARISIZ' && e.kod !== 'FAULT' && e.kod !== 'YANIT') throw e
        son = e
      }
    }
  }
  throw son || new UyumsoftHata('Belge bulunamadı', 'YANIT')
}

// Giden kutusunda ETTN/numara ile ara → Uyumsoft'un belge kimliği (DocumentId)
async function gidenKimlik(cfg, id) {
  var nil = function (t) { return '<' + t + ' xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>' }
  var q = '<query PageIndex="0" PageSize="5">' +
    nil('ExecutionStartDate') + nil('ExecutionEndDate') + nil('CreateStartDate') + nil('CreateEndDate') + nil('Status') +
    el('InvoiceIds', id) +
    nil('SortColumn') + nil('SortMode') + nil('IsArchived') + nil('Scenario') +
    '</query>'
  var r = await call(cfg, 'fatura', 'GetOutboxInvoiceList', q)
  return kids(find(r, 'Value'), 'Items').map(function (n) { return flat(n).DocumentId }).filter(Boolean)
}

function faturaAdaylar(cfg, b, id) {
  var list = [id, b.alt]
  if (b.kutu !== 'gelen') list.push(function () { return gidenKimlik(cfg, id) })
  return list
}

function el(tag, v) { return v == null || v === '' ? '' : '<' + tag + '>' + esc(v) + '</' + tag + '>' }

// FlagResponse Value=false → başarısız say (sıradaki kimlik denensin)
function taslakSonuc(r) {
  if (r.attrs.Value === 'false') throw new UyumsoftHata(r.attrs.Message || 'Taslak işlemi yapılamadı', 'BASARISIZ')
  return { tamam: true, mesaj: r.attrs.Message || '' }
}

// ── İşlemler ──
var ISLEMLER = {
  async durum(cfg) {
    return { ortam: cfg.ortam, kaynak: cfg.kaynak || null, hazir: !!cfg.user, sunucuSifresi: !!process.env.UYUMSOFT_KULLANICI }
  },

  async test(cfg) {
    var r = await call(cfg, 'fatura', 'WhoAmI', '')
    var v = find(r, 'Value')
    var musteri = flat(find(v, 'Customer')) || {}
    var kullanici = flat(find(v, 'User')) || {}
    var firma = flat(find(v, 'Company')) || {}
    var mm = true, mmHata = ''
    try { await call(cfg, 'mm', 'GetSystemDate', '') } catch (e) { mm = false; mmHata = e.message }
    return {
      ortam: cfg.ortam, kaynak: cfg.kaynak, mm: mm, mmHata: mmHata,
      kullanici: [kullanici.Name, kullanici.Surname].filter(Boolean).join(' ') || kullanici.Username || '',
      firma: {
        unvan: musteri.Title || [musteri.Name, musteri.Surname].filter(Boolean).join(' '),
        ad: musteri.Name || '', soyad: musteri.Surname || '',
        vkn: musteri.VkTckNo || '', vergiDairesi: musteri.TaxOffice || '',
        mersis: musteri.MersisNo || '', sicil: musteri.RegisterNumber || '',
        adres: [musteri.AddressStreetName, musteri.AddressStreetName2].filter(Boolean).join(' '),
        binaNo: musteri.AddressBuildingNumber || '',
        ilce: musteri.AddressSubDivisionName || '', il: musteri.AddressCity || '',
        tel: musteri.ContactPhone || firma.PhoneNumber || '', eposta: musteri.ContactEmail || firma.Email || '',
        web: musteri.WebSite || '',
      },
    }
  },

  // Alıcı e-Fatura mükellefi mi? Posta kutusu etiketleri
  async mukellef(cfg, b) {
    var no = String(b.vkn || '').replace(/\D/g, '')
    if (!kimlikTuru(no)) throw new UyumsoftHata('Geçerli VKN (10) / TCKN (11) girin', 'GIRDI')
    var r = await call(cfg, 'fatura', 'IsEInvoiceUser', el('vknTckn', no))
    var eFatura = r.attrs.Value === 'true'
    var etiketler = [], unvan = ''
    if (eFatura) {
      try {
        var a = await call(cfg, 'fatura', 'GetUserAliasses', el('vknTckn', no))
        var v = find(a, 'Value')
        var def = find(v, 'Definition')
        unvan = def ? def.attrs.Title || '' : ''
        etiketler = kids(v, 'ReceiverboxAliases').filter(function (x) { return x.attrs.Enabled !== 'false' && !x.attrs.SystemDeleteDate }).map(function (x) { return x.attrs.Alias })
      } catch (e) { /* etiket alınamazsa varsayılan kullanılır */ }
    }
    return { eFatura: eFatura, etiketler: etiketler, unvan: unvan }
  },

  // ── e-Müstahsil ──
  async mmGonder(cfg, b) {
    var d = b.belge || {}
    if (!d.mustahsil || kimlikTuru(d.mustahsil.kimlikNo) !== 'TCKN') throw new UyumsoftHata('Müstahsilin 11 haneli TC kimlik numarası gerekli', 'GIRDI')
    if (!d.firma || !kimlikTuru(d.firma.kimlikNo)) throw new UyumsoftHata('Ayarlardan firma VKN/TCKN bilgisini girin', 'GIRDI')
    if (!(num(d.miktar) > 0) || !(num(d.birimFiyat) > 0)) throw new UyumsoftHata('Miktar ve birim fiyat sıfırdan büyük olmalı', 'GIRDI')
    var now = trNow()
    var id = uuid()
    var built = buildReceipt(Object.assign({}, d, { uuid: id, tarih: now.tarih, saat: now.saat, id: d.seri || '' }))
    var body = '<receipts><ProducerReceiptInfo>' +
      '<LocalDocumentId xmlns="urn:names:myinvoice:producerreceipt">' + esc(b.yerelId || '') + '</LocalDocumentId>' +
      built.xml +
      '</ProducerReceiptInfo></receipts>'
    var op = b.taslak ? 'SaveAsDraft' : 'SendProducerReceipt'
    var r = await call(cfg, 'mm', op, body)
    var v = find(r, 'Value')
    return {
      taslak: !!b.taslak, uuid: id, tarih: now.tarih, saat: now.saat, hesap: built.hesap,
      belgeId: v ? ettnVeNo(v.attrs.DocumentId, v.attrs.ReceiptNumber).id || id : id,
      belgeNo: v ? ettnVeNo(v.attrs.DocumentId, v.attrs.ReceiptNumber).no : '',
      mesaj: r.attrs.Message || '',
    }
  },

  async mmTaslakGonder(cfg, b) {
    return sirayla([].concat(b.ids || [], b.alt || []), function (id) {
      return call(cfg, 'mm', 'SendDraft', '<receiptIdentifiers>' + strList([id]) + '</receiptIdentifiers>').then(taslakSonuc)
    })
  },

  async mmTaslakIptal(cfg, b) {
    return sirayla([].concat(b.ids || [], b.alt || []), function (id) {
      return call(cfg, 'mm', 'CancelDraft', '<receiptIdentifiers>' + strList([id]) + '</receiptIdentifiers>').then(taslakSonuc)
    })
  },

  async mmListe(cfg, b) {
    var q = '<context PageIndex="' + (num(b.sayfa) || 0) + '" PageSize="' + (num(b.boyut) || 50) + '">' +
      el('TargetVknTckn', b.tckn) +
      '<CreationSartDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>' +
      '<CreationEndDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>' +
      (b.bas ? el('DocumentStartDate', isoGun(b.bas)) : '<DocumentStartDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>') +
      (b.bit ? el('DocumentEndDate', isoGun(b.bit, true)) : '<DocumentEndDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>') +
      '<IsArchived xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>' +
      '<Ascending>false</Ascending>' +
      '</context>'
    var r = await call(cfg, 'mm', 'QueryProducerReceiptList', q)
    var v = find(r, 'Value')
    var items = kids(v, 'Items').map(function (n) {
      var f = flat(n)
      return {
        id: f.DocumentId || f.ReceiptNumber, no: guidMi(f.ReceiptNumber) ? '' : (f.ReceiptNumber || ''),
        alt: f.ReceiptNumber && f.ReceiptNumber !== f.DocumentId ? f.ReceiptNumber : '', tarih: f.IssueDate, durum: f.StatusEnum, durumKod: num(f.Status),
        unvan: f.TargetTitle, tckn: f.TargetVknTckn, tutar: num(f.PayableAmount),
        brut: num(f.TaxExclusiveAmount), stopaj: num(f.StoppageTaxTotal), kesinti: num(f.TaxTotal),
        yerelId: f.LocalDocumentId || '',
      }
    })
    return { items: items, toplam: v ? num(v.attrs.TotalCount) : items.length, sayfaSayisi: v ? num(v.attrs.TotalPages) : 1 }
  },

  async mmDurum(cfg, b) {
    var r = await call(cfg, 'mm', 'QueryProducerReceiptStatus', '<receiptIds>' + strList(b.ids) + '</receiptIds>')
    return { items: kids(r, 'Value').map(function (n) { return { id: n.attrs.DocumentId, no: n.attrs.ReceiptNumber, durum: n.attrs.Status, yerelId: n.attrs.LocalDocumentId } }) }
  },

  async mmPdf(cfg, b) {
    return sirayla([b.id, b.alt], async function (id) {
      var r = await call(cfg, 'mm', 'GetPdfView', el('receiptId', id))
      var v = find(r, 'Value')
      var data = v ? (v.attrs.FileData || childText(v, 'FileData')) : ''
      if (!data) throw new UyumsoftHata('PDF alınamadı', 'YANIT')
      return { pdf: data, no: v.attrs.ReceiptNumber || '' }
    })
  },

  async mmHtml(cfg, b) {
    return sirayla([b.id, b.alt], async function (id) {
      var r = await call(cfg, 'mm', 'GetHtmlView', el('receiptId', id))
      var html = childText(find(r, 'Value'), 'Html')
      if (!html) throw new UyumsoftHata('Görüntü alınamadı', 'YANIT')
      return { html: html }
    })
  },

  // ── Satış faturası ──
  async faturaGonder(cfg, b) {
    var d = b.belge || {}
    if (!d.alici || !kimlikTuru(d.alici.kimlikNo)) throw new UyumsoftHata('Alıcının VKN (10) veya TCKN (11) bilgisi gerekli', 'GIRDI')
    if (!d.firma || !kimlikTuru(d.firma.kimlikNo)) throw new UyumsoftHata('Ayarlardan firma VKN/TCKN bilgisini girin', 'GIRDI')
    if (!(num(d.miktar) > 0) || !(num(d.birimFiyat) > 0)) throw new UyumsoftHata('Miktar ve birim fiyat sıfırdan büyük olmalı', 'GIRDI')

    var no = String(d.alici.kimlikNo).replace(/\D/g, '')
    var muk = await ISLEMLER.mukellef(cfg, { vkn: no })
    var senaryo = muk.eFatura ? 'eInvoice' : 'eArchive'
    var etiket = d.etiket || muk.etiketler[0] || ''
    var profil = muk.eFatura ? (d.profil === 'TICARIFATURA' ? 'TICARIFATURA' : 'TEMELFATURA') : 'EARSIVFATURA'

    var now = trNow()
    var id = uuid()
    var built = buildInvoice(Object.assign({}, d, { uuid: id, tarih: now.tarih, saat: now.saat, profil: profil, id: d.seri || '' }))
    var unvan = d.alici.unvan || d.alici.adSoyad || ''
    var info = '<InvoiceInfo LocalDocumentId="' + esc(b.yerelId || '') + '">' +
      built.xml +
      '<TargetCustomer VknTckn="' + esc(no) + '"' + (etiket ? ' Alias="' + esc(etiket) + '"' : '') + ' Title="' + esc(unvan) + '"/>' +
      (senaryo === 'eArchive' ? '<EArchiveInvoiceInfo DeliveryType="' + (d.alici.eposta ? 'Electronic' : 'Paper') + '"/>' : '') +
      '<Scenario>' + senaryo + '</Scenario>' +
      (senaryo === 'eArchive' && d.alici.eposta
        ? '<Notification><Mailing EnableNotification="true" To="' + esc(d.alici.eposta) + '"><Subject>' + esc('Faturanız') + '</Subject><Attachment Xml="false" Pdf="true" Html="false" AdditionalDocuments="false"/></Mailing></Notification>'
        : '') +
      '<CreateDateUtc>' + new Date().toISOString() + '</CreateDateUtc>' +
      '</InvoiceInfo>'
    var op = b.taslak ? 'SaveAsDraft' : 'SendInvoice'
    var r = await call(cfg, 'fatura', op, '<invoices>' + info + '</invoices>')
    var v = find(r, 'Value')
    return {
      taslak: !!b.taslak, uuid: id, tarih: now.tarih, saat: now.saat, hesap: built.hesap,
      senaryo: senaryo, profil: profil, etiket: etiket,
      belgeId: v ? ettnVeNo(v.attrs.Id, v.attrs.Number).id || id : id,
      belgeNo: v ? ettnVeNo(v.attrs.Id, v.attrs.Number).no : '',
      mesaj: r.attrs.Message || '',
    }
  },

  async faturaTaslakGonder(cfg, b) {
    var ids = [].concat(b.ids || [])
    var r = await sirayla(faturaAdaylar(cfg, b, ids[0]), function (id) {
      return call(cfg, 'fatura', 'SendDraft', '<invoiceIds>' + strList([id]) + '</invoiceIds>').then(taslakSonuc)
    })
    return r
  },

  async faturaTaslakIptal(cfg, b) {
    var ids = [].concat(b.ids || [])
    return sirayla(faturaAdaylar(cfg, b, ids[0]), function (id) {
      return call(cfg, 'fatura', 'CancelDraft', '<invoiceIds>' + strList([id]) + '</invoiceIds>').then(taslakSonuc)
    })
  },

  async faturaListe(cfg, b) {
    var gelen = b.kutu === 'gelen'
    var nil = function (t) { return '<' + t + ' xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>' }
    var q = '<query PageIndex="' + (num(b.sayfa) || 0) + '" PageSize="' + (num(b.boyut) || 50) + '"' + (gelen ? ' OnlyNewestInvoices="false"' : '') + '>' +
      (b.bas ? el('ExecutionStartDate', isoGun(b.bas)) : nil('ExecutionStartDate')) +
      (b.bit ? el('ExecutionEndDate', isoGun(b.bit, true)) : nil('ExecutionEndDate')) +
      nil('CreateStartDate') + nil('CreateEndDate') + nil('Status') +
      el('SortColumn', 'ExecutionDate') + el('SortMode', 'Descending') +
      nil('IsArchived') +
      (gelen ? '' : nil('Scenario')) +
      '</query>'
    var op = gelen ? 'GetInboxInvoiceList' : 'GetOutboxInvoiceList'
    var r = await call(cfg, 'fatura', op, q)
    var v = find(r, 'Value')
    var items = kids(v, 'Items').map(function (n) {
      var f = flat(n)
      return {
        // DocumentId = Uyumsoft belge kimliği (görüntüleme/PDF bunu ister); InvoiceId = numara, taslakta ETTN
        id: f.DocumentId || f.InvoiceId, no: guidMi(f.InvoiceId) ? '' : (f.InvoiceId || ''),
        alt: f.InvoiceId && f.InvoiceId !== f.DocumentId ? f.InvoiceId : '', tarih: f.ExecutionDate || f.CreateDateUtc, durum: f.Status,
        zarfDurum: f.EnvelopeStatus, mesaj: f.Message || '',
        unvan: f.TargetTitle, vkn: f.TargetTcknVkn, tur: f.Type, senaryo: f.Scenario || '',
        tutar: num(f.PayableAmount), kdv: num(f.TaxTotal), matrah: num(f.TaxExclusiveAmount),
        yeni: f.IsNew === 'true', yerelId: f.LocalDocumentId || '',
      }
    })
    return { items: items, toplam: v ? num(v.attrs.TotalCount) : items.length, sayfaSayisi: v ? num(v.attrs.TotalPages) : 1 }
  },

  async faturaDurum(cfg, b) {
    var r = await call(cfg, 'fatura', 'QueryOutboxInvoiceStatus', '<invoiceIds>' + strList(b.ids) + '</invoiceIds>')
    return { items: kids(r, 'Value').map(function (n) { return { id: n.attrs.InvoiceId, durum: n.attrs.Status, mesaj: n.attrs.Message || '' } }) }
  },

  async faturaPdf(cfg, b) {
    var op = b.kutu === 'gelen' ? 'GetInboxInvoicePdf' : 'GetOutboxInvoicePdf'
    return sirayla(faturaAdaylar(cfg, b, b.id), async function (id) {
      var r = await call(cfg, 'fatura', op, el('invoiceId', id))
      var v = find(r, 'Value')
      var data = v ? childText(v, 'Data') : ''
      if (!data) throw new UyumsoftHata('PDF alınamadı', 'YANIT')
      return { pdf: data }
    })
  },

  async faturaHtml(cfg, b) {
    var op = b.kutu === 'gelen' ? 'GetInboxInvoiceView' : 'GetOutboxInvoiceView'
    return sirayla(faturaAdaylar(cfg, b, b.id), async function (id) {
      var r = await call(cfg, 'fatura', op, el('invoiceId', id))
      var html = childText(find(r, 'Value'), 'Html')
      if (!html) throw new UyumsoftHata('Görüntü alınamadı', 'YANIT')
      return { html: html }
    })
  },
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') { res.status(405).json({ hata: 'POST kullanın' }); return }
  var body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch (e) { body = {} } }
  body = body || {}
  var fn = ISLEMLER[body.islem]
  if (!fn) { res.status(400).json({ hata: 'Bilinmeyen işlem: ' + body.islem }); return }
  var cfg = config(req, body)
  if (body.islem !== 'durum' && !cfg.user) {
    res.status(401).json({ hata: 'Uyumsoft kullanıcı adı / şifresi tanımlı değil. Ayarlar → e-Fatura bölümünden girin.', kod: 'KIMLIK_YOK' })
    return
  }
  try {
    var out = await fn(cfg, body)
    res.status(200).json(Object.assign({ ok: true }, out))
  } catch (e) {
    var kod = e.kod || 'SUNUCU'
    var status = kod === 'GIRDI' ? 400 : kod === 'KIMLIK' ? 401 : 502
    res.status(status).json({ hata: e.message, kod: kod })
  }
}

// Test için
export { ISLEMLER }

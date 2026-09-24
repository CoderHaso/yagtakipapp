// UBL-TR belge üreticileri
//   e-Müstahsil makbuzu → <Receipt> (CreditNote-2, MUSTAHSILMAKBUZ)
//   Satış faturası      → <Invoice> (Invoice-2 içeriği, Uyumsoft InvoiceInfo altında)
// Eleman sıraları Uyumsoft WSDL şemalarıyla birebir aynı tutulmalı.

import { esc } from './xml.js'
import { mustahsilHesapla, satisHesapla, birimKodu, kimlikTuru, adSoyadAyir, r2 } from '../../src/lib/efatura.js'

export var NS = {
  cbc: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
  cac: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
  cn: 'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2',
}
var NSDECL = ' xmlns:cbc="' + NS.cbc + '" xmlns:cac="' + NS.cac + '"'

function b(tag, val, attrs) {
  if (val == null || val === '') return ''
  var a = ''
  if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] != null && attrs[k] !== '') a += ' ' + k + '="' + esc(attrs[k]) + '"' })
  return '<cbc:' + tag + a + '>' + esc(val) + '</cbc:' + tag + '>'
}
function c(tag, inner) { return inner ? '<cac:' + tag + '>' + inner + '</cac:' + tag + '>' : '' }
function amt(tag, v, cur) { return b(tag, r2(v).toFixed(2), { currencyID: cur || 'TRY' }) }

// Türkiye saatiyle tarih / saat
export function trNow(d) {
  var parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(d || new Date())
  var p = {}
  parts.forEach(function (x) { p[x.type] = x.value })
  var hh = p.hour === '24' ? '00' : p.hour
  return { tarih: p.year + '-' + p.month + '-' + p.day, saat: hh + ':' + p.minute + ':' + p.second }
}

export function uuid() {
  if (globalThis.crypto && globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID().toUpperCase()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (ch) {
    var r = Math.random() * 16 | 0
    return (ch === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  }).toUpperCase()
}

// Taraf (firma / müşteri / müstahsil)
// p: { kimlikNo, unvan, adSoyad, vergiDairesi, adres, binaNo, ilce, il, ulke, tel, eposta, web, mersis, sicil }
export function party(p) {
  var no = String(p.kimlikNo || '').replace(/\D/g, '')
  var tur = kimlikTuru(no) || 'TCKN'
  var ids = c('PartyIdentification', b('ID', no, { schemeID: tur }))
  if (p.mersis) ids += c('PartyIdentification', b('ID', p.mersis, { schemeID: 'MERSISNO' }))
  if (p.sicil) ids += c('PartyIdentification', b('ID', p.sicil, { schemeID: 'TICARETSICILNO' }))

  var isim = tur === 'VKN' ? (p.unvan || p.adSoyad) : (p.unvan || '')
  var kisi = ''
  if (tur === 'TCKN') {
    var as = adSoyadAyir(p.adSoyad || p.unvan)
    kisi = c('Person', b('FirstName', as.ad || '-') + b('FamilyName', as.soyad || '-'))
  }
  var adres = c('PostalAddress',
    b('StreetName', p.adres || '-') +
    b('BuildingNumber', p.binaNo) +
    b('CitySubdivisionName', p.ilce || p.il || '-') +
    b('CityName', p.il || '-') +
    c('Country', b('IdentificationCode', 'TR') + b('Name', p.ulke || 'Türkiye'))
  )
  var vd = p.vergiDairesi ? c('PartyTaxScheme', c('TaxScheme', b('Name', p.vergiDairesi))) : ''
  var iletisim = (p.tel || p.eposta) ? c('Contact', b('Telephone', p.tel) + b('ElectronicMail', p.eposta)) : ''
  return c('Party',
    b('WebsiteURI', p.web) +
    ids +
    (isim ? c('PartyName', b('Name', isim)) : '') +
    adres + vd + iletisim + kisi
  )
}

function taxSubtotal(matrah, tutar, oran, ad, kod, sira, istisna) {
  return c('TaxSubtotal',
    amt('TaxableAmount', matrah) +
    amt('TaxAmount', tutar) +
    (sira ? b('CalculationSequenceNumeric', sira) : '') +
    b('Percent', oran) +
    c('TaxCategory',
      (istisna ? b('TaxExemptionReasonCode', istisna.kod) + b('TaxExemptionReason', istisna.ad) : '') +
      c('TaxScheme', b('Name', ad) + b('TaxTypeCode', kod))
    )
  )
}

// ── e-Müstahsil makbuzu ──
// d: { id, uuid, tarih, saat, teslimTarihi, firma, mustahsil, urunAd, miktar, birim, birimFiyat, kesintiOranlari, notlar[] }
export function buildReceipt(d) {
  var h = mustahsilHesapla(d.miktar, d.birimFiyat, d.kesintiOranlari)
  var kesintiXml = ''
  if (h.kesintiler.length) {
    var subs = h.kesintiler.map(function (k, i) { return taxSubtotal(k.matrah, k.tutar, k.oran, k.ad, k.kod, i + 1) }).join('')
    kesintiXml = c('TaxTotal', amt('TaxAmount', h.toplamKesinti) + subs)
  }
  var xml =
    '<Receipt xmlns="' + NS.cn + '"' + NSDECL + '>' +
    b('UBLVersionID', '2.1') +
    b('CustomizationID', 'TR1.2') +
    b('ProfileID', 'EARSIVBELGE') +
    '<cbc:ID>' + esc(d.id || '') + '</cbc:ID>' +
    b('CopyIndicator', 'false') +
    b('UUID', d.uuid) +
    b('IssueDate', d.tarih) +
    b('IssueTime', d.saat) +
    b('CreditNoteTypeCode', 'MUSTAHSILMAKBUZ') +
    (d.notlar || []).filter(Boolean).map(function (n) { return b('Note', n) }).join('') +
    b('DocumentCurrencyCode', 'TRY') +
    b('LineCountNumeric', 1) +
    c('AccountingSupplierParty', party(d.firma)) +
    c('AccountingCustomerParty', party(d.mustahsil)) +
    c('Delivery', b('ActualDeliveryDate', d.teslimTarihi || d.tarih)) +
    kesintiXml +
    c('LegalMonetaryTotal',
      amt('LineExtensionAmount', h.brut) +
      amt('TaxExclusiveAmount', h.brut) +
      amt('TaxInclusiveAmount', h.net) +
      amt('AllowanceTotalAmount', 0) +
      amt('PayableAmount', h.net)
    ) +
    c('CreditNoteLine',
      b('ID', 1) +
      b('CreditedQuantity', r2(d.miktar), { unitCode: birimKodu(d.birim) }) +
      amt('LineExtensionAmount', h.brut) +
      kesintiXml +
      c('Item', b('Name', d.urunAd || 'Zeytinyağı')) +
      c('Price', amt('PriceAmount', d.birimFiyat))
    ) +
    '</Receipt>'
  return { xml: xml, hesap: h }
}

// ── Satış faturası ──
// d: { id, uuid, tarih, saat, profil, firma, alici, urunAd, miktar, birim, birimFiyat, kdvOran, kdvDahil, notlar[] }
export function buildInvoice(d) {
  var h = satisHesapla(d.miktar, d.birimFiyat, d.kdvOran, d.kdvDahil)
  var istisna = h.kdvOran === 0 ? { kod: '351', ad: 'KDV - Diğer' } : null
  var kdvXml = c('TaxTotal', amt('TaxAmount', h.kdv) + taxSubtotal(h.matrah, h.kdv, h.kdvOran, 'KDV', '0015', 1, istisna))
  var xml =
    '<Invoice' + NSDECL + '>' +
    b('UBLVersionID', '2.1') +
    b('CustomizationID', 'TR1.2') +
    b('ProfileID', d.profil || 'TEMELFATURA') +
    '<cbc:ID>' + esc(d.id || '') + '</cbc:ID>' +
    b('CopyIndicator', 'false') +
    b('UUID', d.uuid) +
    b('IssueDate', d.tarih) +
    b('IssueTime', d.saat) +
    b('InvoiceTypeCode', 'SATIS') +
    (d.notlar || []).filter(Boolean).map(function (n) { return b('Note', n) }).join('') +
    b('DocumentCurrencyCode', 'TRY') +
    b('LineCountNumeric', 1) +
    c('AccountingSupplierParty', party(d.firma)) +
    c('AccountingCustomerParty', party(d.alici)) +
    kdvXml +
    c('LegalMonetaryTotal',
      amt('LineExtensionAmount', h.matrah) +
      amt('TaxExclusiveAmount', h.matrah) +
      amt('TaxInclusiveAmount', h.toplam) +
      amt('AllowanceTotalAmount', 0) +
      amt('PayableAmount', h.toplam)
    ) +
    c('InvoiceLine',
      b('ID', 1) +
      b('InvoicedQuantity', r2(d.miktar), { unitCode: birimKodu(d.birim) }) +
      amt('LineExtensionAmount', h.matrah) +
      kdvXml +
      c('Item', b('Name', d.urunAd || 'Zeytinyağı')) +
      c('Price', b('PriceAmount', h.netBirimFiyat, { currencyID: 'TRY' }))
    ) +
    '</Invoice>'
  return { xml: xml, hesap: h }
}

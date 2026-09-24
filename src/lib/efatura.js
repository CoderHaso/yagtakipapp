// ─────────────────────────────────────────────────────────────
// E-BELGE HESAPLARI — tablet ve sunucu (api/uyumsoft) ortak kullanır
//   Müstahsil makbuzu (e-MM): yağ alışı, üreticiden kesinti (stopaj vb.)
//   Satış faturası (e-Fatura / e-Arşiv): yağ satışı, KDV
// Tutarlar kuruşa yuvarlanır; sunucu aynı fonksiyonla yeniden hesaplar,
// böylece ekranda görünen ile Uyumsoft'a giden belge birebir aynı olur.
// ─────────────────────────────────────────────────────────────

// ₺1.234,50 — belgelerde kuruş her zaman görünür
export function tl(n) {
  if (n == null || isNaN(Number(n))) return '—'
  return '₺' + Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function r2(n) { return Math.round((Number(n) || 0) * 100 + Number.EPSILON * 100) / 100 }

// GİB vergi kodları (e-MM kesintileri)
export var KESINTI_TURLERI = [
  { id: 'stopaj', kod: '0003', ad: 'GV Stopajı', ayar: 'mmStopajOran' },
  { id: 'borsa', kod: '8001', ad: 'Borsa Tescil Ücreti', ayar: 'mmBorsaOran' },
  { id: 'mera', kod: '9040', ad: 'Mera Fonu', ayar: 'mmMeraOran' },
  { id: 'sgk', kod: 'SGK_PRIM', ad: 'SGK Prim Kesintisi', ayar: 'mmSgkOran' },
]

// Birim → UN/ECE kodu
export function birimKodu(birim) { return birim === 'lt' ? 'LTR' : 'KGM' }

export function kesintiOranlari(s) {
  var o = s || {}
  return KESINTI_TURLERI.map(function (k) {
    return { id: k.id, kod: k.kod, ad: k.ad, oran: Number(o[k.ayar]) || 0 }
  }).filter(function (k) { return k.oran > 0 })
}

// Müstahsil: fiyat = üreticiye ödenen brüt birim fiyat
export function mustahsilHesapla(miktar, birimFiyat, oranlar) {
  var brut = r2((Number(miktar) || 0) * (Number(birimFiyat) || 0))
  var kesintiler = (oranlar || []).map(function (k) {
    return { id: k.id, kod: k.kod, ad: k.ad, oran: k.oran, matrah: brut, tutar: r2(brut * k.oran / 100) }
  })
  var toplamKesinti = r2(kesintiler.reduce(function (t, k) { return t + k.tutar }, 0))
  return { brut: brut, kesintiler: kesintiler, toplamKesinti: toplamKesinti, net: r2(brut - toplamKesinti) }
}

// Satış: kdvDahil → girilen birim fiyat KDV dahildir
export function satisHesapla(miktar, birimFiyat, kdvOran, kdvDahil) {
  var m = Number(miktar) || 0
  var f = Number(birimFiyat) || 0
  var k = Number(kdvOran) || 0
  var matrah, kdv, toplam
  if (kdvDahil) {
    toplam = r2(m * f)
    matrah = r2(toplam / (1 + k / 100))
    kdv = r2(toplam - matrah)
  } else {
    matrah = r2(m * f)
    kdv = r2(matrah * k / 100)
    toplam = r2(matrah + kdv)
  }
  var netBirim = m ? +(matrah / m).toFixed(6) : 0
  return { matrah: matrah, kdv: kdv, kdvOran: k, toplam: toplam, netBirimFiyat: netBirim }
}

// VKN 10 hane (tüzel), TCKN 11 hane (şahıs)
export function kimlikTuru(no) {
  var s = String(no || '').replace(/\D/g, '')
  if (s.length === 10) return 'VKN'
  if (s.length === 11) return 'TCKN'
  return null
}

export function tcknGecerli(no) {
  var s = String(no || '')
  if (!/^[1-9]\d{10}$/.test(s)) return false
  var d = s.split('').map(Number)
  var t1 = ((d[0] + d[2] + d[4] + d[6] + d[8]) * 7 - (d[1] + d[3] + d[5] + d[7])) % 10
  if ((t1 + 10) % 10 !== d[9]) return false
  var t2 = d.slice(0, 10).reduce(function (a, b) { return a + b }, 0) % 10
  return t2 === d[10]
}

// "Hüseyin Aydın" → { ad: 'Hüseyin', soyad: 'Aydın' }; son kelime soyad
export function adSoyadAyir(tam) {
  var p = String(tam || '').trim().split(/\s+/).filter(Boolean)
  if (p.length <= 1) return { ad: p[0] || '', soyad: '' }
  return { ad: p.slice(0, -1).join(' '), soyad: p[p.length - 1] }
}

// Uyumsoft durumları → Türkçe
export var MM_DURUM = {
  Draft: 'Taslak', Canceled: 'İptal', Queued: 'Kuyrukta', Processing: 'İşleniyor',
  Signed: 'İmzalandı', PReceiptCanceled: 'Makbuz iptal', Error: 'Hata', Deleted: 'Silindi',
}
export var FATURA_DURUM = {
  NotPrepared: 'Hazırlanmadı', NotSend: 'Gönderilmedi', Draft: 'Taslak', Canceled: 'İptal',
  Queued: 'Kuyrukta', Processing: 'İşleniyor', SentToGib: "GİB'e gönderildi", Approved: 'Onaylandı',
  WaitingForAprovement: 'Onay bekliyor', Declined: 'Reddedildi', Return: 'İade', EArchivedCanceled: 'e-Arşiv iptal',
  Error: 'Hata',
}
export function durumSinifi(durum) {
  if (['Signed', 'Approved', 'SentToGib'].indexOf(durum) !== -1) return 'good'
  if (['Error', 'Declined', 'Canceled', 'PReceiptCanceled', 'EArchivedCanceled', 'Deleted', 'Return'].indexOf(durum) !== -1) return 'bad'
  return 'warn'
}

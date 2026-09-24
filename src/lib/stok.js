// ─────────────────────────────────────────────────────────────
// YAĞ STOĞU
// Kaynaklar:
//   hak-yag   → tamamlanan siparişlerden kesilen hak yağı (fatura yok → resmi değil)
//   alis      → müşteriden yağ alımı (resmi = müstahsil faturası kesilecek)
//   satis     → dışarıya satış (stoktan düşer)
//   stok      → manuel düzeltme: fire, fabrikanın kendi ürettiği yağ, sayım farkı (+/-)
// Her hareketin `resmi` bayrağı resmi/kayıt dışı ayrımını belirler.
// ─────────────────────────────────────────────────────────────

export const HAREKET_TURLERI = {
  alis: { ad: 'Yağ Alış', yon: +1, renk: 'good' },
  satis: { ad: 'Yağ Satış', yon: -1, renk: 'bad' },
  stok: { ad: 'Stok Hareketi', yon: +1, renk: 'warn' }, // litre negatif olabilir
}

// Stok etkisi olmayan eski kayıt türleri (emanet vb.) hesaba katılmaz
const STOK_TURLERI = ['alis', 'satis', 'stok']

export function hareketEtkisi(h) {
  var litre = Number(h.litre) || 0
  if (h.tur === 'satis') return -Math.abs(litre)
  if (h.tur === 'alis') return Math.abs(litre)
  if (h.tur === 'stok') return litre // işaretli: -12 fire, +40 üretim
  return 0
}

export function hesaplaStok(siparisler, hareketler, opts) {
  var o = opts || {}
  var hakYagResmi = o.hakYagResmi === true // varsayılan: hak yağı kayıt dışı

  var hakYag = 0
  ;(siparisler || []).forEach(function (s) {
    if (s.durum === 'tamamlandi') hakYag += Number(s.hakYagKg) || 0
  })

  var k = {
    hakYag: hakYag,
    alisResmi: 0, alisGayri: 0,
    satisResmi: 0, satisGayri: 0,
    stokResmi: 0, stokGayri: 0,
  }

  ;(hareketler || []).forEach(function (h) {
    if (STOK_TURLERI.indexOf(h.tur) === -1) return
    var litre = Number(h.litre) || 0
    var resmi = h.resmi === true
    if (h.tur === 'alis') { if (resmi) k.alisResmi += Math.abs(litre); else k.alisGayri += Math.abs(litre) }
    else if (h.tur === 'satis') { if (resmi) k.satisResmi += Math.abs(litre); else k.satisGayri += Math.abs(litre) }
    else if (h.tur === 'stok') { if (resmi) k.stokResmi += litre; else k.stokGayri += litre }
  })

  var resmi = k.alisResmi - k.satisResmi + k.stokResmi + (hakYagResmi ? hakYag : 0)
  var gayri = k.alisGayri - k.satisGayri + k.stokGayri + (hakYagResmi ? 0 : hakYag)

  return {
    kalemler: k,
    resmi: +resmi.toFixed(2),
    gayri: +gayri.toFixed(2),
    toplam: +(resmi + gayri).toFixed(2),
  }
}

// Stoğu etkileyen hareketler, yeniden eskiye
export function stokHareketleri(hareketler) {
  return (hareketler || [])
    .filter(function (h) { return STOK_TURLERI.indexOf(h.tur) !== -1 })
    .slice()
    .sort(function (a, b) {
      return ((b.tarih || '') + (b.saat || '')).localeCompare((a.tarih || '') + (a.saat || ''))
    })
}

// Verim: kaç kg zeytinden 1 kg yağ çıktı (örn. 5,0)
export function verimOf(zeytinKg, cikanYag) {
  var z = Number(zeytinKg) || 0
  var y = Number(cikanYag) || 0
  if (!z || !y) return null
  return +(z / y).toFixed(2)
}

// Tablet → /api/uyumsoft istemcisi
// Uyumsoft şifresi sunucuda (Vercel ortam değişkeni) tanımlı değilse,
// bu cihazda localStorage'da tutulan bilgi başlıkla gönderilir.
// Şifre asla Firestore'a yazılmaz (veritabanı herkese açık kurallarla çalışıyor).

var ANAHTAR = 'ygt-uyumsoft'

export function cihazKimlik() {
  try {
    var s = localStorage.getItem(ANAHTAR)
    return s ? JSON.parse(s) : { kullanici: '', sifre: '' }
  } catch (e) { return { kullanici: '', sifre: '' } }
}

export function cihazKimlikKaydet(k) {
  try {
    if (!k || (!k.kullanici && !k.sifre)) localStorage.removeItem(ANAHTAR)
    else localStorage.setItem(ANAHTAR, JSON.stringify({ kullanici: k.kullanici || '', sifre: k.sifre || '' }))
  } catch (e) { /* özel sekme vb. */ }
}

export async function uyumsoft(islem, params, settings) {
  var k = cihazKimlik()
  var headers = { 'Content-Type': 'application/json' }
  if (k.kullanici && k.sifre) {
    headers['x-uyumsoft-kullanici'] = encodeURIComponent(k.kullanici)
    headers['x-uyumsoft-sifre'] = encodeURIComponent(k.sifre)
  }
  var body = Object.assign({ islem: islem, ortam: (settings && settings.efOrtam) || 'canli' }, params || {})
  var res
  try {
    res = await fetch('/api/uyumsoft', { method: 'POST', headers: headers, body: JSON.stringify(body) })
  } catch (e) {
    throw new Error('Sunucuya ulaşılamadı — internet bağlantısını kontrol edin')
  }
  var data = null
  try { data = await res.json() } catch (e) { /* HTML hata sayfası vb. */ }
  if (!res.ok || !data || !data.ok) {
    var err = new Error((data && data.hata) || ('Sunucu hatası (' + res.status + ')' + (res.status === 404 ? ' — /api/uyumsoft bulunamadı' : '')))
    err.kod = data && data.kod
    throw err
  }
  return data
}

// Firma (satıcı / makbuzu düzenleyen) bilgisi ayarlardan
export function firmaBilgisi(s) {
  return {
    kimlikNo: s.efVkn || '', unvan: s.efUnvan || '', adSoyad: s.efAdSoyad || '',
    vergiDairesi: s.efVergiDairesi || '', adres: s.efAdres || '', binaNo: s.efBinaNo || '',
    ilce: s.efIlce || '', il: s.efIl || '', tel: s.efTel || '', eposta: s.efEposta || '',
    web: s.efWeb || '', mersis: s.efMersis || '', sicil: s.efSicil || '',
  }
}

export function firmaEksik(s) {
  var e = []
  var vkn = String(s.efVkn || '').replace(/\D/g, '')
  if (vkn.length !== 10 && vkn.length !== 11) e.push('VKN/TCKN')
  if (!s.efUnvan && !s.efAdSoyad) e.push('Ünvan')
  if (!s.efVergiDairesi) e.push('Vergi dairesi')
  if (!s.efIl) e.push('İl')
  if (!s.efIlce) e.push('İlçe')
  return e
}

function b64Blob(b64, type) {
  var bin = atob(b64)
  var arr = new Uint8Array(bin.length)
  for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: type })
}

// PDF'i yeni sekmede aç (Android'de indirir / PDF görüntüleyiciye verir)
export function pdfAc(b64, ad) {
  var url = URL.createObjectURL(b64Blob(b64, 'application/pdf'))
  var w = window.open(url, '_blank')
  if (!w) {
    var a = document.createElement('a')
    a.href = url; a.download = (ad || 'belge') + '.pdf'
    document.body.appendChild(a); a.click(); a.remove()
  }
  setTimeout(function () { URL.revokeObjectURL(url) }, 60000)
}

import { useState, useEffect, useMemo } from 'react'
import { fmt } from '../../lib/fmt'
import {
  mustahsilHesapla, satisHesapla, kesintiOranlari, kimlikTuru, tcknGecerli, tl,
} from '../../lib/efatura'
import { uyumsoft, firmaBilgisi, firmaEksik, pdfAc } from '../../lib/uyumsoft'
import Icon from '../Icon'

// ─────────────────────────────────────────────────────────────
// E-BELGE KES
//   Alış  → e-Müstahsil makbuzu (üreticiye, stopaj kesintili)
//   Satış → e-Fatura (alıcı e-Fatura mükellefiyse) / e-Arşiv (değilse)
// İki yol: TASLAK (Uyumsoft'ta bekler, GİB'e gitmez) veya GİB'E GÖNDER.
// ─────────────────────────────────────────────────────────────

var NIHAI_TUKETICI = '11111111111'

function ilkForm(tur, h, m, s) {
  m = m || {}
  var litre = Math.abs(Number(h.litre) || 0)
  var fiyat = Number(h.kgFiyat) || (litre && h.tutar ? +(Number(h.tutar) / litre).toFixed(4) : 0)
  var ortak = {
    adres: m.adres || m.koy || '', ilce: m.ilce || '', il: m.il || '',
    tel: m.tel || '', eposta: m.eposta || '',
    miktar: litre ? String(litre) : '', birimFiyat: fiyat ? String(fiyat) : '',
    not: h.not || '',
  }
  if (tur === 'alis') {
    return Object.assign(ortak, {
      kimlikNo: m.tc || '', adSoyad: m.ad || '',
      ilce: ortak.ilce || s.efIlce || '', il: ortak.il || s.efIl || '',
    })
  }
  return Object.assign(ortak, {
    kimlikNo: m.vkn || m.tc || '', unvan: m.unvan || m.ad || '', vergiDairesi: m.vergiDairesi || '',
  })
}

export default function EBelgeSheet(props) {
  var s = props.settings
  var h = props.hareket
  var mm = props.tur === 'alis'
  var [f, setF] = useState(function () { return ilkForm(props.tur, h, props.musteri, s) })
  var [muk, setMuk] = useState(null)         // { eFatura, etiketler, unvan } | { hata }
  var [onay, setOnay] = useState(false)      // GİB'e gönder ikinci dokunuş
  var [calisiyor, setCalisiyor] = useState(null)   // 'taslak' | 'gonder'
  var [hata, setHata] = useState('')
  var [sonuc, setSonuc] = useState(null)
  var [gorunum, setGorunum] = useState(null)

  function set(k, v) { setF(function (p) { var n = Object.assign({}, p); n[k] = v; return n }); setOnay(false) }

  var eksikFirma = firmaEksik(s)
  var no = String(f.kimlikNo || '').replace(/\D/g, '')
  var kt = kimlikTuru(no)

  var hesap = useMemo(function () {
    return mm
      ? mustahsilHesapla(f.miktar, f.birimFiyat, kesintiOranlari(s))
      : satisHesapla(f.miktar, f.birimFiyat, s.efKdvOran, s.efKdvDahil !== false)
  }, [mm, f.miktar, f.birimFiyat, s])

  // Alıcı e-Fatura mükellefi mi? (satış)
  useEffect(function () {
    if (mm || !kt || no === NIHAI_TUKETICI) { setMuk(null); return }
    var iptal = false
    setMuk({ sorgu: true })
    var t = setTimeout(function () {
      uyumsoft('mukellef', { vkn: no }, s)
        .then(function (r) { if (!iptal) setMuk(r) })
        .catch(function (e) { if (!iptal) setMuk({ hata: e.message }) })
    }, 500)
    return function () { iptal = true; clearTimeout(t) }
  }, [no, mm, s.efOrtam])

  var sorunlar = []
  if (eksikFirma.length) sorunlar.push('Firma bilgisi eksik: ' + eksikFirma.join(', '))
  if (mm) {
    if (kt !== 'TCKN') sorunlar.push('Müstahsilin 11 haneli TC kimlik numarası gerekli')
    else if (!tcknGecerli(no)) sorunlar.push('TC kimlik numarası geçersiz görünüyor')
    if (!String(f.adSoyad || '').trim().includes(' ')) sorunlar.push('Müstahsil adı ve soyadı gerekli')
  } else {
    if (!kt) sorunlar.push('Alıcı VKN (10 hane) veya TCKN (11 hane) gerekli')
    else if (kt === 'TCKN' && no !== NIHAI_TUKETICI && !tcknGecerli(no)) sorunlar.push('TC kimlik numarası geçersiz görünüyor')
    if (!String(f.unvan || '').trim()) sorunlar.push('Alıcı ünvanı / adı gerekli')
    if (kt === 'VKN' && !f.vergiDairesi) sorunlar.push('Vergi dairesi gerekli (VKN için)')
  }
  if (!(Number(f.miktar) > 0)) sorunlar.push('Miktar girin')
  if (!(Number(f.birimFiyat) > 0)) sorunlar.push('Birim fiyat girin')
  if (!f.il || !f.ilce) sorunlar.push('İl ve ilçe gerekli')

  async function gonder(taslak) {
    if (sorunlar.length) return
    if (!taslak && !onay) { setOnay(true); return }
    setCalisiyor(taslak ? 'taslak' : 'gonder')
    setHata('')
    var taraf = mm
      ? { kimlikNo: no, adSoyad: f.adSoyad.trim(), adres: f.adres, ilce: f.ilce, il: f.il, tel: f.tel }
      : { kimlikNo: no, unvan: f.unvan.trim(), adSoyad: kt === 'TCKN' ? f.unvan.trim() : '', vergiDairesi: f.vergiDairesi, adres: f.adres, ilce: f.ilce, il: f.il, tel: f.tel, eposta: f.eposta }
    var ortak = {
      firma: firmaBilgisi(s), urunAd: s.efUrunAd || 'Zeytinyağı',
      miktar: Number(f.miktar), birim: s.yag || 'kg', birimFiyat: Number(f.birimFiyat),
      notlar: [f.not, h.kod ? 'Kayıt: ' + h.kod : ''].filter(Boolean),
    }
    var belge = mm
      ? Object.assign(ortak, { mustahsil: taraf, kesintiOranlari: kesintiOranlari(s), seri: s.mmSeri || '', teslimTarihi: h.tarih })
      : Object.assign(ortak, { alici: taraf, kdvOran: Number(s.efKdvOran) || 0, kdvDahil: s.efKdvDahil !== false, profil: s.efProfil, seri: s.efSeri || '' })
    var r = null
    try {
      r = await uyumsoft(mm ? 'mmGonder' : 'faturaGonder', { belge: belge, taslak: taslak, yerelId: h.kod || h.id }, s)
    } catch (e) {
      setHata(e.message)
    }
    if (r) {
      setSonuc(r)
      // Müşteri kartındaki fatura bilgilerini güncelle
      var mb = mm
        ? { tc: no, adres: f.adres, ilce: f.ilce, il: f.il }
        : Object.assign({ adres: f.adres, ilce: f.ilce, il: f.il, eposta: f.eposta, vergiDairesi: f.vergiDairesi, unvan: f.unvan.trim() }, kt === 'VKN' ? { vkn: no } : (no !== NIHAI_TUKETICI ? { tc: no } : {}))
      try {
        await props.onKaydet(r, { musteriBilgi: mb, taraf: taraf })
      } catch (e) {
        setHata('Belge Uyumsoft\'ta oluştu ama uygulamaya kaydedilemedi: ' + e.message + ' — belge no/ETTN\'i not alın.')
      }
    }
    setCalisiyor(null)
    setOnay(false)
  }

  async function gor() {
    setGorunum({ yukleniyor: true })
    try {
      var r = await uyumsoft(mm ? 'mmHtml' : 'faturaHtml', { id: sonuc.belgeId, kutu: 'giden' }, s)
      setGorunum({ html: r.html })
    } catch (e) { setGorunum({ hata: e.message }) }
  }
  async function pdf() {
    try {
      var r = await uyumsoft(mm ? 'mmPdf' : 'faturaPdf', { id: sonuc.belgeId, kutu: 'giden' }, s)
      pdfAc(r.pdf, sonuc.belgeNo || sonuc.belgeId)
    } catch (e) { setHata(e.message) }
  }

  var baslik = mm ? 'Müstahsil Makbuzu' : 'Satış Faturası'
  var birim = s.yag || 'kg'
  function inp(k, label, extra) {
    return (
      <div className={'fab-row' + (extra && extra.wide ? ' wide' : '')}>
        <label className="fab-label">{label}</label>
        <input className="fab-input" value={f[k] || ''} onChange={function (e) { set(k, e.target.value) }} {...(extra && extra.attrs)} />
      </div>
    )
  }

  // ── Sonuç ──
  if (sonuc) {
    return (
      <div className="fab-sheet">
        <div className="fab-sheet-head">
          <button className="fab-icon-btn" onClick={props.onClose}><Icon name="x" size={26} /></button>
          <h2>{baslik}</h2>
        </div>
        <div className="fab-sheet-body form">
          <div className={'eb-sonuc ' + (sonuc.taslak ? 'taslak' : 'ok')}>
            <Icon name={sonuc.taslak ? 'folder' : 'check'} size={44} />
            <div>
              <b>{sonuc.taslak ? 'Taslak oluşturuldu' : "GİB'e gönderildi"}</b>
              <span>
                {sonuc.belgeNo ? 'Belge no: ' + sonuc.belgeNo : 'Belge numarası Uyumsoft tarafından verilecek'}
                {!mm && sonuc.senaryo ? ' · ' + (sonuc.senaryo === 'eInvoice' ? 'e-Fatura (' + sonuc.profil + ')' : 'e-Arşiv') : ''}
              </span>
              <span className="eb-ettn">ETTN {sonuc.uuid}</span>
            </div>
          </div>
          {sonuc.taslak && (
            <p className="fab-hint">
              Taslak Uyumsoft portalında bekliyor, GİB'e gitmedi. Kontrol ettikten sonra
              {mm ? ' Alınan Yağlar → Makbuzlar' : ' Satılan Yağlar → Giden Faturalar'} ekranından veya kartındaki düğmeyle gönderebilirsin.
            </p>
          )}
          <div className="eb-toplam">
            {mm ? (
              <>
                <div><span>Brüt</span><b>{tl(sonuc.hesap.brut)}</b></div>
                <div><span>Kesinti</span><b>−{tl(sonuc.hesap.toplamKesinti)}</b></div>
                <div className="ana"><span>Müstahsile ödenecek</span><b>{tl(sonuc.hesap.net)}</b></div>
              </>
            ) : (
              <>
                <div><span>Matrah</span><b>{tl(sonuc.hesap.matrah)}</b></div>
                <div><span>KDV %{sonuc.hesap.kdvOran}</span><b>{tl(sonuc.hesap.kdv)}</b></div>
                <div className="ana"><span>Genel toplam</span><b>{tl(sonuc.hesap.toplam)}</b></div>
              </>
            )}
          </div>
          {hata && <p className="fab-hint bad">{hata}</p>}
          <div className="fab-actions">
            <button className="fab-btn primary" onClick={gor}><Icon name="eye" size={22} /> Görüntüle</button>
            <button className="fab-btn" onClick={pdf}><Icon name="download" size={22} /> PDF</button>
            <button className="fab-btn" onClick={props.onClose}><Icon name="check" size={22} /> Bitti</button>
          </div>
          {gorunum && <BelgeCerceve gorunum={gorunum} />}
        </div>
      </div>
    )
  }

  // ── Form ──
  return (
    <div className="fab-sheet">
      <div className="fab-sheet-head">
        <button className="fab-icon-btn" onClick={props.onClose}><Icon name="x" size={26} /></button>
        <h2>{baslik}</h2>
        <span className="fab-sheet-sub">
          {h.kod} · {fmt.num(Math.abs(Number(h.litre) || 0), 1)} {birim}
          {s.efOrtam === 'test' ? ' · TEST ORTAMI' : ''}
        </span>
      </div>
      <div className="fab-sheet-body eb-form">
        <div className="eb-sol">
          {eksikFirma.length > 0 && (
            <div className="fab-hint bad eb-uyari">
              Firma e-belge bilgileri eksik ({eksikFirma.join(', ')}).
              <button className="fab-btn sm-text" onClick={props.onAyarlar}>Ayarlara git</button>
            </div>
          )}

          <h3 className="eb-baslik">{mm ? 'Müstahsil (üretici)' : 'Alıcı'}</h3>
          <div className="fab-grid">
            {mm
              ? inp('kimlikNo', 'TC kimlik no', { attrs: { inputMode: 'numeric', maxLength: 11, placeholder: '11 hane' } })
              : (
                <div className="fab-row">
                  <label className="fab-label">VKN / TCKN</label>
                  <div className="eb-satir">
                    <input className="fab-input" inputMode="numeric" maxLength={11} value={f.kimlikNo} placeholder="10 veya 11 hane"
                      onChange={function (e) { set('kimlikNo', e.target.value) }} />
                    <button className="fab-btn" onClick={function () { set('kimlikNo', NIHAI_TUKETICI) }} title="Nihai tüketici">11111…</button>
                  </div>
                </div>
              )}
            {mm
              ? inp('adSoyad', 'Ad soyad', { attrs: { placeholder: 'Ad Soyad' } })
              : inp('unvan', kt === 'VKN' ? 'Ünvan' : 'Ad soyad / ünvan')}
            {!mm && inp('vergiDairesi', 'Vergi dairesi', { attrs: { placeholder: kt === 'VKN' ? 'Zorunlu' : 'İsteğe bağlı' } })}
            {inp('adres', 'Adres', { attrs: { placeholder: 'Mahalle / köy, sokak, no' } })}
            {inp('ilce', 'İlçe')}
            {inp('il', 'İl')}
            {inp('tel', 'Telefon', { attrs: { type: 'tel', inputMode: 'tel' } })}
            {!mm && inp('eposta', 'E-posta', { attrs: { type: 'email', placeholder: 'e-Arşiv faturası gönderilir' } })}
          </div>

          {!mm && muk && (
            <div className={'eb-mukellef ' + (muk.hata ? 'bad' : muk.sorgu ? '' : muk.eFatura ? 'efatura' : 'earsiv')}>
              {muk.sorgu && 'Mükellef sorgulanıyor…'}
              {muk.hata && 'Sorgu yapılamadı: ' + muk.hata}
              {!muk.sorgu && !muk.hata && (muk.eFatura
                ? <>e-Fatura mükellefi{muk.unvan ? ' · ' + muk.unvan : ''} → <b>e-Fatura ({s.efProfil || 'TEMELFATURA'})</b> kesilecek</>
                : <>e-Fatura mükellefi değil → <b>e-Arşiv faturası</b> kesilecek</>)}
            </div>
          )}
          {!mm && no === NIHAI_TUKETICI && <div className="eb-mukellef earsiv">Nihai tüketici → <b>e-Arşiv faturası</b> kesilecek</div>}

          <h3 className="eb-baslik">Kalem</h3>
          <div className="fab-grid">
            <div className="fab-row">
              <label className="fab-label">Miktar ({birim})</label>
              <input className="fab-input" type="number" inputMode="decimal" value={f.miktar} onChange={function (e) { set('miktar', e.target.value) }} />
            </div>
            <div className="fab-row">
              <label className="fab-label">Birim fiyat (₺){!mm ? (s.efKdvDahil !== false ? ' · KDV dahil' : ' · KDV hariç') : ' · brüt'}</label>
              <input className="fab-input" type="number" inputMode="decimal" value={f.birimFiyat} onChange={function (e) { set('birimFiyat', e.target.value) }} />
            </div>
            {inp('not', 'Belge notu', { wide: true, attrs: { placeholder: 'İsteğe bağlı' } })}
          </div>
        </div>

        <div className="eb-sag">
          <div className="eb-toplam">
            <div><span>Ürün</span><b>{s.efUrunAd || 'Zeytinyağı'}</b></div>
            {mm ? (
              <>
                <div><span>Brüt tutar</span><b>{tl(hesap.brut)}</b></div>
                {hesap.kesintiler.map(function (k) {
                  return <div key={k.id}><span>{k.ad} %{k.oran}</span><b>−{tl(k.tutar)}</b></div>
                })}
                {hesap.kesintiler.length === 0 && <div><span>Kesinti</span><b>yok</b></div>}
                <div className="ana"><span>Müstahsile ödenecek</span><b>{tl(hesap.net)}</b></div>
              </>
            ) : (
              <>
                <div><span>Matrah</span><b>{tl(hesap.matrah)}</b></div>
                <div><span>KDV %{hesap.kdvOran}</span><b>{tl(hesap.kdv)}</b></div>
                <div className="ana"><span>Genel toplam</span><b>{tl(hesap.toplam)}</b></div>
              </>
            )}
          </div>

          {sorunlar.length > 0 && (
            <ul className="eb-sorunlar">
              {sorunlar.map(function (x) { return <li key={x}>{x}</li> })}
            </ul>
          )}
          {hata && <p className="fab-hint bad">{hata}</p>}

          <button className="fab-btn wide" disabled={!!sorunlar.length || !!calisiyor} onClick={function () { gonder(true) }}>
            <Icon name="folder" size={22} /> {calisiyor === 'taslak' ? 'Oluşturuluyor…' : 'Taslak oluştur'}
          </button>
          <button className={'fab-save' + (onay ? ' onay' : '')} disabled={!!sorunlar.length || !!calisiyor} onClick={function () { gonder(false) }}>
            <Icon name={onay ? 'check' : 'arrow'} size={28} />
            <span>{calisiyor === 'gonder' ? 'GÖNDERİLİYOR…' : onay ? 'EMİN MİSİN? GÖNDER' : "GİB'E GÖNDER"}</span>
          </button>
          <p className="eb-not">
            {onay
              ? 'Resmi belge oluşur ve GİB\'e iletilir. Tekrar dokunarak onayla.'
              : 'Taslak: Uyumsoft\'ta bekler, GİB\'e gitmez — deneme için güvenli.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export function BelgeCerceve(props) {
  var g = props.gorunum
  if (g.yukleniyor) return <div className="fab-empty">Belge yükleniyor…</div>
  if (g.hata) return <p className="fab-hint bad">{g.hata}</p>
  return <iframe className="eb-cerceve" title="Belge" srcDoc={g.html} sandbox="allow-same-origin allow-modals allow-popups" />
}

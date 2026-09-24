import { useState, useEffect, useCallback } from 'react'
import { fmt } from '../../lib/fmt'
import { MM_DURUM, FATURA_DURUM, durumSinifi, tl } from '../../lib/efatura'
import { uyumsoft, pdfAc } from '../../lib/uyumsoft'
import { BelgeCerceve } from './EBelgeSheet'
import Icon from '../Icon'

// ─────────────────────────────────────────────────────────────
// UYUMSOFT BELGE LİSTELERİ — doğrudan Uyumsoft'tan okunur
//   tip = 'mm'    → kesilen müstahsil makbuzları
//   tip = 'giden' → kesilen satış faturaları (e-Fatura + e-Arşiv)
//   tip = 'gelen' → firmaya gelen e-Faturalar (alış faturaları)
// ─────────────────────────────────────────────────────────────

var ARALIK = [
  { g: 7, ad: '7 gün' }, { g: 30, ad: '30 gün' }, { g: 90, ad: '3 ay' }, { g: 365, ad: '1 yıl' },
]
function gunOnce(n) { var d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString('sv') }
function bugun() { return new Date().toLocaleDateString('sv') }

var BASLIK = {
  mm: { ad: 'Müstahsil makbuzları', bos: 'Bu aralıkta kesilmiş makbuz yok' },
  giden: { ad: 'Giden faturalar', bos: 'Bu aralıkta kesilmiş fatura yok' },
  gelen: { ad: 'Gelen faturalar', bos: 'Bu aralıkta gelen fatura yok' },
}

export default function EBelgeListesi(props) {
  var tip = props.tip
  var mm = tip === 'mm'
  var s = props.settings
  var [gun, setGun] = useState(30)
  var [sayfa, setSayfa] = useState(0)
  var [veri, setVeri] = useState(null)
  var [yukleniyor, setYukleniyor] = useState(false)
  var [hata, setHata] = useState('')
  var [secili, setSecili] = useState(null)
  var [q, setQ] = useState('')

  var yukle = useCallback(function () {
    setYukleniyor(true); setHata('')
    var p = { bas: gunOnce(gun), bit: bugun(), sayfa: sayfa, boyut: 50 }
    var islem = mm ? 'mmListe' : 'faturaListe'
    if (!mm) p.kutu = tip
    uyumsoft(islem, p, s)
      .then(function (r) { setVeri(r) })
      .catch(function (e) { setHata(e.message); setVeri(null) })
      .then(function () { setYukleniyor(false) })
  }, [tip, gun, sayfa, s.efOrtam])

  useEffect(function () { yukle() }, [yukle])

  var items = (veri && veri.items) || []
  var nq = q.trim().toLocaleLowerCase('tr-TR')
  if (nq) items = items.filter(function (x) {
    return (x.unvan || '').toLocaleLowerCase('tr-TR').indexOf(nq) !== -1 || (x.no || '').toLowerCase().indexOf(nq) !== -1 || (x.vkn || x.tckn || '').indexOf(nq) !== -1
  })
  var toplam = items.reduce(function (t, x) { return t + (x.tutar || 0) }, 0)
  var ek = items.reduce(function (t, x) { return t + (mm ? (x.kesinti || 0) : (x.kdv || 0)) }, 0)
  var durumAd = mm ? MM_DURUM : FATURA_DURUM

  return (
    <div className="liste-sayfa">
      <div className="liste-ust">
        <div className="liste-ozet">
          <div className="lo-kutu ana">
            <span>{BASLIK[tip].ad}</span>
            <b>{veri ? items.length : '—'}{veri && veri.toplam > items.length && !nq ? <i>/ {veri.toplam}</i> : null}</b>
          </div>
          <div className="lo-kutu">
            <span>{mm ? 'Ödenecek toplam' : 'Toplam'}</span>
            <b>{tl(+toplam.toFixed(2))}</b>
          </div>
          <div className="lo-kutu">
            <span>{mm ? 'Kesinti (stopaj)' : 'KDV'}</span>
            <b>{tl(+ek.toFixed(2))}</b>
          </div>
        </div>
        <button className="fab-btn" onClick={yukle} disabled={yukleniyor}>
          <Icon name="clock" size={20} /> {yukleniyor ? 'Yükleniyor…' : 'Yenile'}
        </button>
      </div>

      <div className="liste-filtre">
        <div className="fab-chips">
          {ARALIK.map(function (a) {
            return <button key={a.g} className={'fab-chip' + (gun === a.g ? ' on' : '')} onClick={function () { setGun(a.g); setSayfa(0) }}>{a.ad}</button>
          })}
        </div>
        <div className="fab-search sm">
          <Icon name="search" size={18} />
          <input value={q} onChange={function (e) { setQ(e.target.value) }} placeholder="Ünvan, no, VKN…" />
        </div>
        {s.efOrtam === 'test' && <span className="hk-rozet gayri">TEST ORTAMI</span>}
      </div>

      {hata && (
        <div className="fab-hint bad">
          {hata}
          {props.onAyarlar && /kimlik|şifre|kullanıcı/i.test(hata) && <button className="fab-btn sm-text" onClick={props.onAyarlar}>Ayarlar</button>}
        </div>
      )}

      <div className="eb-tablo">
        {!hata && veri && items.length === 0 && <div className="fab-empty">{BASLIK[tip].bos}</div>}
        {!veri && yukleniyor && <div className="fab-empty">Uyumsoft'tan okunuyor…</div>}
        {items.map(function (x) {
          return (
            <button key={x.id} className="eb-satir-kart" onClick={function () { setSecili(x) }}>
              <div className="eb-sk-ana">
                <b>{x.unvan || '—'}</b>
                <span>{x.no || 'Numara yok'} · {fmt.date(x.tarih)}{x.vkn || x.tckn ? ' · ' + (x.vkn || x.tckn) : ''}{x.senaryo ? ' · ' + (x.senaryo === 'eArchive' ? 'e-Arşiv' : 'e-Fatura') : ''}</span>
              </div>
              {tip === 'gelen' && x.yeni && <span className="hk-rozet resmi">YENİ</span>}
              <span className={'eb-durum ' + durumSinifi(x.durum)}>{durumAd[x.durum] || x.durum || '—'}</span>
              <b className="eb-sk-tutar">{tl(x.tutar)}</b>
            </button>
          )
        })}
      </div>

      {veri && veri.sayfaSayisi > 1 && (
        <div className="eb-sayfa">
          <button className="fab-btn" disabled={sayfa === 0} onClick={function () { setSayfa(sayfa - 1) }}><Icon name="back" size={20} /></button>
          <span>{sayfa + 1} / {veri.sayfaSayisi}</span>
          <button className="fab-btn" disabled={sayfa + 1 >= veri.sayfaSayisi} onClick={function () { setSayfa(sayfa + 1) }}><Icon name="arrow" size={20} /></button>
        </div>
      )}

      {secili && (
        <BelgeDetaySheet
          tip={tip}
          belge={secili}
          settings={s}
          onClose={function () { setSecili(null) }}
          onDegisti={function () { setSecili(null); yukle(); if (props.onDegisti) props.onDegisti() }}
        />
      )}
    </div>
  )
}

// Tek belge: görüntüle / PDF / taslak işlemleri
export function BelgeDetaySheet(props) {
  var tip = props.tip
  var mm = tip === 'mm'
  var x = props.belge
  var s = props.settings
  var [gorunum, setGorunum] = useState(null)
  var [hata, setHata] = useState('')
  var [calisiyor, setCalisiyor] = useState('')
  var [onay, setOnay] = useState('')
  var taslak = x.durum === 'Draft'
  var durumAd = mm ? MM_DURUM : FATURA_DURUM

  useEffect(function () {
    var iptal = false
    setGorunum({ yukleniyor: true })
    uyumsoft(mm ? 'mmHtml' : 'faturaHtml', { id: x.id, kutu: tip }, s)
      .then(function (r) { if (!iptal) setGorunum({ html: r.html }) })
      .catch(function (e) { if (!iptal) setGorunum({ hata: e.message }) })
    return function () { iptal = true }
  }, [x.id])

  async function pdf() {
    setCalisiyor('pdf'); setHata('')
    try {
      var r = await uyumsoft(mm ? 'mmPdf' : 'faturaPdf', { id: x.id, kutu: tip }, s)
      pdfAc(r.pdf, x.no || x.id)
    } catch (e) { setHata(e.message) }
    setCalisiyor('')
  }

  async function taslakIslem(tur) {
    if (onay !== tur) { setOnay(tur); return }
    setCalisiyor(tur); setHata('')
    try {
      var islem = (mm ? 'mm' : 'fatura') + (tur === 'gonder' ? 'TaslakGonder' : 'TaslakIptal')
      await uyumsoft(islem, { ids: [x.id] }, s)
      if (props.onTaslak) await props.onTaslak(x, tur)
      props.onDegisti()
    } catch (e) { setHata(e.message) }
    setCalisiyor(''); setOnay('')
  }

  return (
    <div className="fab-sheet-stack">
      <div className="fab-sheet">
        <div className="fab-sheet-head">
          <button className="fab-icon-btn" onClick={props.onClose}><Icon name="x" size={26} /></button>
          <h2>{x.no || (mm ? 'Makbuz' : 'Fatura')}</h2>
          <span className="fab-sheet-sub">{x.unvan} · {tl(x.tutar)} · {durumAd[x.durum] || x.durum}</span>
        </div>
        <div className="fab-sheet-body eb-detay">
          <div className="eb-detay-bar">
            <button className="fab-btn" disabled={!!calisiyor} onClick={pdf}><Icon name="download" size={22} /> {calisiyor === 'pdf' ? 'Hazırlanıyor…' : 'PDF indir'}</button>
            {taslak && tip !== 'gelen' && (
              <>
                <button className="fab-btn primary" disabled={!!calisiyor} onClick={function () { taslakIslem('gonder') }}>
                  <Icon name="arrow" size={22} /> {calisiyor === 'gonder' ? 'Gönderiliyor…' : onay === 'gonder' ? "Emin misin? GİB'e gönder" : "Taslağı GİB'e gönder"}
                </button>
                <button className="fab-btn danger" disabled={!!calisiyor} onClick={function () { taslakIslem('sil') }}>
                  <Icon name="trash" size={22} /> {onay === 'sil' ? 'Emin misin? Taslağı sil' : 'Taslağı sil'}
                </button>
              </>
            )}
            {x.mesaj ? <span className="eb-mesaj">{x.mesaj}</span> : null}
          </div>
          {hata && <p className="fab-hint bad">{hata}</p>}
          {gorunum && <BelgeCerceve gorunum={gorunum} />}
        </div>
      </div>
    </div>
  )
}

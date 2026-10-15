import { useMemo, useState } from 'react'
import { fmt, initialsOf } from '../../lib/fmt'
import { kimlikTuru, tcknGecerli } from '../../lib/efatura'
import Icon from '../Icon'

// ─────────────────────────────────────────────────────────────
// CARİLER — müşteri / firma / müstahsil kayıtları
//   Fatura Kesilenler     : yağ satışı yapılan cariler
//   Müstahsil Kesilenler  : yağ alınan (e-Müstahsil) cariler
//   Tüm Cariler           : hareketi olmayanlar dahil hepsi
// Her cari: Firma (VKN) mı Şahıs (TCKN) mı rozetle görünür; ekle / düzenle / sil.
// ─────────────────────────────────────────────────────────────

var BOS = {
  ad: '', unvan: '', vkn: '', tc: '', vergiDairesi: '', tel: '', eposta: '',
  adres: '', ilce: '', il: '', koy: '', notlar: '',
}
var ALT = [
  { id: 'fatura', ad: 'Fatura Kesilenler', icon: 'coin' },
  { id: 'mm', ad: 'Müstahsil Kesilenler', icon: 'download' },
  { id: 'tumu', ad: 'Tüm Cariler', icon: 'users' },
]

export function cariTur(m) {
  if (m.vkn && kimlikTuru(m.vkn) === 'VKN') return 'firma'
  if (m.unvan && !m.tc) return 'firma'
  return 'sahis'
}

function formOf(m) {
  var f = {}
  Object.keys(BOS).forEach(function (k) { f[k] = (m && m[k]) || '' })
  return f
}

export default function CarilerSekmesi(props) {
  var birim = props.settings.yag || 'lt'
  var [alt, setAlt] = useState('tumu')
  var [q, setQ] = useState('')
  var [duzen, setDuzen] = useState(null)       // { id|null, form }
  var [silOnay, setSilOnay] = useState(false)

  var ozet = useMemo(function () {
    var by = {}
    function al(id) { return by[id] || (by[id] = { fatura: 0, mm: 0, tutar: 0, miktar: 0, kart: 0 }) }
    ;(props.hareketler || []).forEach(function (h) {
      if (!h.musteriId) return
      var r = al(h.musteriId)
      if (h.tur === 'satis') r.fatura += 1
      if (h.tur === 'alis') r.mm += 1
      r.tutar += Number(h.tutar) || 0
      r.miktar += Math.abs(Number(h.litre) || 0)
    })
    ;(props.siparisler || []).forEach(function (s) { if (s.musteriId) al(s.musteriId).kart += 1 })
    return by
  }, [props.hareketler, props.siparisler])

  var nq = q.trim().toLocaleLowerCase('tr-TR')
  var liste = (props.musteriler || []).filter(function (m) {
    var o = ozet[m.id] || { fatura: 0, mm: 0 }
    if (alt === 'fatura' && !o.fatura) return false
    if (alt === 'mm' && !o.mm) return false
    if (!nq) return true
    return [m.ad, m.unvan, m.vkn, m.tc, m.tel, m.koy, m.kod].some(function (v) { return String(v || '').toLocaleLowerCase('tr-TR').indexOf(nq) !== -1 })
  }).sort(function (a, b) { return String(a.ad || '').localeCompare(String(b.ad || ''), 'tr') })

  function ac(m) { setSilOnay(false); setDuzen({ id: m ? m.id : null, form: formOf(m) }) }
  function set(k, v) { setDuzen(function (d) { var f = Object.assign({}, d.form); f[k] = v; return Object.assign({}, d, { form: f }) }) }

  var f = duzen ? duzen.form : null
  var sorunlar = []
  if (f) {
    if (!String(f.ad || f.unvan).trim()) sorunlar.push('Ad veya ünvan gerekli')
    if (f.vkn && kimlikTuru(f.vkn) !== 'VKN') sorunlar.push('VKN 10 haneli olmalı')
    if (f.tc && !tcknGecerli(f.tc)) sorunlar.push('TC kimlik numarası geçersiz görünüyor')
  }

  async function kaydet() {
    if (sorunlar.length) return
    var veri = Object.assign({}, f)
    veri.ad = String(veri.ad || veri.unvan).trim()
    if (duzen.id) await props.onSave(duzen.id, veri)
    else await props.onAdd(veri)
    setDuzen(null)
  }
  async function sil() {
    if (!silOnay) { setSilOnay(true); return }
    var m = props.musteriler.find(function (x) { return x.id === duzen.id })
    if (m) await props.onDelete(m)
    setSilOnay(false); setDuzen(null)
  }

  function inp(k, label, attrs, wide) {
    return (
      <div className={'fab-row' + (wide ? ' wide' : '')}>
        <label className="fab-label">{label}</label>
        <input className="fab-input" value={f[k]} onChange={function (e) { set(k, e.target.value) }} {...attrs} />
      </div>
    )
  }

  return (
    <div className="liste-sayfa">
      <div className="alt-sekmeler">
        {ALT.map(function (a) {
          return (
            <button key={a.id} className={'alt-sekme' + (alt === a.id ? ' on' : '')} onClick={function () { setAlt(a.id) }}>
              <Icon name={a.icon} size={18} /><span>{a.ad}</span>
            </button>
          )
        })}
      </div>

      <div className="liste-filtre">
        <div className="fab-search sm">
          <Icon name="search" size={18} />
          <input value={q} onChange={function (e) { setQ(e.target.value) }} placeholder="Ad, ünvan, VKN, TC, telefon…" />
        </div>
        <button className="fab-btn primary" onClick={function () { ac(null) }}><Icon name="plus" size={20} /> Yeni cari</button>
      </div>

      <div className="eb-tablo">
        {liste.length === 0 && <div className="fab-empty">{alt === 'tumu' ? 'Cari yok' : 'Bu grupta cari yok'}</div>}
        {liste.map(function (m) {
          var o = ozet[m.id] || { fatura: 0, mm: 0, tutar: 0, miktar: 0, kart: 0 }
          var tur = cariTur(m)
          var kimlik = m.vkn ? 'VKN ' + m.vkn : (m.tc ? 'TC ' + m.tc : '')
          return (
            <button key={m.id} className="eb-satir-kart cari-satir" onClick={function () { ac(m) }}>
              <div className="fc-av">{initialsOf(m.unvan || m.ad)}</div>
              <div className="eb-sk-ana">
                <b>{m.unvan || m.ad}</b>
                <span>
                  {[kimlik, m.vergiDairesi, m.tel, [m.ilce, m.il].filter(Boolean).join('/') || m.koy].filter(Boolean).join(' · ') || 'Bilgi girilmemiş'}
                </span>
              </div>
              <span className={'eb-durum ' + (tur === 'firma' ? 'warn' : 'good')}>{tur === 'firma' ? 'FİRMA' : 'ŞAHIS'}</span>
              <div className="eb-kisi-sayi">
                <b>{o.fatura} satış · {o.mm} alış</b>
                <span>{o.kart} zeytin kartı · {fmt.num(o.miktar, 1)} {birim}</span>
              </div>
              <Icon name="edit" size={20} />
            </button>
          )
        })}
      </div>

      {duzen && (
        <div className="fab-sheet">
          <div className="fab-sheet-head">
            <button className="fab-icon-btn" onClick={function () { setDuzen(null) }}><Icon name="x" size={26} /></button>
            <h2>{duzen.id ? 'Cari düzenle' : 'Yeni cari'}</h2>
          </div>
          <div className="fab-sheet-body">
            <div className="fab-grid">
              {inp('unvan', 'Ünvan (firma / faturada yazan)', { placeholder: 'Firma ise ünvanı' })}
              {inp('ad', 'Ad soyad / kısa ad', { placeholder: 'Listede görünen ad' })}
              {inp('vkn', 'VKN (firma)', { inputMode: 'numeric', maxLength: 10, placeholder: '10 hane' })}
              {inp('vergiDairesi', 'Vergi dairesi')}
              {inp('tc', 'TC kimlik no (şahıs / müstahsil)', { inputMode: 'numeric', maxLength: 11, placeholder: '11 hane' })}
              {inp('tel', 'Telefon', { type: 'tel', inputMode: 'tel', placeholder: '05XX XXX XX XX' })}
              {inp('eposta', 'E-posta', { type: 'email' })}
              {inp('koy', 'Köy / Mahalle')}
              {inp('adres', 'Adres', {}, true)}
              {inp('ilce', 'İlçe')}
              {inp('il', 'İl')}
              {inp('notlar', 'Not', {}, true)}
            </div>
            {sorunlar.length > 0 && <ul className="eb-sorunlar">{sorunlar.map(function (x) { return <li key={x}>{x}</li> })}</ul>}
            {duzen.id && silOnay && (
              <p className="fab-hint bad">
                Bu cari silinecek. Bağlı zeytin kartları ve yağ işlemleri silinmez, "Silinmiş müşteri" olarak görünür. Onaylamak için tekrar dokun.
              </p>
            )}
            <div className="fab-actions">
              <button className="fab-btn primary" disabled={!!sorunlar.length || props.busy} onClick={kaydet}><Icon name="check" size={22} /> Kaydet</button>
              <button className="fab-btn" onClick={function () { setDuzen(null) }}>Vazgeç</button>
              {duzen.id && (
                <button className={'fab-btn danger' + (silOnay ? ' onay' : '')} disabled={props.busy} onClick={sil}>
                  <Icon name="trash" size={20} /> {silOnay ? 'EMİN MİSİN? SİL' : 'Sil'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

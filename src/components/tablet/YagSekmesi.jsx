import { useState, useMemo } from 'react'
import { fmt, initialsOf } from '../../lib/fmt'
import { tcknGecerli } from '../../lib/efatura'
import HareketListesi from './HareketListesi'
import EBelgeListesi from './EBelgeListesi'
import Icon from '../Icon'

// ─────────────────────────────────────────────────────────────
// ALINAN / SATILAN YAĞLAR — alt sekmeler
//   Alış : Alışlar · Makbuzlar (e-MM) · Gelen Faturalar · Müstahsiller
//   Satış: Satışlar · Giden Faturalar · Alıcılar
// ─────────────────────────────────────────────────────────────

var ALT = {
  alis: [
    { id: 'liste', ad: 'Alışlar', icon: 'download' },
    { id: 'mm', ad: 'Müstahsil Makbuzları', icon: 'archive' },
    { id: 'gelen', ad: 'Gelen Faturalar', icon: 'folder' },
    { id: 'kisi', ad: 'Müstahsiller', icon: 'users' },
  ],
  satis: [
    { id: 'liste', ad: 'Satışlar', icon: 'coin' },
    { id: 'giden', ad: 'Giden Faturalar', icon: 'archive' },
    { id: 'kisi', ad: 'Alıcılar', icon: 'users' },
  ],
}

export default function YagSekmesi(props) {
  var tur = props.tur
  var [alt, setAlt] = useState({ alis: 'liste', satis: 'liste' })
  var aktif = alt[tur]
  function sec(id) { setAlt(function (a) { var n = Object.assign({}, a); n[tur] = id; return n }) }

  // Kesilmemiş resmi kayıt sayısı (rozet)
  var bekleyen = (props.hareketler || []).filter(function (h) { return h.tur === tur && h.resmi === true && !h.belge }).length

  return (
    <div className="yag-sekme">
      <div className="alt-sekmeler">
        {ALT[tur].map(function (a) {
          return (
            <button key={a.id} className={'alt-sekme' + (aktif === a.id ? ' on' : '')} onClick={function () { sec(a.id) }}>
              <Icon name={a.icon} size={18} />
              <span>{a.ad}</span>
              {a.id === 'liste' && bekleyen > 0 && <em title="Belgesi kesilmemiş resmi kayıt">{bekleyen}</em>}
            </button>
          )
        })}
      </div>

      {aktif === 'liste' && (
        <HareketListesi
          tur={tur}
          hareketler={props.hareketler}
          musteriMap={props.musteriMap}
          settings={props.settings}
          onYeni={props.onYeni}
          onSil={props.onSil}
          onBelgeKes={props.onBelgeKes}
          onBelgeAc={props.onBelgeAc}
        />
      )}
      {(aktif === 'mm' || aktif === 'gelen' || aktif === 'giden') && (
        <EBelgeListesi
          key={aktif}
          tip={aktif}
          settings={props.settings}
          onAyarlar={props.onAyarlar}
          onTaslak={props.onTaslakListeden}
        />
      )}
      {aktif === 'kisi' && (
        <KisiListesi
          tur={tur}
          hareketler={props.hareketler}
          musteriler={props.musteriler}
          settings={props.settings}
          busy={props.busy}
          onSaveMusteri={props.onSaveMusteri}
        />
      )}
    </div>
  )
}

// ── Müstahsiller / Alıcılar: yağ alınan-satılan kişiler ve belge bilgileri ──
function KisiListesi(props) {
  var alis = props.tur === 'alis'
  var birim = props.settings.yag || 'kg'
  var [q, setQ] = useState('')
  var [acik, setAcik] = useState(null)
  var [form, setForm] = useState(null)

  var satirlar = useMemo(function () {
    var by = {}
    ;(props.hareketler || []).forEach(function (h) {
      if (h.tur !== props.tur || !h.musteriId) return
      var r = by[h.musteriId] || (by[h.musteriId] = { id: h.musteriId, miktar: 0, tutar: 0, adet: 0, resmi: 0, belgeli: 0, son: '' })
      r.miktar += Math.abs(Number(h.litre) || 0)
      r.tutar += Number(h.tutar) || 0
      r.adet += 1
      if (h.resmi) r.resmi += 1
      if (h.belge && h.belge.durum !== 'Draft') r.belgeli += 1
      if ((h.tarih || '') > r.son) r.son = h.tarih || ''
    })
    var mMap = {}
    ;(props.musteriler || []).forEach(function (m) { mMap[m.id] = m })
    return Object.keys(by).map(function (id) { return Object.assign(by[id], { m: mMap[id] || { ad: 'Silinmiş müşteri' } }) })
      .sort(function (a, b) { return b.son.localeCompare(a.son) })
  }, [props.hareketler, props.musteriler, props.tur])

  var nq = q.trim().toLocaleLowerCase('tr-TR')
  var list = nq ? satirlar.filter(function (r) { return (r.m.ad || '').toLocaleLowerCase('tr-TR').indexOf(nq) !== -1 || (r.m.tc || '').indexOf(nq) !== -1 }) : satirlar

  function ac(r) {
    if (acik === r.id) { setAcik(null); return }
    setAcik(r.id)
    var m = r.m
    setForm({ tc: m.tc || '', vkn: m.vkn || '', unvan: m.unvan || '', vergiDairesi: m.vergiDairesi || '', adres: m.adres || '', ilce: m.ilce || '', il: m.il || '', eposta: m.eposta || '', tel: m.tel || '' })
  }
  function set(k, v) { setForm(function (p) { var n = Object.assign({}, p); n[k] = v; return n }) }
  function kaydet(id) { props.onSaveMusteri(id, form); setAcik(null) }
  function fi(k, label, attrs) {
    return (
      <div className="fab-row">
        <label className="fab-label">{label}</label>
        <input className="fab-input" value={form[k]} onChange={function (e) { set(k, e.target.value) }} {...attrs} />
      </div>
    )
  }

  return (
    <div className="liste-sayfa">
      <div className="liste-filtre">
        <div className="fab-search sm">
          <Icon name="search" size={18} />
          <input value={q} onChange={function (e) { setQ(e.target.value) }} placeholder={alis ? 'Müstahsil ara…' : 'Alıcı ara…'} />
        </div>
        <span className="eb-not">{alis ? 'Müstahsil makbuzu için TC kimlik no, adres, il ve ilçe gerekir.' : 'Fatura için VKN/TCKN, adres, il, ilçe (VKN ise vergi dairesi) gerekir.'}</span>
      </div>
      <div className="eb-tablo">
        {list.length === 0 && <div className="fab-empty">{alis ? 'Henüz yağ alınan kişi yok' : 'Henüz yağ satılan kişi yok'}</div>}
        {list.map(function (r) {
          var m = r.m
          var kimlik = alis ? m.tc : (m.vkn || m.tc)
          var eksik = alis
            ? (!m.tc || !tcknGecerli(m.tc) || !m.il || !m.ilce)
            : (!kimlik || !m.il || !m.ilce || (m.vkn && !m.vergiDairesi))
          return (
            <div key={r.id} className={'eb-kisi' + (acik === r.id ? ' acik' : '')}>
              <button className="eb-satir-kart" onClick={function () { ac(r) }}>
                <div className="fc-av">{initialsOf(m.ad)}</div>
                <div className="eb-sk-ana">
                  <b>{m.unvan && !alis ? m.unvan : m.ad}</b>
                  <span>{kimlik ? (alis ? 'TC ' : '') + kimlik : 'Kimlik no yok'}{m.koy ? ' · ' + m.koy : ''}{m.il ? ' · ' + [m.ilce, m.il].filter(Boolean).join('/') : ''}</span>
                </div>
                {eksik
                  ? <span className="eb-durum bad">Bilgi eksik</span>
                  : <span className="eb-durum good">Hazır</span>}
                <div className="eb-kisi-sayi">
                  <b>{fmt.num(r.miktar, 1)} {birim}</b>
                  <span>{r.adet} işlem · {r.belgeli}/{r.resmi} belgeli</span>
                </div>
                <b className="eb-sk-tutar">{fmt.money(+r.tutar.toFixed(2))}</b>
              </button>
              {acik === r.id && form && (
                <div className="eb-kisi-form">
                  <div className="fab-grid">
                    {fi('tc', 'TC kimlik no', { inputMode: 'numeric', maxLength: 11 })}
                    {!alis && fi('vkn', 'VKN (şirket)', { inputMode: 'numeric', maxLength: 10 })}
                    {!alis && fi('unvan', 'Ünvan (faturada)')}
                    {!alis && fi('vergiDairesi', 'Vergi dairesi')}
                    {fi('adres', 'Adres')}
                    {fi('ilce', 'İlçe')}
                    {fi('il', 'İl')}
                    {fi('tel', 'Telefon', { type: 'tel', inputMode: 'tel' })}
                    {!alis && fi('eposta', 'E-posta', { type: 'email' })}
                  </div>
                  {form.tc && !tcknGecerli(form.tc) && <p className="fab-hint bad">TC kimlik numarası geçersiz görünüyor</p>}
                  <div className="fab-actions">
                    <button className="fab-btn primary" disabled={props.busy} onClick={function () { kaydet(r.id) }}><Icon name="check" size={22} /> Kaydet</button>
                    <button className="fab-btn" onClick={function () { setAcik(null) }}>Vazgeç</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

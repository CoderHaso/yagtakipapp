import { useMemo, useState } from 'react'
import { fmt, initialsOf } from '../../lib/fmt'
import { MM_DURUM, FATURA_DURUM, durumSinifi } from '../../lib/efatura'
import Icon from '../Icon'

// ─────────────────────────────────────────────────────────────
// ALINAN / SATILAN YAĞLAR — ana ekran sekmeleri
// Kart düzeni panodakiyle aynı dili konuşur: büyük rakam, tek satır kimlik.
// ─────────────────────────────────────────────────────────────

var ARALIKLAR = [
  { id: 'bugun', ad: 'Bugün', gun: 1 },
  { id: 'hafta', ad: '7 gün', gun: 7 },
  { id: 'ay', ad: '30 gün', gun: 30 },
  { id: 'hepsi', ad: 'Tümü', gun: 0 },
]

function gunOnce(n) {
  var d = new Date(); d.setDate(d.getDate() - (n - 1))
  return d.toLocaleDateString('sv')   // yerel takvim günü
}

export default function HareketListesi(props) {
  var alis = props.tur === 'alis'
  var [aralik, setAralik] = useState('ay')
  var [kayit, setKayit] = useState('hepsi')   // hepsi | resmi | gayri
  var birim = props.settings.yag || 'kg'
  var para = props.settings.currency || '₺'

  var liste = useMemo(function () {
    var a = ARALIKLAR.find(function (x) { return x.id === aralik })
    var since = a && a.gun ? gunOnce(a.gun) : ''
    return (props.hareketler || [])
      .filter(function (h) {
        if (h.tur !== props.tur) return false
        if (since && (h.tarih || '') < since) return false
        if (kayit === 'resmi' && h.resmi !== true) return false
        if (kayit === 'gayri' && h.resmi === true) return false
        if (kayit === 'bekleyen' && !(h.resmi === true && (!h.belge || h.belge.durum === 'Draft'))) return false
        return true
      })
      .sort(function (x, y) {
        return ((y.tarih || '') + (y.saat || '')).localeCompare((x.tarih || '') + (x.saat || ''))
      })
  }, [props.hareketler, props.tur, aralik, kayit])

  var toplamLitre = liste.reduce(function (t, h) { return t + Math.abs(Number(h.litre) || 0) }, 0)
  var toplamTutar = liste.reduce(function (t, h) { return t + (Number(h.tutar) || 0) }, 0)
  var resmiLitre = liste.reduce(function (t, h) { return h.resmi === true ? t + Math.abs(Number(h.litre) || 0) : t }, 0)

  return (
    <div className="liste-sayfa">
      <div className="liste-ust">
        <div className="liste-ozet">
          <div className="lo-kutu ana">
            <span>{alis ? 'Alınan yağ' : 'Satılan yağ'}</span>
            <b>{fmt.num(toplamLitre, 1)}<i>{birim}</i></b>
          </div>
          <div className="lo-kutu">
            <span>Tutar</span>
            <b>{fmt.money(toplamTutar, para)}</b>
          </div>
          <div className="lo-kutu">
            <span>Resmi</span>
            <b>{fmt.num(resmiLitre, 1)}<i>{birim}</i></b>
          </div>
          <div className="lo-kutu">
            <span>İşlem</span>
            <b>{liste.length}</b>
          </div>
        </div>
        <button className={'fab-primary alt' + (alis ? '' : ' sat')} onClick={props.onYeni}>
          <Icon name={alis ? 'download' : 'coin'} size={22} />
          <span>{alis ? 'YENİ ALIŞ' : 'YENİ SATIŞ'}</span>
        </button>
      </div>

      <div className="liste-filtre">
        <div className="fab-chips">
          {ARALIKLAR.map(function (a) {
            return <button key={a.id} className={'fab-chip' + (aralik === a.id ? ' on' : '')} onClick={function () { setAralik(a.id) }}>{a.ad}</button>
          })}
        </div>
        <div className="fab-chips">
          {[{ id: 'hepsi', ad: 'Hepsi' }, { id: 'resmi', ad: 'Resmi' }, { id: 'gayri', ad: 'Resmi değil' }, { id: 'bekleyen', ad: 'Belge bekleyen' }].map(function (k) {
            return <button key={k.id} className={'fab-chip' + (kayit === k.id ? ' on' : '')} onClick={function () { setKayit(k.id) }}>{k.ad}</button>
          })}
        </div>
      </div>

      <div className="liste-govde">
        {liste.length === 0 && (
          <div className="fab-empty">
            <p>Bu aralıkta {alis ? 'alış' : 'satış'} yok</p>
          </div>
        )}
        {liste.map(function (h) {
          var m = h.musteriId ? props.musteriMap[h.musteriId] : null
          var litre = Math.abs(Number(h.litre) || 0)
          return (
            <div key={h.id} className={'hk ' + (h.resmi ? 'resmi' : 'gayri')}>
              <div className="hk-head">
                <div className="fc-av">{m ? initialsOf(m.ad) : <Icon name="swap" size={18} />}</div>
                <div className="fc-who">
                  <div className="fc-name">{m ? m.ad : 'Müşterisiz'}</div>
                  <div className="fc-meta">{fmt.date(h.tarih)}{h.saat ? ' · ' + h.saat : ''}{h.kod ? ' · ' + h.kod : ''}</div>
                </div>
                <span className={'hk-rozet ' + (h.resmi ? 'resmi' : 'gayri')}>{h.resmi ? 'RESMİ' : 'RESMİ DEĞİL'}</span>
              </div>
              <div className="fc-nums">
                <div className="fc-num hi">
                  <b>{fmt.num(litre, 1)}</b><span>{birim} yağ</span>
                </div>
                {h.kgFiyat ? <div className="fc-num"><b>{fmt.num(h.kgFiyat, 0)}</b><span>{para}/{birim}</span></div> : null}
                {h.tutar ? <div className="fc-num"><b>{fmt.num(h.tutar, 0)}</b><span>{para} tutar</span></div> : null}
              </div>
              {h.not ? <div className="hk-not">{h.not}</div> : null}
              <div className="hk-alt">
                {h.resmi && h.belge && (
                  <button className="hk-belge" onClick={function () { props.onBelgeAc(h) }}>
                    <Icon name="archive" size={18} />
                    <span>
                      <b>{h.belge.belgeNo || (alis ? 'Müstahsil makbuzu' : 'Fatura')}</b>
                      <small>{h.belge.tur === 'mm' ? 'e-MM' : h.belge.senaryo === 'eInvoice' ? 'e-Fatura' : 'e-Arşiv'}{h.belge.ortam === 'test' ? ' · test' : ''}</small>
                    </span>
                    <em className={'eb-durum ' + durumSinifi(h.belge.durum)}>{(h.belge.tur === 'mm' ? MM_DURUM : FATURA_DURUM)[h.belge.durum] || h.belge.durum || '—'}</em>
                  </button>
                )}
                {h.resmi && !h.belge && props.onBelgeKes && (
                  <button className="fab-btn hk-kes" onClick={function () { props.onBelgeKes(h) }}>
                    <Icon name="plus" size={18} /> {alis ? 'Müstahsil kes' : 'Fatura kes'}
                  </button>
                )}
                {!(h.belge && h.belge.durum !== 'Draft') && (
                  <button className="fab-btn sm danger" onClick={function () { props.onSil(h) }} title="Sil">
                    <Icon name="trash" size={18} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

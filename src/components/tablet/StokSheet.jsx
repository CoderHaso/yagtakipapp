import { useState, useMemo } from 'react'
import { fmt } from '../../lib/fmt'
import { stokHareketleri, hareketEtkisi, HAREKET_TURLERI } from '../../lib/stok'
import Icon from '../Icon'

// ─────────────────────────────────────────────────────────────
// STOK — toplam yağ, kaynak kırılımı, hareket defteri
// Manuel hareket: fire (eksi) veya fabrikanın kendi ürettiği yağ (artı).
// ─────────────────────────────────────────────────────────────

var FILTRELER = [
  { id: 'hepsi', ad: 'Tümü' },
  { id: 'resmi', ad: 'Resmi' },
  { id: 'gayri', ad: 'Resmi değil' },
  { id: 'alis', ad: 'Alış' },
  { id: 'satis', ad: 'Satış' },
  { id: 'stok', ad: 'Düzeltme' },
]

export default function StokSheet(props) {
  var stok = props.stok
  var k = stok.kalemler
  var birim = props.settings.yag || 'kg'
  var para = props.settings.currency || '₺'
  var [filtre, setFiltre] = useState('hepsi')
  var [ekle, setEkle] = useState(null)   // { litre, yon, resmi, not }

  var hareketler = useMemo(function () {
    var list = stokHareketleri(props.hareketler)
    if (filtre === 'resmi') return list.filter(function (h) { return h.resmi === true })
    if (filtre === 'gayri') return list.filter(function (h) { return h.resmi !== true })
    if (filtre === 'hepsi') return list
    return list.filter(function (h) { return h.tur === filtre })
  }, [props.hareketler, filtre])

  function kaynak(ad, deger, ipucu, cls) {
    return (
      <div className={'stok-kaynak' + (cls ? ' ' + cls : '')}>
        <span className="k">{ad}</span>
        <b>{fmt.num(deger, 1)} <i>{birim}</i></b>
        {ipucu && <span className="ip">{ipucu}</span>}
      </div>
    )
  }

  function saveEkle() {
    var litre = Number(ekle.litre) || 0
    if (!litre) return
    props.onEkle({
      tur: 'stok',
      litre: ekle.yon === '-' ? -Math.abs(litre) : Math.abs(litre),
      resmi: ekle.resmi, not: ekle.not || '',
    })
    setEkle(null)
  }

  return (
    <div className="fab-sheet">
      <div className="fab-sheet-head">
        <button className="fab-icon-btn" onClick={props.onClose}><Icon name="x" size={26} /></button>
        <h2>Yağ Stoğu</h2>
        <span className="fab-sheet-sub">{fmt.num(stok.toplam, 1)} {birim} toplam</span>
      </div>

      <div className="fab-sheet-body stok">
        <div className="stok-ust">
          <div className="stok-toplam">
            <span>Toplam yağ</span>
            <b>{fmt.num(stok.toplam, 1)}<i>{birim}</i></b>
          </div>
          <div className="stok-ikili">
            <div className="stok-yari resmi">
              <span>Resmi</span>
              <b>{fmt.num(stok.resmi, 1)}<i>{birim}</i></b>
              <small>faturalı — satış öncesi buraya bak</small>
            </div>
            <div className="stok-yari gayri">
              <span>Resmi değil</span>
              <b>{fmt.num(stok.gayri, 1)}<i>{birim}</i></b>
              <small>kendi kaydımız</small>
            </div>
          </div>
        </div>

        <div className="stok-kaynaklar">
          {kaynak('Hak yağı', k.hakYag, 'siparişlerden', 'good')}
          {kaynak('Resmi alım', k.alisResmi, 'müstahsil', 'good')}
          {kaynak('Resmi olmayan alım', k.alisGayri, 'kayıt dışı', 'good')}
          {kaynak('Resmi satış', -k.satisResmi, 'faturalı', 'bad')}
          {kaynak('Resmi olmayan satış', -k.satisGayri, 'kayıt dışı', 'bad')}
          {kaynak('Stok hareketi', k.stokResmi + k.stokGayri, 'fire / üretim', 'warn')}
        </div>

        <div className="stok-bar">
          <div className="stok-filtreler">
            {FILTRELER.map(function (f) {
              return <button key={f.id} className={'fab-chip' + (filtre === f.id ? ' on' : '')} onClick={function () { setFiltre(f.id) }}>{f.ad}</button>
            })}
          </div>
          <button className="fab-btn primary" onClick={function () { setEkle({ litre: '', yon: '+', resmi: false, not: '' }) }}>
            <Icon name="plus" size={20} /> Manuel hareket
          </button>
        </div>

        {ekle && (
          <div className="stok-ekle">
            <div className="fab-seg big">
              <button className={ekle.yon === '+' ? 'on' : ''} onClick={function () { setEkle(Object.assign({}, ekle, { yon: '+' })) }}>Stok girişi (+)</button>
              <button className={ekle.yon === '-' ? 'on' : ''} onClick={function () { setEkle(Object.assign({}, ekle, { yon: '-' })) }}>Fire / düşüm (−)</button>
            </div>
            <div className="fab-grid">
              <div className="fab-row">
                <label className="fab-label">Miktar ({birim})</label>
                <input className="fab-input" type="number" inputMode="decimal" autoFocus
                  value={ekle.litre} onChange={function (e) { setEkle(Object.assign({}, ekle, { litre: e.target.value })) }} />
              </div>
              <div className="fab-row">
                <label className="fab-label">Kayıt türü</label>
                <div className="fab-seg">
                  <button className={ekle.resmi ? 'on' : ''} onClick={function () { setEkle(Object.assign({}, ekle, { resmi: true })) }}>Resmi</button>
                  <button className={!ekle.resmi ? 'on' : ''} onClick={function () { setEkle(Object.assign({}, ekle, { resmi: false })) }}>Resmi değil</button>
                </div>
              </div>
              <div className="fab-row wide">
                <label className="fab-label">Açıklama</label>
                <input className="fab-input" value={ekle.not} placeholder="Örn: depo firesi, sayım farkı"
                  onChange={function (e) { setEkle(Object.assign({}, ekle, { not: e.target.value })) }} />
              </div>
            </div>
            <div className="fab-actions">
              <button className="fab-btn primary" disabled={!Number(ekle.litre) || props.busy} onClick={saveEkle}>
                <Icon name="check" size={22} /> Kaydet
              </button>
              <button className="fab-btn" onClick={function () { setEkle(null) }}>Vazgeç</button>
            </div>
          </div>
        )}

        <div className="fab-hist">
          {hareketler.length === 0 && <div className="fab-empty">Hareket yok</div>}
          {hareketler.map(function (h) {
            var etki = hareketEtkisi(h)
            var t = HAREKET_TURLERI[h.tur] || { ad: h.tur }
            var m = h.musteriId ? props.musteriMap[h.musteriId] : null
            return (
              <div key={h.id} className={'stok-row ' + h.tur}>
                <div className="stok-row-main">
                  <b>{t.ad}{h.resmi ? '' : ' · resmi değil'}</b>
                  <span>{fmt.date(h.tarih)}{h.saat ? ' · ' + h.saat : ''}{m ? ' · ' + m.ad : ''}{h.not ? ' · ' + h.not : ''}</span>
                </div>
                <div className="stok-row-nums">
                  {h.tutar ? <span>{fmt.money(h.tutar, para)}</span> : null}
                  <b className={etki < 0 ? 'eksi' : 'arti'}>{etki > 0 ? '+' : ''}{fmt.num(etki, 1)} {birim}</b>
                </div>
                <button className="fab-btn sm danger" onClick={function () { props.onSil(h) }} title="Sil">
                  <Icon name="trash" size={18} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

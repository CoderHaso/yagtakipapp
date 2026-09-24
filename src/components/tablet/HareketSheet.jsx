import { useState } from 'react'
import { KOYLER } from '../../lib/constants'
import { fmt, initialsOf } from '../../lib/fmt'
import VoiceInput from '../VoiceInput'
import Icon from '../Icon'

// ─────────────────────────────────────────────────────────────
// YAĞ ALIŞ / YAĞ SATIŞ
//   1) müşteri seç (satışta atlanabilir)  2) litre + fiyat + resmi mi
// Resmi = fatura kesilecek (alışta müstahsil, satışta satış faturası).
// ─────────────────────────────────────────────────────────────

function normalize(s) { return (s || '').toLocaleLowerCase('tr-TR').trim() }

export default function HareketSheet(props) {
  var alis = props.tur === 'alis'
  var [q, setQ] = useState('')
  var [picked, setPicked] = useState(null)      // {id, ad} | {yeniAd} | {serbest:true}
  var [litre, setLitre] = useState('')
  var [fiyat, setFiyat] = useState(String(alis ? (props.settings.yagAlisFiyat || '') : (props.settings.yagSatisFiyat || '')))
  var [field, setField] = useState('litre')
  var [resmi, setResmi] = useState(true)
  var [not, setNot] = useState('')

  var nq = normalize(q)
  var list = nq ? props.customers.filter(function (m) { return normalize(m.ad).indexOf(nq) !== -1 }) : props.customers
  var shown = list.slice(0, 18)
  var exact = list.some(function (m) { return normalize(m.ad) === nq })

  var litreNum = Number(litre) || 0
  var fiyatNum = Number(fiyat) || 0
  var tutar = +(litreNum * fiyatNum).toFixed(2)
  var birim = props.settings.yag || 'kg'
  var para = props.settings.currency || '₺'

  // Satışta stok yetiyor mu?
  var mevcut = resmi ? props.stok.resmi : props.stok.gayri
  var yetersiz = !alis && litreNum > mevcut

  // belgeAdimi: resmi kayıtta kayıttan sonra e-belge ekranı (3. adım) açılır
  function save(belgeAdimi) {
    if (!litreNum) return
    props.onSave({
      belgeAdimi: resmi && belgeAdimi === true,
      tur: props.tur,
      musteriId: picked && picked.id ? picked.id : null,
      yeniAd: picked && picked.yeniAd ? picked.yeniAd : '',
      litre: litreNum, kgFiyat: fiyatNum || null, tutar: tutar || null,
      resmi: resmi, not: not,
    })
  }

  var baslik = alis ? 'Yağ Alış' : 'Yağ Satış'
  var kimAdi = picked ? (picked.ad || picked.yeniAd || 'Serbest') : ''

  return (
    <div className="fab-sheet">
      <div className="fab-sheet-head">
        <button className="fab-icon-btn" onClick={picked ? function () { setPicked(null) } : props.onClose}>
          <Icon name={picked ? 'back' : 'x'} size={26} />
        </button>
        <h2>{picked ? baslik : (alis ? 'Kimden alınıyor?' : 'Kime satılıyor?')}</h2>
        <div className="fab-steps"><i className="on"></i><i className={picked ? 'on' : ''}></i>{resmi && <i></i>}</div>
      </div>

      {!picked && (
        <div className="fab-sheet-body">
          <div className="fab-search">
            <Icon name="search" size={22} />
            <input
              autoFocus value={q}
              onChange={function (e) { setQ(e.target.value) }}
              placeholder="Müşteri adı…"
              onKeyDown={function (e) { if (e.key === 'Enter' && list.length === 1) setPicked({ id: list[0].id, ad: list[0].ad }) }}
            />
            <VoiceInput onResult={function (v) { setQ(v) }} />
          </div>
          <div className="fab-tiles">
            <button className="fab-tile serbest" onClick={function () { setPicked({ serbest: true }) }}>
              <div className="fab-tile-av"><Icon name="swap" size={20} /></div>
              <div className="fab-tile-name">Müşterisiz</div>
              <div className="fab-tile-meta">{alis ? 'kaynak belirtme' : 'serbest satış'}</div>
            </button>
            {q.trim() && !exact && (
              <button className="fab-tile new" onClick={function () { setPicked({ yeniAd: q.trim() }) }}>
                <div className="fab-tile-av"><Icon name="plus" size={22} /></div>
                <div className="fab-tile-name">Yeni: {q.trim()}</div>
                <div className="fab-tile-meta">müşteri oluştur</div>
              </button>
            )}
            {shown.map(function (m) {
              return (
                <button key={m.id} className="fab-tile" onClick={function () { setPicked({ id: m.id, ad: m.ad }) }}>
                  <div className="fab-tile-av">{initialsOf(m.ad)}</div>
                  <div className="fab-tile-name">{m.ad}</div>
                  <div className="fab-tile-meta">{m.koy || '—'}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {picked && (
        <div className="fab-sheet-body split">
          <div className="fab-entry">
            <div className="fab-picked">
              <div className="fab-tile-av">{picked.id ? initialsOf(picked.ad) : <Icon name={picked.serbest ? 'swap' : 'plus'} size={20} />}</div>
              <div className="fab-picked-text">
                <div className="fab-picked-name">{kimAdi}</div>
                <div className="fab-picked-meta">{picked.id ? 'Kayıtlı müşteri' : picked.serbest ? 'Müşteri kaydı yok' : 'Yeni müşteri'}</div>
              </div>
            </div>

            <div className="fab-seg big">
              <button className={resmi ? 'on' : ''} onClick={function () { setResmi(true) }}>
                <Icon name="check" size={20} /> Resmi
              </button>
              <button className={!resmi ? 'on' : ''} onClick={function () { setResmi(false) }}>
                Resmi değil
              </button>
            </div>
            <p className="fab-hint sm">
              {resmi
                ? (alis ? 'Sonraki adımda müstahsil makbuzu · resmi stoğa girer' : 'Sonraki adımda fatura (e-Fatura / e-Arşiv) · resmi stoktan düşer')
                : 'Sadece kendi kaydımız · kayıt dışı stok'}
            </p>

            <div className="fab-fields">
              <button className={'fab-field' + (field === 'litre' ? ' on' : '')} onClick={function () { setField('litre') }}>
                <span>Miktar</span>
                <b>{litre || '0'}<i>{birim}</i></b>
              </button>
              <button className={'fab-field sm' + (field === 'fiyat' ? ' on' : '')} onClick={function () { setField('fiyat') }}>
                <span>Birim fiyat</span>
                <b>{fiyat || '–'}<i>{para}</i></b>
              </button>
            </div>

            <div className="fab-calc">
              <div><span>Tutar</span><b>{tutar ? fmt.money(tutar, para) : '—'}</b></div>
              <div><span>{resmi ? 'Resmi stok' : 'Kayıt dışı stok'}</span><b>{fmt.num(mevcut, 1)} {birim}</b></div>
              <div><span>İşlem sonrası</span><b>{fmt.num(alis ? mevcut + litreNum : mevcut - litreNum, 1)} {birim}</b></div>
            </div>

            {yetersiz && <p className="fab-hint bad">Stok yetersiz — {resmi ? 'resmi' : 'kayıt dışı'} stokta {fmt.num(mevcut, 1)} {birim} var. Yine de kaydedebilirsin, stok eksiye düşer.</p>}

            <div className="fab-row">
              <label className="fab-label">Not (isteğe bağlı)</label>
              <input className="fab-input" value={not} onChange={function (e) { setNot(e.target.value) }} placeholder="Örn: 3 teneke" />
              <datalist id="fab-koy">{KOYLER.map(function (k) { return <option key={k} value={k} /> })}</datalist>
            </div>
          </div>

          <div className="fab-pad">
            {props.numpad(field === 'litre' ? litre : fiyat, true, field === 'litre' ? setLitre : setFiyat)}
{resmi ? (
              <>
                <button className={'fab-save' + (alis ? '' : ' sat')} disabled={!litreNum || props.busy} onClick={function () { save(true) }}>
                  <Icon name="arrow" size={28} />
                  <span>{props.busy ? 'KAYDEDİLİYOR…' : (alis ? 'DEVAM · MAKBUZ' : 'DEVAM · FATURA')}</span>
                </button>
                <button className="fab-btn wide" disabled={!litreNum || props.busy} onClick={function () { save(false) }}>
                  <Icon name="check" size={22} /> Sadece kaydet · belgeyi sonra kes
                </button>
              </>
            ) : (
              <button className={'fab-save' + (alis ? '' : ' sat')} disabled={!litreNum || props.busy} onClick={function () { save(false) }}>
                <Icon name="check" size={28} />
                <span>{props.busy ? 'KAYDEDİLİYOR…' : (alis ? 'ALIŞI KAYDET' : 'SATIŞI KAYDET')}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

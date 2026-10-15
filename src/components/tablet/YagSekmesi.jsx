import { useState } from 'react'
import HareketListesi from './HareketListesi'
import EBelgeListesi from './EBelgeListesi'
import Icon from '../Icon'

// ─────────────────────────────────────────────────────────────
// ALINAN / SATILAN YAĞLAR — alt sekmeler
//   Alış : Alışlar · Makbuzlar (e-MM) · Gelen Faturalar
//   Satış: Satışlar · Giden Faturalar
//   (Müstahsil / alıcı kişileri artık Cariler sekmesinde)
// ─────────────────────────────────────────────────────────────

var ALT = {
  alis: [
    { id: 'liste', ad: 'Alışlar', icon: 'download' },
    { id: 'mm', ad: 'Müstahsil Makbuzları', icon: 'archive' },
    { id: 'gelen', ad: 'Gelen Faturalar', icon: 'folder' },
  ],
  satis: [
    { id: 'liste', ad: 'Satışlar', icon: 'coin' },
    { id: 'giden', ad: 'Giden Faturalar', icon: 'archive' },
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
    </div>
  )
}

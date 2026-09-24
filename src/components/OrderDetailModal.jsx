import Icon from './Icon'
import StatusBadge from './StatusBadge'
import PrintCard from './PrintCard'
import { fmt, initialsOf } from '../lib/fmt'
import { ZEYTIN_TURLERI, FIRMA } from '../lib/constants'

export default function OrderDetailModal({ siparis, musteri, onClose, units, cardStyle = 'klasik' }) {
  if (!siparis) return null

  const tur = ZEYTIN_TURLERI.find(t => t.id === siparis.tur)

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400 }}>Sipariş Detayı</h3>
            <div className="muted tiny" style={{ marginTop: 4 }}>{siparis.kod || siparis.id}</div>
          </div>
          <button className="btn icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              {musteri && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div className="avatar" style={{ width: 40, height: 40, fontSize: 14 }}>{initialsOf(musteri.ad)}</div>
                  <div>
                    <div className="bold">{musteri.ad}</div>
                    <div className="tiny muted">{musteri.koy} · {musteri.tel}</div>
                  </div>
                </div>
              )}
              <div className="kv-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="kv"><div className="k">Tarih</div><div className="v" style={{ fontSize: 16 }}>{fmt.date(siparis.tarih)}</div></div>
                <div className="kv"><div className="k">Durum</div><div className="v" style={{ fontSize: 16 }}><StatusBadge status={siparis.durum} /></div></div>
                <div className="kv"><div className="k">Zeytin</div><div className="v">{fmt.int(siparis.zeytinKg)} {units.agirlik}</div></div>
                <div className="kv"><div className="k">Tür</div><div className="v" style={{ fontSize: 16 }}>{tur?.ad || '—'}</div></div>
                <div className="kv"><div className="k">Çıkan Yağ</div><div className="v">{siparis.cikanYag ? fmt.num(siparis.cikanYag, 1) + ' ' + units.yag : '—'}</div></div>
                <div className="kv"><div className="k">Kalan Yağ</div><div className="v">{siparis.kalanYagKg ? fmt.num(siparis.kalanYagKg, 1) + ' ' + units.yag : '—'}</div></div>
                <div className="kv"><div className="k">Hak Yağı</div><div className="v">{siparis.hakYagKg ? fmt.num(siparis.hakYagKg, 1) + ' ' + units.yag : '—'}</div></div>
                <div className="kv"><div className="k">Oran</div><div className="v mono">{siparis.oran ? '% ' + fmt.num(siparis.oran, 1) : '—'}</div></div>
                <div className="kv"><div className="k">Asit</div><div className="v mono">{siparis.asit ? fmt.num(siparis.asit, 2) : '—'}</div></div>
                <div className="kv"><div className="k">Operatör</div><div className="v" style={{ fontSize: 16 }}>{siparis.operator || '—'}</div></div>
              </div>
              {siparis.not && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg-2)', borderRadius: 8, fontSize: 13, fontStyle: 'italic', color: 'var(--ink-2)' }}>
                  {siparis.not}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div className="print-card-wrap print-area" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                <div className="rule">70mm × 140mm</div>
                <PrintCard
                  stil={cardStyle}
                  firma={FIRMA}
                  musteri={musteri}
                  siparis={siparis}
                  zeytinTuru={tur}
                  units={units}
                />
              </div>
              <button className="btn primary" onClick={() => window.print()}>
                <Icon name="print" /> Yazdır
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

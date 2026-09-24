import { Topbar } from '../components/Layout'
import { fmt } from '../lib/fmt'
import { KOYLER } from '../lib/constants'
import { useMusteriler, useSiparisler } from '../hooks/useFirestore'

export default function KoyBolge({ onOpenCustomer, units, settings }) {
  const { data: musteriler } = useMusteriler()
  const { data: siparisler } = useSiparisler()

  const sezonYil = settings?.sezonBaslangic || '2026'
  const sezon = siparisler.filter(s => s.tarih?.startsWith(sezonYil))

  const maxZeytin = Math.max(...KOYLER.map(k => {
    const ids = musteriler.filter(m => m.koy === k).map(m => m.id)
    return sezon.filter(s => ids.includes(s.musteriId)).reduce((a, s) => a + (s.zeytinKg || 0), 0)
  }), 1)

  return (
    <>
      <Topbar title="Köy / Bölge" subtitle={`${KOYLER.length} köy · Sezon ${settings?.sezonAd || sezonYil}`} />
      <div className="content">
        <div className="koy-map">
          {KOYLER.map(k => {
            const custs = musteriler.filter(m => m.koy === k)
            const custIds = custs.map(m => m.id)
            const sips = sezon.filter(s => custIds.includes(s.musteriId))
            const zeytin = sips.reduce((a, s) => a + (s.zeytinKg || 0), 0)
            const yag = sips.reduce((a, s) => a + (s.cikanYag || 0), 0)
            const oran = zeytin > 0 ? (yag / zeytin * 100) : 0
            return (
              <div key={k} className="koy-card">
                <h4>{k}</h4>
                <div className="meta">
                  <span>{custs.length} müşteri</span>
                  <span>{sips.length} sipariş</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="muted">Zeytin</span>
                    <span className="mono">{fmt.int(zeytin)} {units.agirlik}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span className="muted">Yağ</span>
                    <span className="mono">{fmt.num(yag, 1)} {units.yag}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span className="muted">Verim</span>
                    <span className="mono">% {fmt.num(oran, 1)}</span>
                  </div>
                </div>
                <div className="bar-mini"><i style={{ width: `${(zeytin / maxZeytin) * 100}%` }}></i></div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

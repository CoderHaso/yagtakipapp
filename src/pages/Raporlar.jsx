import { Topbar } from '../components/Layout'
import { fmt } from '../lib/fmt'
import { ZEYTIN_TURLERI, KOYLER } from '../lib/constants'
import { useMusteriler, useSiparisler } from '../hooks/useFirestore'

export default function Raporlar({ units, settings }) {
  const { data: musteriler } = useMusteriler()
  const { data: siparisler } = useSiparisler()

  const sezonYil = settings?.sezonBaslangic || '2026'
  const sezonAd = settings?.sezonAd || `${sezonYil}–${String(Number(sezonYil) % 100 + 1).padStart(2, '0')}`

  const sezon = siparisler.filter(s => s.tarih?.startsWith(sezonYil))
  const totalZeytin = sezon.reduce((a, s) => a + (s.zeytinKg || 0), 0)
  const totalYag = sezon.reduce((a, s) => a + (s.cikanYag || 0), 0)
  const totalHakYag = sezon.reduce((a, s) => a + (s.hakYagKg || 0), 0)
  const oranArr = sezon.filter(s => s.oran)
  const ortOran = oranArr.length ? oranArr.reduce((a, s) => a + s.oran, 0) / oranArr.length : 0

  const turStats = ZEYTIN_TURLERI.map(t => {
    const sips = sezon.filter(s => s.tur === t.id)
    const zeytin = sips.reduce((a, s) => a + (s.zeytinKg || 0), 0)
    const yag = sips.reduce((a, s) => a + (s.cikanYag || 0), 0)
    const oArr = sips.filter(s => s.oran)
    const ortO = oArr.length ? oArr.reduce((a, s) => a + s.oran, 0) / oArr.length : 0
    return { ...t, count: sips.length, zeytin, yag, ortOran: ortO }
  }).filter(t => t.count > 0).sort((a, b) => b.zeytin - a.zeytin)

  const koyStats = KOYLER.map(k => {
    const custIds = musteriler.filter(m => m.koy === k).map(m => m.id)
    const sips = sezon.filter(s => custIds.includes(s.musteriId))
    const zeytin = sips.reduce((a, s) => a + (s.zeytinKg || 0), 0)
    const yag = sips.reduce((a, s) => a + (s.cikanYag || 0), 0)
    return { koy: k, count: sips.length, zeytin, yag, musteriSayisi: musteriler.filter(m => m.koy === k).length }
  }).filter(k => k.count > 0).sort((a, b) => b.zeytin - a.zeytin)

  const maxZeytin = Math.max(...turStats.map(t => t.zeytin), 1)
  const maxKoyZeytin = Math.max(...koyStats.map(k => k.zeytin), 1)

  return (
    <>
      <Topbar title="Raporlama" subtitle={`Sezon ${sezonAd}`} />
      <div className="content">
        <div className="grid grid-4">
          <div className="stat">
            <span className="label">Toplam Sipariş</span>
            <span className="value">{sezon.length}</span>
          </div>
          <div className="stat accent">
            <span className="label">Toplam Zeytin</span>
            <span className="value">{fmt.num(totalZeytin / 1000, 1)}</span>
            <span className="sub">ton ({fmt.int(totalZeytin)} {units.agirlik})</span>
          </div>
          <div className="stat">
            <span className="label">Toplam Yağ</span>
            <span className="value">{fmt.num(totalYag / 1000, 1)}</span>
            <span className="sub">ton ({fmt.int(totalYag)} {units.yag})</span>
          </div>
          <div className="stat accent-2">
            <span className="label">Ort. Verim</span>
            <span className="value">% {fmt.num(ortOran, 1)}</span>
            <span className="sub">Hak yağı: {fmt.num(totalHakYag, 1)} {units.yag}</span>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <div className="card-head"><h3>Zeytin Türüne Göre</h3></div>
            {turStats.length === 0 ? <div className="empty">Veri yok</div> : (
              <div className="bar-chart">
                {turStats.map(t => (
                  <div key={t.id} className="bar-row">
                    <span>{t.ad}</span>
                    <div className="tr"><div className="bar" style={{ width: `${(t.zeytin / maxZeytin) * 100}%` }}></div></div>
                    <span className="val">{fmt.int(t.zeytin)} {units.agirlik} <span className="muted tiny">(%{fmt.num(t.ortOran, 1)})</span></span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card">
            <div className="card-head"><h3>Köye Göre</h3></div>
            {koyStats.length === 0 ? <div className="empty">Veri yok</div> : (
              <div className="bar-chart">
                {koyStats.map(k => (
                  <div key={k.koy} className="bar-row">
                    <span>{k.koy} <span className="muted tiny">({k.musteriSayisi})</span></span>
                    <div className="tr"><div className="bar" style={{ width: `${(k.zeytin / maxKoyZeytin) * 100}%` }}></div></div>
                    <span className="val">{fmt.int(k.zeytin)} {units.agirlik}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

import { Topbar } from '../components/Layout'
import { fmt } from '../lib/fmt'
import { useSiparisler } from '../hooks/useFirestore'

export default function SezonKarsilastirma({ units, settings }) {
  const { data: siparisler } = useSiparisler()

  const currentYear = Number(settings?.sezonBaslangic || '2026')
  const years = [currentYear, currentYear - 1, currentYear - 2].map(String)

  const sezonlar = years.map(y => {
    const sips = siparisler.filter(s => s.tarih?.startsWith(y))
    const zeytin = sips.reduce((a, s) => a + (s.zeytinKg || 0), 0)
    const yag = sips.reduce((a, s) => a + (s.cikanYag || 0), 0)
    const hakYag = sips.reduce((a, s) => a + (s.hakYagKg || 0), 0)
    const oranArr = sips.filter(s => s.oran)
    const ortOran = oranArr.length ? oranArr.reduce((a, s) => a + s.oran, 0) / oranArr.length : 0
    const asitArr = sips.filter(s => s.asit)
    const ortAsit = asitArr.length ? asitArr.reduce((a, s) => a + s.asit, 0) / asitArr.length : 0
    return { yil: y, count: sips.length, zeytin, yag, hakYag, ortOran, ortAsit }
  })

  const maxZeytin = Math.max(...sezonlar.map(s => s.zeytin), 1)

  return (
    <>
      <Topbar title="Sezon Karşılaştırma" subtitle="Yıllık karşılaştırma" />
      <div className="content">
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Sezon</th>
                <th className="right">Sipariş</th>
                <th className="right">Zeytin ({units.agirlik})</th>
                <th className="right">Yağ ({units.yag})</th>
                <th className="right">Hak Yağı ({units.yag})</th>
                <th className="right">Ort. Verim</th>
                <th className="right">Ort. Asit</th>
              </tr>
            </thead>
            <tbody>
              {sezonlar.map((s, i) => (
                <tr key={s.yil} style={i === 0 ? { background: 'var(--accent-soft)' } : {}}>
                  <td className="bold">{s.yil}–{String(Number(s.yil.slice(2)) + 1).padStart(2, '0')}</td>
                  <td data-label="Sipariş" className="num">{s.count}</td>
                  <td data-label="Zeytin" className="num">{fmt.int(s.zeytin)}</td>
                  <td data-label="Yağ" className="num bold">{fmt.num(s.yag, 1)}</td>
                  <td data-label="Hak Yağı" className="num">{fmt.num(s.hakYag, 1)}</td>
                  <td data-label="Verim" className="num">% {fmt.num(s.ortOran, 1)}</td>
                  <td data-label="Asit" className="num">{s.ortAsit ? fmt.num(s.ortAsit, 2) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head"><h3>Zeytin Miktarı Karşılaştırma</h3></div>
          <div className="bar-chart">
            {sezonlar.map(s => (
              <div key={s.yil} className="bar-row">
                <span>{s.yil}–{String(Number(s.yil.slice(2)) + 1).padStart(2, '0')}</span>
                <div className="tr"><div className="bar" style={{ width: `${(s.zeytin / maxZeytin) * 100}%` }}></div></div>
                <span className="val">{fmt.int(s.zeytin)} {units.agirlik}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

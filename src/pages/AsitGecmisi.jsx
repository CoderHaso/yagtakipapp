import { Topbar } from '../components/Layout'
import { fmt } from '../lib/fmt'
import { ZEYTIN_TURLERI } from '../lib/constants'
import { useMusteriler, useSiparisler } from '../hooks/useFirestore'

export default function AsitGecmisi({ units, settings }) {
  const { data: musteriler } = useMusteriler()
  const { data: siparisler } = useSiparisler()

  const asitHedef = settings?.varsayilanAsitHedef ?? 0.50

  const ms = (id) => musteriler.find(m => m.id === id)
  const sipsWithAsit = siparisler.filter(s => s.asit).sort((a, b) => (b.tarih || '').localeCompare(a.tarih || ''))

  const avg = sipsWithAsit.length ? sipsWithAsit.reduce((a, s) => a + s.asit, 0) / sipsWithAsit.length : 0
  const min = sipsWithAsit.length ? Math.min(...sipsWithAsit.map(s => s.asit)) : 0
  const max = sipsWithAsit.length ? Math.max(...sipsWithAsit.map(s => s.asit)) : 0
  const hedefteCount = sipsWithAsit.filter(s => s.asit <= asitHedef).length
  const hedefPct = sipsWithAsit.length ? Math.round(hedefteCount / sipsWithAsit.length * 100) : 0

  return (
    <>
      <Topbar title="Asit (Dizem) Geçmişi" subtitle={`${sipsWithAsit.length} ölçüm`} />
      <div className="content">
        <div className="grid grid-4">
          <div className="stat">
            <span className="label">Ortalama Asit</span>
            <span className="value">{fmt.num(avg, 2)}</span>
          </div>
          <div className={`stat ${avg <= asitHedef ? 'accent' : ''}`}>
            <span className="label">Hedef</span>
            <span className="value">{asitHedef}</span>
            <span className="sub">{avg > 0 ? (avg <= asitHedef ? 'Hedefte ✓' : 'Hedef aşılıyor ✗') : '—'}</span>
          </div>
          <div className="stat">
            <span className="label">En Düşük / Yüksek</span>
            <span className="value">{fmt.num(min, 2)} / {fmt.num(max, 2)}</span>
          </div>
          <div className="stat accent-2">
            <span className="label">Hedefte Oran</span>
            <span className="value">%{hedefPct}</span>
            <span className="sub">{hedefteCount} / {sipsWithAsit.length}</span>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Asit Ölçümleri</h3></div>
          {sipsWithAsit.length === 0 ? (
            <div className="empty">Asit ölçümü bulunamadı</div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Tarih</th><th>Müşteri</th><th>Tür</th><th className="right">Asit</th><th className="right">Zeytin</th><th className="right">Oran</th><th>Durum</th></tr>
              </thead>
              <tbody>
                {sipsWithAsit.map(s => {
                  const m = ms(s.musteriId)
                  const color = s.asit <= asitHedef ? 'var(--good)' : s.asit <= asitHedef * 1.6 ? 'var(--warn)' : 'var(--bad)'
                  return (
                    <tr key={s.id}>
                      <td className="mono">{fmt.date(s.tarih)}</td>
                      <td data-label="Müşteri" className="bold">{m?.ad || '—'}</td>
                      <td data-label="Tür">{ZEYTIN_TURLERI.find(t => t.id === s.tur)?.ad}</td>
                      <td data-label="Asit" className="num bold" style={{ color }}>
                        {fmt.num(s.asit, 2)}
                      </td>
                      <td data-label="Zeytin" className="num">{fmt.int(s.zeytinKg)} {units.agirlik}</td>
                      <td data-label="Oran" className="num">{s.oran ? '% ' + fmt.num(s.oran, 1) : '—'}</td>
                      <td data-label="Durum" style={{ color }}>{s.asit <= asitHedef ? '✓ İyi' : '✗ Yüksek'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}

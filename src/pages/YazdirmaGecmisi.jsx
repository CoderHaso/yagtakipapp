import { Topbar } from '../components/Layout'
import { fmt } from '../lib/fmt'
import { useMusteriler, useSiparisler } from '../hooks/useFirestore'

export default function YazdirmaGecmisi({ units }) {
  const { data: musteriler } = useMusteriler()
  const { data: siparisler } = useSiparisler()

  const ms = (id) => musteriler.find(m => m.id === id)
  const tamamlanan = siparisler.filter(s => s.durum === 'tamamlandi').sort((a, b) => (b.tarih || '').localeCompare(a.tarih || ''))

  return (
    <>
      <Topbar title="Yazdırma Geçmişi" subtitle={`${tamamlanan.length} kart basıldı`} />
      <div className="content">
        <div className="card">
          <div className="card-head"><h3>Basılan Kartlar</h3></div>
          {tamamlanan.length === 0 ? (
            <div className="empty">Henüz kart basılmadı</div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Tarih</th><th>Müşteri</th><th className="right">Zeytin</th><th className="right">Çıkan Yağ</th><th>Durum</th></tr>
              </thead>
              <tbody>
                {tamamlanan.map(s => {
                  const m = ms(s.musteriId)
                  return (
                    <tr key={s.id}>
                      <td className="mono">{fmt.date(s.tarih)}</td>
                      <td data-label="Müşteri" className="bold">{m?.ad || '—'}</td>
                      <td data-label="Zeytin" className="num">{fmt.int(s.zeytinKg)} {units.agirlik}</td>
                      <td data-label="Yağ" className="num bold">{s.cikanYag ? fmt.num(s.cikanYag, 1) + ' ' + units.yag : '—'}</td>
                      <td data-label="Durum" className="muted tiny">Basıldı</td>
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

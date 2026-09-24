import { useState } from 'react'
import { Topbar } from '../components/Layout'
import Icon from '../components/Icon'
import { fmt } from '../lib/fmt'
import { useMusteriler, useHareketler } from '../hooks/useFirestore'

export default function Cari({ onOpenCustomer, units, currency }) {
  const { data: musteriler } = useMusteriler()
  const { data: hareketler } = useHareketler()
  const [filter, setFilter] = useState('')

  const cariList = musteriler.map(m => {
    const hars = hareketler.filter(h => h.musteriId === m.id)
    // Borç: satış yapıldı müşteriye (müşteri borçlandı)
    const borc = hars.filter(h => h.tur === 'satis').reduce((a, h) => a + (h.tutar || 0), 0)
    // Alacak: alış yapıldı müşteriden (biz borçlandık = müşteri alacaklı)
    const alacak = hars.filter(h => h.tur === 'alis' || h.tur === 'iade').reduce((a, h) => a + (h.tutar || 0), 0)
    // Emanet
    const emanetBirak = hars.filter(h => h.tur === 'emanet-birak').reduce((a, h) => a + (h.litre || 0), 0)
    const emanetCek = hars.filter(h => h.tur === 'emanet-cek').reduce((a, h) => a + (h.litre || 0), 0)
    const emanetNet = emanetBirak - emanetCek
    return { ...m, borc, alacak, bakiye: borc - alacak, emanetNet, hareketSayisi: hars.length }
  }).filter(m => {
    if (m.borc === 0 && m.alacak === 0 && m.emanetNet === 0) return false
    if (filter) {
      const f = filter.toLowerCase()
      return m.ad?.toLowerCase().includes(f) || m.koy?.toLowerCase().includes(f)
    }
    return true
  })

  const toplamBorc = cariList.reduce((a, m) => a + m.borc, 0)
  const toplamAlacak = cariList.reduce((a, m) => a + m.alacak, 0)
  const toplamEmanet = cariList.reduce((a, m) => a + m.emanetNet, 0)

  return (
    <>
      <Topbar title="Borç / Alacak (Cari)" subtitle={`${cariList.length} müşteri`} />
      <div className="content">
        <div className="grid grid-4">
          <div className="stat accent-2">
            <span className="label">Toplam Borç</span>
            <span className="value">{fmt.money(toplamBorc, currency)}</span>
          </div>
          <div className="stat accent">
            <span className="label">Toplam Alacak</span>
            <span className="value">{fmt.money(toplamAlacak, currency)}</span>
          </div>
          <div className="stat">
            <span className="label">Net Bakiye</span>
            <span className="value" style={{ color: (toplamBorc - toplamAlacak) > 0 ? 'var(--bad)' : 'var(--good)' }}>
              {fmt.money(toplamBorc - toplamAlacak, currency)}
            </span>
          </div>
          <div className="stat">
            <span className="label">Toplam Emanet</span>
            <span className="value">{fmt.num(toplamEmanet, 1)}</span>
            <span className="sub">{units.yag}</span>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Cari Hesaplar</h3>
            <div className="search" style={{ width: 220 }}>
              <Icon name="search" size={14} />
              <input placeholder="Müşteri ara…" value={filter} onChange={e => setFilter(e.target.value)} />
            </div>
          </div>
          {cariList.length === 0 ? (
            <div className="empty">Cari hesap kaydı yok</div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Müşteri</th><th className="right">Borç</th><th className="right">Alacak</th><th className="right">Bakiye</th><th className="right">Emanet</th></tr>
              </thead>
              <tbody>
                {cariList.map(m => (
                  <tr key={m.id} onClick={() => onOpenCustomer?.(m)} style={{ cursor: 'pointer' }}>
                    <td className="bold">{m.ad}<div className="tiny muted">{m.koy} · {m.hareketSayisi} hareket</div></td>
                    <td data-label="Borç" className="num">{m.borc ? fmt.money(m.borc, currency) : '—'}</td>
                    <td data-label="Alacak" className="num">{m.alacak ? fmt.money(m.alacak, currency) : '—'}</td>
                    <td data-label="Bakiye" className="num bold" style={{ color: m.bakiye > 0 ? 'var(--bad)' : m.bakiye < 0 ? 'var(--good)' : 'inherit' }}>
                      {fmt.money(m.bakiye, currency)}
                    </td>
                    <td data-label="Emanet" className="num">{m.emanetNet ? `${fmt.num(m.emanetNet, 1)} ${units.yag}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}

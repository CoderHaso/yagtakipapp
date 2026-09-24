import { useState } from 'react'
import { Topbar } from '../components/Layout'
import Icon from '../components/Icon'
import StatusBadge from '../components/StatusBadge'
import { fmt } from '../lib/fmt'
import { useMusteriler, useHareketler } from '../hooks/useFirestore'

export default function Hareketler({ units, currency, settings }) {
  const { data: musteriler } = useMusteriler()
  const { data: hareketler } = useHareketler()
  const [turFilter, setTurFilter] = useState('')

  const ms = (id) => musteriler.find(m => m.id === id)

  const filtered = hareketler.filter(h => {
    if (turFilter && h.tur !== turFilter) return false
    return true
  }).sort((a, b) => (b.tarih || '').localeCompare(a.tarih || ''))

  const totalLitre = filtered.reduce((a, h) => a + (h.litre || 0), 0)
  const totalTutar = filtered.reduce((a, h) => a + (h.tutar || 0), 0)
  const emanetToplam = hareketler.filter(h => h.tur === 'emanet-birak').reduce((a, h) => a + (h.litre || 0), 0)
  const emanetCekilen = hareketler.filter(h => h.tur === 'emanet-cek').reduce((a, h) => a + (h.litre || 0), 0)

  return (
    <>
      <Topbar title="Emanet / Alış-Satış" subtitle={`${hareketler.length} hareket kaydı`} />
      <div className="content">
        <div className="grid grid-4">
          <div className="stat">
            <span className="label">Toplam Hareket</span>
            <span className="value">{filtered.length}</span>
          </div>
          <div className="stat accent">
            <span className="label">Toplam Litre</span>
            <span className="value">{fmt.num(totalLitre, 1)}</span>
            <span className="sub">{units.yag}</span>
          </div>
          <div className="stat">
            <span className="label">Toplam Tutar</span>
            <span className="value">{fmt.money(totalTutar, currency)}</span>
          </div>
          <div className="stat accent-2">
            <span className="label">Emanet Net</span>
            <span className="value">{fmt.num(emanetToplam - emanetCekilen, 1)}</span>
            <span className="sub">{units.yag} ({emanetToplam} bırakıldı, {emanetCekilen} çekildi)</span>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Hareketler</h3>
            <select className="btn sm" value={turFilter} onChange={e => setTurFilter(e.target.value)}>
              <option value="">Tüm Türler</option>
              <option value="emanet-birak">Emanet Bırak</option>
              <option value="emanet-cek">Emanet Çek</option>
              <option value="satis">Satış</option>
              <option value="alis">Alış</option>
              <option value="iade">İade</option>
            </select>
          </div>
          {filtered.length === 0 ? (
            <div className="empty">Hareket kaydı yok</div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Tarih</th><th>Müşteri</th><th>Tür</th><th className="right">Miktar</th><th className="right">Tutar</th><th>Not</th></tr>
              </thead>
              <tbody>
                {filtered.map(h => {
                  const m = ms(h.musteriId)
                  return (
                    <tr key={h.id}>
                      <td className="mono">{fmt.date(h.tarih)}</td>
                      <td data-label="Müşteri" className="bold">{m?.ad || '—'}</td>
                      <td data-label="Tür"><StatusBadge status={h.tur} /></td>
                      <td data-label="Miktar" className="num bold">{h.litre} {units.yag}</td>
                      <td data-label="Tutar" className="num">{h.tutar ? fmt.money(h.tutar, currency) : '—'}</td>
                      <td data-label="Not" className="muted tiny">{h.not}</td>
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

import { useState } from 'react'
import { Topbar } from '../components/Layout'
import Icon from '../components/Icon'
import StatusBadge from '../components/StatusBadge'
import { fmt, initialsOf } from '../lib/fmt'
import { KOYLER } from '../lib/constants'
import { useMusteriler, useSiparisler } from '../hooks/useFirestore'
import { musteriler as musteriDb } from '../lib/firestore'

export default function MusteriYonetimi({ onOpenCustomer, units, settings }) {
  const { data: musteriler } = useMusteriler()
  const { data: siparisler } = useSiparisler()
  const [filter, setFilter] = useState('')
  const [koyFilter, setKoyFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newM, setNewM] = useState({ ad: '', tel: '', koy: KOYLER[0], adres: '', notlar: '' })

  const sezonYil = settings?.sezonBaslangic || '2026'

  const customersWithStats = musteriler.map(m => {
    const sips = siparisler.filter(s => s.musteriId === m.id)
    const sezon = sips.filter(s => s.tarih?.startsWith(sezonYil))
    return {
      ...m,
      siparisAdet: sips.length,
      sezonZeytin: sezon.reduce((a, s) => a + (s.zeytinKg || 0), 0),
      sezonYag: sezon.reduce((a, s) => a + (s.cikanYag || 0), 0),
    }
  })

  const filtered = customersWithStats.filter(m => {
    if (filter && !m.ad?.toLowerCase().includes(filter.toLowerCase()) && !m.tel?.includes(filter)) return false
    if (koyFilter && m.koy !== koyFilter) return false
    return true
  })

  const handleAdd = async () => {
    if (!newM.ad.trim()) return alert('İsim soyisim zorunlu')
    setSaving(true)
    try {
      const kod = 'M-' + String(musteriler.length + 1).padStart(4, '0')
      await musteriDb.add({
        kod, ad: newM.ad.trim(), tel: newM.tel.trim(), koy: newM.koy, adres: newM.adres.trim(),
        notlar: newM.notlar.trim(), durum: 'aktif', uyelik: new Date().toISOString().slice(0, 10),
      })
      setNewM({ ad: '', tel: '', koy: KOYLER[0], adres: '', notlar: '' })
      setShowForm(false)
    } catch (e) { alert('Hata: ' + e.message) }
    setSaving(false)
  }

  return (
    <>
      <Topbar
        title="Müşteri Yönetimi"
        subtitle={`${musteriler.length} müşteri kayıtlı`}
        actions={<button className="btn primary" onClick={() => setShowForm(!showForm)}><Icon name="plus" /><span>{showForm ? 'Kapat' : 'Yeni Müşteri'}</span></button>}
      />
      <div className="content">
        {showForm && (
          <div className="card" style={{ borderColor: 'var(--accent)', borderWidth: 2 }}>
            <div className="card-head"><h3>Yeni Müşteri Ekle</h3></div>
            <div className="field-group">
              <div className="fld-row">
                <div className="field"><label>İsim Soyisim *</label>
                  <input value={newM.ad} onChange={e => setNewM({ ...newM, ad: e.target.value })} placeholder="Ahmet Yılmaz" />
                </div>
                <div className="field"><label>Telefon</label>
                  <input value={newM.tel} onChange={e => setNewM({ ...newM, tel: e.target.value })} placeholder="0532 000 00 00" />
                </div>
              </div>
              <div className="fld-row">
                <div className="field"><label>Köy</label>
                  <select value={newM.koy} onChange={e => setNewM({ ...newM, koy: e.target.value })}>
                    {KOYLER.map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div className="field"><label>Adres</label>
                  <input value={newM.adres} onChange={e => setNewM({ ...newM, adres: e.target.value })} placeholder="Adres detayı" />
                </div>
              </div>
              <div className="field"><label>Not</label>
                <textarea rows={2} value={newM.notlar} onChange={e => setNewM({ ...newM, notlar: e.target.value })} placeholder="Müşteri hakkında not…" />
              </div>
            </div>
            <div className="divider"></div>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn ghost" onClick={() => setShowForm(false)}>İptal</button>
              <button className="btn primary" onClick={handleAdd} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</button>
            </div>
          </div>
        )}

        <div className="card">
          <div className="row" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="search" style={{ flex: 1, minWidth: 240 }}>
              <Icon name="search" size={14} />
              <input placeholder="İsim, telefon ara…" value={filter} onChange={e => setFilter(e.target.value)} />
            </div>
            <select className="btn" style={{ padding: '8px 14px' }} value={koyFilter} onChange={e => setKoyFilter(e.target.value)}>
              <option value="">Tüm Köyler</option>
              {KOYLER.map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          {filtered.length === 0 ? (
            <div className="empty">Müşteri bulunamadı</div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Müşteri</th><th className="right">Sezon Zeytin</th><th className="right">Sezon Yağ</th><th>Durum</th></tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} onClick={() => onOpenCustomer(m)} style={{ cursor: 'pointer' }}>
                    <td className="bold">
                      {m.ad}
                      <div className="tiny muted">{m.koy} · {m.tel}</div>
                    </td>
                    <td data-label="Sezon Zeytin" className="num">{m.sezonZeytin ? fmt.int(m.sezonZeytin) + ' ' + units.agirlik : <span className="muted">—</span>}</td>
                    <td data-label="Sezon Yağ" className="num">{m.sezonYag ? fmt.num(m.sezonYag, 1) + ' ' + units.yag : <span className="muted">—</span>}</td>
                    <td data-label="Durum"><StatusBadge status={m.durum} /></td>
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

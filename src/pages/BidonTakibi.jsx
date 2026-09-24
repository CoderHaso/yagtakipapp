import { useState } from 'react'
import { Topbar } from '../components/Layout'
import Icon from '../components/Icon'
import { fmt } from '../lib/fmt'
import { useBidonlar, useMusteriler } from '../hooks/useFirestore'
import { bidonlar as bidonDb } from '../lib/firestore'

export default function BidonTakibi({ units, settings }) {
  const { data: bidonlar } = useBidonlar()
  const { data: musteriler } = useMusteriler()
  const [filter, setFilter] = useState('')
  const [durumFilter, setDurumFilter] = useState('')
  const [goruntule, setGoruntule] = useState('bidon') // 'bidon' | 'musteri' | 'hesap'
  const [editing, setEditing] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newBidon, setNewBidon] = useState({ kod: '', kapasite: settings?.bidonKapasite || 17, litre: 0, durum: 'bos', musteriId: '' })
  const [hesapKg, setHesapKg] = useState('')

  const kapasite = settings?.bidonKapasite || 17
  const ms = (id) => musteriler.find(m => m.id === id)

  const dolu = bidonlar.filter(b => b.durum === 'dolu')
  const yarim = bidonlar.filter(b => b.durum === 'yarim')
  const bos = bidonlar.filter(b => b.durum === 'bos')
  const toplamLitre = bidonlar.reduce((a, b) => a + (b.litre || 0), 0)

  // Bidon hesaplama (kg → bidon adedi)
  const hesapKgNum = Number(hesapKg) || 0
  const tamBidon = hesapKgNum > 0 ? Math.floor(hesapKgNum / kapasite) : 0
  const kalanKg = hesapKgNum > 0 ? +(hesapKgNum % kapasite).toFixed(2) : 0
  const yarimBidon = kalanKg > 0 ? 1 : 0

  // Litre girilince durum otomatik belirle
  const autodurum = (litre, kap) => {
    const l = Number(litre) || 0
    const k = Number(kap) || kapasite
    if (l === 0) return 'bos'
    if (l >= k * 0.9) return 'dolu'
    return 'yarim'
  }

  const filtered = bidonlar.filter(b => {
    if (durumFilter && b.durum !== durumFilter) return false
    if (!filter) return true
    const f = filter.toLowerCase()
    const owner = ms(b.musteriId)?.ad || ''
    return b.kod?.toLowerCase().includes(f) || owner.toLowerCase().includes(f)
  }).sort((a, b) => {
    const order = { dolu: 0, yarim: 1, bos: 2 }
    return (order[a.durum] ?? 3) - (order[b.durum] ?? 3)
  })

  // Müşteri bazlı bidon listesi
  const musteriListesi = musteriler.map(m => {
    const mBidonlar = bidonlar.filter(b => b.musteriId === m.id)
    const mDolu = mBidonlar.filter(b => b.durum === 'dolu')
    const mYarim = mBidonlar.filter(b => b.durum === 'yarim')
    const mLitre = mBidonlar.reduce((a, b) => a + (b.litre || 0), 0)
    return { ...m, bidonlar: mBidonlar, dolu: mDolu, yarim: mYarim, toplamLitre: mLitre }
  }).filter(m => m.bidonlar.length > 0).sort((a, b) => b.bidonlar.length - a.bidonlar.length)

  const sahipsiz = bidonlar.filter(b => !b.musteriId || b.musteriId === '')

  const durumClass = (d) => d === 'dolu' ? 'full' : d === 'bos' ? 'empty' : ''
  const fillPct = (d) => d === 'dolu' ? '100%' : d === 'yarim' ? '50%' : '0%'

  const handleSaveEdit = async () => {
    if (!editing) return
    const litre = Number(editing.litre) || 0
    const durum = autodurum(litre, editing.kapasite || kapasite)
    try {
      await bidonDb.update(editing.id, {
        durum, litre, kapasite: Number(editing.kapasite) || kapasite,
        musteriId: editing.musteriId || null,
      })
      setEditing(null)
    } catch (e) { alert('Hata: ' + e.message) }
  }

  const handleAdd = async () => {
    if (!newBidon.kod.trim()) return alert('Bidon kodu zorunlu')
    const litre = Number(newBidon.litre) || 0
    const kap = Number(newBidon.kapasite) || kapasite
    const durum = autodurum(litre, kap)
    try {
      await bidonDb.add({
        kod: newBidon.kod.trim().toUpperCase(),
        kapasite: kap, litre, durum,
        musteriId: newBidon.musteriId || null,
      })
      setNewBidon({ kod: '', kapasite: kapasite, litre: 0, durum: 'bos', musteriId: '' })
      setShowAdd(false)
    } catch (e) { alert('Hata: ' + e.message) }
  }

  return (
    <>
      <Topbar title="Bidon Takibi"
        subtitle={`${bidonlar.length} bidon · ${fmt.num(toplamLitre, 0)} ${units.yag} stok`}
        actions={<button className="btn primary" onClick={() => setShowAdd(!showAdd)}><Icon name="plus" /><span>Yeni Bidon</span></button>}
      />
      <div className="content">

        {/* İstatistik kartlar */}
        <div className="grid grid-4">
          <div className="stat accent">
            <span className="label">Dolu</span>
            <span className="value">{dolu.length}</span>
            <span className="sub">{fmt.num(dolu.reduce((a, b) => a + (b.litre || 0), 0), 0)} {units.yag}</span>
          </div>
          <div className="stat">
            <span className="label">Yarım</span>
            <span className="value">{yarim.length}</span>
            <span className="sub">{fmt.num(yarim.reduce((a, b) => a + (b.litre || 0), 0), 0)} {units.yag}</span>
          </div>
          <div className="stat">
            <span className="label">Boş</span>
            <span className="value">{bos.length}</span>
          </div>
          <div className="stat accent-2">
            <span className="label">Doluluk</span>
            <span className="value">%{bidonlar.length ? Math.round((dolu.length + yarim.length * 0.5) / bidonlar.length * 100) : 0}</span>
            <div className="prog" style={{ marginTop: 8 }}>
              <div className="pbar"><div className="pfill" style={{ width: `${bidonlar.length ? dolu.length / bidonlar.length * 100 : 0}%` }}></div></div>
            </div>
          </div>
        </div>

        {/* Yeni Bidon Ekle */}
        {showAdd && (
          <div className="card" style={{ borderColor: 'var(--accent)', borderWidth: 2 }}>
            <div className="card-head"><h3>Yeni Bidon Ekle</h3></div>
            <div className="fld-row-3">
              <div className="field">
                <label>Bidon Kodu *</label>
                <input value={newBidon.kod} onChange={e => setNewBidon({ ...newBidon, kod: e.target.value })} placeholder="örn. B-049" />
              </div>
              <div className="field">
                <label>Kapasite ({units.yag})</label>
                <input type="number" step="0.5" value={newBidon.kapasite}
                  onChange={e => setNewBidon({ ...newBidon, kapasite: e.target.value })} />
              </div>
              <div className="field">
                <label>Mevcut İçerik ({units.yag})</label>
                <input type="number" step="0.5" value={newBidon.litre}
                  onChange={e => setNewBidon({ ...newBidon, litre: e.target.value })} />
              </div>
            </div>
            <div className="fld-row">
              <div className="field">
                <label>Sahip (Müşteri)</label>
                <select value={newBidon.musteriId} onChange={e => setNewBidon({ ...newBidon, musteriId: e.target.value })}>
                  <option value="">Sahipsiz</option>
                  {musteriler.map(m => <option key={m.id} value={m.id}>{m.ad}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Durum (otomatik)</label>
                <input value={{
                  dolu: 'Dolu', yarim: 'Yarım', bos: 'Boş'
                }[autodurum(newBidon.litre, newBidon.kapasite)]} readOnly style={{ background: 'var(--bg-2)' }} />
              </div>
            </div>
            <div className="divider"></div>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn ghost" onClick={() => setShowAdd(false)}>İptal</button>
              <button className="btn primary" onClick={handleAdd}>Ekle</button>
            </div>
          </div>
        )}

        {/* Bidon düzenleme */}
        {editing && (
          <div className="card" style={{ borderColor: 'var(--accent)', borderWidth: 2 }}>
            <div className="card-head"><h3>Bidon Düzenle: {editing.kod}</h3></div>
            <div className="fld-row-3">
              <div className="field">
                <label>Kapasite ({units.yag})</label>
                <input type="number" step="0.5" value={editing.kapasite || kapasite}
                  onChange={e => setEditing({ ...editing, kapasite: e.target.value })} />
              </div>
              <div className="field">
                <label>İçerik ({units.yag})</label>
                <input type="number" step="0.5" value={editing.litre}
                  onChange={e => setEditing({ ...editing, litre: e.target.value })} />
              </div>
              <div className="field">
                <label>Durum (otomatik)</label>
                <input value={{
                  dolu: '🟢 Dolu', yarim: '🟡 Yarım', bos: '⚪ Boş'
                }[autodurum(editing.litre, editing.kapasite || kapasite)]}
                  readOnly style={{ background: 'var(--bg-2)', fontWeight: 500 }} />
              </div>
            </div>
            <div className="field">
              <label>Sahip</label>
              <select value={editing.musteriId || ''} onChange={e => setEditing({ ...editing, musteriId: e.target.value || null })}>
                <option value="">Sahipsiz</option>
                {musteriler.map(m => <option key={m.id} value={m.id}>{m.ad}</option>)}
              </select>
            </div>
            <div className="hint" style={{ marginTop: 4 }}>
              Durum otomatik belirlenir: İçerik = 0 → Boş · İçerik ≥ %90 kapasite → Dolu · Diğer → Yarım
            </div>
            <div className="divider"></div>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn ghost" onClick={() => setEditing(null)}>İptal</button>
              <button className="btn primary" onClick={handleSaveEdit}>Kaydet</button>
            </div>
          </div>
        )}

        {/* Görünüm seçici */}
        <div className="tabs">
          <button className={`tab ${goruntule === 'bidon' ? 'active' : ''}`} onClick={() => setGoruntule('bidon')}>Bidon Görünümü</button>
          <button className={`tab ${goruntule === 'musteri' ? 'active' : ''}`} onClick={() => setGoruntule('musteri')}>Müşteri Bazlı</button>
          <button className={`tab ${goruntule === 'hesap' ? 'active' : ''}`} onClick={() => setGoruntule('hesap')}>Bidon Hesaplama</button>
        </div>

        {/* --- Bidon Grid Görünümü --- */}
        {goruntule === 'bidon' && (
          <div className="card">
            <div className="card-head">
              <h3>Bidon Durumu</h3>
              <div className="row" style={{ gap: 8 }}>
                <div className="search" style={{ width: 200 }}>
                  <Icon name="search" size={14} />
                  <input placeholder="Kod veya sahip ara…" value={filter} onChange={e => setFilter(e.target.value)} />
                </div>
                <select className="btn sm" value={durumFilter} onChange={e => setDurumFilter(e.target.value)}>
                  <option value="">Tümü</option>
                  <option value="dolu">Dolu</option>
                  <option value="yarim">Yarım</option>
                  <option value="bos">Boş</option>
                </select>
              </div>
            </div>
            <div className="bidon-grid">
              {filtered.map(b => (
                <div key={b.id} className={`bidon ${durumClass(b.durum)}`}
                  onClick={() => setEditing({ id: b.id, kod: b.kod, durum: b.durum, litre: b.litre || 0, kapasite: b.kapasite || kapasite, musteriId: b.musteriId || '' })}
                  style={{ cursor: 'pointer' }}>
                  <div className="bidon-icon" style={{ '--fill': fillPct(b.durum) }}></div>
                  <div className="bidon-id">{b.kod}</div>
                  <div className="bidon-owner">{ms(b.musteriId)?.ad || '—'}</div>
                  <div className="tiny muted" style={{ textAlign: 'center' }}>
                    {b.litre ? `${fmt.num(b.litre, 1)} / ${b.kapasite || kapasite} ${units.yag}` : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- Müşteri Bazlı Görünüm --- */}
        {goruntule === 'musteri' && (
          <div className="card">
            <div className="card-head"><h3>Müşteri Bazlı Bidon Durumu</h3></div>
            {musteriListesi.length === 0 ? (
              <div className="empty">Müşteriye atanmış bidon yok</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Müşteri</th>
                    <th className="right">Dolu</th>
                    <th className="right">Yarım</th>
                    <th className="right">Toplam</th>
                    <th className="right">Toplam İçerik</th>
                    <th>Bidonlar</th>
                  </tr>
                </thead>
                <tbody>
                  {musteriListesi.map(m => (
                    <tr key={m.id}>
                      <td className="bold">
                        {m.ad}
                        <div className="tiny muted">{m.koy}</div>
                      </td>
                      <td className="num">
                        {m.dolu.length > 0
                          ? <span style={{ color: 'var(--good)', fontWeight: 600 }}>{m.dolu.length} dolu</span>
                          : <span className="muted">—</span>}
                      </td>
                      <td className="num">
                        {m.yarim.length > 0
                          ? <span style={{ color: 'var(--warn)', fontWeight: 600 }}>{m.yarim.length} yarım</span>
                          : <span className="muted">—</span>}
                      </td>
                      <td className="num bold">{m.bidonlar.length}</td>
                      <td className="num">{m.toplamLitre > 0 ? `${fmt.num(m.toplamLitre, 1)} ${units.yag}` : '—'}</td>
                      <td>
                        <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                          {m.bidonlar.map(b => (
                            <span key={b.id}
                              onClick={() => setEditing({ id: b.id, kod: b.kod, durum: b.durum, litre: b.litre || 0, kapasite: b.kapasite || kapasite, musteriId: b.musteriId || '' })}
                              style={{
                                fontSize: 11, padding: '2px 6px', borderRadius: 4, cursor: 'pointer',
                                background: b.durum === 'dolu' ? 'var(--good)' : b.durum === 'yarim' ? 'var(--warn)' : 'var(--bg-3)',
                                color: b.durum === 'bos' ? 'var(--ink-3)' : 'white',
                              }}>
                              {b.kod}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sahipsiz.length > 0 && (
                    <tr style={{ background: 'var(--bg-2)' }}>
                      <td className="muted">Sahipsiz</td>
                      <td className="num">{sahipsiz.filter(b => b.durum === 'dolu').length || '—'}</td>
                      <td className="num">{sahipsiz.filter(b => b.durum === 'yarim').length || '—'}</td>
                      <td className="num">{sahipsiz.length}</td>
                      <td className="num">{fmt.num(sahipsiz.reduce((a, b) => a + (b.litre || 0), 0), 1)} {units.yag}</td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* --- Bidon Hesaplama --- */}
        {goruntule === 'hesap' && (
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="card">
              <div className="card-head"><h3>Kg → Bidon Hesabı</h3></div>
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Depolanacak Yağ Miktarı ({units.yag})</label>
                <input type="number" step="0.5" value={hesapKg}
                  onChange={e => setHesapKg(e.target.value)}
                  placeholder={`örn. 200`}
                  style={{ fontSize: 18, padding: '10px 14px' }} />
                <div className="hint">Varsayılan bidon kapasitesi: {kapasite} {units.yag} · Ayarlardan değiştirilebilir</div>
              </div>
              {hesapKgNum > 0 && (
                <div style={{ background: 'var(--accent-soft)', borderRadius: 10, padding: '16px 20px' }}>
                  <div className="tiny muted" style={{ marginBottom: 10 }}>SONUÇ</div>
                  <div className="kv-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="kv">
                      <div className="k">Tam Dolu Bidon</div>
                      <div className="v" style={{ color: 'var(--accent)', fontSize: 28 }}>{tamBidon}</div>
                      <div className="tiny muted">{tamBidon} × {kapasite} = {tamBidon * kapasite} {units.yag}</div>
                    </div>
                    {yarimBidon > 0 && (
                      <div className="kv">
                        <div className="k">Yarım Bidon</div>
                        <div className="v" style={{ fontSize: 28 }}>{yarimBidon}</div>
                        <div className="tiny muted">{kalanKg} {units.yag} içerik</div>
                      </div>
                    )}
                    <div className="kv">
                      <div className="k">Toplam Bidon</div>
                      <div className="v bold">{tamBidon + yarimBidon} adet</div>
                    </div>
                    <div className="kv">
                      <div className="k">Toplam Kontrol</div>
                      <div className="v">{fmt.num(hesapKgNum, 1)} {units.yag}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-head"><h3>Boş Bidon Stoku</h3></div>
              <div style={{ marginBottom: 16 }}>
                <div className="tiny muted" style={{ marginBottom: 8 }}>Kullanılabilir Boş Bidonlar</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36 }}>{bos.length} <span style={{ fontSize: 18, color: 'var(--ink-3)' }}>adet</span></div>
                {hesapKgNum > 0 && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: (tamBidon + yarimBidon) <= bos.length ? 'var(--good)' : 'var(--bad)', borderRadius: 8, color: 'white', fontSize: 13 }}>
                    {(tamBidon + yarimBidon) <= bos.length
                      ? `✓ Yeterli stok var — ${tamBidon + yarimBidon} bidon gerekli, ${bos.length} boş mevcut`
                      : `✗ Yetersiz stok — ${tamBidon + yarimBidon} bidon gerekli, sadece ${bos.length} boş mevcut`}
                  </div>
                )}
              </div>
              <div className="divider"></div>
              <div className="tiny muted" style={{ marginBottom: 8 }}>Özet</div>
              <div className="kv-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="kv"><div className="k">Dolu</div><div className="v">{dolu.length}</div></div>
                <div className="kv"><div className="k">Yarım</div><div className="v">{yarim.length}</div></div>
                <div className="kv"><div className="k">Boş</div><div className="v bold">{bos.length}</div></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

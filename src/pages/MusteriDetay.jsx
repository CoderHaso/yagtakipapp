import { useState } from 'react'
import { Topbar } from '../components/Layout'
import Icon from '../components/Icon'
import StatusBadge from '../components/StatusBadge'
import { fmt, initialsOf } from '../lib/fmt'
import { ZEYTIN_TURLERI, KOYLER } from '../lib/constants'
import { useSiparisler, useHareketler, useBidonlar } from '../hooks/useFirestore'
import { musteriler as musteriDb, bidonlar as bidonDb } from '../lib/firestore'

export default function MusteriDetay({ musteri, onBack, units, currency, onOpenOrder, settings }) {
  const { data: allSiparisler } = useSiparisler()
  const { data: allHareketler } = useHareketler()
  const { data: allBidonlar } = useBidonlar()
  const [tab, setTab] = useState('siparisler')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [bidonEditing, setBidonEditing] = useState(null)

  if (!musteri) return null

  const kapasite = settings?.bidonKapasite || 17

  const sips = allSiparisler.filter(s => s.musteriId === musteri.id)
    .sort((a, b) => (b.tarih || '').localeCompare(a.tarih || ''))
  const hars = allHareketler.filter(h => h.musteriId === musteri.id)
    .sort((a, b) => (b.tarih || '').localeCompare(a.tarih || ''))
  const mBidonlar = allBidonlar.filter(b => b.musteriId === musteri.id)
    .sort((a, b) => (a.kod || '').localeCompare(b.kod || ''))

  const sezonYil = settings?.sezonBaslangic || '2026'
  const sezonSips = sips.filter(s => s.tarih?.startsWith(sezonYil))

  const totalZeytin = sezonSips.reduce((a, s) => a + (s.zeytinKg || 0), 0)
  const totalYag = sezonSips.reduce((a, s) => a + (s.cikanYag || 0), 0)
  const totalHakYag = sezonSips.reduce((a, s) => a + (s.hakYagKg || 0), 0)
  const asitArr = sezonSips.filter(s => s.asit)
  const ortAsit = asitArr.length ? asitArr.reduce((a, s) => a + s.asit, 0) / asitArr.length : 0
  const oranArr = sezonSips.filter(s => s.oran)
  const ortOran = oranArr.length ? oranArr.reduce((a, s) => a + s.oran, 0) / oranArr.length : 0

  const emanetBirak = hars.filter(h => h.tur === 'emanet-birak').reduce((a, h) => a + (h.litre || 0), 0)
  const emanetCek = hars.filter(h => h.tur === 'emanet-cek').reduce((a, h) => a + (h.litre || 0), 0)
  const emanetNet = emanetBirak - emanetCek

  // Bidon stats
  const bidonDolu = mBidonlar.filter(b => b.durum === 'dolu')
  const bidonYarim = mBidonlar.filter(b => b.durum === 'yarim')
  const bidonBos = mBidonlar.filter(b => b.durum === 'bos')
  const bidonToplamLitre = mBidonlar.reduce((a, b) => a + (b.litre || 0), 0)

  const autodurum = (litre, kap) => {
    const l = Number(litre) || 0
    const k = Number(kap) || kapasite
    if (l === 0) return 'bos'
    if (l >= k * 0.9) return 'dolu'
    return 'yarim'
  }

  const handleEdit = () => {
    setEditing(true)
    setEditForm({
      ad: musteri.ad, tel: musteri.tel || '', koy: musteri.koy || KOYLER[0],
      adres: musteri.adres || '', notlar: musteri.notlar || '', durum: musteri.durum || 'aktif'
    })
  }

  const handleSaveEdit = async () => {
    if (!editForm.ad.trim()) return alert('İsim soyisim zorunlu')
    setSaving(true)
    try {
      await musteriDb.update(musteri.id, {
        ad: editForm.ad.trim(), tel: editForm.tel.trim(), koy: editForm.koy,
        adres: editForm.adres.trim(), notlar: editForm.notlar.trim(), durum: editForm.durum,
      })
      setEditing(false)
      Object.assign(musteri, editForm)
    } catch (e) { alert('Hata: ' + e.message) }
    setSaving(false)
  }

  const handleSaveBidon = async () => {
    if (!bidonEditing) return
    const litre = Number(bidonEditing.litre) || 0
    const kap = Number(bidonEditing.kapasite) || kapasite
    const durum = autodurum(litre, kap)
    try {
      await bidonDb.update(bidonEditing.id, { durum, litre, kapasite: kap })
      setBidonEditing(null)
    } catch (e) { alert('Hata: ' + e.message) }
  }

  const durumRenk = (d) => d === 'dolu' ? 'var(--good)' : d === 'yarim' ? 'var(--warn)' : 'var(--ink-3)'

  return (
    <>
      <Topbar
        title={musteri.ad}
        subtitle={<><button className="btn ghost sm" onClick={onBack}>← Müşteriler</button></>}
        actions={
          <div className="row">
            <button className="btn" onClick={handleEdit}><Icon name="edit" size={14} /><span>Düzenle</span></button>
          </div>
        }
      />
      <div className="content">
        {/* Düzenleme formu */}
        {editing && editForm && (
          <div className="card" style={{ borderColor: 'var(--accent)', borderWidth: 2 }}>
            <div className="card-head"><h3>Müşteri Düzenle</h3></div>
            <div className="field-group">
              <div className="fld-row">
                <div className="field"><label>İsim Soyisim *</label>
                  <input value={editForm.ad} onChange={e => setEditForm({ ...editForm, ad: e.target.value })} />
                </div>
                <div className="field"><label>Telefon</label>
                  <input value={editForm.tel} onChange={e => setEditForm({ ...editForm, tel: e.target.value })} />
                </div>
              </div>
              <div className="fld-row">
                <div className="field"><label>Köy</label>
                  <select value={editForm.koy} onChange={e => setEditForm({ ...editForm, koy: e.target.value })}>
                    {KOYLER.map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div className="field"><label>Durum</label>
                  <select value={editForm.durum} onChange={e => setEditForm({ ...editForm, durum: e.target.value })}>
                    <option value="aktif">Aktif</option>
                    <option value="pasif">Pasif</option>
                  </select>
                </div>
              </div>
              <div className="field"><label>Adres</label>
                <input value={editForm.adres} onChange={e => setEditForm({ ...editForm, adres: e.target.value })} />
              </div>
              <div className="field"><label>Not</label>
                <textarea rows={2} value={editForm.notlar} onChange={e => setEditForm({ ...editForm, notlar: e.target.value })} />
              </div>
            </div>
            <div className="divider"></div>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn ghost" onClick={() => setEditing(false)}>İptal</button>
              <button className="btn primary" onClick={handleSaveEdit} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</button>
            </div>
          </div>
        )}

        {/* Profil kartı */}
        <div className="card">
          <div className="cust-header">
            <div className="cust-avatar">{initialsOf(musteri.ad)}</div>
            <div className="cust-info">
              <h2>{musteri.ad}</h2>
              <div className="meta">
                {musteri.tel && <span><Icon name="phone" size={12} /> {musteri.tel}</span>}
                <span><Icon name="home" size={12} /> {musteri.koy} köyü</span>
                {musteri.adres && <span><Icon name="map" size={12} /> {musteri.adres}</span>}
                <StatusBadge status={musteri.durum} />
              </div>
              {musteri.notlar && <div className="muted tiny" style={{ marginTop: 8, fontStyle: 'italic' }}>"{musteri.notlar}"</div>}
            </div>
          </div>
          <div className="divider"></div>
          <div className="kv-grid">
            <div className="kv"><div className="k">Sezon Sipariş</div><div className="v">{sezonSips.length} <span className="tiny muted">({sips.length} toplam)</span></div></div>
            <div className="kv"><div className="k">Sezon Zeytin</div><div className="v">{fmt.int(totalZeytin)} <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>{units.agirlik}</span></div></div>
            <div className="kv"><div className="k">Sezon Yağ</div><div className="v">{fmt.num(totalYag, 1)} <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>{units.yag}</span></div></div>
            <div className="kv"><div className="k">Ort. Verim</div><div className="v mono">% {fmt.num(ortOran, 1)}</div></div>
            <div className="kv"><div className="k">Hak Yağı</div><div className="v">{fmt.num(totalHakYag, 1)} <span className="tiny muted">{units.yag}</span></div></div>
            <div className="kv"><div className="k">Ort. Asit</div><div className="v mono">{ortAsit ? fmt.num(ortAsit, 2) : '—'}</div></div>
            <div className="kv"><div className="k">Emanet Net</div><div className="v">{fmt.num(emanetNet, 1)} <span className="tiny muted">{units.yag}</span></div></div>
            <div className="kv">
              <div className="k">Bidonlar</div>
              <div className="v">
                {mBidonlar.length > 0 ? (
                  <span>
                    {bidonDolu.length > 0 && <span style={{ color: 'var(--good)', marginRight: 6 }}>{bidonDolu.length} dolu</span>}
                    {bidonYarim.length > 0 && <span style={{ color: 'var(--warn)', marginRight: 6 }}>{bidonYarim.length} yarım</span>}
                    {bidonBos.length > 0 && <span className="muted">{bidonBos.length} boş</span>}
                  </span>
                ) : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="tabs">
          {[
            ['siparisler', 'Siparişler', sips.length],
            ['hareketler', 'Hareketler', hars.length],
            ['bidonlar', 'Bidonlar', mBidonlar.length],
          ].map(([id, l, count]) => (
            <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
              {l} <span className="muted">({count})</span>
            </button>
          ))}
        </div>

        {/* Siparişler sekmesi */}
        {tab === 'siparisler' && (
          <div className="card">
            {sips.length === 0 ? <div className="empty">Sipariş yok</div> : (
              <table className="table">
                <thead><tr><th>Tarih</th><th>Tür</th><th className="right">Zeytin</th><th className="right">Çıkan Yağ</th><th className="right">Oran</th><th>Durum</th></tr></thead>
                <tbody>
                  {sips.map(s => (
                    <tr key={s.id} onClick={() => onOpenOrder?.(s)} style={{ cursor: 'pointer' }}>
                      <td className="mono">{fmt.date(s.tarih)}</td>
                      <td data-label="Tür">{ZEYTIN_TURLERI.find(t => t.id === s.tur)?.ad}</td>
                      <td data-label="Zeytin" className="num">{fmt.int(s.zeytinKg)} {units.agirlik}</td>
                      <td data-label="Yağ" className="num bold">{s.cikanYag ? fmt.num(s.cikanYag, 1) + ' ' + units.yag : '—'}</td>
                      <td data-label="Oran" className="num">{s.oran ? '% ' + fmt.num(s.oran, 1) : '—'}</td>
                      <td data-label="Durum"><StatusBadge status={s.durum} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Hareketler sekmesi */}
        {tab === 'hareketler' && (
          <div className="card">
            {hars.length === 0 ? <div className="empty">Hareket kaydı yok.</div> : (
              <table className="table">
                <thead><tr><th>Tarih</th><th>Tür</th><th className="right">Miktar</th><th className="right">Tutar</th><th>Not</th></tr></thead>
                <tbody>
                  {hars.map(h => (
                    <tr key={h.id}>
                      <td className="mono">{fmt.date(h.tarih)}</td>
                      <td data-label="Tür"><StatusBadge status={h.tur} /></td>
                      <td data-label="Miktar" className="num bold">{h.litre} {units.yag}</td>
                      <td data-label="Tutar" className="num">{h.tutar ? fmt.money(h.tutar, currency) : '—'}</td>
                      <td data-label="Not" className="muted tiny">{h.not}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Bidonlar sekmesi */}
        {tab === 'bidonlar' && (
          <>
            {/* Bidon düzenleme */}
            {bidonEditing && (
              <div className="card" style={{ borderColor: 'var(--accent)', borderWidth: 2 }}>
                <div className="card-head"><h3>Bidon Düzenle: {bidonEditing.kod}</h3></div>
                <div className="fld-row-3">
                  <div className="field">
                    <label>Kapasite ({units.yag})</label>
                    <input type="number" step="0.5" value={bidonEditing.kapasite || kapasite}
                      onChange={e => setBidonEditing({ ...bidonEditing, kapasite: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>İçerik ({units.yag})</label>
                    <input type="number" step="0.5" value={bidonEditing.litre}
                      onChange={e => setBidonEditing({ ...bidonEditing, litre: e.target.value })} autoFocus />
                  </div>
                  <div className="field">
                    <label>Durum (otomatik)</label>
                    <input value={{ dolu: '🟢 Dolu', yarim: '🟡 Yarım', bos: '⚪ Boş' }[autodurum(bidonEditing.litre, bidonEditing.kapasite)]}
                      readOnly style={{ background: 'var(--bg-2)', fontWeight: 500 }} />
                  </div>
                </div>
                <div className="hint">Durum otomatik: 0 → Boş · ≥%90 kapasite → Dolu · Diğer → Yarım</div>
                <div className="divider"></div>
                <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
                  <button className="btn ghost" onClick={() => setBidonEditing(null)}>İptal</button>
                  <button className="btn primary" onClick={handleSaveBidon}>Kaydet</button>
                </div>
              </div>
            )}

            {mBidonlar.length === 0 ? (
              <div className="card"><div className="empty">Bu müşteriye atanmış bidon yok</div></div>
            ) : (
              <>
                {/* Özet */}
                <div className="grid grid-4">
                  <div className="stat accent">
                    <span className="label">Dolu Bidon</span>
                    <span className="value">{bidonDolu.length}</span>
                    <span className="sub">{fmt.num(bidonDolu.reduce((a, b) => a + (b.litre || 0), 0), 1)} {units.yag}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Yarım Bidon</span>
                    <span className="value">{bidonYarim.length}</span>
                    <span className="sub">{fmt.num(bidonYarim.reduce((a, b) => a + (b.litre || 0), 0), 1)} {units.yag}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Boş Bidon</span>
                    <span className="value">{bidonBos.length}</span>
                  </div>
                  <div className="stat accent-2">
                    <span className="label">Toplam İçerik</span>
                    <span className="value">{fmt.num(bidonToplamLitre, 1)}</span>
                    <span className="sub">{units.yag} · {mBidonlar.length} bidon</span>
                  </div>
                </div>

                {/* Bidon listesi */}
                <div className="card">
                  <div className="card-head">
                    <h3>Bidon Detayı</h3>
                    <div className="tiny muted">Tıklayarak düzenleyebilirsiniz</div>
                  </div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Bidon Kodu</th>
                        <th>Durum</th>
                        <th className="right">İçerik</th>
                        <th className="right">Kapasite</th>
                        <th className="right">Doluluk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mBidonlar.map(b => {
                        const kap = b.kapasite || kapasite
                        const pct = kap > 0 ? Math.round((b.litre || 0) / kap * 100) : 0
                        return (
                          <tr key={b.id} onClick={() => setBidonEditing({ id: b.id, kod: b.kod, litre: b.litre || 0, kapasite: kap })} style={{ cursor: 'pointer' }}>
                            <td className="bold mono">{b.kod}</td>
                            <td>
                              <span style={{ color: durumRenk(b.durum), fontWeight: 600 }}>
                                {b.durum === 'dolu' ? '● Dolu' : b.durum === 'yarim' ? '◑ Yarım' : '○ Boş'}
                              </span>
                            </td>
                            <td data-label="İçerik" className="num">{b.litre ? `${fmt.num(b.litre, 1)} ${units.yag}` : '—'}</td>
                            <td data-label="Kapasite" className="num muted">{kap} {units.yag}</td>
                            <td data-label="Doluluk" className="num">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                                <span>%{pct}</span>
                                <div style={{ width: 60, height: 6, background: 'var(--bg-3)', borderRadius: 3 }}>
                                  <div style={{ width: `${pct}%`, height: '100%', background: durumRenk(b.durum), borderRadius: 3 }}></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}

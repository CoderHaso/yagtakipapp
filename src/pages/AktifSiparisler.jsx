import { useState } from 'react'
import { Topbar } from '../components/Layout'
import Icon from '../components/Icon'
import VoiceInput from '../components/VoiceInput'
import StatusBadge from '../components/StatusBadge'
import { fmt } from '../lib/fmt'
import { ZEYTIN_TURLERI } from '../lib/constants'
import { useMusteriler, useSiparisler } from '../hooks/useFirestore'
import { siparisler as siparisDb } from '../lib/firestore'

export default function AktifSiparisler({ onOpenOrder, units, settings, hesapla }) {
  var musterilerHook = useMusteriler()
  var siparislerHook = useSiparisler()
  var musteriler = musterilerHook.data
  var siparisler = siparislerHook.data
  var [completing, setCompleting] = useState(null)
  var [editing, setEditing] = useState(null)

  var aktif = siparisler.filter(function (s) { return s.durum !== 'tamamlandi' })
  var ms = function (id) { return musteriler.find(function (m) { return m.id === id }) }
  var tur = function (tid) { return ZEYTIN_TURLERI.find(function (t) { return t.id === tid }) }

  var durumSira = { preste: 0, yikamada: 1, kuyrukta: 2 }
  var sorted = aktif.slice().sort(function (a, b) { return (durumSira[a.durum] || 99) - (durumSira[b.durum] || 99) })

  var nextDurum = { kuyrukta: 'yikamada', yikamada: 'preste', preste: 'tamamlandi' }
  var durumLabel = { kuyrukta: 'Yıkamaya Al', yikamada: 'Prese Al', preste: 'Tamamla' }

  var handleDurum = async function (e, sip, yeniDurum) {
    e.stopPropagation()
    if (yeniDurum === 'tamamlandi') {
      setCompleting({ id: sip.id, kod: sip.kod, zeytinKg: sip.zeytinKg, cikanYag: '', asit: '', bidon: '' })
      return
    }
    await siparisDb.update(sip.id, { durum: yeniDurum })
  }

  var handleQuickNext = async function (e, sip) {
    e.stopPropagation()
    var next = nextDurum[sip.durum]
    if (!next) return
    handleDurum(e, sip, next)
  }

  var handleComplete = async function () {
    if (!completing) return
    var cikanYag = Number(completing.cikanYag) || 0
    var asit = Number(completing.asit) || 0
    var bidonKapasite = settings?.bidonKapasite || 17
    var kalanYag = hesapla ? hesapla.kalanYag(cikanYag) : +(cikanYag * (1 - (settings?.hakYagOran || 10) / 100)).toFixed(2)
    var autoBidon = kalanYag > 0 ? Math.ceil(kalanYag / bidonKapasite) : 0

    var updates = {
      durum: 'tamamlandi',
      cikanYag: cikanYag || null,
      asit: asit || null,
      oran: hesapla ? hesapla.oran(completing.zeytinKg || 0, cikanYag) : (completing.zeytinKg > 0 ? +(cikanYag / completing.zeytinKg * 100).toFixed(2) : 0),
      hakYagKg: hesapla ? hesapla.hakYag(cikanYag) : +(cikanYag * (settings?.hakYagOran || 10) / 100).toFixed(2),
      kalanYagKg: kalanYag,
      bidon: Number(completing.bidon) || autoBidon || null,
    }

    try {
      await siparisDb.update(completing.id, updates)
      setCompleting(null)
    } catch (e) { alert('Hata: ' + e.message) }
  }

  var handleInlineEdit = async function () {
    if (!editing) return
    try {
      await siparisDb.update(editing.id, {
        zeytinKg: Number(editing.zeytinKg) || 0,
        cuval: Number(editing.cuval) || null,
        operator: editing.operator || '',
        not: editing.not || '',
      })
      setEditing(null)
    } catch (e) { alert('Hata: ' + e.message) }
  }

  var cikanYagNum = Number(completing?.cikanYag) || 0
  var completingOran = completing && cikanYagNum > 0 && hesapla ? hesapla.oran(completing.zeytinKg || 0, cikanYagNum) : 0
  var completingHak = completing && cikanYagNum > 0 && hesapla ? hesapla.hakYag(cikanYagNum) : 0
  var completingKalan = completing && cikanYagNum > 0 && hesapla ? hesapla.kalanYag(cikanYagNum) : 0
  var completingAutoBidon = completingKalan > 0 ? Math.ceil(completingKalan / (settings?.bidonKapasite || 17)) : 0

  return (
    <>
      <Topbar title="İşlemdeki Siparişler" subtitle={aktif.length + ' aktif sipariş'} />
      <div className="content">
        <div className="grid grid-3">
          {['kuyrukta', 'yikamada', 'preste'].map(function (d) {
            var count = aktif.filter(function (s) { return s.durum === d }).length
            return (
              <div key={d} className="stat">
                <span className="label">{d === 'kuyrukta' ? 'Kuyrukta' : d === 'yikamada' ? 'Yıkamada' : 'Preste'}</span>
                <span className="value">{count}</span>
              </div>
            )
          })}
        </div>

        {completing && (
          <div className="card" style={{ borderColor: 'var(--accent)', borderWidth: 2 }}>
            <div className="card-head"><h3>Siparişi Tamamla: {completing.kod}</h3></div>
            <div className="fld-row-3">
              <div className="field">
                <label>Zeytin ({units.agirlik})</label>
                <input value={completing.zeytinKg || 0} readOnly style={{ background: 'var(--bg-2)' }} />
              </div>
              <div className="field">
                <label>Çıkan Yağ ({units.yag}) *</label>
                <div className="row" style={{ gap: 6 }}>
                  <input type="number" step="0.1" value={completing.cikanYag}
                    onChange={function (e) { setCompleting(Object.assign({}, completing, { cikanYag: e.target.value })) }}
                    placeholder="örn. 232" autoFocus style={{ flex: 1, fontSize: 16 }} />
                  <VoiceInput isNumber onResult={function (v) { setCompleting(Object.assign({}, completing, { cikanYag: String(v) })) }} />
                </div>
              </div>
              <div className="field">
                <label>Asit (Dizem)</label>
                <div className="row" style={{ gap: 6 }}>
                  <input type="number" step="0.01" value={completing.asit}
                    onChange={function (e) { setCompleting(Object.assign({}, completing, { asit: e.target.value })) }}
                    placeholder="örn. 0.48" style={{ flex: 1 }} />
                  <VoiceInput isNumber onResult={function (v) { setCompleting(Object.assign({}, completing, { asit: String(v) })) }} />
                </div>
              </div>
            </div>
            {cikanYagNum > 0 && (
              <div className="kv-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', marginTop: 12, padding: '10px 14px', background: 'var(--bg-2)', borderRadius: 8 }}>
                <div className="kv"><div className="k">Oran</div><div className="v mono">% {fmt.num(completingOran, 1)}</div></div>
                <div className="kv"><div className="k">Hak Yağı (%{settings?.hakYagOran || 10})</div><div className="v">{fmt.num(completingHak, 1)} {units.yag}</div></div>
                <div className="kv"><div className="k">Kalan Yağ</div><div className="v">{fmt.num(completingKalan, 1)} {units.yag}</div></div>
                <div className="kv"><div className="k">Tahmini Bidon</div><div className="v">{completingAutoBidon}</div></div>
              </div>
            )}
            <div className="fld-row" style={{ marginTop: 12 }}>
              <div className="field">
                <label>Bidon Sayısı (Otomatik: {completingAutoBidon})</label>
                <input type="number" value={completing.bidon}
                  onChange={function (e) { setCompleting(Object.assign({}, completing, { bidon: e.target.value })) }}
                  placeholder={completingAutoBidon ? String(completingAutoBidon) : '—'} />
              </div>
            </div>
            <div className="divider"></div>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn ghost" onClick={function () { setCompleting(null) }}>İptal</button>
              <button className="btn primary" style={{ padding: '12px 24px', fontSize: 15 }} onClick={handleComplete}>Tamamla ve Kaydet</button>
            </div>
          </div>
        )}

        {editing && (
          <div className="card" style={{ borderColor: 'var(--warn)', borderWidth: 2 }}>
            <div className="card-head"><h3>Hızlı Düzenle: {editing.kod}</h3></div>
            <div className="fld-row-3">
              <div className="field">
                <label>Zeytin ({units.agirlik})</label>
                <input type="number" value={editing.zeytinKg}
                  onChange={function (e) { setEditing(Object.assign({}, editing, { zeytinKg: e.target.value })) }}
                  style={{ fontSize: 16 }} />
              </div>
              <div className="field">
                <label>Çuval</label>
                <input type="number" value={editing.cuval || ''}
                  onChange={function (e) { setEditing(Object.assign({}, editing, { cuval: e.target.value })) }} />
              </div>
              <div className="field">
                <label>Operatör</label>
                <input value={editing.operator || ''}
                  onChange={function (e) { setEditing(Object.assign({}, editing, { operator: e.target.value })) }} />
              </div>
            </div>
            <div className="field" style={{ marginTop: 8 }}>
              <label>Not</label>
              <div className="row" style={{ gap: 6 }}>
                <input value={editing.not || ''}
                  onChange={function (e) { setEditing(Object.assign({}, editing, { not: e.target.value })) }}
                  placeholder="Sipariş notu…" style={{ flex: 1 }} />
                <VoiceInput onResult={function (t) { setEditing(Object.assign({}, editing, { not: (editing.not ? editing.not + ' ' : '') + t })) }} />
              </div>
            </div>
            <div className="divider"></div>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn ghost" onClick={function () { setEditing(null) }}>İptal</button>
              <button className="btn primary" onClick={handleInlineEdit}>Kaydet</button>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-head">
            <h3>Aktif Siparişler</h3>
          </div>
          {sorted.length === 0 ? (
            <div className="empty">Aktif sipariş yok</div>
          ) : (
            <div className="aktif-list">
              {sorted.map(function (s) {
                var m = ms(s.musteriId)
                return (
                  <div key={s.id} className="aktif-item" style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 10,
                    background: 'var(--surface)', border: '1px solid var(--line)',
                    marginBottom: 8, cursor: 'pointer',
                  }} onClick={function () { if (onOpenOrder) onOpenOrder(s) }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="bold" style={{ fontSize: 15 }}>{m?.ad || '—'}</div>
                      <div className="tiny muted" style={{ marginTop: 2 }}>{m?.koy} · {tur(s.tur)?.ad} · {fmt.num(s.zeytinKg, 0)} {units.agirlik}</div>
                    </div>
                    <StatusBadge status={s.durum} />
                    <div className="row" style={{ gap: 6, flexShrink: 0 }}>
                      <button className="btn sm" onClick={function (e) {
                        e.stopPropagation()
                        setEditing({ id: s.id, kod: s.kod, zeytinKg: s.zeytinKg, cuval: s.cuval, operator: s.operator, not: s.not })
                      }} title="Düzenle">
                        <Icon name="edit" size={14} />
                      </button>
                      {s.durum !== 'preste' && (
                        <button className="btn sm primary" onClick={function (e) { handleQuickNext(e, s) }}
                          style={{ minWidth: 110, justifyContent: 'center' }}>
                          {durumLabel[s.durum]}
                        </button>
                      )}
                      {s.durum === 'preste' && (
                        <button className="btn sm primary" onClick={function (e) { handleDurum(e, s, 'tamamlandi') }}
                          style={{ minWidth: 110, justifyContent: 'center', background: 'var(--good)', borderColor: 'var(--good)' }}>
                          Tamamla
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

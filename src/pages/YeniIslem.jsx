import { useState, useMemo } from 'react'
import { Topbar } from '../components/Layout'
import Icon from '../components/Icon'
import VoiceInput from '../components/VoiceInput'
import PrintCard from '../components/PrintCard'
import { fmt, initialsOf } from '../lib/fmt'
import { ZEYTIN_TURLERI, KOYLER, FIRMA } from '../lib/constants'
import { useMusteriler } from '../hooks/useFirestore'
import { musteriler as musteriDb, siparisler as siparisDb, hareketler as hareketDb } from '../lib/firestore'

export default function YeniIslem({ units, currency, settings, hesapla }) {
  var musterilerHook = useMusteriler()
  var musteriler = musterilerHook.data
  var [step, setStep] = useState(1)
  var [musteri, setMusteri] = useState(null)
  var [filter, setFilter] = useState('')
  var [cardStyle, setCardStyle] = useState(settings?.cardDefault || 'klasik')
  var [saving, setSaving] = useState(false)
  var [saved, setSaved] = useState(false)
  var [showNewForm, setShowNewForm] = useState(false)
  var [newM, setNewM] = useState({ ad: '', tel: '', koy: KOYLER[0] })

  var hakOran = settings?.hakYagOran ?? 10

  var [form, setForm] = useState({
    tur: 'memecik', zeytinKg: '', cikanYag: '', asit: '', bidon: '', cuval: '', not: '',
    islemTur: 'sikim',
    litre: '', kgFiyat: settings?.yagSatisFiyat || 240,
  })

  var zeytinKg = Number(form.zeytinKg) || 0
  var cikanYag = Number(form.cikanYag) || 0
  var asit = Number(form.asit) || 0
  var bidonKapasite = settings?.bidonKapasite || 17
  var oran = hesapla ? hesapla.oran(zeytinKg, cikanYag) : (zeytinKg > 0 ? +(cikanYag / zeytinKg * 100).toFixed(2) : 0)
  var hakYag = hesapla ? hesapla.hakYag(cikanYag) : +(cikanYag * (hakOran / 100)).toFixed(2)
  var kalanYag = hesapla ? hesapla.kalanYag(cikanYag) : +(cikanYag - hakYag).toFixed(2)
  var tur = ZEYTIN_TURLERI.find(function (t) { return t.id === form.tur })

  // Auto bidon calculation
  var autoBidon = cikanYag > 0 && kalanYag > 0 ? Math.ceil(kalanYag / bidonKapasite) : 0

  var litre = Number(form.litre) || 0
  var kgFiyat = Number(form.kgFiyat) || 0
  var tutar = +(litre * kgFiyat).toFixed(2)

  var siparisPreview = {
    kod: 'S-YENİ',
    tarih: new Date().toISOString().slice(0, 10),
    saat: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    tur: form.tur, zeytinKg: zeytinKg, cikanYag: cikanYag, hakYagKg: hakYag, kalanYagKg: kalanYag,
    oran: oran, asit: asit, bidon: Number(form.bidon) || autoBidon || null, cuval: Number(form.cuval) || null,
  }

  var filteredM = useMemo(function () {
    if (!filter) return musteriler.slice(0, 20)
    var f = filter.toLowerCase()
    return musteriler.filter(function (m) {
      return (m.ad && m.ad.toLowerCase().indexOf(f) !== -1) ||
        (m.tel && m.tel.indexOf(filter) !== -1) ||
        (m.koy && m.koy.toLowerCase().indexOf(f) !== -1)
    })
  }, [musteriler, filter])

  var exactMatch = filter.trim().length > 0 && filteredM.some(function (m) {
    return m.ad && m.ad.toLowerCase() === filter.trim().toLowerCase()
  })

  var isSikim = form.islemTur === 'sikim'

  var handleQuickCreate = async function () {
    if (!filter.trim()) return
    setSaving(true)
    try {
      var kod = 'M-' + String(musteriler.length + 1).padStart(4, '0')
      var id = await musteriDb.add({
        kod: kod, ad: filter.trim(), tel: newM.tel || '', koy: newM.koy || KOYLER[0],
        adres: '', notlar: '', durum: 'aktif', uyelik: new Date().toISOString().slice(0, 10),
      })
      var created = { id: id, kod: kod, ad: filter.trim(), tel: newM.tel, koy: newM.koy || KOYLER[0] }
      setMusteri(created)
      setStep(2)
      setShowNewForm(false)
      setNewM({ ad: '', tel: '', koy: KOYLER[0] })
    } catch (e) { alert('Hata: ' + e.message) }
    setSaving(false)
  }

  var handleAddFull = async function () {
    if (!newM.ad.trim()) return alert('İsim soyisim zorunlu')
    setSaving(true)
    try {
      var kod = 'M-' + String(musteriler.length + 1).padStart(4, '0')
      var id = await musteriDb.add({
        kod: kod, ad: newM.ad.trim(), tel: newM.tel.trim(), koy: newM.koy,
        adres: '', notlar: '', durum: 'aktif', uyelik: new Date().toISOString().slice(0, 10),
      })
      setMusteri({ id: id, kod: kod, ad: newM.ad.trim(), tel: newM.tel.trim(), koy: newM.koy })
      setStep(2)
      setShowNewForm(false)
      setNewM({ ad: '', tel: '', koy: KOYLER[0] })
    } catch (e) { alert('Hata: ' + e.message) }
    setSaving(false)
  }

  var handleSave = async function () {
    if (!musteri || saving) return
    setSaving(true)
    try {
      if (isSikim) {
        var sipKod = 'S-' + Date.now().toString(36).toUpperCase()
        await siparisDb.add({
          kod: sipKod, musteriId: musteri.id, musteriKod: musteri.kod,
          tarih: siparisPreview.tarih, saat: siparisPreview.saat,
          tur: form.tur, zeytinKg: zeytinKg, cikanYag: cikanYag || null,
          hakYagKg: hakYag || null, kalanYagKg: kalanYag || null,
          oran: oran || null, asit: asit || null,
          bidon: Number(form.bidon) || autoBidon || null, cuval: Number(form.cuval) || null,
          durum: cikanYag ? 'tamamlandi' : 'kuyrukta',
          operator: settings?.varsayilanOperator || 'Mustafa', not: form.not,
        })
      } else {
        var harKod = 'H-' + Date.now().toString(36).toUpperCase()
        await hareketDb.add({
          kod: harKod, musteriId: musteri.id, musteriKod: musteri.kod,
          tarih: new Date().toISOString().slice(0, 10), tur: form.islemTur,
          litre: litre || 0,
          kgFiyat: (form.islemTur === 'satis' || form.islemTur === 'alis') ? kgFiyat : null,
          tutar: (form.islemTur === 'satis' || form.islemTur === 'alis') ? tutar : null,
          bidonNo: [], not: form.not,
        })
      }
      setSaved(true)
      setTimeout(function () {
        setSaved(false); setStep(1); setMusteri(null); setFilter('')
        setForm({ tur: 'memecik', zeytinKg: '', cikanYag: '', asit: '', bidon: '', cuval: '', not: '', islemTur: 'sikim', litre: '', kgFiyat: settings?.yagSatisFiyat || 240 })
      }, 1500)
    } catch (e) { alert('Hata: ' + e.message) }
    setSaving(false)
  }

  var cardStyles = ['klasik', 'modern', 'termal', 'minimal', 'detayli', 'renkli']
  var cardLabels = { klasik: 'Klasik', modern: 'Modern', termal: 'Termal', minimal: 'Minimal', detayli: 'Detaylı', renkli: 'Renkli' }

  return (
    <>
      <Topbar title="Yeni İşlem" subtitle="Sıkım, emanet, alış-satış işlemleri"
        actions={<button className="btn" onClick={function () { setStep(1); setMusteri(null); setSaved(false); setFilter('') }}><Icon name="arrow" style={{ transform: 'scaleX(-1)' }} /> Baştan</button>} />
      <div className="content">
        <div className="steps">
          <div className={'step ' + (step >= 1 ? 'active' : '') + ' ' + (step > 1 ? 'done' : '')}><span className="n">{step > 1 ? '✓' : '1'}</span><span>Müşteri Seç</span></div>
          <div className="step-line"></div>
          <div className={'step ' + (step >= 2 ? 'active' : '') + ' ' + (step > 2 ? 'done' : '')}><span className="n">{step > 2 ? '✓' : '2'}</span><span>İşlem Bilgileri</span></div>
          <div className="step-line"></div>
          <div className={'step ' + (step >= 3 ? 'active' : '')}><span className="n">3</span><span>{isSikim ? 'Kart & Yazdırma' : 'Özet & Kaydet'}</span></div>
        </div>

        {step === 1 && (
          <div className="card">
            <div className="card-head">
              <div><h3>Müşteri Seç veya Ekle</h3><div className="muted tiny" style={{ marginTop: 4 }}>İsim yazın — mevcut müşteriler listelenir, yoksa hızlıca yeni ekleyin</div></div>
            </div>
            <div className="row" style={{ gap: 8, marginBottom: 16 }}>
              <div className="search" style={{ flex: 1 }}>
                <Icon name="search" size={14} />
                <input placeholder="İsim, telefon veya köy…" value={filter} onChange={function (e) { setFilter(e.target.value) }} autoFocus style={{ fontSize: 16 }} />
              </div>
              <VoiceInput onResult={function (t) { setFilter(t) }} className="voice-search" />
            </div>

            {filter.trim() && !exactMatch && filteredM.length === 0 && (
              <div className="card" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon name="plus" size={20} />
                  <div style={{ flex: 1 }}>
                    <div className="bold">"{filter.trim()}" bulunamadı</div>
                    <div className="tiny muted">Hızlı ekle veya detaylı form açın</div>
                  </div>
                  <button className="btn primary" onClick={handleQuickCreate} disabled={saving}>
                    Hızlı Ekle & Devam
                  </button>
                  <button className="btn" onClick={function () { setShowNewForm(true); setNewM({ ad: filter.trim(), tel: '', koy: KOYLER[0] }) }}>
                    Detaylı Ekle
                  </button>
                </div>
              </div>
            )}

            {filter.trim() && !exactMatch && filteredM.length > 0 && (
              <div className="card" style={{ background: 'var(--bg-2)', padding: '8px 14px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="tiny muted" style={{ flex: 1 }}>Listede yok mu?</div>
                  <button className="btn sm primary" onClick={handleQuickCreate} disabled={saving}>
                    <Icon name="plus" size={12} /> "{filter.trim()}" Hızlı Ekle
                  </button>
                </div>
              </div>
            )}

            {showNewForm && (
              <div className="card" style={{ borderColor: 'var(--accent)', borderWidth: 2, marginBottom: 16 }}>
                <div className="card-head"><h3>Yeni Müşteri — Detaylı</h3></div>
                <div className="fld-row">
                  <div className="field" style={{ flex: 2 }}><label>İsim Soyisim *</label>
                    <div className="row" style={{ gap: 8 }}>
                      <input style={{ flex: 1, fontSize: 16 }} value={newM.ad} onChange={function (e) { setNewM(Object.assign({}, newM, { ad: e.target.value })) }} placeholder="Ahmet Yılmaz" autoFocus />
                      <VoiceInput onResult={function (t) { setNewM(Object.assign({}, newM, { ad: t })) }} />
                    </div>
                  </div>
                  <div className="field"><label>Telefon</label>
                    <input value={newM.tel} onChange={function (e) { setNewM(Object.assign({}, newM, { tel: e.target.value })) }} placeholder="0532 000 00 00" />
                  </div>
                  <div className="field"><label>Köy</label>
                    <select value={newM.koy} onChange={function (e) { setNewM(Object.assign({}, newM, { koy: e.target.value })) }}>
                      {KOYLER.map(function (k) { return <option key={k}>{k}</option> })}
                    </select>
                  </div>
                </div>
                <div className="divider"></div>
                <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
                  <button className="btn ghost" onClick={function () { setShowNewForm(false) }}>İptal</button>
                  <button className="btn primary" onClick={handleAddFull} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Ekle & Devam'}</button>
                </div>
              </div>
            )}

            {filteredM.length > 0 && (
              <div className="musteri-list">
                {filteredM.slice(0, 15).map(function (m) {
                  return (
                    <div key={m.id}
                      className={'musteri-item' + (musteri?.id === m.id ? ' active' : '')}
                      onClick={function () { setMusteri(m); setStep(2) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--line)', marginBottom: 6 }}>
                      <div className="avatar" style={{ width: 40, height: 40, fontSize: 14 }}>{initialsOf(m.ad)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="bold" style={{ fontSize: 15 }}>{m.ad}</div>
                        <div className="tiny muted">{m.koy} · {m.tel}</div>
                      </div>
                      <Icon name="arrow" size={16} style={{ color: 'var(--ink-3)' }} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {step === 2 && musteri && (
          <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
            <div className="card">
              <div className="card-head"><h3>İşlem Bilgileri</h3></div>
              <div className="card" style={{ background: 'var(--bg-2)', padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>{initialsOf(musteri.ad)}</div>
                <div style={{ flex: 1 }}><div className="bold">{musteri.ad}</div><div className="tiny muted">{musteri.koy} · {musteri.tel}</div></div>
                <button className="btn sm ghost" onClick={function () { setStep(1) }}><Icon name="edit" size={12} />Değiştir</button>
              </div>

              <div className="field" style={{ marginBottom: 16 }}>
                <label>İşlem Türü</label>
                <div className="row islem-tur-grid" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { id: 'sikim', l: 'Sıkım', d: 'Zeytin getirdi' },
                    { id: 'emanet-birak', l: 'Emanet Bırak', d: 'Yağ emanet' },
                    { id: 'satis', l: 'Satış', d: 'Yağ sat' },
                    { id: 'alis', l: 'Alış', d: 'Yağ al' },
                    { id: 'emanet-cek', l: 'Emanet Çek', d: 'Emanetten çek' },
                    { id: 'iade', l: 'İade', d: 'Yağ iadesi' },
                  ].map(function (o) {
                    return (
                      <button key={o.id} onClick={function () { setForm(Object.assign({}, form, { islemTur: o.id })) }} className="card islem-tur-btn" style={{ padding: '12px 14px', textAlign: 'left', cursor: 'pointer', minWidth: 120, background: form.islemTur === o.id ? 'var(--accent-soft)' : 'var(--surface)', borderColor: form.islemTur === o.id ? 'var(--accent)' : 'var(--line)' }}>
                        <div className="bold" style={{ fontSize: 13 }}>{o.l}</div><div className="tiny muted">{o.d}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {isSikim ? (
                <div className="field-group">
                  <div className="fld-row">
                    <div className="field"><label>Zeytin Türü</label>
                      <select value={form.tur} onChange={function (e) { setForm(Object.assign({}, form, { tur: e.target.value })) }} style={{ fontSize: 15, padding: '10px 12px' }}>
                        {ZEYTIN_TURLERI.map(function (t) { return <option key={t.id} value={t.id}>{t.ad}</option> })}
                      </select>
                    </div>
                    <div className="field"><label>Zeytin ({units.agirlik})</label>
                      <div className="row" style={{ gap: 6 }}>
                        <input type="number" value={form.zeytinKg} onChange={function (e) { setForm(Object.assign({}, form, { zeytinKg: e.target.value })) }} placeholder="örn. 1200" style={{ flex: 1, fontSize: 16 }} />
                        <VoiceInput isNumber onResult={function (v) { setForm(Object.assign({}, form, { zeytinKg: String(v) })) }} />
                      </div>
                    </div>
                  </div>
                  <div className="fld-row-3">
                    <div className="field"><label>Çıkan Yağ ({units.yag})</label>
                      <div className="row" style={{ gap: 6 }}>
                        <input type="number" step="0.1" value={form.cikanYag} onChange={function (e) { setForm(Object.assign({}, form, { cikanYag: e.target.value })) }} placeholder="örn. 232" style={{ flex: 1, fontSize: 16 }} />
                        <VoiceInput isNumber onResult={function (v) { setForm(Object.assign({}, form, { cikanYag: String(v) })) }} />
                      </div>
                    </div>
                    <div className="field"><label>Asit (Dizem)</label>
                      <div className="row" style={{ gap: 6 }}>
                        <input type="number" step="0.01" value={form.asit} onChange={function (e) { setForm(Object.assign({}, form, { asit: e.target.value })) }} placeholder="örn. 0.48" style={{ flex: 1 }} />
                        <VoiceInput isNumber onResult={function (v) { setForm(Object.assign({}, form, { asit: String(v) })) }} />
                      </div>
                    </div>
                    <div className="field"><label>Oran (Otomatik)</label>
                      <input value={oran ? '% ' + oran : ''} readOnly style={{ background: 'var(--bg-2)' }} />
                    </div>
                  </div>
                  <div className="fld-row-3">
                    <div className="field"><label>Hak Yağı (%{hakOran})</label><input value={hakYag || ''} readOnly style={{ background: 'var(--bg-2)' }} /></div>
                    <div className="field"><label>Kalan Yağ</label><input value={kalanYag || ''} readOnly style={{ background: 'var(--bg-2)' }} /></div>
                    <div className="field"><label>Bidon (Otomatik: {autoBidon})</label>
                      <input type="number" value={form.bidon} onChange={function (e) { setForm(Object.assign({}, form, { bidon: e.target.value })) }}
                        placeholder={autoBidon ? String(autoBidon) + ' (' + bidonKapasite + ' ' + units.yag + '/bidon)' : '—'} />
                    </div>
                  </div>
                  <div className="fld-row">
                    <div className="field"><label>Çuval Sayısı</label><input type="number" value={form.cuval} onChange={function (e) { setForm(Object.assign({}, form, { cuval: e.target.value })) }} /></div>
                    <div className="field"><label>Not</label>
                      <div className="row" style={{ gap: 6 }}>
                        <textarea rows={1} value={form.not} onChange={function (e) { setForm(Object.assign({}, form, { not: e.target.value })) }} placeholder="Operatör notu…" style={{ flex: 1 }} />
                        <VoiceInput onResult={function (t) { setForm(Object.assign({}, form, { not: (form.not ? form.not + ' ' : '') + t })) }} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="field-group">
                  <div className="fld-row">
                    <div className="field"><label>Miktar ({units.yag})</label>
                      <div className="row" style={{ gap: 6 }}>
                        <input type="number" step="0.1" value={form.litre} onChange={function (e) { setForm(Object.assign({}, form, { litre: e.target.value })) }} placeholder="örn. 22" style={{ flex: 1, fontSize: 16 }} />
                        <VoiceInput isNumber onResult={function (v) { setForm(Object.assign({}, form, { litre: String(v) })) }} />
                      </div>
                    </div>
                    {(form.islemTur === 'satis' || form.islemTur === 'alis') && (
                      <div className="field"><label>Birim Fiyat ({currency}/{units.yag})</label>
                        <input type="number" step="1" value={form.kgFiyat} onChange={function (e) { setForm(Object.assign({}, form, { kgFiyat: e.target.value })) }} style={{ fontSize: 16 }} />
                      </div>
                    )}
                  </div>
                  {(form.islemTur === 'satis' || form.islemTur === 'alis') && tutar > 0 && (
                    <div className="card" style={{ background: 'var(--accent-soft)', padding: '12px 16px', textAlign: 'center' }}>
                      <div className="tiny muted">TOPLAM TUTAR</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginTop: 4 }}>{fmt.money(tutar, currency)}</div>
                    </div>
                  )}
                  <div className="field"><label>Not</label>
                    <div className="row" style={{ gap: 6 }}>
                      <textarea rows={2} value={form.not} onChange={function (e) { setForm(Object.assign({}, form, { not: e.target.value })) }} placeholder="İşlem notu…" style={{ flex: 1 }} />
                      <VoiceInput onResult={function (t) { setForm(Object.assign({}, form, { not: (form.not ? form.not + ' ' : '') + t })) }} />
                    </div>
                  </div>
                </div>
              )}

              <div className="divider"></div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <button className="btn ghost" onClick={function () { setStep(1) }}><Icon name="arrow" style={{ transform: 'scaleX(-1)' }} /> Geri</button>
                <button className="btn primary" onClick={function () { setStep(3) }}>Devam <Icon name="arrow" /></button>
              </div>
            </div>

            <div className="card" style={{ background: 'var(--bg-2)' }}>
              <div className="card-head"><h3>Canlı Hesap</h3></div>
              {isSikim ? (
                <div className="kv-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="kv"><div className="k">Zeytin</div><div className="v">{fmt.num(zeytinKg, 0)} <span className="tiny muted">{units.agirlik}</span></div></div>
                  <div className="kv"><div className="k">Çıkan Yağ</div><div className="v">{fmt.num(cikanYag, 1)} <span className="tiny muted">{units.yag}</span></div></div>
                  <div className="kv"><div className="k">Oran</div><div className="v mono">% {fmt.num(oran, 1)}</div></div>
                  <div className="kv"><div className="k">Asit</div><div className="v mono">{fmt.num(asit, 2)}</div></div>
                  <div className="kv"><div className="k">Hak Yağı (%{hakOran})</div><div className="v">{fmt.num(hakYag, 1)}</div></div>
                  <div className="kv"><div className="k">Kalan Yağ</div><div className="v">{fmt.num(kalanYag, 1)}</div></div>
                  {autoBidon > 0 && (
                    <div className="kv"><div className="k">Tahmini Bidon</div><div className="v">{autoBidon} <span className="tiny muted">({bidonKapasite} {units.yag}/bidon)</span></div></div>
                  )}
                </div>
              ) : (
                <div className="kv-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="kv"><div className="k">İşlem</div><div className="v" style={{ fontSize: 16 }}>{{
                    'satis': 'Satış', 'alis': 'Alış', 'emanet-birak': 'Emanet Bırak',
                    'emanet-cek': 'Emanet Çek', 'iade': 'İade'
                  }[form.islemTur] || form.islemTur}</div></div>
                  <div className="kv"><div className="k">Miktar</div><div className="v">{fmt.num(litre, 1)} {units.yag}</div></div>
                  {tutar > 0 && <div className="kv"><div className="k">Tutar</div><div className="v">{fmt.money(tutar, currency)}</div></div>}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && musteri && (
          <div className="grid" style={{ gridTemplateColumns: isSikim ? '1.2fr 1fr' : '1fr' }}>
            {isSikim && (
              <div className="card print-area">
                <div className="card-head">
                  <div><h3>Kart Önizleme · 7 × 14 cm</h3><div className="muted tiny" style={{ marginTop: 4 }}>Termal yazıcıya gönderilmek üzere hazır</div></div>
                  <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                    {cardStyles.map(function (s) {
                      return (
                        <button key={s} onClick={function () { setCardStyle(s) }} className={'btn sm ' + (cardStyle === s ? 'primary' : '')}>
                          {cardLabels[s]}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                  <div className="print-card-wrap">
                    <div className="rule">70mm × 140mm — gerçek baskı boyutu</div>
                    <PrintCard stil={cardStyle} firma={FIRMA} musteri={musteri} siparis={siparisPreview} zeytinTuru={tur} units={units} />
                  </div>
                </div>
              </div>
            )}
            {!isSikim && (
              <div className="card">
                <div className="card-head"><h3>İşlem Özeti</h3></div>
                <div className="kv-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                  <div className="kv"><div className="k">Müşteri</div><div className="v" style={{ fontSize: 16 }}>{musteri.ad}</div></div>
                  <div className="kv"><div className="k">İşlem</div><div className="v" style={{ fontSize: 16 }}>{{ 'satis': 'Satış', 'alis': 'Alış', 'emanet-birak': 'Emanet Bırak', 'emanet-cek': 'Emanet Çek', 'iade': 'İade' }[form.islemTur]}</div></div>
                  <div className="kv"><div className="k">Miktar</div><div className="v">{fmt.num(litre, 1)} {units.yag}</div></div>
                  {tutar > 0 && <div className="kv"><div className="k">Tutar</div><div className="v">{fmt.money(tutar, currency)}</div></div>}
                </div>
                {form.not && <div className="muted tiny" style={{ marginTop: 12, fontStyle: 'italic', padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 8 }}>"{form.not}"</div>}
              </div>
            )}
            <div className="col" style={{ gap: 16 }}>
              <div className="card">
                <div className="card-head"><h3>{isSikim ? 'Yazdırma & Kayıt' : 'Kayıt'}</h3></div>
                {isSikim && (
                  <>
                    <div className="field"><label>Yazıcı</label>
                      <select style={{ fontSize: 15, padding: '10px 12px' }}><option>Argox CP-2140 (Termal · 70mm)</option><option>PDF olarak kaydet</option></select>
                    </div>
                    <div className="divider"></div>
                    <button className="btn primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16 }} onClick={function () { handleSave(); window.print() }}>
                      <Icon name="print" /> Yazdır ve Kaydet
                    </button>
                    <div className="divider"></div>
                  </>
                )}
                <button className={'btn ' + (saved ? 'primary' : isSikim ? 'ghost' : 'primary')}
                  style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16 }}
                  onClick={handleSave} disabled={saving || saved}>
                  {saved ? '✓ Kaydedildi!' : saving ? 'Kaydediliyor...' : isSikim ? 'Sadece Kaydet' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

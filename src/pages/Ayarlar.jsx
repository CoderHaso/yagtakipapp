import { useState } from 'react'
import { Topbar } from '../components/Layout'
import Icon from '../components/Icon'
import { FIRMA } from '../lib/constants'
import { fmt } from '../lib/fmt'
import { seedDatabase, clearDatabase } from '../lib/firestore'

const PALETTES = [
  { id: 'toprak', label: 'Toprak & Zeytin', color: '#5b6b3a' },
  { id: 'modern', label: 'Modern Minimal', color: '#1f8a5b' },
  { id: 'koyu', label: 'Koyu Mod', color: '#8fa050' },
  { id: 'klasik', label: 'Klasik Osmanlı', color: '#7a3024' },
]

export default function Ayarlar({ settings, updateSetting, updateMultiple, resetSettings }) {
  const [seeding, setSeeding] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [tab, setTab] = useState('gorunum')

  const handleSeed = async () => {
    if (!confirm('Veritabanına örnek veri yüklenecek. Zaten veri varsa eklenmez. Devam?')) return
    setSeeding(true)
    try {
      const result = await seedDatabase()
      if (result === false) {
        alert('Veritabanında zaten veri var, eklenmedi.')
      } else {
        alert('Örnek veriler yüklendi!')
      }
    } catch (e) {
      alert('Hata: ' + e.message)
    }
    setSeeding(false)
  }

  const handleClear = async () => {
    if (!confirm('DİKKAT: Tüm müşteri, sipariş, hareket ve bidon verileri kalıcı olarak silinecek.\n\nBu işlem geri alınamaz. Devam etmek istiyor musunuz?')) return
    if (!confirm('Son onay: Tüm veriler silinsin mi?')) return
    setClearing(true)
    try {
      await clearDatabase()
      alert('Tüm veriler silindi.')
    } catch (e) {
      alert('Hata: ' + e.message)
    }
    setClearing(false)
  }

  const handleReset = () => {
    if (!confirm('Tüm görünüm ve hesaplama ayarları sıfırlanacak. (Veriler silinmez.) Devam?')) return
    resetSettings()
  }

  return (
    <>
      <Topbar title="Ayarlar" subtitle="Uygulama, hesaplama ve görünüm ayarları" />
      <div className="content">
        <div className="tabs">
          {[
            ['gorunum', 'Görünüm'],
            ['hesaplama', 'Hesaplama & Oranlar'],
            ['birimler', 'Birimler & Fiyat'],
            ['kart', 'Kart Ayarları'],
            ['firma', 'Firma Bilgileri'],
            ['veri', 'Veri Yönetimi'],
          ].map(([id, l]) => (
            <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{l}</button>
          ))}
        </div>

        {tab === 'gorunum' && (
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="card">
              <div className="card-head"><h3>Renk Paleti</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PALETTES.map(p => (
                  <button key={p.id} onClick={() => updateSetting('palette', p.id)}
                    className="card" style={{
                      padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                      background: settings.palette === p.id ? 'var(--accent-soft)' : 'var(--surface)',
                      borderColor: settings.palette === p.id ? 'var(--accent)' : 'var(--line)',
                    }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: p.color, flexShrink: 0 }}></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.label}</div>
                      <div className="tiny muted">{p.id}</div>
                    </div>
                    {settings.palette === p.id && <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontWeight: 600 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h3>Yoğunluk & Sezon</h3></div>
              <div className="field" style={{ marginBottom: 20 }}>
                <label>Arayüz Yoğunluğu</label>
                <div className="row" style={{ gap: 8 }}>
                  {[{ v: 0.85, l: 'Sıkı' }, { v: 1, l: 'Normal' }, { v: 1.15, l: 'Geniş' }].map(d => (
                    <button key={d.v} onClick={() => updateSetting('density', d.v)}
                      className={`btn ${settings.density === d.v ? 'primary' : ''}`}>{d.l}</button>
                  ))}
                </div>
                <div className="hint">Satır ve card'ların dolgu yoğunluğunu belirler</div>
              </div>
              <div className="field" style={{ marginBottom: 20 }}>
                <label>Varsayılan Operatör</label>
                <input value={settings.varsayilanOperator || ''} onChange={e => updateSetting('varsayilanOperator', e.target.value)} placeholder="örn. Mustafa" />
                <div className="hint">Yeni sipariş oluşturulurken otomatik atanır</div>
              </div>
              <div className="field">
                <label>Sezon</label>
                <div className="fld-row">
                  <input value={settings.sezonBaslangic || ''} onChange={e => updateSetting('sezonBaslangic', e.target.value)} placeholder="2026" />
                  <input value={settings.sezonAd || ''} onChange={e => updateSetting('sezonAd', e.target.value)} placeholder="2026–27" />
                </div>
                <div className="hint">Dashboard ve raporlarda kullanılacak sezon bilgisi</div>
              </div>
            </div>
          </div>
        )}

        {tab === 'hesaplama' && (
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="card">
              <div className="card-head"><h3>Hak Yağı Hesaplama</h3></div>
              <div className="field" style={{ marginBottom: 20 }}>
                <label>Hak Yağı Oranı (%)</label>
                <input type="number" step="0.5" min="0" max="100" value={settings.hakYagOran} onChange={e => updateSetting('hakYagOran', Number(e.target.value))} />
                <div className="hint">Çıkan yağın yüzde kaçı hak yağı olarak alınacak</div>
              </div>
              <div className="card" style={{ background: 'var(--bg-2)', padding: 16 }}>
                <div className="tiny muted" style={{ marginBottom: 8 }}>HESAPLAMA ÖRNEĞİ</div>
                <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                  <div>Zeytin: <strong>1.000 kg</strong> → Çıkan Yağ: <strong>200 kg</strong> (% 20 verim)</div>
                  <div>Hak Yağı (%{settings.hakYagOran}): <strong>{(200 * settings.hakYagOran / 100).toFixed(1)} kg</strong></div>
                  <div>Kalan Yağ: <strong>{(200 - 200 * settings.hakYagOran / 100).toFixed(1)} kg</strong></div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h3>Otomatik Hesaplamalar</h3></div>
              <div className="card" style={{ background: 'var(--bg-2)', padding: 16, marginBottom: 16 }}>
                <div className="tiny muted" style={{ marginBottom: 8 }}>FORMÜLLER</div>
                <div style={{ fontSize: 12, lineHeight: 2, fontFamily: 'var(--font-mono)' }}>
                  <div><strong>Oran</strong> = (Çıkan Yağ ÷ Zeytin Kg) × 100</div>
                  <div><strong>Hak Yağı</strong> = Çıkan Yağ × ({settings.hakYagOran} ÷ 100)</div>
                  <div><strong>Kalan Yağ</strong> = Çıkan Yağ − Hak Yağı</div>
                  <div><strong>Satış Tutarı</strong> = Litre × Birim Fiyat</div>
                </div>
              </div>
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Hedef Asit Değeri</label>
                <input type="number" step="0.01" value={settings.varsayilanAsitHedef} onChange={e => updateSetting('varsayilanAsitHedef', Number(e.target.value))} />
                <div className="hint">Bu değerin altındaki ölçümler "iyi" olarak gösterilir</div>
              </div>
              <div className="field">
                <label>Bidon Kapasitesi ({settings.yag})</label>
                <input type="number" step="0.5" min="1" value={settings.bidonKapasite} onChange={e => updateSetting('bidonKapasite', Number(e.target.value))} />
                <div className="hint">Her bidonun standart kapasitesi — bidon hesaplamada ve dolu/yarım/boş eşiğinde kullanılır (%90 ve üstü → dolu, 0 → boş)</div>
              </div>
              <div className="card" style={{ background: 'var(--bg-2)', padding: 14, marginTop: 4 }}>
                <div className="tiny muted" style={{ marginBottom: 8 }}>ÖRNEK HESAPLAMA</div>
                <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                  <div>{fmt.num(settings.bidonKapasite * 3, 1)} {settings.yag} → <strong>3 tam bidon</strong> ({settings.bidonKapasite} {settings.yag} × 3)</div>
                  <div>{fmt.num(settings.bidonKapasite * 2.5, 1)} {settings.yag} → <strong>2 tam + 1 yarım bidon</strong></div>
                  <div>Dolu eşiği: ≥ {fmt.num(settings.bidonKapasite * 0.9, 1)} {settings.yag}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'birimler' && (
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="card">
              <div className="card-head"><h3>Birimler</h3></div>
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Ağırlık Birimi</label>
                <select value={settings.agirlik} onChange={e => updateSetting('agirlik', e.target.value)}>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="ton">Ton</option>
                </select>
              </div>
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Yağ Birimi</label>
                <select value={settings.yag} onChange={e => updateSetting('yag', e.target.value)}>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="lt">Litre (lt)</option>
                </select>
              </div>
              <div className="field">
                <label>Para Birimi</label>
                <select value={settings.currency} onChange={e => updateSetting('currency', e.target.value)}>
                  <option value="₺">Türk Lirası (₺)</option>
                  <option value="€">Euro (€)</option>
                  <option value="$">Dolar ($)</option>
                </select>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h3>Fiyatlandırma</h3></div>
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Sıkım Ücreti ({settings.currency}/{settings.agirlik} zeytin)</label>
                <input type="number" step="0.5" value={settings.sikimUcreti} onChange={e => updateSetting('sikimUcreti', Number(e.target.value))} />
                <div className="hint">0 = Hak yağı sistemi kullanılır (sıkım ücreti alınmaz)</div>
              </div>
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Yağ Satış Fiyatı ({settings.currency}/{settings.yag})</label>
                <input type="number" step="1" value={settings.yagSatisFiyat} onChange={e => updateSetting('yagSatisFiyat', Number(e.target.value))} />
                <div className="hint">Müşteriye yağ satılırken kullanılacak varsayılan fiyat</div>
              </div>
              <div className="field">
                <label>Yağ Alış Fiyatı ({settings.currency}/{settings.yag})</label>
                <input type="number" step="1" value={settings.yagAlisFiyat} onChange={e => updateSetting('yagAlisFiyat', Number(e.target.value))} />
                <div className="hint">Müşteriden yağ alınırken kullanılacak varsayılan fiyat</div>
              </div>
            </div>
          </div>
        )}

        {tab === 'kart' && (
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="card">
              <div className="card-head"><h3>Varsayılan Kart Stili</h3></div>
              <div className="row" style={{ gap: 8, marginBottom: 20 }}>
                {['klasik', 'modern', 'termal'].map(s => (
                  <button key={s} onClick={() => updateSetting('cardDefault', s)}
                    className={`btn ${settings.cardDefault === s ? 'primary' : ''}`} style={{ flex: 1, justifyContent: 'center' }}>
                    {s === 'klasik' ? 'Klasik' : s === 'modern' ? 'Modern' : 'Termal'}
                  </button>
                ))}
              </div>
              <div className="tiny muted">Yeni işlem oluşturulurken varsayılan olarak seçilecek kart stili</div>
            </div>
            <div className="card">
              <div className="card-head"><h3>Kart İçerik Ayarları</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { key: 'showHakYag', label: 'Hak Yağı göster' },
                  { key: 'showAsit', label: 'Asit (Dizem) göster' },
                  { key: 'showOran', label: 'Verim Oranı göster' },
                  { key: 'showBidonCuval', label: 'Bidon / Çuval göster' },
                  { key: 'showKoyAdres', label: 'Köy & Adres göster' },
                  { key: 'showIletisim', label: 'İletişim göster' },
                ].map(o => (
                  <label key={o.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={settings[o.key]} onChange={e => updateSetting(o.key, e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
                    {o.label}
                  </label>
                ))}
              </div>
              <div className="tiny muted" style={{ marginTop: 12 }}>Basılacak kartta hangi alanların görüneceğini belirler</div>
            </div>
          </div>
        )}

        {tab === 'firma' && (
          <div className="card">
            <div className="card-head"><h3>Firma Bilgileri</h3></div>
            <div className="kv-grid">
              <div className="kv"><div className="k">Firma Adı</div><div className="v" style={{ fontSize: 16 }}>{FIRMA.ad}</div></div>
              <div className="kv"><div className="k">Alt Başlık</div><div className="v" style={{ fontSize: 16 }}>{FIRMA.alt}</div></div>
              <div className="kv"><div className="k">Telefon</div><div className="v" style={{ fontSize: 16 }}>{FIRMA.tel}</div></div>
              <div className="kv"><div className="k">GSM</div><div className="v" style={{ fontSize: 16 }}>{FIRMA.gsm}</div></div>
            </div>
            <div className="divider"></div>
            <div className="kv-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="kv"><div className="k">Adres</div><div className="v" style={{ fontSize: 14 }}>{FIRMA.adres}</div></div>
              <div className="kv"><div className="k">Vergi</div><div className="v" style={{ fontSize: 14 }}>{FIRMA.vergi}</div></div>
            </div>
            <div className="tiny muted" style={{ marginTop: 16 }}>Firma bilgilerini değiştirmek için src/lib/constants.js dosyasını düzenleyin</div>
          </div>
        )}

        {tab === 'veri' && (
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="card">
              <div className="card-head"><h3>Örnek Veri</h3></div>
              <button className="btn" onClick={handleSeed} disabled={seeding}
                style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                <Icon name="plus" /> {seeding ? 'Yükleniyor…' : 'Örnek Veri Yükle'}
              </button>
              <div className="tiny muted" style={{ marginTop: 8 }}>
                12 müşteri, 10 sipariş, 5 hareket ve 48 bidon verisi yükler. <strong>Zaten veri varsa hiçbir şey eklenmez.</strong>
              </div>
            </div>
            <div className="card" style={{ borderColor: 'var(--bad)', borderWidth: 1.5 }}>
              <div className="card-head"><h3 style={{ color: 'var(--bad)' }}>Tüm Verileri Sil</h3></div>
              <button className="btn" onClick={handleClear} disabled={clearing}
                style={{ width: '100%', justifyContent: 'center', background: 'var(--bad)', color: 'white', border: 0 }}>
                {clearing ? 'Siliniyor…' : '⚠ Tüm Verileri Kalıcı Sil'}
              </button>
              <div className="tiny muted" style={{ marginTop: 8 }}>
                Müşteri, sipariş, hareket ve bidon verilerinin <strong>tamamı Firestore'dan silinir.</strong> Bu işlem geri alınamaz.
              </div>
            </div>
          </div>
        )}
        {tab === 'veri' && (
          <div className="card" style={{ borderColor: 'var(--line)' }}>
            <div className="card-head"><h3>Ayarları Sıfırla</h3></div>
            <button className="btn" onClick={handleReset}
              style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--warn)', color: 'var(--warn)' }}>
              Görünüm & Hesaplama Ayarlarını Sıfırla
            </button>
            <div className="tiny muted" style={{ marginTop: 8 }}>
              Yalnızca <strong>uygulama ayarları</strong> (tema, oranlar, birimler) sıfırlanır. <strong>Veriler silinmez.</strong>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

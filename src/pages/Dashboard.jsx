import { Topbar } from '../components/Layout'
import Icon from '../components/Icon'
import StatusBadge from '../components/StatusBadge'
import { fmt, initialsOf } from '../lib/fmt'
import { ZEYTIN_TURLERI } from '../lib/constants'
import { useMusteriler, useSiparisler, useHareketler, useBidonlar } from '../hooks/useFirestore'

export default function Dashboard({ onNav, onOpenCustomer, onOpenOrder, units, currency, settings }) {
  const { data: musteriler, loading: mLoad } = useMusteriler()
  const { data: siparisler, loading: sLoad } = useSiparisler()
  const { data: hareketler } = useHareketler()
  const { data: bidonlar } = useBidonlar()

  const sezonYil = settings?.sezonBaslangic || '2026'
  const sezonAd = settings?.sezonAd || `${sezonYil}–${String(Number(sezonYil) % 100 + 1).padStart(2, '0')}`
  const asitHedef = settings?.varsayilanAsitHedef ?? 0.50

  if (mLoad || sLoad) {
    return (
      <>
        <Topbar title="Bu Sezon Özeti" subtitle={`Sezon ${sezonAd}`} />
        <div className="content"><div className="empty">Yükleniyor...</div></div>
      </>
    )
  }

  const aktif = siparisler.filter(s => s.durum !== 'tamamlandi')
  const tamamlanan = siparisler.filter(s => s.durum === 'tamamlandi')
  const sezonSip = siparisler.filter(s => s.tarih?.startsWith(sezonYil))

  const totalZeytin = sezonSip.reduce((a, s) => a + (s.zeytinKg || 0), 0)
  const totalYag = sezonSip.reduce((a, s) => a + (s.cikanYag || 0), 0)
  const totalHakYag = sezonSip.reduce((a, s) => a + (s.hakYagKg || 0), 0)
  const asitArr = sezonSip.filter(s => s.asit)
  const ortAsit = asitArr.length ? asitArr.reduce((a, s) => a + s.asit, 0) / asitArr.length : 0
  const oranArr = sezonSip.filter(s => s.oran)
  const ortOran = oranArr.length ? oranArr.reduce((a, s) => a + s.oran, 0) / oranArr.length : 0

  const bidonsDolu = bidonlar.filter(b => b.durum === 'dolu').length
  const bidonsYarim = bidonlar.filter(b => b.durum === 'yarim').length
  const bidonsBos = bidonlar.filter(b => b.durum === 'bos').length

  // Emanet hesabı
  const emanetBirak = hareketler.filter(h => h.tur === 'emanet-birak').reduce((a, h) => a + (h.litre || 0), 0)
  const emanetCek = hareketler.filter(h => h.tur === 'emanet-cek').reduce((a, h) => a + (h.litre || 0), 0)
  const emanetNet = emanetBirak - emanetCek

  const ms = (musteriId) => musteriler.find(m => m.id === musteriId)
  const tur = (tid) => ZEYTIN_TURLERI.find(t => t.id === tid)

  return (
    <>
      <Topbar
        title="Bu Sezon Özeti"
        subtitle={`Sezon ${sezonAd}`}
        actions={
          <div className="row">
            <button className="btn primary" onClick={() => onNav('yeni-islem')}><Icon name="plus" /><span>Yeni İşlem</span></button>
          </div>
        }
      />
      <div className="content">
        <div className="grid grid-4">
          <div className="stat">
            <span className="label">Bu Sezon Zeytin</span>
            <span className="value">{fmt.num(totalZeytin / 1000, 1)} <span style={{ fontSize: 18, color: 'var(--ink-3)' }}>ton</span></span>
            <span className="sub">{fmt.int(totalZeytin)} {units.agirlik}</span>
          </div>
          <div className="stat accent">
            <span className="label">Üretilen Yağ</span>
            <span className="value">{fmt.num(totalYag / 1000, 1)} <span style={{ fontSize: 18, opacity: 0.7 }}>ton</span></span>
            <span className="sub">~{fmt.int(totalYag)} {units.yag}</span>
          </div>
          <div className="stat">
            <span className="label">Ort. Verim Oranı</span>
            <span className="value">% {fmt.num(ortOran, 1)}</span>
            <span className="sub">{sezonSip.length} sipariş</span>
          </div>
          <div className="stat accent-2">
            <span className="label">Ort. Asit (Dizem)</span>
            <span className="value">{fmt.num(ortAsit, 2)}</span>
            <span className="sub" style={{ color: ortAsit <= asitHedef ? 'var(--good)' : 'var(--bad)' }}>
              Hedef: {asitHedef} altı {ortAsit > 0 ? (ortAsit <= asitHedef ? '✓' : '✗') : ''}
            </span>
          </div>
        </div>

        <div className="grid grid-4">
          <div className="stat">
            <span className="label">Hak Yağı (%{settings?.hakYagOran || 10})</span>
            <span className="value">{fmt.num(totalHakYag, 1)}</span>
            <span className="sub">{units.yag}</span>
          </div>
          <div className="stat">
            <span className="label">Emanet Net</span>
            <span className="value">{fmt.num(emanetNet, 1)}</span>
            <span className="sub">{units.yag}</span>
          </div>
          <div className="stat">
            <span className="label">Aktif Müşteri</span>
            <span className="value">{musteriler.length}</span>
          </div>
          <div className="stat">
            <span className="label">Aktif Sipariş</span>
            <span className="value">{aktif.length}</span>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
          <div className="card">
            <div className="card-head">
              <div>
                <h3>İşlemdeki Siparişler</h3>
                <div className="muted tiny" style={{ marginTop: 4 }}>Şu an preste, yıkamada veya kuyrukta bekleyenler</div>
              </div>
              <button className="btn sm ghost" onClick={() => onNav('aktif')}>Tümünü Gör <Icon name="arrow" size={12} /></button>
            </div>
            {aktif.length === 0 ? (
              <div className="empty">Aktif sipariş yok</div>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Müşteri</th><th>Tür</th><th className="right">Zeytin</th><th>Durum</th><th>Operatör</th></tr>
                </thead>
                <tbody>
                  {aktif.slice(0, 8).map(s => {
                    const m = ms(s.musteriId)
                    return (
                      <tr key={s.id} onClick={() => onOpenOrder?.(s)} style={{ cursor: 'pointer' }}>
                        <td className="bold">{m?.ad || '—'}<div className="tiny muted">{m?.koy}</div></td>
                        <td data-label="Tür">{tur(s.tur)?.ad}</td>
                        <td data-label="Zeytin" className="num">{fmt.num(s.zeytinKg, 0)} {units.agirlik}</td>
                        <td data-label="Durum"><StatusBadge status={s.durum} /></td>
                        <td data-label="Operatör" className="muted">{s.operator}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Bidon Durumu</h3>
              <span className="muted tiny">{bidonsDolu} / {bidonlar.length} dolu</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Dolu', val: bidonsDolu },
                { label: 'Yarım', val: bidonsYarim },
                { label: 'Boş', val: bidonsBos },
              ].map(s => (
                <div key={s.label} style={{ padding: '10px 12px', background: 'var(--bg-2)', borderRadius: 8 }}>
                  <div className="tiny muted">{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginTop: 2 }}>{s.val}</div>
                </div>
              ))}
            </div>
            <div className="prog">
              <div className="tiny muted" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Doluluk</span><span>%{bidonlar.length ? Math.round(bidonsDolu / bidonlar.length * 100) : 0}</span>
              </div>
              <div className="pbar"><div className="pfill" style={{ width: `${bidonlar.length ? bidonsDolu / bidonlar.length * 100 : 0}%` }}></div></div>
            </div>
            <button className="btn ghost sm" style={{ marginTop: 16 }} onClick={() => onNav('bidon')}>
              Bidon yönetimine git <Icon name="arrow" size={12} />
            </button>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
          <div className="card">
            <div className="card-head">
              <h3>Son Tamamlanan Siparişler</h3>
            </div>
            {tamamlanan.length === 0 ? (
              <div className="empty">Tamamlanan sipariş yok</div>
            ) : (
              <table className="table tight">
                <thead><tr><th>Müşteri</th><th>Tür</th><th className="right">Zeytin</th><th className="right">Yağ</th><th className="right">Oran</th></tr></thead>
                <tbody>
                  {tamamlanan.slice(0, 6).map(s => {
                    const m = ms(s.musteriId)
                    return (
                      <tr key={s.id} onClick={() => onOpenOrder?.(s)} style={{ cursor: 'pointer' }}>
                        <td className="bold">{m?.ad || '—'}<div className="tiny muted">{m?.koy}</div></td>
                        <td data-label="Tür">{tur(s.tur)?.ad}</td>
                        <td data-label="Zeytin" className="num">{fmt.int(s.zeytinKg)} {units.agirlik}</td>
                        <td data-label="Yağ" className="num bold">{s.cikanYag ? fmt.num(s.cikanYag, 1) + ' ' + units.yag : '—'}</td>
                        <td data-label="Oran" className="num">{s.oran ? '% ' + fmt.num(s.oran, 1) : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Son Hareketler</h3>
              <button className="btn ghost sm" onClick={() => onNav('hareket')}>Hepsi<Icon name="arrow" size={12} /></button>
            </div>
            {hareketler.length === 0 ? (
              <div className="empty">Hareket kaydı yok</div>
            ) : (
              <div className="timeline">
                {hareketler.sort((a, b) => (b.tarih || '').localeCompare(a.tarih || '')).slice(0, 5).map(h => {
                  const m = ms(h.musteriId)
                  return (
                    <div key={h.id} className="tl-item" style={{ gridTemplateColumns: '70px 1fr' }}>
                      <div className="tl-date">{fmt.dateShort(h.tarih)}</div>
                      <div className="tl-body">
                        <div className="tl-title">{m?.ad} <StatusBadge status={h.tur} /></div>
                        <div className="tl-sub">
                          {h.litre} {units.yag}
                          {h.tutar ? ` · ${fmt.money(h.tutar, currency)}` : ''}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

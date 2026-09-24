import { Topbar } from '../components/Layout'
import { fmt } from '../lib/fmt'
import { useBidonlar, useSiparisler, useHareketler } from '../hooks/useFirestore'

export default function Stok({ units, settings }) {
  const { data: bidonlar } = useBidonlar()
  const { data: siparisler } = useSiparisler()
  const { data: hareketler } = useHareketler()

  const sezonYil = settings?.sezonBaslangic || '2026'
  const sezonAd = settings?.sezonAd || `${sezonYil}–${String(Number(sezonYil) % 100 + 1).padStart(2, '0')}`

  const sezon = siparisler.filter(s => s.tarih?.startsWith(sezonYil))
  const totalYag = sezon.reduce((a, s) => a + (s.cikanYag || 0), 0)
  const hakYag = sezon.reduce((a, s) => a + (s.hakYagKg || 0), 0)

  // Emanet hesabı
  const emanetBirak = hareketler.filter(h => h.tur === 'emanet-birak').reduce((a, h) => a + (h.litre || 0), 0)
  const emanetCek = hareketler.filter(h => h.tur === 'emanet-cek').reduce((a, h) => a + (h.litre || 0), 0)
  const emanetNet = emanetBirak - emanetCek

  // Satış / Alış
  const satisLitre = hareketler.filter(h => h.tur === 'satis').reduce((a, h) => a + (h.litre || 0), 0)
  const alisLitre = hareketler.filter(h => h.tur === 'alis').reduce((a, h) => a + (h.litre || 0), 0)

  const bidonDolu = bidonlar.filter(b => b.durum === 'dolu')
  const bidonYarim = bidonlar.filter(b => b.durum === 'yarim')
  const bidonBos = bidonlar.filter(b => b.durum === 'bos')
  const bidonLitre = bidonlar.reduce((a, b) => a + (b.litre || 0), 0)

  // Tahmini mevcut stok: hak yağı + alış - satış - emanet verilen (basit hesaplama)
  const mevcutStok = hakYag + alisLitre - satisLitre

  return (
    <>
      <Topbar title="Stok Yönetimi" subtitle={`Sezon ${sezonAd} · Anlık yağ ve bidon stoku`} />
      <div className="content">
        <div className="grid grid-4">
          <div className="stat accent">
            <span className="label">Hak Yağı (Sezon)</span>
            <span className="value">{fmt.num(hakYag, 1)}</span>
            <span className="sub">{units.yag} (%{settings?.hakYagOran || 10} oran)</span>
          </div>
          <div className="stat">
            <span className="label">Toplam Üretim</span>
            <span className="value">{fmt.num(totalYag, 0)}</span>
            <span className="sub">{units.yag}</span>
          </div>
          <div className="stat accent-2">
            <span className="label">Emanet Net</span>
            <span className="value">{fmt.num(emanetNet, 1)}</span>
            <span className="sub">{units.yag}</span>
          </div>
          <div className="stat">
            <span className="label">Bidon Stok Litre</span>
            <span className="value">{fmt.num(bidonLitre, 0)}</span>
            <span className="sub">{units.yag} ({bidonlar.length} bidon)</span>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <div className="card-head"><h3>Yağ Stok Detayı</h3></div>
            <table className="table">
              <thead><tr><th>Kalem</th><th className="right">Miktar</th><th>Birim</th></tr></thead>
              <tbody>
                <tr><td className="bold">Hak Yağı (Sezon Toplam)</td><td className="num">{fmt.num(hakYag, 1)}</td><td>{units.yag}</td></tr>
                <tr><td className="bold">Satılan Yağ</td><td className="num">{fmt.num(satisLitre, 1)}</td><td>{units.yag}</td></tr>
                <tr><td className="bold">Alınan Yağ</td><td className="num">{fmt.num(alisLitre, 1)}</td><td>{units.yag}</td></tr>
                <tr><td className="bold">Emanet (Net)</td><td className="num">{fmt.num(emanetNet, 1)}</td><td>{units.yag}</td></tr>
                <tr style={{ background: 'var(--accent-soft)' }}>
                  <td className="bold">Tahmini Mevcut Stok</td>
                  <td className="num bold">{fmt.num(mevcutStok, 1)}</td>
                  <td>{units.yag}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-head"><h3>Bidon Durumu</h3></div>
            <table className="table">
              <thead><tr><th>Durum</th><th className="right">Adet</th><th className="right">Toplam Litre</th></tr></thead>
              <tbody>
                <tr>
                  <td className="bold">Dolu</td>
                  <td className="num">{bidonDolu.length}</td>
                  <td className="num">{fmt.num(bidonDolu.reduce((a, b) => a + (b.litre || 0), 0), 1)} {units.yag}</td>
                </tr>
                <tr>
                  <td className="bold">Yarım</td>
                  <td className="num">{bidonYarim.length}</td>
                  <td className="num">{fmt.num(bidonYarim.reduce((a, b) => a + (b.litre || 0), 0), 1)} {units.yag}</td>
                </tr>
                <tr>
                  <td className="bold">Boş</td>
                  <td className="num">{bidonBos.length}</td>
                  <td className="num">—</td>
                </tr>
                <tr style={{ background: 'var(--bg-2)' }}>
                  <td className="bold">Toplam</td>
                  <td className="num bold">{bidonlar.length}</td>
                  <td className="num bold">{fmt.num(bidonLitre, 1)} {units.yag}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

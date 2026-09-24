import { useState, useEffect } from 'react'
import { cihazKimlik, cihazKimlikKaydet, uyumsoft, firmaEksik } from '../../lib/uyumsoft'
import { KESINTI_TURLERI } from '../../lib/efatura'
import Icon from '../Icon'

// ─────────────────────────────────────────────────────────────
// AYARLAR → e-Fatura / e-Müstahsil (Uyumsoft)
// ─────────────────────────────────────────────────────────────

export default function EBelgeAyarlar(props) {
  var s = props.settings
  var set = props.updateSetting
  var [kimlik, setKimlik] = useState(cihazKimlik)
  var [kayitli, setKayitli] = useState(!!cihazKimlik().kullanici)
  var [durum, setDurum] = useState(null)     // sunucu durumu
  var [test, setTest] = useState(null)       // { calisiyor } | sonuç | { hata }

  useEffect(function () {
    uyumsoft('durum', {}, s).then(setDurum).catch(function () { setDurum(null) })
  }, [s.efOrtam])

  function kimlikKaydet() {
    cihazKimlikKaydet(kimlik)
    setKayitli(!!kimlik.kullanici)
    setTest(null)
  }
  function kimlikSil() {
    cihazKimlikKaydet(null)
    setKimlik({ kullanici: '', sifre: '' })
    setKayitli(false)
  }

  async function baglantiTest() {
    setTest({ calisiyor: true })
    try { setTest(await uyumsoft('test', {}, s)) } catch (e) { setTest({ hata: e.message }) }
  }

  function doldur() {
    var f = test && test.firma
    if (!f) return
    var upd = {}
    function al(k, v) { if (v) upd[k] = v }
    al('efVkn', f.vkn); al('efUnvan', f.unvan); al('efVergiDairesi', f.vergiDairesi)
    al('efAdres', f.adres); al('efBinaNo', f.binaNo); al('efIlce', f.ilce); al('efIl', f.il)
    al('efTel', f.tel); al('efEposta', f.eposta); al('efWeb', f.web); al('efMersis', f.mersis); al('efSicil', f.sicil)
    if (f.vkn && f.vkn.length === 11 && (f.ad || f.soyad)) upd.efAdSoyad = [f.ad, f.soyad].filter(Boolean).join(' ')
    props.updateMultiple(upd)
  }

  function txt(key, label, placeholder, attrs) {
    return (
      <div className="fab-row">
        <label className="fab-label">{label}</label>
        <input className="fab-input" value={s[key] || ''} placeholder={placeholder}
          onChange={function (e) { set(key, e.target.value) }} {...attrs} />
      </div>
    )
  }
  function num(key, label, ipucu, step) {
    return (
      <div className="fab-row">
        <label className="fab-label">{label}</label>
        <input className="fab-input" type="number" inputMode="decimal" step={step || 0.1}
          value={s[key]} onChange={function (e) { set(key, Number(e.target.value) || 0) }} />
        {ipucu && <span className="fab-ip">{ipucu}</span>}
      </div>
    )
  }
  function seg(key, label, secenekler, ipucu) {
    return (
      <div className="fab-row wide">
        <label className="fab-label">{label}</label>
        <div className="fab-seg">
          {secenekler.map(function (o) {
            return <button key={String(o.v)} className={s[key] === o.v ? 'on' : ''} onClick={function () { set(key, o.v) }}>{o.ad}</button>
          })}
        </div>
        {ipucu && <span className="fab-ip">{ipucu}</span>}
      </div>
    )
  }

  var eksik = firmaEksik(s)
  var sunucuda = durum && durum.sunucuSifresi
  var sahis = String(s.efVkn || '').replace(/\D/g, '').length === 11

  return (
    <>
      <section className="ayar-blok">
        <h3>e-Fatura / e-Müstahsil · Uyumsoft bağlantısı</h3>
        <div className="fab-grid">
          {seg('efOrtam', 'Ortam', [{ v: 'canli', ad: 'Canlı (gerçek belge)' }, { v: 'test', ad: 'Test (deneme)' }],
            s.efOrtam === 'test'
              ? "Uyumsoft'un ortak test hesabı kullanılır — belgeler GİB'e gitmez, kendi firma verin görünmez."
              : "Kendi Uyumsoft hesabın. Gönderilen belgeler resmidir; denemek için 'Taslak oluştur' kullan.")}
        </div>

        {s.efOrtam !== 'test' && (
          <div className="eb-kimlik">
            {sunucuda
              ? <p className="fab-hint sm"><Icon name="check" size={16} /> Uyumsoft kullanıcı bilgisi sunucuda (Vercel) tanımlı — bu cihazda girmen gerekmez.</p>
              : (
                <>
                  <div className="fab-grid">
                    <div className="fab-row">
                      <label className="fab-label">Web servis kullanıcı adı</label>
                      <input className="fab-input" autoComplete="off" value={kimlik.kullanici} placeholder="ZalaHatun_WebServis"
                        onChange={function (e) { setKimlik(Object.assign({}, kimlik, { kullanici: e.target.value })) }} />
                    </div>
                    <div className="fab-row">
                      <label className="fab-label">Web servis şifresi</label>
                      <input className="fab-input" type="password" autoComplete="new-password" value={kimlik.sifre}
                        onChange={function (e) { setKimlik(Object.assign({}, kimlik, { sifre: e.target.value })) }} />
                    </div>
                  </div>
                  <div className="fab-actions">
                    <button className="fab-btn primary" disabled={!kimlik.kullanici || !kimlik.sifre} onClick={kimlikKaydet}>
                      <Icon name="check" size={20} /> Bu cihazda sakla
                    </button>
                    {kayitli && <button className="fab-btn" onClick={kimlikSil}><Icon name="trash" size={20} /> Cihazdan sil</button>}
                  </div>
                  <span className="fab-ip">Şifre yalnızca bu tablette saklanır, veritabanına yazılmaz. Her tablette bir kez girilir (veya Vercel'e ortam değişkeni olarak eklenir).</span>
                </>
              )}
          </div>
        )}

        <div className="fab-actions">
          <button className="fab-btn" onClick={baglantiTest} disabled={test && test.calisiyor}>
            <Icon name="swap" size={20} /> {test && test.calisiyor ? 'Deneniyor…' : 'Bağlantıyı test et'}
          </button>
          {test && test.firma && <button className="fab-btn primary" onClick={doldur}><Icon name="download" size={20} /> Firma bilgilerini Uyumsoft'tan doldur</button>}
        </div>
        {test && test.hata && <p className="fab-hint bad">{test.hata}</p>}
        {test && test.firma && (
          <p className="fab-hint sm eb-test-ok">
            <b>Bağlantı başarılı</b> ({test.ortam === 'test' ? 'test' : 'canlı'}{test.kaynak === 'sunucu' ? ', sunucu şifresi' : test.kaynak === 'cihaz' ? ', cihaz şifresi' : ''})
            {' · '}{test.firma.unvan || '—'}{test.firma.vkn ? ' · ' + test.firma.vkn : ''}
            {!test.mm && <><br />e-Müstahsil servisine erişilemedi: {test.mmHata}</>}
          </p>
        )}
      </section>

      <section className="ayar-blok">
        <h3>Firma resmi bilgileri {eksik.length > 0 && <em className="eb-durum bad">Eksik: {eksik.join(', ')}</em>}</h3>
        <div className="fab-grid">
          {txt('efVkn', 'VKN / TCKN', '10 veya 11 hane', { inputMode: 'numeric', maxLength: 11 })}
          {txt('efUnvan', 'Ünvan', 'Zala Hatun Zeytinyağı …')}
          {sahis && txt('efAdSoyad', 'Firma sahibi ad soyad', 'Şahıs firması için')}
          {txt('efVergiDairesi', 'Vergi dairesi', 'Milas')}
          {txt('efAdres', 'Adres (cadde / sokak)', 'Çamlıbel Mah. Zeytinli Yol')}
          {txt('efBinaNo', 'Bina no', '7')}
          {txt('efIlce', 'İlçe', 'Milas')}
          {txt('efIl', 'İl', 'Muğla')}
          {txt('efTel', 'Telefon', '')}
          {txt('efEposta', 'E-posta', '')}
          {txt('efWeb', 'Web sitesi', '')}
          {txt('efMersis', 'MERSİS no', 'İsteğe bağlı')}
          {txt('efSicil', 'Ticaret sicil no', 'İsteğe bağlı')}
          {txt('efUrunAd', 'Belgedeki ürün adı', 'Zeytinyağı')}
        </div>
      </section>

      <section className="ayar-blok">
        <h3>Satış faturası</h3>
        <div className="fab-grid">
          {num('efKdvOran', 'KDV oranı (%)', 'Zeytinyağı KDV oranını muhasebecinle teyit et', 1)}
          {seg('efKdvDahil', 'Satış fiyatı', [{ v: true, ad: 'KDV dahil' }, { v: false, ad: 'KDV hariç' }], 'Satış ekranında girilen birim fiyat')}
          {seg('efProfil', 'e-Fatura türü', [{ v: 'TEMELFATURA', ad: 'Temel' }, { v: 'TICARIFATURA', ad: 'Ticari' }], 'Alıcı e-Fatura mükellefiyse. Değilse otomatik e-Arşiv kesilir.')}
          {txt('efSeri', 'Fatura seri öneki', "Boş: Uyumsoft'taki varsayılan seri", { maxLength: 3 })}
        </div>
      </section>

      <section className="ayar-blok">
        <h3>Müstahsil makbuzu kesintileri</h3>
        <div className="fab-grid">
          {KESINTI_TURLERI.map(function (k) {
            return <div key={k.id}>{num(k.ayar, k.ad + ' (%)', k.id === 'stopaj' ? 'Bitkisel ürün genelde %2' : 'Kesilmiyorsa 0', 0.1)}</div>
          })}
          {txt('mmSeri', 'Makbuz seri öneki', "Boş: Uyumsoft'taki varsayılan seri", { maxLength: 3 })}
        </div>
        <span className="fab-ip">Oranlar belge kesilirken brüt tutardan düşülür. Stopaj ve diğer kesinti oranlarını muhasebecinle teyit et.</span>
      </section>
    </>
  )
}

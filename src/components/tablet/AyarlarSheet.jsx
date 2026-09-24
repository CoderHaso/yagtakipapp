import { FIRMA } from '../../lib/constants'
import Icon from '../Icon'
import EBelgeAyarlar from './EBelgeAyarlar'

// ─────────────────────────────────────────────────────────────
// AYARLAR — tablet modunun tamamı tek ekranda
// ─────────────────────────────────────────────────────────────

var KART_STILLERI = [
  { id: 'klasik', ad: 'Klasik' }, { id: 'modern', ad: 'Modern' }, { id: 'termal', ad: 'Termal' },
  { id: 'minimal', ad: 'Minimal' }, { id: 'detayli', ad: 'Detaylı' }, { id: 'renkli', ad: 'Renkli' },
]
var TEMALAR = [
  { id: 'toprak', ad: 'Toprak' }, { id: 'modern', ad: 'Modern' },
  { id: 'koyu', ad: 'Koyu' }, { id: 'klasik', ad: 'Klasik' },
]

export default function AyarlarSheet(props) {
  var s = props.settings
  var set = props.updateSetting

  function num(key, label, ipucu, step) {
    return (
      <div className="fab-row">
        <label className="fab-label">{label}</label>
        <input className="fab-input" type="number" inputMode="decimal" step={step || 1}
          value={s[key]} onChange={function (e) { set(key, Number(e.target.value) || 0) }} />
        {ipucu && <span className="fab-ip">{ipucu}</span>}
      </div>
    )
  }
  function txt(key, label, placeholder) {
    return (
      <div className="fab-row">
        <label className="fab-label">{label}</label>
        <input className="fab-input" value={s[key] || ''} placeholder={placeholder}
          onChange={function (e) { set(key, e.target.value) }} />
      </div>
    )
  }
  function seg(key, label, secenekler, ipucu) {
    return (
      <div className="fab-row wide">
        <label className="fab-label">{label}</label>
        <div className="fab-seg">
          {secenekler.map(function (o) {
            return (
              <button key={String(o.v)} className={s[key] === o.v ? 'on' : ''} onClick={function () { set(key, o.v) }}>
                {o.ad}
              </button>
            )
          })}
        </div>
        {ipucu && <span className="fab-ip">{ipucu}</span>}
      </div>
    )
  }

  return (
    <div className="fab-sheet">
      <div className="fab-sheet-head">
        <button className="fab-icon-btn" onClick={props.onClose}><Icon name="x" size={26} /></button>
        <h2>Ayarlar</h2>
      </div>

      <div className="fab-sheet-body ayarlar">
        <section className="ayar-blok">
          <h3>Üretim</h3>
          <div className="fab-grid">
            {num('hakYagOran', 'Hak yağı oranı (%)', 'Çıkan yağdan kesilen pay')}
            {num('bidonKapasite', 'Bidon kapasitesi', 'Bidon sayısı bundan hesaplanır')}
            {num('varsayilanAsitHedef', 'Hedef asit', 'Bu değerin altı iyi', 0.01)}
            {txt('varsayilanOperator', 'Varsayılan operatör', 'Mustafa')}
            {seg('tabletYikama', 'Yıkama adımı', [{ v: false, ad: 'Yok' }, { v: true, ad: 'Var' }],
              'Yok: Kuyrukta → Preste → Tamamlandı')}
            {seg('tabletTamamGun', 'Tamamlananlar kolonu', [{ v: 1, ad: 'Bugün' }, { v: 3, ad: '3 gün' }, { v: 7, ad: '7 gün' }])}
          </div>
        </section>

        <section className="ayar-blok">
          <h3>Stok ve fiyat</h3>
          <div className="fab-grid">
            {num('yagAlisFiyat', 'Yağ alış fiyatı', 'Alış ekranına hazır gelir')}
            {num('yagSatisFiyat', 'Yağ satış fiyatı', 'Satış ekranına hazır gelir')}
            {seg('yag', 'Yağ birimi', [{ v: 'kg', ad: 'kg' }, { v: 'lt', ad: 'lt' }])}
            {seg('hakYagResmi', 'Hak yağı hangi stokta', [{ v: false, ad: 'Resmi değil' }, { v: true, ad: 'Resmi' }],
              'Fatura kesilmiyorsa resmi değil')}
          </div>
        </section>

        <section className="ayar-blok">
          <h3>Kart</h3>
          <div className="fab-row wide">
            <label className="fab-label">Kart tasarımı</label>
            <div className="fab-chips">
              {KART_STILLERI.map(function (k) {
                return <button key={k.id} className={'fab-chip' + (s.cardDefault === k.id ? ' on' : '')} onClick={function () { set('cardDefault', k.id) }}>{k.ad}</button>
              })}
            </div>
          </div>
          {seg('tabletOtoKart', 'Kayıttan sonra kartı aç', [{ v: true, ad: 'Evet' }, { v: false, ad: 'Hayır' }])}
          <div className="fab-grid">
            {txt('firmaAd', 'Firma adı', FIRMA.ad)}
            {txt('firmaAlt', 'Alt başlık', FIRMA.alt)}
            {txt('firmaTel', 'Telefon (kartta görünür)', FIRMA.tel)}
            {txt('firmaGsm', 'GSM', FIRMA.gsm)}
            <div className="fab-row wide">
              <label className="fab-label">Adres</label>
              <input className="fab-input" value={s.firmaAdres || ''} placeholder={FIRMA.adres}
                onChange={function (e) { set('firmaAdres', e.target.value) }} />
              <span className="fab-ip">Boş bırakılan alanlarda varsayılan bilgi basılır</span>
            </div>
          </div>
        </section>

        <EBelgeAyarlar settings={s} updateSetting={set} updateMultiple={props.updateMultiple} />

        <section className="ayar-blok">
          <h3>Görünüm</h3>
          <div className="fab-row wide">
            <label className="fab-label">Tema</label>
            <div className="fab-chips">
              {TEMALAR.map(function (t) {
                return <button key={t.id} className={'fab-chip' + (s.palette === t.id ? ' on' : '')} onClick={function () { set('palette', t.id) }}>{t.ad}</button>
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

import { fmt } from '../lib/fmt'
import { FIRMA } from '../lib/constants'
import { verimOf } from '../lib/stok'

// Verim = kaç kg zeytinden 1 kg yağ (örn. 5,2)
function verimStr(s) {
  var v = s && s.verim != null ? s.verim : verimOf(s && s.zeytinKg, s && s.cikanYag)
  return v == null ? '—' : fmt.num(v, 2)
}
// Kartın alt şeridinde basılan takip numarası
function takipStr(s) {
  return s && s.takipNo ? String(s.takipNo) : null
}

function PrintCardKlasik({ firma, musteri, siparis, zeytinTuru, units }) {
  var u = units || { agirlik: 'kg', yag: 'kg' }
  var f = firma || FIRMA
  return (
    <div className="pcard klasik">
      <div className="pc-brand">
        <div className="logo">ZH</div>
        <div className="name">{f.ad}</div>
        <div className="sub">{f.alt}</div>
      </div>
      <div className="pc-rows">
        <div className="pc-row"><span className="k">İsim Soyisim</span><span className="v">{musteri?.ad || '—'}</span></div>
        <div className="pc-row"><span className="k">Zeytin (Kg)</span><span className="v big">{fmt.num(siparis?.zeytinKg, 0)}</span></div>
        <div className="pc-row"><span className="k">Zeytin Türü</span><span className="v">{zeytinTuru?.ad || '—'}</span></div>
        <div className="pc-row"><span className="k">Çıkan Yağ</span><span className="v big">{fmt.num(siparis?.cikanYag, 1)} {u.yag}</span></div>
        <div className="pc-row"><span className="k">Hak Yağı</span><span className="v">{fmt.num(siparis?.hakYagKg, 1)} {u.yag}</span></div>
        <div className="pc-row"><span className="k">Kalan Yağ</span><span className="v big">{fmt.num(siparis?.kalanYagKg, 1)} {u.yag}</span></div>
        <div className="pc-row"><span className="k">Verim (kg/kg)</span><span className="v">{verimStr(siparis)}</span></div>
        <div className="pc-row"><span className="k">Asit (Dizem)</span><span className="v">{fmt.num(siparis?.asit, 2)}</span></div>
        <div className="pc-row"><span className="k">Bidon / Çuval</span><span className="v">{siparis?.bidon ?? '—'} / {siparis?.cuval ?? '—'}</span></div>
        <div className="pc-row"><span className="k">Köy & Adres</span><span className="v" style={{ fontSize: '8pt' }}>{musteri?.koy} — {musteri?.adres}</span></div>
        <div className="pc-row"><span className="k">İletişim</span><span className="v">{musteri?.tel}</span></div>
      </div>
      {takipStr(siparis) && <div className="pc-takip">TAKİP NO: <strong>{takipStr(siparis)}</strong></div>}
      <div className="pc-foot">
        <strong>{f.ad}</strong> · {f.tel}<br/>
        {f.adres}
      </div>
    </div>
  )
}

function PrintCardModern({ firma, musteri, siparis, zeytinTuru, units }) {
  var u = units || { agirlik: 'kg', yag: 'kg' }
  var f = firma || FIRMA
  return (
    <div className="pcard modern">
      <div className="pc-head">
        <div className="name">
          {f.ad.split(' ').slice(0, 2).join(' ')}
          <small>{f.alt}</small>
        </div>
        <div className="num">
          <div className="id">{siparis?.kod}</div>
          <div className="date">{fmt.dateShort(siparis?.tarih)}</div>
        </div>
      </div>
      <div className="pc-hero">
        <div className="ad">{musteri?.ad || '—'}</div>
        <div className="koy">{musteri?.koy} · {musteri?.tel}</div>
      </div>
      <div className="pc-stats">
        <div className="cell"><div className="k">Zeytin</div><div className="v">{fmt.num(siparis?.zeytinKg, 0)}</div></div>
        <div className="cell"><div className="k">Tür</div><div className="v" style={{ fontSize: '11pt' }}>{zeytinTuru?.ad || '—'}</div></div>
        <div className="cell hi"><div className="k">Çıkan Yağ</div><div className="v">{fmt.num(siparis?.cikanYag, 1)}</div></div>
        <div className="cell hi"><div className="k">Kalan Yağ</div><div className="v">{fmt.num(siparis?.kalanYagKg, 1)}</div></div>
        <div className="cell"><div className="k">Hak Yağı</div><div className="v mono">{fmt.num(siparis?.hakYagKg, 1)}</div></div>
        <div className="cell"><div className="k">Verim</div><div className="v mono">{verimStr(siparis)}</div></div>
        <div className="cell"><div className="k">Asit</div><div className="v mono">{fmt.num(siparis?.asit, 2)}</div></div>
        <div className="cell"><div className="k">Bidon · Çuval</div><div className="v mono">{siparis?.bidon ?? '—'} · {siparis?.cuval ?? '—'}</div></div>
      </div>
      {takipStr(siparis) && <div className="pc-takip">TAKİP NO: <strong>{takipStr(siparis)}</strong></div>}
      <div className="pc-foot">
        <div className="brand"><strong>{f.ad}</strong><span>{f.tel}</span></div>
        <div style={{ marginTop: '1mm' }}>{f.adres}</div>
      </div>
    </div>
  )
}

function PrintCardTermal({ firma, musteri, siparis, zeytinTuru, units }) {
  var u = units || { agirlik: 'kg', yag: 'kg' }
  var f = firma || FIRMA
  return (
    <div className="pcard termal">
      <div className="t-brand">
        <div className="n">{f.ad.toUpperCase()}</div>
        <div className="s">{f.alt}</div>
      </div>
      <div className="t-meta">
        <span>{siparis?.kod}</span>
        <span>{fmt.dateShort(siparis?.tarih)} {siparis?.saat || ''}</span>
      </div>
      <div className="t-rows">
        <div className="t-row"><span className="k">MÜŞTERİ</span><span className="dots"></span><span className="v">{musteri?.ad}</span></div>
        <div className="t-row"><span className="k">KÖY</span><span className="dots"></span><span className="v">{musteri?.koy}</span></div>
        <div className="t-row"><span className="k">TEL</span><span className="dots"></span><span className="v">{musteri?.tel}</span></div>
        <div className="t-row"><span className="k">TÜR</span><span className="dots"></span><span className="v">{zeytinTuru?.ad}</span></div>
        <div className="t-divider"></div>
        <div className="t-row big"><span className="k">ZEYTİN</span><span className="dots"></span><span className="v">{fmt.num(siparis?.zeytinKg, 0)} {u.agirlik}</span></div>
        <div className="t-row big"><span className="k">ÇIKAN YAĞ</span><span className="dots"></span><span className="v">{fmt.num(siparis?.cikanYag, 1)} {u.yag}</span></div>
        <div className="t-row big"><span className="k">KALAN YAĞ</span><span className="dots"></span><span className="v">{fmt.num(siparis?.kalanYagKg, 1)} {u.yag}</span></div>
        <div className="t-divider"></div>
        <div className="t-row"><span className="k">HAK YAĞI</span><span className="dots"></span><span className="v">{fmt.num(siparis?.hakYagKg, 1)} {u.yag}</span></div>
        <div className="t-row"><span className="k">VERİM</span><span className="dots"></span><span className="v">{verimStr(siparis)}</span></div>
        <div className="t-row"><span className="k">ASİT</span><span className="dots"></span><span className="v">{fmt.num(siparis?.asit, 2)}</span></div>
        <div className="t-row"><span className="k">BİDON</span><span className="dots"></span><span className="v">{siparis?.bidon ?? '—'}</span></div>
        <div className="t-row"><span className="k">ÇUVAL</span><span className="dots"></span><span className="v">{siparis?.cuval ?? '—'}</span></div>
      </div>
      {takipStr(siparis) && <div className="pc-takip termal">TAKİP NO: <strong>{takipStr(siparis)}</strong></div>}
      <div className="t-foot">
        {f.tel} &nbsp;|&nbsp; {f.gsm}<br/>
        {f.adres}
      </div>
    </div>
  )
}

function PrintCardMinimal({ firma, musteri, siparis, zeytinTuru, units }) {
  var u = units || { agirlik: 'kg', yag: 'kg' }
  var f = firma || FIRMA
  return (
    <div className="pcard minimal">
      <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '2mm', marginBottom: '2mm' }}>
        <div style={{ fontSize: '11pt', fontWeight: 700, letterSpacing: '1px' }}>{f.ad.toUpperCase()}</div>
        <div style={{ fontSize: '7pt', color: '#666', marginTop: '1mm' }}>{siparis?.kod} · {fmt.dateShort(siparis?.tarih)} {siparis?.saat || ''}</div>
      </div>
      <div style={{ textAlign: 'center', padding: '2mm 0', borderBottom: '1px dashed #ccc', marginBottom: '2mm' }}>
        <div style={{ fontSize: '12pt', fontWeight: 700 }}>{musteri?.ad}</div>
        <div style={{ fontSize: '8pt', color: '#666' }}>{musteri?.koy} · {musteri?.tel}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5mm 0', borderBottom: '1px solid #eee' }}>
        <span style={{ fontSize: '8pt', color: '#888' }}>ZEYTİN</span>
        <span style={{ fontSize: '10pt', fontWeight: 600 }}>{fmt.num(siparis?.zeytinKg, 0)} {u.agirlik}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5mm 0', borderBottom: '1px solid #eee' }}>
        <span style={{ fontSize: '8pt', color: '#888' }}>TÜR</span>
        <span style={{ fontSize: '9pt' }}>{zeytinTuru?.ad || '—'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', background: '#f5f5f5', margin: '1mm -2mm', paddingLeft: '2mm', paddingRight: '2mm' }}>
        <span style={{ fontSize: '9pt', fontWeight: 600 }}>ÇIKAN YAĞ</span>
        <span style={{ fontSize: '12pt', fontWeight: 700 }}>{fmt.num(siparis?.cikanYag, 1)} {u.yag}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', background: '#f0f0e8', margin: '1mm -2mm', paddingLeft: '2mm', paddingRight: '2mm' }}>
        <span style={{ fontSize: '9pt', fontWeight: 600 }}>KALAN YAĞ</span>
        <span style={{ fontSize: '12pt', fontWeight: 700 }}>{fmt.num(siparis?.kalanYagKg, 1)} {u.yag}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1mm', marginTop: '1mm' }}>
        <div style={{ fontSize: '7pt', color: '#888' }}>Hak Yağı: <strong style={{ color: '#333' }}>{fmt.num(siparis?.hakYagKg, 1)}</strong></div>
        <div style={{ fontSize: '7pt', color: '#888', textAlign: 'right' }}>Verim: <strong style={{ color: '#333' }}>{verimStr(siparis)}</strong></div>
        <div style={{ fontSize: '7pt', color: '#888' }}>Asit: <strong style={{ color: '#333' }}>{fmt.num(siparis?.asit, 2)}</strong></div>
        <div style={{ fontSize: '7pt', color: '#888', textAlign: 'right' }}>Bidon: <strong style={{ color: '#333' }}>{siparis?.bidon ?? '—'}</strong></div>
      </div>
      {takipStr(siparis) && <div className="pc-takip">TAKİP NO: <strong>{takipStr(siparis)}</strong></div>}
      <div style={{ textAlign: 'center', fontSize: '6pt', color: '#999', marginTop: '2mm', paddingTop: '1.5mm', borderTop: '1px solid #ddd' }}>
        {f.tel} · {f.adres}
      </div>
    </div>
  )
}

function PrintCardDetayli({ firma, musteri, siparis, zeytinTuru, units }) {
  var u = units || { agirlik: 'kg', yag: 'kg' }
  var f = firma || FIRMA
  return (
    <div className="pcard detayli">
      <div style={{ background: '#2d3a1a', color: 'white', padding: '3mm', marginBottom: '2mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '10pt', fontWeight: 700 }}>{f.ad}</div>
          <div style={{ fontSize: '7pt', opacity: 0.8 }}>{f.alt}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '7pt', opacity: 0.9 }}>
          <div>{siparis?.kod}</div>
          <div>{fmt.dateShort(siparis?.tarih)} {siparis?.saat || ''}</div>
        </div>
      </div>
      <div style={{ padding: '1mm 2mm' }}>
        <div style={{ display: 'flex', gap: '2mm', marginBottom: '2mm', padding: '2mm', background: '#f8f6f0', borderRadius: '2mm' }}>
          <div style={{ width: '8mm', height: '8mm', borderRadius: '50%', background: '#5b6b3a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7pt', fontWeight: 700, flexShrink: 0 }}>
            {musteri?.ad ? musteri.ad.split(' ').map(function (s) { return s[0] }).join('').slice(0, 2) : '??'}
          </div>
          <div>
            <div style={{ fontSize: '10pt', fontWeight: 600 }}>{musteri?.ad}</div>
            <div style={{ fontSize: '7pt', color: '#888' }}>{musteri?.koy} · {musteri?.tel}</div>
            {musteri?.adres && <div style={{ fontSize: '6pt', color: '#aaa' }}>{musteri.adres}</div>}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '1.5mm 0', color: '#888' }}>Zeytin Türü</td><td style={{ padding: '1.5mm 0', textAlign: 'right', fontWeight: 500 }}>{zeytinTuru?.ad || '—'}</td></tr>
            <tr style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '1.5mm 0', color: '#888' }}>Zeytin Miktarı</td><td style={{ padding: '1.5mm 0', textAlign: 'right', fontWeight: 700, fontSize: '10pt' }}>{fmt.num(siparis?.zeytinKg, 0)} {u.agirlik}</td></tr>
            <tr style={{ background: '#f0f4e8', borderBottom: '1px solid #ddd' }}><td style={{ padding: '2mm 1mm', fontWeight: 600 }}>Çıkan Yağ</td><td style={{ padding: '2mm 1mm', textAlign: 'right', fontWeight: 700, fontSize: '11pt', color: '#2d3a1a' }}>{fmt.num(siparis?.cikanYag, 1)} {u.yag}</td></tr>
            <tr style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '1.5mm 0', color: '#888' }}>Hak Yağı</td><td style={{ padding: '1.5mm 0', textAlign: 'right' }}>{fmt.num(siparis?.hakYagKg, 1)} {u.yag}</td></tr>
            <tr style={{ background: '#f0f4e8', borderBottom: '1px solid #ddd' }}><td style={{ padding: '2mm 1mm', fontWeight: 600 }}>Kalan Yağ</td><td style={{ padding: '2mm 1mm', textAlign: 'right', fontWeight: 700, fontSize: '11pt', color: '#2d3a1a' }}>{fmt.num(siparis?.kalanYagKg, 1)} {u.yag}</td></tr>
            <tr style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '1.5mm 0', color: '#888' }}>Verim (kg/kg)</td><td style={{ padding: '1.5mm 0', textAlign: 'right', fontWeight: 500 }}>{verimStr(siparis)}</td></tr>
            <tr style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '1.5mm 0', color: '#888' }}>Asit (Dizem)</td><td style={{ padding: '1.5mm 0', textAlign: 'right', fontWeight: 500 }}>{fmt.num(siparis?.asit, 2)}</td></tr>
            <tr><td style={{ padding: '1.5mm 0', color: '#888' }}>Bidon / Çuval</td><td style={{ padding: '1.5mm 0', textAlign: 'right' }}>{siparis?.bidon ?? '—'} / {siparis?.cuval ?? '—'}</td></tr>
          </tbody>
        </table>
      </div>
      {takipStr(siparis) && <div className="pc-takip">TAKİP NO: <strong>{takipStr(siparis)}</strong></div>}
      <div style={{ textAlign: 'center', fontSize: '6pt', color: '#999', padding: '1.5mm', borderTop: '1px solid #ddd', marginTop: '1mm' }}>
        {f.tel} · {f.gsm} · {f.web}
      </div>
    </div>
  )
}

function PrintCardRenkli({ firma, musteri, siparis, zeytinTuru, units }) {
  var u = units || { agirlik: 'kg', yag: 'kg' }
  var f = firma || FIRMA
  return (
    <div className="pcard renkli">
      <div style={{ background: 'linear-gradient(135deg, #5b6b3a, #8fa85a)', color: 'white', padding: '3mm', textAlign: 'center' }}>
        <div style={{ fontSize: '11pt', fontWeight: 700, letterSpacing: '0.5px' }}>{f.ad}</div>
        <div style={{ fontSize: '7pt', opacity: 0.85, marginTop: '0.5mm' }}>{f.alt}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5mm 2mm', background: '#f8f8f2', fontSize: '7pt', color: '#888' }}>
        <span>{siparis?.kod}</span>
        <span>{fmt.dateShort(siparis?.tarih)} {siparis?.saat || ''}</span>
      </div>
      <div style={{ padding: '2mm', textAlign: 'center', borderBottom: '2px solid #5b6b3a' }}>
        <div style={{ fontSize: '11pt', fontWeight: 700, color: '#2d3a1a' }}>{musteri?.ad}</div>
        <div style={{ fontSize: '7.5pt', color: '#888' }}>{musteri?.koy} · {musteri?.tel}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, padding: '0 1mm' }}>
        <div style={{ padding: '2mm', borderBottom: '1px solid #eee', borderRight: '1px solid #eee' }}>
          <div style={{ fontSize: '6pt', color: '#999', textTransform: 'uppercase' }}>Zeytin</div>
          <div style={{ fontSize: '10pt', fontWeight: 700 }}>{fmt.num(siparis?.zeytinKg, 0)} <span style={{ fontSize: '7pt', color: '#888' }}>{u.agirlik}</span></div>
        </div>
        <div style={{ padding: '2mm', borderBottom: '1px solid #eee' }}>
          <div style={{ fontSize: '6pt', color: '#999', textTransform: 'uppercase' }}>Tür</div>
          <div style={{ fontSize: '9pt', fontWeight: 500 }}>{zeytinTuru?.ad || '—'}</div>
        </div>
        <div style={{ padding: '2mm', background: '#f0f4e8', borderBottom: '1px solid #d4ddc4', borderRight: '1px solid #d4ddc4' }}>
          <div style={{ fontSize: '6pt', color: '#5b6b3a', textTransform: 'uppercase', fontWeight: 600 }}>Çıkan Yağ</div>
          <div style={{ fontSize: '12pt', fontWeight: 700, color: '#2d3a1a' }}>{fmt.num(siparis?.cikanYag, 1)}</div>
        </div>
        <div style={{ padding: '2mm', background: '#f0f4e8', borderBottom: '1px solid #d4ddc4' }}>
          <div style={{ fontSize: '6pt', color: '#5b6b3a', textTransform: 'uppercase', fontWeight: 600 }}>Kalan Yağ</div>
          <div style={{ fontSize: '12pt', fontWeight: 700, color: '#2d3a1a' }}>{fmt.num(siparis?.kalanYagKg, 1)}</div>
        </div>
        <div style={{ padding: '1.5mm', borderBottom: '1px solid #eee', borderRight: '1px solid #eee' }}>
          <div style={{ fontSize: '6pt', color: '#999' }}>Hak Yağı</div>
          <div style={{ fontSize: '8pt', fontWeight: 600 }}>{fmt.num(siparis?.hakYagKg, 1)}</div>
        </div>
        <div style={{ padding: '1.5mm', borderBottom: '1px solid #eee' }}>
          <div style={{ fontSize: '6pt', color: '#999' }}>Verim</div>
          <div style={{ fontSize: '8pt', fontWeight: 600 }}>{verimStr(siparis)}</div>
        </div>
        <div style={{ padding: '1.5mm', borderRight: '1px solid #eee' }}>
          <div style={{ fontSize: '6pt', color: '#999' }}>Asit</div>
          <div style={{ fontSize: '8pt', fontWeight: 600 }}>{fmt.num(siparis?.asit, 2)}</div>
        </div>
        <div style={{ padding: '1.5mm' }}>
          <div style={{ fontSize: '6pt', color: '#999' }}>Bidon / Çuval</div>
          <div style={{ fontSize: '8pt', fontWeight: 600 }}>{siparis?.bidon ?? '—'} / {siparis?.cuval ?? '—'}</div>
        </div>
      </div>
      {takipStr(siparis) && <div className="pc-takip">TAKİP NO: <strong>{takipStr(siparis)}</strong></div>}
      <div style={{ background: '#5b6b3a', color: 'white', textAlign: 'center', fontSize: '6pt', padding: '1.5mm', marginTop: '1mm' }}>
        {f.tel} · {f.adres}
      </div>
    </div>
  )
}

export default function PrintCard({ stil, ...props }) {
  var s = stil || 'klasik'
  if (s === 'modern') return <PrintCardModern {...props} />
  if (s === 'termal') return <PrintCardTermal {...props} />
  if (s === 'minimal') return <PrintCardMinimal {...props} />
  if (s === 'detayli') return <PrintCardDetayli {...props} />
  if (s === 'renkli') return <PrintCardRenkli {...props} />
  return <PrintCardKlasik {...props} />
}

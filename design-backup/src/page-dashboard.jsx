// Dashboard page
const Dashboard = ({ goto, openCustomer, openOrder, units, currency }) => {
  const D = window.__APP_DATA__;
  const aktif = D.SIPARISLER.filter(s => s.durum !== "tamamlandi");
  const bugun = D.SIPARISLER.filter(s => s.tarih === "2026-11-23" || s.tarih === "2026-11-22");
  const sezon = D.SEASON_DATA[D.SEASON_DATA.length - 1];
  const sezonOnceki = D.SEASON_DATA[D.SEASON_DATA.length - 2];
  const totalZeytin = D.SIPARISLER.filter(s => s.tarih.startsWith("2026")).reduce((a, s) => a + s.zeytinKg, 0);
  const totalYag = D.SIPARISLER.filter(s => s.tarih.startsWith("2026") && s.cikanYag).reduce((a, s) => a + s.cikanYag, 0);
  const ortAsit = (() => {
    const xs = D.SIPARISLER.filter(s => s.tarih.startsWith("2026") && s.asit);
    return xs.reduce((a, s) => a + s.asit, 0) / xs.length;
  })();
  const ortOran = (() => {
    const xs = D.SIPARISLER.filter(s => s.tarih.startsWith("2026") && s.oran);
    return xs.reduce((a, s) => a + s.oran, 0) / xs.length;
  })();
  const bidonsDolu = Object.values(D.BIDON_DURUM).filter(b => b.durum === "dolu").length;
  const bidonsTotal = Object.keys(D.BIDON_DURUM).length;

  // Daily volume for last 14 days (mock)
  const dailyZeytin = [180, 0, 420, 380, 560, 720, 880, 1240, 1420, 0, 1680, 1920, 2480, 2960];
  // Hourly today
  const hourly = [0,0,0,0,0,0,140,420,820,1280,1840,2240,0,0,0,0,0,0,0,0,0,0,0,0];

  const ms = (mid) => D.MUSTERILER.find(m => m.id === mid);
  const tur = (tid) => D.ZEYTIN_TURLERI.find(t => t.id === tid);

  return (
    <>
      <Topbar
        title="Bu Sezon Özeti"
        subtitle="Sezon 2026–27"
        actions={
          <div className="row">
            <button className="btn"><Icon name="download" />Dışa Aktar</button>
            <button className="btn primary" onClick={() => goto("yeni-islem")}><Icon name="plus" />Yeni İşlem</button>
          </div>
        }
      />
      <div className="content">
        {/* Hero stats */}
        <div className="grid grid-4">
          <div className="stat">
            <span className="label">Bu Sezon Zeytin</span>
            <span className="value">{fmt.num(sezon.zeytinTon, 1)} <span style={{fontSize:18,color:"var(--ink-3)"}}>ton</span></span>
            <span className="sub trend up">↑ %{Math.round((sezon.zeytinTon/sezonOnceki.zeytinTon-1)*100)} geçen sezona göre</span>
          </div>
          <div className="stat accent">
            <span className="label">Üretilen Yağ</span>
            <span className="value">{fmt.num(sezon.yagTon, 1)} <span style={{fontSize:18,opacity:0.7}}>ton</span></span>
            <span className="sub">~{fmt.int(sezon.yagTon * 1100)} {units.yag}</span>
          </div>
          <div className="stat">
            <span className="label">Ort. Verim Oranı</span>
            <span className="value">% {fmt.num(sezon.ortOran, 1)}</span>
            <span className="sub">Geçen sezon % {fmt.num(sezonOnceki.ortOran, 1)}</span>
          </div>
          <div className="stat accent-2">
            <span className="label">Ort. Asit (Dizem)</span>
            <span className="value">{fmt.num(sezon.ortAsit, 2)}</span>
            <span className="sub">Hedef: 0.50 altı · ✓ İyi</span>
          </div>
        </div>

        {/* Activity */}
        <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
          <div className="card">
            <div className="card-head">
              <div>
                <h3>İşlemdeki Siparişler</h3>
                <div className="muted tiny" style={{marginTop:4}}>Şu an preste, yıkamada veya kuyrukta bekleyenler</div>
              </div>
              <button className="btn sm ghost" onClick={() => goto("aktif")}>Tümünü Gör <Icon name="arrow" size={12} /></button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Müşteri</th>
                  <th>Sipariş</th>
                  <th>Tür</th>
                  <th className="right">Zeytin</th>
                  <th>Durum</th>
                  <th>Operatör</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {aktif.map(s => {
                  const m = ms(s.musteriId);
                  return (
                    <tr key={s.id} onClick={() => openOrder(s)} style={{cursor:"pointer"}}>
                      <td className="bold">{m?.ad}<div className="tiny muted">{m?.koy}</div></td>
                      <td data-label="Sipariş" className="mono">{s.id}</td>
                      <td data-label="Tür">{tur(s.tur)?.ad}</td>
                      <td data-label="Zeytin" className="num">{fmt.num(s.zeytinKg, 0)} {units.agirlik}</td>
                      <td data-label="Durum"><StatusBadge status={s.durum} /></td>
                      <td data-label="Operatör" className="muted">{s.operator}</td>
                      <td></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Bidon Durumu</h3>
              <span className="muted tiny">{bidonsDolu} / {bidonsTotal} dolu</span>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16}}>
              {[
                { label: "Dolu", val: bidonsDolu, cls: "good" },
                { label: "Yarım", val: Object.values(D.BIDON_DURUM).filter(b => b.durum === "yarim").length, cls: "warn" },
                { label: "Boş", val: Object.values(D.BIDON_DURUM).filter(b => b.durum === "bos").length, cls: "" },
              ].map(s => (
                <div key={s.label} style={{padding:"10px 12px", background:"var(--bg-2)", borderRadius:8}}>
                  <div className="tiny muted">{s.label}</div>
                  <div style={{fontFamily:"var(--font-display)", fontSize:24, marginTop:2}}>{s.val}</div>
                </div>
              ))}
            </div>
            <div className="prog">
              <div className="tiny muted" style={{display:"flex",justifyContent:"space-between"}}>
                <span>Doluluk</span><span>%{Math.round(bidonsDolu/bidonsTotal*100)}</span>
              </div>
              <div className="pbar"><div className="pfill" style={{width:`${bidonsDolu/bidonsTotal*100}%`}}></div></div>
            </div>
            <button className="btn ghost sm" style={{marginTop:16}} onClick={() => goto("bidon")}>
              Bidon yönetimine git <Icon name="arrow" size={12} />
            </button>
          </div>
        </div>

        {/* Daily volume + Recent transactions */}
        <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
          <div className="card">
            <div className="card-head">
              <div>
                <h3>Günlük Sıkım (Son 14 Gün)</h3>
                <div className="muted tiny" style={{marginTop:4}}>Zeytin alımı, {units.agirlik}</div>
              </div>
              <span className="badge accent">Toplam {fmt.int(dailyZeytin.reduce((a,b)=>a+b,0))} {units.agirlik}</span>
            </div>
            <div style={{display:"flex", alignItems:"flex-end", gap:8, height:160, padding:"8px 0"}}>
              {dailyZeytin.map((v, i) => {
                const max = Math.max(...dailyZeytin);
                const isToday = i === dailyZeytin.length - 1;
                return (
                  <div key={i} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6}}>
                    <div style={{
                      width: "100%",
                      height: `${(v/max)*100}%`,
                      background: isToday ? "var(--accent-2)" : "var(--accent)",
                      borderRadius: "4px 4px 0 0",
                      minHeight: v ? 4 : 0,
                      opacity: v ? 1 : 0.2,
                    }} title={`${v} ${units.agirlik}`}></div>
                    <div className="tiny mono" style={{color:"var(--ink-3)"}}>{["10","11","12","13","14","15","16","17","18","19","20","21","22","23"][i]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Son Hareketler</h3>
              <button className="btn ghost sm" onClick={() => goto("hareket")}>Hepsi<Icon name="arrow" size={12} /></button>
            </div>
            <div className="timeline">
              {D.HAREKETLER.slice(0, 5).map(h => {
                const m = ms(h.musteriId);
                return (
                  <div key={h.id} className="tl-item" style={{gridTemplateColumns:"70px 1fr"}}>
                    <div className="tl-date">{fmt.dateShort(h.tarih)}</div>
                    <div className="tl-body">
                      <div className="tl-title">{m?.ad} <StatusBadge status={h.tur} /></div>
                      <div className="tl-sub">
                        {h.litre} {units.yag}
                        {h.tutar && ` · ${fmt.money(h.tutar, currency)}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent customers + Top villages */}
        <div className="grid grid-2">
          <div className="card">
            <div className="card-head">
              <h3>En Aktif Müşteriler · Bu Sezon</h3>
              <button className="btn ghost sm" onClick={() => goto("musteri")}>Tüm Liste<Icon name="arrow" size={12} /></button>
            </div>
            <table className="table tight">
              <thead><tr><th>Müşteri</th><th>Köy</th><th className="right">Toplam Zeytin</th><th className="right">Sipariş</th></tr></thead>
              <tbody>
                {[
                  { mid: "M-0005", zeytin: 2100, sip: 1 },
                  { mid: "M-0001", zeytin: 1280, sip: 1 },
                  { mid: "M-0010", zeytin: 880, sip: 1 },
                  { mid: "M-0006", zeytin: 720, sip: 1 },
                  { mid: "M-0002", zeytin: 640, sip: 1 },
                  { mid: "M-0003", zeytin: 540, sip: 1 },
                ].map(r => {
                  const m = ms(r.mid);
                  return (
                    <tr key={r.mid} onClick={() => openCustomer(m)} style={{cursor:"pointer"}}>
                      <td className="bold">{m?.ad}</td>
                      <td data-label="Köy" className="muted">{m?.koy}</td>
                      <td data-label="Zeytin" className="num">{fmt.int(r.zeytin)} {units.agirlik}</td>
                      <td data-label="Sipariş" className="num">{r.sip}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Köy Bazlı Dağılım</h3>
              <button className="btn ghost sm" onClick={() => goto("koy")}>Detay<Icon name="arrow" size={12} /></button>
            </div>
            <div className="bar-chart">
              {[
                { k: "Çamlıbel", v: 3280 },
                { k: "Karatepe", v: 2100 },
                { k: "Demirciler", v: 760 },
                { k: "Bağyaka", v: 540 },
                { k: "Ulupınar", v: 880 },
                { k: "Akçakaya", v: 720 },
                { k: "Yeniköy", v: 640 },
              ].map(r => {
                const max = 3280;
                return (
                  <div key={r.k} className="bar-row">
                    <span>{r.k}</span>
                    <div className="tr"><div className="bar" style={{width:`${(r.v/max)*100}%`}}></div></div>
                    <span className="val">{fmt.int(r.v)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

Object.assign(window, { Dashboard });

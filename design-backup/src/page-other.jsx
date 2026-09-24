// Remaining pages: aktif siparisler, bidon, hareketler, raporlar, koy, sezon, asit, stok, cari, yazdirma

// ============================================================
// AKTİF SİPARİŞLER
// ============================================================
const AktifSiparisler = ({ openOrder, units }) => {
  const D = window.__APP_DATA__;
  const aktif = D.SIPARISLER.filter(s => s.durum !== "tamamlandi");
  const tamamlanmis = D.SIPARISLER.filter(s => s.durum === "tamamlandi").slice(0, 6);
  return (
    <>
      <Topbar title="İşlemdeki Siparişler" subtitle="Bugünkü canlı durum"
        actions={<button className="btn primary"><Icon name="plus" />Yeni İşlem</button>} />
      <div className="content">
        {/* Pipeline stages */}
        <div className="grid grid-3">
          {[
            { id: "kuyrukta", l: "Kuyrukta", c: "bad" },
            { id: "yikamada", l: "Yıkamada", c: "warn" },
            { id: "preste", l: "Preste", c: "accent" },
          ].map(stage => {
            const items = aktif.filter(s => s.durum === stage.id);
            return (
              <div key={stage.id} className="card" style={{padding: 0}}>
                <div style={{padding: "14px 20px", borderBottom: "1px solid var(--line)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <div className="row" style={{gap: 8}}>
                    <span className={`badge ${stage.c}`}><span className="dot"></span>{stage.l}</span>
                    <span className="muted tiny">{items.length} sipariş</span>
                  </div>
                </div>
                <div style={{padding: 12, display:"flex", flexDirection:"column", gap: 8}}>
                  {items.length === 0 && <div className="empty tiny" style={{padding:16}}>Bu aşamada sipariş yok</div>}
                  {items.map(s => {
                    const m = D.MUSTERILER.find(x => x.id === s.musteriId);
                    return (
                      <div key={s.id} onClick={() => openOrder(s)} style={{padding: 12, background:"var(--bg-2)", borderRadius: 8, cursor:"pointer"}}>
                        <div className="row" style={{justifyContent:"space-between", marginBottom: 6}}>
                          <span className="bold">{m?.ad}</span>
                          <span className="mono tiny muted">{s.id}</span>
                        </div>
                        <div className="row" style={{justifyContent:"space-between", fontSize: 12.5}}>
                          <span className="muted">{D.ZEYTIN_TURLERI.find(t => t.id === s.tur)?.ad}</span>
                          <span className="mono">{fmt.int(s.zeytinKg)} {units.agirlik}</span>
                        </div>
                        <div className="row" style={{marginTop: 8, fontSize: 11.5}}>
                          <Icon name="clock" size={11} />
                          <span className="muted mono">{s.saat}</span>
                          <span className="muted" style={{marginLeft:"auto"}}>{s.operator}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-head"><h3>Bugün Tamamlananlar</h3><span className="muted tiny">{tamamlanmis.length} sipariş</span></div>
          <table className="table">
            <thead><tr><th>Müşteri</th><th>Saat</th><th className="right">Zeytin</th><th className="right">Yağ</th><th className="right">Oran</th><th>Operatör</th><th></th></tr></thead>
            <tbody>
              {tamamlanmis.map(s => {
                const m = D.MUSTERILER.find(x => x.id === s.musteriId);
                return (
                  <tr key={s.id} onClick={() => openOrder(s)} style={{cursor:"pointer"}}>
                    <td className="bold">{m?.ad}<div className="tiny muted">{m?.koy} · {s.id}</div></td>
                    <td data-label="Saat" className="mono">{fmt.dateShort(s.tarih)} {s.saat}</td>
                    <td data-label="Zeytin" className="num">{fmt.int(s.zeytinKg)} {units.agirlik}</td>
                    <td data-label="Yağ" className="num bold">{fmt.num(s.cikanYag, 1)} {units.yag}</td>
                    <td data-label="Oran" className="num">% {fmt.num(s.oran, 1)}</td>
                    <td data-label="Operatör">{s.operator}</td>
                    <td></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ============================================================
// BİDON TAKİBİ
// ============================================================
const BidonTakibi = ({ units }) => {
  const D = window.__APP_DATA__;
  const [filter, setFilter] = React.useState("all");
  const bidons = Object.entries(D.BIDON_DURUM).map(([id, b]) => ({ id, ...b }));
  const filtered = filter === "all" ? bidons : bidons.filter(b => b.durum === filter);
  const totalLitre = bidons.reduce((a, b) => a + b.litre, 0);

  return (
    <>
      <Topbar title="Bidon Takibi" subtitle={`${bidons.length} bidon · ${fmt.int(totalLitre)} ${units.yag} kayıtlı`} />
      <div className="content">
        <div className="grid grid-4">
          <div className="stat"><span className="label">Toplam Bidon</span><span className="value">{bidons.length}</span></div>
          <div className="stat accent"><span className="label">Dolu</span><span className="value">{bidons.filter(b => b.durum === "dolu").length}</span></div>
          <div className="stat accent-2"><span className="label">Yarım</span><span className="value">{bidons.filter(b => b.durum === "yarim").length}</span></div>
          <div className="stat"><span className="label">Boş</span><span className="value">{bidons.filter(b => b.durum === "bos").length}</span></div>
        </div>

        <div className="card">
          <div className="row" style={{marginBottom: 16}}>
            <div className="tabs" style={{borderBottom:0}}>
              {[["all","Tümü"],["dolu","Dolu"],["yarim","Yarım"],["bos","Boş"]].map(([id, l]) => (
                <button key={id} className={`tab ${filter === id ? "active" : ""}`} onClick={() => setFilter(id)}>{l}</button>
              ))}
            </div>
            <div style={{marginLeft:"auto"}}>
              <button className="btn"><Icon name="plus" />Bidon Ekle</button>
            </div>
          </div>
          <div className="bidon-grid">
            {filtered.map(b => {
              const m = D.MUSTERILER.find(x => x.id === b.musteriId);
              const fillPct = b.durum === "dolu" ? 95 : b.durum === "yarim" ? 50 : 0;
              return (
                <div key={b.id} className={`bidon ${b.durum === "dolu" ? "full" : b.durum === "bos" ? "empty" : ""}`}>
                  <div className="bidon-icon" style={{"--fill": fillPct + "%"}}></div>
                  <div className="bidon-id">{b.id}</div>
                  {m ? (
                    <>
                      <div className="bidon-owner">{m.ad.split(" ")[0]}</div>
                      <div className="tiny muted center mono">{b.litre} {units.yag}</div>
                    </>
                  ) : (
                    <div className="tiny muted center">— boş —</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================================
// HAREKETLER
// ============================================================
const Hareketler = ({ units, currency, openCustomer }) => {
  const D = window.__APP_DATA__;
  const [filter, setFilter] = React.useState("all");
  const list = filter === "all" ? D.HAREKETLER : D.HAREKETLER.filter(h => h.tur === filter);

  const totals = {
    emanetBirakilan: D.HAREKETLER.filter(h => h.tur === "emanet-birak").reduce((a, h) => a + h.litre, 0),
    emanetCekilen: D.HAREKETLER.filter(h => h.tur === "emanet-cek").reduce((a, h) => a + h.litre, 0),
    alis: D.HAREKETLER.filter(h => h.tur === "alis").reduce((a, h) => a + h.tutar, 0),
    satis: D.HAREKETLER.filter(h => h.tur === "satis").reduce((a, h) => a + h.tutar, 0),
  };

  return (
    <>
      <Topbar title="Emanet / Alış-Satış Hareketleri"
        actions={<button className="btn primary"><Icon name="plus" />Yeni Hareket</button>} />
      <div className="content">
        <div className="grid grid-4">
          <div className="stat"><span className="label">Toplam Emanet (kalan)</span><span className="value">{fmt.int(totals.emanetBirakilan - totals.emanetCekilen)} <span style={{fontSize:18,color:"var(--ink-3)"}}>{units.yag}</span></span><span className="sub">{totals.emanetBirakilan} bırakıldı · {totals.emanetCekilen} çekildi</span></div>
          <div className="stat accent"><span className="label">Bu Sezon Alış</span><span className="value">{currency}{fmt.int(totals.alis)}</span></div>
          <div className="stat accent-2"><span className="label">Bu Sezon Satış</span><span className="value">{currency}{fmt.int(totals.satis)}</span></div>
          <div className="stat"><span className="label">Net</span><span className="value">{currency}{fmt.int(totals.satis - totals.alis)}</span></div>
        </div>

        <div className="card">
          <div className="tabs" style={{marginBottom:16}}>
            {[["all","Tümü"],["emanet-birak","Emanet Bırakma"],["emanet-cek","Emanet Çekme"],["alis","Alış"],["satis","Satış"]].map(([id, l]) => (
              <button key={id} className={`tab ${filter === id ? "active" : ""}`} onClick={() => setFilter(id)}>{l}</button>
            ))}
          </div>
          <table className="table">
            <thead><tr><th>Müşteri</th><th>Tür</th><th className="right">Miktar</th><th>Bidon</th><th className="right">Kg Fiyat</th><th className="right">Tutar</th><th>Not</th></tr></thead>
            <tbody>
              {list.map(h => {
                const m = D.MUSTERILER.find(x => x.id === h.musteriId);
                return (
                  <tr key={h.id}>
                    <td className="bold tag-clickable" onClick={() => openCustomer(m)}>{m?.ad}<div className="tiny muted">{m?.koy} · {fmt.date(h.tarih)}</div></td>
                    <td data-label="Tür"><StatusBadge status={h.tur} /></td>
                    <td data-label="Miktar" className="num bold">{h.litre} {units.yag}</td>
                    <td data-label="Bidon" className="mono tiny">{h.bidonNo?.length ? h.bidonNo.join(", ") : "—"}</td>
                    <td data-label="Kg Fiyat" className="num">{h.kgFiyat ? fmt.money(h.kgFiyat, currency) : "—"}</td>
                    <td data-label="Tutar" className="num bold">{h.tutar ? fmt.money(h.tutar, currency) : "—"}</td>
                    <td data-label="Not" className="muted tiny">{h.not}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ============================================================
// RAPORLAR
// ============================================================
const Raporlar = ({ units, currency }) => {
  const D = window.__APP_DATA__;
  const turStats = D.ZEYTIN_TURLERI.map(t => ({
    ad: t.ad,
    adet: D.SIPARISLER.filter(s => s.tur === t.id).length,
    zeytin: D.SIPARISLER.filter(s => s.tur === t.id).reduce((a, s) => a + s.zeytinKg, 0),
    yag: D.SIPARISLER.filter(s => s.tur === t.id).reduce((a, s) => a + (s.cikanYag || 0), 0),
  })).filter(s => s.zeytin > 0).sort((a, b) => b.zeytin - a.zeytin);

  return (
    <>
      <Topbar title="Raporlama & Analitik" subtitle="Sezon 2026–27"
        actions={
          <div className="row">
            <select className="btn" style={{padding:"8px 14px"}}><option>Bu Sezon</option><option>Son 30 gün</option><option>Tüm Zamanlar</option></select>
            <button className="btn"><Icon name="download" />PDF</button>
          </div>
        } />
      <div className="content">
        <div className="grid grid-4">
          <div className="stat"><span className="label">Toplam Sıkım</span><span className="value">{fmt.num(28.4, 1)} <span style={{fontSize:18,color:"var(--ink-3)"}}>ton</span></span></div>
          <div className="stat"><span className="label">Yağ Üretimi</span><span className="value">{fmt.num(5.4, 1)} <span style={{fontSize:18,color:"var(--ink-3)"}}>ton</span></span></div>
          <div className="stat"><span className="label">Aktif Müşteri</span><span className="value">67</span></div>
          <div className="stat"><span className="label">Ort. Verim</span><span className="value">% 19.5</span></div>
        </div>

        <div className="grid" style={{gridTemplateColumns:"1.4fr 1fr"}}>
          <div className="card">
            <div className="card-head"><h3>Zeytin Türü Dağılımı</h3></div>
            <div className="bar-chart">
              {turStats.map(t => {
                const max = turStats[0].zeytin;
                return (
                  <div key={t.ad} className="bar-row">
                    <span>{t.ad}</span>
                    <div className="tr"><div className="bar" style={{width: (t.zeytin/max)*100 + "%"}}></div></div>
                    <span className="val">{fmt.int(t.zeytin)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Verim Oranı Dağılımı</h3></div>
            <div className="bar-chart">
              {[
                { k: "% 15-17", v: 4 },
                { k: "% 17-18", v: 8 },
                { k: "% 18-19", v: 18 },
                { k: "% 19-20", v: 24 },
                { k: "% 20-21", v: 12 },
                { k: "% 21+", v: 3 },
              ].map(r => {
                const max = 24;
                return (
                  <div key={r.k} className="bar-row">
                    <span className="mono">{r.k}</span>
                    <div className="tr"><div className="bar" style={{width: (r.v/max)*100 + "%", background: r.k === "% 19-20" ? "var(--accent-2)" : "var(--accent)"}}></div></div>
                    <span className="val">{r.v}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Aylık Performans</h3></div>
          <table className="table">
            <thead><tr><th>Ay</th><th className="right">Sipariş</th><th className="right">Zeytin (ton)</th><th className="right">Yağ (ton)</th><th className="right">Ort. Oran</th><th className="right">Ort. Asit</th><th className="right">Ciro</th></tr></thead>
            <tbody>
              {[
                { ay: "Ekim 2026", sip: 18, z: 8.2, y: 1.5, or: 18.9, as: 0.51, ciro: 142000 },
                { ay: "Kasım 2026", sip: 49, z: 20.2, y: 3.9, or: 19.6, as: 0.45, ciro: 384000 },
              ].map(r => (
                <tr key={r.ay}>
                  <td className="bold">{r.ay}</td>
                  <td data-label="Sipariş" className="num">{r.sip}</td>
                  <td data-label="Zeytin" className="num">{r.z} ton</td>
                  <td data-label="Yağ" className="num bold">{r.y} ton</td>
                  <td data-label="Oran" className="num">% {r.or}</td>
                  <td data-label="Asit" className="num">{r.as}</td>
                  <td data-label="Ciro" className="num">{fmt.money(r.ciro, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ============================================================
// KÖY / BÖLGE
// ============================================================
const KoyBolge = ({ units }) => {
  const D = window.__APP_DATA__;
  const koyStats = D.KOYLER.map(k => {
    const ms = D.MUSTERILER.filter(m => m.koy === k);
    const sips = D.SIPARISLER.filter(s => ms.some(m => m.id === s.musteriId));
    const z = sips.reduce((a, s) => a + s.zeytinKg, 0);
    return { koy: k, musteri: ms.length, sip: sips.length, zeytin: z, yag: sips.reduce((a, s) => a + (s.cikanYag || 0), 0) };
  }).sort((a, b) => b.zeytin - a.zeytin);
  const maxZ = koyStats[0]?.zeytin || 1;

  return (
    <>
      <Topbar title="Köy / Bölge Bazlı Görünüm" subtitle="Sezon 2026–27" />
      <div className="content">
        <div className="card">
          <div className="card-head"><h3>Köy Sıralaması</h3><span className="muted tiny">{koyStats.length} köy</span></div>
          <div className="koy-map">
            {koyStats.map((k, i) => (
              <div key={k.koy} className="koy-card">
                <div className="tiny muted mono">#{String(i+1).padStart(2,"0")}</div>
                <h4>{k.koy}</h4>
                <div className="meta">
                  <span><Icon name="users" size={11} /> {k.musteri}</span>
                  <span><Icon name="list" size={11} /> {k.sip}</span>
                </div>
                <div className="bar-mini"><i style={{width:(k.zeytin/maxZ)*100 + "%"}}></i></div>
                <div className="row" style={{justifyContent:"space-between", marginTop: 4, fontSize:11.5}}>
                  <span className="muted">Zeytin</span>
                  <span className="mono bold">{fmt.int(k.zeytin)} {units.agirlik}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Köy Detay Tablosu</h3></div>
          <table className="table">
            <thead><tr><th>Köy</th><th className="right">Müşteri</th><th className="right">Sipariş</th><th className="right">Toplam Zeytin</th><th className="right">Toplam Yağ</th><th>Pay</th></tr></thead>
            <tbody>
              {koyStats.map(k => (
                <tr key={k.koy}>
                  <td className="bold">{k.koy}</td>
                  <td data-label="Müşteri" className="num">{k.musteri}</td>
                  <td data-label="Sipariş" className="num">{k.sip}</td>
                  <td data-label="Zeytin" className="num">{fmt.int(k.zeytin)} {units.agirlik}</td>
                  <td data-label="Yağ" className="num bold">{fmt.num(k.yag, 1)} {units.yag}</td>
                  <td data-label="Pay" style={{width: 200}}>
                    <div className="bar-mini" style={{flex:1,maxWidth:160}}><i style={{width:(k.zeytin/maxZ)*100 + "%"}}></i></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ============================================================
// SEZON KARŞILAŞTIRMA
// ============================================================
const SezonKarsilastirma = ({ units }) => {
  const D = window.__APP_DATA__;
  const maxZeytin = Math.max(...D.SEASON_DATA.map(s => s.zeytinTon));
  const maxYag = Math.max(...D.SEASON_DATA.map(s => s.yagTon));
  return (
    <>
      <Topbar title="Sezonluk Karşılaştırma" subtitle="6 yıllık performans" />
      <div className="content">
        <div className="card">
          <div className="card-head"><h3>Sezon Tablosu</h3></div>
          <table className="table">
            <thead><tr><th>Sezon</th><th className="right">Zeytin (ton)</th><th className="right">Yağ (ton)</th><th className="right">Ort. Oran</th><th className="right">Ort. Asit</th><th className="right">Müşteri</th><th>Görsel</th></tr></thead>
            <tbody>
              {D.SEASON_DATA.map((s, i) => (
                <tr key={s.sezon}>
                  <td className="bold serif" style={{fontSize: 16}}>{s.sezon}{i === D.SEASON_DATA.length - 1 && <span className="badge accent-2" style={{marginLeft:8,fontSize:9}}>DEVAM EDEN</span>}</td>
                  <td data-label="Zeytin" className="num">{s.zeytinTon} ton</td>
                  <td data-label="Yağ" className="num bold">{s.yagTon} ton</td>
                  <td data-label="Ort. Oran" className="num">% {fmt.num(s.ortOran,1)}</td>
                  <td data-label="Ort. Asit" className="num">{s.ortAsit}</td>
                  <td data-label="Müşteri" className="num">{s.musteri}</td>
                  <td data-label="Görsel" style={{width: 240}}>
                    <div style={{display:"flex",gap:4,alignItems:"flex-end",height:32,maxWidth:200}}>
                      <div style={{flex:1, background:"var(--accent)", borderRadius:"2px 2px 0 0", height:`${(s.zeytinTon/maxZeytin)*100}%`}}></div>
                      <div style={{flex:1, background:"var(--accent-2)", borderRadius:"2px 2px 0 0", height:`${(s.yagTon/maxYag)*100}%`}}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-head"><h3>Zeytin (ton) · Sezonlara Göre</h3></div>
            <div style={{display:"flex", alignItems:"flex-end", gap: 16, height: 200, padding:"16px 0"}}>
              {D.SEASON_DATA.map((s, i) => {
                const isLast = i === D.SEASON_DATA.length - 1;
                return (
                  <div key={s.sezon} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:8}}>
                    <div className="mono tiny" style={{color: "var(--ink-3)"}}>{s.zeytinTon}</div>
                    <div style={{width:"100%", height:`${(s.zeytinTon/maxZeytin)*100}%`, background: isLast ? "var(--accent-2)" : "var(--accent)", borderRadius:"4px 4px 0 0"}}></div>
                    <div className="tiny serif" style={{fontSize: 13}}>{s.sezon}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Ort. Asit (Dizem) Trendi</h3><span className="badge good">Düşüyor ✓</span></div>
            <div style={{display:"flex", alignItems:"flex-end", gap: 16, height: 200, padding:"16px 0"}}>
              {D.SEASON_DATA.map((s, i) => {
                const max = Math.max(...D.SEASON_DATA.map(s=>s.ortAsit));
                return (
                  <div key={s.sezon} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:8}}>
                    <div className="mono tiny" style={{color: "var(--ink-3)"}}>{s.ortAsit}</div>
                    <div style={{width:"100%", height:`${(s.ortAsit/max)*100}%`, background:"var(--accent-2)", borderRadius:"4px 4px 0 0"}}></div>
                    <div className="tiny serif" style={{fontSize: 13}}>{s.sezon}</div>
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

// ============================================================
// ASİT GEÇMİŞİ
// ============================================================
const AsitGecmisi = ({ units, openCustomer }) => {
  const D = window.__APP_DATA__;
  const withAsit = D.SIPARISLER.filter(s => s.asit != null).sort((a, b) => a.asit - b.asit);
  return (
    <>
      <Topbar title="Asit (Dizem) Geçmişi" subtitle="Tüm zamanların asit ölçümleri" />
      <div className="content">
        <div className="grid grid-4">
          <div className="stat"><span className="label">En Düşük</span><span className="value mono">{fmt.num(withAsit[0]?.asit, 2)}</span><span className="sub">{D.MUSTERILER.find(m => m.id === withAsit[0]?.musteriId)?.ad}</span></div>
          <div className="stat accent"><span className="label">Sezon Ort.</span><span className="value mono">0.46</span><span className="sub">Hedef altı ✓</span></div>
          <div className="stat accent-2"><span className="label">En Yüksek</span><span className="value mono">{fmt.num(withAsit[withAsit.length-1]?.asit, 2)}</span><span className="sub">{D.MUSTERILER.find(m => m.id === withAsit[withAsit.length-1]?.musteriId)?.ad}</span></div>
          <div className="stat"><span className="label">Ölçüm Adet</span><span className="value">{withAsit.length}</span></div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Tüm Ölçümler</h3></div>
          <table className="table">
            <thead><tr><th>Müşteri</th><th>Tür</th><th className="right">Asit</th><th>Skala</th></tr></thead>
            <tbody>
              {withAsit.slice(0, 12).map(s => {
                const m = D.MUSTERILER.find(x => x.id === s.musteriId);
                const pct = (s.asit / 1.0) * 100;
                const cls = s.asit < 0.5 ? "good" : s.asit < 0.7 ? "warn" : "bad";
                return (
                  <tr key={s.id}>
                    <td className="bold tag-clickable" onClick={() => openCustomer(m)}>{m?.ad}<div className="tiny muted">{s.id} · {fmt.date(s.tarih)}</div></td>
                    <td data-label="Tür">{D.ZEYTIN_TURLERI.find(t => t.id === s.tur)?.ad}</td>
                    <td data-label="Asit" className="num bold mono"><span className={`badge ${cls}`}>{fmt.num(s.asit, 2)}</span></td>
                    <td data-label="Skala" style={{width: 220}}>
                      <div className="bar-mini" style={{flex:1,maxWidth:180}}><i style={{width: pct + "%", background: s.asit < 0.5 ? "var(--good)" : s.asit < 0.7 ? "var(--warn)" : "var(--bad)"}}></i></div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ============================================================
// STOK
// ============================================================
const Stok = ({ units, currency }) => {
  const D = window.__APP_DATA__;
  const stoklar = [
    { kategori: "Müşteri Emaneti", kg: 250, lt: 270, deger: 56700, renk: "accent" },
    { kategori: "Fabrika Yağı (alış)", kg: 590, lt: 640, deger: 134000, renk: "accent-2" },
    { kategori: "Hak Yağı Toplam", kg: 178, lt: 193, deger: 41000, renk: "" },
    { kategori: "Çuval (boş)", kg: null, lt: null, deger: null, adet: 320, renk: "" },
    { kategori: "Bidon (boş)", kg: null, lt: null, deger: null, adet: 17, renk: "" },
    { kategori: "Teneke 5lt (yeni)", kg: null, lt: null, deger: null, adet: 84, renk: "" },
  ];
  return (
    <>
      <Topbar title="Stok Yönetimi" subtitle="Yağ, bidon, çuval ve sarf"
        actions={<button className="btn primary"><Icon name="plus" />Stok Hareketi</button>} />
      <div className="content">
        <div className="grid grid-3">
          {stoklar.slice(0, 3).map(s => (
            <div key={s.kategori} className={`stat ${s.renk}`}>
              <span className="label">{s.kategori}</span>
              <span className="value">{fmt.int(s.lt)} <span style={{fontSize:18,opacity:0.7}}>{units.yag}</span></span>
              <span className="sub">≈ {currency}{fmt.int(s.deger)}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-head"><h3>Detay</h3></div>
          <table className="table">
            <thead><tr><th>Kategori</th><th className="right">Kg</th><th className="right">Litre</th><th className="right">Adet</th><th className="right">Değer</th><th>Durum</th></tr></thead>
            <tbody>
              {stoklar.map(s => (
                <tr key={s.kategori}>
                  <td className="bold">{s.kategori}</td>
                  <td data-label="Kg" className="num">{s.kg != null ? fmt.int(s.kg) : "—"}</td>
                  <td data-label="Litre" className="num">{s.lt != null ? fmt.int(s.lt) : "—"}</td>
                  <td data-label="Adet" className="num">{s.adet != null ? s.adet : "—"}</td>
                  <td data-label="Değer" className="num bold">{s.deger ? fmt.money(s.deger, currency) : "—"}</td>
                  <td data-label="Durum"><span className={`badge ${s.renk || ""}`}>Stokta</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ============================================================
// CARİ
// ============================================================
const Cari = ({ currency, openCustomer, units }) => {
  const D = window.__APP_DATA__;
  const toplamBorc = D.CARI.reduce((a, c) => a + c.borc, 0);
  const toplamAlacak = D.CARI.reduce((a, c) => a + c.alacak, 0);
  const toplamEmanet = D.CARI.reduce((a, c) => a + c.emanetLitre, 0);

  return (
    <>
      <Topbar title="Borç / Alacak (Cari)" subtitle="Müşteri bakiyeleri" />
      <div className="content">
        <div className="grid grid-3">
          <div className="stat"><span className="label">Toplam Emanet (litre)</span><span className="value">{fmt.int(toplamEmanet)} <span style={{fontSize:18,color:"var(--ink-3)"}}>{units.yag}</span></span></div>
          <div className="stat accent"><span className="label">Bize Borçlu (alacak)</span><span className="value">{currency}{fmt.int(toplamAlacak)}</span><span className="sub">{D.CARI.filter(c => c.alacak).length} müşteri</span></div>
          <div className="stat accent-2"><span className="label">Bizim Borçlu (borç)</span><span className="value">{currency}{fmt.int(toplamBorc)}</span><span className="sub">{D.CARI.filter(c => c.borc).length} müşteri</span></div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Cari Hesap Listesi</h3></div>
          <table className="table">
            <thead><tr><th>Müşteri</th><th className="right">Emanet</th><th className="right">Borç</th><th className="right">Alacak</th><th className="right">Net</th><th></th></tr></thead>
            <tbody>
              {D.CARI.map(c => {
                const m = D.MUSTERILER.find(x => x.id === c.musteriId);
                const net = c.alacak - c.borc;
                return (
                  <tr key={c.musteriId} onClick={() => openCustomer(m)} style={{cursor:"pointer"}}>
                    <td className="bold">{m?.ad}<div className="tiny muted">{m?.koy}</div></td>
                    <td data-label="Emanet" className="num">{c.emanetLitre ? `${c.emanetLitre} ${units.yag}` : "—"}</td>
                    <td data-label="Borç" className="num" style={{color: c.borc ? "var(--bad)" : "var(--ink-3)"}}>{c.borc ? fmt.money(c.borc, currency) : "—"}</td>
                    <td data-label="Alacak" className="num" style={{color: c.alacak ? "var(--good)" : "var(--ink-3)"}}>{c.alacak ? fmt.money(c.alacak, currency) : "—"}</td>
                    <td data-label="Net" className="num bold" style={{color: net > 0 ? "var(--good)" : net < 0 ? "var(--bad)" : "var(--ink-3)"}}>
                      {net !== 0 ? (net > 0 ? "+" : "") + fmt.money(net, currency) : "—"}
                    </td>
                    <td></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ============================================================
// YAZDIRMA GEÇMİŞİ
// ============================================================
const YazdirmaGecmisi = ({ openCustomer, openOrder }) => {
  const D = window.__APP_DATA__;
  return (
    <>
      <Topbar title="Yazdırma Geçmişi" subtitle={`${D.YAZDIRMALAR.length} kart bastırıldı`} />
      <div className="content">
        <div className="grid grid-4">
          <div className="stat"><span className="label">Bugün</span><span className="value">12</span></div>
          <div className="stat"><span className="label">Bu Hafta</span><span className="value">68</span></div>
          <div className="stat accent"><span className="label">Bu Sezon</span><span className="value">{D.YAZDIRMALAR.length * 4}</span></div>
          <div className="stat"><span className="label">Toplam (Tüm)</span><span className="value">2.408</span></div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Son Yazdırmalar</h3></div>
          <table className="table">
            <thead><tr><th>Müşteri</th><th>Tarih</th><th>Stil</th><th className="right">Kopya</th><th>Operatör</th><th></th></tr></thead>
            <tbody>
              {D.YAZDIRMALAR.map(y => {
                const m = D.MUSTERILER.find(x => x.id === y.musteriId);
                const s = D.SIPARISLER.find(x => x.id === y.siparisId);
                return (
                  <tr key={y.id}>
                    <td className="bold tag-clickable" onClick={() => openCustomer(m)}>{m?.ad}<div className="tiny muted">{y.id} · {y.siparisId}</div></td>
                    <td data-label="Tarih">{fmt.date(y.tarih)} <span className="muted mono tiny">{y.saat}</span></td>
                    <td data-label="Stil"><span className="badge">{y.stil}</span></td>
                    <td data-label="Kopya" className="num">{y.kopya}</td>
                    <td data-label="Operatör" className="muted">{y.operator}</td>
                    <td><button className="btn sm ghost"><Icon name="print" size={12} />Yeniden Bas</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

Object.assign(window, { AktifSiparisler, BidonTakibi, Hareketler, Raporlar, KoyBolge, SezonKarsilastirma, AsitGecmisi, Stok, Cari, YazdirmaGecmisi });

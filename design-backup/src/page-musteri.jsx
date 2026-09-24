// Customer management + detail view
const MusteriYonetimi = ({ openCustomer, units }) => {
  const D = window.__APP_DATA__;
  const [filter, setFilter] = React.useState("");
  const [koyFilter, setKoyFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  const customersWithStats = D.MUSTERILER.map(m => {
    const sips = D.SIPARISLER.filter(s => s.musteriId === m.id);
    const sezon = sips.filter(s => s.tarih.startsWith("2026"));
    return {
      ...m,
      siparisAdet: sips.length,
      sezonZeytin: sezon.reduce((a, s) => a + s.zeytinKg, 0),
      sezonYag: sezon.reduce((a, s) => a + (s.cikanYag || 0), 0),
      sonSiparis: sips[0]?.tarih,
      emanetLitre: D.CARI.find(c => c.musteriId === m.id)?.emanetLitre || 0,
      borc: D.CARI.find(c => c.musteriId === m.id)?.borc || 0,
      alacak: D.CARI.find(c => c.musteriId === m.id)?.alacak || 0,
    };
  });

  const filtered = customersWithStats.filter(m => {
    if (filter && !m.ad.toLowerCase().includes(filter.toLowerCase()) && !m.tel.includes(filter)) return false;
    if (koyFilter && m.koy !== koyFilter) return false;
    if (statusFilter && m.durum !== statusFilter) return false;
    return true;
  });

  return (
    <>
      <Topbar
        title="Müşteri Yönetimi"
        subtitle={`${D.MUSTERILER.length} müşteri kayıtlı`}
        actions={<button className="btn primary"><Icon name="plus" />Yeni Müşteri</button>}
      />
      <div className="content">
        <div className="card">
          <div className="row" style={{marginBottom: 16, flexWrap:"wrap"}}>
            <div className="search" style={{flex:1, minWidth: 240}}>
              <Icon name="search" size={14} />
              <input placeholder="İsim, telefon ara…" value={filter} onChange={e => setFilter(e.target.value)} />
            </div>
            <select className="btn" style={{padding:"8px 14px"}} value={koyFilter} onChange={e => setKoyFilter(e.target.value)}>
              <option value="">Tüm Köyler</option>
              {D.KOYLER.map(k => <option key={k}>{k}</option>)}
            </select>
            <select className="btn" style={{padding:"8px 14px"}} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tüm Durumlar</option>
              <option value="aktif">Aktif</option>
              <option value="pasif">Pasif</option>
            </select>
            <button className="btn"><Icon name="download" />Excel</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Müşteri</th>
                <th className="right">Sezon Zeytin</th>
                <th className="right">Sezon Yağ</th>
                <th className="right">Emanet</th>
                <th className="right">Cari</th>
                <th>Durum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} onClick={() => openCustomer(m)} style={{cursor:"pointer"}}>
                  <td className="bold">{m.ad}
                    <div className="tiny muted">{m.id} · {m.koy} · {m.tel}</div>
                  </td>
                  <td data-label="Sezon Zeytin" className="num">{m.sezonZeytin ? fmt.int(m.sezonZeytin) + " " + units.agirlik : <span className="muted">—</span>}</td>
                  <td data-label="Sezon Yağ" className="num">{m.sezonYag ? fmt.num(m.sezonYag, 1) + " " + units.yag : <span className="muted">—</span>}</td>
                  <td data-label="Emanet" className="num">{m.emanetLitre ? <span className="badge accent">{m.emanetLitre} {units.yag}</span> : <span className="muted">—</span>}</td>
                  <td data-label="Cari" className="num">
                    {m.borc ? <span style={{color:"var(--bad)"}}>−₺{fmt.int(m.borc)}</span>
                      : m.alacak ? <span style={{color:"var(--good)"}}>+₺{fmt.int(m.alacak)}</span>
                      : <span className="muted">—</span>}
                  </td>
                  <td data-label="Durum"><StatusBadge status={m.durum} /></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

const MusteriDetay = ({ musteri, onBack, units, currency, openOrder }) => {
  const D = window.__APP_DATA__;
  const [tab, setTab] = React.useState("siparisler");
  const sips = D.SIPARISLER.filter(s => s.musteriId === musteri.id);
  const hars = D.HAREKETLER.filter(h => h.musteriId === musteri.id);
  const cari = D.CARI.find(c => c.musteriId === musteri.id) || { emanetLitre: 0, borc: 0, alacak: 0 };

  const totalZeytin = sips.reduce((a, s) => a + s.zeytinKg, 0);
  const totalYag = sips.reduce((a, s) => a + (s.cikanYag || 0), 0);
  const totalHak = sips.reduce((a, s) => a + (s.hakYagKg || 0), 0);
  const ortAsit = sips.filter(s => s.asit).reduce((a, s, _, arr) => a + s.asit / arr.length, 0);
  const ortOran = sips.filter(s => s.oran).reduce((a, s, _, arr) => a + s.oran / arr.length, 0);

  // Yearly breakdown
  const years = [...new Set(sips.map(s => s.tarih.slice(0, 4)))].sort().reverse();

  return (
    <>
      <Topbar
        title={musteri.ad}
        subtitle={<><button className="btn ghost sm" onClick={onBack}>← Müşteriler</button> · {musteri.id}</>}
        actions={
          <div className="row">
            <button className="btn"><Icon name="phone" size={14} />Ara</button>
            <button className="btn"><Icon name="edit" size={14} />Düzenle</button>
            <button className="btn primary"><Icon name="plus" />Yeni İşlem</button>
          </div>
        }
      />
      <div className="content">
        {/* Customer header */}
        <div className="card">
          <div className="cust-header">
            <div className="cust-avatar">{initialsOf(musteri.ad)}</div>
            <div className="cust-info">
              <h2>{musteri.ad}</h2>
              <div className="meta">
                <span><Icon name="phone" size={12} /> {musteri.tel}</span>
                <span><Icon name="home" size={12} /> {musteri.koy} köyü</span>
                <span><Icon name="map" size={12} /> {musteri.adres}</span>
                <StatusBadge status={musteri.durum} />
              </div>
              {musteri.notlar && <div className="muted tiny" style={{marginTop:8,fontStyle:"italic"}}>"{musteri.notlar}"</div>}
            </div>
          </div>
          <div className="divider"></div>
          <div className="kv-grid">
            <div className="kv">
              <div className="k">Toplam Sipariş</div>
              <div className="v">{sips.length}</div>
            </div>
            <div className="kv">
              <div className="k">Toplam Zeytin</div>
              <div className="v">{fmt.int(totalZeytin)} <span style={{fontSize:14,color:"var(--ink-3)"}}>{units.agirlik}</span></div>
            </div>
            <div className="kv">
              <div className="k">Toplam Yağ</div>
              <div className="v">{fmt.num(totalYag, 1)} <span style={{fontSize:14,color:"var(--ink-3)"}}>{units.yag}</span></div>
            </div>
            <div className="kv">
              <div className="k">Ort. Verim</div>
              <div className="v mono">% {fmt.num(ortOran, 1)}</div>
            </div>
            <div className="kv" style={{background: cari.emanetLitre ? "var(--accent-soft)" : "var(--bg-2)"}}>
              <div className="k">Emanet Yağ</div>
              <div className="v">{fmt.num(cari.emanetLitre, 1)} <span style={{fontSize:14,color:"var(--ink-3)"}}>{units.yag}</span></div>
            </div>
            <div className="kv">
              <div className="k">Ort. Asit (Dizem)</div>
              <div className="v mono">{fmt.num(ortAsit, 2)}</div>
            </div>
            <div className="kv">
              <div className="k">Hak Yağı Toplam</div>
              <div className="v">{fmt.num(totalHak, 1)} <span style={{fontSize:14,color:"var(--ink-3)"}}>{units.yag}</span></div>
            </div>
            <div className="kv" style={{background: cari.borc ? "var(--bad-soft)" : cari.alacak ? "var(--good-soft)" : "var(--bg-2)"}}>
              <div className="k">Cari Bakiye</div>
              <div className="v mono" style={{fontSize:18}}>
                {cari.borc ? `−${currency}${fmt.int(cari.borc)}` : cari.alacak ? `+${currency}${fmt.int(cari.alacak)}` : "₺0"}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[
            ["siparisler", "Siparişler", sips.length],
            ["hareketler", "Hareketler", hars.length],
            ["yillik", "Yıllık Özet", years.length],
            ["notlar", "Notlar", null],
          ].map(([id, l, count]) => (
            <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
              {l} {count != null && <span className="muted">({count})</span>}
            </button>
          ))}
        </div>

        {tab === "siparisler" && (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Sipariş</th>
                  <th>Tür</th>
                  <th className="right">Zeytin</th>
                  <th className="right">Çıkan Yağ</th>
                  <th className="right">Oran</th>
                  <th className="right">Asit</th>
                  <th>Durum</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sips.map(s => (
                  <tr key={s.id} onClick={() => openOrder(s)} style={{cursor:"pointer"}}>
                    <td className="mono">{s.id}<div className="tiny muted">{fmt.date(s.tarih)} · {s.saat}</div></td>
                    <td data-label="Tür">{D.ZEYTIN_TURLERI.find(t => t.id === s.tur)?.ad}</td>
                    <td data-label="Zeytin" className="num">{fmt.int(s.zeytinKg)} {units.agirlik}</td>
                    <td data-label="Çıkan Yağ" className="num bold">{s.cikanYag ? fmt.num(s.cikanYag, 1) + " " + units.yag : "—"}</td>
                    <td data-label="Oran" className="num">{s.oran ? "% " + fmt.num(s.oran, 1) : "—"}</td>
                    <td data-label="Asit" className="num">{s.asit ? fmt.num(s.asit, 2) : "—"}</td>
                    <td data-label="Durum"><StatusBadge status={s.durum} /></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "hareketler" && (
          <div className="card">
            {hars.length === 0 ? (
              <div className="empty">Bu müşteri için hareket kaydı yok.</div>
            ) : (
              <table className="table">
                <thead><tr><th>Tarih</th><th>Tür</th><th className="right">Miktar</th><th>Bidon</th><th className="right">Tutar</th><th>Not</th></tr></thead>
                <tbody>
                  {hars.map(h => (
                    <tr key={h.id}>
                      <td className="mono">{fmt.date(h.tarih)}</td>
                      <td data-label="Hareket"><StatusBadge status={h.tur} /></td>
                      <td data-label="Miktar" className="num bold">{h.litre} {units.yag}</td>
                      <td data-label="Bidon" className="mono tiny">{h.bidonNo?.join(", ") || "—"}</td>
                      <td data-label="Tutar" className="num">{h.tutar ? fmt.money(h.tutar, currency) : "—"}</td>
                      <td data-label="Not" className="muted tiny">{h.not}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "yillik" && (
          <div className="card">
            <table className="table">
              <thead><tr><th>Yıl</th><th className="right">Sipariş Adet</th><th className="right">Toplam Zeytin</th><th className="right">Toplam Yağ</th><th className="right">Ort. Oran</th><th className="right">Ort. Asit</th></tr></thead>
              <tbody>
                {years.map(y => {
                  const ys = sips.filter(s => s.tarih.startsWith(y));
                  const z = ys.reduce((a, s) => a + s.zeytinKg, 0);
                  const yag = ys.reduce((a, s) => a + (s.cikanYag || 0), 0);
                  const or = ys.filter(s=>s.oran).reduce((a,s,_,arr)=>a+s.oran/arr.length, 0);
                  const as = ys.filter(s=>s.asit).reduce((a,s,_,arr)=>a+s.asit/arr.length, 0);
                  return (
                    <tr key={y}>
                      <td className="bold serif" style={{fontSize:18}}>{y}</td>
                      <td data-label="Sipariş" className="num">{ys.length}</td>
                      <td data-label="Zeytin" className="num">{fmt.int(z)} {units.agirlik}</td>
                      <td data-label="Yağ" className="num bold">{fmt.num(yag, 1)} {units.yag}</td>
                      <td data-label="Ort. Oran" className="num">% {fmt.num(or, 1)}</td>
                      <td data-label="Ort. Asit" className="num">{fmt.num(as, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === "notlar" && (
          <div className="card">
            <div className="field">
              <label>Müşteri Notları</label>
              <textarea rows={6} defaultValue={musteri.notlar || ""} placeholder="Müşteriye dair notlarınız..." />
            </div>
            <button className="btn primary" style={{marginTop: 12}}>Notu Kaydet</button>
          </div>
        )}
      </div>
    </>
  );
};

Object.assign(window, { MusteriYonetimi, MusteriDetay });

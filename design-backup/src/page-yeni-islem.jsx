// Yeni İşlem (new order) - form + live card preview
const YeniIslem = ({ units, currency, defaultCardStyle = "klasik", onComplete }) => {
  const D = window.__APP_DATA__;
  const [step, setStep] = React.useState(1); // 1: müşteri, 2: işlem, 3: sonuç & kart
  const [musteri, setMusteri] = React.useState(null);
  const [yeniMusteri, setYeniMusteri] = React.useState({ ad: "", tel: "", koy: "", adres: "" });
  const [showNew, setShowNew] = React.useState(false);
  const [filter, setFilter] = React.useState("");

  const [form, setForm] = React.useState({
    tur: "memecik",
    zeytinKg: 1200,
    cikanYag: 232,
    asit: 0.48,
    bidon: 8,
    cuval: 30,
    not: "",
    islemTur: "sikim", // sikim / emanet-birak / satis / alis
  });

  const [cardStyle, setCardStyle] = React.useState(defaultCardStyle);
  const [kopya, setKopya] = React.useState(1);

  const tur = D.ZEYTIN_TURLERI.find(t => t.id === form.tur);
  const oran = form.zeytinKg > 0 ? +(form.cikanYag / form.zeytinKg * 100).toFixed(2) : 0;
  const hakYag = +(form.cikanYag * 0.10).toFixed(2);
  const kalanYag = +(form.cikanYag - hakYag).toFixed(2);
  const yeniSiparisId = "S-" + String(1048).padStart(4, "0");

  const siparisPreview = {
    id: yeniSiparisId,
    musteriId: musteri?.id,
    tarih: "2026-11-23",
    saat: "11:42",
    tur: form.tur,
    zeytinKg: form.zeytinKg,
    cikanYag: form.cikanYag,
    hakYagKg: hakYag,
    kalanYagKg: kalanYag,
    oran,
    asit: form.asit,
    bidon: form.bidon,
    cuval: form.cuval,
    durum: "tamamlandi",
    operator: "Mustafa",
  };

  const filteredM = D.MUSTERILER.filter(m =>
    !filter || m.ad.toLowerCase().includes(filter.toLowerCase()) ||
    m.tel.includes(filter) || m.koy.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      <Topbar
        title="Yeni İşlem"
        subtitle="Sıkım sürecinin sonunda kart yazdırma"
        actions={
          <button className="btn" onClick={() => setStep(1)}><Icon name="arrow" /> Baştan</button>
        }
      />
      <div className="content">
        {/* Steps */}
        <div className="steps">
          <div className={`step ${step >= 1 ? "active" : ""} ${step > 1 ? "done" : ""}`}>
            <span className="n">{step > 1 ? "✓" : "1"}</span><span>Müşteri Seç</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? "active" : ""} ${step > 2 ? "done" : ""}`}>
            <span className="n">{step > 2 ? "✓" : "2"}</span><span>İşlem Bilgileri</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? "active" : ""}`}>
            <span className="n">3</span><span>Kart & Yazdırma</span>
          </div>
        </div>

        {step === 1 && (
          <div className="card">
            <div className="card-head">
              <div>
                <h3>Müşteri Seç</h3>
                <div className="muted tiny" style={{marginTop:4}}>Mevcut müşteri ara veya yeni kayıt aç</div>
              </div>
              <div className="row">
                <div className="search" style={{width: 280}}>
                  <Icon name="search" size={14} />
                  <input placeholder="İsim, telefon veya köy…" value={filter} onChange={e => setFilter(e.target.value)} />
                </div>
                <button className="btn primary" onClick={() => setShowNew(!showNew)}>
                  <Icon name="plus" /> Yeni Müşteri
                </button>
              </div>
            </div>
            {showNew && (
              <div className="card" style={{background:"var(--accent-soft)", borderColor:"var(--accent)", marginBottom: 16}}>
                <div className="fld-row">
                  <div className="field"><label>İsim Soyisim 🎤</label>
                    <VInput value={yeniMusteri.ad} onChange={e => setYeniMusteri({...yeniMusteri, ad: e.target.value})} placeholder="örn. Hüseyin Aydın" />
                  </div>
                  <div className="field"><label>Telefon 🎤</label>
                    <VInput value={yeniMusteri.tel} onChange={e => setYeniMusteri({...yeniMusteri, tel: e.target.value})} placeholder="0532 …" mode="number" />
                  </div>
                </div>
                <div className="fld-row" style={{marginTop:12}}>
                  <div className="field"><label>Köy</label>
                    <select value={yeniMusteri.koy} onChange={e => setYeniMusteri({...yeniMusteri, koy: e.target.value})}>
                      <option value="">Seçin…</option>
                      {D.KOYLER.map(k => <option key={k}>{k}</option>)}
                    </select>
                  </div>
                  <div className="field"><label>Adres 🎤</label>
                    <VInput value={yeniMusteri.adres} onChange={e => setYeniMusteri({...yeniMusteri, adres: e.target.value})} placeholder="Mahalle, mevki" />
                  </div>
                </div>
                <div className="row" style={{marginTop:16, justifyContent:"flex-end"}}>
                  <button className="btn ghost" onClick={() => setShowNew(false)}>İptal</button>
                  <button className="btn primary" onClick={() => {
                    const m = { id: "M-" + String(D.MUSTERILER.length + 1).padStart(4, "0"), ...yeniMusteri, durum: "aktif", uyelik: "2026-11-23" };
                    setMusteri(m); setShowNew(false); setStep(2);
                  }}>Kaydet ve Devam Et</button>
                </div>
              </div>
            )}
            <table className="table">
              <thead><tr><th></th><th>İsim Soyisim</th><th>Köy</th><th>Telefon</th><th>Üyelik</th><th>Son Sipariş</th></tr></thead>
              <tbody>
                {filteredM.slice(0, 8).map(m => {
                  const last = D.SIPARISLER.find(s => s.musteriId === m.id);
                  return (
                    <tr key={m.id} className={musteri?.id === m.id ? "active" : ""} onClick={() => { setMusteri(m); setStep(2); }} style={{cursor:"pointer"}}>
                      <td><div className="avatar" style={{width:32,height:32,fontSize:11}}>{initialsOf(m.ad)}</div></td>
                      <td className="bold">{m.ad}</td>
                      <td>{m.koy}</td>
                      <td className="mono">{m.tel}</td>
                      <td className="muted tiny">{fmt.date(m.uyelik)}</td>
                      <td className="muted tiny">{last ? fmt.date(last.tarih) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {step === 2 && musteri && (
          <div className="grid" style={{gridTemplateColumns:"1.4fr 1fr"}}>
            <div className="card">
              <div className="card-head">
                <h3>İşlem Bilgileri</h3>
                <span className="muted tiny mono">{yeniSiparisId}</span>
              </div>
              {/* Selected customer pill */}
              <div className="card" style={{background:"var(--bg-2)", padding:"10px 14px", marginBottom: 16, display:"flex", alignItems:"center", gap: 12}}>
                <div className="avatar" style={{width:36,height:36,fontSize:13}}>{initialsOf(musteri.ad)}</div>
                <div style={{flex:1}}>
                  <div className="bold">{musteri.ad}</div>
                  <div className="tiny muted">{musteri.koy} · {musteri.tel}</div>
                </div>
                <button className="btn sm ghost" onClick={() => setStep(1)}><Icon name="edit" size={12} />Değiştir</button>
              </div>

              {/* İşlem türü */}
              <div className="field" style={{marginBottom: 16}}>
                <label>İşlem Türü</label>
                <div className="row" style={{gap: 8, flexWrap:"wrap"}}>
                  {[
                    { id:"sikim", l:"Sıkım", d:"Müşteri zeytin getirdi" },
                    { id:"emanet-birak", l:"Emanet Bırak", d:"Yağı bizde bıraksın" },
                    { id:"satis", l:"Sat", d:"Müşteriye yağ sat" },
                    { id:"alis", l:"Al", d:"Müşteriden yağ al" },
                  ].map(o => (
                    <button key={o.id} onClick={() => setForm({...form, islemTur: o.id})}
                      className="card" style={{
                        padding:"10px 14px", textAlign:"left", cursor:"pointer", minWidth: 160,
                        background: form.islemTur === o.id ? "var(--accent-soft)" : "var(--surface)",
                        borderColor: form.islemTur === o.id ? "var(--accent)" : "var(--line)",
                      }}>
                      <div className="bold" style={{fontSize:13}}>{o.l}</div>
                      <div className="tiny muted">{o.d}</div>
                    </button>
                  ))}
                </div>
              </div>

              {form.islemTur === "sikim" && (
                <div className="field-group">
                  <div className="fld-row">
                    <div className="field">
                      <label>Zeytin Türü</label>
                      <select value={form.tur} onChange={e => setForm({...form, tur: e.target.value})}>
                        {D.ZEYTIN_TURLERI.map(t => <option key={t.id} value={t.id}>{t.ad}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Zeytin ({units.agirlik}) 🎤</label>
                      <div className="input-suffix">
                        <VInput type="number" value={form.zeytinKg} onChange={e => setForm({...form, zeytinKg: +e.target.value})} mode="number" />
                        <span className="suffix" style={{right: 52}}>{units.agirlik}</span>
                      </div>
                    </div>
                  </div>
                  <div className="fld-row-3">
                    <div className="field">
                      <label>Çıkan Yağ ({units.yag}) 🎤</label>
                      <div className="input-suffix">
                        <VInput type="number" step="0.1" value={form.cikanYag} onChange={e => setForm({...form, cikanYag: +e.target.value})} mode="number" />
                        <span className="suffix" style={{right: 52}}>{units.yag}</span>
                      </div>
                    </div>
                    <div className="field">
                      <label>Asit (Dizem) 🎤</label>
                      <VInput type="number" step="0.01" value={form.asit} onChange={e => setForm({...form, asit: +e.target.value})} mode="number" />
                    </div>
                    <div className="field">
                      <label>Oran (Hesaplandı)</label>
                      <div className="input-suffix">
                        <input value={oran} readOnly style={{background:"var(--bg-2)"}} />
                        <span className="suffix">%</span>
                      </div>
                    </div>
                  </div>
                  <div className="fld-row-3">
                    <div className="field">
                      <label>Hak Yağı (%10)</label>
                      <input value={hakYag} readOnly style={{background:"var(--bg-2)"}} />
                    </div>
                    <div className="field">
                      <label>Bidon Sayısı 🎤</label>
                      <VInput type="number" value={form.bidon} onChange={e => setForm({...form, bidon: +e.target.value})} mode="number" />
                    </div>
                    <div className="field">
                      <label>Çuval Sayısı 🎤</label>
                      <VInput type="number" value={form.cuval} onChange={e => setForm({...form, cuval: +e.target.value})} mode="number" />
                    </div>
                  </div>
                  <div className="field">
                    <label>Not 🎤</label>
                    <VInput as="textarea" rows={2} value={form.not} onChange={e => setForm({...form, not: e.target.value})} placeholder="Operatör notu, kalite, vs."/>
                  </div>
                </div>
              )}

              {form.islemTur !== "sikim" && (
                <div className="field-group">
                  <div className="fld-row">
                    <div className="field"><label>Litre / Kg</label>
                      <div className="input-suffix"><input type="number" defaultValue={50} /><span className="suffix">{units.yag}</span></div>
                    </div>
                    {form.islemTur !== "emanet-birak" && (
                      <div className="field"><label>Kg Fiyat</label>
                        <div className="input-suffix"><input type="number" defaultValue={220} /><span className="suffix">{currency}/{units.yag}</span></div>
                      </div>
                    )}
                  </div>
                  {form.islemTur === "emanet-birak" && (
                    <div className="field"><label>Bidon No (virgülle)</label>
                      <input placeholder="B-014, B-015, B-027" />
                    </div>
                  )}
                  <div className="field"><label>Not</label><textarea rows={2} placeholder="..."/></div>
                </div>
              )}

              <div className="divider"></div>
              <div className="row" style={{justifyContent:"space-between"}}>
                <button className="btn ghost" onClick={() => setStep(1)}><Icon name="arrow" style={{transform:"scaleX(-1)"}} /> Geri</button>
                <button className="btn primary" onClick={() => setStep(3)}>
                  Devam <Icon name="arrow" />
                </button>
              </div>
            </div>

            <div className="card" style={{background:"var(--bg-2)"}}>
              <div className="card-head"><h3>Canlı Hesap</h3><span className="muted tiny">otomatik</span></div>
              <div className="kv-grid" style={{gridTemplateColumns:"1fr 1fr"}}>
                <div className="kv"><div className="k">Zeytin</div><div className="v">{fmt.num(form.zeytinKg, 0)} <span style={{fontSize:14,color:"var(--ink-3)"}}>{units.agirlik}</span></div></div>
                <div className="kv"><div className="k">Çıkan Yağ</div><div className="v">{fmt.num(form.cikanYag, 1)} <span style={{fontSize:14,color:"var(--ink-3)"}}>{units.yag}</span></div></div>
                <div className="kv"><div className="k">Oran</div><div className="v mono">% {fmt.num(oran, 1)}</div></div>
                <div className="kv"><div className="k">Asit</div><div className="v mono">{fmt.num(form.asit, 2)}</div></div>
                <div className="kv"><div className="k">Hak Yağı</div><div className="v">{fmt.num(hakYag, 1)} <span style={{fontSize:14,color:"var(--ink-3)"}}>{units.yag}</span></div></div>
                <div className="kv"><div className="k">Kalan Yağ</div><div className="v">{fmt.num(kalanYag, 1)} <span style={{fontSize:14,color:"var(--ink-3)"}}>{units.yag}</span></div></div>
              </div>
              <div className="divider"></div>
              <div style={{display:"flex",flexDirection:"column",gap:6,fontSize:12.5}}>
                <div style={{display:"flex",justifyContent:"space-between"}}><span className="muted">Zeytin Türü</span><span>{tur?.ad}</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span className="muted">Bidon / Çuval</span><span className="mono">{form.bidon} / {form.cuval}</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span className="muted">Operatör</span><span>Mustafa</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span className="muted">Tarih / Saat</span><span className="mono">23.11 · 11:42</span></div>
              </div>

              {form.asit > 0.6 && (
                <div className="badge bad" style={{marginTop:12}}>⚠ Yüksek asit · ekstra kontrol önerilir</div>
              )}
              {oran > 20 && (
                <div className="badge good" style={{marginTop:12}}>✓ Yüksek verim oranı</div>
              )}
            </div>
          </div>
        )}

        {step === 3 && musteri && (
          <div className="grid" style={{gridTemplateColumns:"1.2fr 1fr"}}>
            <div className="card print-area">
              <div className="card-head">
                <div>
                  <h3>Kart Önizleme · 7 × 14 cm</h3>
                  <div className="muted tiny" style={{marginTop:4}}>Termal yazıcıya gönderilmek üzere hazır</div>
                </div>
                <div className="row">
                  {["klasik","modern","termal"].map(s => (
                    <button key={s} onClick={() => setCardStyle(s)}
                      className={`btn sm ${cardStyle === s ? "primary" : ""}`}>
                      {s === "klasik" ? "Klasik" : s === "modern" ? "Modern" : "Termal"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"center",padding:"24px 0"}}>
                <div className="print-card-wrap">
                  <div className="rule">70mm × 140mm — gerçek baskı boyutu</div>
                  <PrintCard
                    stil={cardStyle}
                    firma={D.FIRMA}
                    musteri={musteri}
                    siparis={siparisPreview}
                    zeytinTuru={tur}
                    units={units}
                  />
                </div>
              </div>
            </div>

            <div className="col" style={{gap: 16}}>
              <div className="card">
                <div className="card-head"><h3>Yazdırma</h3></div>
                <div className="field-group">
                  <div className="fld-row">
                    <div className="field">
                      <label>Kart Stili</label>
                      <select value={cardStyle} onChange={e => setCardStyle(e.target.value)}>
                        <option value="klasik">Klasik (krem + dekoratif)</option>
                        <option value="modern">Modern Minimal</option>
                        <option value="termal">Termal / Sade</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Kopya</label>
                      <select value={kopya} onChange={e => setKopya(+e.target.value)}>
                        <option value={1}>1 kopya (müşteri)</option>
                        <option value={2}>2 kopya (müşteri + fabrika)</option>
                        <option value={3}>3 kopya</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label>Yazıcı</label>
                    <select>
                      <option>Argox CP-2140 (Termal · 70mm)</option>
                      <option>Brother QL-820NWB</option>
                      <option>PDF olarak kaydet</option>
                    </select>
                  </div>
                </div>
                <div className="divider"></div>
                <button className="btn primary" style={{width:"100%", justifyContent:"center"}} onClick={() => window.print()}>
                  <Icon name="print" /> {kopya} kopya yazdır ve kaydet
                </button>
                <button className="btn ghost sm" style={{width:"100%", justifyContent:"center", marginTop:8}}>
                  Kaydet ama yazdırma
                </button>
              </div>

              <div className="card">
                <div className="card-head"><h3>Sonraki adımlar</h3></div>
                <div className="col" style={{gap: 8}}>
                  <button className="btn"><Icon name="swap" size={14} /> Bu işlem için emanet kayıt aç</button>
                  <button className="btn"><Icon name="barrel" size={14} /> Bidonları atama yap</button>
                  <button className="btn"><Icon name="newOrder" size={14} /> Aynı müşteriye yeni işlem</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

Object.assign(window, { YeniIslem });

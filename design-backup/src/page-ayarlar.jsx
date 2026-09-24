// Ayarlar (Settings) page - in-app version of the tweaks panel
const Ayarlar = ({ tweaks, setTweak, units }) => {
  const palettes = [
    { id: "toprak", name: "Toprak", desc: "Krem · Olive · Terracotta", colors: ["#5b6b3a","#b8531f","#faf6ee","#1f2419"] },
    { id: "modern", name: "Modern", desc: "Beyaz, minimal, yeşil aksan", colors: ["#1f8a5b","#0a0a0a","#fafafa","#0a0a0a"] },
    { id: "koyu", name: "Koyu Mod", desc: "Fabrika ortamı, gece kullanım", colors: ["#8fa050","#d97a3d","#14160f","#f0ede3"] },
    { id: "klasik", name: "Klasik", desc: "Krem · Bordo · Geleneksel", colors: ["#7a3024","#6b5a2a","#f5efe0","#2a1810"] },
  ];

  const fontPairs = [
    { id: "Instrument Serif|Geist", display: "Instrument Serif", body: "Geist", name: "Editöryel", sample: "Yağ Takip" },
    { id: "Cormorant Garamond|Inter", display: "Cormorant Garamond", body: "Inter", name: "Klasik", sample: "Yağ Takip" },
    { id: "Bricolage Grotesque|DM Sans", display: "Bricolage Grotesque", body: "DM Sans", name: "Çağdaş", sample: "Yağ Takip" },
    { id: "Geist|Geist", display: "Geist", body: "Geist", name: "Sade Sans", sample: "Yağ Takip" },
  ];

  const cardStyles = [
    { id: "klasik", name: "Klasik", desc: "Krem, dekoratif çerçeve, serif" },
    { id: "modern", name: "Modern Minimal", desc: "Bold sans, ferah, çizgili grid" },
    { id: "termal", name: "Termal / Sade", desc: "Siyah-beyaz, mono, fişe benzer" },
  ];

  const SettingsRow = ({ icon, title, desc, children }) => (
    <div style={{display:"flex", gap: 14, padding:"14px 0", borderBottom:"1px solid var(--line-2)", alignItems:"center", flexWrap:"wrap"}}>
      {icon && <div style={{width:36,height:36,borderRadius:8,background:"var(--bg-2)",display:"grid",placeItems:"center",flexShrink:0,color:"var(--accent)"}}><Icon name={icon} size={18}/></div>}
      <div style={{flex:1, minWidth: 180}}>
        <div style={{fontWeight:500,fontSize:14}}>{title}</div>
        {desc && <div className="tiny muted" style={{marginTop:2}}>{desc}</div>}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>{children}</div>
    </div>
  );

  return (
    <>
      <Topbar title="Ayarlar" subtitle="Görünüm, birimler, kart tasarımı, yazıcı, hesap" />
      <div className="content">
        {/* Görünüm: Renk Paleti */}
        <div className="card">
          <div className="card-head">
            <div><h3>Görünüm — Renk Paleti</h3>
              <div className="tiny muted" style={{marginTop:4}}>Tüm panel için tema seçimi</div>
            </div>
          </div>
          <div className="grid" style={{gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap: 12}}>
            {palettes.map(p => (
              <button key={p.id} onClick={() => setTweak("palette", p.id)}
                className="card" style={{
                  padding: 14, textAlign:"left", cursor:"pointer",
                  background: tweaks.palette === p.id ? "var(--accent-soft)" : "var(--surface)",
                  borderColor: tweaks.palette === p.id ? "var(--accent)" : "var(--line)",
                  borderWidth: 2,
                }}>
                <div style={{display:"flex", gap: 6, marginBottom: 10}}>
                  {p.colors.map((c, i) => (
                    <div key={i} style={{width: 32, height: 40, background: c, borderRadius: 6, border:"1px solid rgba(0,0,0,0.08)"}}></div>
                  ))}
                </div>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:500,fontSize:14}}>{p.name}</div>
                    <div className="tiny muted" style={{marginTop:2}}>{p.desc}</div>
                  </div>
                  {tweaks.palette === p.id && <Icon name="check" size={18} style={{color:"var(--accent)"}}/>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Görünüm: Tipografi */}
        <div className="card">
          <div className="card-head"><h3>Tipografi</h3></div>
          <div className="grid grid-2">
            {fontPairs.map(fp => {
              const active = tweaks.fontDisplay === fp.display && tweaks.fontBody === fp.body;
              return (
                <button key={fp.id} onClick={() => { setTweak("fontDisplay", fp.display); setTweak("fontBody", fp.body); }}
                  className="card" style={{
                    padding: 14, textAlign:"left", cursor:"pointer",
                    background: active ? "var(--accent-soft)" : "var(--surface)",
                    borderColor: active ? "var(--accent)" : "var(--line)",
                    borderWidth: 2,
                  }}>
                  <div style={{fontFamily: `"${fp.display}", serif`, fontSize: 32, lineHeight: 1, marginBottom: 6}}>{fp.sample}</div>
                  <div style={{fontFamily: `"${fp.body}", sans-serif`, fontSize: 12, color: "var(--ink-2)"}}>
                    Sipariş No: <span className="mono">S-1048</span> · Asit 0.46 · {fp.body}
                  </div>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop: 10}}>
                    <span style={{fontSize: 13, fontWeight: 500}}>{fp.name}</span>
                    {active && <Icon name="check" size={16} style={{color:"var(--accent)"}}/>}
                  </div>
                </button>
              );
            })}
          </div>
          <SettingsRow icon="settings" title="Yoğunluk" desc="Tüm panelin ferahlık derecesi">
            <input type="range" min="0.7" max="1.3" step="0.05" value={tweaks.density}
              onChange={e => setTweak("density", +e.target.value)}
              style={{width: 200}}/>
            <span className="mono tiny" style={{minWidth: 40, textAlign:"right"}}>{tweaks.density.toFixed(2)}×</span>
          </SettingsRow>
        </div>

        {/* Birim & Para */}
        <div className="card">
          <div className="card-head"><h3>Birim & Para</h3></div>
          <SettingsRow icon="stock" title="Ağırlık Birimi" desc="Zeytin alımında varsayılan gösterim">
            <div className="row" style={{gap:4}}>
              {["kg","ton"].map(o => (
                <button key={o} onClick={() => setTweak("agirlik", o)}
                  className={`btn sm ${tweaks.agirlik === o ? "primary" : ""}`}>{o}</button>
              ))}
            </div>
          </SettingsRow>
          <SettingsRow icon="droplet" title="Yağ Birimi" desc="Çıkan yağ, kalan yağ, emanet">
            <div className="row" style={{gap:4}}>
              {["kg","lt"].map(o => (
                <button key={o} onClick={() => setTweak("yag", o)}
                  className={`btn sm ${tweaks.yag === o ? "primary" : ""}`}>{o}</button>
              ))}
            </div>
          </SettingsRow>
          <SettingsRow icon="coin" title="Para Birimi" desc="Cari, alış-satış, raporlar">
            <div className="row" style={{gap:4}}>
              {["₺","€","$"].map(o => (
                <button key={o} onClick={() => setTweak("currency", o)}
                  className={`btn sm ${tweaks.currency === o ? "primary" : ""}`}>{o}</button>
              ))}
            </div>
          </SettingsRow>
        </div>

        {/* Kart Tasarımı */}
        <div className="card">
          <div className="card-head"><h3>Kart Tasarımı (7 × 14 cm)</h3>
            <span className="badge accent">Yazıcıdan çıkacak kart</span>
          </div>
          <div className="grid grid-3">
            {cardStyles.map(cs => (
              <button key={cs.id} onClick={() => setTweak("cardDefault", cs.id)}
                className="card" style={{
                  padding: 14, textAlign:"left", cursor:"pointer",
                  background: tweaks.cardDefault === cs.id ? "var(--accent-soft)" : "var(--surface)",
                  borderColor: tweaks.cardDefault === cs.id ? "var(--accent)" : "var(--line)",
                  borderWidth: 2,
                }}>
                <div style={{
                  width: "100%", height: 80, borderRadius: 6, marginBottom: 10,
                  background: cs.id === "klasik" ? "#fbf5e6" : cs.id === "modern" ? "#ffffff" : "#fafafa",
                  border: cs.id === "klasik" ? "1px solid #c9a96b" : "1px solid #e8e8e8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: cs.id === "termal" ? "monospace" : cs.id === "klasik" ? "Instrument Serif, serif" : "Geist, sans-serif",
                  color: cs.id === "klasik" ? "#7a3024" : "#0a0a0a",
                  fontSize: 16,
                }}>
                  {cs.id === "klasik" ? "Zala Hatun" : cs.id === "modern" ? "ZALA HATUN" : "ZALA HATUN"}
                </div>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:500,fontSize:14}}>{cs.name}</div>
                    <div className="tiny muted">{cs.desc}</div>
                  </div>
                  {tweaks.cardDefault === cs.id && <Icon name="check" size={16} style={{color:"var(--accent)"}}/>}
                </div>
              </button>
            ))}
          </div>

          <div className="divider"></div>

          <div className="card-head"><h3 style={{fontSize:13}}>Kart Üzerinde Görünecek Alanlar</h3></div>
          <SettingsRow title="Hak Yağı satırı" desc="Fabrikanın aldığı %10 yağ tutarı">
            <button onClick={() => setTweak("showHakYag", !tweaks.showHakYag)}
              className={`btn sm ${tweaks.showHakYag ? "primary" : ""}`}>{tweaks.showHakYag ? "Açık" : "Kapalı"}</button>
          </SettingsRow>
          <SettingsRow title="Asit (Dizem)" desc="Asit ölçüm değeri">
            <button onClick={() => setTweak("showAsit", !tweaks.showAsit)}
              className={`btn sm ${tweaks.showAsit ? "primary" : ""}`}>{tweaks.showAsit ? "Açık" : "Kapalı"}</button>
          </SettingsRow>
          <SettingsRow title="Bidon / Çuval sayıları" desc="Tesellüm bilgisi">
            <button onClick={() => setTweak("showBidonCuval", !tweaks.showBidonCuval)}
              className={`btn sm ${tweaks.showBidonCuval ? "primary" : ""}`}>{tweaks.showBidonCuval ? "Açık" : "Kapalı"}</button>
          </SettingsRow>
          <SettingsRow title="Köy & Adres" desc="Müşteri yerleşim bilgisi">
            <button onClick={() => setTweak("showKoyAdres", !tweaks.showKoyAdres)}
              className={`btn sm ${tweaks.showKoyAdres ? "primary" : ""}`}>{tweaks.showKoyAdres ? "Açık" : "Kapalı"}</button>
          </SettingsRow>
        </div>

        {/* Yazıcı */}
        <div className="card">
          <div className="card-head"><h3>Yazıcı</h3><span className="badge good">Bağlı</span></div>
          <SettingsRow icon="print" title="Varsayılan Yazıcı" desc="Argox CP-2140 (Termal · 70 mm)">
            <button className="btn sm">Değiştir</button>
          </SettingsRow>
          <SettingsRow icon="print" title="Otomatik kopya sayısı" desc="Her sıkımda kaç kart basılsın?">
            <div className="row" style={{gap:4}}>
              {[1,2,3].map(n => (
                <button key={n} className={`btn sm ${n === 2 ? "primary" : ""}`}>{n}</button>
              ))}
            </div>
          </SettingsRow>
          <SettingsRow icon="print" title="Test sayfası bas" desc="Yazıcı kalibrasyonu için">
            <button className="btn sm">Bas</button>
          </SettingsRow>
        </div>

        {/* Sesli Giriş */}
        <div className="card">
          <div className="card-head"><h3>Sesli Giriş</h3><span className="badge accent">Beta</span></div>
          <SettingsRow icon="wand" title="Sesli giriş aktif" desc="Form alanlarında mikrofon butonu göster">
            <button className="btn sm primary">Açık</button>
          </SettingsRow>
          <SettingsRow icon="wand" title="Dil" desc="Konuşma tanıma dili">
            <select className="btn" style={{padding:"6px 12px"}}>
              <option>Türkçe (tr-TR)</option>
              <option>English (en-US)</option>
            </select>
          </SettingsRow>
          <SettingsRow icon="wand" title="Otomatik onay" desc="Konuşma tamamlanınca alan otomatik dolsun">
            <button className="btn sm primary">Açık</button>
          </SettingsRow>
        </div>

        {/* Bildirim & Veri */}
        <div className="card">
          <div className="card-head"><h3>Bildirim & Veri</h3></div>
          <SettingsRow icon="bell" title="Asit uyarı eşiği" desc="Bu değerin üstünde alarm">
            <input type="number" step="0.01" defaultValue="0.6" style={{width: 80, padding:"6px 10px", borderRadius:6, border:"1px solid var(--line)"}} />
          </SettingsRow>
          <SettingsRow icon="bell" title="Düşük verim uyarısı" desc="Verim oranı bu yüzdenin altındaysa">
            <div className="row" style={{gap:4}}>
              <input type="number" defaultValue="17" style={{width: 60, padding:"6px 10px", borderRadius:6, border:"1px solid var(--line)"}}/>
              <span>%</span>
            </div>
          </SettingsRow>
          <SettingsRow icon="archive" title="Veriyi yedekle" desc="Tüm müşteri/sipariş verisini dışa aktar">
            <button className="btn sm"><Icon name="download" size={12}/>Yedek Al</button>
          </SettingsRow>
          <SettingsRow icon="folder" title="Yeniden başlat" desc="Bu cihazdaki ayarları sıfırla">
            <button className="btn sm">Sıfırla</button>
          </SettingsRow>
        </div>

        {/* Hesap */}
        <div className="card">
          <div className="card-head"><h3>Hesap</h3></div>
          <SettingsRow icon="users" title="Mustafa Karan" desc="Operatör · mustafa@zalahatun.com.tr">
            <button className="btn sm">Düzenle</button>
          </SettingsRow>
          <SettingsRow icon="users" title="Operatörler" desc="Mustafa, İsmet, +1 daha">
            <button className="btn sm">Yönet</button>
          </SettingsRow>
          <SettingsRow icon="settings" title="Çıkış Yap" desc="Bu cihazdan çıkış">
            <button className="btn sm" style={{color:"var(--bad)"}}>Çıkış</button>
          </SettingsRow>
        </div>

        {/* Hakkında */}
        <div className="card">
          <div className="card-head"><h3>Hakkında</h3></div>
          <div className="row" style={{gap: 16, alignItems:"flex-start", flexWrap:"wrap"}}>
            <div className="brand-mark" style={{width: 56, height: 56, fontSize: 28}}>Z</div>
            <div style={{flex: 1, minWidth: 200}}>
              <div className="serif" style={{fontSize: 24, lineHeight: 1.1}}>Zala Hatun Yağ Takip Paneli</div>
              <div className="tiny muted" style={{marginTop: 4}}>Sürüm 0.4.2 · PWA · Sezon 2026–27</div>
              <div style={{marginTop: 12, fontSize: 13, lineHeight: 1.5, maxWidth: 520}}>
                Çamlıbel Mahallesi, Zeytinli Yol no:7 / Milas / Muğla<br/>
                0252 614 87 30 · zalahatun.com.tr
              </div>
            </div>
            <div className="col" style={{gap:8, minWidth: 160}}>
              <button className="btn sm"><Icon name="folder" size={12} />Kullanım Kılavuzu</button>
              <button className="btn sm"><Icon name="phone" size={12} />Destek</button>
              <button className="btn sm ghost">Gizlilik & Şartlar</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

Object.assign(window, { Ayarlar });

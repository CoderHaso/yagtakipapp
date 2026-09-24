// 7×14 cm print cards - 3 variations
// All take same data shape: { firma, musteri, siparis, zeytinTuru }

const PrintCardKlasik = ({ firma, musteri, siparis, zeytinTuru, units }) => {
  const u = units || { agirlik: "kg", yag: "kg" };
  return (
    <div className="pcard klasik">
      <div className="pc-brand">
        <div className="logo">ZH</div>
        <div className="name">{firma.ad}</div>
        <div className="sub">{firma.alt}</div>
      </div>
      <div className="pc-rows">
        <div className="pc-row"><span className="k">İsim Soyisim</span><span className="v">{musteri?.ad || "—"}</span></div>
        <div className="pc-row"><span className="k">Zeytin (Kg)</span><span className="v big">{fmt.num(siparis.zeytinKg, 0)}</span></div>
        <div className="pc-row"><span className="k">Zeytin Türü</span><span className="v">{zeytinTuru?.ad || "—"}</span></div>
        <div className="pc-row"><span className="k">Çıkan Yağ</span><span className="v big">{fmt.num(siparis.cikanYag, 1)} {u.yag}</span></div>
        <div className="pc-row"><span className="k">Hak Yağı</span><span className="v">{fmt.num(siparis.hakYagKg, 1)} {u.yag}</span></div>
        <div className="pc-row"><span className="k">Kalan Yağ</span><span className="v big">{fmt.num(siparis.kalanYagKg, 1)} {u.yag}</span></div>
        <div className="pc-row"><span className="k">Oran</span><span className="v">{fmt.pct(siparis.oran)}</span></div>
        <div className="pc-row"><span className="k">Asit (Dizem)</span><span className="v">{fmt.num(siparis.asit, 2)}</span></div>
        <div className="pc-row"><span className="k">Bidon / Çuval</span><span className="v">{siparis.bidon ?? "—"} / {siparis.cuval ?? "—"}</span></div>
        <div className="pc-row"><span className="k">Köy & Adres</span><span className="v" style={{fontSize: "8pt"}}>{musteri?.koy} — {musteri?.adres}</span></div>
        <div className="pc-row"><span className="k">İletişim</span><span className="v">{musteri?.tel}</span></div>
      </div>
      <div className="pc-foot">
        <strong>{firma.ad}</strong> · {firma.tel}<br/>
        {firma.adres}
      </div>
    </div>
  );
};

const PrintCardModern = ({ firma, musteri, siparis, zeytinTuru, units }) => {
  const u = units || { agirlik: "kg", yag: "kg" };
  return (
    <div className="pcard modern">
      <div className="pc-head">
        <div className="name">
          {firma.ad.split(" ").slice(0, 2).join(" ")}
          <small>{firma.alt}</small>
        </div>
        <div className="num">
          <div className="id">{siparis.id}</div>
          <div className="date">{fmt.dateShort(siparis.tarih)}</div>
        </div>
      </div>
      <div className="pc-hero">
        <div className="ad">{musteri?.ad || "—"}</div>
        <div className="koy">{musteri?.koy} · {musteri?.tel}</div>
      </div>
      <div className="pc-stats">
        <div className="cell">
          <div className="k">Zeytin</div>
          <div className="v">{fmt.num(siparis.zeytinKg, 0)} <span style={{fontSize:"7pt",color:"#767676"}}>{u.agirlik}</span></div>
        </div>
        <div className="cell">
          <div className="k">Tür</div>
          <div className="v" style={{fontSize:"11pt"}}>{zeytinTuru?.ad || "—"}</div>
        </div>
        <div className="cell hi">
          <div className="k">Çıkan Yağ</div>
          <div className="v">{fmt.num(siparis.cikanYag, 1)} <span style={{fontSize:"7pt",color:"#767676"}}>{u.yag}</span></div>
        </div>
        <div className="cell hi">
          <div className="k">Kalan Yağ</div>
          <div className="v">{fmt.num(siparis.kalanYagKg, 1)} <span style={{fontSize:"7pt",color:"#767676"}}>{u.yag}</span></div>
        </div>
        <div className="cell">
          <div className="k">Hak Yağı</div>
          <div className="v mono">{fmt.num(siparis.hakYagKg, 1)}</div>
        </div>
        <div className="cell">
          <div className="k">Oran</div>
          <div className="v mono">{fmt.pct(siparis.oran)}</div>
        </div>
        <div className="cell">
          <div className="k">Asit (Dizem)</div>
          <div className="v mono">{fmt.num(siparis.asit, 2)}</div>
        </div>
        <div className="cell">
          <div className="k">Bidon · Çuval</div>
          <div className="v mono">{siparis.bidon ?? "—"} · {siparis.cuval ?? "—"}</div>
        </div>
      </div>
      <div className="pc-foot">
        <div className="brand">
          <strong>{firma.ad}</strong>
          <span>{firma.tel}</span>
        </div>
        <div style={{marginTop:"1mm"}}>{firma.adres}</div>
      </div>
    </div>
  );
};

const PrintCardTermal = ({ firma, musteri, siparis, zeytinTuru, units }) => {
  const u = units || { agirlik: "kg", yag: "kg" };
  // Faux barcode pattern
  const barPattern = "1213122131121221311231221312113122131221221312113221";
  return (
    <div className="pcard termal">
      <div className="t-brand">
        <div className="n">{firma.ad.toUpperCase()}</div>
        <div className="s">{firma.alt}</div>
      </div>
      <div className="t-meta">
        <span>{siparis.id}</span>
        <span>{fmt.dateShort(siparis.tarih)} {siparis.saat || ""}</span>
      </div>
      <div className="t-rows">
        <div className="t-row"><span className="k">MÜŞTERİ</span><span className="dots"></span><span className="v">{musteri?.ad}</span></div>
        <div className="t-row"><span className="k">KÖY</span><span className="dots"></span><span className="v">{musteri?.koy}</span></div>
        <div className="t-row"><span className="k">TEL</span><span className="dots"></span><span className="v">{musteri?.tel}</span></div>
        <div className="t-row"><span className="k">TÜR</span><span className="dots"></span><span className="v">{zeytinTuru?.ad}</span></div>
        <div className="t-divider"></div>
        <div className="t-row big"><span className="k">ZEYTİN</span><span className="dots"></span><span className="v">{fmt.num(siparis.zeytinKg,0)} {u.agirlik}</span></div>
        <div className="t-row big"><span className="k">ÇIKAN YAĞ</span><span className="dots"></span><span className="v">{fmt.num(siparis.cikanYag,1)} {u.yag}</span></div>
        <div className="t-row big"><span className="k">KALAN YAĞ</span><span className="dots"></span><span className="v">{fmt.num(siparis.kalanYagKg,1)} {u.yag}</span></div>
        <div className="t-divider"></div>
        <div className="t-row"><span className="k">HAK YAĞI</span><span className="dots"></span><span className="v">{fmt.num(siparis.hakYagKg,1)} {u.yag}</span></div>
        <div className="t-row"><span className="k">ORAN</span><span className="dots"></span><span className="v">{fmt.pct(siparis.oran)}</span></div>
        <div className="t-row"><span className="k">ASİT</span><span className="dots"></span><span className="v">{fmt.num(siparis.asit, 2)}</span></div>
        <div className="t-row"><span className="k">BİDON</span><span className="dots"></span><span className="v">{siparis.bidon ?? "—"}</span></div>
        <div className="t-row"><span className="k">ÇUVAL</span><span className="dots"></span><span className="v">{siparis.cuval ?? "—"}</span></div>
      </div>
      <div className="t-bar">
        <div className="t-barcode">
          {barPattern.split("").map((c, i) => {
            const w = c === "1" ? "" : c === "2" ? "w2" : "w3";
            return <React.Fragment key={i}><i className={w}></i><i className="sp"></i></React.Fragment>;
          })}
        </div>
        <div className="t-bcid">* {siparis.id?.replace("-", "")} *</div>
      </div>
      <div className="t-foot">
        {firma.tel} &nbsp;|&nbsp; {firma.gsm}<br/>
        {firma.adres}
      </div>
    </div>
  );
};

const PrintCard = ({ stil = "klasik", ...props }) => {
  if (stil === "modern") return <PrintCardModern {...props} />;
  if (stil === "termal") return <PrintCardTermal {...props} />;
  return <PrintCardKlasik {...props} />;
};

Object.assign(window, { PrintCard, PrintCardKlasik, PrintCardModern, PrintCardTermal });

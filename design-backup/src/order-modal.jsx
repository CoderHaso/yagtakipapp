// Order detail modal
const OrderDetailModal = ({ order, onClose, units, currency, openCustomer }) => {
  const D = window.__APP_DATA__;
  if (!order) return null;
  const m = D.MUSTERILER.find(x => x.id === order.musteriId);
  const tur = D.ZEYTIN_TURLERI.find(t => t.id === order.tur);
  const [cardStyle, setCardStyle] = React.useState("klasik");

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="row" style={{gap:12, alignItems:"baseline"}}>
              <h2 style={{fontFamily:"var(--font-display)", fontSize:28, fontWeight:400}}>{order.id}</h2>
              <StatusBadge status={order.durum} />
            </div>
            <div className="muted tiny" style={{marginTop:4}}>{fmt.date(order.tarih)} · {order.saat} · {order.operator}</div>
          </div>
          <button className="btn icon ghost" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body">
          <div className="grid" style={{gridTemplateColumns:"1.2fr 1fr", gap: 24}}>
            <div className="col" style={{gap: 16}}>
              <div className="card" style={{padding: 16, background:"var(--bg-2)"}}>
                <div className="row" style={{alignItems:"center", gap: 12}}>
                  <div className="avatar" style={{width: 44, height: 44, fontSize: 14}}>{initialsOf(m?.ad || "")}</div>
                  <div style={{flex:1}}>
                    <div className="bold" style={{fontSize:15}}>{m?.ad}</div>
                    <div className="tiny muted">{m?.koy} · {m?.tel}</div>
                  </div>
                  <button className="btn sm" onClick={() => { onClose(); openCustomer(m); }}>Müşteri Detayı</button>
                </div>
              </div>

              <div className="kv-grid">
                <div className="kv"><div className="k">Zeytin</div><div className="v">{fmt.int(order.zeytinKg)} <span style={{fontSize:13,color:"var(--ink-3)"}}>{units.agirlik}</span></div></div>
                <div className="kv"><div className="k">Tür</div><div className="v" style={{fontSize:16}}>{tur?.ad}</div></div>
                <div className="kv"><div className="k">Çıkan Yağ</div><div className="v">{fmt.num(order.cikanYag,1)} <span style={{fontSize:13,color:"var(--ink-3)"}}>{units.yag}</span></div></div>
                <div className="kv"><div className="k">Oran</div><div className="v mono">% {fmt.num(order.oran,1)}</div></div>
                <div className="kv"><div className="k">Hak Yağı</div><div className="v">{fmt.num(order.hakYagKg,1)} <span style={{fontSize:13,color:"var(--ink-3)"}}>{units.yag}</span></div></div>
                <div className="kv"><div className="k">Kalan Yağ</div><div className="v">{fmt.num(order.kalanYagKg,1)} <span style={{fontSize:13,color:"var(--ink-3)"}}>{units.yag}</span></div></div>
                <div className="kv"><div className="k">Asit</div><div className="v mono">{fmt.num(order.asit,2)}</div></div>
                <div className="kv"><div className="k">Bidon · Çuval</div><div className="v mono" style={{fontSize:18}}>{order.bidon ?? "—"} · {order.cuval ?? "—"}</div></div>
              </div>

              {order.not && (
                <div className="card" style={{padding: 12, background:"var(--accent-soft)", borderColor:"var(--accent)"}}>
                  <div className="tiny muted" style={{marginBottom:2}}>OPERATÖR NOTU</div>
                  <div style={{fontStyle:"italic"}}>"{order.not}"</div>
                </div>
              )}

              <div className="row">
                <button className="btn primary"><Icon name="print" />Kartı Yeniden Bas</button>
                <button className="btn"><Icon name="edit" />Düzenle</button>
                <button className="btn ghost"><Icon name="download" size={14} />İndir</button>
              </div>
            </div>

            <div>
              <div className="card-head"><h3 style={{fontSize:13}}>Bu işlem için kart</h3>
                <div className="row">
                  {["klasik","modern","termal"].map(s => (
                    <button key={s} onClick={() => setCardStyle(s)}
                      className={`btn sm ${cardStyle === s ? "primary" : "ghost"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex", justifyContent:"center"}}>
                <div className="print-card-wrap" style={{transform:"scale(0.8)", transformOrigin:"top center"}}>
                  <div className="rule">70mm × 140mm</div>
                  <PrintCard stil={cardStyle} firma={D.FIRMA} musteri={m} siparis={order} zeytinTuru={tur} units={units} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { OrderDetailModal });

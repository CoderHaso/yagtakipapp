// Main App: orchestrator + tweaks panel

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "toprak",
  "fontDisplay": "Instrument Serif",
  "fontBody": "Geist",
  "density": 1,
  "darkMode": false,
  "agirlik": "kg",
  "yag": "kg",
  "currency": "₺",
  "cardDefault": "klasik",
  "showHakYag": true,
  "showAsit": true,
  "showBidonCuval": true,
  "showKoyAdres": true
}/*EDITMODE-END*/;

const App = () => {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [page, setPage] = React.useState("dashboard");
  const [activeCustomer, setActiveCustomer] = React.useState(null);
  const [activeOrder, setActiveOrder] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const units = { agirlik: tweaks.agirlik, yag: tweaks.yag };
  const currency = tweaks.currency;

  // Apply palette + font + density to root
  React.useEffect(() => {
    document.documentElement.setAttribute("data-palette", tweaks.palette);
    document.documentElement.style.setProperty("--font-display", `"${tweaks.fontDisplay}", Georgia, serif`);
    document.documentElement.style.setProperty("--font-body", `"${tweaks.fontBody}", system-ui, sans-serif`);
    document.documentElement.style.setProperty("--density", tweaks.density);
  }, [tweaks.palette, tweaks.fontDisplay, tweaks.fontBody, tweaks.density]);

  const openCustomer = (m) => { setActiveCustomer(m); setPage("musteri-detay"); };
  const openOrder = (o) => setActiveOrder(o);
  const navigate = (p) => { setPage(p); setDrawerOpen(false); };

  // Expose drawer opener globally so any Topbar can trigger it
  React.useEffect(() => {
    window.__openDrawer = () => setDrawerOpen(true);
    return () => { delete window.__openDrawer; };
  }, []);

  // Voice command handler
  const onVoiceCommand = (type, payload) => {
    if (type === "nav") navigate(payload);
  };

  // Page routing
  let pageEl = null;
  switch (page) {
    case "dashboard":
      pageEl = <Dashboard goto={navigate} openCustomer={openCustomer} openOrder={openOrder} units={units} currency={currency} />;
      break;
    case "yeni-islem":
      pageEl = <YeniIslem units={units} currency={currency} defaultCardStyle={tweaks.cardDefault} />;
      break;
    case "aktif":
      pageEl = <AktifSiparisler openOrder={openOrder} units={units} />;
      break;
    case "musteri":
      pageEl = <MusteriYonetimi openCustomer={openCustomer} units={units} />;
      break;
    case "musteri-detay":
      pageEl = <MusteriDetay musteri={activeCustomer} onBack={() => navigate("musteri")} units={units} currency={currency} openOrder={openOrder} />;
      break;
    case "hareket":
      pageEl = <Hareketler units={units} currency={currency} openCustomer={openCustomer} />;
      break;
    case "bidon":
      pageEl = <BidonTakibi units={units} />;
      break;
    case "stok":
      pageEl = <Stok units={units} currency={currency} />;
      break;
    case "asit":
      pageEl = <AsitGecmisi units={units} openCustomer={openCustomer} />;
      break;
    case "cari":
      pageEl = <Cari currency={currency} units={units} openCustomer={openCustomer} />;
      break;
    case "raporlar":
      pageEl = <Raporlar units={units} currency={currency} />;
      break;
    case "koy":
      pageEl = <KoyBolge units={units} />;
      break;
    case "sezon":
      pageEl = <SezonKarsilastirma units={units} />;
      break;
    case "yazdirma":
      pageEl = <YazdirmaGecmisi openCustomer={openCustomer} openOrder={openOrder} />;
      break;
    case "ayarlar":
      pageEl = <Ayarlar tweaks={tweaks} setTweak={setTweak} units={units} />;
      break;
    default:
      pageEl = <Dashboard goto={navigate} openCustomer={openCustomer} openOrder={openOrder} units={units} currency={currency} />;
  }

  const screenLabel = NAV_ITEMS.find(n => n.id === page)?.label || (page === "musteri-detay" ? "Müşteri Detay" : "Panel");

  return (
    <>
      <div className={`app ${drawerOpen ? "drawer-open" : ""}`} data-screen-label={screenLabel}>
        <Sidebar active={page === "musteri-detay" ? "musteri" : page} onNav={navigate} />
        <main className="main">
          {pageEl}
        </main>
      </div>

      <MobileDrawer
        open={drawerOpen}
        active={page === "musteri-detay" ? "musteri" : page}
        onNav={navigate}
        onClose={() => setDrawerOpen(false)}
      />

      <MobileBottomNav
        active={page === "musteri-detay" ? "musteri" : page}
        onNav={navigate}
        onOpenMenu={() => setDrawerOpen(true)}
      />

      <VoiceCommandFAB onCommand={onVoiceCommand} />

      <OrderDetailModal order={activeOrder} onClose={() => setActiveOrder(null)} units={units} currency={currency} openCustomer={openCustomer} />

      <TweaksPanel>
        <TweakSection label="Renk Paleti" />
        <TweakSelect label="Tema" value={tweaks.palette} onChange={v => setTweak("palette", v)}
          options={[
            { value: "toprak", label: "Toprak (krem + olive + terracotta)" },
            { value: "modern", label: "Modern Minimal" },
            { value: "koyu", label: "Koyu Mod" },
            { value: "klasik", label: "Klasik (krem + bordo)" },
          ]} />

        <TweakSection label="Tipografi" />
        <TweakSelect label="Başlık Fontu" value={tweaks.fontDisplay} onChange={v => setTweak("fontDisplay", v)}
          options={["Instrument Serif", "Cormorant Garamond", "Bricolage Grotesque", "Geist"]} />
        <TweakSelect label="Metin Fontu" value={tweaks.fontBody} onChange={v => setTweak("fontBody", v)}
          options={["Geist", "Inter", "DM Sans", "Manrope"]} />

        <TweakSection label="Yoğunluk" />
        <TweakSlider label="Aralık" value={tweaks.density} onChange={v => setTweak("density", v)} min={0.7} max={1.3} step={0.05} />

        <TweakSection label="Birim & Para" />
        <TweakRadio label="Ağırlık" value={tweaks.agirlik} onChange={v => setTweak("agirlik", v)} options={["kg","ton"]} />
        <TweakRadio label="Yağ" value={tweaks.yag} onChange={v => setTweak("yag", v)} options={["kg","lt"]} />
        <TweakRadio label="Para" value={tweaks.currency} onChange={v => setTweak("currency", v)} options={["₺","€","$"]} />

        <TweakSection label="Kart Tasarımı" />
        <TweakRadio label="Varsayılan Stil" value={tweaks.cardDefault} onChange={v => setTweak("cardDefault", v)} options={["klasik","modern","termal"]} />

        <TweakSection label="Kart Alanları" />
        <TweakToggle label="Hak Yağı" value={tweaks.showHakYag} onChange={v => setTweak("showHakYag", v)} />
        <TweakToggle label="Asit (Dizem)" value={tweaks.showAsit} onChange={v => setTweak("showAsit", v)} />
        <TweakToggle label="Bidon / Çuval" value={tweaks.showBidonCuval} onChange={v => setTweak("showBidonCuval", v)} />
        <TweakToggle label="Köy & Adres" value={tweaks.showKoyAdres} onChange={v => setTweak("showKoyAdres", v)} />
      </TweaksPanel>
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

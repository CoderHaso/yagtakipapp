// Sidebar + Topbar layout
const NAV_ITEMS = [
  { id: "dashboard", label: "Panel", icon: "dashboard", group: "main" },
  { id: "yeni-islem", label: "Yeni İşlem", icon: "newOrder", group: "main", primary: true },
  { id: "aktif", label: "İşlemdeki Siparişler", icon: "list", group: "main", badge: 3 },
  { id: "musteri", label: "Müşteri Yönetimi", icon: "users", group: "main" },
  { id: "hareket", label: "Emanet / Alış-Satış", icon: "swap", group: "ops" },
  { id: "bidon", label: "Bidon Takibi", icon: "barrel", group: "ops" },
  { id: "stok", label: "Stok Yönetimi", icon: "stock", group: "ops" },
  { id: "asit", label: "Asit (Dizem) Geçmişi", icon: "droplet", group: "ops" },
  { id: "cari", label: "Borç / Alacak (Cari)", icon: "coin", group: "ops" },
  { id: "raporlar", label: "Raporlama", icon: "chart", group: "analiz" },
  { id: "koy", label: "Köy / Bölge", icon: "map", group: "analiz" },
  { id: "sezon", label: "Sezon Karşılaştırma", icon: "calendar", group: "analiz" },
  { id: "yazdirma", label: "Yazdırma Geçmişi", icon: "print", group: "analiz" },
  { id: "ayarlar", label: "Ayarlar", icon: "settings", group: "sistem" },
];

const Sidebar = ({ active, onNav }) => {
  const groups = [
    { id: "main", label: "Ana Menü" },
    { id: "ops", label: "İşlemler" },
    { id: "analiz", label: "Analiz & Raporlar" },
    { id: "sistem", label: "Sistem" },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">Z</div>
        <div className="brand-text">
          <strong>Zala Hatun</strong>
          <span>Yağ Takip Paneli</span>
        </div>
      </div>
      <div className="season-pill">
        <span className="dot"></span> Sezon 2026–27 · 12. gün
      </div>
      <nav className="nav">
        {groups.map(g => (
          <div key={g.id} className="nav-group">
            <div className="nav-label">{g.label}</div>
            {NAV_ITEMS.filter(i => i.group === g.id).map(item => (
              <button
                key={item.id}
                className={`nav-item ${active === item.id ? "active" : ""}`}
                onClick={() => onNav(item.id)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.badge && <span className="badge">{item.badge}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="user-card">
        <div className="avatar">MK</div>
        <div className="user-info" style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Mustafa Karan</span>
          <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Operatör</span>
        </div>
      </div>
    </aside>
  );
};

const Topbar = ({ title, subtitle, actions }) => (
  <header className="topbar">
    <button className="topbar-menu" onClick={() => window.__openDrawer?.()} aria-label="Menü" style={{display:"none"}}>
      <Icon name="list" size={18} />
    </button>
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
      {subtitle && <div className="crumbs">{subtitle}</div>}
      <h1>{title}</h1>
    </div>
    <div className="search">
      <Icon name="search" size={14} />
      <input placeholder="Müşteri, sipariş, bidon ara…" />
      <kbd>⌘K</kbd>
    </div>
    {actions}
  </header>
);

// Mobile bottom navigation (5 items + central FAB)
const MobileBottomNav = ({ active, onNav, onOpenMenu }) => {
  const items = [
    { id: "dashboard", label: "Panel", icon: "dashboard" },
    { id: "aktif", label: "Aktif", icon: "list", badge: 3 },
    { id: "yeni-islem", label: "Yeni", icon: "plus", fab: true },
    { id: "musteri", label: "Müşteri", icon: "users" },
    { id: "_menu", label: "Daha", icon: "settings" },
  ];
  return (
    <nav className="mobile-bottom-nav">
      {items.map(it => (
        <button
          key={it.id}
          className={`mnav-item ${active === it.id || (it.id === "musteri" && active === "musteri-detay") ? "active" : ""} ${it.fab ? "fab" : ""}`}
          onClick={() => it.id === "_menu" ? onOpenMenu() : onNav(it.id)}
        >
          <Icon name={it.icon} size={it.fab ? 22 : 20} />
          <span>{it.label}</span>
          {it.badge && !it.fab && <span className="mnav-badge">{it.badge}</span>}
        </button>
      ))}
    </nav>
  );
};

// Mobile drawer for full nav
const MobileDrawer = ({ open, active, onNav, onClose }) => {
  const groups = [
    { id: "main", label: "Ana Menü" },
    { id: "ops", label: "İşlemler" },
    { id: "analiz", label: "Analiz & Raporlar" },
    { id: "sistem", label: "Sistem" },
  ];
  return (
    <>
      <div className="drawer-back" onClick={onClose}></div>
      <aside className="mobile-drawer" style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}>
        <div className="brand" style={{padding: "0 12px 16px", borderBottom: "1px solid var(--line)", marginBottom: 12}}>
          <div className="brand-mark">Z</div>
          <div className="brand-text">
            <strong>Zala Hatun</strong>
            <span>Yağ Takip Paneli</span>
          </div>
        </div>
        <nav className="nav">
          {groups.map(g => (
            <div key={g.id} className="nav-group">
              <div className="nav-label">{g.label}</div>
              {NAV_ITEMS.filter(i => i.group === g.id).map(item => (
                <button
                  key={item.id}
                  className={`nav-item ${active === item.id ? "active" : ""}`}
                  onClick={() => { onNav(item.id); onClose(); }}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  {item.badge && <span className="badge">{item.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="user-card" style={{marginTop: 12}}>
          <div className="avatar">MK</div>
          <div style={{display:"flex", flexDirection:"column", lineHeight:1.2}}>
            <span style={{fontSize:13, fontWeight:500}}>Mustafa Karan</span>
            <span style={{fontSize:11, color:"var(--ink-3)"}}>Operatör</span>
          </div>
        </div>
      </aside>
    </>
  );
};

Object.assign(window, { Sidebar, Topbar, MobileBottomNav, MobileDrawer, NAV_ITEMS });

// Icons (inline SVG) and small UI primitives
const Icon = ({ name, size = 16, strokeWidth = 1.6, ...rest }) => {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    newOrder: <><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></>,
    users: <><circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M22 19c0-2.5-2-4-4-4"/></>,
    barrel: <><ellipse cx="12" cy="4.5" rx="6.5" ry="1.8"/><path d="M5.5 4.5v15c0 1 2.9 1.8 6.5 1.8s6.5-.8 6.5-1.8v-15"/><path d="M5.5 9c2 .8 4.2 1 6.5 1s4.5-.2 6.5-1M5.5 15c2 .8 4.2 1 6.5 1s4.5-.2 6.5-1"/></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></>,
    swap: <><path d="M7 4l-4 4 4 4M3 8h14M17 12l4 4-4 4M21 16H7"/></>,
    stock: <><rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M8 7V4h8v3M3 12h18"/></>,
    droplet: <><path d="M12 3s-6 7-6 11a6 6 0 0012 0c0-4-6-11-6-11z"/></>,
    map: <><path d="M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2zM9 3v16M15 5v16"/></>,
    print: <><path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="7"/></>,
    coin: <><circle cx="12" cy="12" r="9"/><path d="M9 8h5a2 2 0 010 4H10m0 0h4.5a2 2 0 010 4H9M12 6v2M12 16v2"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></>,
    bell: <><path d="M6 8a6 6 0 0112 0v5l2 3H4l2-3V8z"/><path d="M10 19a2 2 0 004 0"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
    edit: <><path d="M16 3l5 5L8 21H3v-5L16 3z"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M1 12h4M19 12h4M4.2 19.8l2.8-2.8M17 7l2.8-2.8"/></>,
    olive: <><path d="M12 4c-4 0-7 3-7 7 0 4 3 9 7 9s7-5 7-9c0-4-3-7-7-7z"/><path d="M12 4c0-1 .5-2 1.5-2"/></>,
    phone: <><path d="M5 4h4l2 5-3 2a12 12 0 005 5l2-3 5 2v4a2 2 0 01-2 2A17 17 0 013 6a2 2 0 012-2z"/></>,
    home: <><path d="M3 11l9-8 9 8M5 10v10h14V10"/></>,
    check: <><path d="M5 12l5 5L20 7"/></>,
    x: <><path d="M6 6l12 12M18 6l-6 12-6-12"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    truck: <><rect x="2" y="7" width="13" height="9" rx="1"/><path d="M15 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    flag: <><path d="M5 3v18M5 4h12l-2 4 2 4H5"/></>,
    wand: <><path d="M3 21L21 3M15 3l6 6M9 9l6 6"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></>,
    archive: <><rect x="2" y="4" width="20" height="4" rx="1"/><path d="M4 8v11a1 1 0 001 1h14a1 1 0 001-1V8M9 13h6"/></>,
    folder: <><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></>,
    leaf: <><path d="M21 3c-9 0-15 5-15 13 0 2 1 4 2 5 1-9 6-15 13-15M5 21c1-6 4-10 9-12"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {paths[name] || null}
    </svg>
  );
};

// number formatters
const fmt = {
  kg: (n, unit = "kg") => n == null ? "—" : `${Number(n).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} ${unit}`,
  num: (n, d = 1) => n == null ? "—" : Number(n).toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d }),
  int: (n) => n == null ? "—" : Number(n).toLocaleString("tr-TR"),
  pct: (n) => n == null ? "—" : `% ${Number(n).toFixed(1)}`,
  money: (n, curr = "₺") => n == null ? "—" : `${curr}${Number(n).toLocaleString("tr-TR")}`,
  date: (d) => d ? new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) : "—",
  dateShort: (d) => d ? new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }) : "—",
};

// Status badge mapping
const StatusBadge = ({ status }) => {
  const map = {
    tamamlandi: { cls: "good", txt: "Tamamlandı" },
    preste: { cls: "accent", txt: "Preste" },
    yikamada: { cls: "warn", txt: "Yıkamada" },
    kuyrukta: { cls: "bad", txt: "Kuyrukta" },
    aktif: { cls: "good", txt: "Aktif" },
    pasif: { cls: "", txt: "Pasif" },
    dolu: { cls: "good", txt: "Dolu" },
    yarim: { cls: "warn", txt: "Yarım" },
    bos: { cls: "", txt: "Boş" },
    "emanet-birak": { cls: "accent", txt: "Emanet bırakma" },
    "emanet-cek": { cls: "accent-2", txt: "Emanet çekme" },
    alis: { cls: "accent", txt: "Alış" },
    satis: { cls: "accent-2", txt: "Satış" },
  };
  const m = map[status] || { cls: "", txt: status };
  return <span className={`badge ${m.cls}`}><span className="dot"></span>{m.txt}</span>;
};

// Initial avatar
const initialsOf = (name) => name.split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase();

// Sparkline (simple bars)
const Spark = ({ values, highlightLast = true }) => {
  const max = Math.max(...values, 1);
  return (
    <div className="spark">
      {values.map((v, i) => (
        <span
          key={i}
          className={`b ${highlightLast && i === values.length - 1 ? "hi" : ""}`}
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
};

Object.assign(window, { Icon, fmt, StatusBadge, initialsOf, Spark });

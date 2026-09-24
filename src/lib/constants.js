export const ZEYTIN_TURLERI = [
  { id: 'memecik', ad: 'Memecik', region: 'Ege' },
  { id: 'gemlik', ad: 'Gemlik', region: 'Marmara' },
  { id: 'ayvalik', ad: 'Ayvalık (Edremit)', region: 'Ege' },
  { id: 'domat', ad: 'Domat', region: 'Ege' },
  { id: 'erkence', ad: 'Erkence', region: 'İzmir' },
  { id: 'kilis', ad: 'Kilis Yağlık', region: 'Güneydoğu' },
  { id: 'nizip', ad: 'Nizip Yağlık', region: 'Güneydoğu' },
  { id: 'karisik', ad: 'Karışık', region: '—' },
]

export const KOYLER = [
  'Çamlıbel', 'Yeniköy', 'Bağyaka', 'Çobanisa', 'Karatepe',
  'Akçakaya', 'Selimiye', 'Gökyaka', 'Ulupınar', 'Demirciler',
]

export const FIRMA = {
  ad: 'Zala Hatun Zeytinyağı',
  alt: 'Geleneksel Soğuk Sıkım',
  tel: '0252 614 87 30',
  gsm: '0532 411 09 22',
  adres: 'Çamlıbel Mahallesi, Zeytinli Yol no:7 / Milas / Muğla',
  web: 'zalahatun.com.tr',
  vergi: 'Milas V.D. 8970 458 213',
}

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Panel', icon: 'dashboard', group: 'main' },
  { id: 'yeni-islem', label: 'Yeni İşlem', icon: 'newOrder', group: 'main', primary: true },
  { id: 'aktif', label: 'İşlemdeki Siparişler', icon: 'list', group: 'main', badge: 0 },
  { id: 'musteri', label: 'Müşteri Yönetimi', icon: 'users', group: 'main' },
  { id: 'hareket', label: 'Emanet / Alış-Satış', icon: 'swap', group: 'ops' },
  { id: 'bidon', label: 'Bidon Takibi', icon: 'barrel', group: 'ops' },
  { id: 'stok', label: 'Stok Yönetimi', icon: 'stock', group: 'ops' },
  { id: 'asit', label: 'Asit (Dizem) Geçmişi', icon: 'droplet', group: 'ops' },
  { id: 'cari', label: 'Borç / Alacak (Cari)', icon: 'coin', group: 'ops' },
  { id: 'raporlar', label: 'Raporlama', icon: 'chart', group: 'analiz' },
  { id: 'koy', label: 'Köy / Bölge', icon: 'map', group: 'analiz' },
  { id: 'sezon', label: 'Sezon Karşılaştırma', icon: 'calendar', group: 'analiz' },
  { id: 'yazdirma', label: 'Yazdırma Geçmişi', icon: 'print', group: 'analiz' },
  { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', group: 'sistem' },
]

export const NAV_GROUPS = [
  { id: 'main', label: 'Ana Menü' },
  { id: 'ops', label: 'İşlemler' },
  { id: 'analiz', label: 'Analiz & Raporlar' },
  { id: 'sistem', label: 'Sistem' },
]

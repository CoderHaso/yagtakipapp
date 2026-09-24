// Mock data for Zala Hatun Yağ Takip
const ZEYTIN_TURLERI = [
  { id: "memecik", ad: "Memecik", region: "Ege" },
  { id: "gemlik", ad: "Gemlik", region: "Marmara" },
  { id: "ayvalik", ad: "Ayvalık (Edremit)", region: "Ege" },
  { id: "domat", ad: "Domat", region: "Ege" },
  { id: "erkence", ad: "Erkence", region: "İzmir" },
  { id: "kilis", ad: "Kilis Yağlık", region: "Güneydoğu" },
  { id: "nizip", ad: "Nizip Yağlık", region: "Güneydoğu" },
  { id: "karisik", ad: "Karışık", region: "—" },
];

const KOYLER = [
  "Çamlıbel", "Yeniköy", "Bağyaka", "Çobanisa", "Karatepe",
  "Akçakaya", "Selimiye", "Gökyaka", "Ulupınar", "Demirciler",
];

// Helper for ID generation
const id = (p, n) => `${p}-${String(n).padStart(4, "0")}`;

const MUSTERILER = [
  { id: id("M", 1), ad: "Hüseyin Aydın", tel: "0532 412 88 22", koy: "Çamlıbel", adres: "Çamlıbel köyü, Akçaova mevkii", durum: "aktif", uyelik: "2019-09-12", notlar: "Her sezon Memecik getirir, asit düşük çıkar." },
  { id: id("M", 2), ad: "Fatma Demir", tel: "0535 221 19 04", koy: "Yeniköy", adres: "Yeniköy merkez, no:18", durum: "aktif", uyelik: "2021-10-22", notlar: "Genelde emanet bırakır, 5 lt teneke ister." },
  { id: id("M", 3), ad: "Mehmet Yıldız", tel: "0541 308 77 91", koy: "Bağyaka", adres: "Bağyaka, Tarla yolu", durum: "aktif", uyelik: "2018-11-03" },
  { id: id("M", 4), ad: "Ayşe Korkmaz", tel: "0538 119 22 67", koy: "Çobanisa", adres: "Çobanisa, Yukarı mah.", durum: "aktif", uyelik: "2020-09-18" },
  { id: id("M", 5), ad: "İbrahim Çelik", tel: "0533 776 55 18", koy: "Karatepe", adres: "Karatepe mevkii, no:7", durum: "aktif", uyelik: "2017-10-30", notlar: "Yağını satar — kg fiyatı pazarlık eder." },
  { id: id("M", 6), ad: "Zeynep Acar", tel: "0537 442 11 03", koy: "Akçakaya", adres: "Akçakaya köyü, çeşme yanı", durum: "aktif", uyelik: "2022-11-12" },
  { id: id("M", 7), ad: "Salih Toprak", tel: "0532 880 65 41", koy: "Selimiye", adres: "Selimiye merkez", durum: "pasif", uyelik: "2016-09-09" },
  { id: id("M", 8), ad: "Hatice Güneş", tel: "0539 117 49 22", koy: "Gökyaka", adres: "Gökyaka, Çamlık", durum: "aktif", uyelik: "2019-10-05" },
  { id: id("M", 9), ad: "Ramazan Öztürk", tel: "0533 220 11 56", koy: "Ulupınar", adres: "Ulupınar köyü, no:33", durum: "aktif", uyelik: "2020-10-12" },
  { id: id("M", 10), ad: "Emine Yılmaz", tel: "0535 668 91 02", koy: "Demirciler", adres: "Demirciler, Bağ yolu", durum: "aktif", uyelik: "2018-09-28", notlar: "Çocukları için 2 ayrı kart basılır." },
  { id: id("M", 11), ad: "Ali Kaya", tel: "0541 119 03 87", koy: "Çamlıbel", adres: "Çamlıbel, no:42", durum: "aktif", uyelik: "2021-11-19" },
  { id: id("M", 12), ad: "Kadir Şahin", tel: "0532 901 56 28", koy: "Yeniköy", adres: "Yeniköy, Hisar mah.", durum: "aktif", uyelik: "2020-10-25" },
];

const SIPARISLER = [
  {
    id: id("S", 1042), musteriId: "M-0001", tarih: "2026-11-22", saat: "08:45",
    tur: "memecik", zeytinKg: 1280, cikanYag: 248.5, hakYagKg: 24.85, kalanYagKg: 223.65,
    oran: 19.4, asit: 0.42, bidon: 9, cuval: 32, durum: "tamamlandi",
    operator: "Mustafa", not: "Düşük asit, kaliteli parti."
  },
  {
    id: id("S", 1043), musteriId: "M-0002", tarih: "2026-11-22", saat: "10:20",
    tur: "ayvalik", zeytinKg: 640, cikanYag: 119.2, hakYagKg: 11.92, kalanYagKg: 107.28,
    oran: 18.6, asit: 0.51, bidon: 4, cuval: 16, durum: "tamamlandi", operator: "İsmet"
  },
  {
    id: id("S", 1044), musteriId: "M-0005", tarih: "2026-11-22", saat: "11:55",
    tur: "memecik", zeytinKg: 2100, cikanYag: 421.0, hakYagKg: 42.1, kalanYagKg: 378.9,
    oran: 20.1, asit: 0.38, bidon: 16, cuval: 52, durum: "tamamlandi", operator: "Mustafa", not: "Yağ tarafımıza satıldı."
  },
  {
    id: id("S", 1045), musteriId: "M-0003", tarih: "2026-11-23", saat: "09:10",
    tur: "gemlik", zeytinKg: 540, cikanYag: null, hakYagKg: null, kalanYagKg: null,
    oran: null, asit: null, bidon: null, cuval: 13, durum: "preste", operator: "İsmet"
  },
  {
    id: id("S", 1046), musteriId: "M-0010", tarih: "2026-11-23", saat: "09:25",
    tur: "memecik", zeytinKg: 880, cikanYag: null, hakYagKg: null, kalanYagKg: null,
    oran: null, asit: null, bidon: null, cuval: 22, durum: "yikamada", operator: "Mustafa"
  },
  {
    id: id("S", 1047), musteriId: "M-0006", tarih: "2026-11-23", saat: "10:02",
    tur: "ayvalik", zeytinKg: 720, cikanYag: null, hakYagKg: null, kalanYagKg: null,
    oran: null, asit: null, bidon: null, cuval: 18, durum: "kuyrukta", operator: "—"
  },
  {
    id: id("S", 1041), musteriId: "M-0001", tarih: "2025-11-30", saat: "14:30",
    tur: "memecik", zeytinKg: 1640, cikanYag: 320.8, hakYagKg: 32.08, kalanYagKg: 288.72,
    oran: 19.6, asit: 0.46, bidon: 12, cuval: 41, durum: "tamamlandi", operator: "Mustafa"
  },
  {
    id: id("S", 1040), musteriId: "M-0001", tarih: "2024-12-04", saat: "11:10",
    tur: "memecik", zeytinKg: 1420, cikanYag: 268.4, hakYagKg: 26.84, kalanYagKg: 241.56,
    oran: 18.9, asit: 0.54, bidon: 10, cuval: 36, durum: "tamamlandi", operator: "İsmet"
  },
  {
    id: id("S", 1039), musteriId: "M-0001", tarih: "2023-11-28", saat: "09:40",
    tur: "memecik", zeytinKg: 1180, cikanYag: 221.9, hakYagKg: 22.19, kalanYagKg: 199.71,
    oran: 18.8, asit: 0.49, bidon: 8, cuval: 30, durum: "tamamlandi", operator: "Mustafa"
  },
  {
    id: id("S", 1038), musteriId: "M-0002", tarih: "2025-11-20", saat: "10:15",
    tur: "ayvalik", zeytinKg: 520, cikanYag: 95.5, hakYagKg: 9.55, kalanYagKg: 85.95,
    oran: 18.4, asit: 0.58, bidon: 3, cuval: 13, durum: "tamamlandi", operator: "İsmet"
  },
  {
    id: id("S", 1037), musteriId: "M-0008", tarih: "2026-11-21", saat: "13:20",
    tur: "memecik", zeytinKg: 760, cikanYag: 145.2, hakYagKg: 14.52, kalanYagKg: 130.68,
    oran: 19.1, asit: 0.44, bidon: 5, cuval: 19, durum: "tamamlandi", operator: "Mustafa"
  },
  {
    id: id("S", 1036), musteriId: "M-0009", tarih: "2026-11-20", saat: "15:45",
    tur: "domat", zeytinKg: 920, cikanYag: 168.8, hakYagKg: 16.88, kalanYagKg: 151.92,
    oran: 18.3, asit: 0.62, bidon: 6, cuval: 23, durum: "tamamlandi", operator: "İsmet"
  },
];

// Hareketler: emanet/alış/satış
const HAREKETLER = [
  { id: "H-1052", musteriId: "M-0001", tarih: "2026-11-22", tur: "emanet-birak", litre: 180, kgFiyat: null, tutar: null, bidonNo: ["B-014", "B-015", "B-027"], not: "3 bidon emanet alındı." },
  { id: "H-1051", musteriId: "M-0005", tarih: "2026-11-22", tur: "alis", litre: 350, kgFiyat: 195, tutar: 68250, bidonNo: [], not: "Müşteriden yağ satın alındı." },
  { id: "H-1050", musteriId: "M-0002", tarih: "2026-11-22", tur: "emanet-birak", litre: 95, kgFiyat: null, tutar: null, bidonNo: ["B-031"], not: "1 bidon emanet." },
  { id: "H-1049", musteriId: "M-0008", tarih: "2026-11-21", tur: "satis", litre: 22, kgFiyat: 240, tutar: 5280, bidonNo: [], not: "Mevcut stoktan 22 lt satıldı." },
  { id: "H-1048", musteriId: "M-0002", tarih: "2026-11-15", tur: "emanet-cek", litre: 12, kgFiyat: null, tutar: null, bidonNo: ["B-031"], not: "Emanetten 12 lt çekti." },
  { id: "H-1047", musteriId: "M-0001", tarih: "2026-11-14", tur: "emanet-cek", litre: 25, kgFiyat: null, tutar: null, bidonNo: ["B-014"], not: "Emanetten 25 lt çekti." },
  { id: "H-1046", musteriId: "M-0010", tarih: "2026-11-10", tur: "satis", litre: 5, kgFiyat: 240, tutar: 1200, bidonNo: [], not: "Tek teneke alımı." },
  { id: "H-1045", musteriId: "M-0011", tarih: "2026-11-08", tur: "alis", litre: 240, kgFiyat: 190, tutar: 45600, bidonNo: [], not: "Geçen sezon yağı satıldı." },
];

const BIDONLAR = (() => {
  const list = [];
  for (let i = 1; i <= 48; i++) {
    list.push({
      id: "B-" + String(i).padStart(3, "0"),
      kapasite: i % 5 === 0 ? 18 : i % 3 === 0 ? 16 : 17,
    });
  }
  return list;
})();

// Bidon durumları (mock)
const BIDON_DURUM = {
  "B-001": { durum: "dolu", musteriId: "M-0001", litre: 16, dolduruldu: "2026-11-14" },
  "B-002": { durum: "dolu", musteriId: "M-0001", litre: 17, dolduruldu: "2026-11-22" },
  "B-003": { durum: "dolu", musteriId: "M-0002", litre: 14, dolduruldu: "2026-11-20" },
  "B-004": { durum: "bos", musteriId: null, litre: 0, dolduruldu: null },
  "B-005": { durum: "dolu", musteriId: "M-0005", litre: 18, dolduruldu: "2026-11-22" },
  "B-006": { durum: "yarim", musteriId: "M-0008", litre: 7, dolduruldu: "2026-11-21" },
  "B-007": { durum: "dolu", musteriId: "M-0009", litre: 16, dolduruldu: "2026-11-20" },
  "B-008": { durum: "bos", musteriId: null, litre: 0, dolduruldu: null },
  "B-009": { durum: "dolu", musteriId: "M-0010", litre: 17, dolduruldu: "2026-11-22" },
  "B-010": { durum: "yarim", musteriId: "M-0002", litre: 9, dolduruldu: "2026-11-20" },
  "B-011": { durum: "bos", musteriId: null, litre: 0, dolduruldu: null },
  "B-012": { durum: "dolu", musteriId: "M-0011", litre: 16, dolduruldu: "2026-11-19" },
  "B-013": { durum: "bos", musteriId: null, litre: 0, dolduruldu: null },
  "B-014": { durum: "dolu", musteriId: "M-0001", litre: 17, dolduruldu: "2026-11-22" },
  "B-015": { durum: "dolu", musteriId: "M-0001", litre: 17, dolduruldu: "2026-11-22" },
  "B-016": { durum: "dolu", musteriId: "M-0012", litre: 16, dolduruldu: "2026-11-18" },
  "B-017": { durum: "bos", musteriId: null, litre: 0, dolduruldu: null },
  "B-018": { durum: "dolu", musteriId: "M-0008", litre: 17, dolduruldu: "2026-11-21" },
  "B-019": { durum: "bos", musteriId: null, litre: 0, dolduruldu: null },
  "B-020": { durum: "yarim", musteriId: "M-0009", litre: 11, dolduruldu: "2026-11-17" },
  "B-021": { durum: "bos", musteriId: null, litre: 0, dolduruldu: null },
  "B-022": { durum: "dolu", musteriId: "M-0003", litre: 17, dolduruldu: "2026-11-15" },
  "B-023": { durum: "bos", musteriId: null, litre: 0, dolduruldu: null },
  "B-024": { durum: "yarim", musteriId: "M-0010", litre: 8, dolduruldu: "2026-11-14" },
  "B-025": { durum: "dolu", musteriId: "M-0011", litre: 18, dolduruldu: "2026-11-13" },
  "B-026": { durum: "bos", musteriId: null, litre: 0, dolduruldu: null },
  "B-027": { durum: "dolu", musteriId: "M-0001", litre: 17, dolduruldu: "2026-11-22" },
  "B-028": { durum: "bos", musteriId: null, litre: 0, dolduruldu: null },
  "B-029": { durum: "dolu", musteriId: "M-0006", litre: 17, dolduruldu: "2026-11-21" },
  "B-030": { durum: "bos", musteriId: null, litre: 0, dolduruldu: null },
  "B-031": { durum: "yarim", musteriId: "M-0002", litre: 4, dolduruldu: "2026-11-22" },
};
// Fill rest as empty
for (let i = 32; i <= 48; i++) {
  BIDON_DURUM["B-" + String(i).padStart(3, "0")] = { durum: "bos", musteriId: null, litre: 0, dolduruldu: null };
}

// Cari (debt)
const CARI = [
  { musteriId: "M-0001", emanetLitre: 180 - 25, borc: 0, alacak: 0 },
  { musteriId: "M-0002", emanetLitre: 95 - 12, borc: 0, alacak: 0 },
  { musteriId: "M-0005", emanetLitre: 0, borc: 0, alacak: 68250 },
  { musteriId: "M-0008", emanetLitre: 0, borc: 5280, alacak: 0 },
  { musteriId: "M-0010", emanetLitre: 0, borc: 1200, alacak: 0 },
  { musteriId: "M-0011", emanetLitre: 0, borc: 0, alacak: 45600 },
];

const SEASON_DATA = [
  { sezon: "2021-22", zeytinTon: 41.2, yagTon: 7.6, ortAsit: 0.62, ortOran: 18.4, musteri: 84 },
  { sezon: "2022-23", zeytinTon: 52.8, yagTon: 9.9, ortAsit: 0.58, ortOran: 18.8, musteri: 102 },
  { sezon: "2023-24", zeytinTon: 38.4, yagTon: 7.1, ortAsit: 0.65, ortOran: 18.5, musteri: 91 },
  { sezon: "2024-25", zeytinTon: 64.2, yagTon: 12.3, ortAsit: 0.51, ortOran: 19.2, musteri: 118 },
  { sezon: "2025-26", zeytinTon: 71.5, yagTon: 13.8, ortAsit: 0.48, ortOran: 19.3, musteri: 128 },
  { sezon: "2026-27", zeytinTon: 28.4, yagTon: 5.4, ortAsit: 0.46, ortOran: 19.5, musteri: 67 },
];

// Print history
const YAZDIRMALAR = SIPARISLER.filter(s => s.durum === "tamamlandi").map((s, i) => ({
  id: "Y-" + String(2400 - i).padStart(4, "0"),
  siparisId: s.id,
  musteriId: s.musteriId,
  tarih: s.tarih,
  saat: s.saat,
  stil: ["klasik", "modern", "termal"][i % 3],
  operator: s.operator || "—",
  kopya: (i % 4 === 0) ? 2 : 1,
}));

const FIRMA = {
  ad: "Zala Hatun Zeytinyağı",
  alt: "Geleneksel Soğuk Sıkım",
  tel: "0252 614 87 30",
  gsm: "0532 411 09 22",
  adres: "Çamlıbel Mahallesi, Zeytinli Yol no:7 / Milas / Muğla",
  web: "zalahatun.com.tr",
  vergi: "Milas V.D. 8970 458 213",
};

window.__APP_DATA__ = {
  ZEYTIN_TURLERI, KOYLER, MUSTERILER, SIPARISLER, HAREKETLER,
  BIDONLAR, BIDON_DURUM, CARI, SEASON_DATA, YAZDIRMALAR, FIRMA,
};

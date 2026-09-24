import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp, writeBatch,
  getDoc, setDoc, limit
} from 'firebase/firestore'
import { db } from './firebase'

// Collection references
const col = (name) => collection(db, name)

// Generic CRUD
export async function addDocument(colName, data) {
  const ref = await addDoc(col(colName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateDocument(colName, id, data) {
  await updateDoc(doc(db, colName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteDocument(colName, id) {
  await deleteDoc(doc(db, colName, id))
}

export async function getDocument(colName, id) {
  const snap = await getDoc(doc(db, colName, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getCollection(colName) {
  const snap = await getDocs(col(colName))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// Real-time listeners
export function subscribeCollection(colName, callback, onError) {
  return onSnapshot(col(colName), (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(data)
  }, (err) => {
    console.error(`Firestore subscribe error [${colName}]:`, err)
    if (onError) onError(err)
  })
}

export function subscribeQuery(colName, constraints, callback) {
  const q = query(col(colName), ...constraints)
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(data)
  })
}

// Domain-specific helpers
export const musteriler = {
  subscribe: (cb) => subscribeCollection('musteriler', cb),
  add: (data) => addDocument('musteriler', data),
  update: (id, data) => updateDocument('musteriler', id, data),
  delete: (id) => deleteDocument('musteriler', id),
}

export const siparisler = {
  subscribe: (cb) => subscribeCollection('siparisler', cb),
  add: (data) => addDocument('siparisler', data),
  update: (id, data) => updateDocument('siparisler', id, data),
  delete: (id) => deleteDocument('siparisler', id),
}

export const hareketler = {
  subscribe: (cb) => subscribeCollection('hareketler', cb),
  add: (data) => addDocument('hareketler', data),
  update: (id, data) => updateDocument('hareketler', id, data),
  delete: (id) => deleteDocument('hareketler', id),
}

// Kesilen e-belgelerin yerel kaydı (müstahsil makbuzu / satış faturası)
export const faturalar = {
  subscribe: (cb) => subscribeCollection('faturalar', cb),
  add: (data) => addDocument('faturalar', data),
  update: (id, data) => updateDocument('faturalar', id, data),
  delete: (id) => deleteDocument('faturalar', id),
}

export const bidonlar = {
  subscribe: (cb) => subscribeCollection('bidonlar', cb),
  add: (data) => addDocument('bidonlar', data),
  update: (id, data) => updateDocument('bidonlar', id, data),
}

// Clear all data from all collections
export async function clearDatabase() {
  const COLLECTIONS = ['musteriler', 'siparisler', 'hareketler', 'bidonlar']
  const BATCH_SIZE = 400 // Firestore batch limit is 500

  for (const colName of COLLECTIONS) {
    let snap = await getDocs(col(colName))
    while (!snap.empty) {
      const batch = writeBatch(db)
      snap.docs.slice(0, BATCH_SIZE).forEach(d => batch.delete(d.ref))
      await batch.commit()
      if (snap.docs.length <= BATCH_SIZE) break
      snap = await getDocs(col(colName))
    }
  }
  return true
}

// Seed data (run once)
export async function seedDatabase() {
  const snap = await getDocs(query(col('musteriler'), limit(1)))
  if (!snap.empty) return false

  const batch = writeBatch(db)

  const musteriData = [
    { kod: 'M-0001', ad: 'Hüseyin Aydın', tel: '0532 412 88 22', koy: 'Çamlıbel', adres: 'Çamlıbel köyü, Akçaova mevkii', durum: 'aktif', uyelik: '2019-09-12', notlar: 'Her sezon Memecik getirir, asit düşük çıkar.' },
    { kod: 'M-0002', ad: 'Fatma Demir', tel: '0535 221 19 04', koy: 'Yeniköy', adres: 'Yeniköy merkez, no:18', durum: 'aktif', uyelik: '2021-10-22', notlar: 'Genelde emanet bırakır, 5 lt teneke ister.' },
    { kod: 'M-0003', ad: 'Mehmet Yıldız', tel: '0541 308 77 91', koy: 'Bağyaka', adres: 'Bağyaka, Tarla yolu', durum: 'aktif', uyelik: '2018-11-03' },
    { kod: 'M-0004', ad: 'Ayşe Korkmaz', tel: '0538 119 22 67', koy: 'Çobanisa', adres: 'Çobanisa, Yukarı mah.', durum: 'aktif', uyelik: '2020-09-18' },
    { kod: 'M-0005', ad: 'İbrahim Çelik', tel: '0533 776 55 18', koy: 'Karatepe', adres: 'Karatepe mevkii, no:7', durum: 'aktif', uyelik: '2017-10-30', notlar: 'Yağını satar — kg fiyatı pazarlık eder.' },
    { kod: 'M-0006', ad: 'Zeynep Acar', tel: '0537 442 11 03', koy: 'Akçakaya', adres: 'Akçakaya köyü, çeşme yanı', durum: 'aktif', uyelik: '2022-11-12' },
    { kod: 'M-0007', ad: 'Salih Toprak', tel: '0532 880 65 41', koy: 'Selimiye', adres: 'Selimiye merkez', durum: 'pasif', uyelik: '2016-09-09' },
    { kod: 'M-0008', ad: 'Hatice Güneş', tel: '0539 117 49 22', koy: 'Gökyaka', adres: 'Gökyaka, Çamlık', durum: 'aktif', uyelik: '2019-10-05' },
    { kod: 'M-0009', ad: 'Ramazan Öztürk', tel: '0533 220 11 56', koy: 'Ulupınar', adres: 'Ulupınar köyü, no:33', durum: 'aktif', uyelik: '2020-10-12' },
    { kod: 'M-0010', ad: 'Emine Yılmaz', tel: '0535 668 91 02', koy: 'Demirciler', adres: 'Demirciler, Bağ yolu', durum: 'aktif', uyelik: '2018-09-28', notlar: 'Çocukları için 2 ayrı kart basılır.' },
    { kod: 'M-0011', ad: 'Ali Kaya', tel: '0541 119 03 87', koy: 'Çamlıbel', adres: 'Çamlıbel, no:42', durum: 'aktif', uyelik: '2021-11-19' },
    { kod: 'M-0012', ad: 'Kadir Şahin', tel: '0532 901 56 28', koy: 'Yeniköy', adres: 'Yeniköy, Hisar mah.', durum: 'aktif', uyelik: '2020-10-25' },
  ]

  const musteriRefs = {}
  for (const m of musteriData) {
    const ref = doc(col('musteriler'))
    musteriRefs[m.kod] = ref.id
    batch.set(ref, { ...m, createdAt: new Date(), updatedAt: new Date() })
  }

  const siparisData = [
    { kod: 'S-1042', musteriKod: 'M-0001', tarih: '2026-11-22', saat: '08:45', tur: 'memecik', zeytinKg: 1280, cikanYag: 248.5, hakYagKg: 24.85, kalanYagKg: 223.65, oran: 19.4, asit: 0.42, bidon: 9, cuval: 32, durum: 'tamamlandi', operator: 'Mustafa', not: 'Düşük asit, kaliteli parti.' },
    { kod: 'S-1043', musteriKod: 'M-0002', tarih: '2026-11-22', saat: '10:20', tur: 'ayvalik', zeytinKg: 640, cikanYag: 119.2, hakYagKg: 11.92, kalanYagKg: 107.28, oran: 18.6, asit: 0.51, bidon: 4, cuval: 16, durum: 'tamamlandi', operator: 'İsmet' },
    { kod: 'S-1044', musteriKod: 'M-0005', tarih: '2026-11-22', saat: '11:55', tur: 'memecik', zeytinKg: 2100, cikanYag: 421.0, hakYagKg: 42.1, kalanYagKg: 378.9, oran: 20.1, asit: 0.38, bidon: 16, cuval: 52, durum: 'tamamlandi', operator: 'Mustafa', not: 'Yağ tarafımıza satıldı.' },
    { kod: 'S-1045', musteriKod: 'M-0003', tarih: '2026-11-23', saat: '09:10', tur: 'gemlik', zeytinKg: 540, cikanYag: null, hakYagKg: null, kalanYagKg: null, oran: null, asit: null, bidon: null, cuval: 13, durum: 'preste', operator: 'İsmet' },
    { kod: 'S-1046', musteriKod: 'M-0010', tarih: '2026-11-23', saat: '09:25', tur: 'memecik', zeytinKg: 880, cikanYag: null, hakYagKg: null, kalanYagKg: null, oran: null, asit: null, bidon: null, cuval: 22, durum: 'yikamada', operator: 'Mustafa' },
    { kod: 'S-1047', musteriKod: 'M-0006', tarih: '2026-11-23', saat: '10:02', tur: 'ayvalik', zeytinKg: 720, cikanYag: null, hakYagKg: null, kalanYagKg: null, oran: null, asit: null, bidon: null, cuval: 18, durum: 'kuyrukta', operator: '—' },
    { kod: 'S-1041', musteriKod: 'M-0001', tarih: '2025-11-30', saat: '14:30', tur: 'memecik', zeytinKg: 1640, cikanYag: 320.8, hakYagKg: 32.08, kalanYagKg: 288.72, oran: 19.6, asit: 0.46, bidon: 12, cuval: 41, durum: 'tamamlandi', operator: 'Mustafa' },
    { kod: 'S-1040', musteriKod: 'M-0001', tarih: '2024-12-04', saat: '11:10', tur: 'memecik', zeytinKg: 1420, cikanYag: 268.4, hakYagKg: 26.84, kalanYagKg: 241.56, oran: 18.9, asit: 0.54, bidon: 10, cuval: 36, durum: 'tamamlandi', operator: 'İsmet' },
    { kod: 'S-1037', musteriKod: 'M-0008', tarih: '2026-11-21', saat: '13:20', tur: 'memecik', zeytinKg: 760, cikanYag: 145.2, hakYagKg: 14.52, kalanYagKg: 130.68, oran: 19.1, asit: 0.44, bidon: 5, cuval: 19, durum: 'tamamlandi', operator: 'Mustafa' },
    { kod: 'S-1036', musteriKod: 'M-0009', tarih: '2026-11-20', saat: '15:45', tur: 'domat', zeytinKg: 920, cikanYag: 168.8, hakYagKg: 16.88, kalanYagKg: 151.92, oran: 18.3, asit: 0.62, bidon: 6, cuval: 23, durum: 'tamamlandi', operator: 'İsmet' },
  ]

  for (const s of siparisData) {
    const ref = doc(col('siparisler'))
    batch.set(ref, { ...s, musteriId: musteriRefs[s.musteriKod] || '', createdAt: new Date(), updatedAt: new Date() })
  }

  const hareketData = [
    { kod: 'H-1052', musteriKod: 'M-0001', tarih: '2026-11-22', tur: 'emanet-birak', litre: 180, kgFiyat: null, tutar: null, bidonNo: ['B-014', 'B-015', 'B-027'], not: '3 bidon emanet alındı.' },
    { kod: 'H-1051', musteriKod: 'M-0005', tarih: '2026-11-22', tur: 'alis', litre: 350, kgFiyat: 195, tutar: 68250, bidonNo: [], not: 'Müşteriden yağ satın alındı.' },
    { kod: 'H-1050', musteriKod: 'M-0002', tarih: '2026-11-22', tur: 'emanet-birak', litre: 95, kgFiyat: null, tutar: null, bidonNo: ['B-031'], not: '1 bidon emanet.' },
    { kod: 'H-1049', musteriKod: 'M-0008', tarih: '2026-11-21', tur: 'satis', litre: 22, kgFiyat: 240, tutar: 5280, bidonNo: [], not: 'Mevcut stoktan 22 lt satıldı.' },
    { kod: 'H-1048', musteriKod: 'M-0002', tarih: '2026-11-15', tur: 'emanet-cek', litre: 12, kgFiyat: null, tutar: null, bidonNo: ['B-031'], not: 'Emanetten 12 lt çekti.' },
  ]

  for (const h of hareketData) {
    const ref = doc(col('hareketler'))
    batch.set(ref, { ...h, musteriId: musteriRefs[h.musteriKod] || '', createdAt: new Date(), updatedAt: new Date() })
  }

  for (let i = 1; i <= 48; i++) {
    const bid = 'B-' + String(i).padStart(3, '0')
    const ref = doc(col('bidonlar'), bid)
    const kapasite = i % 5 === 0 ? 18 : i % 3 === 0 ? 16 : 17
    let durum = 'bos', litre = 0, musteriId = null

    const bidonMap = {
      1: { durum: 'dolu', mk: 'M-0001', litre: 16 },
      2: { durum: 'dolu', mk: 'M-0001', litre: 17 },
      3: { durum: 'dolu', mk: 'M-0002', litre: 14 },
      5: { durum: 'dolu', mk: 'M-0005', litre: 18 },
      6: { durum: 'yarim', mk: 'M-0008', litre: 7 },
      7: { durum: 'dolu', mk: 'M-0009', litre: 16 },
      9: { durum: 'dolu', mk: 'M-0010', litre: 17 },
      10: { durum: 'yarim', mk: 'M-0002', litre: 9 },
      12: { durum: 'dolu', mk: 'M-0011', litre: 16 },
      14: { durum: 'dolu', mk: 'M-0001', litre: 17 },
      15: { durum: 'dolu', mk: 'M-0001', litre: 17 },
      16: { durum: 'dolu', mk: 'M-0012', litre: 16 },
      18: { durum: 'dolu', mk: 'M-0008', litre: 17 },
      20: { durum: 'yarim', mk: 'M-0009', litre: 11 },
      22: { durum: 'dolu', mk: 'M-0003', litre: 17 },
      24: { durum: 'yarim', mk: 'M-0010', litre: 8 },
      25: { durum: 'dolu', mk: 'M-0011', litre: 18 },
      27: { durum: 'dolu', mk: 'M-0001', litre: 17 },
      29: { durum: 'dolu', mk: 'M-0006', litre: 17 },
      31: { durum: 'yarim', mk: 'M-0002', litre: 4 },
    }

    if (bidonMap[i]) {
      durum = bidonMap[i].durum
      litre = bidonMap[i].litre
      musteriId = musteriRefs[bidonMap[i].mk] || null
    }

    batch.set(ref, { kod: bid, kapasite, durum, litre, musteriId, musteriKod: bidonMap[i]?.mk || null })
  }

  await batch.commit()
  return true
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const DEFAULTS = {
  palette: 'toprak',
  density: 1,
  cardDefault: 'klasik',
  agirlik: 'kg',
  yag: 'kg',
  currency: '₺',
  hakYagOran: 10,
  varsayilanAsitHedef: 0.50,
  bidonKapasite: 17,
  varsayilanOperator: 'Mustafa',
  sikimUcreti: 0,
  yagSatisFiyat: 240,
  yagAlisFiyat: 195,
  showHakYag: true,
  showAsit: true,
  showBidonCuval: true,
  showKoyAdres: true,
  showOran: true,
  showIletisim: true,
  sezonBaslangic: '2026',
  sezonAd: '2026–27',

  // Tablet (fabrika) modu
  tabletYikama: false,        // yıkama adımı kapalı: Kuyrukta → Preste → Tamamlandı
  tabletTamamGun: 1,
  tabletOtoKart: true,
  hakYagResmi: false,         // hak yağı kayıt dışı stokta sayılır

  // Kartta basılan firma bilgileri
  firmaAd: '', firmaAlt: '', firmaTel: '', firmaGsm: '', firmaAdres: '',

  // e-Belge (Uyumsoft) — resmi firma bilgileri (fatura / makbuz üzerinde)
  efOrtam: 'canli',            // canli | test (Uyumsoft ortak test hesabı)
  efVkn: '', efUnvan: '', efAdSoyad: '', efVergiDairesi: '',
  efAdres: '', efBinaNo: '', efIlce: '', efIl: '',
  efTel: '', efEposta: '', efWeb: '', efMersis: '', efSicil: '',
  efUrunAd: 'Zeytinyağı',
  // Satış faturası
  efKdvOran: 1,
  efKdvDahil: true,            // satış fiyatı KDV dahil girilir
  efProfil: 'TEMELFATURA',     // e-Fatura mükellefine: TEMELFATURA | TICARIFATURA
  efSeri: '',                  // boş → Uyumsoft varsayılan seri
  // Müstahsil makbuzu kesintileri (%)
  mmStopajOran: 2,
  mmBorsaOran: 0,
  mmMeraOran: 0,
  mmSgkOran: 0,
  mmSeri: '',
}

const SETTINGS_DOC = doc(db, 'ayarlar', 'genel')

function loadLocal() {
  try {
    var saved = localStorage.getItem('ygt-settings')
    return saved ? Object.assign({}, DEFAULTS, JSON.parse(saved)) : Object.assign({}, DEFAULTS)
  } catch (e) {
    return Object.assign({}, DEFAULTS)
  }
}

export function useSettings() {
  var [settings, setSettings] = useState(loadLocal)
  var skipSync = useRef(false)

  useEffect(function () {
    var unsub = onSnapshot(SETTINGS_DOC, function (snap) {
      if (snap.exists()) {
        var remote = Object.assign({}, DEFAULTS, snap.data())
        setSettings(remote)
        localStorage.setItem('ygt-settings', JSON.stringify(remote))
      }
    }, function () {
      // Firestore offline — use localStorage
    })
    return unsub
  }, [])

  var save = useCallback(function (next) {
    localStorage.setItem('ygt-settings', JSON.stringify(next))
    setDoc(SETTINGS_DOC, next, { merge: true }).catch(function () {})
  }, [])

  var updateSetting = useCallback(function (key, value) {
    setSettings(function (prev) {
      var next = Object.assign({}, prev)
      next[key] = value
      save(next)
      return next
    })
  }, [save])

  var updateMultiple = useCallback(function (updates) {
    setSettings(function (prev) {
      var next = Object.assign({}, prev, updates)
      save(next)
      return next
    })
  }, [save])

  var resetSettings = useCallback(function () {
    localStorage.removeItem('ygt-settings')
    setSettings(Object.assign({}, DEFAULTS))
    setDoc(SETTINGS_DOC, DEFAULTS).catch(function () {})
  }, [])

  var hesapla = {
    hakYag: function (cikanYag) { return +(cikanYag * (settings.hakYagOran / 100)).toFixed(2) },
    kalanYag: function (cikanYag) {
      var hak = +(cikanYag * (settings.hakYagOran / 100)).toFixed(2)
      return +(cikanYag - hak).toFixed(2)
    },
    oran: function (zeytinKg, cikanYag) { return zeytinKg > 0 ? +(cikanYag / zeytinKg * 100).toFixed(2) : 0 },
    sikimTutar: function (zeytinKg) { return settings.sikimUcreti > 0 ? +(zeytinKg * settings.sikimUcreti).toFixed(2) : 0 },
    satisTutar: function (litre) { return +(litre * settings.yagSatisFiyat).toFixed(2) },
    alisTutar: function (litre) { return +(litre * settings.yagAlisFiyat).toFixed(2) },
  }

  return [settings, updateSetting, { updateMultiple: updateMultiple, resetSettings: resetSettings, hesapla: hesapla }]
}

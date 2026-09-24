import { useState, useEffect, useRef, useMemo } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useMusteriler, useSiparisler } from '../hooks/useFirestore'
import { musteriler as musteriDb, siparisler as siparisDb, hareketler as hareketDb } from '../lib/firestore'
import { useHareketler } from '../hooks/useFirestore'
import { hesaplaStok, verimOf } from '../lib/stok'
import HareketSheet from '../components/tablet/HareketSheet'
import StokSheet from '../components/tablet/StokSheet'
import AyarlarSheet from '../components/tablet/AyarlarSheet'
import HareketListesi from '../components/tablet/HareketListesi'
import { ZEYTIN_TURLERI, KOYLER, FIRMA } from '../lib/constants'
import { fmt, initialsOf } from '../lib/fmt'
import VoiceInput from '../components/VoiceInput'
import PrintCard from '../components/PrintCard'
import Icon from '../components/Icon'

// ─────────────────────────────────────────────────────────────
// FABRİKA MODU — ana uygulama (/), yönetim paneli /pcmod
// Amaç: yağlı elle, en az dokunuşla iş akışını yürütmek.
//   Zeytin Kabul  → müşteri seç → kg (numpad) → KAYDET
//   Kart aksiyonu → tek büyük buton (Yıkamaya Al / Prese Al / Yağ Gir / Yazdır)
//   Geri Al       → her durum geçişinden sonra 6 sn alt çubuk
//   Detay (…)     → nadir işler: düzenle, bir adım geri, sil
// ─────────────────────────────────────────────────────────────

var DURUM_SIRA = ['kuyrukta', 'yikamada', 'preste', 'tamamlandi']
var DURUM_AD = { kuyrukta: 'Kuyrukta', yikamada: 'Yıkamada', preste: 'Preste', tamamlandi: 'Tamamlandı' }

// Yerel takvim günü ('sv' formatı YYYY-MM-DD verir); toISOString UTC'ye kaydırıyordu
function dateStr(d) { return (d || new Date()).toLocaleDateString('sv') }
function todayStr() { return dateStr() }
function nowTime() { return new Date().toTimeString().slice(0, 5) }
function daysAgoStr(n) {
  var d = new Date(); d.setDate(d.getDate() - n)
  return dateStr(d)
}
function normalize(s) { return (s || '').toLocaleLowerCase('tr-TR').trim() }
function nextKod(list, prefix, start) {
  var max = start
  list.forEach(function (x) {
    var n = parseInt(String(x.kod || '').replace(prefix, ''), 10)
    if (!isNaN(n) && n > max) max = n
  })
  return prefix + String(max + 1).padStart(4, '0')
}

// ── Müşteri bilgileri: hepsi isteğe bağlı, ad dışında zorunlu alan yok ──
var EMPTY_BILGI = { tel: '', tc: '', koy: '', adres: '', notlar: '' }
function bilgiOf(m) {
  return { tel: m.tel || '', tc: m.tc || '', koy: m.koy || '', adres: m.adres || '', notlar: m.notlar || '' }
}
function MusteriBilgiForm(props) {
  var b = props.bilgi
  function f(k, label, extra) {
    return (
      <div className="fab-row">
        <label className="fab-label">{label}</label>
        <input
          className="fab-input"
          value={b[k]}
          onChange={function (e) { props.onChange(k, e.target.value) }}
          {...extra}
        />
      </div>
    )
  }
  return (
    <div className={'fab-grid bilgi' + (props.compact ? ' compact' : '')}>
      {f('tel', 'Telefon', { type: 'tel', inputMode: 'tel', placeholder: '05XX XXX XX XX' })}
      {f('tc', 'TC Kimlik', { inputMode: 'numeric', maxLength: 11, placeholder: '11 hane' })}
      {f('koy', 'Köy / Mahalle', { list: 'fab-koy', placeholder: 'Köy' })}
      {f('adres', 'Adres', { placeholder: 'Mevkii, no' })}
      {f('notlar', 'Not', { placeholder: 'Örn: 5 lt teneke ister' })}
      <datalist id="fab-koy">{KOYLER.map(function (k) { return <option key={k} value={k} /> })}</datalist>
    </div>
  )
}

// ── Numpad: yağlı el için büyük tuşlar ──
function Numpad(props) {
  var value = props.value || ''
  function press(k) {
    if (k === 'del') { props.onChange(value.slice(0, -1)); return }
    if (k === ',') {
      if (!props.decimal || value.indexOf('.') !== -1) return
      props.onChange((value || '0') + '.'); return
    }
    if (value === '0') { props.onChange(k); return }
    if (value.replace('.', '').length >= 7) return
    props.onChange(value + k)
  }
  var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del']
  return (
    <div className="np">
      {keys.map(function (k) {
        var cls = 'np-key' + (k === 'del' ? ' del' : '') + (k === ',' && !props.decimal ? ' off' : '')
        return (
          <button key={k} type="button" className={cls} onClick={function () { press(k) }}>
            {k === 'del' ? <Icon name="backspace" size={28} /> : k}
          </button>
        )
      })}
    </div>
  )
}

export default function TabletApp() {
  var settingsHook = useSettings()
  var settings = settingsHook[0]
  var updateSetting = settingsHook[1]
  var hesapla = settingsHook[2].hesapla

  var musterilerHook = useMusteriler()
  var siparislerHook = useSiparisler()
  var hareketlerHook = useHareketler()
  var musteriler = musterilerHook.data
  var siparisler = siparislerHook.data
  var hareketler = hareketlerHook.data
  var loading = musterilerHook.loading || siparislerHook.loading

  var yikamaAdimi = settings.tabletYikama === true   // varsayılan kapalı
  var birim = settings.yag || 'kg'

  var stok = useMemo(function () {
    return hesaplaStok(siparisler, hareketler, { hakYagResmi: settings.hakYagResmi === true })
  }, [siparisler, hareketler, settings.hakYagResmi])

  // Kartta basılacak firma bilgileri (ayarlarda boş olan alan varsayılana düşer)
  var firma = useMemo(function () {
    return {
      ad: settings.firmaAd || FIRMA.ad, alt: settings.firmaAlt || FIRMA.alt,
      tel: settings.firmaTel || FIRMA.tel, gsm: settings.firmaGsm || FIRMA.gsm,
      adres: settings.firmaAdres || FIRMA.adres, web: FIRMA.web, vergi: FIRMA.vergi,
    }
  }, [settings.firmaAd, settings.firmaAlt, settings.firmaTel, settings.firmaGsm, settings.firmaAdres])
  var tamamGun = settings.tabletTamamGun || 1  // tamamlanan kolonunda kaç günlük

  // ── UI durumu ──
  var [sheet, setSheet] = useState(null)        // 'kabul' | 'yag' | 'detay' | 'ara' | 'kart' | 'alis' | 'satis' | 'stok'
  var [target, setTarget] = useState(null)      // sheet'in çalıştığı sipariş
  var [busy, setBusy] = useState(false)
  var [toast, setToast] = useState(null)
  var [undo, setUndo] = useState(null)          // { label, revert }
  var [tab, setTab] = useState('is')            // 'is' | 'alis' | 'satis'
  var [tamamAralik, setTamamAralik] = useState(null)  // null → ayardaki gün
  var [showSettings, setShowSettings] = useState(false)
  var [printOrder, setPrintOrder] = useState(null)
  var undoTimer = useRef(null)
  var toastTimer = useRef(null)

  useEffect(function () {
    document.documentElement.setAttribute('data-palette', settings.palette)
  }, [settings.palette])

  useEffect(function () {
    function onKey(e) { if (e.key === 'Escape') closeSheet() }
    document.addEventListener('keydown', onKey)
    return function () { document.removeEventListener('keydown', onKey) }
  }, [])

  function flash(msg) {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(function () { setToast(null) }, 2500)
  }

  function offerUndo(label, revert) {
    clearTimeout(undoTimer.current)
    setUndo({ label: label, revert: revert })
    undoTimer.current = setTimeout(function () { setUndo(null) }, 6000)
  }

  function doUndo() {
    if (!undo) return
    var r = undo.revert
    setUndo(null)
    clearTimeout(undoTimer.current)
    r().then(function () { flash('Geri alındı') }).catch(function (e) { flash('Hata: ' + e.message) })
  }

  function closeSheet() { setSheet(null); setTarget(null) }
  function openKart(order) { setTarget(order); setSheet('kart') }
  var otoKart = settings.tabletOtoKart !== false   // kayıt sonrası kartı otomatik göster

  // ── Türetilmiş veri ──
  var musteriMap = useMemo(function () {
    var m = {}
    musteriler.forEach(function (x) { m[x.id] = x })
    return m
  }, [musteriler])

  var tamamGunEtkin = tamamAralik != null ? tamamAralik : tamamGun

  var board = useMemo(function () {
    var cols = { kuyrukta: [], yikamada: [], preste: [], tamamlandi: [] }
    // 0 = tüm zamanlar
    var since = tamamGunEtkin > 0 ? daysAgoStr(tamamGunEtkin - 1) : ''
    siparisler.forEach(function (s) {
      var d = s.durum || 'kuyrukta'
      if (!cols[d]) d = 'kuyrukta'
      if (d === 'tamamlandi' && since && (s.tamamTarih || s.tarih || '') < since) return
      cols[d].push(s)
    })
    // Aktifler: en eski önce (sıra), tamamlananlar: en yeni önce
    function asc(a, b) { return ((a.tarih || '') + (a.saat || '')).localeCompare((b.tarih || '') + (b.saat || '')) }
    cols.kuyrukta.sort(asc); cols.yikamada.sort(asc); cols.preste.sort(asc)
    cols.tamamlandi.sort(function (a, b) {
      var ka = (a.tamamTarih || a.tarih || '') + (a.tamamSaat || a.saat || '')
      var kb = (b.tamamTarih || b.tarih || '') + (b.tamamSaat || b.saat || '')
      return kb.localeCompare(ka)
    })
    return cols
  }, [siparisler, tamamGunEtkin])

  var today = todayStr()
  var bugunKart = siparisler.filter(function (s) { return s.tarih === today }).length
  var siradaKart = board.kuyrukta.length + board.yikamada.length + board.preste.length
  var bugunZeytin = siparisler.reduce(function (t, s) { return s.tarih === today ? t + (Number(s.zeytinKg) || 0) : t }, 0)

  // Son işlem yapılan müşteriler (Zeytin Kabul'de hızlı seçim için)
  var recentCustomers = useMemo(function () {
    var last = {}
    siparisler.forEach(function (s) {
      var key = (s.tarih || '') + (s.saat || '')
      if (!last[s.musteriId] || last[s.musteriId] < key) last[s.musteriId] = key
    })
    return musteriler.slice().sort(function (a, b) {
      var la = last[a.id] || '', lb = last[b.id] || ''
      if (la !== lb) return lb.localeCompare(la)
      return a.ad.localeCompare(b.ad, 'tr')
    })
  }, [musteriler, siparisler])

  // ── Durum geçişleri ──
  function nextOf(durum) {
    if (durum === 'kuyrukta') return yikamaAdimi ? 'yikamada' : 'preste'
    if (durum === 'yikamada') return 'preste'
    if (durum === 'preste') return 'tamamlandi'
    return null
  }
  function prevOf(durum) {
    if (durum === 'tamamlandi') return 'preste'
    if (durum === 'preste') return yikamaAdimi ? 'yikamada' : 'kuyrukta'
    if (durum === 'yikamada') return 'kuyrukta'
    return null
  }
  function actionLabel(durum) {
    var n = nextOf(durum)
    if (n === 'yikamada') return 'Yıkamaya Al'
    if (n === 'preste') return 'Prese Al'
    if (n === 'tamamlandi') return 'Yağ Gir'
    return 'Yazdır'
  }

  async function advance(order) {
    var next = nextOf(order.durum || 'kuyrukta')
    if (!next) { openKart(order); return }
    if (next === 'tamamlandi') { setTarget(order); setSheet('yag'); return }
    var prev = order.durum || 'kuyrukta'
    try {
      await siparisDb.update(order.id, { durum: next })
      var m = musteriMap[order.musteriId]
      offerUndo((m ? m.ad : order.kod) + ' → ' + DURUM_AD[next], function () {
        return siparisDb.update(order.id, { durum: prev })
      })
    } catch (e) { flash('Hata: ' + e.message) }
  }

  async function stepBack(order) {
    var prev = prevOf(order.durum)
    if (!prev) return
    var upd = { durum: prev }
    if (order.durum === 'tamamlandi') {
      upd.cikanYag = null; upd.asit = null; upd.oran = null; upd.verim = null
      upd.tamamTarih = null; upd.tamamSaat = null
      upd.hakYagKg = null; upd.kalanYagKg = null; upd.bidon = null; upd.sikimUcretiAlindi = false
    }
    var snapshot = {
      durum: order.durum, cikanYag: order.cikanYag || null, asit: order.asit || null, oran: order.oran || null,
      hakYagKg: order.hakYagKg || null, kalanYagKg: order.kalanYagKg || null, bidon: order.bidon || null
    }
    try {
      await siparisDb.update(order.id, upd)
      closeSheet()
      var m = musteriMap[order.musteriId]
      offerUndo((m ? m.ad : order.kod) + ' ← ' + DURUM_AD[prev], function () {
        return siparisDb.update(order.id, snapshot)
      })
    } catch (e) { flash('Hata: ' + e.message) }
  }

  function handlePrint(order) {
    setPrintOrder({ order: order, musteri: musteriMap[order.musteriId] })
    setTimeout(function () { window.print() }, 300)
  }

  // ── Zeytin Kabul kaydı ──
  async function saveKabul(data) {
    // data: { musteriId | yeniAd, bilgi: {tel,tc,koy,adres,notlar}, bilgiDirty, zeytinKg, cuval, tur }
    setBusy(true)
    try {
      var musteriId = data.musteriId
      var isNew = false
      var bilgi = data.bilgi || {}
      if (!musteriId) {
        isNew = true
        musteriId = await musteriDb.add(Object.assign({
          kod: nextKod(musteriler, 'M-', 0), ad: data.yeniAd.trim(),
          tel: '', tc: '', koy: '', adres: '', notlar: '', durum: 'aktif', uyelik: today,
        }, bilgi))
      } else if (data.bilgiDirty) {
        await musteriDb.update(musteriId, bilgi)
      }
      var order = {
        kod: nextKod(siparisler, 'S-', 1000), musteriId: musteriId, tarih: today, saat: nowTime(),
        tur: data.tur || 'memecik', zeytinKg: Number(data.zeytinKg) || 0, cuval: Number(data.cuval) || null,
        takipNo: (data.takipNo || '').trim(),
        durum: 'kuyrukta', operator: settings.varsayilanOperator || '', not: '',
        cikanYag: null, asit: null, oran: null, verim: null, hakYagKg: null, kalanYagKg: null, bidon: null,
        sikimUcretiAlindi: false,
      }
      var id = await siparisDb.add(order)
      closeSheet()
      if (otoKart) openKart(Object.assign({ id: id }, order))
      var ad = isNew ? data.yeniAd : (musteriMap[musteriId] || {}).ad
      offerUndo(ad + ' · ' + fmt.num(order.zeytinKg, 0) + ' kg alındı', function () {
        return siparisDb.delete(id)
      })
    } catch (e) { flash('Hata: ' + e.message) }
    setBusy(false)
  }

  // ── Yağ girişi (tamamlama) ──
  async function saveYag(order, cikanYag, asit, bidon, ucretAlindi) {
    setBusy(true)
    // Sıkım ücreti nakit alındıysa hak yağı kesilmez, yağın tamamı müşterinin
    var hakYag = ucretAlindi ? 0 : hesapla.hakYag(cikanYag)
    var kalan = +(cikanYag - hakYag).toFixed(2)
    var kap = settings.bidonKapasite || 17
    var upd = {
      durum: 'tamamlandi', cikanYag: cikanYag, asit: asit || null,
      oran: hesapla.oran(order.zeytinKg || 0, cikanYag),
      verim: verimOf(order.zeytinKg || 0, cikanYag),
      tamamTarih: today, tamamSaat: nowTime(),
      hakYagKg: hakYag, kalanYagKg: kalan,
      sikimUcretiAlindi: !!ucretAlindi,
      bidon: bidon || (kalan > 0 ? Math.ceil(kalan / kap) : null),
    }
    var prev = order.durum || 'preste'
    try {
      await siparisDb.update(order.id, upd)
      closeSheet()
      if (otoKart) openKart(Object.assign({}, order, upd))
      var m = musteriMap[order.musteriId]
      offerUndo((m ? m.ad : order.kod) + ' · ' + fmt.num(cikanYag, 1) + ' kg yağ', function () {
        return siparisDb.update(order.id, { durum: prev, cikanYag: null, asit: null, oran: null, verim: null, tamamTarih: null, tamamSaat: null, hakYagKg: null, kalanYagKg: null, bidon: null, sikimUcretiAlindi: false })
      })
    } catch (e) { flash('Hata: ' + e.message) }
    setBusy(false)
  }

  // ── Detay kaydı ──
  // keep = true → açık olan pencere kapanmaz (Ara ekranı içinden düzenleme)
  async function saveOrderInline(order, upd) {
    setBusy(true)
    try {
      await siparisDb.update(order.id, upd)
      flash('Güncellendi')
    } catch (e) { flash('Hata: ' + e.message) }
    setBusy(false)
  }

  async function stepBackInline(order) {
    var prev = prevOf(order.durum)
    if (!prev) return
    var upd = { durum: prev }
    if (order.durum === 'tamamlandi') {
      upd.cikanYag = null; upd.asit = null; upd.oran = null; upd.verim = null
      upd.tamamTarih = null; upd.tamamSaat = null
      upd.hakYagKg = null; upd.kalanYagKg = null; upd.bidon = null; upd.sikimUcretiAlindi = false
    }
    var snapshot = {
      durum: order.durum, cikanYag: order.cikanYag || null, asit: order.asit || null, oran: order.oran || null,
      hakYagKg: order.hakYagKg || null, kalanYagKg: order.kalanYagKg || null, bidon: order.bidon || null
    }
    try {
      await siparisDb.update(order.id, upd)
      var m = musteriMap[order.musteriId]
      offerUndo((m ? m.ad : order.kod) + ' ← ' + DURUM_AD[prev], function () {
        return siparisDb.update(order.id, snapshot)
      })
    } catch (e) { flash('Hata: ' + e.message) }
  }

  async function deleteOrderInline(order) {
    setBusy(true)
    try {
      var copy = Object.assign({}, order); delete copy.id
      await siparisDb.delete(order.id)
      offerUndo(order.kod + ' silindi', function () { return siparisDb.add(copy) })
    } catch (e) { flash('Hata: ' + e.message) }
    setBusy(false)
  }

  async function saveDetay(order, upd, musteriUpd) {
    setBusy(true)
    try {
      if (musteriUpd && order.musteriId) await musteriDb.update(order.musteriId, musteriUpd)
      await siparisDb.update(order.id, upd)
      closeSheet()
      flash('Güncellendi')
    } catch (e) { flash('Hata: ' + e.message) }
    setBusy(false)
  }

  // ── Yağ alış / satış ──
  async function saveHareket(data) {
    setBusy(true)
    try {
      var musteriId = data.musteriId || null
      if (!musteriId && data.yeniAd) {
        musteriId = await musteriDb.add({
          kod: nextKod(musteriler, 'M-', 0), ad: data.yeniAd.trim(),
          tel: '', tc: '', koy: '', adres: '', notlar: '', durum: 'aktif', uyelik: today,
        })
      }
      var now = new Date()
      var h = {
        kod: nextKod(hareketler, 'H-', 1000), tur: data.tur, musteriId: musteriId,
        tarih: today, saat: now.toTimeString().slice(0, 5),
        litre: data.litre, kgFiyat: data.kgFiyat || null, tutar: data.tutar || null,
        resmi: data.resmi === true, bidonNo: [], not: data.not || '',
      }
      var id = await hareketDb.add(h)
      closeSheet()
      var ad = data.tur === 'alis' ? 'Alış' : 'Satış'
      offerUndo(ad + ' · ' + fmt.num(data.litre, 1) + ' ' + birim + (data.resmi ? ' (resmi)' : ''), function () {
        return hareketDb.delete(id)
      })
    } catch (e) { flash('Hata: ' + e.message) }
    setBusy(false)
  }

  // ── Manuel stok düzeltmesi (fire / kendi üretimi) ──
  async function saveStokHareketi(data) {
    setBusy(true)
    try {
      var now = new Date()
      var id = await hareketDb.add({
        kod: nextKod(hareketler, 'H-', 1000), tur: 'stok', musteriId: null,
        tarih: today, saat: now.toTimeString().slice(0, 5),
        litre: data.litre, kgFiyat: null, tutar: null,
        resmi: data.resmi === true, bidonNo: [], not: data.not || '',
      })
      flash('Stok hareketi eklendi')
      offerUndo('Stok ' + (data.litre > 0 ? '+' : '') + fmt.num(data.litre, 1) + ' ' + birim, function () {
        return hareketDb.delete(id)
      })
    } catch (e) { flash('Hata: ' + e.message) }
    setBusy(false)
  }

  async function silHareket(h) {
    setBusy(true)
    try {
      var copy = Object.assign({}, h); delete copy.id
      await hareketDb.delete(h.id)
      offerUndo((h.kod || 'Hareket') + ' silindi', function () { return hareketDb.add(copy) })
    } catch (e) { flash('Hata: ' + e.message) }
    setBusy(false)
  }

  async function saveMusteri(id, bilgi) {
    setBusy(true)
    try {
      await musteriDb.update(id, bilgi)
      flash('Müşteri güncellendi')
    } catch (e) { flash('Hata: ' + e.message) }
    setBusy(false)
  }

  async function deleteOrder(order) {
    setBusy(true)
    try {
      var copy = Object.assign({}, order); delete copy.id
      await siparisDb.delete(order.id)
      closeSheet()
      offerUndo(order.kod + ' silindi', function () { return siparisDb.add(copy) })
    } catch (e) { flash('Hata: ' + e.message) }
    setBusy(false)
  }

  var printZeytinTuru = printOrder ? ZEYTIN_TURLERI.find(function (t) { return t.id === printOrder.order.tur }) : null
  var columns = yikamaAdimi ? DURUM_SIRA : ['kuyrukta', 'preste', 'tamamlandi']

  // Sheet açıkken hedef siparişin güncel halini kullan (snapshot değil)
  var liveTarget = target ? (siparisler.find(function (s) { return s.id === target.id }) || target) : null

  return (
    <div className={'fab' + (yikamaAdimi ? ' cols-4' : ' cols-3')}>
      {toast && <div className="fab-toast">{toast}</div>}

      {/* ── Üst çubuk ── */}
      <header className="fab-top">
        <div className="fab-brand">
          <div className="fab-logo">Z</div>
          <div>
            <strong>Zala Hatun</strong>
            <span>Fabrika</span>
          </div>
        </div>
        <div className="fab-acts">
          <button className="fab-primary" onClick={function () { setTarget(null); setSheet('kabul') }}>
            <Icon name="plus" size={28} />
            <span>ZEYTİN KABUL</span>
          </button>
          <button className="fab-primary alt" onClick={function () { setSheet('alis') }}>
            <Icon name="download" size={22} />
            <span>YAĞ ALIŞ</span>
          </button>
          <button className="fab-primary alt sat" onClick={function () { setSheet('satis') }}>
            <Icon name="coin" size={22} />
            <span>YAĞ SATIŞ</span>
          </button>
        </div>
        <button className="fab-stok" onClick={function () { setSheet('stok') }} title="Stok detayı">
          <span className="sk">Toplam yağ</span>
          <b>{fmt.num(stok.toplam, 1)}<i>{birim}</i></b>
          <span className="sd">
            <em className="resmi">{fmt.num(stok.resmi, 0)} resmi</em>
            <em>{fmt.num(stok.gayri, 0)} kayıt dışı</em>
          </span>
        </button>
        <div className="fab-stats">
          <div className="fab-stat"><b>{siradaKart}</b><span>sırada</span></div>
          <div className="fab-stat"><b>{fmt.num(bugunZeytin, 0)}</b><span>bugün kg</span></div>
        </div>
        <div className="fab-top-actions">
          <button className="fab-icon-btn" onClick={function () { setSheet('ara') }} title="Müşteri ara">
            <Icon name="search" size={24} />
          </button>
          <button className="fab-icon-btn" onClick={function () { setShowSettings(true) }} title="Ayarlar">
            <Icon name="settings" size={24} />
          </button>
        </div>
      </header>

      {/* ── Sekmeler ── */}
      <nav className="fab-tabs">
        <button className={'fab-tab' + (tab === 'is' ? ' on' : '')} onClick={function () { setTab('is') }}>
          <Icon name="list" size={20} />
          <span>Zeytin İşleri</span>
          {siradaKart > 0 && <em>{siradaKart}</em>}
        </button>
        <button className={'fab-tab' + (tab === 'alis' ? ' on' : '')} onClick={function () { setTab('alis') }}>
          <Icon name="download" size={20} />
          <span>Alınan Yağlar</span>
        </button>
        <button className={'fab-tab' + (tab === 'satis' ? ' on' : '')} onClick={function () { setTab('satis') }}>
          <Icon name="coin" size={20} />
          <span>Satılan Yağlar</span>
        </button>
      </nav>

      {tab !== 'is' && (
        <HareketListesi
          tur={tab}
          hareketler={hareketler}
          musteriMap={musteriMap}
          settings={settings}
          onYeni={function () { setSheet(tab) }}
          onSil={silHareket}
        />
      )}

      {/* ── Akış panosu ── */}
      {tab === 'is' && (
      <div className="fab-board">
        {columns.map(function (col) {
          var list = board[col]
          return (
            <section key={col} className={'fab-col ' + col}>
              <div className="fab-col-head">
                <span>{DURUM_AD[col]}</span>
                {col === 'tamamlandi' && (
                  <div className="kol-aralik">
                    {[{ g: 1, ad: 'Bugün' }, { g: 7, ad: '7g' }, { g: 30, ad: '30g' }, { g: 0, ad: 'Tümü' }].map(function (a) {
                      return (
                        <button
                          key={a.g}
                          className={tamamGunEtkin === a.g ? 'on' : ''}
                          onClick={function () { setTamamAralik(a.g) }}
                        >{a.ad}</button>
                      )
                    })}
                  </div>
                )}
                <b>{list.length}</b>
              </div>
              <div className="fab-col-body">
                {loading && <div className="fab-empty">Yükleniyor…</div>}
                {!loading && list.length === 0 && <div className="fab-empty">—</div>}
                {list.map(function (order) { return renderCard(order) })}
              </div>
            </section>
          )
        })}
      </div>
      )}

      {/* ── Geri Al çubuğu ── */}
      {undo && (
        <div className="fab-undo">
          <span>{undo.label}</span>
          <button onClick={doUndo}><Icon name="back" size={20} /> GERİ AL</button>
        </div>
      )}

      {/* ── Sheet'ler ── */}
      {sheet === 'kabul' && (
        <KabulSheet
          customers={recentCustomers}
          siparisler={siparisler}
          busy={busy}
          onClose={closeSheet}
          onSave={saveKabul}
        />
      )}
      {sheet === 'yag' && liveTarget && (
        <YagSheet
          order={liveTarget}
          musteri={musteriMap[liveTarget.musteriId]}
          settings={settings}
          hesapla={hesapla}
          busy={busy}
          onClose={closeSheet}
          onSave={saveYag}
        />
      )}
      {sheet === 'detay' && liveTarget && (
        <DetaySheet
          order={liveTarget}
          musteri={musteriMap[liveTarget.musteriId]}
          busy={busy}
          canBack={!!prevOf(liveTarget.durum)}
          onClose={closeSheet}
          onSave={saveDetay}
          onBack={function () { stepBack(liveTarget) }}
          onDelete={function () { deleteOrder(liveTarget) }}
          onPrint={function () { openKart(liveTarget) }}
        />
      )}
      {sheet === 'kart' && liveTarget && (
        <KartSheet
          order={liveTarget}
          musteri={musteriMap[liveTarget.musteriId]}
          settings={settings}
          updateSetting={updateSetting}
          firma={firma}
          onPrint={function () { handlePrint(liveTarget) }}
          onClose={closeSheet}
        />
      )}
      {(sheet === 'alis' || sheet === 'satis') && (
        <HareketSheet
          tur={sheet}
          customers={recentCustomers}
          settings={settings}
          stok={stok}
          busy={busy}
          numpad={function (value, decimal, onChange) { return <Numpad value={value} decimal={decimal} onChange={onChange} /> }}
          onSave={saveHareket}
          onClose={closeSheet}
        />
      )}
      {sheet === 'stok' && (
        <StokSheet
          stok={stok}
          hareketler={hareketler}
          musteriMap={musteriMap}
          settings={settings}
          busy={busy}
          onEkle={saveStokHareketi}
          onSil={silHareket}
          onClose={closeSheet}
        />
      )}
      {sheet === 'ara' && (
        <AraSheet
          customers={recentCustomers}
          siparisler={siparisler}
          onClose={closeSheet}
          settings={settings}
          firma={firma}
          hareketler={hareketler}
          onPrintNow={handlePrint}
          onSaveOrder={saveOrderInline}
          onStepBack={stepBackInline}
          onDeleteOrder={deleteOrderInline}
          onSaveMusteri={saveMusteri}
          canStepBack={function (d) { return !!prevOf(d) }}
          updateSetting={updateSetting}
          busy={busy}
        />
      )}

      {/* ── Ayarlar ── */}
      {showSettings && (
        <AyarlarSheet
          settings={settings}
          updateSetting={updateSetting}
          onClose={function () { setShowSettings(false) }}
        />
      )}

      {printOrder && (
        <div className="tablet-print-only print-area">
          <PrintCard
            stil={settings.cardDefault || 'klasik'}
            firma={firma}
            musteri={printOrder.musteri}
            siparis={printOrder.order}
            zeytinTuru={printZeytinTuru}
            units={{ agirlik: settings.agirlik, yag: settings.yag }}
          />
        </div>
      )}
    </div>
  )

  function renderCard(order) {
    var m = musteriMap[order.musteriId]
    var durum = order.durum || 'kuyrukta'
    var zt = ZEYTIN_TURLERI.find(function (t) { return t.id === order.tur })
    var done = durum === 'tamamlandi'
    var actionIcon = done ? 'print' : (nextOf(durum) === 'tamamlandi' ? 'droplet' : 'arrow')
    return (
      <div key={order.id} className={'fc ' + durum}>
        <div className="fc-head">
          {order.takipNo ? <div className="fc-takip" title="Takip no">{order.takipNo}</div> : <div className="fc-av">{initialsOf(m ? m.ad : '?')}</div>}
          <div className="fc-who">
            <div className="fc-name">{m ? m.ad : 'Bilinmeyen'}</div>
            <div className="fc-meta">
              {order.takipNo ? 'Takip ' + order.takipNo + ' · ' : ''}{m && m.koy ? m.koy + ' · ' : ''}{order.saat || fmt.dateShort(order.tarih)}{zt ? ' · ' + zt.ad : ''}
            </div>
          </div>
          <button className="fc-more" onClick={function () { openKart(order) }} title="Kart">
            <Icon name="print" size={22} />
          </button>
          <button className="fc-more" onClick={function () { setTarget(order); setSheet('detay') }} title="Detay">
            <Icon name="menu" size={22} />
          </button>
        </div>
        <div className="fc-nums">
          <div className="fc-num">
            <b>{fmt.num(order.zeytinKg, 0)}</b><span>kg zeytin</span>
          </div>
          {done && (
            <div className="fc-num hi">
              <b>{fmt.num(order.cikanYag, 1)}</b><span>{birim} yağ · verim {fmt.num(order.verim != null ? order.verim : verimOf(order.zeytinKg, order.cikanYag), 2)}</span>
            </div>
          )}
          {done && order.bidon ? (
            <div className="fc-num">
              <b>{order.bidon}</b><span>bidon</span>
            </div>
          ) : null}
          {!done && order.cuval ? (
            <div className="fc-num">
              <b>{order.cuval}</b><span>çuval</span>
            </div>
          ) : null}
        </div>
        <button className={'fc-action ' + durum} onClick={function () { advance(order) }}>
          <Icon name={actionIcon} size={24} />
          <span>{actionLabel(durum)}</span>
        </button>
      </div>
    )
  }
}

// ─────────────────────────────────────────────────────────────
// ZEYTİN KABUL — 1) müşteri  2) kg + tür
// ─────────────────────────────────────────────────────────────
function KabulSheet(props) {
  var [q, setQ] = useState('')
  var [picked, setPicked] = useState(null)   // { id, ad, koy } | { yeniAd }
  var [kg, setKg] = useState('')
  var [cuval, setCuval] = useState('')
  var [field, setField] = useState('kg')     // numpad hedefi
  var [tur, setTur] = useState('memecik')
  var [takipNo, setTakipNo] = useState('')
  var [bilgi, setBilgi] = useState(EMPTY_BILGI)
  var [bilgiDirty, setBilgiDirty] = useState(false)
  var [bilgiOpen, setBilgiOpen] = useState(false)
  function setB(k, v) { setBilgi(function (b) { var n = Object.assign({}, b); n[k] = v; return n }); setBilgiDirty(true) }

  var nq = normalize(q)
  var list = nq ? props.customers.filter(function (m) { return normalize(m.ad).indexOf(nq) !== -1 }) : props.customers
  var shown = list.slice(0, 18)
  var exact = list.some(function (m) { return normalize(m.ad) === nq })

  function pick(m) {
    setPicked({ id: m.id, ad: m.ad, koy: m.koy || '' })
    setBilgi(bilgiOf(m)); setBilgiDirty(false); setBilgiOpen(false)
    // Müşterinin son kartındaki zeytin türünü hatırla
    var last = props.siparisler.filter(function (s) { return s.musteriId === m.id })
      .sort(function (a, b) { return ((b.tarih || '') + (b.saat || '')).localeCompare((a.tarih || '') + (a.saat || '')) })[0]
    if (last && last.tur) setTur(last.tur)
  }
  function pickNew() {
    if (!q.trim()) return
    setPicked({ yeniAd: q.trim() })
    setBilgi(EMPTY_BILGI); setBilgiDirty(false); setBilgiOpen(true)
  }
  function save() {
    if (!picked || !Number(kg)) return
    props.onSave({
      musteriId: picked.id || null, yeniAd: picked.yeniAd || '',
      bilgi: bilgi, bilgiDirty: bilgiDirty, takipNo: takipNo,
      zeytinKg: kg, cuval: cuval, tur: tur,
    })
  }

  return (
    <div className="fab-sheet">
      <div className="fab-sheet-head">
        <button className="fab-icon-btn" onClick={picked ? function () { setPicked(null) } : props.onClose}>
          <Icon name={picked ? 'back' : 'x'} size={26} />
        </button>
        <h2>{picked ? 'Zeytin Miktarı' : 'Müşteri Seç'}</h2>
        <div className="fab-steps"><i className="on"></i><i className={picked ? 'on' : ''}></i></div>
      </div>

      {!picked && (
        <div className="fab-sheet-body">
          <div className="fab-search">
            <Icon name="search" size={22} />
            <input
              autoFocus
              value={q}
              onChange={function (e) { setQ(e.target.value) }}
              placeholder="Müşteri adı yaz veya söyle…"
              onKeyDown={function (e) { if (e.key === 'Enter') { if (list.length === 1) pick(list[0]); else if (!exact) pickNew() } }}
            />
            <VoiceInput onResult={function (v) { setQ(v) }} />
          </div>
          <div className="fab-tiles">
            {q.trim() && !exact && (
              <button className="fab-tile new" onClick={pickNew}>
                <div className="fab-tile-av"><Icon name="plus" size={22} /></div>
                <div className="fab-tile-name">Yeni: {q.trim()}</div>
                <div className="fab-tile-meta">müşteri oluştur</div>
              </button>
            )}
            {shown.map(function (m) {
              return (
                <button key={m.id} className="fab-tile" onClick={function () { pick(m) }}>
                  <div className="fab-tile-av">{initialsOf(m.ad)}</div>
                  <div className="fab-tile-name">{m.ad}</div>
                  <div className="fab-tile-meta">{m.koy || '—'}</div>
                </button>
              )
            })}
            {shown.length === 0 && !q.trim() && <div className="fab-empty">Henüz müşteri yok — ad yazıp oluştur</div>}
          </div>
        </div>
      )}

      {picked && (
        <div className="fab-sheet-body split">
          <div className="fab-entry">
            <div className="fab-picked">
              <div className="fab-tile-av">{picked.id ? initialsOf(picked.ad) : <Icon name="plus" size={20} />}</div>
              <div className="fab-picked-text">
                <div className="fab-picked-name">{picked.ad || picked.yeniAd}</div>
                <div className="fab-picked-meta">
                  {picked.id ? 'Kayıtlı müşteri' : 'Yeni müşteri'}
                  {bilgi.koy ? ' · ' + bilgi.koy : ''}{bilgi.tel ? ' · ' + bilgi.tel : ''}
                </div>
              </div>
              <button className={'fab-icon-btn sm' + (bilgiOpen ? ' on' : '')} onClick={function () { setBilgiOpen(!bilgiOpen) }} title="Müşteri bilgileri">
                <Icon name="edit" size={20} />
              </button>
            </div>
            {bilgiOpen && <MusteriBilgiForm bilgi={bilgi} onChange={setB} compact />}
            <div className="fab-fields">
              <button className={'fab-field' + (field === 'kg' ? ' on' : '')} onClick={function () { setField('kg') }}>
                <span>Zeytin</span>
                <b>{kg || '0'}<i>kg</i></b>
              </button>
              <button className={'fab-field sm' + (field === 'cuval' ? ' on' : '')} onClick={function () { setField('cuval') }}>
                <span>Çuval</span>
                <b>{cuval || '–'}</b>
              </button>
              <button className={'fab-field sm' + (field === 'takip' ? ' on' : '')} onClick={function () { setField('takip') }}>
                <span>Takip no</span>
                <b>{takipNo || '–'}</b>
              </button>
            </div>
            <div className="fab-chips">
              {ZEYTIN_TURLERI.map(function (t) {
                return <button key={t.id} className={'fab-chip' + (tur === t.id ? ' on' : '')} onClick={function () { setTur(t.id) }}>{t.ad}</button>
              })}
            </div>
          </div>
          <div className="fab-pad">
            <Numpad
              value={field === 'kg' ? kg : field === 'cuval' ? cuval : takipNo}
              decimal={field === 'kg'}
              onChange={field === 'kg' ? setKg : field === 'cuval' ? setCuval : setTakipNo}
            />
            <button className="fab-save" disabled={!Number(kg) || props.busy} onClick={save}>
              <Icon name="check" size={28} />
              <span>{props.busy ? 'KAYDEDİLİYOR…' : 'KAYDET'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// YAĞ GİR — presten çıkan yağ + asit
// ─────────────────────────────────────────────────────────────
function YagSheet(props) {
  var order = props.order
  var [yag, setYag] = useState('')
  var [asit, setAsit] = useState('')
  var [bidon, setBidon] = useState('')
  var [field, setField] = useState('yag')
  var [ucretAlindi, setUcretAlindi] = useState(false)

  var yagNum = Number(yag) || 0
  // Sıkım ücreti nakit alındıysa hak yağı kesilmez
  var hakYag = ucretAlindi ? 0 : props.hesapla.hakYag(yagNum)
  var kalan = +(yagNum - hakYag).toFixed(2)
  var kap = props.settings.bidonKapasite || 17
  var autoBidon = kalan > 0 ? Math.ceil(kalan / kap) : 0
  var verim = verimOf(order.zeytinKg || 0, yagNum)

  var vals = { yag: yag, asit: asit, bidon: bidon }
  var setters = { yag: setYag, asit: setAsit, bidon: setBidon }

  return (
    <div className="fab-sheet">
      <div className="fab-sheet-head">
        <button className="fab-icon-btn" onClick={props.onClose}><Icon name="x" size={26} /></button>
        <h2>Yağ Gir</h2>
        <span className="fab-sheet-sub">{props.musteri ? props.musteri.ad : order.kod} · {fmt.num(order.zeytinKg, 0)} kg zeytin</span>
      </div>
      <div className="fab-sheet-body split">
        <div className="fab-entry">
          <div className="fab-fields col">
            <button className={'fab-field' + (field === 'yag' ? ' on' : '')} onClick={function () { setField('yag') }}>
              <span>Çıkan Yağ</span>
              <b>{yag || '0'}<i>kg</i></b>
            </button>
            <div className="fab-fields">
              <button className={'fab-field sm' + (field === 'asit' ? ' on' : '')} onClick={function () { setField('asit') }}>
                <span>Asit</span>
                <b>{asit || '–'}</b>
              </button>
              <button className={'fab-field sm' + (field === 'bidon' ? ' on' : '')} onClick={function () { setField('bidon') }}>
                <span>Bidon</span>
                <b>{bidon || (autoBidon ? <em>{autoBidon}</em> : '–')}</b>
              </button>
            </div>
          </div>
          <button className={'fab-tik' + (ucretAlindi ? ' on' : '')} onClick={function () { setUcretAlindi(!ucretAlindi) }}>
            <span className="kutu">{ucretAlindi && <Icon name="check" size={20} />}</span>
            <span className="yazi">
              <b>Sıkım ücreti alındı</b>
              <small>Hak yağı kesilmez, yağın tamamı müşterinin</small>
            </span>
          </button>
          <div className="fab-calc">
            <div><span>Verim (kg/kg)</span><b>{verim != null ? fmt.num(verim, 2) : '—'}</b></div>
            <div className={ucretAlindi ? 'pasif' : ''}><span>Hak yağı {ucretAlindi ? '(alınmadı)' : '(%' + props.settings.hakYagOran + ')'}</span><b>{yagNum ? fmt.num(hakYag, 1) + ' kg' : '—'}</b></div>
            <div><span>Müşteriye kalan</span><b>{yagNum ? fmt.num(kalan, 1) + ' kg' : '—'}</b></div>
          </div>
        </div>
        <div className="fab-pad">
          <Numpad value={vals[field]} decimal={field !== 'bidon'} onChange={setters[field]} />
          <button
            className="fab-save"
            disabled={!yagNum || props.busy}
            onClick={function () { props.onSave(order, yagNum, Number(asit) || 0, Number(bidon) || 0, ucretAlindi) }}
          >
            <Icon name="check" size={28} />
            <span>{props.busy ? 'KAYDEDİLİYOR…' : 'TAMAMLA'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DETAY — nadir işler (düzenle / geri / sil / yazdır)
// ─────────────────────────────────────────────────────────────
function DetaySheet(props) {
  var o = props.order
  var m = props.musteri || {}
  var [f, setF] = useState({
    zeytinKg: String(o.zeytinKg || ''), cuval: String(o.cuval || ''), tur: o.tur || 'memecik',
    cikanYag: String(o.cikanYag || ''), asit: String(o.asit || ''), bidon: String(o.bidon || ''),
    operator: o.operator || '', not: o.not || '', koy: m.koy || '', tel: m.tel || '',
  })
  var [confirmDel, setConfirmDel] = useState(false)
  function set(k, v) { setF(function (p) { var n = Object.assign({}, p); n[k] = v; return n }) }

  function save() {
    var upd = {
      zeytinKg: Number(f.zeytinKg) || 0, cuval: Number(f.cuval) || null, tur: f.tur,
      operator: f.operator || '', not: f.not || '',
    }
    if (o.durum === 'tamamlandi') {
      upd.cikanYag = Number(f.cikanYag) || null
      upd.asit = Number(f.asit) || null
      upd.bidon = Number(f.bidon) || null
      if (upd.cikanYag && upd.zeytinKg) upd.oran = +((upd.cikanYag / upd.zeytinKg) * 100).toFixed(2)
    }
    var mUpd = null
    if (props.musteri && (f.koy !== (m.koy || '') || f.tel !== (m.tel || ''))) mUpd = { koy: f.koy, tel: f.tel }
    props.onSave(o, upd, mUpd)
  }

  return (
    <div className="fab-sheet narrow">
      <div className="fab-sheet-head">
        <button className="fab-icon-btn" onClick={props.onClose}><Icon name="x" size={26} /></button>
        <h2>{m.ad || 'Kart'}</h2>
        <span className="fab-sheet-sub">{o.kod} · {DURUM_AD[o.durum || 'kuyrukta']} · {fmt.date(o.tarih)} {o.saat || ''}</span>
      </div>
      <div className="fab-sheet-body form">
        <div className="fab-grid">
          <div className="fab-row"><label className="fab-label">Zeytin (kg)</label><input className="fab-input" type="number" inputMode="decimal" value={f.zeytinKg} onChange={function (e) { set('zeytinKg', e.target.value) }} /></div>
          <div className="fab-row"><label className="fab-label">Çuval</label><input className="fab-input" type="number" inputMode="numeric" value={f.cuval} onChange={function (e) { set('cuval', e.target.value) }} /></div>
          <div className="fab-row"><label className="fab-label">Zeytin Türü</label>
            <select className="fab-input" value={f.tur} onChange={function (e) { set('tur', e.target.value) }}>
              {ZEYTIN_TURLERI.map(function (t) { return <option key={t.id} value={t.id}>{t.ad}</option> })}
            </select>
          </div>
          <div className="fab-row"><label className="fab-label">Operatör</label><input className="fab-input" value={f.operator} onChange={function (e) { set('operator', e.target.value) }} /></div>
          {o.durum === 'tamamlandi' && (
            <>
              <div className="fab-row"><label className="fab-label">Çıkan Yağ (kg)</label><input className="fab-input" type="number" inputMode="decimal" value={f.cikanYag} onChange={function (e) { set('cikanYag', e.target.value) }} /></div>
              <div className="fab-row"><label className="fab-label">Asit</label><input className="fab-input" type="number" inputMode="decimal" value={f.asit} onChange={function (e) { set('asit', e.target.value) }} /></div>
              <div className="fab-row"><label className="fab-label">Bidon</label><input className="fab-input" type="number" inputMode="numeric" value={f.bidon} onChange={function (e) { set('bidon', e.target.value) }} /></div>
            </>
          )}
          <div className="fab-row"><label className="fab-label">Köy</label><input className="fab-input" list="fab-koy2" value={f.koy} onChange={function (e) { set('koy', e.target.value) }} /><datalist id="fab-koy2">{KOYLER.map(function (k) { return <option key={k} value={k} /> })}</datalist></div>
          <div className="fab-row"><label className="fab-label">Telefon</label><input className="fab-input" type="tel" value={f.tel} onChange={function (e) { set('tel', e.target.value) }} /></div>
          <div className="fab-row wide"><label className="fab-label">Not</label><input className="fab-input" value={f.not} onChange={function (e) { set('not', e.target.value) }} /></div>
        </div>
        <div className="fab-actions">
          <button className="fab-btn primary" disabled={props.busy} onClick={save}><Icon name="check" size={22} /> Kaydet</button>
          <button className="fab-btn" onClick={props.onPrint}><Icon name="print" size={22} /> Kart</button>
          {props.canBack && <button className="fab-btn" onClick={props.onBack}><Icon name="back" size={22} /> Bir adım geri</button>}
          {!confirmDel
            ? <button className="fab-btn danger" onClick={function () { setConfirmDel(true) }}><Icon name="trash" size={22} /> Sil</button>
            : <button className="fab-btn danger solid" disabled={props.busy} onClick={props.onDelete}><Icon name="trash" size={22} /> Emin misin? SİL</button>}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ARA — müşteri geçmişi / eski kartları yazdır
// ─────────────────────────────────────────────────────────────
function AraSheet(props) {
  var [q, setQ] = useState('')
  var [selId, setSelId] = useState(null)
  var [editing, setEditing] = useState(false)
  var [bilgi, setBilgi] = useState(EMPTY_BILGI)
  var sel = selId ? props.customers.find(function (m) { return m.id === selId }) : null
  function setSel(m) { setSelId(m ? m.id : null); setEditing(false); if (m) setBilgi(bilgiOf(m)) }
  function setB(k, v) { setBilgi(function (b) { var n = Object.assign({}, b); n[k] = v; return n }) }
  function saveBilgi() { props.onSaveMusteri(sel.id, bilgi); setEditing(false) }
  var [openId, setOpenId] = useState(null)
  var [kartOrder, setKartOrder] = useState(null)
  var nq = normalize(q)
  var list = (nq ? props.customers.filter(function (m) { return normalize(m.ad).indexOf(nq) !== -1 }) : props.customers).slice(0, 30)
  var orders = sel ? props.siparisler.filter(function (s) { return s.musteriId === sel.id })
    .sort(function (a, b) { return ((b.tarih || '') + (b.saat || '')).localeCompare((a.tarih || '') + (a.saat || '')) }) : []
  var musteriHareket = sel ? (props.hareketler || []).filter(function (h) {
    return h.musteriId === sel.id && (h.tur === 'alis' || h.tur === 'satis')
  }).sort(function (a, b) { return ((b.tarih || '') + (b.saat || '')).localeCompare((a.tarih || '') + (a.saat || '')) }) : []
  var liveKart = kartOrder ? (props.siparisler.find(function (s) { return s.id === kartOrder.id }) || kartOrder) : null

  return (
    <div className="fab-sheet">
      <div className="fab-sheet-head">
        <button className="fab-icon-btn" onClick={sel ? function () { setSel(null); setOpenId(null) } : props.onClose}><Icon name={sel ? 'back' : 'x'} size={26} /></button>
        <h2>{sel ? sel.ad : 'Müşteri Ara'}</h2>
        {sel && <span className="fab-sheet-sub">{sel.kod || ''} · {orders.length} kart{musteriHareket.length ? ' · ' + musteriHareket.length + ' yağ işlemi' : ''}</span>}
      </div>
      <div className="fab-sheet-body">
        {!sel && (
          <>
            <div className="fab-search">
              <Icon name="search" size={22} />
              <input autoFocus value={q} onChange={function (e) { setQ(e.target.value) }} placeholder="Müşteri adı…" />
              <VoiceInput onResult={function (v) { setQ(v) }} />
            </div>
            <div className="fab-tiles">
              {list.map(function (m) {
                return (
                  <button key={m.id} className="fab-tile" onClick={function () { setSel(m) }}>
                    <div className="fab-tile-av">{initialsOf(m.ad)}</div>
                    <div className="fab-tile-name">{m.ad}</div>
                    <div className="fab-tile-meta">{m.koy || '—'}</div>
                  </button>
                )
              })}
            </div>
          </>
        )}
        {sel && (
          <div className="fab-musteri">
            <div className="fab-picked">
              <div className="fab-tile-av">{initialsOf(sel.ad)}</div>
              <div className="fab-picked-text">
                <div className="fab-picked-name">{sel.ad}</div>
                <div className="fab-picked-meta">
                  {[sel.koy, sel.tel, sel.tc ? 'TC ' + sel.tc : '', sel.adres].filter(Boolean).join(' · ') || 'Bilgi girilmemiş'}
                </div>
              </div>
              <button className={'fab-icon-btn sm' + (editing ? ' on' : '')} onClick={function () { setEditing(!editing); if (!editing) setBilgi(bilgiOf(sel)) }} title="Bilgileri düzenle">
                <Icon name="edit" size={20} />
              </button>
            </div>
            {editing && (
              <div className="fab-musteri-edit">
                <MusteriBilgiForm bilgi={bilgi} onChange={setB} />
                <div className="fab-actions">
                  <button className="fab-btn primary" disabled={props.busy} onClick={saveBilgi}><Icon name="check" size={22} /> Kaydet</button>
                  <button className="fab-btn" onClick={function () { setEditing(false) }}>Vazgeç</button>
                </div>
              </div>
            )}
          </div>
        )}
        {sel && musteriHareket.length > 0 && (
          <div className="musteri-hareket">
            <div className="mh-baslik">Yağ alış / satış</div>
            {musteriHareket.map(function (h) {
              var litre = Math.abs(Number(h.litre) || 0)
              var birim = (props.settings && props.settings.yag) || 'kg'
              var para = (props.settings && props.settings.currency) || '₺'
              return (
                <div key={h.id} className={'stok-row ' + h.tur}>
                  <div className="stok-row-main">
                    <b>{h.tur === 'alis' ? 'Yağ alış' : 'Yağ satış'}{h.resmi ? ' · resmi' : ' · resmi değil'}</b>
                    <span>{fmt.date(h.tarih)}{h.saat ? ' · ' + h.saat : ''}{h.not ? ' · ' + h.not : ''}</span>
                  </div>
                  <div className="stok-row-nums">
                    {h.tutar ? <span>{fmt.money(h.tutar, para)}</span> : null}
                    <b className={h.tur === 'satis' ? 'eksi' : 'arti'}>{h.tur === 'satis' ? '-' : '+'}{fmt.num(litre, 1)} {birim}</b>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {sel && (
          <div className="fab-hist">
            {musteriHareket.length > 0 && <div className="mh-baslik">Zeytin kartları</div>}
            {orders.length === 0 && <div className="fab-empty">Kart yok</div>}
            {orders.map(function (o) {
              var zt = ZEYTIN_TURLERI.find(function (t) { return t.id === o.tur })
              var acik = openId === o.id
              return (
                <div key={o.id} className={'fab-hist-item' + (acik ? ' acik' : '')}>
                  <button
                    className={'fab-hist-row ' + (o.durum || 'kuyrukta')}
                    onClick={function () { setOpenId(acik ? null : o.id) }}
                  >
                    <div className="fab-hist-main">
                      <b>{fmt.date(o.tarih)}</b>
                      <span>{o.kod}{o.takipNo ? ' · Takip ' + o.takipNo : ''} · {zt ? zt.ad : ''} · {DURUM_AD[o.durum || 'kuyrukta']}</span>
                    </div>
                    <div className="fab-hist-nums">
                      <span>{fmt.num(o.zeytinKg, 0)} kg</span>
                      {o.cikanYag ? <b>{fmt.num(o.cikanYag, 1)} kg yağ</b> : null}
                      {o.cikanYag ? <span>verim {fmt.num(o.verim != null ? o.verim : verimOf(o.zeytinKg, o.cikanYag), 2)}</span> : null}
                    </div>
                    <span className={'fab-hist-caret' + (acik ? ' acik' : '')}><Icon name="arrow" size={20} /></span>
                  </button>
                  {acik && (
                    <SiparisDetay
                      order={o}
                      busy={props.busy}
                      canStepBack={props.canStepBack(o.durum)}
                      onSave={props.onSaveOrder}
                      onStepBack={props.onStepBack}
                      onDelete={function () { props.onDeleteOrder(o); setOpenId(null) }}
                      onKart={function () { setKartOrder(o) }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      {liveKart && (
        <div className="fab-sheet-stack">
          <KartSheet
            order={liveKart}
            musteri={sel}
            settings={props.settings}
            updateSetting={props.updateSetting}
            firma={props.firma}
            onPrint={function () { props.onPrintNow(liveKart) }}
            onClose={function () { setKartOrder(null) }}
          />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SİPARİŞ DETAY — Ara ekranı içinde açılır panel
// Tüm alanlar görünür; düzenlemek için ayrı ekrana gitmek gerekmez.
// ─────────────────────────────────────────────────────────────
function SiparisDetay(props) {
  var o = props.order
  var done = o.durum === 'tamamlandi'
  var [f, setF] = useState(null)
  var [confirmDel, setConfirmDel] = useState(false)
  var duzenle = f !== null
  function baslaDuzenle() {
    setF({
      zeytinKg: String(o.zeytinKg || ''), cuval: String(o.cuval || ''), tur: o.tur || 'memecik',
      cikanYag: String(o.cikanYag || ''), asit: String(o.asit || ''), bidon: String(o.bidon || ''),
      operator: o.operator || '', not: o.not || '', takipNo: o.takipNo || '',
    })
  }
  function set(k, v) { setF(function (p) { var n = Object.assign({}, p); n[k] = v; return n }) }
  function kaydet() {
    var upd = {
      zeytinKg: Number(f.zeytinKg) || 0, cuval: Number(f.cuval) || null, tur: f.tur,
      operator: f.operator || '', not: f.not || '', takipNo: (f.takipNo || '').trim(),
    }
    if (done) {
      upd.cikanYag = Number(f.cikanYag) || null
      upd.asit = Number(f.asit) || null
      upd.bidon = Number(f.bidon) || null
      if (upd.cikanYag && upd.zeytinKg) upd.oran = +((upd.cikanYag / upd.zeytinKg) * 100).toFixed(2)
    }
    props.onSave(o, upd)
    setF(null)
  }
  function kv(label, value) {
    return (
      <div className="fab-kv">
        <span>{label}</span>
        <b>{value}</b>
      </div>
    )
  }
  var zt = ZEYTIN_TURLERI.find(function (t) { return t.id === o.tur })
  return (
    <div className="fab-detay">
      {!duzenle && (
        <div className="fab-kvs">
          {kv('Takip no', o.takipNo || '—')}
          {kv('Durum', DURUM_AD[o.durum || 'kuyrukta'])}
          {kv('Tarih', fmt.date(o.tarih) + (o.saat ? ' · ' + o.saat : ''))}
          {kv('Zeytin türü', zt ? zt.ad : '—')}
          {kv('Zeytin', fmt.num(o.zeytinKg, 0) + ' kg')}
          {kv('Çuval', o.cuval || '—')}
          {kv('Çıkan yağ', o.cikanYag ? fmt.num(o.cikanYag, 1) + ' kg' : '—')}
          {kv('Verim (kg/kg)', o.cikanYag ? fmt.num(o.verim != null ? o.verim : verimOf(o.zeytinKg, o.cikanYag), 2) : '—')}
          {kv('Asit', o.asit ? fmt.num(o.asit, 2) : '—')}
          {kv('Hak yağı', o.hakYagKg ? fmt.num(o.hakYagKg, 1) + ' kg' : '—')}
          {kv('Müşteriye kalan', o.kalanYagKg ? fmt.num(o.kalanYagKg, 1) + ' kg' : '—')}
          {kv('Bidon', o.bidon || '—')}
          {kv('Operatör', o.operator || '—')}
          {o.not ? kv('Not', o.not) : null}
        </div>
      )}
      {duzenle && (
        <div className="fab-grid">
          <div className="fab-row"><label className="fab-label">Zeytin (kg)</label><input className="fab-input" type="number" inputMode="decimal" value={f.zeytinKg} onChange={function (e) { set('zeytinKg', e.target.value) }} /></div>
          <div className="fab-row"><label className="fab-label">Çuval</label><input className="fab-input" type="number" inputMode="numeric" value={f.cuval} onChange={function (e) { set('cuval', e.target.value) }} /></div>
          <div className="fab-row"><label className="fab-label">Zeytin türü</label>
            <select className="fab-input" value={f.tur} onChange={function (e) { set('tur', e.target.value) }}>
              {ZEYTIN_TURLERI.map(function (t) { return <option key={t.id} value={t.id}>{t.ad}</option> })}
            </select>
          </div>
          <div className="fab-row"><label className="fab-label">Takip no</label><input className="fab-input" inputMode="numeric" value={f.takipNo} onChange={function (e) { set('takipNo', e.target.value) }} /></div>
          <div className="fab-row"><label className="fab-label">Operatör</label><input className="fab-input" value={f.operator} onChange={function (e) { set('operator', e.target.value) }} /></div>
          {done && <div className="fab-row"><label className="fab-label">Çıkan yağ (kg)</label><input className="fab-input" type="number" inputMode="decimal" value={f.cikanYag} onChange={function (e) { set('cikanYag', e.target.value) }} /></div>}
          {done && <div className="fab-row"><label className="fab-label">Asit</label><input className="fab-input" type="number" inputMode="decimal" value={f.asit} onChange={function (e) { set('asit', e.target.value) }} /></div>}
          {done && <div className="fab-row"><label className="fab-label">Bidon</label><input className="fab-input" type="number" inputMode="numeric" value={f.bidon} onChange={function (e) { set('bidon', e.target.value) }} /></div>}
          <div className="fab-row wide"><label className="fab-label">Not</label><input className="fab-input" value={f.not} onChange={function (e) { set('not', e.target.value) }} /></div>
        </div>
      )}
      <div className="fab-actions">
        {!duzenle
          ? <button className="fab-btn primary" onClick={baslaDuzenle}><Icon name="edit" size={22} /> Düzenle</button>
          : <button className="fab-btn primary" disabled={props.busy} onClick={kaydet}><Icon name="check" size={22} /> Kaydet</button>}
        {duzenle && <button className="fab-btn" onClick={function () { setF(null) }}>Vazgeç</button>}
        <button className="fab-btn" onClick={props.onKart}><Icon name="print" size={22} /> Kart</button>
        {props.canStepBack && <button className="fab-btn" onClick={function () { props.onStepBack(o) }}><Icon name="back" size={22} /> Bir adım geri</button>}
        {!confirmDel
          ? <button className="fab-btn danger" onClick={function () { setConfirmDel(true) }}><Icon name="trash" size={22} /> Sil</button>
          : <button className="fab-btn danger solid" disabled={props.busy} onClick={props.onDelete}><Icon name="trash" size={22} /> Emin misin? SİL</button>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// KART — önizleme + tasarım seç + YAZDIR
// Kabul sonrası müşteriye fiş, tamamlama sonrası final kart.
// ─────────────────────────────────────────────────────────────
var KART_STILLERI = [
  { id: 'klasik', ad: 'Klasik' }, { id: 'modern', ad: 'Modern' }, { id: 'termal', ad: 'Termal' },
  { id: 'minimal', ad: 'Minimal' }, { id: 'detayli', ad: 'Detaylı' }, { id: 'renkli', ad: 'Renkli' },
]
function KartSheet(props) {
  var o = props.order
  var m = props.musteri
  var stil = props.settings.cardDefault || 'klasik'
  var zt = ZEYTIN_TURLERI.find(function (t) { return t.id === o.tur })
  var done = o.durum === 'tamamlandi'
  return (
    <div className="fab-sheet">
      <div className="fab-sheet-head">
        <button className="fab-icon-btn" onClick={props.onClose}><Icon name="x" size={26} /></button>
        <h2>{done ? 'Yağ Kartı' : 'Kabul Fişi'}</h2>
        <span className="fab-sheet-sub">{m ? m.ad : ''} · {o.kod}{o.takipNo ? ' · Takip ' + o.takipNo : ''} · {fmt.num(o.zeytinKg, 0)} kg{done ? ' → ' + fmt.num(o.cikanYag, 1) + ' kg yağ' : ''}</span>
      </div>
      <div className="fab-sheet-body kart">
        <div className="fab-kart-preview">
          <div className="fab-kart-scale">
            <PrintCard
              stil={stil}
              firma={props.firma || FIRMA}
              musteri={m}
              siparis={o}
              zeytinTuru={zt}
              units={{ agirlik: props.settings.agirlik, yag: props.settings.yag }}
            />
          </div>
        </div>
        <div className="fab-kart-side">
          <label className="fab-label">Kart tasarımı</label>
          <div className="fab-chips">
            {KART_STILLERI.map(function (k) {
              return <button key={k.id} className={'fab-chip' + (stil === k.id ? ' on' : '')} onClick={function () { props.updateSetting('cardDefault', k.id) }}>{k.ad}</button>
            })}
          </div>
          {!done && <p className="fab-hint">Yağ henüz girilmedi — bu fiş zeytin teslim belgesidir. Yağ çıkınca final kart tekrar basılır.</p>}
          <button className="fab-save" onClick={props.onPrint}>
            <Icon name="print" size={28} />
            <span>YAZDIR</span>
          </button>
          <button className="fab-btn wide" onClick={props.onClose}><Icon name="check" size={22} /> Bitti</button>
        </div>
      </div>
    </div>
  )
}

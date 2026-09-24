import { useState, useEffect } from 'react'
import { Sidebar, Topbar, MobileBottomNav, MobileDrawer } from './components/Layout'
import OrderDetailModal from './components/OrderDetailModal'
import { useSettings } from './hooks/useSettings'
import { useMusteriler } from './hooks/useFirestore'

import Dashboard from './pages/Dashboard'
import YeniIslem from './pages/YeniIslem'
import AktifSiparisler from './pages/AktifSiparisler'
import MusteriYonetimi from './pages/MusteriYonetimi'
import MusteriDetay from './pages/MusteriDetay'
import Hareketler from './pages/Hareketler'
import BidonTakibi from './pages/BidonTakibi'
import Stok from './pages/Stok'
import AsitGecmisi from './pages/AsitGecmisi'
import Cari from './pages/Cari'
import Raporlar from './pages/Raporlar'
import KoyBolge from './pages/KoyBolge'
import SezonKarsilastirma from './pages/SezonKarsilastirma'
import YazdirmaGecmisi from './pages/YazdirmaGecmisi'
import Ayarlar from './pages/Ayarlar'

export default function App() {
  const [settings, updateSetting, { updateMultiple, resetSettings, hesapla }] = useSettings()
  const { data: musteriler } = useMusteriler()
  const [page, setPage] = useState('dashboard')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const units = { agirlik: settings.agirlik, yag: settings.yag }
  const currency = settings.currency

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', settings.palette)
    document.documentElement.style.setProperty('--density', settings.density)
  }, [settings.palette, settings.density])

  const handleNav = (id) => {
    setPage(id)
    setSelectedCustomer(null)
    setDrawerOpen(false)
    // Scroll main content to top on page change
    const main = document.querySelector('.main')
    if (main) main.scrollTop = 0
  }

  const handleOpenCustomer = (m) => {
    setSelectedCustomer(m)
    setPage('musteri-detay')
  }

  const handleOpenOrder = (s) => {
    setSelectedOrder(s)
  }

  const renderPage = () => {
    if (page === 'musteri-detay' && selectedCustomer) {
      return <MusteriDetay musteri={selectedCustomer} onBack={() => handleNav('musteri')} units={units} currency={currency} onOpenOrder={handleOpenOrder} settings={settings} />
    }

    switch (page) {
      case 'dashboard': return <Dashboard onNav={handleNav} onOpenCustomer={handleOpenCustomer} onOpenOrder={handleOpenOrder} units={units} currency={currency} settings={settings} />
      case 'yeni-islem': return <YeniIslem units={units} currency={currency} settings={settings} hesapla={hesapla} />
      case 'aktif': return <AktifSiparisler onOpenOrder={handleOpenOrder} units={units} settings={settings} hesapla={hesapla} />
      case 'musteri': return <MusteriYonetimi onOpenCustomer={handleOpenCustomer} units={units} settings={settings} />
      case 'hareket': return <Hareketler units={units} currency={currency} settings={settings} hesapla={hesapla} />
      case 'bidon': return <BidonTakibi units={units} settings={settings} />
      case 'stok': return <Stok units={units} settings={settings} />
      case 'asit': return <AsitGecmisi units={units} settings={settings} />
      case 'cari': return <Cari onOpenCustomer={handleOpenCustomer} units={units} currency={currency} />
      case 'raporlar': return <Raporlar units={units} settings={settings} />
      case 'koy': return <KoyBolge onOpenCustomer={handleOpenCustomer} units={units} settings={settings} />
      case 'sezon': return <SezonKarsilastirma units={units} settings={settings} />
      case 'yazdirma': return <YazdirmaGecmisi units={units} />
      case 'ayarlar': return <Ayarlar settings={settings} updateSetting={updateSetting} updateMultiple={updateMultiple} resetSettings={resetSettings} />
      default: return <Dashboard onNav={handleNav} onOpenCustomer={handleOpenCustomer} onOpenOrder={handleOpenOrder} units={units} currency={currency} settings={settings} />
    }
  }

  const orderMusteri = selectedOrder ? musteriler.find(m => m.id === selectedOrder.musteriId) : null

  return (
    <div className={`app ${drawerOpen ? 'drawer-open' : ''}`}>
      <Sidebar active={page} onNav={handleNav} settings={settings} />
      <main className="main">
        {renderPage()}
      </main>
      <MobileBottomNav active={page} onNav={handleNav} onOpenMenu={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} active={page} onNav={handleNav} onClose={() => setDrawerOpen(false)} />
      {selectedOrder && (
        <OrderDetailModal
          siparis={selectedOrder}
          musteri={orderMusteri}
          onClose={() => setSelectedOrder(null)}
          units={units}
          cardStyle={settings.cardDefault}
          settings={settings}
          hesapla={hesapla}
        />
      )}
    </div>
  )
}

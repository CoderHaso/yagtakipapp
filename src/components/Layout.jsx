import { useState } from 'react'
import Icon from './Icon'
import { NAV_ITEMS, NAV_GROUPS } from '../lib/constants'

export function Sidebar({ active, onNav, settings }) {
  var sezonAd = settings?.sezonAd || '2026–27'
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
        <span className="dot"></span> Sezon {sezonAd}
      </div>
      <nav className="nav">
        {NAV_GROUPS.map(g => (
          <div key={g.id} className="nav-group">
            <div className="nav-label">{g.label}</div>
            {NAV_ITEMS.filter(i => i.group === g.id).map(item => (
              <button
                key={item.id}
                className={`nav-item ${active === item.id ? 'active' : ''}`}
                onClick={() => onNav(item.id)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.badge > 0 && <span className="badge">{item.badge}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="user-card">
        <div className="avatar">MK</div>
        <div className="user-info" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Mustafa Karan</span>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Operatör</span>
        </div>
      </div>
    </aside>
  )
}

export function Topbar({ title, subtitle, actions }) {
  return (
    <header className="topbar">
      <div className="topbar-title" style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        {subtitle && <div className="crumbs">{subtitle}</div>}
        <h1>{title}</h1>
      </div>
      <div className="search">
        <Icon name="search" size={14} />
        <input placeholder="Müşteri, sipariş, bidon ara…" readOnly />
        <kbd>⌘K</kbd>
      </div>
      {actions && <div className="topbar-actions">{actions}</div>}
    </header>
  )
}

export function MobileBottomNav({ active, onNav, onOpenMenu }) {
  const items = [
    { id: 'dashboard', label: 'Panel', icon: 'dashboard' },
    { id: 'aktif', label: 'Aktif', icon: 'list' },
    { id: 'yeni-islem', label: 'Yeni', icon: 'plus', fab: true },
    { id: 'musteri', label: 'Müşteri', icon: 'users' },
    { id: '_menu', label: 'Daha', icon: 'settings' },
  ]
  return (
    <nav className="mobile-bottom-nav">
      {items.map(it => (
        <button
          key={it.id}
          className={`mnav-item ${active === it.id ? 'active' : ''} ${it.fab ? 'fab' : ''}`}
          onClick={() => it.id === '_menu' ? onOpenMenu() : onNav(it.id)}
        >
          <Icon name={it.icon} size={it.fab ? 22 : 20} />
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  )
}

export function MobileDrawer({ open, active, onNav, onClose }) {
  return (
    <>
      <div className="drawer-back" onClick={onClose} style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}></div>
      <aside className="mobile-drawer" style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}>
        <div className="brand" style={{ padding: '0 12px 16px', borderBottom: '1px solid var(--line)', marginBottom: 12 }}>
          <div className="brand-mark">Z</div>
          <div className="brand-text">
            <strong>Zala Hatun</strong>
            <span>Yağ Takip Paneli</span>
          </div>
        </div>
        <nav className="nav">
          {NAV_GROUPS.map(g => (
            <div key={g.id} className="nav-group">
              <div className="nav-label">{g.label}</div>
              {NAV_ITEMS.filter(i => i.group === g.id).map(item => (
                <button
                  key={item.id}
                  className={`nav-item ${active === item.id ? 'active' : ''}`}
                  onClick={() => { onNav(item.id); onClose() }}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}

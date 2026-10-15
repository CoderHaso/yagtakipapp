import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'

// ─────────────────────────────────────────────────────────────
// SAĞA GÖMÜLÜ NUMARATÖR
// Sayı / telefon / kimlik no girilen her input'a (inputMode numeric|decimal|tel,
// type tel|number) dokunulunca sağ kenarda büyük tuşlu panel açılır; sistem
// klavyesi çıkmaz. Yazı alanlarında normal klavye açılır. Genişlik < 700px ise
// (telefon) devreye girmez.
// ─────────────────────────────────────────────────────────────

var MODLAR = ['numeric', 'decimal', 'tel']
var DEGER = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set

function dockAktif() { return typeof window !== 'undefined' && window.innerWidth >= 700 }

function modOf(n) {
  if (!n || n.tagName !== 'INPUT' || n.readOnly || n.disabled) return ''
  if (n.dataset.np) return n.dataset.np
  var im = n.getAttribute('inputmode')
  if (MODLAR.indexOf(im) !== -1) return im
  if (n.type === 'tel') return 'tel'
  if (n.type === 'number') return 'decimal'
  return ''
}

function etiketOf(n) {
  var row = n.closest('.fab-row')
  var l = row && row.querySelector('label')
  return (l && l.textContent) || n.getAttribute('placeholder') || n.getAttribute('aria-label') || ''
}

export default function NumpadDock() {
  var [el, setEl] = useState(null)
  var [val, setVal] = useState('')
  var [etiket, setEtiket] = useState('')
  var taze = useRef(false)          // ilk tuş mevcut değeri değiştirir
  var dockRef = useRef(null)

  useEffect(function () {
    function sistemKlavyesiniKapat(n) {
      var m = modOf(n)
      if (!m || !dockAktif()) return ''
      if (!n.dataset.np) n.dataset.np = m
      n.setAttribute('inputmode', 'none')
      return m
    }
    function down(e) { if (e.target && e.target.tagName === 'INPUT') sistemKlavyesiniKapat(e.target) }
    function focusIn(e) {
      var n = e.target
      if (dockRef.current && dockRef.current.contains(n)) return
      if (n && n.tagName === 'INPUT' && sistemKlavyesiniKapat(n)) {
        taze.current = true
        setEl(n); setVal(n.value); setEtiket(etiketOf(n))
        setTimeout(function () { try { n.scrollIntoView({ block: 'center', behavior: 'smooth' }) } catch (x) { /* yok say */ } }, 120)
      } else setEl(null)
    }
    function focusOut(e) {
      // dock tuşları odağı çalmaz (onPointerDown preventDefault); başka yere dokunulunca kapan
      if (!e.relatedTarget) setTimeout(function () { if (!document.activeElement || document.activeElement === document.body) setEl(null) }, 0)
    }
    function input(e) { setEl(function (cur) { if (cur === e.target) setVal(e.target.value); return cur }) }
    document.addEventListener('pointerdown', down, true)
    document.addEventListener('focusin', focusIn)
    document.addEventListener('focusout', focusOut)
    document.addEventListener('input', input)
    return function () {
      document.removeEventListener('pointerdown', down, true)
      document.removeEventListener('focusin', focusIn)
      document.removeEventListener('focusout', focusOut)
      document.removeEventListener('input', input)
    }
  }, [])

  useEffect(function () {
    document.body.classList.toggle('np-acik', !!el)
    return function () { document.body.classList.remove('np-acik') }
  }, [el])

  // Odaktaki input ekrandan kalkarsa (sheet kapandı) paneli kapat
  useEffect(function () {
    if (!el) return
    var t = setInterval(function () { if (!document.body.contains(el)) setEl(null) }, 400)
    return function () { clearInterval(t) }
  }, [el])

  if (!el) return null
  var mod = modOf(el) || el.dataset.np

  function yaz(next) {
    DEGER.call(el, next)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    setVal(next)
  }
  function bas(k) {
    var cur = taze.current && k !== 'del' ? '' : el.value
    if (k === 'del') { yaz(taze.current ? '' : cur.slice(0, -1)); taze.current = false; return }
    if (k === ',') {
      if (mod !== 'decimal' || cur.indexOf('.') !== -1) return
      cur = (cur || '0') + '.'
    } else {
      var max = el.maxLength > 0 ? el.maxLength : 12
      if (cur.length >= max) return
      cur = cur === '0' ? k : cur + k
    }
    taze.current = false
    yaz(cur)
  }
  function sonraki() {
    var liste = Array.prototype.slice.call(document.querySelectorAll('input')).filter(function (n) {
      return n.offsetParent && !n.disabled && !n.readOnly && (modOf(n) || n.type === 'text' || n.type === 'email')
    })
    var i = liste.indexOf(el)
    var n = liste[i + 1]
    if (n) n.focus(); else { el.blur(); setEl(null) }
  }

  var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del']
  return (
    <aside className="np-dock" ref={dockRef} onPointerDown={function (e) { e.preventDefault() }}>
      <div className="np-dock-ust">
        <span>{etiket || 'Sayı gir'}</span>
        <b>{val || '—'}</b>
      </div>
      <div className="np np-dock-tuslar">
        {keys.map(function (k) {
          var cls = 'np-key' + (k === 'del' ? ' del' : '') + (k === ',' && mod !== 'decimal' ? ' off' : '')
          return (
            <button key={k} type="button" className={cls} onClick={function () { bas(k) }}>
              {k === 'del' ? <Icon name="backspace" size={28} /> : k}
            </button>
          )
        })}
      </div>
      <div className="np-dock-alt">
        <button type="button" className="fab-btn" onClick={function () { yaz(''); taze.current = false }}>Temizle</button>
        <button type="button" className="fab-btn" onClick={sonraki}>Sonraki</button>
        <button type="button" className="fab-btn primary" onClick={function () { el.blur(); setEl(null) }}><Icon name="check" size={20} /> Bitti</button>
      </div>
    </aside>
  )
}

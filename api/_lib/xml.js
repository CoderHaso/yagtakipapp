// Küçük XML yardımcıları — bağımlılık eklememek için elle yazıldı.
// Uyumsoft yanıtları düz SOAP 1.1; DTD / namespace çözümü gerekmiyor,
// etiketler yerel adlarıyla (önek atılarak) okunur.

export function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

var ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
function unesc(s) {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|\w+);/g, function (m, e) {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
    return ENT[e] != null ? ENT[e] : m
  })
}
function local(name) { var i = name.indexOf(':'); return i === -1 ? name : name.slice(i + 1) }

// → { name, attrs, children, text }
export function parseXml(src) {
  var root = { name: '#root', attrs: {}, children: [], text: '' }
  var stack = [root]
  var re = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/([^\s>]+)\s*>|<([^\s/>]+)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g
  var m
  while ((m = re.exec(src))) {
    var top = stack[stack.length - 1]
    if (m[1] != null) { top.text += m[1]; continue }
    if (m[2]) { if (stack.length > 1) stack.pop(); continue }
    if (m[3]) {
      var node = { name: local(m[3]), attrs: {}, children: [], text: '' }
      var ar = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g, a
      while ((a = ar.exec(m[4] || ''))) {
        if (a[1].indexOf('xmlns') === 0) continue
        node.attrs[local(a[1])] = unesc(a[2] != null ? a[2] : a[3])
      }
      top.children.push(node)
      if (!m[5]) stack.push(node)
      continue
    }
    if (m[6] != null) top.text += unesc(m[6])
  }
  return root
}

export function find(node, name) {
  if (!node) return null
  for (var i = 0; i < node.children.length; i++) {
    var c = node.children[i]
    if (c.name === name) return c
    var r = find(c, name)
    if (r) return r
  }
  return null
}

export function kids(node, name) {
  return node ? node.children.filter(function (c) { return c.name === name }) : []
}

export function childText(node, name) {
  var c = node ? node.children.find(function (x) { return x.name === name }) : null
  return c ? c.text.trim() : ''
}

// Düz bir elemanı { alan: değer } nesnesine çevirir (öznitelik + basit çocuklar)
export function flat(node) {
  if (!node) return null
  var o = Object.assign({}, node.attrs)
  node.children.forEach(function (c) {
    if (c.children.length === 0) {
      if (c.attrs.nil === 'true') o[c.name] = null
      else o[c.name] = c.text.trim()
    }
  })
  return o
}

export const fmt = {
  kg: (n, unit = 'kg') =>
    n == null ? '—' : `${Number(n).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ${unit}`,
  num: (n, d = 1) =>
    n == null ? '—' : Number(n).toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d }),
  int: (n) =>
    n == null ? '—' : Number(n).toLocaleString('tr-TR'),
  pct: (n) =>
    n == null ? '—' : `% ${Number(n).toFixed(1)}`,
  money: (n, curr = '₺') =>
    n == null ? '—' : `${curr}${Number(n).toLocaleString('tr-TR')}`,
  date: (d) =>
    d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
  dateShort: (d) =>
    d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) : '—',
}

export const initialsOf = (name) =>
  name ? name.split(' ').slice(0, 2).map(s => s[0]).join('').toUpperCase() : '??'

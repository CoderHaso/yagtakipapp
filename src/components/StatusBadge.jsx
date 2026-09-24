const STATUS_MAP = {
  tamamlandi: { cls: 'good', txt: 'Tamamlandı' },
  preste: { cls: 'accent', txt: 'Preste' },
  yikamada: { cls: 'warn', txt: 'Yıkamada' },
  kuyrukta: { cls: 'bad', txt: 'Kuyrukta' },
  aktif: { cls: 'good', txt: 'Aktif' },
  pasif: { cls: '', txt: 'Pasif' },
  dolu: { cls: 'good', txt: 'Dolu' },
  yarim: { cls: 'warn', txt: 'Yarım' },
  bos: { cls: '', txt: 'Boş' },
  'emanet-birak': { cls: 'accent', txt: 'Emanet bırakma' },
  'emanet-cek': { cls: 'accent-2', txt: 'Emanet çekme' },
  alis: { cls: 'accent', txt: 'Alış' },
  satis: { cls: 'accent-2', txt: 'Satış' },
  iade: { cls: 'warn', txt: 'İade' },
  sikim: { cls: 'accent', txt: 'Sıkım' },
}

export default function StatusBadge({ status }) {
  const m = STATUS_MAP[status] || { cls: '', txt: status }
  return (
    <span className={`badge ${m.cls}`}>
      <span className="dot"></span>{m.txt}
    </span>
  )
}

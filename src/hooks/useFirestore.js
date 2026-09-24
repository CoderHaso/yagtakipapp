import { useState, useEffect } from 'react'
import { subscribeCollection } from '../lib/firestore'

export function useCollection(colName) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const unsub = subscribeCollection(colName, (items) => {
      setData(items)
      setLoading(false)
    }, (err) => {
      console.error(`Firestore ${colName} error:`, err)
      setError(err)
      setLoading(false)
    })
    return unsub
  }, [colName])

  return { data, loading, error }
}

export function useMusteriler() {
  return useCollection('musteriler')
}

export function useSiparisler() {
  return useCollection('siparisler')
}

export function useHareketler() {
  return useCollection('hareketler')
}

export function useBidonlar() {
  return useCollection('bidonlar')
}

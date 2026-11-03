import { useEffect, useState } from 'react'
import { reverseGeocode } from '../api'

export function useReverseGeocode(lat, lon, enabled = true) {
  const [name, setName] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled || lat == null || lon == null) {
      setName(null)
      return
    }
    let cancelled = false
    setLoading(true)
    reverseGeocode(Number(lat), Number(lon)).then((n) => {
      if (!cancelled) {
        setName(n)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [lat, lon, enabled])

  return { name, loading }
}

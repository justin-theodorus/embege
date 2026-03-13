import { useState, useEffect, useCallback } from 'react'
import { fetchAllPantryItems, fetchExpiringItems } from '../api/elastic'

export function usePantryData () {
  const [allItems, setAllItems] = useState([])
  const [expiringItems, setExpiringItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [all, expiring] = await Promise.all([
        fetchAllPantryItems(),
        fetchExpiringItems(3),
      ])
      setAllItems(all)
      setExpiringItems(expiring)
    } catch (err) {
      console.error('usePantryData error:', err)
      setError('Failed to load pantry data.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { allItems, expiringItems, isLoading, error, refetch: load }
}

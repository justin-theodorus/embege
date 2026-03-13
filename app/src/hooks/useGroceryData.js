import { useState, useEffect, useCallback } from 'react'
import { fetchGroceryList, markGroceryBought } from '../api/elastic'

export function useGroceryData () {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchGroceryList()
      setItems(data)
    } catch (err) {
      console.error('useGroceryData error:', err)
      setError('Failed to load grocery list.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const markBought = useCallback(async (itemId, boughtBy = 'Bach Lil') => {
    try {
      await markGroceryBought(itemId, boughtBy)
      setItems(prev =>
        prev.map(item =>
          item.id === itemId || item._id === itemId
            ? { ...item, status: 'bought', bought_by: boughtBy }
            : item
        )
      )
    } catch (err) {
      console.error('markBought error:', err)
      throw err
    }
  }, [])

  return { items, isLoading, error, refetch: load, markBought }
}

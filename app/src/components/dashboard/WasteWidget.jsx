import { useState, useEffect } from 'react'
import { fetchWasteStats } from '../../api/elastic'

export function WasteWidget () {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchWasteStats()
      .then(setStats)
      .catch(err => console.error('WasteWidget:', err))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="bg-brand-card border border-brand-border rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-brand-border rounded w-1/2 mb-3" />
        <div className="h-8 bg-brand-border rounded w-3/4" />
      </div>
    )
  }

  const totalWasted = stats?.totalWasted?.toFixed(2) ?? '0.00'
  const preventable = stats?.preventable?.toFixed(2) ?? '0.00'

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-brand-cream font-semibold text-sm">Food Waste This Month</h2>
        <span className="text-brand-muted text-xs">Feb–Mar 2026</span>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-red-400">${totalWasted}</span>
        <span className="text-brand-muted text-sm mb-1">SGD lost</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs">
          <span className="text-brand-muted">Preventable</span>
          <span className="text-orange-400 font-medium">${preventable} could've been saved</span>
        </div>
        <div className="w-full bg-brand-bg rounded-full h-1.5">
          <div
            className="bg-orange-500 h-1.5 rounded-full transition-all"
            style={{ width: stats?.totalWasted > 0 ? `${Math.min(100, (stats.preventable / stats.totalWasted) * 100)}%` : '0%' }}
          />
        </div>
      </div>

      <p className="text-brand-muted text-xs">
        Gibrain helps prevent waste by recommending recipes for expiring items before they're lost.
      </p>
    </div>
  )
}

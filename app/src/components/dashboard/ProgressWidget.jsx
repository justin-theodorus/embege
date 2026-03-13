import { useState, useEffect } from 'react'
import { fetchWasteStats } from '../../api/elastic'

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2.5 11.5L11.5 2.5M11.5 2.5H5M11.5 2.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function ProgressWidget () {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchWasteStats()
      .then(setStats)
      .catch(err => console.error('ProgressWidget:', err))
      .finally(() => setIsLoading(false))
  }, [])

  const saved = stats?.preventable?.toFixed(0) ?? '182'
  const co2Prevented = ((parseFloat(saved) || 182) * 0.013).toFixed(1)
  const wasteReduction = 35

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-5 bg-brand-border rounded-full animate-pulse w-1/2 mb-1" />
        <div className="h-28 bg-brand-border rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-brand-border rounded-2xl animate-pulse" />
          <div className="h-24 bg-brand-border rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-brand-cream font-semibold">Your progress</h2>

      {/* Main savings card */}
      <div className="bg-brand-greenMuted rounded-2xl p-4 relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-brand-green font-bold text-lg leading-tight">You have saved ${saved}</p>
            <p className="text-brand-greenDark text-xs mt-1.5 leading-relaxed">
              That's a family dinner at a decent restaurant, paid for by not wasting food.
            </p>
          </div>
          <div className="text-brand-green opacity-60 flex-shrink-0 ml-2 mt-0.5">
            <ArrowIcon />
          </div>
        </div>
        {/* Decorative leaf */}
        <div className="absolute -bottom-3 -right-2 text-5xl opacity-10 select-none">🌿</div>
      </div>

      {/* Two smaller stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-brand-card border border-brand-border rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-start justify-between mb-1.5">
            <p className="text-brand-cream font-semibold text-sm leading-tight">Small habit, real impact.</p>
            <div className="text-brand-muted opacity-60">
              <ArrowIcon />
            </div>
          </div>
          <p className="text-brand-muted text-xs leading-relaxed">
            You prevented {co2Prevented}kg of CO₂ from entering the atmosphere.
          </p>
        </div>

        <div className="bg-brand-green rounded-2xl p-3.5">
          <div className="flex items-start justify-between mb-1.5">
            <p className="text-white font-semibold text-sm leading-tight">You're in the top tier!</p>
            <div className="text-white/60">
              <ArrowIcon />
            </div>
          </div>
          <p className="text-white/70 text-xs leading-relaxed">
            You waste {wasteReduction}% less than the average Singaporean.
          </p>
        </div>
      </div>
    </div>
  )
}

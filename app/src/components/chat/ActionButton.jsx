import { useState } from 'react'
import { addToGroceryList, removeFromPantry, logWaste, markGroceryBought } from '../../api/elastic'
import { invalidateBriefingCache } from '../../hooks/useBriefing'

const ACTION_CONFIG = {
  add_grocery: { icon: '➕', label: 'Add to grocery list', style: 'bg-brand-greenMuted text-brand-greenDark border-brand-green/40 hover:bg-brand-green hover:text-white' },
  remove_pantry: { icon: '✅', label: 'Mark as used', style: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600' },
  log_waste: { icon: '🗑️', label: 'Log as wasted', style: 'bg-expiry-todayBg text-red-600 border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500' },
  mark_bought: { icon: '📝', label: 'Mark as bought', style: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600' },
}

export function ActionButton ({ action, onComplete }) {
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const config = ACTION_CONFIG[action.type] || ACTION_CONFIG.add_grocery

  const handleClick = async () => {
    if (status !== 'idle') return
    setStatus('loading')
    try {
      switch (action.type) {
        case 'add_grocery':
          await addToGroceryList(action.item)
          invalidateBriefingCache()
          onComplete?.(`Added ${action.item?.name ?? 'item'} to grocery list`)
          break
        case 'remove_pantry':
          await removeFromPantry(action.itemId)
          invalidateBriefingCache()
          onComplete?.(`Removed ${action.itemName ?? 'item'} from pantry`)
          break
        case 'log_waste':
          await logWaste(action.item)
          invalidateBriefingCache()
          onComplete?.(`Logged ${action.item?.name ?? 'item'} as wasted`)
          break
        case 'mark_bought':
          await markGroceryBought(action.itemId, action.boughtBy ?? 'Bach Lil')
          invalidateBriefingCache()
          onComplete?.(`Marked as bought by ${action.boughtBy ?? 'Bach Lil'}`)
          break
      }
      setStatus('done')
    } catch (err) {
      console.error('ActionButton error:', err)
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-greenMuted text-brand-green border border-brand-green/30 opacity-80">
        ✓ Done
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === 'loading'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${config.style} ${
        status === 'loading' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <span>{status === 'loading' ? '⏳' : config.icon}</span>
      <span>{action.label ?? config.label}</span>
    </button>
  )
}

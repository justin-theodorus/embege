import { useGroceryData } from '../../hooks/useGroceryData'
import { Link } from 'react-router-dom'

export function GrocerySummary () {
  const { items, isLoading } = useGroceryData()
  const preview = items.slice(0, 8)

  const lowStock = items.filter(i => i.status === 'low_stock')
  const subtitle = lowStock.length > 0
    ? `You're running low on ${lowStock[0].item_name}!`
    : 'Your grocery list'

  if (isLoading) {
    return (
      <div className="bg-brand-card border border-brand-border rounded-2xl p-5 animate-pulse shadow-sm">
        <div className="h-4 bg-brand-bg rounded-full w-1/2 mb-1" />
        <div className="h-3 bg-brand-bg rounded-full w-2/3 mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-7 bg-brand-bg rounded-xl mb-2" />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
      {/* Header */}
      <div>
        <h2 className="text-brand-cream font-semibold">Smart Grocery</h2>
        {lowStock.length > 0 && (
          <p className="text-brand-muted text-xs mt-0.5">{subtitle}</p>
        )}
      </div>

      {preview.length === 0 ? (
        <p className="text-brand-muted text-sm">Your grocery list is empty.</p>
      ) : (
        <ul className="flex flex-col gap-0">
          {preview.map((item, i) => {
            const isBought = item.status === 'bought'
            const isLow = item.status === 'low_stock'
            const isPending = item.status === 'pending'

            return (
              <li key={item.id ?? i} className="flex items-center justify-between gap-3 py-2 border-b border-brand-border/60 last:border-0">
                {/* Circle indicator */}
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isBought ? 'bg-brand-green border-brand-green' : 'border-brand-border'
                }`}>
                  {isBought && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Item name */}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm capitalize ${isBought ? 'line-through text-brand-muted' : 'text-brand-cream'}`}>
                    {item.item_name}
                  </span>
                  {item.added_by && (
                    <span className="text-brand-subtle text-xs ml-1.5">by {item.added_by}</span>
                  )}
                </div>

                {/* Status badge */}
                {isLow && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cream text-white font-medium flex-shrink-0">
                    Low stock
                  </span>
                )}
                {isBought && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-greenMuted text-brand-green font-medium flex-shrink-0">
                    Bought
                  </span>
                )}
                {isPending && item.days_until_needed && (
                  <span className="text-xs text-brand-muted flex-shrink-0">
                    {item.days_until_needed}d left
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Link
        to="/groceries"
        className="text-brand-muted text-xs hover:text-brand-green transition-colors flex items-center gap-1 mt-auto"
      >
        See all list
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  )
}

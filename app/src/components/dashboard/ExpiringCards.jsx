import { ActionButton } from '../chat/ActionButton'

const FOOD_EMOJIS = {
  protein: '🥩',
  vegetables: '🥬',
  dairy: '🥛',
  fruits: '🍎',
  carbs: '🍞',
  condiments: '🫙',
  pantry_staple: '🧂',
}

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function ExpiryBadge ({ daysUntilExpiry }) {
  if (daysUntilExpiry <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-green text-white">
        <CheckIcon />
        Expires Today
      </span>
    )
  }
  if (daysUntilExpiry === 1) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-greenMuted text-brand-green border border-brand-green/30">
        Tomorrow
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-greenMuted text-brand-green border border-brand-green/30">
      {daysUntilExpiry} days left
    </span>
  )
}

function ExpiryCard ({ item, onAction }) {
  const emoji = FOOD_EMOJIS[item.category] || '🍽️'

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4 flex-shrink-0 w-[180px] flex flex-col gap-3 shadow-sm">
      {/* Food emoji */}
      <div className="w-full h-20 bg-brand-bg rounded-xl flex items-center justify-center text-4xl">
        {emoji}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-1">
          <h3 className="text-brand-cream font-semibold text-sm capitalize leading-tight">{item.name}</h3>
          <button
            onClick={() => onAction({ type: 'log_waste', item: { name: item.name, category: item.category, quantity: item.quantity, unit: item.unit, price_sgd: item.price_sgd }, itemId: item.id })}
            className="text-brand-subtle hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
            title="Log as wasted"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M11 3.5l-.5 8a.5.5 0 01-.5.5H4a.5.5 0 01-.5-.5L3 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <ExpiryBadge daysUntilExpiry={item.days_until_expiry} />

        <p className="text-brand-muted text-xs">{item.quantity} {item.unit} left</p>
      </div>

      <ActionButton
        action={{
          type: 'remove_pantry',
          itemId: item.id,
          itemName: item.name,
          label: 'Mark as used',
        }}
        onComplete={() => {}}
      />
    </div>
  )
}

export function ExpiringCards ({ items, onAction }) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center shadow-sm">
        <p className="text-brand-muted text-sm">🎉 No items expiring soon!</p>
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
      {items.map((item, i) => (
        <ExpiryCard key={item.id ?? i} item={item} onAction={onAction ?? (() => {})} />
      ))}
      {/* See all card */}
      <div className="bg-brand-card border border-brand-border rounded-2xl flex-shrink-0 w-[120px] flex items-center justify-center shadow-sm">
        <button className="flex flex-col items-center gap-2 text-brand-muted hover:text-brand-green transition-colors p-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs font-medium">See all</span>
        </button>
      </div>
    </div>
  )
}

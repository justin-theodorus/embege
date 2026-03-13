import { useState } from 'react'
import { usePantryData } from '../../hooks/usePantryData'
import { AddItemModal } from './AddItemModal'

const FOOD_EMOJIS = {
  protein: '🥩', vegetables: '🥬', dairy: '🥛', fruits: '🍎',
  carbs: '🍞', condiments: '🫙', pantry_staple: '🧂',
}

const CATEGORIES = ['all', 'protein', 'vegetables', 'dairy', 'carbs', 'fruits', 'condiments', 'pantry_staple']
const STORAGES = ['all', 'fridge', 'freezer', 'pantry']

function ExpiryBadge ({ daysUntilExpiry }) {
  if (daysUntilExpiry <= 0) {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-expiry-todayBg text-red-600 border border-red-200">Expires Today</span>
  }
  if (daysUntilExpiry <= 1) {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-expiry-soonBg text-amber-600 border border-amber-200">Tomorrow</span>
  }
  if (daysUntilExpiry <= 3) {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-expiry-soonBg text-amber-600 border border-amber-200">{daysUntilExpiry} days</span>
  }
  return <span className="text-xs px-2 py-0.5 rounded-full bg-expiry-freshBg text-brand-green border border-brand-green/30">{daysUntilExpiry} days</span>
}

function ExpiringCard ({ item }) {
  const emoji = FOOD_EMOJIS[item.category] || '🍽️'
  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex-shrink-0 w-[200px]">
      <div className="w-full h-24 bg-brand-bg rounded-lg flex items-center justify-center text-4xl mb-3">{emoji}</div>
      <h3 className="text-brand-cream font-semibold text-sm capitalize mb-1">{item.name}</h3>
      <p className="text-brand-muted text-xs mb-2">{item.quantity} {item.unit}</p>
      <ExpiryBadge daysUntilExpiry={item.days_until_expiry} />
    </div>
  )
}

function InventoryRow ({ item }) {
  const emoji = FOOD_EMOJIS[item.category] || '🍽️'
  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex items-center gap-4">
      <div className="w-12 h-12 bg-brand-bg rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-brand-cream font-semibold text-sm capitalize">{item.name}</h3>
        <p className="text-brand-muted text-xs mt-0.5">{item.category} · {item.storage}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-brand-cream text-sm">{item.quantity} {item.unit}</p>
        <p className="text-brand-muted text-xs">${item.price_sgd?.toFixed(2)} SGD</p>
      </div>
      <div className="flex-shrink-0">
        <ExpiryBadge daysUntilExpiry={item.days_until_expiry} />
      </div>
    </div>
  )
}

export function InventoryPage () {
  const { allItems, expiringItems, isLoading, error, refetch } = usePantryData()
  const [showModal, setShowModal] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [storageFilter, setStorageFilter] = useState('all')
  const [search, setSearch] = useState('')

  const otherItems = allItems.filter(item => item.days_until_expiry > 3)

  const filteredOther = otherItems.filter(item => {
    const matchCat = categoryFilter === 'all' || item.category === categoryFilter
    const matchStorage = storageFilter === 'all' || item.storage === storageFilter
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchStorage && matchSearch
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-cream">Pantry Inventory</h1>
          <p className="text-brand-muted text-sm mt-1">{allItems.length} items tracked</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-green hover:bg-brand-greenLight text-white rounded-xl text-sm font-medium transition-colors"
        >
          <span>+</span>
          <span>Add Item</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-expiry-todayBg border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-brand-card border border-brand-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Expiring Soon section */}
          {expiringItems.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-brand-cream font-semibold">Expiring Soon</h2>
                <span className="text-xs bg-expiry-todayBg text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                  {expiringItems.length}
                </span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {expiringItems.map((item, i) => (
                  <ExpiringCard key={item.id ?? i} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* Filters */}
          <section>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h2 className="text-brand-cream font-semibold">Other Inventories</h2>
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="ml-auto bg-brand-bg border border-brand-border rounded-lg px-3 py-1.5 text-sm text-brand-cream placeholder-brand-muted focus:outline-none focus:border-brand-green w-48"
              />
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mb-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                    categoryFilter === cat
                      ? 'bg-brand-greenMuted text-brand-greenLight border-brand-green'
                      : 'bg-brand-bg text-brand-muted border-brand-border hover:text-brand-cream'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Storage filter */}
            <div className="flex gap-2 mb-5">
              {STORAGES.map(s => (
                <button
                  key={s}
                  onClick={() => setStorageFilter(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                    storageFilter === s
                      ? 'bg-brand-greenMuted text-brand-greenLight border-brand-green'
                      : 'bg-brand-bg text-brand-muted border-brand-border hover:text-brand-cream'
                  }`}
                >
                  {s === 'all' ? '🏠 All' : s === 'fridge' ? '❄️ Fridge' : s === 'freezer' ? '🧊 Freezer' : '🥫 Pantry'}
                </button>
              ))}
            </div>

            {/* Items list */}
            {filteredOther.length === 0 ? (
              <div className="text-center py-12 text-brand-muted text-sm">
                {search ? 'No items match your search.' : 'No items in this category.'}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredOther.map((item, i) => (
                  <InventoryRow key={item.id ?? i} item={item} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {showModal && (
        <AddItemModal
          onClose={() => setShowModal(false)}
          onAdded={() => { setShowModal(false); refetch() }}
        />
      )}
    </div>
  )
}

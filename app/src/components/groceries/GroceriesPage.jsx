import { useState } from 'react'
import { useGroceryData } from '../../hooks/useGroceryData'
import { addToGroceryList } from '../../api/elastic'
import { invalidateBriefingCache } from '../../hooks/useBriefing'

const STATUS_CONFIG = {
  pending: { label: 'Pending', style: 'bg-brand-bg text-brand-muted border-brand-border' },
  low_stock: { label: 'Low stock', style: 'bg-expiry-soonBg text-amber-600 border-amber-200' },
  bought: { label: 'Bought ✓', style: 'bg-brand-greenMuted text-brand-green border-brand-green/30' },
}

const PRIORITY_CONFIG = {
  high: { label: 'High', style: 'text-red-500' },
  medium: { label: 'Medium', style: 'text-amber-600' },
  low: { label: 'Low', style: 'text-brand-muted' },
}

function GroceryItem ({ item, onMarkBought }) {
  const [marking, setMarking] = useState(false)
  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending
  const priorityConfig = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium
  const isBought = item.status === 'bought'

  const handleMark = async () => {
    if (isBought) return
    setMarking(true)
    try {
      await onMarkBought(item.id || item._id)
    } catch (err) {
      console.error(err)
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className={`bg-brand-card border border-brand-border rounded-xl px-5 py-4 flex items-center gap-4 ${isBought ? 'opacity-60' : ''}`}>
      {/* Checkbox-style indicator */}
      <button
        onClick={handleMark}
        disabled={isBought || marking}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          isBought
            ? 'border-brand-green bg-brand-green'
            : 'border-brand-border hover:border-brand-green'
        }`}
      >
        {isBought && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Item details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-brand-cream text-sm font-medium capitalize ${isBought ? 'line-through text-brand-muted' : ''}`}>
            {item.item_name}
          </span>
          <span className={`text-xs font-medium ${priorityConfig.style}`}>
            {priorityConfig.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-brand-muted text-xs">{item.quantity} {item.unit}</span>
          {item.added_by && (
            <span className="text-brand-muted text-xs">Added by {item.added_by}</span>
          )}
          {item.bought_by && (
            <span className="text-brand-greenLight text-xs">Bought by {item.bought_by}</span>
          )}
          {item.notes && (
            <span className="text-brand-muted text-xs italic">{item.notes}</span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span className={`text-xs px-2.5 py-1 rounded-full border flex-shrink-0 ${statusConfig.style}`}>
        {statusConfig.label}
      </span>

      {/* Mark as bought */}
      {!isBought && (
        <button
          onClick={handleMark}
          disabled={marking}
          className="flex-shrink-0 text-xs px-3 py-1.5 bg-brand-greenMuted hover:bg-brand-green text-brand-greenLight hover:text-white border border-brand-green rounded-lg transition-colors"
        >
          {marking ? '...' : '📝 Mark Bought'}
        </button>
      )}
    </div>
  )
}

export function GroceriesPage () {
  const { items, isLoading, error, refetch, markBought } = useGroceryData()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit: 'pieces', priority: 'medium', notes: '' })
  const [adding, setAdding] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = statusFilter === 'all' ? items : items.filter(i => i.status === statusFilter)
  const pendingCount = items.filter(i => i.status !== 'bought').length
  const boughtCount = items.filter(i => i.status === 'bought').length

  const handleAddItem = async (e) => {
    e.preventDefault()
    if (!newItem.name) return
    setAdding(true)
    try {
      await addToGroceryList({ ...newItem, name: newItem.name })
      invalidateBriefingCache()
      setNewItem({ name: '', quantity: 1, unit: 'pieces', priority: 'medium', notes: '' })
      setShowAddForm(false)
      refetch()
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-cream">Grocery List</h1>
          <p className="text-brand-muted text-sm mt-1">
            {pendingCount} pending · {boughtCount} bought · Shared with Wowo's Household
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(prev => !prev)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-green hover:bg-brand-greenLight text-white rounded-xl text-sm font-medium transition-colors"
        >
          <span>{showAddForm ? '×' : '+'}</span>
          <span>{showAddForm ? 'Cancel' : 'Add Item'}</span>
        </button>
      </div>

      {/* Add item form */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="bg-brand-card border border-brand-border rounded-xl p-5 mb-5 flex flex-col gap-3">
          <h3 className="text-brand-cream font-semibold text-sm">New Grocery Item</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Item name *"
              value={newItem.name}
              onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
              className="col-span-2 bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-cream placeholder-brand-muted focus:outline-none focus:border-brand-green"
            />
            <input
              type="number"
              placeholder="Qty"
              value={newItem.quantity}
              min="1"
              onChange={e => setNewItem(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
              className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-cream focus:outline-none focus:border-brand-green"
            />
            <select
              value={newItem.priority}
              onChange={e => setNewItem(p => ({ ...p, priority: e.target.value }))}
              className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-cream focus:outline-none focus:border-brand-green"
            >
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <input
              type="text"
              placeholder="Notes (optional)"
              value={newItem.notes}
              onChange={e => setNewItem(p => ({ ...p, notes: e.target.value }))}
              className="col-span-2 bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-cream placeholder-brand-muted focus:outline-none focus:border-brand-green"
            />
          </div>
          <button
            type="submit"
            disabled={!newItem.name || adding}
            className="px-4 py-2.5 bg-brand-green hover:bg-brand-greenLight disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {adding ? 'Adding...' : 'Add to List'}
          </button>
        </form>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 bg-expiry-todayBg border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'low_stock', 'bought'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
              statusFilter === s
                ? 'bg-brand-greenMuted text-brand-greenLight border-brand-green'
                : 'bg-brand-bg text-brand-muted border-brand-border hover:text-brand-cream'
            }`}
          >
            {s === 'all' ? 'All' : s === 'low_stock' ? 'Low Stock' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-brand-card border border-brand-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-brand-muted text-sm">
          {statusFilter === 'all' ? 'Your grocery list is empty.' : `No ${statusFilter} items.`}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item, i) => (
            <GroceryItem
              key={item.id ?? item._id ?? i}
              item={item}
              onMarkBought={markBought}
            />
          ))}
        </div>
      )}
    </div>
  )
}

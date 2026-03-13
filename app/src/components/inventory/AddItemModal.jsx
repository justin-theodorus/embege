import { useState } from 'react'
import { addPantryItem } from '../../api/elastic'
import { invalidateBriefingCache } from '../../hooks/useBriefing'

const CATEGORIES = ['protein', 'vegetables', 'dairy', 'carbs', 'fruits', 'condiments', 'pantry_staple']
const STORAGES = ['fridge', 'freezer', 'pantry']
const UNITS = ['g', 'kg', 'ml', 'L', 'pieces', 'pack', 'bottle', 'can', 'bunch']

export function AddItemModal ({ onClose, onAdded }) {
  const [form, setForm] = useState({
    name: '',
    category: 'vegetables',
    quantity: '',
    unit: 'g',
    purchase_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    storage: 'fridge',
    price_sgd: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.expiry_date || !form.quantity) {
      setError('Name, quantity, and expiry date are required.')
      return
    }
    setIsSubmitting(true)
    setError(null)

    const today = new Date()
    const expiry = new Date(form.expiry_date)
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

    const item = {
      id: `P-${Date.now()}`,
      name: form.name.toLowerCase().trim(),
      category: form.category,
      quantity: parseFloat(form.quantity),
      unit: form.unit,
      purchase_date: form.purchase_date,
      expiry_date: form.expiry_date,
      days_until_expiry: daysUntilExpiry,
      status: daysUntilExpiry <= 0 ? 'expires_today' : daysUntilExpiry <= 2 ? 'expiring_soon' : 'fresh',
      storage: form.storage,
      price_sgd: parseFloat(form.price_sgd) || 0,
    }

    try {
      await addPantryItem(item)
      invalidateBriefingCache()
      onAdded?.(item)
      onClose()
    } catch (err) {
      setError('Failed to add item. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-brand-sidebar border border-brand-border rounded-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-brand-cream font-bold text-base">Add Pantry Item</h2>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-cream transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <p className="text-red-600 text-sm bg-expiry-todayBg border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-brand-muted text-xs font-medium uppercase tracking-wider">Item Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Chicken breast"
              className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-cream placeholder-brand-muted focus:outline-none focus:border-brand-green"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-brand-muted text-xs font-medium uppercase tracking-wider">Category</label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-cream focus:outline-none focus:border-brand-green"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-brand-muted text-xs font-medium uppercase tracking-wider">Storage</label>
              <select
                value={form.storage}
                onChange={e => set('storage', e.target.value)}
                className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-cream focus:outline-none focus:border-brand-green"
              >
                {STORAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-brand-muted text-xs font-medium uppercase tracking-wider">Quantity *</label>
              <input
                type="number"
                value={form.quantity}
                onChange={e => set('quantity', e.target.value)}
                placeholder="200"
                min="0"
                step="any"
                className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-cream placeholder-brand-muted focus:outline-none focus:border-brand-green"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-brand-muted text-xs font-medium uppercase tracking-wider">Unit</label>
              <select
                value={form.unit}
                onChange={e => set('unit', e.target.value)}
                className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-cream focus:outline-none focus:border-brand-green"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-brand-muted text-xs font-medium uppercase tracking-wider">Purchase Date</label>
              <input
                type="date"
                value={form.purchase_date}
                onChange={e => set('purchase_date', e.target.value)}
                className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-cream focus:outline-none focus:border-brand-green"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-brand-muted text-xs font-medium uppercase tracking-wider">Expiry Date *</label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={e => set('expiry_date', e.target.value)}
                className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-cream focus:outline-none focus:border-brand-green"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-brand-muted text-xs font-medium uppercase tracking-wider">Price (SGD)</label>
            <input
              type="number"
              value={form.price_sgd}
              onChange={e => set('price_sgd', e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-cream placeholder-brand-muted focus:outline-none focus:border-brand-green"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-cream transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-brand-green hover:bg-brand-greenLight disabled:opacity-50 text-white font-medium text-sm transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
